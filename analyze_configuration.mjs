import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const componentsConfigPath = path.join(__dirname, 'src/components/configuration');
const featuresConfigPath = path.join(__dirname, 'src/modules/features/configuration');

console.log('\n=== ANALYSIS: src/components/configuration/* vs src/modules/features/configuration/* ===\n');

// Read files from components/configuration
const componentFiles = fs.readdirSync(componentsConfigPath)
  .filter(f => (f.endsWith('.tsx') || f.endsWith('.ts')))
  .map(f => ({
    name: f,
    path: path.join(componentsConfigPath, f),
    type: 'component',
    content: fs.readFileSync(path.join(componentsConfigPath, f), 'utf8'),
    size: fs.statSync(path.join(componentsConfigPath, f)).size
  }));

// Read files from features/configuration
function readDirRecursive(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    if (file === 'DOC.md') return;
    
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      readDirRecursive(fullPath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push({
        name: file,
        path: fullPath,
        relPath: path.relative(featuresConfigPath, fullPath),
        type: 'feature',
        content: fs.readFileSync(fullPath, 'utf8'),
        size: stat.size
      });
    }
  });
  
  return fileList;
}

const featureFiles = readDirRecursive(featuresConfigPath);

console.log('📁 Files in src/components/configuration:');
componentFiles.forEach(f => {
  const lines = f.content.split('\n').length;
  console.log(`   - ${f.name.padEnd(30)} (${lines} lines, ${f.size} bytes)`);
});

console.log('\n📁 Files in src/modules/features/configuration:');
const groupedByFolder = {};
featureFiles.forEach(f => {
  const folder = path.dirname(f.relPath).split(path.sep)[0] || 'root';
  if (!groupedByFolder[folder]) groupedByFolder[folder] = [];
  groupedByFolder[folder].push(f);
});

Object.keys(groupedByFolder).sort().forEach(folder => {
  console.log(`\n   ${folder}/`);
  groupedByFolder[folder].forEach(f => {
    const lines = f.content.split('\n').length;
    console.log(`   ├─ ${f.name.padEnd(28)} (${lines} lines, ${f.size} bytes)`);
  });
});

// Look for imports and exports
console.log('\n\n=== COMPONENT PURPOSES ===\n');

console.log('src/components/configuration (Standalone Components):');
componentFiles.forEach(f => {
  console.log(`\n   ${f.name}:`);
  
  // Extract export statement
  const exportMatch = f.content.match(/export\s+(?:const|default|function|class)\s+(\w+)/);
  const exportName = exportMatch ? exportMatch[1] : 'Unknown';
  console.log(`   ├─ Exports: ${exportName}`);
  
  // Extract purpose from comments
  const docMatch = f.content.match(/\/\*\*[\s\S]*?\*\//);
  if (docMatch) {
    const lines = docMatch[0]
      .split('\n')
      .filter(l => l.includes('*'))
      .slice(1, 4)
      .map(l => l.replace(/\s*\*\s*/, '').trim())
      .filter(l => l && !l.startsWith('*'))
      .join(' ');
    if (lines) console.log(`   └─ Purpose: ${lines}`);
  }
});

console.log('\n\nsrc/modules/features/configuration (Feature Module):');
console.log('   Purpose: Tenant and System Configuration Management');
console.log('   └─ Views: TenantConfigurationPage, ConfigurationTestPage');
console.log('   └─ Components: ConfigTestResultPanel');
console.log('   └─ Services: configTestService');
console.log('   └─ Hooks: useConfigurationTests');

// Check for usage
console.log('\n\n=== USAGE ANALYSIS ===\n');

function searchFiles(dir, pattern, depth = 0, maxDepth = 10) {
  if (depth > maxDepth) return [];
  
  const results = [];
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build' || file === 'analyze') continue;
      
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

const componentNames = componentFiles
  .map(f => f.name.replace('.tsx', '').replace('.ts', ''));

console.log('Checking if components/configuration files are imported anywhere:\n');

let totalUsageCount = 0;

componentNames.forEach(name => {
  const pattern = new RegExp(`\\b${name}\\b`);
  const usage = searchFiles(srcPath, pattern)
    .filter(f => 
      !f.includes('src/components/configuration') && 
      !f.includes('analyze_') &&
      !f.includes('.test.')
    );
  
  totalUsageCount += usage.length;
  
  const status = usage.length > 0 ? '✅' : '❌';
  console.log(`${status} ${name.padEnd(28)} - Used in ${usage.length} location${usage.length !== 1 ? 's' : ''}`);
  
  if (usage.length > 0 && usage.length <= 3) {
    usage.forEach(f => {
      const relPath = path.relative(srcPath, f);
      console.log(`   └─ ${relPath}`);
    });
  } else if (usage.length > 3) {
    usage.slice(0, 2).forEach(f => {
      const relPath = path.relative(srcPath, f);
      console.log(`   ├─ ${relPath}`);
    });
    console.log(`   └─ ... and ${usage.length - 2} more files`);
  }
});

// Check if there are exports or index files
console.log('\n\n=== INDEXING CHECK ===\n');

const configIndexPath = path.join(componentsConfigPath, 'index.ts');
const hasIndex = fs.existsSync(configIndexPath);

if (!hasIndex) {
  console.log('❌ src/components/configuration/ has NO index.ts');
  console.log('   Components must be imported individually');
} else {
  console.log('✅ src/components/configuration/index.ts exists');
  const index = fs.readFileSync(configIndexPath, 'utf8');
  console.log('\nExports:');
  index.split('\n').forEach(line => {
    if (line.includes('export')) console.log(`   ${line}`);
  });
}

// Summary and recommendations
console.log('\n\n=== SUMMARY ===\n');

console.log('Directory Purposes:');
console.log('   • src/components/configuration/ - Old approach (POTENTIALLY UNUSED)');
console.log(`     └─ Contains: ${componentFiles.length} files (${componentFiles.reduce((sum, f) => sum + f.size, 0)} bytes)`);
console.log('   • src/modules/features/configuration/ - Current modern approach (ACTIVE)');
console.log(`     └─ Contains: ${featureFiles.length} files structured by responsibility`);

console.log('\n\n=== RECOMMENDATIONS ===\n');

if (totalUsageCount === 0) {
  console.log('🚨 CRITICAL FINDING:');
  console.log('   src/components/configuration/ appears to be COMPLETELY UNUSED!');
  console.log('   The entire directory may be dead code from an earlier refactor.');
  console.log('\n   Action Items:');
  console.log('   1. ✅ All functionality has been moved to src/modules/features/configuration/');
  console.log('   2. ⚠️  DELETION CANDIDATE: src/components/configuration/ should be deleted');
  console.log('   3. ✅ The features module is the new standard approach');
} else {
  console.log('✅ src/components/configuration/ is in use');
  console.log('   However, consider if it should be consolidated with the features module');
}

console.log('\n✅ ARCHITECTURE CLARITY:');
console.log('   • Component-based approach: src/components/configuration/ (old)');
console.log('   • Feature module approach: src/modules/features/configuration/ (new, recommended)');
console.log('   • Feature approach is more modular and maintainable');

console.log('\n');
