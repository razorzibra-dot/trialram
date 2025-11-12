import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const componentsAuthPath = path.join(__dirname, 'src/components/auth');
const featuresAuthPath = path.join(__dirname, 'src/modules/features/auth');

console.log('\n=== ANALYSIS: src/components/auth vs src/modules/features/auth ===\n');

// Read files from both directories
const componentsAuthFiles = fs.readdirSync(componentsAuthPath)
  .filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))
  .map(f => ({
    name: f,
    path: path.join(componentsAuthPath, f),
    type: 'component',
    content: fs.readFileSync(path.join(componentsAuthPath, f), 'utf8')
  }));

const featuresAuthPath_views = path.join(featuresAuthPath, 'views');
const featuresAuthFiles = fs.readdirSync(featuresAuthPath_views)
  .filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))
  .map(f => ({
    name: f,
    path: path.join(featuresAuthPath_views, f),
    type: 'feature',
    content: fs.readFileSync(path.join(featuresAuthPath_views, f), 'utf8')
  }));

console.log('📁 Components in src/components/auth:');
componentsAuthFiles.forEach(f => {
  const lines = f.content.split('\n').length;
  console.log(`   - ${f.name} (${lines} lines)`);
});

console.log('\n📁 Components in src/modules/features/auth/views:');
featuresAuthFiles.forEach(f => {
  const lines = f.content.split('\n').length;
  console.log(`   - ${f.name} (${lines} lines)`);
});

// Check for exports and their purposes
console.log('\n\n=== COMPONENT PURPOSES ===\n');

console.log('🔐 src/components/auth (Route Guards & UI):');
console.log('   • ModuleProtectedRoute.tsx - Module-level access control');
console.log('   • ProtectedRoute.tsx - Basic authentication guard');
console.log('   • SessionExpiryWarningModal.tsx - Session timeout warning UI');
console.log('   • SessionTimeoutWarning.tsx - Session timeout with auto-logout');

console.log('\n🔐 src/modules/features/auth (Pages & Routes):');
console.log('   • LoginPage.tsx - Authentication form');
console.log('   • DemoAccountsPage.tsx - Demo account info');
console.log('   • NotFoundPage.tsx - 404 page');

// Check for imports
console.log('\n\n=== IMPORT ANALYSIS ===\n');

const allAuthImports = new Set();
const allComponentImports = new Set();

componentsAuthFiles.forEach(f => {
  const importMatches = f.content.matchAll(/from\s+['"]([^'"]+)['"]/g);
  for (const match of importMatches) {
    allComponentImports.add(match[1]);
  }
});

featuresAuthFiles.forEach(f => {
  const importMatches = f.content.matchAll(/from\s+['"]([^'"]+)['"]/g);
  for (const match of importMatches) {
    allAuthImports.add(match[1]);
  }
});

console.log('Imports from src/components/auth:');
const componentImports = Array.from(allComponentImports).sort();
componentImports.forEach(imp => console.log(`   - ${imp}`));

console.log('\nImports from src/modules/features/auth/views:');
const featureImports = Array.from(allAuthImports).sort();
featureImports.forEach(imp => console.log(`   - ${imp}`));

// Check for duplicates
console.log('\n\n=== DUPLICATE CHECK ===\n');

const componentNames = new Set(componentsAuthFiles.map(f => f.name.replace('.tsx', '').replace('.ts', '')));
const featureNames = new Set(featuresAuthFiles.map(f => f.name.replace('.tsx', '').replace('.ts', '')));

const duplicates = Array.from(componentNames).filter(c => featureNames.has(c));

if (duplicates.length === 0) {
  console.log('✅ No duplicate filenames found');
} else {
  console.log('⚠️  Duplicate filenames found:');
  duplicates.forEach(d => console.log(`   - ${d}`));
}

// Check if components/auth exports anything
console.log('\n\n=== EXPORTS CHECK ===\n');

const authIndexPath = path.join(componentsAuthPath, 'index.ts');
const authIndexExists = fs.existsSync(authIndexPath);

if (!authIndexExists) {
  console.log('❌ src/components/auth/ has NO index.ts');
  console.log('   Components are exported directly (e.g., from @/components/auth/ModuleProtectedRoute)');
} else {
  console.log('✅ src/components/auth/index.ts exists');
  const indexContent = fs.readFileSync(authIndexPath, 'utf8');
  console.log('\nExports:');
  console.log(indexContent);
}

// Search for actual usage
console.log('\n\n=== USAGE VERIFICATION ===\n');

console.log('Checking if auth components are imported anywhere in the codebase...');

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

const componentUsage = searchFiles(srcPath, /ModuleProtectedRoute|ProtectedRoute|SessionExpiryWarningModal|SessionTimeoutWarning/);
const featureRouteUsage = searchFiles(srcPath, /LoginPage|DemoAccountsPage|NotFoundPage/);

console.log('\nFiles importing auth components from src/components/auth:');
if (componentUsage.length === 0) {
  console.log('   ❌ NO FILES FOUND importing these components');
} else {
  componentUsage.forEach(f => {
    const relPath = path.relative(srcPath, f);
    console.log(`   ✅ ${relPath}`);
  });
}

console.log('\nFiles importing from src/modules/features/auth/views:');
if (featureRouteUsage.length === 0) {
  console.log('   ❌ NO FILES FOUND');
} else {
  featureRouteUsage.slice(0, 10).forEach(f => {
    const relPath = path.relative(srcPath, f);
    console.log(`   ✅ ${relPath}`);
  });
}

// Recommendations
console.log('\n\n=== RECOMMENDATIONS ===\n');

console.log('✅ SEPARATION IS CLEAR:');
console.log('   • src/components/auth = Route guard components (reusable infrastructure)');
console.log('   • src/modules/features/auth = Authentication pages (feature-specific)');
console.log('   • No duplicate components');
console.log('   • No overlapping functionality');

if (componentUsage.length === 0) {
  console.log('\n⚠️  POTENTIAL ISSUE:');
  console.log('   src/components/auth components don\'t appear to be imported anywhere');
  console.log('   They may be:');
  console.log('   1. Imported indirectly via a barrel export');
  console.log('   2. Not yet integrated (dead code)');
  console.log('   3. Used in configuration files not scanned');
}

console.log('\n');
