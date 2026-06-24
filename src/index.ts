#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { AppleAdsClient, createClientFromEnv } from "./client.js";
import { registerTools } from "./mcp/registry.js";
import { allTools } from "./tools/index.js";

/** Lazily create and cache the API client so the server can start without credentials. */
function createClientProvider(): () => AppleAdsClient {
  let client: AppleAdsClient | null = null;
  return () => {
    if (!client) client = createClientFromEnv();
    return client;
  };
}

async function main(): Promise<void> {
  const getClient = createClientProvider();

  // Warn early if credentials are missing, but still start so tools can list.
  try {
    getClient();
  } catch {
    console.error("Note: Apple Ads credentials not fully configured. Set environment variables to use tools.");
  }

  const server = new Server(
    { name: "apple-search-ads-mcp", version: "2.0.0" },
    { capabilities: { tools: {} } },
  );

  registerTools(server, getClient, allTools);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Apple Search Ads MCP server running on stdio (${allTools.length} tools)`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
