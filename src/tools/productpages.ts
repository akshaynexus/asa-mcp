import { z } from "zod";
import { defineTool } from "../mcp/registry.js";

const getProductPagesSchema = z.object({
  adamId: z.number().describe("App Store app identifier (use the search tool to find it)"),
  productPageId: z.string().optional()
    .describe("Optional product page identifier to fetch a single page"),
  name: z.string().optional().describe("Optional filter by product page name"),
  states: z.enum(["HIDDEN", "VISIBLE"]).optional().describe("Optional filter by state"),
});

export const productPageTools = [
  defineTool<z.infer<typeof getProductPagesSchema>>({
    name: "get_product_pages",
    description:
      "Get an app's Custom Product Pages (created in App Store Connect). Returns productPageId values needed to create a CUSTOM_PRODUCT_PAGE creative. Pass productPageId to fetch a single page.",
    schema: getProductPagesSchema,
    annotations: { readOnlyHint: true },
    handler: async (client, a) =>
      client.getProductPages(a.adamId, {
        productPageId: a.productPageId,
        name: a.name,
        states: a.states,
      }),
  }),
];
