import { z } from "zod";
import { defineTool } from "../mcp/registry.js";
import { money, requireFields } from "../mcp/schema.js";

const manageBudgetOrdersSchema = z
  .object({
    action: z.enum(["create", "get", "update"]).describe("Operation to perform (no delete by design)"),
    budgetOrderId: z.number().optional()
      .describe("Budget order ID (required for update; optional for get to fetch one)"),
    orgIds: z.array(z.number()).optional().describe("Organization IDs (create)"),
    name: z.string().optional().describe("Budget order name (create/update)"),
    startDate: z.string().optional().describe("Start date YYYY-MM-DD (create/update)"),
    endDate: z.string().optional().describe("End date YYYY-MM-DD (create/update)"),
    budgetAmount: z.string().optional().describe("Budget amount (create/update)"),
    currency: z.string().optional().describe("Currency code, e.g. 'USD' (create/update)"),
    orderNumber: z.string().optional().describe("Purchase/order number"),
    clientName: z.string().optional().describe("Client name"),
    primaryBuyerName: z.string().optional().describe("Primary buyer name"),
    primaryBuyerEmail: z.string().optional().describe("Primary buyer email"),
    billingEmail: z.string().optional().describe("Billing email"),
  })
  .superRefine((v, ctx) =>
    requireFields(ctx, v, {
      create: ["orgIds", "name", "startDate", "endDate", "budgetAmount", "currency"],
      update: ["budgetOrderId"],
    }),
  );

export const budgetOrderTools = [
  defineTool<z.infer<typeof manageBudgetOrdersSchema>>({
    name: "manage_budget_orders",
    description:
      "Manage budget orders (LOC/agency payment allocation). action: create | get | update. Budget orders cannot be deleted — update them instead.",
    schema: manageBudgetOrdersSchema,
    handler: async (client, a) => {
      switch (a.action) {
        case "create":
          return client.createBudgetOrder(a.orgIds!, {
            name: a.name!,
            startDate: a.startDate!,
            endDate: a.endDate!,
            budget: money(a.budgetAmount!, a.currency!),
            orderNumber: a.orderNumber,
            clientName: a.clientName,
            primaryBuyerName: a.primaryBuyerName,
            primaryBuyerEmail: a.primaryBuyerEmail,
            billingEmail: a.billingEmail,
          });
        case "get":
          return client.getBudgetOrders(a.budgetOrderId);
        case "update": {
          const bo: Parameters<typeof client.updateBudgetOrder>[1] = {};
          if (a.name) bo.name = a.name;
          if (a.startDate) bo.startDate = a.startDate;
          if (a.endDate) bo.endDate = a.endDate;
          if (a.budgetAmount && a.currency) bo.budget = money(a.budgetAmount, a.currency);
          if (a.orderNumber) bo.orderNumber = a.orderNumber;
          if (a.clientName) bo.clientName = a.clientName;
          if (a.primaryBuyerName) bo.primaryBuyerName = a.primaryBuyerName;
          if (a.primaryBuyerEmail) bo.primaryBuyerEmail = a.primaryBuyerEmail;
          if (a.billingEmail) bo.billingEmail = a.billingEmail;
          return client.updateBudgetOrder(a.budgetOrderId!, bo);
        }
      }
    },
  }),
];
