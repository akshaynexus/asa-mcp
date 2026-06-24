import { z } from "zod";
import { AppleAdsClient } from "../client.js";

// ============================================
// Tool Schemas
// ============================================

export const createAdSchema = z.object({
  campaignId: z.number().describe("Campaign ID"),
  adGroupId: z.number().describe("Ad group ID"),
  creativeId: z.number().describe("Creative ID to assign (use create_creative / find_creatives to get it)"),
  name: z.string().optional().describe("Display name for the ad"),
  status: z.enum(["ENABLED", "PAUSED"]).optional().describe("Ad status (default ENABLED)"),
});

export const getAdsSchema = z.object({
  campaignId: z.number().describe("Campaign ID"),
  adGroupId: z.number().describe("Ad group ID"),
  adId: z.number().optional().describe("Optional ad ID to get a specific ad"),
});

export const findAdsSchema = z.object({
  campaignId: z.number().optional()
    .describe("Optional campaign ID. If provided, searches within that campaign; otherwise searches org-wide."),
  conditions: z.array(z.object({
    field: z.string().describe("Field to filter on (e.g., 'adGroupId', 'creativeId', 'status', 'servingStatus')"),
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

export const updateAdSchema = z.object({
  campaignId: z.number().describe("Campaign ID"),
  adGroupId: z.number().describe("Ad group ID"),
  adId: z.number().describe("Ad ID to update"),
  name: z.string().optional().describe("New ad name"),
  status: z.enum(["ENABLED", "PAUSED"]).optional().describe("Ad status"),
});

export const deleteAdSchema = z.object({
  campaignId: z.number().describe("Campaign ID"),
  adGroupId: z.number().describe("Ad group ID"),
  adId: z.number().describe("Ad ID to delete"),
});

// ============================================
// Tool Definitions
// ============================================

export const adToolDefinitions = [
  {
    name: "create_ad",
    description: "Create an ad that binds a creative to an ad group. Requires a creativeId from create_creative.",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaignId: { type: "number", description: "Campaign ID" },
        adGroupId: { type: "number", description: "Ad group ID" },
        creativeId: { type: "number", description: "Creative ID to assign" },
        name: { type: "string", description: "Display name for the ad" },
        status: { type: "string", enum: ["ENABLED", "PAUSED"], description: "Ad status (default ENABLED)" },
      },
      required: ["campaignId", "adGroupId", "creativeId"],
    },
  },
  {
    name: "get_ads",
    description: "Get all ads in an ad group, or a specific ad by ID",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaignId: { type: "number", description: "Campaign ID" },
        adGroupId: { type: "number", description: "Ad group ID" },
        adId: { type: "number", description: "Optional ad ID to get a specific ad" },
      },
      required: ["campaignId", "adGroupId"],
    },
  },
  {
    name: "find_ads",
    description: "Search for ads using filter conditions. Provide campaignId to search within a campaign, omit it to search org-wide.",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaignId: { type: "number", description: "Optional campaign ID (omit for org-wide search)" },
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
  {
    name: "update_ad",
    description: "Update an ad's name or status (ENABLED/PAUSED)",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaignId: { type: "number", description: "Campaign ID" },
        adGroupId: { type: "number", description: "Ad group ID" },
        adId: { type: "number", description: "Ad ID to update" },
        name: { type: "string", description: "New ad name" },
        status: { type: "string", enum: ["ENABLED", "PAUSED"], description: "Ad status" },
      },
      required: ["campaignId", "adGroupId", "adId"],
    },
  },
  {
    name: "delete_ad",
    description: "Delete an ad by ID",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaignId: { type: "number", description: "Campaign ID" },
        adGroupId: { type: "number", description: "Ad group ID" },
        adId: { type: "number", description: "Ad ID to delete" },
      },
      required: ["campaignId", "adGroupId", "adId"],
    },
  },
];

// ============================================
// Tool Handlers
// ============================================

export async function handleCreateAd(
  client: AppleAdsClient,
  args: z.infer<typeof createAdSchema>
): Promise<string> {
  const result = await client.createAd(args.campaignId, args.adGroupId, {
    creativeId: args.creativeId,
    name: args.name,
    status: args.status,
  });
  return JSON.stringify(result, null, 2);
}

export async function handleGetAds(
  client: AppleAdsClient,
  args: z.infer<typeof getAdsSchema>
): Promise<string> {
  const result = await client.getAds(args.campaignId, args.adGroupId, args.adId);
  return JSON.stringify(result, null, 2);
}

export async function handleFindAds(
  client: AppleAdsClient,
  args: z.infer<typeof findAdsSchema>
): Promise<string> {
  const selector = {
    conditions: args.conditions,
    orderBy: args.orderBy ? [args.orderBy] : undefined,
    pagination: { offset: args.offset ?? 0, limit: args.limit ?? 20 },
  };
  const result = args.campaignId
    ? await client.findAds(args.campaignId, selector)
    : await client.findAdsOrgWide(selector);
  return JSON.stringify(result, null, 2);
}

export async function handleUpdateAd(
  client: AppleAdsClient,
  args: z.infer<typeof updateAdSchema>
): Promise<string> {
  const updates: { name?: string; status?: "ENABLED" | "PAUSED" } = {};
  if (args.name) updates.name = args.name;
  if (args.status) updates.status = args.status;
  const result = await client.updateAd(args.campaignId, args.adGroupId, args.adId, updates);
  return JSON.stringify(result, null, 2);
}

export async function handleDeleteAd(
  client: AppleAdsClient,
  args: z.infer<typeof deleteAdSchema>
): Promise<string> {
  const result = await client.deleteAd(args.campaignId, args.adGroupId, args.adId);
  return JSON.stringify({ success: true, ...result }, null, 2);
}
