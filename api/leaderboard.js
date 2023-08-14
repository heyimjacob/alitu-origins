const fs = require('fs');
const path = require('path');

const SCORES_FILE = path.join(__dirname, 'scores.json');

const getScores = () => {
  if (fs.existsSync(SCORES_FILE)) {
    const data = fs.readFileSync(SCORES_FILE, 'utf-8');
    return JSON.parse(data);
  }
  return [];
};

const saveScores = (scores) => {
  fs.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2));
};

module.exports = (req, res) => {
  if (req.method === 'POST') {
    // Handle score submission
    const { name, score } = req.body;
    const scores = getScores();
    scores.push({ name, score });
    scores.sort((a, b) => b.score - a.score);  // Sort in descending order
    saveScores(scores);
    const rank = scores.findIndex(s => s.name === name && s.score === score) + 1;
    res.status(200).json({ rank, scores: scores.slice(0, 10) });  // Return top 10 scores
  } else if (req.method === 'GET') {
    // Handle leaderboard retrieval
    const scores = getScores();
    res.status(200).json(scores.slice(0, 10));  // Return top 10 scores
  } else {
    res.status(405).end();  // Method not allowed
  }
};
