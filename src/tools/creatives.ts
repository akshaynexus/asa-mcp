import { z } from "zod";
import { AppleAdsClient } from "../client.js";

// ============================================
// Tool Schemas
// ============================================

export const createCreativeSchema = z.object({
  adamId: z.number().describe("App Store app identifier (use search_apps to find it)"),
  name: z.string().describe("Creative name (must be unique within org)"),
  type: z.enum(["DEFAULT_PRODUCT_PAGE", "CUSTOM_PRODUCT_PAGE"])
    .describe("Creative type. CUSTOM_PRODUCT_PAGE requires a productPageId."),
  productPageId: z.string().optional()
    .describe("Custom Product Page identifier (required when type is CUSTOM_PRODUCT_PAGE). Use get_product_pages to find it."),
});

export const getCreativesSchema = z.object({
  creativeId: z.number().optional().describe("Optional creative ID to get a specific creative"),
});

export const findCreativesSchema = z.object({
  conditions: z.array(z.object({
    field: z.string().describe("Field to filter on (e.g., 'adamId', 'name', 'type', 'state')"),
    operator: z.enum(["EQUALS", "IN", "LESS_THAN", "GREATER_THAN", "STARTSWITH", "CONTAINS_ANY", "CONTAINS_ALL"]),
    values: z.array(z.string()).describe("Values to match"),
  })).optional().describe("Filter conditions"),
  orderBy: z.object({
    field: z.string(),
    sortOrder: z.enum(["ASCENDING", "DESCENDING"]),
  }).optional().describe("Sort order"),
  limit: z.number().optional().default(20).describe("Max results to return"),
  offset: z.number().optional().default(0).describe("Offset for pagination"),
});

// ============================================
// Tool Definitions
// ============================================

export const creativeToolDefinitions = [
  {
    name: "create_creative",
    description: "Create a creative that wraps a Default or Custom Product Page. The creativeId returned is used to create an ad. For CUSTOM_PRODUCT_PAGE, first find the productPageId with get_product_pages.",
    inputSchema: {
      type: "object" as const,
      properties: {
        adamId: { type: "number", description: "App Store app identifier" },
        name: { type: "string", description: "Creative name (unique within org)" },
        type: {
          type: "string",
          enum: ["DEFAULT_PRODUCT_PAGE", "CUSTOM_PRODUCT_PAGE"],
          description: "Creative type. CUSTOM_PRODUCT_PAGE requires a productPageId.",
        },
        productPageId: { type: "string", description: "Custom Product Page identifier (required for CUSTOM_PRODUCT_PAGE)" },
      },
      required: ["adamId", "name", "type"],
    },
  },
  {
    name: "get_creatives",
    description: "Get all creatives or a specific creative by ID",
    inputSchema: {
      type: "object" as const,
      properties: {
        creativeId: { type: "number", description: "Optional creative ID to get a specific creative" },
      },
    },
  },
  {
    name: "find_creatives",
    description: "Search for creatives using filter conditions (e.g., by adamId, name, type, or state)",
    inputSchema: {
      type: "object" as const,
      properties: {
        conditions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              field: { type: "string", description: "Field to filter on" },
              operator: {
                type: "string",
                enum: ["EQUALS", "IN", "LESS_THAN", "GREATER_THAN", "STARTSWITH", "CONTAINS_ANY", "CONTAINS_ALL"],
              },
              values: { type: "array", items: { type: "string" } },
            },
            required: ["field", "operator", "values"],
          },
          description: "Filter conditions",
        },
        orderBy: {
          type: "object",
          properties: {
            field: { type: "string" },
            sortOrder: { type: "string", enum: ["ASCENDING", "DESCENDING"] },
          },
        },
        limit: { type: "number", description: "Max results (default 20)" },
        offset: { type: "number", description: "Pagination offset" },
      },
    },
  },
];

// ============================================
// Tool Handlers
// ============================================

export async function handleCreateCreative(
  client: AppleAdsClient,
  args: z.infer<typeof createCreativeSchema>
): Promise<string> {
  const result = await client.createCreative({
    adamId: args.adamId,
    name: args.name,
    type: args.type,
    productPageId: args.productPageId,
  });
  return JSON.stringify(result, null, 2);
}

export async function handleGetCreatives(
  client: AppleAdsClient,
  args: z.infer<typeof getCreativesSchema>
): Promise<string> {
  const result = await client.getCreatives(args.creativeId);
  return JSON.stringify(result, null, 2);
}

export async function handleFindCreatives(
  client: AppleAdsClient,
  args: z.infer<typeof findCreativesSchema>
): Promise<string> {
  const selector = {
    conditions: args.conditions,
    orderBy: args.orderBy ? [args.orderBy] : undefined,
    pagination: { offset: args.offset ?? 0, limit: args.limit ?? 20 },
  };
  const result = await client.findCreatives(selector);
  return JSON.stringify(result, null, 2);
}
