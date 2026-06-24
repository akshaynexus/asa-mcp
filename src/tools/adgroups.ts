import { z } from "zod";
import { defineTool } from "../mcp/registry.js";
import { buildSelector, findShape, money, requireFields } from "../mcp/schema.js";

const targetingDimensionsSchema = z.object({
  age: z.object({
    included: z.array(z.object({ minAge: z.number().min(18), maxAge: z.number().optional() })),
  }).optional().describe("Age targeting (min 18)"),
  gender: z.object({ included: z.array(z.enum(["M", "F"])) }).optional()
    .describe("Gender targeting"),
  deviceClass: z.object({ included: z.array(z.enum(["IPHONE", "IPAD"])) }).optional()
    .describe("Device type targeting"),
  daypart: z.object({
    userTime: z.object({ included: z.array(z.number().min(0).max(167)) }),
  }).optional().describe("Time-of-day targeting (0-167, hours of the week)"),
  adminArea: z.object({ included: z.array(z.string()) }).optional()
    .describe("State/region targeting (e.g. 'US|CA')"),
  locality: z.object({ included: z.array(z.string()) }).optional()
    .describe("City targeting (e.g. 'US|CA|Cupertino')"),
  appDownloaders: z.object({
    included: z.array(z.number()),
    excluded: z.array(z.number()),
  }).optional().describe("Target users who have/haven't downloaded specific apps"),
});

const manageAdGroupsSchema = z
  .object({
    action: z.enum(["create", "get", "find", "update", "delete"])
      .describe("Operation to perform"),
    campaignId: z.number().describe("Campaign ID (required for all actions)"),
    adGroupId: z.number().optional()
      .describe("Ad group ID (required for update/delete; optional for get to fetch one)"),
    name: z.string().optional().describe("Ad group name (create/update)"),
    defaultCpcBid: z.string().optional().describe("Default cost-per-click bid (create/update)"),
    currency: z.string().optional().describe("Currency code, e.g. 'USD' (create/update)"),
    startTime: z.string().optional()
      .describe("Start time ISO, e.g. '2024-01-01T00:00:00.000' (create/update)"),
    endTime: z.string().nullable().optional().describe("End time (create/update)"),
    cpaGoal: z.string().optional().describe("Cost-per-acquisition goal (create/update)"),
    automatedKeywordsOptIn: z.boolean().optional()
      .describe("Enable Search Match (create/update)"),
    targetingDimensions: targetingDimensionsSchema.optional()
      .describe("Targeting settings; on update, all dimensions must be specified"),
    status: z.enum(["ENABLED", "PAUSED"]).optional().describe("Ad group status (create/update)"),
    ...findShape,
  })
  .superRefine((v, ctx) =>
    requireFields(ctx, v, {
      create: ["name", "defaultCpcBid", "currency", "startTime"],
      update: ["adGroupId"],
      delete: ["adGroupId"],
    }),
  );

export const adGroupTools = [
  defineTool<z.infer<typeof manageAdGroupsSchema>>({
    name: "manage_adgroups",
    description:
      "Manage ad groups within a campaign. action: create | get | find | update | delete. campaignId is always required.",
    schema: manageAdGroupsSchema,
    handler: async (client, a) => {
      switch (a.action) {
        case "create":
          return client.createAdGroup(a.campaignId, {
            name: a.name!,
            defaultCpcBid: money(a.defaultCpcBid!, a.currency!),
            startTime: a.startTime!,
            endTime: a.endTime ?? undefined,
            cpaGoal: a.cpaGoal ? money(a.cpaGoal, a.currency!) : undefined,
            automatedKeywordsOptIn: a.automatedKeywordsOptIn,
            targetingDimensions: a.targetingDimensions,
            status: a.status,
          });
        case "get":
          return client.getAdGroups(a.campaignId, a.adGroupId);
        case "find":
          return client.findAdGroups(a.campaignId, buildSelector(a));
        case "update": {
          const updates: Parameters<typeof client.updateAdGroup>[2] = {};
          if (a.name) updates.name = a.name;
          if (a.status) updates.status = a.status;
          if (a.startTime) updates.startTime = a.startTime;
          if (a.endTime !== undefined) updates.endTime = a.endTime ?? undefined;
          if (a.automatedKeywordsOptIn !== undefined) {
            updates.automatedKeywordsOptIn = a.automatedKeywordsOptIn;
          }
          if (a.defaultCpcBid && a.currency) {
            updates.defaultCpcBid = money(a.defaultCpcBid, a.currency);
          }
          if (a.cpaGoal && a.currency) updates.cpaGoal = money(a.cpaGoal, a.currency);
          if (a.targetingDimensions) updates.targetingDimensions = a.targetingDimensions;
          return client.updateAdGroup(a.campaignId, a.adGroupId!, updates);
        }
        case "delete":
          return client.deleteAdGroup(a.campaignId, a.adGroupId!);
      }
    },
  }),
];
