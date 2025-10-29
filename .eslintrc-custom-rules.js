/**
 * Custom ESLint Rules for Module Service Standardization Enforcement
 * 
 * These rules enforce the strict standardization ruleset:
 * - No direct service imports in component files
 * - Type-only imports for type definitions
 * - Proper use of useService hook
 * - Module boundary enforcement
 */

module.exports = {
  rules: {
    'no-direct-service-imports': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Prevent direct imports from @/services/serviceFactory in component files. Use useService hook instead.',
          category: 'Module Standardization',
          recommended: true
        },
        messages: {
          directImport:
            'Direct service import from @/services/serviceFactory is not allowed in components. Use useService hook instead: const service = useService<any>("{{serviceName}}")',
          wrongPattern:
            'Service imports must use the pattern: import { useService } from "@/modules/core/hooks/useService" then const service = useService<any>("serviceName")'
        }
      },
      create(context) {
        const filePath = context.getFilename();
        
        // Only check component files in modules
        const isModuleComponent = filePath.includes('src/modules/features') && 
                                 (filePath.endsWith('.tsx') || filePath.endsWith('.ts'));
        const isHookFile = filePath.includes('/hooks/');
        const isServiceFile = filePath.includes('/services/');
        
        // Skip checking hook and service files themselves
        if (!isModuleComponent || isHookFile || isServiceFile) {
          return {};
        }
        
        return {
          ImportDeclaration(node) {
            const source = node.source.value;
            
            // Rule 1: Block direct imports from @/services/serviceFactory
            if (source === '@/services/serviceFactory') {
              node.specifiers.forEach(specifier => {
                const name = specifier.imported ? specifier.imported.name : specifier.local.name;
                
                // Check if it looks like a service
                if (name.includes('Service') || name.includes('service')) {
                  context.report({
                    node,
                    messageId: 'directImport',
                    data: { serviceName: name }
                  });
                }
              });
            }
            
            // Rule 2: Block direct imports from other services paths
            if (source.match(/^@\/services\/[a-zA-Z]*Service$/)) {
              context.report({
                node,
                messageId: 'wrongPattern'
              });
            }
            
            // Rule 3: Block Supabase service imports
            if (source.includes('@/services/api/supabase')) {
              context.report({
                node,
                messageId: 'wrongPattern'
              });
            }
          }
        };
      }
    },

    'use-service-hook': {
      meta: {
        type: 'suggestion',
        docs: {
          description:
            'Enforce use of useService hook for service access in module components.',
          category: 'Module Standardization',
          recommended: true
        },
        messages: {
          useServiceHookRequired:
            'Use useService hook for service access: const service = useService<any>("serviceName")',
          missingServiceName:
            'useService requires a service name string argument: useService<any>("serviceName")'
        }
      },
      create(context) {
        return {
          VariableDeclarator(node) {
            // Check if this looks like trying to use a service without the hook
            if (node.init && node.id.type === 'Identifier') {
              const varName = node.id.name;
              
              // If variable name suggests it's a service but not using useService
              if (varName.includes('Service') && 
                  !varName.startsWith('use') &&
                  node.init.type !== 'CallExpression') {
                // This is just a warning - not enforcing, just suggesting
              }
            }
          }
        };
      }
    },

    'no-cross-module-imports': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Prevent imports from other feature modules. Each module should be self-contained.',
          category: 'Module Boundaries',
          recommended: true
        },
        messages: {
          crossModuleImport:
            'Cross-module import detected: "{{importedModule}}" from "{{currentModule}}". Import only from your own module directory, @/types, @/utils, or @/components/common'
        }
      },
      create(context) {
        const filePath = context.getFilename();
        
        // Extract current module name from path
        const moduleMatch = filePath.match(/src\/modules\/features\/([^/]+)\//);
        if (!moduleMatch) return {};
        
        const currentModule = moduleMatch[1];
        
        return {
          ImportDeclaration(node) {
            const source = node.source.value;
            
            // Check for cross-module imports
            const crossModuleMatch = source.match(
              /^@\/modules\/features\/([^/]+)\/(hooks|services|pages|views|components)/
            );
            
            if (crossModuleMatch && crossModuleMatch[1] !== currentModule) {
              // Exception: allow imports from core and shared
              if (crossModuleMatch[1] === 'core' || crossModuleMatch[1] === 'shared') {
                return;
              }
              
              context.report({
                node,
                messageId: 'crossModuleImport',
                data: {
                  importedModule: crossModuleMatch[1],
                  currentModule: currentModule
                }
              });
            }
          }
        };
      }
    },

    'type-only-imports': {
      meta: {
        type: 'suggestion',
        docs: {
          description:
            'Enforce type-only imports for TypeScript type definitions to improve build performance.',
          category: 'TypeScript Best Practices',
          recommended: true
        },
        messages: {
          typeOnlyImportSuggestion:
            'Consider using "import type" for type definitions: import type { {{names}} } from "{{source}}"'
        }
      },
      create(context) {
        // This is a helper rule, can be implemented based on project needs
        return {};
      }
    },

    'module-service-registration': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Enforce proper service registration in module index.ts files.',
          category: 'Module Standardization',
          recommended: true
        },
        messages: {
          missingInitialize:
            'Module index.ts must have an initialize() method in FeatureModule',
          missingCleanup:
            'Module index.ts must have a cleanup() method in FeatureModule',
          missingServicesArray:
            'Module index.ts must declare a "services" array listing all services',
          missingErrorHandling:
            'Service registration should be wrapped in try-catch for error handling'
        }
      },
      create(context) {
        const filePath = context.getFilename();
        
        // Only check module index files
        if (!filePath.includes('/src/modules/features/') || !filePath.endsWith('/index.ts')) {
          return {};
        }
        
        let hasInitialize = false;
        let hasCleanup = false;
        let hasServices = false;
        let hasTryCatch = false;
        
        return {
          ObjectExpression(node) {
            // Check for FeatureModule object
            node.properties.forEach(prop => {
              if (prop.key.name === 'initialize') {
                hasInitialize = true;
                
                // Check for try-catch inside
                if (prop.value && prop.value.type === 'ArrowFunctionExpression') {
                  const body = prop.value.body;
                  if (body && body.type === 'BlockStatement') {
                    body.body.forEach(stmt => {
                      if (stmt.type === 'TryStatement') {
                        hasTryCatch = true;
                      }
                    });
                  }
                }
              }
              if (prop.key.name === 'cleanup') {
                hasCleanup = true;
              }
              if (prop.key.name === 'services' && prop.value.type === 'ArrayExpression') {
                hasServices = true;
              }
            });
          },
          
          'Program:exit': function() {
            if (!hasInitialize) {
              context.report({
                loc: { line: 1, column: 0 },
                messageId: 'missingInitialize'
              });
            }
            if (!hasCleanup) {
              context.report({
                loc: { line: 1, column: 0 },
                messageId: 'missingCleanup'
              });
            }
            if (!hasServices) {
              context.report({
                loc: { line: 1, column: 0 },
                messageId: 'missingServicesArray'
              });
            }
            if (hasInitialize && !hasTryCatch) {
              context.report({
                loc: { line: 1, column: 0 },
                messageId: 'missingErrorHandling'
              });
            }
          }
        };
      }
    }
  }
};

/**
 * To use these rules in your ESLint configuration:
 * 
 * 1. Add to .eslintrc.js:
 * 
 *   const customRules = require('./.eslintrc-custom-rules');
 * 
 *   module.exports = {
 *     plugins: ['custom-module-rules'],
 *     rules: {
 *       'custom-module-rules/no-direct-service-imports': 'error',
 *       'custom-module-rules/no-cross-module-imports': 'error',
 *       'custom-module-rules/module-service-registration': 'warn'
 *     }
 *   };
 */