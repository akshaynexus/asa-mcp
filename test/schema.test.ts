import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import {
  buildSelector,
  money,
  requireFields,
  zodToInputSchema,
} from "../src/mcp/schema.js";

test("buildSelector applies defaults", () => {
  assert.deepEqual(buildSelector({}), {
    conditions: undefined,
    orderBy: undefined,
    pagination: { offset: 0, limit: 20 },
  });
});

test("buildSelector honors values and the default limit override", () => {
  const selector = buildSelector(
    { conditions: [{ field: "name", operator: "EQUALS", values: ["x"] }], offset: 5 },
    { limit: 1000 },
  );
  assert.equal(selector.pagination!.limit, 1000);
  assert.equal(selector.pagination!.offset, 5);
  assert.equal(selector.conditions!.length, 1);
});

test("buildSelector wraps a single orderBy into an array", () => {
  const selector = buildSelector({ orderBy: { field: "spend", sortOrder: "DESCENDING" } });
  assert.deepEqual(selector.orderBy, [{ field: "spend", sortOrder: "DESCENDING" }]);
});

test("money builds the Apple amount shape", () => {
  assert.deepEqual(money("10.50", "USD"), { amount: "10.50", currency: "USD" });
});

test("requireFields enforces per-action required fields", () => {
  const schema = z
    .object({ action: z.enum(["create", "get"]), name: z.string().optional() })
    .superRefine((v, ctx) => requireFields(ctx, v, { create: ["name"] }));

  assert.equal(schema.safeParse({ action: "get" }).success, true);
  assert.equal(schema.safeParse({ action: "create", name: "ok" }).success, true);

  const missing = schema.safeParse({ action: "create" });
  assert.equal(missing.success, false);
  assert.match(missing.error!.issues[0].message, /'name' is required/);
});

test("zodToInputSchema yields an MCP-compatible object schema", () => {
  const json = zodToInputSchema(z.object({ a: z.string(), b: z.number().optional() }));
  assert.equal(json.type, "object");
  assert.deepEqual(json.required, ["a"]);
  assert.equal((json as Record<string, unknown>).$schema, undefined);
});
