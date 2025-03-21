const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const appsPath = path.join(__dirname, '../apps');

// Lọc ra tất cả các service trong thư mục `apps`
const services = fs
  .readdirSync(appsPath)
  .filter((name) => fs.statSync(path.join(appsPath, name)).isDirectory());

console.log('Starting services:', services.join(', '));

// Chạy từng service ở chế độ production từ thư mục `dist`
const command = `npx concurrently -n ${services.join(',')} ${services
  .map((service) => `"node dist/apps/${service}/main.js"`)
  .join(' ')}`;

exec(command, (err, stdout, stderr) => {
  if (err) {
    console.error(`Error: ${err.message}`);
    return;
  }
  console.log(stdout);
  console.error(stderr);
});
