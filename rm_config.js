#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const targetDir = path.join(process.cwd(), 'src/components/configuration');

console.log('Target:', targetDir);
console.log('Exists:', fs.existsSync(targetDir));

if (fs.existsSync(targetDir)) {
  console.log('Files inside:');
  console.log(fs.readdirSync(targetDir));
  
  try {
    // Use fs.rmSync with recursive and force flags
    fs.rmSync(targetDir, { recursive: true, force: true });
    console.log('✅ Deleted successfully');
    console.log('Verify deleted:', !fs.existsSync(targetDir));
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}
