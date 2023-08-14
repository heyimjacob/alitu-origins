const express = require('express');
const router = express.Router();

// This is just an in-memory store for scores for demonstration purposes.
let scores = [];

router.post('/api/scoreboard', (req, res) => {
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

router.get('/api/scoreboard', (req, res) => {
  console.log(scores);
    res.json({ scores });
});

module.exports = router;
