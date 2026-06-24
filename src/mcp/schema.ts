import { z } from "zod";
import type { Selector } from "../client.js";

/**
 * Shared schema fragments and helpers.
 *
 * These eliminate the per-tool duplication that previously existed between the
 * hand-written JSON Schema and the zod schema: tools now declare a single zod
 * schema and the MCP `inputSchema` is generated from it via `zodToInputSchema`.
 */

export const OPERATORS = [
  "EQUALS",
  "IN",
  "LESS_THAN",
  "GREATER_THAN",
  "STARTSWITH",
  "CONTAINS_ANY",
  "CONTAINS_ALL",
] as const;

export const conditionSchema = z.object({
  field: z.string().describe("Field to filter on"),
  operator: z.enum(OPERATORS),
  values: z.array(z.string()).describe("Values to match"),
});

export const orderBySchema = z.object({
  field: z.string(),
  sortOrder: z.enum(["ASCENDING", "DESCENDING"]),
});

/** Reusable fields for any `find` action. Spread into a tool's object schema. */
export const findShape = {
  conditions: z.array(conditionSchema).optional()
    .describe("Filter conditions (action 'find')"),
  orderBy: orderBySchema.optional()
    .describe("Sort order (action 'find')"),
  limit: z.number().optional()
    .describe("Max results (action 'find')"),
  offset: z.number().optional()
    .describe("Pagination offset (action 'find')"),
};

export interface FindArgs {
  conditions?: z.infer<typeof conditionSchema>[];
  orderBy?: z.infer<typeof orderBySchema>;
  limit?: number;
  offset?: number;
}

/** Build an Apple API `Selector` from the shared find fields. */
export function buildSelector(a: FindArgs, defaults: { limit?: number } = {}): Selector {
  return {
    conditions: a.conditions,
    orderBy: a.orderBy ? [a.orderBy] : undefined,
    pagination: { offset: a.offset ?? 0, limit: a.limit ?? defaults.limit ?? 20 },
  };
}

/** A money amount in the shape the Apple API expects. */
export function money(amount: string, currency: string): { amount: string; currency: string } {
  return { amount, currency };
}

/**
 * Enforce that the fields required by a given `action` are present.
 * Keeps consolidated `manage_*` tools strict without a schema per action.
 */
export function requireFields(
  ctx: z.RefinementCtx,
  value: Record<string, unknown>,
  rules: Record<string, string[]>,
): void {
  const action = value.action as string;
  for (const field of rules[action] ?? []) {
    if (value[field] === undefined || value[field] === null) {
      ctx.addIssue({
        code: "custom",
        message: `'${field}' is required when action is '${action}'`,
        path: [field],
      });
    }
  }
}

export type McpInputSchema = {
  type: "object";
  properties?: Record<string, unknown>;
  required?: string[];
};

/** Convert a zod schema into a JSON Schema accepted by the MCP SDK. */
export function zodToInputSchema(schema: z.ZodType): McpInputSchema {
  const json = z.toJSONSchema(schema, { target: "draft-2020-12" }) as Record<string, unknown>;
  delete json.$schema;
  return json as McpInputSchema;
}
