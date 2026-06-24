import { z } from "zod";
import { defineTool } from "../mcp/registry.js";
import { buildSelector, findShape, requireFields } from "../mcp/schema.js";

const manageCreativesSchema = z
  .object({
    action: z.enum(["create", "get", "find"]).describe("Operation to perform"),
    creativeId: z.number().optional().describe("Creative ID to fetch one (get)"),
    adamId: z.number().optional().describe("App Store app identifier (create)"),
    name: z.string().optional().describe("Creative name (create)"),
    type: z.enum(["DEFAULT_PRODUCT_PAGE", "CUSTOM_PRODUCT_PAGE"]).optional()
      .describe("Creative type (create). CUSTOM_PRODUCT_PAGE requires productPageId."),
    productPageId: z.string().optional()
      .describe("Custom Product Page identifier (create, for CUSTOM_PRODUCT_PAGE)"),
    ...findShape,
  })
  .superRefine((v, ctx) =>
    requireFields(ctx, v, { create: ["adamId", "name", "type"] }),
  );

export const creativeTools = [
  defineTool<z.infer<typeof manageCreativesSchema>>({
    name: "manage_creatives",
    description:
      "Manage creatives (wrap a Default or Custom Product Page). action: create | get | find. Use get_product_pages to find a productPageId for CUSTOM_PRODUCT_PAGE.",
    schema: manageCreativesSchema,
    handler: async (client, a) => {
      switch (a.action) {
        case "create":
          return client.createCreative({
            adamId: a.adamId!,
            name: a.name!,
            type: a.type!,
            productPageId: a.productPageId,
          });
        case "get":
          return client.getCreatives(a.creativeId);
        case "find":
          return client.findCreatives(buildSelector(a));
      }
    },
  }),
];
