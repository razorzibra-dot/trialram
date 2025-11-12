import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const configurationPath = path.join(__dirname, 'src/components/configuration');

console.log('\n🗑️  Deleting src/components/configuration/...\n');
console.log(`Path: ${configurationPath}\n`);

try {
  if (fs.existsSync(configurationPath)) {
    fs.rmSync(configurationPath, { recursive: true, force: true });
    console.log('✅ Successfully deleted src/components/configuration/\n');
  } else {
    console.log('❌ Directory not found\n');
  }
} catch (error) {
  console.error('❌ Error during cleanup:', error.message);
}
