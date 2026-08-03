# Model Context Protocol (MCP) Integration Guide

## Overview

Model Context Protocol (MCP) is an open protocol that enables AI models to interact with external tools and data sources. ColdRunners implements an MCP server to expose its capabilities to AI agents and assistants.

**Official Documentation:** https://modelcontextprotocol.io  
**Specification:** https://modelcontextprotocol.io/specification  
**TypeScript SDK:** https://github.com/modelcontextprotocol/typescript-sdk

## ColdRunners MCP Server

### Current Implementation

ColdRunners exposes **9 tools** and **6 resources** via MCP:

**Tools:**
1. `discover_businesses` - Full autonomous workflow
2. `analyze_website` - Website performance and SEO analysis
3. `discover_contacts` - Email and social profile discovery
4. `run_pagespeed` - Google PageSpeed Insights
5. `get_leads` - Retrieve stored leads with filtering
6. `export_leads` - Export to CSV, JSON, Markdown, Excel
7. `get_stats` - Platform statistics
8. `geocode_location` - Address to coordinates
9. `check_plugin_health` - Plugin health status

**Resources:**
- `leads://all` - All business leads
- `leads://hot` - HOT leads (score >= 85)
- `stats://platform` - Platform statistics
- `agents://status` - Agent status
- `plugins://health` - Plugin health
- `workflows://active` - Active workflows

### Server Implementation

```typescript
// src/server/mcp/server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

export class McpServer {
  private server: Server;
  
  constructor() {
    this.server = new Server({
      name: 'coldrunners-mcp',
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {},
        resources: {},
      }
    });
    
    this.registerHandlers();
  }
  
  private registerHandlers() {
    // List tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'discover_businesses',
          description: 'Discover businesses using Google Places API',
          inputSchema: {
            type: 'object',
            properties: {
              city: { type: 'string', description: 'City name' },
              category: { type: 'string', description: 'Business category' },
              targetCount: { type: 'number', description: 'Number of results' },
            },
            required: ['city', 'category']
          }
        },
        // ... other tools
      ]
    }));
    
    // Call tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      switch (name) {
        case 'discover_businesses':
          return await this.handleDiscoverBusinesses(args);
        case 'analyze_website':
          return await this.handleAnalyzeWebsite(args);
        // ... other handlers
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }
  
  private async handleDiscoverBusinesses(args: any) {
    const criteria: SearchCriteria = {
      city: args.city,
      category: args.category,
      targetCount: args.targetCount ?? 20,
      // ... other fields
    };
    
    const result = await workflowEngine.startWorkflow(criteria);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            workflowId: result.workflowId,
            leadCount: result.leads.length,
            hotLeads: result.leads.filter(l => l.grade === 'HOT').length,
          }, null, 2)
        }
      ]
    };
  }
}
```

### REST API Endpoints

ColdRunners also exposes MCP via REST:

```
POST /api/mcp/tools/:toolName    - Execute MCP tool
GET  /api/mcp/tools              - List all tools
GET  /api/mcp/resources          - List all resources
GET  /api/mcp/resources/:uri     - Access resource
```

### Example Usage

```bash
# List tools
curl http://localhost:3000/api/mcp/tools

# Execute tool
curl -X POST http://localhost:3000/api/mcp/tools/discover_businesses \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Toronto",
    "category": "Dental Clinic",
    "targetCount": 10
  }'

# Access resource
curl http://localhost:3000/api/mcp/resources/leads%3A%2F%2Fhot
```

## TypeScript SDK

### Installation

```bash
npm install @modelcontextprotocol/sdk
```

### Client Usage

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['dist/server/mcp-stdio.js']
});

const client = new Client({
  name: 'coldrunners-client',
  version: '1.0.0'
}, {
  capabilities: {}
});

await client.connect(transport);

// List tools
const tools = await client.listTools();
console.log(tools.tools);

// Call tool
const result = await client.callTool({
  name: 'discover_businesses',
  arguments: {
    city: 'Toronto',
    category: 'Dental Clinic',
    targetCount: 10
  }
});

console.log(result.content);
```

## FastMCP (Python)

For Python-based MCP servers, FastMCP provides a simpler API:

**Documentation:** https://github.com/jlowin/fastmcp

### Installation

```bash
pip install fastmcp
```

### Example

```python
from fastmcp import FastMCP

mcp = FastMCP("ColdRunners")

@mcp.tool()
def discover_businesses(city: str, category: str, target_count: int = 20) -> dict:
    """Discover businesses in a city"""
    # Implementation
    return {"leads": [...], "count": 10}

@mcp.resource("leads://hot")
def get_hot_leads() -> list:
    """Get all HOT leads"""
    return database.get_hot_leads()

if __name__ == "__main__":
    mcp.run()
```

## MCP Inspector

Debug and test MCP servers with the official inspector:

```bash
npx @modelcontextprotocol/inspector node dist/server/mcp-stdio.js
```

Opens a web UI at http://localhost:5173 for testing tools and resources.

## Adding New Tools

### Step 1: Define Tool Schema

```typescript
const toolDefinition = {
  name: 'my_new_tool',
  description: 'Description of what this tool does',
  inputSchema: {
    type: 'object',
    properties: {
      param1: { 
        type: 'string', 
        description: 'Parameter description' 
      },
      param2: { 
        type: 'number', 
        description: 'Another parameter',
        default: 10 
      },
    },
    required: ['param1']
  }
};
```

### Step 2: Implement Handler

```typescript
private async handleMyNewTool(args: any) {
  const { param1, param2 = 10 } = args;
  
  try {
    const result = await someService.doSomething(param1, param2);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
}
```

### Step 3: Register Handler

```typescript
this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case 'my_new_tool':
      return await this.handleMyNewTool(args);
    // ... other handlers
  }
});
```

## Adding New Resources

```typescript
this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'myresource://type',
      name: 'My Resource',
      description: 'Description',
      mimeType: 'application/json'
    }
  ]
}));

this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  if (uri === 'myresource://type') {
    const data = await database.getData();
    
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }
  
  throw new Error(`Unknown resource: ${uri}`);
});
```

## Best Practices

### Tool Design

1. **Clear naming** - Use snake_case for tool names
2. **Descriptive descriptions** - Explain what the tool does and when to use it
3. **Input validation** - Validate all inputs before processing
4. **Error handling** - Return structured errors, never throw
5. **Idempotency** - Tools should be safe to call multiple times

### Resource Design

1. **URI scheme** - Use `scheme://path` format
2. **Read-only** - Resources should not modify state
3. **MIME types** - Always specify correct MIME type
4. **Pagination** - For large datasets, implement pagination

### Security

1. **Authentication** - Validate API keys before executing tools
2. **Rate limiting** - Prevent abuse of expensive operations
3. **Input sanitization** - Prevent injection attacks
4. **Audit logging** - Log all tool executions

## Integration with AI Assistants

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "coldrunners": {
      "command": "node",
      "args": ["/path/to/coldrunners/dist/server/mcp-stdio.js"],
      "env": {
        "GOOGLE_PLACES_API_KEY": "your-key"
      }
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "coldrunners": {
      "command": "node",
      "args": ["dist/server/mcp-stdio.js"]
    }
  }
}
```

## Troubleshooting

### Tool Not Found

```bash
# List available tools
curl http://localhost:3000/api/mcp/tools
```

### Connection Refused

```bash
# Check if server is running
curl http://localhost:3000/api/health

# Check logs
docker compose logs coldrunners
```

### Invalid Arguments

- Verify input schema matches tool definition
- Check required fields are present
- Validate data types

## Resources

- **Official Docs:** https://modelcontextprotocol.io
- **Specification:** https://modelcontextprotocol.io/specification
- **TypeScript SDK:** https://github.com/modelcontextprotocol/typescript-sdk
- **Python SDK:** https://github.com/modelcontextprotocol/python-sdk
- **FastMCP:** https://github.com/jlown/fastmcp
- **MCP Inspector:** https://github.com/modelcontextprotocol/inspector
