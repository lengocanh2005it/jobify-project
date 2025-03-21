const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const appsPath = path.join(__dirname, '../apps');
const services = fs
  .readdirSync(appsPath)
  .filter((name) => fs.statSync(path.join(appsPath, name)).isDirectory());

console.log('Starting services:', services.join(', '));

const command = `npx concurrently -n ${services.join(',')} ${services.map((service) => `"nest start ${service} --watch"`).join(' ')}`;

exec(command, (err, stdout, stderr) => {
  if (err) {
    console.error(`Error: ${err.message}`);
    return;
  }
  console.log(stdout);
  console.error(stderr);
});
