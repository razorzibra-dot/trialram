const fs = require('fs');
const path = require('path');

const dirs = [
  'src/components/masters',
  'src/components/product-sales',
  'src/components/syslogs'
];

dirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  try {
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✓ Deleted: ${dir}`);
    } else {
      console.log(`✗ Not found: ${dir}`);
    }
  } catch (error) {
    console.log(`✗ Error deleting ${dir}: ${error.message}`);
  }
});

console.log('\nVerification:');
dirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  const exists = fs.existsSync(fullPath);
  console.log(`${dir}: ${exists ? 'EXISTS' : 'DELETED'}`);
});
