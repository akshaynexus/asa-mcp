import { z } from "zod";
import { AppleAdsClient } from "../client.js";
import { defineTool } from "../mcp/registry.js";
import { conditionSchema, orderBySchema, requireFields } from "../mcp/schema.js";

type ReportArgs = z.infer<typeof getReportsSchema>;
type ReportParams = Parameters<AppleAdsClient["getCampaignReports"]>[0];

/** Build the report request body, applying Apple's totals/granularity rules. */
function buildReportParams(a: ReportArgs): ReportParams {
  const selector: Record<string, unknown> = {
    pagination: { offset: a.offset ?? 0, limit: a.limit ?? 1000 },
    orderBy: a.orderBy ? [a.orderBy] : [{ field: "impressions", sortOrder: "DESCENDING" }],
  };
  if (a.conditions) selector.conditions = a.conditions;

  // Apple rules: without granularity, returnRowTotals must be true; with
  // granularity, returnGrandTotals must be false.
  const returnRowTotals = a.granularity ? (a.returnRowTotals ?? false) : true;
  const returnGrandTotals = a.granularity ? false : (a.returnGrandTotals ?? false);

  const params: Record<string, unknown> = {
    startTime: a.startTime,
    endTime: a.endTime,
    selector,
    returnRowTotals,
    returnGrandTotals,
    returnRecordsWithNoMetrics: a.returnRecordsWithNoMetrics ?? false,
  };
  if (a.groupBy) params.groupBy = a.groupBy;
  if (a.timeZone) params.timeZone = a.timeZone;
  if (a.granularity) params.granularity = a.granularity;
  return params as ReportParams;
}

const getReportsSchema = z
  .object({
    type: z.enum(["campaign", "adgroup", "keyword", "searchterm", "ad"])
      .describe("Report level to fetch"),
    campaignId: z.number().optional()
      .describe("Campaign ID (required for all types except 'campaign')"),
    startTime: z.string().describe("Start date (yyyy-mm-dd)"),
    endTime: z.string().describe("End date (yyyy-mm-dd)"),
    conditions: z.array(conditionSchema).optional().describe("Optional filter conditions"),
    orderBy: orderBySchema.optional().describe("Sort order (defaults to impressions DESC)"),
    limit: z.number().optional().describe("Max results (default 1000)"),
    offset: z.number().optional().describe("Pagination offset"),
    groupBy: z.array(z.string()).optional()
      .describe("Group by dimensions, e.g. countryOrRegion, deviceClass, ageRange, gender"),
    timeZone: z.enum(["ORTZ", "UTC"]).optional().describe("Time zone (ORTZ = org time zone)"),
    granularity: z.enum(["HOURLY", "DAILY", "WEEKLY", "MONTHLY"]).optional()
      .describe("Time granularity"),
    returnRowTotals: z.boolean().optional().describe("Include row totals"),
    returnGrandTotals: z.boolean().optional().describe("Include grand totals"),
    returnRecordsWithNoMetrics: z.boolean().optional().describe("Include zero-metric records"),
  })
  .superRefine((v, ctx) => {
    if (v.type !== "campaign" && v.campaignId == null) {
      ctx.addIssue({
        code: "custom",
        message: `'campaignId' is required for the '${v.type}' report`,
        path: ["campaignId"],
      });
    }
  });

export const reportTools = [
  defineTool<ReportArgs>({
    name: "get_reports",
    description:
      "Get performance reports. type: campaign | adgroup | keyword | searchterm | ad. All types except 'campaign' require campaignId. Metrics include impressions, taps, installs, spend, CPA, CPT.",
    schema: getReportsSchema,
    annotations: { readOnlyHint: true },
    handler: async (client, a) => {
      const params = buildReportParams(a);
      switch (a.type) {
        case "campaign":
          return client.getCampaignReports(params);
        case "adgroup":
          return client.getAdGroupReports(a.campaignId!, params);
        case "keyword":
          return client.getKeywordReports(a.campaignId!, params);
        case "searchterm":
          return client.getSearchTermReports(a.campaignId!, params);
        case "ad":
          return client.getAdReports(a.campaignId!, params);
      }
    },
  }),
];
