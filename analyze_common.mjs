import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const componentsCommonPath = path.join(__dirname, 'src/components/common');
const coreComponentsPath = path.join(__dirname, 'src/modules/core/components');

console.log('\n=== ANALYSIS: src/components/common/* vs src/modules/core/components/* ===\n');

// Read files from common directory
const commonFiles = fs.readdirSync(componentsCommonPath)
  .filter(f => (f.endsWith('.tsx') || f.endsWith('.ts')) && f !== 'index.ts')
  .map(f => ({
    name: f,
    path: path.join(componentsCommonPath, f),
    type: 'common',
    content: fs.readFileSync(path.join(componentsCommonPath, f), 'utf8'),
    size: fs.statSync(path.join(componentsCommonPath, f)).size
  }));

const commonIndexPath = path.join(componentsCommonPath, 'index.ts');
const commonIndexExists = fs.existsSync(commonIndexPath);
const commonIndex = commonIndexExists ? fs.readFileSync(commonIndexPath, 'utf8') : '';

// Read files from core directory
const coreFiles = fs.readdirSync(coreComponentsPath)
  .filter(f => (f.endsWith('.tsx') || f.endsWith('.ts')) && f !== 'index.ts')
  .map(f => ({
    name: f,
    path: path.join(coreComponentsPath, f),
    type: 'core',
    content: fs.readFileSync(path.join(coreComponentsPath, f), 'utf8'),
    size: fs.statSync(path.join(coreComponentsPath, f)).size
  }));

const coreIndexPath = path.join(coreComponentsPath, 'index.ts');
const coreIndexExists = fs.existsSync(coreIndexPath);
const coreIndex = coreIndexExists ? fs.readFileSync(coreIndexPath, 'utf8') : '';

console.log('📁 Components in src/components/common:');
commonFiles.forEach(f => {
  const lines = f.content.split('\n').length;
  console.log(`   - ${f.name.padEnd(30)} (${lines} lines, ${f.size} bytes)`);
});

console.log('\n📁 Components in src/modules/core/components:');
coreFiles.forEach(f => {
  const lines = f.content.split('\n').length;
  console.log(`   - ${f.name.padEnd(30)} (${lines} lines, ${f.size} bytes)`);
});

// Check for re-exports
console.log('\n\n=== RE-EXPORT ANALYSIS ===\n');

const reExportMap = new Map();

coreFiles.forEach(f => {
  const reExportMatch = f.content.match(/export\s*{\s*([^}]+)\s*}\s*from\s*['"]([^'"]+)['"]/);
  if (reExportMatch) {
    const [, exports, importPath] = reExportMatch;
    reExportMap.set(f.name, {
      exports: exports.trim().split(',').map(e => e.trim()),
      importPath: importPath
    });
  }
});

if (reExportMap.size > 0) {
  console.log('✅ Re-exports found in src/modules/core/components:');
  reExportMap.forEach((info, fileName) => {
    console.log(`\n   ${fileName}:`);
    console.log(`   ├─ Exports: ${info.exports.join(', ')}`);
    console.log(`   └─ From: ${info.importPath}`);
  });
} else {
  console.log('❌ No re-exports found in src/modules/core/components');
}

// Check for duplicates (same name, different content)
console.log('\n\n=== DUPLICATE DETECTION ===\n');

const commonNames = new Set(commonFiles.map(f => f.name.replace('.tsx', '').replace('.ts', '')));
const coreNames = new Set(coreFiles.map(f => f.name.replace('.tsx', '').replace('.ts', '')));

const duplicateNames = Array.from(commonNames).filter(c => coreNames.has(c));

if (duplicateNames.length === 0) {
  console.log('✅ No duplicate filenames found');
} else {
  console.log('⚠️  Files with same names:');
  duplicateNames.forEach(name => {
    const commonFile = commonFiles.find(f => f.name.includes(name));
    const coreFile = coreFiles.find(f => f.name.includes(name));
    
    if (commonFile && coreFile) {
      console.log(`\n   ${name}:`);
      console.log(`   ├─ common: ${commonFile.size} bytes`);
      console.log(`   ├─ core: ${coreFile.size} bytes`);
      
      // Check if they're the same
      if (commonFile.content === coreFile.content) {
        console.log(`   └─ Content: IDENTICAL ❌ (DUPLICATE)`);
      } else {
        // Check if core is just a re-export
        const isReExport = coreFile.content.includes('export') && 
                          coreFile.content.includes('from') &&
                          coreFile.content.match(/export.*from.*@\/components\/common/);
        if (isReExport) {
          console.log(`   └─ Relationship: CORE RE-EXPORTS COMMON ✅`);
        } else {
          console.log(`   └─ Content: DIFFERENT (need investigation)`);
        }
      }
    }
  });
}

// Search for actual usage
console.log('\n\n=== USAGE VERIFICATION ===\n');

function searchFiles(dir, pattern, depth = 0, maxDepth = 10) {
  if (depth > maxDepth) return [];
  
  const results = [];
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') continue;
      
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        results.push(...searchFiles(fullPath, pattern, depth + 1, maxDepth));
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.match(pattern)) {
            results.push(fullPath);
          }
        } catch (e) {}
      }
    }
  } catch (e) {}
  
  return results;
}

const srcPath = path.join(__dirname, 'src');

// Check usage of common components
const commonComponentNames = commonFiles
  .map(f => f.name.replace('.tsx', '').replace('.ts', ''))
  .filter(name => !name.includes('test') && !name.includes('Test'));

console.log('Checking usage of common components:\n');

let totalUsage = 0;
commonComponentNames.forEach(name => {
  const pattern = new RegExp(`\\b${name}\\b`);
  const usage = searchFiles(srcPath, pattern)
    .filter(f => !f.includes('src/components/common') && !f.includes('analyze_'));
  
  totalUsage += usage.length;
  
  const status = usage.length > 0 ? '✅' : '❌';
  console.log(`${status} ${name.padEnd(30)} used in ${usage.length} file${usage.length !== 1 ? 's' : ''}`);
  
  if (usage.length > 0 && usage.length <= 5) {
    usage.forEach(f => {
      const relPath = path.relative(srcPath, f);
      console.log(`   └─ ${relPath}`);
    });
  } else if (usage.length > 5) {
    usage.slice(0, 3).forEach(f => {
      const relPath = path.relative(srcPath, f);
      console.log(`   ├─ ${relPath}`);
    });
    console.log(`   └─ ... and ${usage.length - 3} more files`);
  }
});

console.log('\n\n=== COMMON COMPONENTS SUMMARY ===\n');

console.log('Component Purposes:');
commonFiles.forEach(f => {
  const lines = f.content.split('\n').slice(0, 10).join('\n');
  const isExported = commonIndex.includes(f.name.replace('.tsx', '').replace('.ts', ''));
  const exportStatus = isExported ? '✅ EXPORTED' : '❌ NOT EXPORTED';
  
  console.log(`\n${exportStatus} - ${f.name}`);
  
  // Extract purpose from comments
  const purposeMatch = f.content.match(/\/\*\*[\s\S]*?(?:Functionality|Features|Purpose|Description|Component)[\s\S]*?\*\//);
  if (purposeMatch) {
    const lines = purposeMatch[0]
      .split('\n')
      .filter(l => l.includes('*'))
      .slice(0, 2)
      .map(l => l.replace(/\s*\*\s*/, '').trim())
      .join(' ');
    console.log(`   ${lines}`);
  }
});

console.log('\n\n=== INDEXING CHECK ===\n');

console.log('src/components/common/index.ts exports:');
const commonExports = commonIndex
  .split('\n')
  .filter(l => l.includes('export'))
  .map(l => l.trim());
  
if (commonExports.length === 0) {
  console.log('   ❌ No exports found!');
} else {
  commonExports.forEach(exp => console.log(`   ${exp}`));
}

console.log('\nsrc/modules/core/components/index.ts exports:');
const coreExports = coreIndex
  .split('\n')
  .filter(l => l.includes('export'))
  .map(l => l.trim());
  
if (coreExports.length === 0) {
  console.log('   ❌ No exports found!');
} else {
  coreExports.forEach(exp => console.log(`   ${exp}`));
}

// Recommendations
console.log('\n\n=== RECOMMENDATIONS ===\n');

console.log('✅ ARCHITECTURE:');
console.log('   • src/components/common = Reusable enterprise UI components');
console.log('   • src/modules/core/components = Core module components with re-exports');
console.log('   • Core module provides convenient imports from modules (e.g., from @/modules/core/components)');

if (totalUsage === 0) {
  console.log('\n⚠️  WARNING: Common components appear to be unused!');
  console.log('   This may indicate:');
  console.log('   1. Components are new and not yet integrated');
  console.log('   2. They are imported indirectly via barrel exports');
  console.log('   3. They are truly unused (dead code)');
} else {
  console.log(`\n✅ Common components are actively used (${totalUsage} usages found)`);
}

// Check for unused files
console.log('\n\nFiles in common that are NOT exported:');
const unexportedCommon = commonFiles
  .map(f => f.name.replace('.tsx', '').replace('.ts', ''))
  .filter(name => !commonIndex.includes(name));

if (unexportedCommon.length === 0) {
  console.log('   ✅ All components are properly exported');
} else {
  unexportedCommon.forEach(name => console.log(`   ⚠️  ${name}`));
}

console.log('\n');
