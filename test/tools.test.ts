import { test } from "node:test";
import assert from "node:assert/strict";
import { mockClient, runTool, parseTool } from "./helpers.js";

test("manage_campaigns create maps budget into the Apple money shape", async () => {
  const { client, calls } = mockClient();
  await runTool(client, "manage_campaigns", {
    action: "create",
    name: "Test",
    adamId: 123,
    countriesOrRegions: ["US"],
    budgetAmount: "100",
    currency: "USD",
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "createCampaign");
  const payload = calls[0].args[0] as { budgetAmount: unknown };
  assert.deepEqual(payload.budgetAmount, { amount: "100", currency: "USD" });
});

test("manage_campaigns update requires campaignId", () => {
  assert.throws(() => parseTool("manage_campaigns", { action: "update", name: "x" }), /campaignId/);
});

test("manage_campaigns find routes to findCampaigns with a selector", async () => {
  const { client, calls } = mockClient();
  await runTool(client, "manage_campaigns", { action: "find", limit: 5 });
  assert.equal(calls[0].method, "findCampaigns");
  const selector = calls[0].args[0] as { pagination: { limit: number } };
  assert.equal(selector.pagination.limit, 5);
});

test("manage_ads find routes org-wide when campaignId is omitted", async () => {
  const { client, calls } = mockClient();
  await runTool(client, "manage_ads", { action: "find" });
  assert.equal(calls[0].method, "findAdsOrgWide");
});

test("manage_ads find routes to campaign scope when campaignId is present", async () => {
  const { client, calls } = mockClient();
  await runTool(client, "manage_ads", { action: "find", campaignId: 9 });
  assert.equal(calls[0].method, "findAds");
  assert.equal(calls[0].args[0], 9);
});

test("manage_ads create requires creativeId", () => {
  assert.throws(
    () => parseTool("manage_ads", { action: "create", campaignId: 1, adGroupId: 2 }),
    /creativeId/,
  );
});

test("manage_negative_keywords adgroup scope requires adGroupId", () => {
  assert.throws(
    () =>
      parseTool("manage_negative_keywords", {
        action: "get",
        scope: "adgroup",
        campaignId: 1,
      }),
    /adGroupId/,
  );
});

test("manage_negative_keywords routes by scope", async () => {
  const { client, calls } = mockClient();
  await runTool(client, "manage_negative_keywords", {
    action: "create",
    scope: "campaign",
    campaignId: 1,
    keywords: [{ text: "free", matchType: "BROAD" }],
  });
  assert.equal(calls[0].method, "createCampaignNegativeKeywords");
});

test("get_reports dispatches by type and requires campaignId for non-campaign", async () => {
  const { client, calls } = mockClient();
  await runTool(client, "get_reports", {
    type: "adgroup",
    campaignId: 7,
    startTime: "2024-01-01",
    endTime: "2024-01-31",
  });
  assert.equal(calls[0].method, "getAdGroupReports");
  assert.equal(calls[0].args[0], 7);

  assert.throws(
    () => parseTool("get_reports", { type: "keyword", startTime: "a", endTime: "b" }),
    /campaignId/,
  );
});

test("get_reports forces returnRowTotals true when no granularity is set", async () => {
  const { client, calls } = mockClient();
  await runTool(client, "get_reports", {
    type: "campaign",
    startTime: "2024-01-01",
    endTime: "2024-01-31",
  });
  const params = calls[0].args[0] as { returnRowTotals: boolean };
  assert.equal(params.returnRowTotals, true);
});

test("search routes apps vs geo", async () => {
  const { client, calls } = mockClient();
  await runTool(client, "search", { target: "apps", query: "trek" });
  await runTool(client, "search", { target: "geo", query: "London", geoEntity: "Locality" });
  assert.equal(calls[0].method, "searchApps");
  assert.equal(calls[1].method, "searchGeo");
});

test("manage_custom_reports builds a selector from adamIds and countries", async () => {
  const { client, calls } = mockClient();
  await runTool(client, "manage_custom_reports", {
    action: "create",
    name: "ISR",
    adamIds: [111],
    countriesOrRegions: ["US", "CA"],
  });
  assert.equal(calls[0].method, "createCustomReport");
  const body = calls[0].args[0] as { selector: { conditions: Array<{ field: string }> } };
  assert.deepEqual(
    body.selector.conditions.map((c) => c.field),
    ["adamId", "countryOrRegion"],
  );
});
