import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const cwd = process.cwd();

const componentFolders = [
  { folder: 'src/components/masters', files: ['CompanyFormModal.tsx', 'MasterDataSelect.tsx', 'ProductFormModal.tsx'] },
  { folder: 'src/components/product-sales', files: ['ProductSaleDetail.tsx', 'ProductSaleForm.tsx'] },
  { folder: 'src/components/syslogs', files: ['AuditLogFilters.tsx', 'LogExportDialog.tsx', 'SystemHealthDashboard.tsx'] }
];

console.log('='.repeat(80));
console.log('COMPONENT DUPLICATION & DEAD CODE ANALYSIS');
console.log('='.repeat(80));

for (const { folder, files } of componentFolders) {
  console.log(`\n### ${folder}`);
  console.log(`${'-'.repeat(80)}`);

  let totalSize = 0;
  for (const file of files) {
    const filePath = path.join(cwd, folder, file);
    try {
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`  - ${file}: ${sizeKB} KB`);
    } catch (e) {
      console.log(`  - ${file}: NOT FOUND`);
    }
  }
  console.log(`  Total size: ${(totalSize / 1024).toFixed(2)} KB`);
}

console.log(`\n\n### FEATURE MODULES WITH SIMILAR FUNCTIONALITY`);
console.log(`${'='.repeat(80)}`);

const featureModules = [
  { module: 'src/modules/features/masters', folder: 'masters' },
  { module: 'src/modules/features/product-sales', folder: 'product-sales' },
  { module: 'src/modules/features/audit-logs', folder: 'audit-logs' }
];

for (const { module } of featureModules) {
  console.log(`\n**${module}**`);
  
  const componentPath = path.join(cwd, module, 'components');
  if (fs.existsSync(componentPath)) {
    const components = fs.readdirSync(componentPath)
      .filter(f => f.endsWith('.tsx'))
      .sort();
    console.log(`  Components: ${components.length} files`);
    components.slice(0, 5).forEach(comp => {
      const stats = fs.statSync(path.join(componentPath, comp));
      console.log(`    - ${comp} (${(stats.size / 1024).toFixed(2)} KB)`);
    });
    if (components.length > 5) {
      console.log(`    ... and ${components.length - 5} more`);
    }
  } else {
    console.log(`  Components: None`);
  }
}

console.log(`\n\n### DEAD CODE FILES`);
console.log(`${'='.repeat(80)}`);

const deadCodeFiles = [
  { path: 'src/components/masters/CompanyFormModal.tsx', name: 'CompanyFormModal' },
  { path: 'src/components/masters/MasterDataSelect.tsx', name: 'MasterDataSelect' },
  { path: 'src/components/masters/ProductFormModal.tsx', name: 'ProductFormModal' },
  { path: 'src/components/product-sales/ProductSaleDetail.tsx', name: 'ProductSaleDetail' },
  { path: 'src/components/product-sales/ProductSaleForm.tsx', name: 'ProductSaleForm' },
  { path: 'src/components/syslogs/AuditLogFilters.tsx', name: 'AuditLogFilters' },
  { path: 'src/components/syslogs/LogExportDialog.tsx', name: 'LogExportDialog' },
  { path: 'src/components/syslogs/SystemHealthDashboard.tsx', name: 'SystemHealthDashboard' }
];

let totalDeadSize = 0;

deadCodeFiles.forEach(({ path: filePath, name }) => {
  const fullPath = path.join(cwd, filePath);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    console.log(`\n- ${name}`);
    console.log(`  Path: ${filePath}`);
    console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);
    totalDeadSize += stats.size;
  }
});

console.log(`\n\nTOTAL DEAD CODE SIZE: ${(totalDeadSize / 1024).toFixed(2)} KB`);
