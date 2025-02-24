// server.js
const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3000;

// Define the endpoint
app.get('/api/tls-scan', (req, res) => {
  const hostname = req.query.hostname;
  if (!hostname) {
    return res.status(400).send('Hostname is required');
  }

  // Construct the path to your Python script.
  const pythonScriptPath = path.join(__dirname, '..', 'src', 'tlsScan.py');
  const command = `python ${pythonScriptPath} ${hostname}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing Python script: ${error}`);
      return res.status(500).send(stderr);
    }
    res.send(stdout);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
