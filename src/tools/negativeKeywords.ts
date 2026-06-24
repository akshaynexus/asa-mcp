import { z } from "zod";
import { defineTool } from "../mcp/registry.js";
import { buildSelector, findShape, requireFields } from "../mcp/schema.js";

const negativeItemSchema = z.object({
  id: z.number().optional().describe("Keyword ID (required for update)"),
  text: z.string().optional().describe("Negative keyword text (required for create)"),
  matchType: z.enum(["BROAD", "EXACT"]).optional().describe("Match type (required for create)"),
  status: z.enum(["ACTIVE", "PAUSED"]).optional().describe("Status (required for update)"),
});

const manageNegativeKeywordsSchema = z
  .object({
    action: z.enum(["create", "get", "find", "update", "delete"])
      .describe("Operation to perform"),
    scope: z.enum(["campaign", "adgroup"])
      .describe("Whether the negative keywords apply at campaign or ad group level"),
    campaignId: z.number().describe("Campaign ID (required for all actions)"),
    adGroupId: z.number().optional().describe("Ad group ID (required when scope is 'adgroup')"),
    keywordId: z.number().optional().describe("Keyword ID to fetch one (get)"),
    keywordIds: z.array(z.number()).optional().describe("Keyword IDs to delete (delete)"),
    keywords: z.array(negativeItemSchema).optional().describe("Keywords to create or update"),
    ...findShape,
  })
  .superRefine((v, ctx) => {
    requireFields(ctx, v, {
      create: ["keywords"],
      update: ["keywords"],
      delete: ["keywordIds"],
    });
    if (v.scope === "adgroup" && v.adGroupId == null) {
      ctx.addIssue({
        code: "custom",
        message: "'adGroupId' is required when scope is 'adgroup'",
        path: ["adGroupId"],
      });
    }
  });

export const negativeKeywordTools = [
  defineTool<z.infer<typeof manageNegativeKeywordsSchema>>({
    name: "manage_negative_keywords",
    description:
      "Manage negative keywords at campaign or ad group level. Set scope (campaign|adgroup) and action (create|get|find|update|delete).",
    schema: manageNegativeKeywordsSchema,
    handler: async (client, a) => {
      const isAdGroup = a.scope === "adgroup";
      switch (a.action) {
        case "create": {
          const kws = a.keywords!.map((k) => ({ text: k.text!, matchType: k.matchType! }));
          return isAdGroup
            ? client.createAdGroupNegativeKeywords(a.campaignId, a.adGroupId!, kws)
            : client.createCampaignNegativeKeywords(a.campaignId, kws);
        }
        case "get":
          return isAdGroup
            ? client.getAdGroupNegativeKeywords(a.campaignId, a.adGroupId!, a.keywordId)
            : client.getCampaignNegativeKeywords(a.campaignId, a.keywordId);
        case "find": {
          const selector = buildSelector(a, { limit: 1000 });
          return isAdGroup
            ? client.findAdGroupNegativeKeywords(a.campaignId, a.adGroupId!, selector)
            : client.findCampaignNegativeKeywords(a.campaignId, selector);
        }
        case "update": {
          const kws = a.keywords!.map((k) => ({ id: k.id!, status: k.status! }));
          return isAdGroup
            ? client.updateAdGroupNegativeKeywords(a.campaignId, a.adGroupId!, kws)
            : client.updateCampaignNegativeKeywords(a.campaignId, kws);
        }
        case "delete":
          return isAdGroup
            ? client.deleteAdGroupNegativeKeywords(a.campaignId, a.adGroupId!, a.keywordIds!)
            : client.deleteCampaignNegativeKeywords(a.campaignId, a.keywordIds!);
      }
    },
  }),
];
