const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const appsPath = path.join(__dirname, '../apps');

// Lọc ra tất cả các service trong thư mục `apps`
const services = fs
  .readdirSync(appsPath)
  .filter((name) => fs.statSync(path.join(appsPath, name)).isDirectory());

console.log('Building services:', services.join(', '));

services.forEach((service) => {
  console.log(`\n🔨 Building ${service}...`);
  try {
    execSync(`nest build ${service}`, { stdio: 'inherit' });
    console.log(`✅ Build completed for ${service}`);
  } catch (error) {
    console.error(`❌ Build failed for ${service}:`, error.message);
  }
});
