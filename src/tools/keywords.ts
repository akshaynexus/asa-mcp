import { z } from "zod";
import { defineTool } from "../mcp/registry.js";
import { buildSelector, findShape, money, requireFields } from "../mcp/schema.js";

const keywordItemSchema = z.object({
  id: z.number().optional().describe("Keyword ID (required for update)"),
  text: z.string().optional().describe("Keyword text (required for create)"),
  matchType: z.enum(["BROAD", "EXACT"]).optional().describe("Match type (required for create)"),
  bidAmount: z.string().optional().describe("Bid amount (uses ad group default if omitted)"),
  currency: z.string().optional().describe("Currency code, required when bidAmount is set"),
  status: z.enum(["ACTIVE", "PAUSED"]).optional().describe("Keyword status"),
});

const manageKeywordsSchema = z
  .object({
    action: z.enum(["create", "get", "find", "update"]).describe("Operation to perform"),
    campaignId: z.number().describe("Campaign ID (required for all actions)"),
    adGroupId: z.number().optional()
      .describe("Ad group ID (required for create/get/update; not used by find)"),
    keywordId: z.number().optional().describe("Keyword ID to fetch one (get)"),
    keywords: z.array(keywordItemSchema).optional()
      .describe("Keywords to create or update"),
    ...findShape,
  })
  .superRefine((v, ctx) =>
    requireFields(ctx, v, {
      create: ["adGroupId", "keywords"],
      get: ["adGroupId"],
      update: ["adGroupId", "keywords"],
    }),
  );

export const keywordTools = [
  defineTool<z.infer<typeof manageKeywordsSchema>>({
    name: "manage_keywords",
    description:
      "Manage targeting keywords in an ad group. action: create | get | find (campaign-wide) | update.",
    schema: manageKeywordsSchema,
    handler: async (client, a) => {
      switch (a.action) {
        case "create":
          return client.createTargetingKeywords(
            a.campaignId,
            a.adGroupId!,
            a.keywords!.map((k) => ({
              text: k.text!,
              matchType: k.matchType!,
              bidAmount: k.bidAmount && k.currency ? money(k.bidAmount, k.currency) : undefined,
              status: k.status,
            })),
          );
        case "get":
          return client.getTargetingKeywords(a.campaignId, a.adGroupId!, a.keywordId);
        case "find":
          return client.findTargetingKeywords(a.campaignId, buildSelector(a, { limit: 1000 }));
        case "update":
          return client.updateTargetingKeywords(
            a.campaignId,
            a.adGroupId!,
            a.keywords!.map((k) => ({
              id: k.id!,
              bidAmount: k.bidAmount && k.currency ? money(k.bidAmount, k.currency) : undefined,
              status: k.status,
            })),
          );
      }
    },
  }),
];
