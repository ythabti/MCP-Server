# Getting Started with Your MCP Server

## ✅ Your Server is Ready!

Your MCP server is now fully functional and running. Here's what happened:

### What You Just Created

A complete, working MCP server with **7 example tools**:
1. **add_numbers** - Adds two numbers
2. **format_text** - Formats text (uppercase/lowercase/titlecase)
3. **get_current_time** - Returns current timestamp
4. **get_current_date** - Returns current date
5. **multiply_numbers** - Multiplies multiple numbers
6. **is_palindrome** - Checks if text is a palindrome
7. **is_pangram** - Checks if text contains all alphabet letters

## Key Learning Points

### How the Server Works

```javascript
// 1. Create server
const mcpServer = new McpServer({
  name: "simple-learning-server",
  version: "1.0.0",
});

// 2. Register a tool
mcpServer.registerTool(
  "tool_name",
  {
    description: "What it does",
    inputSchema: {
      param1: z.string().describe("Parameter description"),
    },
  },
  async ({ param1 }) => {
    // Tool implementation
    return {
      content: [{ type: "text", text: "Result" }],
    };
  }
);

// 3. Connect to transport
const transport = new StdioServerTransport();
await mcpServer.connect(transport);
```

### Important API Differences

**Wrong (Low-level API - causes errors):**
```javascript
const server = new Server({...});
server.setRequestHandler(CallToolRequestSchema, ...);
```

**Right (High-level API - works great):**
```javascript
const mcpServer = new McpServer({...});
mcpServer.registerTool("name", definition, handler);
```

Always use `McpServer` with `registerTool()` for simpler, more reliable code!

## Testing Your Server

### 1. Run the Server
```bash
cd /Users/ythabti/Desktop/mcp-server-example
npm start
```

You'll see:
```
[MCP Server] Starting simple learning server...
[MCP Server] Available tools: add_numbers, format_text, ...
[MCP Server] Successfully connected and ready to receive requests!
```

### 2. Connect to Claude Code

Once running, add to your Claude Code config:

**~/.claude/mcp.json** or **~/.claude/claude_desktop_config.json**:
```json
{
  "mcpServers": {
    "simple-learning-server": {
      "command": "node",
      "args": ["/Users/ythabti/Desktop/mcp-server-example/server.js"]
    }
  }
}
```

### 3. Ask Claude to Use Your Tools

In Claude Code, try:
- "Add 5 and 3 using the add_numbers tool"
- "Format 'hello world' to uppercase"
- "Is 'racecar' a palindrome?"
- "Is 'The quick brown fox jumps over the lazy dog' a pangram?"

## Common Patterns

### 1. Tool with No Parameters
```javascript
inputSchema: {}
```

### 2. Tool with Multiple Parameters
```javascript
inputSchema: {
  name: z.string(),
  age: z.number(),
}
```

### 3. Tool with Array
```javascript
inputSchema: {
  items: z.array(z.string()),
}
```

### 4. Tool with Limited Choices
```javascript
inputSchema: {
  color: z.enum(["red", "green", "blue"]),
}
```

### 5. Tool with Optional Parameters
```javascript
inputSchema: {
  required_param: z.string(),
  optional_param: z.string().optional(),
}
```

## Next Steps - Extend Your Server

### Add a File Reading Tool
```javascript
import * as fs from "fs";

mcpServer.registerTool(
  "read_file",
  {
    description: "Reads a text file",
    inputSchema: {
      filepath: z.string(),
    },
  },
  async ({ filepath }) => {
    try {
      const content = fs.readFileSync(filepath, "utf-8");
      return {
        content: [{ type: "text", text: content }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);
```

### Add a Database Query Tool
```javascript
mcpServer.registerTool(
  "query_database",
  {
    description: "Query the database",
    inputSchema: {
      sql: z.string(),
    },
  },
  async ({ sql }) => {
    // Connect to your database and execute query
    const result = await db.query(sql);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);
```

### Add an API Call Tool
```javascript
mcpServer.registerTool(
  "fetch_api",
  {
    description: "Fetch data from an API",
    inputSchema: {
      url: z.string().url(),
    },
  },
  async ({ url }) => {
    const response = await fetch(url);
    const data = await response.json();
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);
```

## Troubleshooting

**Server won't start?**
- Check Node.js is installed: `node --version`
- Check dependencies: `npm install`
- Check for syntax errors: The error will be shown in console

**Claude can't find the tools?**
- Restart Claude Code after adding to config
- Make sure the path in config is correct
- Check the server is actually running

**Tool not working as expected?**
- Check the inputSchema matches what you're sending
- Add `console.error()` logging to debug
- Verify the return format is correct

## Files in This Project

```
/mcp-server-example/
├── server.js           ← Main MCP server (read this to learn!)
├── package.json        ← Dependencies  
├── README.md           ← Full documentation
├── INTEGRATION.md      ← How to integrate with Claude Code
├── GETTING_STARTED.md  ← This file
└── node_modules/       ← Dependencies (created by npm install)
```

## Resources

- [MCP Official Docs](https://modelcontextprotocol.io/)
- [MCP SDK GitHub](https://github.com/modelcontextprotocol/sdk-typescript)
- [Zod Documentation](https://zod.dev/) - For input validation schemas

---

🎉 **You now have a working MCP server!** Start building tools to extend Claude's capabilities!
