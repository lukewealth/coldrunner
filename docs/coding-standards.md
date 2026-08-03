# Coding Standards

## Language

- TypeScript 5.8+ with strict mode
- ES2022 target
- ES modules (`"type": "module"`)
- No `any` types unless absolutely necessary (plugin params, AI responses)

## File Organization

```
src/server/
├── module-name/
│   ├── index.ts          # Public exports
│   ├── types.ts          # Module-specific types
│   ├── service.ts        # Business logic
│   └── utils.ts          # Helper functions
```

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `master-planner.ts` |
| Classes | PascalCase | `MasterPlannerAgent` |
| Functions | camelCase | `executeSearch` |
| Constants | UPPER_SNAKE | `MAX_CONCURRENT_AGENTS` |
| Types/Interfaces | PascalCase | `BusinessLead` |
| Enums | PascalCase | `LeadGrade` |
| Enum values | UPPER_SNAKE | `'HOT'` |
| Variables | camelCase | `searchCriteria` |
| API routes | kebab-case | `/api/agents/run-search` |
| MCP tools | snake_case | `discover_businesses` |
| Resource URIs | scheme://path | `leads://all` |

## Code Style

### No Comments

Do not add comments unless explaining non-obvious business logic or regulatory requirements.

### Imports

```typescript
// External packages first
import express from 'express';
import dotenv from 'dotenv';

// Internal modules second
import { pluginRegistry } from './plugins';
import { masterPlanner } from './agents';

// Types last
import { SearchCriteria, BusinessLead } from './types';
```

### Error Handling

```typescript
// Always catch and return structured errors
try {
  const result = await doSomething();
  return { success: true, data: result };
} catch (err: any) {
  return { success: false, error: err.message };
}
```

### Async/Await

Always use async/await. No `.then()` chains.

```typescript
// Good
async function fetchData(): Promise<Data> {
  const result = await api.get('/data');
  return result.data;
}

// Bad
function fetchData() {
  return api.get('/data').then(r => r.data);
}
```

## Type Definitions

### Backend Types

All backend types in `src/server/types.ts`:

```typescript
// Use string literal unions for enums
type LeadGrade = 'HOT' | 'WARM' | 'COLD';
type LeadStatus = 'New' | 'Qualified' | 'Contacted' | 'Meeting Set' | 'Converted' | 'Archived';

// Use interfaces for objects
interface BusinessLead {
  id: string;
  name: string;
  // ...
}

// Use type for unions and intersections
type AgentType = 'master-planner' | 'google-places' | 'website-analyzer';
```

### Frontend Types

All frontend types in `src/types.ts`. Keep separate from backend types to allow independent evolution.

## API Design

### RESTful Routes

```
GET    /api/resource          # List
GET    /api/resource/:id      # Get one
POST   /api/resource          # Create
PUT    /api/resource/:id      # Update
DELETE /api/resource/:id      # Delete
```

### Response Format

```typescript
// Success
res.json({ data: result });

// Error
res.status(400).json({ error: 'Message', details: '...' });

// List with count
res.json({ items: [...], total: 42 });
```

## Plugin Pattern

```typescript
export class MyPlugin implements Plugin {
  name = 'my-plugin';
  version = '1.0.0';
  description = 'What this plugin does';

  async initialize(): Promise<void> { }
  async execute(params: any): Promise<PluginResult> { }
  async healthCheck(): Promise<boolean> { }
}
```

## Agent Pattern

```typescript
export class MyAgent {
  name = 'My Agent';
  description = 'What this agent does';

  async execute(
    context: AgentContext,
  ): Promise<AgentResult> {
    context.onLog({
      agent: this.name,
      level: 'info',
      message: 'Starting work...',
    });

    // Process context.leads
    // Update context.leads with results

    return {
      success: true,
      itemsProcessed: context.leads.length,
    };
  }
}
```

## Testing (Future)

- Framework: Vitest
- File naming: `*.test.ts`
- Place tests adjacent to source files
- Mock external APIs
- Test agent logic in isolation
- Test plugin error handling

## Git Conventions

### Commit Messages

```
feat: add new agent for revenue estimation
fix: resolve duplicate detection edge case
docs: update API reference for export endpoint
refactor: extract scoring logic to separate module
chore: update dependencies
```

### Branch Naming

```
feature/agent-revenue-estimation
fix/duplicate-detection-edge-case
docs/api-reference-update
```

## Performance Guidelines

1. Use `Map` over `Array` for frequent lookups
2. Avoid unnecessary object spreads in loops
3. Batch API calls where possible
4. Use `Promise.all()` for parallel operations
5. Limit array operations (filter, map) chains to 3 levels
6. Avoid synchronous file I/O
