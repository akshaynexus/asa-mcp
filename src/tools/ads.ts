import { z } from "zod";
import { defineTool } from "../mcp/registry.js";
import { buildSelector, findShape, requireFields } from "../mcp/schema.js";

const manageAdsSchema = z
  .object({
    action: z.enum(["create", "get", "find", "update", "delete"])
      .describe("Operation to perform"),
    campaignId: z.number().optional()
      .describe("Campaign ID (required except for org-wide find)"),
    adGroupId: z.number().optional()
      .describe("Ad group ID (required for create/get/update/delete)"),
    adId: z.number().optional()
      .describe("Ad ID (required for update/delete; optional for get to fetch one)"),
    creativeId: z.number().optional().describe("Creative ID to assign (create)"),
    name: z.string().optional().describe("Ad name (create/update)"),
    status: z.enum(["ENABLED", "PAUSED"]).optional().describe("Ad status (create/update)"),
    ...findShape,
  })
  .superRefine((v, ctx) =>
    requireFields(ctx, v, {
      create: ["campaignId", "adGroupId", "creativeId"],
      get: ["campaignId", "adGroupId"],
      update: ["campaignId", "adGroupId", "adId"],
      delete: ["campaignId", "adGroupId", "adId"],
    }),
  );

export const adTools = [
  defineTool<z.infer<typeof manageAdsSchema>>({
    name: "manage_ads",
    description:
      "Manage ads (bind a creative to an ad group). action: create | get | find | update | delete. For find, omit campaignId to search org-wide.",
    schema: manageAdsSchema,
    handler: async (client, a) => {
      switch (a.action) {
        case "create":
          return client.createAd(a.campaignId!, a.adGroupId!, {
            creativeId: a.creativeId!,
            name: a.name,
            status: a.status,
          });
        case "get":
          return client.getAds(a.campaignId!, a.adGroupId!, a.adId);
        case "find":
          return a.campaignId
            ? client.findAds(a.campaignId, buildSelector(a))
            : client.findAdsOrgWide(buildSelector(a));
        case "update": {
          const updates: { name?: string; status?: "ENABLED" | "PAUSED" } = {};
          if (a.name) updates.name = a.name;
          if (a.status) updates.status = a.status;
          return client.updateAd(a.campaignId!, a.adGroupId!, a.adId!, updates);
        }
        case "delete":
          return client.deleteAd(a.campaignId!, a.adGroupId!, a.adId!);
      }
    },
  }),
];
