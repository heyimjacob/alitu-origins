const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: "Test route is working" });
});

// Scores route
let scores = [];

app.post('/api/scoreboard', (req, res) => {
    const { username, score } = req.body;

    if(!username || !score) {
        return res.status(400).json({ message: 'Username and score required' });
    }

    scores.push({ username, score });
    
    // Sort scores in descending order
    scores.sort((a, b) => b.score - a.score);

    // Limit to top 10 scores for simplicity
    if(scores.length > 10) scores.length = 10;

    res.json({ message: 'Score submitted successfully' });
});

app.get('/api/scoreboard', (req, res) => {
    res.json({ scores });
});

// Serve static files
app.use(express.static('public'));

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

