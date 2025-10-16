/**
 * File Content Validator
 * Comprehensive validation for TypeScript/React files
 */

import { validateFileContent, hasUnicodeEscapeErrors, formatCode, CodeQualityIssue } from './codeQuality';

export interface FileValidationResult {
  filePath: string;
  isValid: boolean;
  hasUnicodeEscapes: boolean;
  issues: CodeQualityIssue[];
  originalContent: string;
  fixedContent?: string;
  suggestions: string[];
}

export interface BatchValidationResult {
  totalFiles: number;
  validFiles: number;
  invalidFiles: number;
  results: FileValidationResult[];
  summary: string;
}

/**
 * Validates a single file for unicode escapes and code quality
 */
export async function validateFile(filePath: string, content: string): Promise<FileValidationResult> {
  const hasEscapes = hasUnicodeEscapeErrors(content);
  const validation = validateFileContent(content, filePath);
  
  const suggestions: string[] = [];
  
  if (hasEscapes) {
    suggestions.push('Run auto-fix to remove unicode escape sequences');
  }
  
  if (!validation.isValid) {
    suggestions.push('Review and fix the reported code quality issues');
    suggestions.push('Use proper string formatting and JSX syntax');
  }
  
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    suggestions.push('Ensure TypeScript/React best practices are followed');
  }
  
  return {
    filePath,
    isValid: validation.isValid && !hasEscapes,
    hasUnicodeEscapes: hasEscapes,
    issues: validation.issues,
    originalContent: content,
    fixedContent: validation.fixedContent,
    suggestions
  };
}

/**
 * Validates multiple files in batch
 */
export async function validateFiles(files: { path: string; content: string }[]): Promise<BatchValidationResult> {
  const results: FileValidationResult[] = [];
  
  for (const file of files) {
    const result = await validateFile(file.path, file.content);
    results.push(result);
  }
  
  const validFiles = results.filter(r => r.isValid).length;
  const invalidFiles = results.length - validFiles;
  
  const summary = generateBatchSummary(results);
  
  return {
    totalFiles: results.length,
    validFiles,
    invalidFiles,
    results,
    summary
  };
}

/**
 * Generates a summary report for batch validation
 */
function generateBatchSummary(results: FileValidationResult[]): string {
  const totalFiles = results.length;
  const validFiles = results.filter(r => r.isValid).length;
  const invalidFiles = totalFiles - validFiles;
  const filesWithEscapes = results.filter(r => r.hasUnicodeEscapes).length;
  
  let summary = `📊 Validation Summary:
`;
  summary += `Total Files: ${totalFiles}
`;
  summary += `Valid Files: ${validFiles} ✅
`;
  summary += `Invalid Files: ${invalidFiles} ❌
`;
  summary += `Files with Unicode Escapes: ${filesWithEscapes} 🔧

`;
  
  if (invalidFiles > 0) {
    summary += `❌ Files with Issues:
`;
    results.filter(r => !r.isValid).forEach(result => {
      summary += `  - ${result.filePath} (${result.issues.length} issues)
`;
    });
    summary += '
';
  }
  
  if (filesWithEscapes > 0) {
    summary += `🔧 Files with Unicode Escapes:
`;
    results.filter(r => r.hasUnicodeEscapes).forEach(result => {
      summary += `  - ${result.filePath}
`;
    });
    summary += '
';
  }
  
  if (validFiles === totalFiles) {
    summary += `🎉 All files passed validation!`;
  } else {
    summary += `⚠️  ${invalidFiles} files need attention.`;
  }
  
  return summary;
}

/**
 * Auto-fixes files with unicode escape issues
 */
export async function autoFixFile(filePath: string, content: string): Promise<string> {
  const fixedContent = formatCode(content);
  return fixedContent;
}

/**
 * Validates file extensions that should be checked
 */
export function shouldValidateFile(filePath: string): boolean {
  const validExtensions = ['.ts', '.tsx', '.js', '.jsx'];
  return validExtensions.some(ext => filePath.endsWith(ext));
}

/**
 * Scans directory for files that need validation
 */
export function getFilesToValidate(filePaths: string[]): string[] {
  return filePaths.filter(shouldValidateFile);
}

/**
 * Generates detailed validation report
 */
export function generateDetailedReport(result: FileValidationResult): string {
  let report = `📄 File: ${result.filePath}
`;
  report += `Status: ${result.isValid ? '✅ Valid' : '❌ Invalid'}
`;
  report += `Unicode Escapes: ${result.hasUnicodeEscapes ? '🔧 Found' : '✅ None'}
`;
  report += `Issues: ${result.issues.length}

`;
  
  if (result.issues.length > 0) {
    report += `🔍 Issues Found:
`;
    result.issues.forEach((issue, index) => {
      report += `${index + 1}. Line ${issue.line}, Column ${issue.column}
`;
      report += `   Type: ${issue.type} [${issue.severity}]
`;
      report += `   Message: ${issue.message}
`;
      report += `   Suggestion: ${issue.suggestion}

`;
    });
  }
  
  if (result.suggestions.length > 0) {
    report += `💡 Suggestions:
`;
    result.suggestions.forEach((suggestion, index) => {
      report += `${index + 1}. ${suggestion}
`;
    });
    report += '
';
  }
  
  if (result.fixedContent && result.fixedContent !== result.originalContent) {
    report += `🔧 Auto-fix available - content can be automatically corrected.
`;
  }
  
  return report;
}

/**
 * Validates React component structure
 */
export function validateReactComponent(content: string): CodeQualityIssue[] {
  const issues: CodeQualityIssue[] = [];
  const lines = content.split('
');
  
  lines.forEach((line, lineIndex) => {
    // Check for proper import statements
    if (line.includes('import') && line.includes('\
')) {
      issues.push({
        line: lineIndex + 1,
        column: line.indexOf('\
') + 1,
        type: 'unicode_escape',
        message: 'Import statement contains escaped newline',
        suggestion: 'Remove \
 from import statement',
        severity: 'error'
      });
    }
    
    // Check for proper JSX formatting
    if (line.includes('className="')) {
      issues.push({
        line: lineIndex + 1,
        column: line.indexOf('className="') + 1,
        type: 'escaped_quote',
        message: 'className attribute has escaped quotes',
        suggestion: 'Use proper quote nesting: className="..."',
        severity: 'error'
      });
    }
  });
  
  return issues;
}

/**
 * Pre-commit validation hook
 */
export async function preCommitValidation(files: { path: string; content: string }[]): Promise<{
  canCommit: boolean;
  report: string;
  fixableFiles: string[];
}> {
  const filesToCheck = files.filter(f => shouldValidateFile(f.path));
  
  if (filesToCheck.length === 0) {
    return {
      canCommit: true,
      report: '✅ No files to validate for unicode escapes.',
      fixableFiles: []
    };
  }
  
  const batchResult = await validateFiles(filesToCheck);
  const canCommit = batchResult.invalidFiles === 0;
  const fixableFiles = batchResult.results
    .filter(r => r.hasUnicodeEscapes || !r.isValid)
    .map(r => r.filePath);
  
  let report = batchResult.summary;
  
  if (!canCommit) {
    report += '

🚫 COMMIT BLOCKED: Files contain unicode escape errors or code quality issues.
';
    report += '🔧 Run the auto-fix command to resolve these issues before committing.
';
  }
  
  return {
    canCommit,
    report,
    fixableFiles
  };
}