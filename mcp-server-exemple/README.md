# Simple MCP Server - Learning Edition

A minimal, well-commented MCP (Model Context Protocol) server designed to teach you how MCP servers work.

## What is MCP?

**Model Context Protocol** is a protocol that allows AI models (like Claude) to interact with external systems. Think of it like creating a bridge between Claude and custom tools/services you build.

```
Claude ←→ MCP Protocol ←→ Your Server
```

When Claude needs to do something, it can call your server's "tools" instead of being limited to its built-in capabilities.

## Project Structure

```
mcp-server-example/
├── package.json          # Project configuration and dependencies
├── server.js            # The MCP server (heavily commented!)
└── README.md            # This file
```

## How This Server Works

### The 3 Core Components

1. **Server Setup** (`server.js` lines 21-28)
   - Creates an MCP server instance
   - Gives it a name and version

2. **Tool Definitions** (`server.js` lines 30-80)
   - Each tool has: name, description, and input schema (what parameters it accepts)
   - The description helps Claude understand when to use the tool
   - The input schema validates that Claude provides the right parameters

3. **Tool Implementations** (`server.js` lines 90-155)
   - The actual logic that runs when Claude calls a tool
   - Processes the input and returns results
   - Must return a `TextContent` object with the result

### The Three Example Tools

#### 1. `add_numbers`
Adds two numbers together.
- **Input**: `a` (number), `b` (number)
- **Output**: The sum

#### 2. `format_text`
Formats text in different ways.
- **Input**: `text` (string), `style` (uppercase | lowercase | titlecase)
- **Output**: The formatted text

#### 3. `get_current_time`
Returns the current date and time.
- **Input**: None
- **Output**: Current ISO timestamp

## Setting Up and Running

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd /Users/ythabti/Desktop/mcp-server-example
npm install
```

### Running the Server

```bash
npm start
```

You'll see output like:
```
[MCP Server] Starting simple learning server...
[MCP Server] Available tools: add_numbers, format_text, get_current_time
[MCP Server] Successfully connected and ready to receive requests!
```

The server is now running and waiting for Claude to call its tools.

## How to Connect This Server to Claude Code

In Claude Code, you can configure this server to be available to Claude by:

1. Create a configuration file for your MCP server
2. Point Claude Code to your server
3. Claude can now call your tools!

## Key Concepts to Learn

### 1. **Request Handlers**
```javascript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // Handle tool calls here
});
```
This tells the server what to do when Claude wants to call a tool.

### 2. **Tool Response Format**
All tool results must follow this structure:
```javascript
{
  content: [
    {
      type: "text",
      text: "Your response here"
    }
  ]
}
```

### 3. **Input Validation**
The `inputSchema` uses JSON Schema to validate what Claude provides:
```javascript
{
  type: "object",
  properties: {
    parameter_name: {
      type: "string",  // or number, boolean, etc.
      description: "What this parameter does"
    }
  },
  required: ["parameter_name"]
}
```

### 4. **Error Handling**
Return `isError: true` to signal a failed tool call:
```javascript
{
  content: [{
    type: "text",
    text: "Error message"
  }],
  isError: true
}
```

## Next Steps - Extending This Server

Try adding these features:

### 1. **Add a Multiply Tool**
```javascript
// Define the tool
const multiplyTool = {
  name: "multiply_numbers",
  description: "Multiplies two numbers",
  inputSchema: {
    type: "object",
    properties: {
      a: { type: "number" },
      b: { type: "number" }
    },
    required: ["a", "b"]
  }
};

// Register it in the tools/list handler
// Add the implementation in the CallToolRequest handler
```

### 2. **Add a Weather Tool** (mock data)
Return fake weather data to understand how tools work with real-world data.

### 3. **Add File Reading Tool**
Read files from the system and return their contents.

### 4. **Add Database Tool**
Connect to a database (SQLite, PostgreSQL, etc.) and run queries.

## Common Mistakes to Avoid

❌ **Forgetting to register tools** in the `tools/list` handler
✅ Use the same tool names in definition and implementation

❌ **Wrong response format**
✅ Always wrap responses in `{ content: [{type: "text", text: "..."}] }`

❌ **Not describing tools properly**
✅ Clear descriptions help Claude use tools correctly

❌ **Missing required fields in schema**
✅ Mark all required parameters with `"required": ["field1", "field2"]`

## Debugging Tips

1. **Check stderr output**
   - The server logs to stderr (console.error) so you can see what's happening

2. **Add logging**
   - Add `console.error()` statements to track what tools are being called

3. **Test responses**
   - Verify your response format matches the expected structure

## Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [MCP SDK for Node.js](https://github.com/modelcontextprotocol/sdk-typescript)
- [JSON Schema Reference](https://json-schema.org/)

## Summary

This simple MCP server demonstrates:
- ✅ How to define tools Claude can use
- ✅ How to handle tool calls
- ✅ How to return results in the proper format
- ✅ The basic protocol structure
- ✅ Input validation using JSON schemas

Use this as a foundation to build more complex servers that connect Claude to your custom systems!
