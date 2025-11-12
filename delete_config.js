const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/components/configuration');

console.log('Attempting to delete:', dir);

try {
  // Delete directory and all contents
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    console.log('Found files:', files);
    
    files.forEach(f => {
      const filePath = path.join(dir, f);
      fs.unlinkSync(filePath);
      console.log('Deleted:', f);
    });
    
    fs.rmdirSync(dir);
    console.log('✅ Directory deleted successfully');
  } else {
    console.log('❌ Directory not found');
  }
} catch (error) {
  console.error('Error:', error.message);
}
