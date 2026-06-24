import { z } from "zod";
import { AppleAdsClient } from "../client.js";

// ============================================
// Tool Schemas
// ============================================

export const getProductPagesSchema = z.object({
  adamId: z.number().describe("App Store app identifier (use search_apps to find it)"),
  productPageId: z.string().optional()
    .describe("Optional product page identifier to fetch a single custom product page"),
  name: z.string().optional().describe("Optional filter by product page name"),
  states: z.enum(["HIDDEN", "VISIBLE"]).optional().describe("Optional filter by state"),
});

// ============================================
// Tool Definitions
// ============================================

export const productPageToolDefinitions = [
  {
    name: "get_product_pages",
    description: "Get an app's Custom Product Pages (created in App Store Connect). Returns productPageId values needed to create a CUSTOM_PRODUCT_PAGE creative. Pass productPageId to fetch a single page.",
    inputSchema: {
      type: "object" as const,
      properties: {
        adamId: { type: "number", description: "App Store app identifier" },
        productPageId: { type: "string", description: "Optional product page identifier to fetch a single page" },
        name: { type: "string", description: "Optional filter by product page name" },
        states: { type: "string", enum: ["HIDDEN", "VISIBLE"], description: "Optional filter by state" },
      },
      required: ["adamId"],
    },
  },
];

// ============================================
// Tool Handlers
// ============================================

export async function handleGetProductPages(
  client: AppleAdsClient,
  args: z.infer<typeof getProductPagesSchema>
): Promise<string> {
  const result = await client.getProductPages(args.adamId, {
    productPageId: args.productPageId,
    name: args.name,
    states: args.states,
  });
  return JSON.stringify(result, null, 2);
}
