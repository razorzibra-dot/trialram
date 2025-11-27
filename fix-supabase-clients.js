const fs = require('fs');
const path = require('path');
const glob = require('glob');

const servicesDir = path.join(__dirname, 'src/services');

glob('**/supabase/*.ts', { cwd: servicesDir }, (err, files) => {
  if (err) {
    console.error('Error finding files:', err);
    process.exit(1);
  }

  let updatedCount = 0;
  let skippedCount = 0;

  files.forEach(file => {
    const filePath = path.join(servicesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    if (!content.includes("import { supabase") && content.includes("createClient")) {
      const originalContent = content;
      
      content = content.replace(
        /import\s+{\s*createClient\s*}\s+from\s+['"]@supabase\/supabase-js['"];\s*\n\s*const\s+(supabase|supabaseClient)\s*=\s*createClient\(\s*import\.meta\.env\.VITE_SUPABASE_URL\s*\|\|\s*['"]['"]\s*,\s*import\.meta\.env\.VITE_SUPABASE_ANON_KEY\s*\|\|\s*['"]['"]?\s*\);\s*\n/,
        `import { supabase as $1 } from '../client';\n`
      );

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Updated: ${file}`);
        updatedCount++;
      } else {
        console.log(`⏭️  Skipped (different pattern): ${file}`);
        skippedCount++;
      }
    } else {
      console.log(`⏭️  Already fixed: ${file}`);
      skippedCount++;
    }
  });

  console.log(`\n✅ Updated: ${updatedCount} files`);
  console.log(`⏭️  Skipped/Already fixed: ${skippedCount} files`);
  console.log(`Total: ${updatedCount + skippedCount} files`);
});
