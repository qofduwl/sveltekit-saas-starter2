import { nodeResolve } from '@rollup/plugin-node-resolve';
import { kebabCase, camelCase, pascalCase } from 'change-case';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function getLastMigrationNumber() {
  const migrationsDir = './supabase/migrations';
  if (!fs.existsSync(migrationsDir)) {
    return '20240101000000';
  }
  
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  if (files.length === 0) {
    return '20240101000000';
  }
  
  const lastFile = files[files.length - 1];
  const match = lastFile.match(/^(\d{14})_/);
  
  if (match) {
    const lastNumber = parseInt(match[1]);
    return (lastNumber + 1).toString().padStart(14, '0');
  }
  
  return new Date().toISOString().replace(/[-T:]/g, '').slice(0, 14);
}

function generateTimestamp() {
  return new Date().toISOString().replace(/[-T:]/g, '').slice(0, 14);
}

export default function (plop) {
  // Custom helpers
  plop.setHelper('kebabCase', kebabCase);
  plop.setHelper('camelCase', camelCase);
  plop.setHelper('pascalCase', pascalCase);
  plop.setHelper('timestamp', generateTimestamp);
  plop.setHelper('migrationNumber', getLastMigrationNumber);
  
  // SaaS Feature Slice Generator
  plop.setGenerator('saas-feature', {
    description: 'Generate a complete SaaS feature slice with migration, RLS, DTO, component, and test',
    prompts: [
      {
        type: 'input',
        name: 'featureName',
        message: 'Feature name (e.g., user-analytics, billing-insights):',
        validate: (input) => {
          if (!input) return 'Feature name is required';
          if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(input)) {
            return 'Feature name must be kebab-case (lowercase letters, numbers, and hyphens)';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'tableName',
        message: 'Database table name (plural, e.g., user_analytics, billing_insights):',
        default: (answers) => answers.featureName.replace(/-/g, '_') + 's',
        validate: (input) => {
          if (!input) return 'Table name is required';
          if (!/^[a-z][a-z0-9_]*[a-z0-9]$/.test(input)) {
            return 'Table name must be snake_case (lowercase letters, numbers, and underscores)';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'componentName',
        message: 'Component name (PascalCase, e.g., UserAnalytics, BillingInsights):',
        default: (answers) => pascalCase(answers.featureName),
        validate: (input) => {
          if (!input) return 'Component name is required';
          if (!/^[A-Z][a-zA-Z0-9]*$/.test(input)) {
            return 'Component name must be PascalCase';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'description',
        message: 'Feature description:',
        default: (answers) => `${answers.componentName} feature for SaaS application`
      },
      {
        type: 'checkbox',
        name: 'tableColumns',
        message: 'Select additional table columns:',
        choices: [
          { name: 'title (text)', value: 'title text not null' },
          { name: 'description (text)', value: 'description text' },
          { name: 'data (jsonb)', value: 'data jsonb default \'{}\'::jsonb' },
          { name: 'config (jsonb)', value: 'config jsonb default \'{}\'::jsonb' },
          { name: 'status (text)', value: 'status text default \'active\' check (status in (\'active\', \'inactive\', \'archived\'))' },
          { name: 'is_public (boolean)', value: 'is_public boolean default false' },
          { name: 'tags (text[])', value: 'tags text[] default array[]::text[]' },
          { name: 'metadata (jsonb)', value: 'metadata jsonb default \'{}\'::jsonb' }
        ]
      },
      {
        type: 'confirm',
        name: 'includeRLS',
        message: 'Include Row Level Security (RLS) policies?',
        default: true
      },
      {
        type: 'confirm',
        name: 'includeSeedData',
        message: 'Include seed data?',
        default: true
      },
      {
        type: 'confirm',
        name: 'includePlaywrightTest',
        message: 'Include Playwright smoke test?',
        default: true
      }
    ],
    actions: function(data) {
      const actions = [];
      const migrationNumber = getLastMigrationNumber();
      const timestamp = generateTimestamp();
      
      // 1. Migration file
      actions.push({
        type: 'add',
        path: 'supabase/migrations/{{migrationNumber}}_add_{{kebabCase tableName}}_table.sql',
        templateFile: 'plop-templates/migration.sql.hbs',
        data: { ...data, migrationNumber, timestamp }
      });
      
      // 2. Server DTO and load function
      actions.push({
        type: 'add',
        path: 'src/lib/dto/{{kebabCase featureName}}.ts',
        templateFile: 'plop-templates/dto.ts.hbs'
      });
      
      // 3. Client component
      actions.push({
        type: 'add',
        path: 'src/lib/components/{{componentName}}.svelte',
        templateFile: 'plop-templates/component.svelte.hbs'
      });
      
      // 4. Client utility wrapper
      actions.push({
        type: 'add',
        path: 'src/lib/utils/{{kebabCase featureName}}-client.ts',
        templateFile: 'plop-templates/client-utils.ts.hbs'
      });
      
      // 5. Route with server load function
      actions.push({
        type: 'add',
        path: 'src/routes/(admin)/{{kebabCase featureName}}/+page.server.ts',
        templateFile: 'plop-templates/page-server.ts.hbs'
      });
      
      actions.push({
        type: 'add',
        path: 'src/routes/(admin)/{{kebabCase featureName}}/+page.svelte',
        templateFile: 'plop-templates/page.svelte.hbs'
      });
      
      // 6. Playwright test if requested
      if (data.includePlaywrightTest) {
        actions.push({
          type: 'add',
          path: 'tests/{{kebabCase featureName}}.spec.ts',
          templateFile: 'plop-templates/playwright-test.ts.hbs'
        });
      }
      
      // 7. Update DatabaseDefinitions.ts
      actions.push({
        type: 'modify',
        path: 'src/DatabaseDefinitions.ts',
        pattern: /(export interface Database \{[\s\S]*?public: \{[\s\S]*?Tables: \{[\s\S]*?)(\s*\}[\s\S]*?\}[\s\S]*?\})/,
        template: '$1\n    {{tableName}}: {\n      Row: {{pascalCase featureName}}Row;\n      Insert: {{pascalCase featureName}}Insert;\n      Update: {{pascalCase featureName}}Update;\n    };$2'
      });
      
      // 8. Generate README documentation
      actions.push({
        type: 'add',
        path: 'docs/features/{{kebabCase featureName}}.md',
        templateFile: 'plop-templates/feature-docs.md.hbs'
      });
      
      return actions;
    }
  });
  
  // Quick component generator
  plop.setGenerator('component', {
    description: 'Generate a Svelte component with TypeScript',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Component name (PascalCase):',
        validate: (input) => {
          if (!input) return 'Component name is required';
          if (!/^[A-Z][a-zA-Z0-9]*$/.test(input)) {
            return 'Component name must be PascalCase';
          }
          return true;
        }
      },
      {
        type: 'list',
        name: 'type',
        message: 'Component type:',
        choices: ['basic', 'form', 'chart', 'modal', 'layout']
      }
    ],
    actions: [
      {
        type: 'add',
        path: 'src/lib/components/{{name}}.svelte',
        templateFile: 'plop-templates/components/{{type}}-component.svelte.hbs'
      }
    ]
  });
  
  // API endpoint generator
  plop.setGenerator('api', {
    description: 'Generate API endpoint with CRUD operations',
    prompts: [
      {
        type: 'input',
        name: 'resourceName',
        message: 'Resource name (kebab-case):',
        validate: (input) => {
          if (!input) return 'Resource name is required';
          if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(input)) {
            return 'Resource name must be kebab-case';
          }
          return true;
        }
      },
      {
        type: 'checkbox',
        name: 'methods',
        message: 'HTTP methods to implement:',
        choices: ['GET', 'POST', 'PUT', 'DELETE'],
        default: ['GET', 'POST']
      }
    ],
    actions: function(data) {
      const actions = [];
      
      data.methods.forEach(method => {
        actions.push({
          type: 'add',
          path: 'src/routes/api/{{kebabCase resourceName}}/+server.ts',
          templateFile: 'plop-templates/api-server.ts.hbs',
          skipIfExists: true
        });
      });
      
      return actions;
    }
  });
}
