#!/usr/bin/env node

/**
 * Simple MCP (Model Context Protocol) Server
 *
 * This is a basic educational MCP server that demonstrates:
 * 1. How to initialize an MCP server using McpServer
 * 2. How to register and implement tools
 * 3. How to handle tool calls
 * 4. The basic protocol structure
 *
 * MCP allows Claude (and other AI models) to interact with external systems
 * through a standardized protocol. This server exposes "tools" that Claude can call.
 */

// Import the MCP server framework
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";

// ============================================================================
// STEP 1: CREATE AND CONFIGURE THE SERVER
// ============================================================================

// Initialize the MCP server with McpServer (high-level API)
// This is simpler than the lower-level Server class
// It automatically handles tools capability registration
const mcpServer = new McpServer({
  name: "simple-learning-server",
  version: "1.0.0",
});

// ============================================================================
// STEP 2: REGISTER TOOLS
// ============================================================================

/**
 * Tool 1: Add Numbers
 *
 * mcpServer.registerTool() is the high-level way to add tools.
 * It takes three parameters:
 * 1. name: the tool identifier (used when Claude calls it)
 * 2. definition: {description, inputSchema}
 * 3. handler: async function that executes when Claude calls the tool
 */
mcpServer.registerTool(
  "add_numbers",
  {
    description: "Adds two numbers together and returns the sum",
    // inputSchema: defines what parameters Claude can pass
    // Using Zod to create the schema - this validates Claude's input
    inputSchema: {
      a: z.number().describe("The first number"),
      b: z.number().describe("The second number"),
    },
  },
  async ({ a, b }) => {
    // This function is called when Claude uses this tool
    // The parameters are automatically validated against the schema
    const result = a + b;

    // Tools must return an array of TextContent objects
    return {
      content: [
        {
          type: "text",
          text: `${a} + ${b} = ${result}`,
        },
      ],
    };
  }
);

/**
 * Tool 2: Format Text
 *
 * This demonstrates how to use enums to restrict parameter values.
 * Claude will only be allowed to choose from the predefined styles.
 */
mcpServer.registerTool(
  "format_text",
  {
    description:
      "Formats text by converting to uppercase, lowercase, or title case",
    inputSchema: {
      text: z.string().describe("The text to format"),
      // enum() restricts the allowed values
      style: z.enum(["uppercase", "lowercase", "titlecase"]).describe("The formatting style to apply"),
    },
  },
  async ({ text, style }) => {
    let formatted;

    // Apply the requested formatting
    if (style === "uppercase") {
      formatted = text.toUpperCase();
    } else if (style === "lowercase") {
      formatted = text.toLowerCase();
    } else if (style === "titlecase") {
      // Simple title case: capitalize first letter of each word
      formatted = text
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }

    return {
      content: [
        {
          type: "text",
          text: `Formatted (${style}): ${formatted}`,
        },
      ],
    };
  }
);

/**
 * Tool 3: Get Current Time
 */
mcpServer.registerTool(
  "get_current_time",
  {
    description: "Returns the current date and time in ISO format",
    // This tool takes no parameters, so inputSchema is empty
    inputSchema: {},
  },
  async () => {
    const now = new Date();

    return {
      content: [
        {
          type: "text",
          text: `Current time: ${now.toISOString()}`,
        },
      ],
    };
  }
);

/**
 * Tool 4: Get Current Date
 */
mcpServer.registerTool(
  "get_current_date",
  {
    description: "Returns the current date in YYYY-MM-DD format",
    inputSchema: {},
  },
  async () => {
    const now = new Date();
    const dateString = now.toISOString().split("T")[0]; // YYYY-MM-DD

    return {
      content: [
        {
          type: "text",
          text: `Current date: ${dateString}`,
        },
      ],
    };
  }
);

/**
 * Tool 5: Multiply Numbers
 *
 * This demonstrates how to work with arrays.
 * Claude can pass multiple numbers and this tool multiplies them all together.
 */
mcpServer.registerTool(
  "multiply_numbers",
  {
    description: "Multiplies all provided numbers together and returns the product",
    inputSchema: {
      // array of numbers
      numbers: z.array(z.number()).describe("Array of numbers to multiply"),
    },
  },
  async ({ numbers }) => {
    // Use reduce to multiply all numbers together
    // Start with 1 (multiplicative identity) and multiply each number
    const product = numbers.reduce((acc, num) => acc * num, 1);

    return {
      content: [
        {
          type: "text",
          text: `Product of [${numbers.join(", ")}] = ${product}`,
        },
      ],
    };
  }
);

/**
 * Tool 6: Check Palindrome
 *
 * Checks if a string reads the same forwards and backwards.
 * Example: "racecar" is a palindrome
 */
mcpServer.registerTool(
  "is_palindrome",
  {
    description: "Checks if a given string is a palindrome",
    inputSchema: {
      text: z.string().describe("The text to check for palindrome"),
    },
  },
  async ({ text }) => {
    // Remove spaces and special characters, convert to lowercase
    const normalized = text.replace(/[\W_]/g, "").toLowerCase();
    // Check if it's the same forwards and backwards
    const isPalindrome =
      normalized === normalized.split("").reverse().join("");

    return {
      content: [
        {
          type: "text",
          text: `"${text}" is ${isPalindrome ? "" : "not "}a palindrome.`,
        },
      ],
    };
  }
);

/**
 * Tool 7: Check Pangram
 *
 * Checks if a string contains every letter of the alphabet.
 * Example: "The quick brown fox jumps over the lazy dog" is a pangram
 */
mcpServer.registerTool(
  "is_pangram",
  {
    description: "Checks if a given string is a pangram",
    inputSchema: {
      text: z.string().describe("The text to check for pangram"),
    },
  },
  async ({ text }) => {
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const normalized = text.toLowerCase();

    // Check if every letter of the alphabet appears in the text
    const isPangram = alphabet.split("").every((char) =>
      normalized.includes(char)
    );

    return {
      content: [
        {
          type: "text",
          text: `"${text}" is ${isPangram ? "" : "not "}a pangram.`,
        },
      ],
    };
  }
);

// ============================================================================
// STEP 3: START THE SERVER
// ============================================================================

/**
 * Start the MCP server
 *
 * The server connects to Claude via StdioServerTransport
 * (standard input/output - the communication channel)
 */
async function startServer() {
  console.error("[MCP Server] Starting simple learning server...");
  console.error(
    "[MCP Server] Available tools: add_numbers, format_text, get_current_time, get_current_date, multiply_numbers, is_palindrome, is_pangram"
  );

  try {
    // Create the stdio transport for communication
    const transport = new StdioServerTransport();

    // Connect the MCP server to the transport
    // This starts listening for requests from Claude
    await mcpServer.connect(transport);

    console.error("[MCP Server] Successfully connected and ready to receive requests!");
  } catch (error) {
    console.error("[MCP Server] Error starting server:", error);
    process.exit(1);
  }
}

// Start the server when this file is run
startServer();
