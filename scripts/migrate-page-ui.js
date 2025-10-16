/**
 * UI Migration Helper Script
 * Helps migrate pages to the new enterprise design system
 * 
 * Usage: node scripts/migrate-page-ui.js <page-path>
 * Example: node scripts/migrate-page-ui.js src/modules/features/sales/views/SalesPage.tsx
 */

const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function analyzePageFile(filePath) {
  log('\n📊 Analyzing page file...', 'blue');
  
  if (!fs.existsSync(filePath)) {
    log(`❌ File not found: ${filePath}`, 'red');
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  
  const analysis = {
    hasEnterpriseLayout: content.includes('EnterpriseLayout'),
    hasPageHeader: content.includes('PageHeader'),
    hasAntdImports: content.includes("from 'antd'"),
    hasTailwindClasses: /className="[^"]*(?:p-|m-|grid|flex|space-|gap-|text-|bg-|border-)/g.test(content),
    hasOldCardComponents: content.includes('@/components/ui/card'),
    hasOldButtonComponents: content.includes('@/components/ui/button'),
    usesStatCard: content.includes('StatCard'),
    hasRowCol: content.includes('<Row') && content.includes('<Col'),
  };

  log('\n✅ Analysis Results:', 'green');
  log(`  - Enterprise Layout: ${analysis.hasEnterpriseLayout ? '✓' : '✗'}`);
  log(`  - Page Header: ${analysis.hasPageHeader ? '✓' : '✗'}`);
  log(`  - Ant Design Imports: ${analysis.hasAntdImports ? '✓' : '✗'}`);
  log(`  - Uses Row/Col Grid: ${analysis.hasRowCol ? '✓' : '✗'}`);
  log(`  - Uses StatCard: ${analysis.usesStatCard ? '✓' : '✗'}`);
  
  log('\n⚠️  Issues Found:', 'yellow');
  if (analysis.hasTailwindClasses) {
    log('  - Contains Tailwind classes (should be replaced)');
  }
  if (analysis.hasOldCardComponents) {
    log('  - Uses old Card components (should use Ant Design)');
  }
  if (analysis.hasOldButtonComponents) {
    log('  - Uses old Button components (should use Ant Design)');
  }

  return analysis;
}

function generateMigrationSuggestions(analysis) {
  log('\n💡 Migration Suggestions:', 'blue');
  
  const suggestions = [];

  if (!analysis.hasEnterpriseLayout) {
    suggestions.push({
      priority: 'HIGH',
      task: 'Wrap page in EnterpriseLayout',
      code: `import { EnterpriseLayout } from '@/components/layout/EnterpriseLayout';

return (
  <EnterpriseLayout>
    {/* your content */}
  </EnterpriseLayout>
);`
    });
  }

  if (!analysis.hasPageHeader) {
    suggestions.push({
      priority: 'HIGH',
      task: 'Add PageHeader component',
      code: `import { PageHeader } from '@/components/common';

<PageHeader
  title="Page Title"
  description="Page description"
  breadcrumb={{
    items: [
      { title: 'Dashboard', path: '/tenant/dashboard' },
      { title: 'Current Page' }
    ]
  }}
  extra={
    <Button type="primary" icon={<PlusOutlined />}>
      Action Button
    </Button>
  }
/>`
    });
  }

  if (!analysis.hasAntdImports) {
    suggestions.push({
      priority: 'HIGH',
      task: 'Add Ant Design imports',
      code: `import { Row, Col, Card, Button, Table, Form, Input, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';`
    });
  }

  if (!analysis.hasRowCol) {
    suggestions.push({
      priority: 'MEDIUM',
      task: 'Replace grid with Row/Col',
      code: `// Replace:
<div className="grid grid-cols-4 gap-4">
  <div>Item</div>
</div>

// With:
<Row gutter={[16, 16]}>
  <Col xs={24} sm={12} lg={6}>
    Item
  </Col>
</Row>`
    });
  }

  if (analysis.hasTailwindClasses) {
    suggestions.push({
      priority: 'MEDIUM',
      task: 'Replace Tailwind classes with Ant Design',
      code: `// Replace:
<div className="p-6 space-y-6">

// With:
<div style={{ padding: 24 }}>
  <Space direction="vertical" size="large" style={{ width: '100%' }}>
    {/* content */}
  </Space>
</div>`
    });
  }

  if (analysis.hasOldCardComponents) {
    suggestions.push({
      priority: 'MEDIUM',
      task: 'Replace old Card components',
      code: `// Replace:
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// With:
<Card title="Title" bordered={false}>
  Content
</Card>`
    });
  }

  suggestions.forEach((suggestion, index) => {
    log(`\n${index + 1}. [${suggestion.priority}] ${suggestion.task}`, 
        suggestion.priority === 'HIGH' ? 'red' : 'yellow');
    log(`\n${suggestion.code}`, 'bright');
  });

  return suggestions;
}

function generateMigrationChecklist(filePath) {
  const fileName = path.basename(filePath);
  
  log('\n\n📋 Migration Checklist for ' + fileName, 'green');
  log('═'.repeat(60), 'green');
  
  const checklist = [
    '[ ] Wrap page in EnterpriseLayout',
    '[ ] Add PageHeader component',
    '[ ] Replace imports (ui/card, ui/button → antd)',
    '[ ] Replace grid classes with Row/Col',
    '[ ] Replace Tailwind classes with inline styles',
    '[ ] Use StatCard for statistics',
    '[ ] Use Ant Design Card component',
    '[ ] Use Ant Design Button component',
    '[ ] Use Ant Design Table component (if applicable)',
    '[ ] Use Ant Design Form component (if applicable)',
    '[ ] Add consistent padding (24px)',
    '[ ] Add consistent spacing (16px gutters)',
    '[ ] Test responsive layout (xs, sm, lg)',
    '[ ] Test all button actions',
    '[ ] Test loading states',
    '[ ] Test error states',
    '[ ] Test empty states',
    '[ ] Remove unused imports',
    '[ ] Format code',
    '[ ] Test in browser',
  ];

  checklist.forEach(item => log(item));
  
  log('\n═'.repeat(60), 'green');
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log('❌ Error: Please provide a file path', 'red');
    log('\nUsage: node scripts/migrate-page-ui.js <page-path>', 'yellow');
    log('Example: node scripts/migrate-page-ui.js src/modules/features/sales/views/SalesPage.tsx\n', 'yellow');
    process.exit(1);
  }

  const filePath = args[0];
  const fullPath = path.resolve(process.cwd(), filePath);

  log('\n🚀 UI Migration Helper', 'bright');
  log('═'.repeat(60), 'blue');
  log(`File: ${filePath}`, 'blue');
  log('═'.repeat(60), 'blue');

  const analysis = analyzePageFile(fullPath);
  
  if (!analysis) {
    process.exit(1);
  }

  generateMigrationSuggestions(analysis);
  generateMigrationChecklist(fullPath);

  const migrationStatus = 
    analysis.hasEnterpriseLayout && 
    analysis.hasPageHeader && 
    analysis.hasAntdImports && 
    analysis.hasRowCol;

  if (migrationStatus) {
    log('\n\n✅ This page appears to be already migrated!', 'green');
  } else {
    log('\n\n⚠️  This page needs migration', 'yellow');
    log('Follow the suggestions above to complete the migration.', 'yellow');
  }

  log('\n📚 Resources:', 'blue');
  log('  - UI Quick Start: docs/UI_QUICK_START.md');
  log('  - UI Design System: docs/UI_DESIGN_SYSTEM.md');
  log('  - Example Page: src/modules/features/dashboard/views/DashboardPageNew.tsx');
  log('  - Migration Progress: docs/UI_MIGRATION_PROGRESS.md\n');
}

main();