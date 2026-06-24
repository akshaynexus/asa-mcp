import { z } from "zod";
import { defineTool } from "../mcp/registry.js";

const getUserAclSchema = z.object({});

const searchSchema = z.object({
  target: z.enum(["apps", "geo"])
    .describe("What to search: 'apps' (find apps to promote) or 'geo' (targetable locations)"),
  query: z.string().describe("Search text (app name, or location name)"),
  limit: z.number().optional().describe("Max results to return"),
  returnOwnedApps: z.boolean().optional().describe("Only return apps you own (target 'apps')"),
  geoEntity: z.enum(["Country", "AdminArea", "Locality"]).optional()
    .describe("Location type (target 'geo'): Country, AdminArea=state, Locality=city"),
  countryCode: z.string().optional().describe("Filter by country code, e.g. 'US' (target 'geo')"),
});

export const discoveryTools = [
  defineTool<z.infer<typeof getUserAclSchema>>({
    name: "get_user_acl",
    description:
      "Get organizations and roles the API has access to. Use this to find your orgId and verify permissions.",
    schema: getUserAclSchema,
    annotations: { readOnlyHint: true },
    handler: async (client) => client.getUserAcl(),
  }),
  defineTool<z.infer<typeof searchSchema>>({
    name: "search",
    description:
      "Search for apps to promote (returns adamId) or targetable geographic locations. Set target to 'apps' or 'geo'.",
    schema: searchSchema,
    annotations: { readOnlyHint: true },
    handler: async (client, a) =>
      a.target === "apps"
        ? client.searchApps(a.query, { limit: a.limit, returnOwnedApps: a.returnOwnedApps })
        : client.searchGeo(a.query, {
            entity: a.geoEntity,
            countryCode: a.countryCode,
            limit: a.limit,
          }),
  }),
];
