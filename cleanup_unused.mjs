import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function removeFile(filePath) {
  try {
    fs.unlinkSync(filePath);
    console.log(`✓ Deleted: ${path.relative(__dirname, filePath)}`);
    return true;
  } catch (e) {
    console.log(`✗ Failed to delete ${path.relative(__dirname, filePath)}: ${e.message}`);
    return false;
  }
}

function removeFolder(folderPath) {
  try {
    const files = fs.readdirSync(folderPath);
    for (const file of files) {
      const fullPath = path.join(folderPath, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        removeFolder(fullPath);
      } else {
        fs.unlinkSync(fullPath);
      }
    }
    fs.rmdirSync(folderPath);
    console.log(`✓ Deleted folder: ${path.relative(__dirname, folderPath)}`);
    return true;
  } catch (e) {
    console.log(`✗ Failed to delete ${path.relative(__dirname, folderPath)}: ${e.message}`);
    return false;
  }
}

const toDelete = [
  // Folders
  { path: 'src/components/example', type: 'folder' },
  { path: 'src/components/notifications', type: 'folder' },
  { path: 'src/components/pdf', type: 'folder' },
  // Files
  { path: 'src/components/providers/AntdConfigProvider.tsx', type: 'file' },
  { path: 'src/components/ui/chart.tsx', type: 'file' },
  { path: 'src/components/ui/enhanced-button.tsx', type: 'file' },
  { path: 'src/components/ui/enhanced-card.tsx', type: 'file' },
  { path: 'src/components/ui/enhanced-header.tsx', type: 'file' },
  { path: 'src/components/ui/enhanced-input.tsx', type: 'file' },
  { path: 'src/components/ui/enhanced-sidebar.tsx', type: 'file' },
  { path: 'src/components/ui/enhanced-tabs.tsx', type: 'file' },
  { path: 'src/components/ui/enhanced-modal.tsx', type: 'file' },
  { path: 'src/components/ui/theme-toggle.tsx', type: 'file' },
  { path: 'src/components/ui/toaster.tsx', type: 'file' },
];

console.log('\n=== REMOVING UNUSED COMPONENTS ===\n');

let deletedCount = 0;
for (const item of toDelete) {
  const fullPath = path.join(__dirname, item.path);
  if (item.type === 'folder') {
    if (removeFolder(fullPath)) deletedCount++;
  } else {
    if (removeFile(fullPath)) deletedCount++;
  }
}

console.log(`\n✓ Successfully removed ${deletedCount}/${toDelete.length} items\n`);
