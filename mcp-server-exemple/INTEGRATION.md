# Integrating This MCP Server with Claude Code

This guide explains how to connect your simple MCP server to Claude Code.

## Step 1: Understand the Flow

```
┌─────────────────┐
│  Claude Code    │
│   (your IDE)    │
└────────┬────────┘
         │
         │ Sends tool requests via MCP Protocol
         │
    ┌────▼─────────────┐
    │  Your MCP Server │  (server.js)
    │  (this project)  │
    └──────────────────┘
         │
         │ Executes tools & returns results
         │
```

## Step 2: Configure Claude Code

Your MCP server communicates with Claude Code through a configuration file. The setup depends on your platform:

### Option A: Using Claude Code CLI

If you're using Claude Code from the terminal:

1. **Locate or create** `~/.claude/mcp.json` (your MCP configuration file)

2. **Add your server** to the configuration:

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

3. **Restart Claude Code** to load the new server

### Option B: Using Claude Desktop App

1. Edit your Claude desktop configuration (platform-specific):
   - **macOS/Linux**: `~/.claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the server configuration:

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

## Step 3: Test the Integration

### Test in Claude Code

Once configured, your tools should be available. Try commands like:

```
"Add 5 and 3 using the add_numbers tool"
"Format this text: hello world (make it uppercase)"
"What's the current time?"
```

Claude should automatically recognize and use your tools!

### Verify Tools Are Available

Your tools are working if:
- ✅ Claude mentions the tool name in its response
- ✅ The correct tool response appears
- ✅ No "unknown tool" errors occur

## Step 4: Troubleshooting

### Server not connecting?

1. **Check the path** is correct:
   ```bash
   ls /Users/ythabti/Desktop/mcp-server-example/server.js
   ```

2. **Ensure Node.js is installed**:
   ```bash
   node --version
   ```

3. **Check dependencies are installed**:
   ```bash
   cd /Users/ythabti/Desktop/mcp-server-example
   npm install
   ```

### Tools not showing up?

1. **Check stderr output** from the server
2. **Verify the `tools/list` handler** is registered
3. **Restart Claude Code** after making changes

### Server crashes?

Add error logging to see what went wrong:

```javascript
// In server.js, add logging
console.error("Tool called:", name, "with args:", args);
```

Then check the stderr output when Claude uses the tool.

## Step 5: What's Next?

Once integrated, you can:

1. **Add more tools** to `server.js`
2. **Connect to real systems** (databases, APIs, files)
3. **Build complex workflows** where Claude orchestrates multiple tools
4. **Create specialized AI assistants** for your workflow

## Example: Adding a Tool That Reads Files

Here's how you'd extend this server to read files:

```javascript
const readFileTool = {
  name: "read_file",
  description: "Reads the contents of a text file",
  inputSchema: {
    type: "object",
    properties: {
      filepath: {
        type: "string",
        description: "Full path to the file"
      }
    },
    required: ["filepath"]
  }
};

// In the CallToolRequestSchema handler:
if (name === "read_file") {
  try {
    const fs = require("fs");
    const content = fs.readFileSync(args.filepath, "utf-8");
    return {
      content: [{
        type: "text",
        text: content
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error reading file: ${error.message}`
      }],
      isError: true
    };
  }
}
```

## Environment Setup (If Needed)

If your server needs environment variables (API keys, database URLs, etc.):

```bash
# Create a .env file in the project directory
DATABASE_URL=postgres://user:pass@localhost/db
API_KEY=your-api-key-here
```

Then load them in your server:

```javascript
import dotenv from "dotenv";
dotenv.config();

const dbUrl = process.env.DATABASE_URL;
```

## Performance Considerations

- **Keep tool responses fast** (< 1 second ideal)
- **Avoid blocking operations** unless necessary
- **Use async/await** for I/O operations
- **Handle timeouts gracefully**

## Security Considerations

⚠️ **Important**: If your server handles sensitive data:

1. **Never expose secrets** in error messages
2. **Validate all inputs** from Claude (treat it like user input)
3. **Limit file access** to specific directories
4. **Use environment variables** for sensitive config
5. **Log what Claude requests** for audit trails

Example secure file reading:

```javascript
if (name === "read_file") {
  // Only allow reading from specific directory
  const allowedDir = "/Users/ythabti/Desktop/safe-data";
  const fullPath = path.resolve(args.filepath);
  
  if (!fullPath.startsWith(allowedDir)) {
    return {
      content: [{
        type: "text",
        text: "Access denied"
      }],
      isError: true
    };
  }
  
  // Safe to read now
  // ...
}
```

## Useful Commands

```bash
# Install dependencies
npm install

# Start the server (for testing)
npm start

# Check if Node.js is installed
node --version

# List available tools (from the server logs)
npm start 2>&1 | grep "Available tools"
```

## Reference: MCP Protocol Messages

Your server handles these message types:

1. **tools/list** - Claude asks what tools are available
2. **CallTool** - Claude wants to execute a tool
3. **CallToolResult** - Your server returns the result

All communication is JSON-RPC based and handled automatically by the SDK.

---

🎉 You now have a working MCP server connected to Claude Code! Start asking Claude to use your tools!
