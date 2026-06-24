import { z } from "zod";
import { defineTool } from "../mcp/registry.js";
import { requireFields } from "../mcp/schema.js";

const manageCustomReportsSchema = z
  .object({
    action: z.enum(["create", "get"]).describe("Operation to perform"),
    reportId: z.number().optional()
      .describe("Report ID to poll one for its downloadUri (get)"),
    name: z.string().optional().describe("Report name, max 50 chars (create)"),
    granularity: z.enum(["DAILY", "WEEKLY"]).optional()
      .describe("Report granularity (create). WEEKLY cannot use custom start/end — use dateRange."),
    startTime: z.string().optional().describe("Start date YYYY-MM-DD, for DAILY (create)"),
    endTime: z.string().optional().describe("End date YYYY-MM-DD, for DAILY (create)"),
    dateRange: z.enum(["LAST_WEEK", "LAST_2_WEEKS", "LAST_4_WEEKS"]).optional()
      .describe("Date range for WEEKLY granularity (create)"),
    adamIds: z.array(z.number()).optional().describe("App adamIds to scope the report (create)"),
    countriesOrRegions: z.array(z.string()).optional()
      .describe("ISO Alpha-2 country/region codes to scope the report (create)"),
  })
  .superRefine((v, ctx) => requireFields(ctx, v, { create: ["name"] }));

export const customReportTools = [
  defineTool<z.infer<typeof manageCustomReportsSchema>>({
    name: "manage_custom_reports",
    description:
      "Manage async Impression Share reports (share of voice, search popularity, rank). action: create (returns a report id) | get (poll by reportId until state COMPLETED for the downloadUri).",
    schema: manageCustomReportsSchema,
    handler: async (client, a) => {
      if (a.action === "get") return client.getCustomReports(a.reportId);

      const conditions: Array<{ field: string; operator: string; values: Array<string | number> }> = [];
      if (a.adamIds?.length) {
        conditions.push({ field: "adamId", operator: "IN", values: a.adamIds });
      }
      if (a.countriesOrRegions?.length) {
        conditions.push({ field: "countryOrRegion", operator: "IN", values: a.countriesOrRegions });
      }
      return client.createCustomReport({
        name: a.name!,
        granularity: a.granularity,
        startTime: a.startTime,
        endTime: a.endTime,
        dateRange: a.dateRange,
        selector: conditions.length ? { conditions } : undefined,
      });
    },
  }),
];
