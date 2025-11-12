import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filesToDelete = [
  'src/components/common/DataTable.tsx',
  'src/modules/shared/hooks/useDataTable.ts'
];

filesToDelete.forEach(file => {
  try {
    fs.unlinkSync(path.join(__dirname, file));
    console.log(`✓ Deleted: ${file}`);
  } catch (e) {
    console.log(`✗ Failed to delete ${file}: ${e.message}`);
  }
});
