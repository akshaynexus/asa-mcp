import { z } from "zod";
import { AppleAdsClient } from "../client.js";

// ============================================
// Tool Schemas
// ============================================

export const createCustomReportSchema = z.object({
  name: z.string().describe("Report name (max 50 characters)"),
  granularity: z.enum(["DAILY", "WEEKLY"]).optional().default("DAILY")
    .describe("Report granularity. WEEKLY cannot use custom startTime/endTime — use dateRange instead."),
  startTime: z.string().optional().describe("Start date (YYYY-MM-DD), for DAILY granularity"),
  endTime: z.string().optional().describe("End date (YYYY-MM-DD), for DAILY granularity"),
  dateRange: z.enum(["LAST_WEEK", "LAST_2_WEEKS", "LAST_4_WEEKS"]).optional()
    .describe("Date range for WEEKLY granularity reports"),
  adamIds: z.array(z.number()).optional()
    .describe("Optional list of app adamIds to scope the report (uses IN operator)"),
  countriesOrRegions: z.array(z.string()).optional()
    .describe("Optional list of ISO Alpha-2 country/region codes to scope the report"),
});

export const getCustomReportsSchema = z.object({
  reportId: z.number().optional()
    .describe("Optional report ID. Poll a specific report to retrieve its downloadUri once state is COMPLETED."),
});

// ============================================
// Tool Definitions
// ============================================

export const customReportToolDefinitions = [
  {
    name: "create_custom_report",
    description: "Create an asynchronous Impression Share report (share of voice, search popularity, rank). Returns a report id; poll get_custom_reports with that id until state is COMPLETED to get the downloadUri.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Report name (max 50 characters)" },
        granularity: { type: "string", enum: ["DAILY", "WEEKLY"], description: "DAILY (default) or WEEKLY" },
        startTime: { type: "string", description: "Start date (YYYY-MM-DD), for DAILY" },
        endTime: { type: "string", description: "End date (YYYY-MM-DD), for DAILY" },
        dateRange: {
          type: "string",
          enum: ["LAST_WEEK", "LAST_2_WEEKS", "LAST_4_WEEKS"],
          description: "Date range for WEEKLY granularity",
        },
        adamIds: { type: "array", items: { type: "number" }, description: "Optional app adamIds to scope the report" },
        countriesOrRegions: {
          type: "array",
          items: { type: "string" },
          description: "Optional ISO Alpha-2 country/region codes to scope the report",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "get_custom_reports",
    description: "Get all Impression Share reports or a specific one by ID. A single report includes its state and downloadUri (a CSV link) once ready.",
    inputSchema: {
      type: "object" as const,
      properties: {
        reportId: { type: "number", description: "Optional report ID to poll a specific report" },
      },
    },
  },
];

// ============================================
// Tool Handlers
// ============================================

export async function handleCreateCustomReport(
  client: AppleAdsClient,
  args: z.infer<typeof createCustomReportSchema>
): Promise<string> {
  const conditions: Array<{ field: string; operator: string; values: Array<string | number> }> = [];
  if (args.adamIds && args.adamIds.length > 0) {
    conditions.push({ field: "adamId", operator: "IN", values: args.adamIds });
  }
  if (args.countriesOrRegions && args.countriesOrRegions.length > 0) {
    conditions.push({ field: "countryOrRegion", operator: "IN", values: args.countriesOrRegions });
  }

  const result = await client.createCustomReport({
    name: args.name,
    granularity: args.granularity,
    startTime: args.startTime,
    endTime: args.endTime,
    dateRange: args.dateRange,
    selector: conditions.length > 0 ? { conditions } : undefined,
  });
  return JSON.stringify(result, null, 2);
}

export async function handleGetCustomReports(
  client: AppleAdsClient,
  args: z.infer<typeof getCustomReportsSchema>
): Promise<string> {
  const result = await client.getCustomReports(args.reportId);
  return JSON.stringify(result, null, 2);
}
