import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { AppleAdsClient } from "../client.js";
import { zodToInputSchema } from "./schema.js";

/**
 * A single MCP tool: a zod schema (used both for validation and to generate the
 * client-facing JSON Schema) plus a handler that returns raw data. The registry
 * handles validation, credential checks, serialization, and error wrapping — so
 * handlers stay small and pure, which makes them easy to unit test.
 */
export interface ToolDescriptor<T = unknown> {
  name: string;
  description: string;
  schema: z.ZodType<T>;
  handler: (client: AppleAdsClient, args: T) => Promise<unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
  };
}

/** Identity helper that preserves the inferred arg type for a tool's handler. */
export function defineTool<T>(descriptor: ToolDescriptor<T>): ToolDescriptor<T> {
  return descriptor;
}

const CREDENTIAL_ERROR =
  "Apple Ads credentials not configured. Please set: APPLE_ADS_CLIENT_ID, " +
  "APPLE_ADS_TEAM_ID, APPLE_ADS_KEY_ID, APPLE_ADS_PRIVATE_KEY_PATH, APPLE_ADS_ORG_ID";

function textResult(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

function errorResult(message: string) {
  return { ...textResult(`Error: ${message}`), isError: true };
}

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("; ");
}

/**
 * Wire a list of tools onto an MCP server. `getClient` lazily resolves the API
 * client so the server can start (and list tools) even without credentials.
 */
export function registerTools(
  server: Server,
  getClient: () => AppleAdsClient,
  tools: ToolDescriptor[],
): void {
  const byName = new Map(tools.map((t) => [t.name, t]));

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: zodToInputSchema(t.schema),
      ...(t.annotations ? { annotations: t.annotations } : {}),
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: rawArgs } = request.params;

    const tool = byName.get(name);
    if (!tool) return errorResult(`Unknown tool: ${name}`);

    let args: unknown;
    try {
      args = tool.schema.parse(rawArgs ?? {});
    } catch (error) {
      if (error instanceof z.ZodError) {
        return errorResult(`Invalid arguments — ${formatZodError(error)}`);
      }
      throw error;
    }

    let client: AppleAdsClient;
    try {
      client = getClient();
    } catch {
      return errorResult(CREDENTIAL_ERROR);
    }

    try {
      const data = await tool.handler(client, args);
      return textResult(typeof data === "string" ? data : JSON.stringify(data, null, 2));
    } catch (error) {
      return errorResult(error instanceof Error ? error.message : String(error));
    }
  });
}
