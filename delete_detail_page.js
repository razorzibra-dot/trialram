const fs = require('fs');
const path = './src/modules/features/customers/views/CustomerDetailPage.tsx';

try {
  if (fs.existsSync(path)) {
    fs.unlinkSync(path);
    console.log('File deleted successfully');
  } else {
    console.log('File not found');
  }
} catch (error) {
  console.error('Error deleting file:', error.message);
}
