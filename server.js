const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Server listening on port ${port} - http://localhost:3000`);
});