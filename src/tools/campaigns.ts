import { z } from "zod";
import { defineTool } from "../mcp/registry.js";
import { buildSelector, findShape, money, requireFields } from "../mcp/schema.js";

const manageCampaignsSchema = z
  .object({
    action: z.enum(["create", "get", "find", "update", "delete"])
      .describe("Operation to perform"),
    campaignId: z.number().optional()
      .describe("Campaign ID (required for update/delete; optional for get to fetch one)"),
    name: z.string().optional().describe("Campaign name (create/update)"),
    adamId: z.number().optional().describe("App Store app identifier (create)"),
    countriesOrRegions: z.array(z.string()).optional()
      .describe("ISO Alpha-2 country codes, e.g. ['US','CA'] (create/update)"),
    budgetAmount: z.string().optional().describe("Total budget amount (create/update)"),
    currency: z.string().optional().describe("Currency code, e.g. 'USD' (create/update)"),
    dailyBudgetAmount: z.string().optional().describe("Daily budget cap (create/update)"),
    status: z.enum(["ENABLED", "PAUSED"]).optional().describe("Campaign status (update)"),
    clearGeoTargetingOnCountryOrRegionChange: z.boolean().optional()
      .describe("Clear geo targeting when changing countries (update)"),
    ...findShape,
  })
  .superRefine((v, ctx) =>
    requireFields(ctx, v, {
      create: ["name", "adamId", "countriesOrRegions", "budgetAmount", "currency"],
      update: ["campaignId"],
      delete: ["campaignId"],
    }),
  );

export const campaignTools = [
  defineTool<z.infer<typeof manageCampaignsSchema>>({
    name: "manage_campaigns",
    description:
      "Manage Apple Search Ads campaigns. action: create | get (all or by campaignId) | find (filter) | update | delete.",
    schema: manageCampaignsSchema,
    handler: async (client, a) => {
      switch (a.action) {
        case "create":
          return client.createCampaign({
            name: a.name!,
            adamId: a.adamId!,
            countriesOrRegions: a.countriesOrRegions!,
            budgetAmount: money(a.budgetAmount!, a.currency!),
            dailyBudgetAmount: a.dailyBudgetAmount
              ? money(a.dailyBudgetAmount, a.currency!)
              : undefined,
          });
        case "get":
          return client.getCampaigns(a.campaignId);
        case "find":
          return client.findCampaigns(buildSelector(a));
        case "update": {
          const updates: Parameters<typeof client.updateCampaign>[1] = {
            clearGeoTargetingOnCountryOrRegionChange:
              a.clearGeoTargetingOnCountryOrRegionChange ?? false,
          };
          if (a.name) updates.name = a.name;
          if (a.status) updates.status = a.status;
          if (a.countriesOrRegions) updates.countriesOrRegions = a.countriesOrRegions;
          if (a.budgetAmount && a.currency) updates.budgetAmount = money(a.budgetAmount, a.currency);
          if (a.dailyBudgetAmount && a.currency) {
            updates.dailyBudgetAmount = money(a.dailyBudgetAmount, a.currency);
          }
          return client.updateCampaign(a.campaignId!, updates);
        }
        case "delete":
          return client.deleteCampaign(a.campaignId!);
      }
    },
  }),
];
