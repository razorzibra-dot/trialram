import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getAllFiles(dir, ext = ['.tsx', '.ts']) {
  let files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, ext));
    } else if (ext.some(e => item.name.endsWith(e))) {
      files.push(fullPath);
    }
  }
  return files;
}

const srcDir = path.join(__dirname, 'src');
const allFiles = getAllFiles(srcDir);

const nonComponentsFiles = allFiles.filter(f => !f.includes(path.sep + 'components' + path.sep));

const imports = {};

for (const file of nonComponentsFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const regex = /from ['"]@\/components\/([^'"]+)['"]/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const importPath = match[1];
    if (!imports[importPath]) {
      imports[importPath] = [];
    }
    const relPath = path.relative(__dirname, file);
    if (!imports[importPath].includes(relPath)) {
      imports[importPath].push(relPath);
    }
  }
}

console.log('\n=== COMPONENTS IMPORTED FROM OUTSIDE src/components ===\n');

const sortedKeys = Object.keys(imports).sort();
for (const comp of sortedKeys) {
  console.log(`\x1b[36m${comp}\x1b[0m`);
  const uniquePaths = [...new Set(imports[comp])].sort();
  for (const file of uniquePaths) {
    console.log(`  → ${file}`);
  }
  console.log('');
}

console.log(`\nTotal unique components: ${sortedKeys.length}`);
console.log(`Total import statements: ${Object.values(imports).flat().length}`);
