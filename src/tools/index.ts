import type { ToolDescriptor } from "../mcp/registry.js";
import { discoveryTools } from "./discovery.js";
import { campaignTools } from "./campaigns.js";
import { adGroupTools } from "./adgroups.js";
import { keywordTools } from "./keywords.js";
import { negativeKeywordTools } from "./negativeKeywords.js";
import { creativeTools } from "./creatives.js";
import { adTools } from "./ads.js";
import { productPageTools } from "./productpages.js";
import { budgetOrderTools } from "./budgetorders.js";
import { reportTools } from "./reports.js";
import { customReportTools } from "./customreports.js";

/** Every tool exposed by the server, in a sensible listing order. */
export const allTools: ToolDescriptor[] = [
  ...discoveryTools,
  ...campaignTools,
  ...adGroupTools,
  ...keywordTools,
  ...negativeKeywordTools,
  ...creativeTools,
  ...adTools,
  ...productPageTools,
  ...budgetOrderTools,
  ...reportTools,
  ...customReportTools,
] as ToolDescriptor[];
