import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getAllFiles(dir, ext = ['.tsx', '.ts']) {
  let files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory() && !item.name.startsWith('.')) {
      files = files.concat(getAllFiles(fullPath, ext));
    } else if (ext.some(e => item.name.endsWith(e)) && !item.name.endsWith('.test.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

const srcDir = path.join(__dirname, 'src');
const allSrcFiles = getAllFiles(srcDir);

const componentsDir = path.join(__dirname, 'src', 'components');
const componentFiles = getAllFiles(componentsDir);

console.log('\n=== ANALYZING COMPONENT FILE USAGE ===\n');

const unusedComponents = [];

for (const compFile of componentFiles) {
  const fileContent = fs.readFileSync(compFile, 'utf-8');
  
  // Skip if file has no exports
  if (!fileContent.includes('export')) {
    continue;
  }

  // Extract the component name(s) from exports
  const exportMatches = fileContent.match(/export\s+(?:default\s+)?(?:function|const|class|interface|type)\s+([A-Za-z_]\w*)/g);
  if (!exportMatches) continue;

  const exportedNames = exportMatches.map(e => {
    const match = e.match(/(?:function|const|class|interface|type)\s+([A-Za-z_]\w*)/);
    return match ? match[1] : null;
  }).filter(Boolean);

  const relPath = path.relative(__dirname, compFile);
  const fileName = path.basename(compFile, path.extname(compFile));
  
  // Search for imports of this component in ALL files
  let isUsed = false;
  const cleanPath = relPath.replace(/^src[\\\/]components[\\\/]/, '').replace(/\.tsx?$/, '').replace(/\\/g, '/');
  const componentFolder = path.dirname(cleanPath).replace(/\\/g, '/');
  
  const importPatterns = [
    `from '${relPath}'`,
    `from "${relPath}"`,
    `from '@/components/${cleanPath}'`,
    `from '@/components/${cleanPath}.tsx'`,
    `from '@/components/${cleanPath}.ts'`,
    `from '@/components/${componentFolder}'`, // barrel import from parent folder
    `import('${relPath}')`,
    `import("${relPath}")`,
  ];
  
  for (const srcFile of allSrcFiles) {
    if (srcFile === compFile) continue; // Skip self
    
    try {
      const srcContent = fs.readFileSync(srcFile, 'utf-8');
      
      // Check if file is imported
      if (importPatterns.some(p => srcContent.includes(p))) {
        isUsed = true;
        break;
      }
    } catch (e) {
      // Skip files that can't be read
    }
  }
  
  if (!isUsed) {
    unusedComponents.push(relPath.replace(/\\/g, '/'));
  }
}

// Group by folder
const byFolder = {};
for (const comp of unusedComponents) {
  const folder = comp.split('/')[2]; // src/components/{folder}
  if (!byFolder[folder]) {
    byFolder[folder] = [];
  }
  byFolder[folder].push(comp);
}

console.log('=== POTENTIALLY UNUSED COMPONENTS ===\n');

for (const folder of Object.keys(byFolder).sort()) {
  console.log(`\x1b[33m${folder}/\x1b[0m`);
  for (const comp of byFolder[folder].sort()) {
    console.log(`  ⚠️  ${comp}`);
  }
  console.log('');
}

console.log(`Total potentially unused: ${unusedComponents.length}\n`);

// List all component folders
const folders = new Set();
for (const comp of componentFiles) {
  const rel = path.relative(componentsDir, comp);
  const folder = rel.split(path.sep)[0];
  folders.add(folder);
}

console.log('=== ALL COMPONENT FOLDERS ===\n');
for (const folder of Array.from(folders).sort()) {
  const folderFiles = componentFiles.filter(f => 
    path.relative(componentsDir, f).startsWith(folder)
  );
  const unused = byFolder[folder] ? byFolder[folder].length : 0;
  const total = folderFiles.length;
  const status = unused === total ? '🔴 ALL UNUSED' : unused > 0 ? '🟡 PARTIAL' : '✅ USED';
  console.log(`${status} ${folder}: ${total} files, ${unused} unused`);
}
