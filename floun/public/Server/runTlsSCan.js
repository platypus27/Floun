// runTlsScan.js
const { exec } = require('child_process');
const path = require('path');

// Construct the absolute path to your Python script.
// Adjust the path if your project structure is different.
const pythonScriptPath = path.join(__dirname, '..', 'src', 'tlsScan.py');

// Accept a hostname from command-line arguments or default to "www.youtube.com"
const hostname = process.argv[2] || 'www.google .com';

// Build the command to execute the Python script with the hostname argument.
const command = `python ${pythonScriptPath} ${hostname}`;

console.log(`Executing command: ${command}`);

// Execute the Python script using exec.
exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing Python script: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Python script stderr: ${stderr}`);
  }
  console.log(`Python script output:\n${stdout}`);
});
