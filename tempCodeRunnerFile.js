const express = require("express");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "Shreya@16"; 

const app = express();
app.use(express.json());
app.use(express.static("public"));

let users = [];

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.post("/signup", (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    const existingUser = users.find(u => u.email === email || u.username === username);
    if (existingUser) {
        return res.status(400).json({ msg: "User already exists" });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ msg: "Passwords do not match" });
    }

    users.push({
        username,
        email,
        password,
        todos: []
    });

    res.status(201).json({ msg: "You are signed up successfully!" });
});

app.post("/signin", (req, res) => {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.status(401).json({ msg: "Invalid credentials" });
    }

    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: "1h" });

    user.token = token;

    res.status(200).json({ msg: "Signed in successfully", token });
});

function auth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: Token missing or malformed" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.username = decoded.username;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
}

app.get("/profile", auth, (req, res) => {
    const user = users.find(u => u.username === req.username);

    if (!user) {
        return res.status(404).json({ msg: "Profile not found" });
    }

    res.status(200).json({
        username: user.username,
        email: user.email
    });
});

app.get("/todos", auth, (req, res) => {
    const user = users.find(u => u.username === req.username);
    res.status(200).json({ todos: user.todos });
});

app.post("/todos", auth, (req, res) => {
    const user = users.find(u => u.username === req.username);
    const { todoTitle } = req.body;

    if (!todoTitle || !todoTitle.trim()) {
        return res.status(400).json({ msg: "Todo title cannot be empty" });
    }

    const todo = {
        id: Date.now(),
        todoTitle,
        completed: false
    };

    user.todos.push(todo);

    res.status(201).json({ msg: "Todo added!", todo });
});

app.put("/todos/:id/done", auth, (req, res) => {
    const user = users.find(u => u.username === req.username);
    const todo = user.todos.find(t => t.id === Number(req.params.id));

    if (!todo) {
        return res.status(404).json({ msg: "Todo not found" });
    }

    todo.completed = true;

    res.status(200).json({ msg: "Todo marked as done", todo });
});

app.delete("/todos/:id", auth, (req, res) => {
    const user = users.find(u => u.username === req.username);
    const index = user.todos.findIndex(t => t.id === Number(req.params.id));

    if (index === -1) {
        return res.status(404).json({ msg: "Todo not found" });
    }

    user.todos.splice(index, 1);

    res.status(200).json({ msg: "Todo deleted" });
});

app.listen(3000, () => {
    console.log("✅ Server running at http://localhost:3000");
});
