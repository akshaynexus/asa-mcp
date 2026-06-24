import { z } from "zod";
import { AppleAdsClient } from "../client.js";

// ============================================
// Tool Schemas
// ============================================

export const createBudgetOrderSchema = z.object({
  orgIds: z.array(z.number()).describe("Organization IDs the budget order applies to"),
  name: z.string().describe("Budget order name"),
  startDate: z.string().describe("Start date (YYYY-MM-DD)"),
  endDate: z.string().describe("End date (YYYY-MM-DD)"),
  budgetAmount: z.string().describe("Budget amount"),
  currency: z.string().describe("Currency code (e.g., 'USD')"),
  orderNumber: z.string().optional().describe("Purchase/order number"),
  clientName: z.string().optional().describe("Client name"),
  primaryBuyerName: z.string().optional().describe("Primary buyer name"),
  primaryBuyerEmail: z.string().optional().describe("Primary buyer email"),
  billingEmail: z.string().optional().describe("Billing email"),
});

export const getBudgetOrdersSchema = z.object({
  budgetOrderId: z.number().optional().describe("Optional budget order ID to get a specific one"),
});

export const updateBudgetOrderSchema = z.object({
  budgetOrderId: z.number().describe("Budget order ID to update"),
  name: z.string().optional().describe("New budget order name"),
  startDate: z.string().optional().describe("New start date (YYYY-MM-DD)"),
  endDate: z.string().optional().describe("New end date (YYYY-MM-DD)"),
  budgetAmount: z.string().optional().describe("New budget amount"),
  currency: z.string().optional().describe("Currency code (required if budgetAmount is set)"),
  orderNumber: z.string().optional().describe("Purchase/order number"),
  clientName: z.string().optional().describe("Client name"),
  primaryBuyerName: z.string().optional().describe("Primary buyer name"),
  primaryBuyerEmail: z.string().optional().describe("Primary buyer email"),
  billingEmail: z.string().optional().describe("Billing email"),
});

// ============================================
// Tool Definitions
// ============================================

export const budgetOrderToolDefinitions = [
  {
    name: "create_budget_order",
    description: "Create a budget order (used by LOC/agency accounts to manage payment allocation). Note: budget orders cannot be deleted, only updated.",
    inputSchema: {
      type: "object" as const,
      properties: {
        orgIds: { type: "array", items: { type: "number" }, description: "Organization IDs" },
        name: { type: "string", description: "Budget order name" },
        startDate: { type: "string", description: "Start date (YYYY-MM-DD)" },
        endDate: { type: "string", description: "End date (YYYY-MM-DD)" },
        budgetAmount: { type: "string", description: "Budget amount" },
        currency: { type: "string", description: "Currency code (e.g., 'USD')" },
        orderNumber: { type: "string", description: "Purchase/order number" },
        clientName: { type: "string", description: "Client name" },
        primaryBuyerName: { type: "string", description: "Primary buyer name" },
        primaryBuyerEmail: { type: "string", description: "Primary buyer email" },
        billingEmail: { type: "string", description: "Billing email" },
      },
      required: ["orgIds", "name", "startDate", "endDate", "budgetAmount", "currency"],
    },
  },
  {
    name: "get_budget_orders",
    description: "Get all budget orders or a specific budget order by ID",
    inputSchema: {
      type: "object" as const,
      properties: {
        budgetOrderId: { type: "number", description: "Optional budget order ID" },
      },
    },
  },
  {
    name: "update_budget_order",
    description: "Update an existing budget order (there is no delete; update instead)",
    inputSchema: {
      type: "object" as const,
      properties: {
        budgetOrderId: { type: "number", description: "Budget order ID to update" },
        name: { type: "string", description: "New budget order name" },
        startDate: { type: "string", description: "New start date (YYYY-MM-DD)" },
        endDate: { type: "string", description: "New end date (YYYY-MM-DD)" },
        budgetAmount: { type: "string", description: "New budget amount" },
        currency: { type: "string", description: "Currency code (required with budgetAmount)" },
        orderNumber: { type: "string", description: "Purchase/order number" },
        clientName: { type: "string", description: "Client name" },
        primaryBuyerName: { type: "string", description: "Primary buyer name" },
        primaryBuyerEmail: { type: "string", description: "Primary buyer email" },
        billingEmail: { type: "string", description: "Billing email" },
      },
      required: ["budgetOrderId"],
    },
  },
];

// ============================================
// Tool Handlers
// ============================================

export async function handleCreateBudgetOrder(
  client: AppleAdsClient,
  args: z.infer<typeof createBudgetOrderSchema>
): Promise<string> {
  const result = await client.createBudgetOrder(args.orgIds, {
    name: args.name,
    startDate: args.startDate,
    endDate: args.endDate,
    budget: { amount: args.budgetAmount, currency: args.currency },
    orderNumber: args.orderNumber,
    clientName: args.clientName,
    primaryBuyerName: args.primaryBuyerName,
    primaryBuyerEmail: args.primaryBuyerEmail,
    billingEmail: args.billingEmail,
  });
  return JSON.stringify(result, null, 2);
}

export async function handleGetBudgetOrders(
  client: AppleAdsClient,
  args: z.infer<typeof getBudgetOrdersSchema>
): Promise<string> {
  const result = await client.getBudgetOrders(args.budgetOrderId);
  return JSON.stringify(result, null, 2);
}

export async function handleUpdateBudgetOrder(
  client: AppleAdsClient,
  args: z.infer<typeof updateBudgetOrderSchema>
): Promise<string> {
  const bo: Parameters<typeof client.updateBudgetOrder>[1] = {};
  if (args.name) bo.name = args.name;
  if (args.startDate) bo.startDate = args.startDate;
  if (args.endDate) bo.endDate = args.endDate;
  if (args.budgetAmount && args.currency) {
    bo.budget = { amount: args.budgetAmount, currency: args.currency };
  }
  if (args.orderNumber) bo.orderNumber = args.orderNumber;
  if (args.clientName) bo.clientName = args.clientName;
  if (args.primaryBuyerName) bo.primaryBuyerName = args.primaryBuyerName;
  if (args.primaryBuyerEmail) bo.primaryBuyerEmail = args.primaryBuyerEmail;
  if (args.billingEmail) bo.billingEmail = args.billingEmail;

  const result = await client.updateBudgetOrder(args.budgetOrderId, bo);
  return JSON.stringify(result, null, 2);
}
