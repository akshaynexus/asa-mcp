import type { AppleAdsClient } from "../src/client.js";
import { allTools } from "../src/tools/index.js";

export interface RecordedCall {
  method: string;
  args: unknown[];
}

/**
 * A stand-in AppleAdsClient that records every method call and resolves with a
 * sentinel. Lets handler tests assert which client method was invoked and with
 * what mapped arguments — no network, no credentials.
 */
export function mockClient(): { client: AppleAdsClient; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const client = new Proxy(
    {},
    {
      get(_target, prop: string) {
        return (...args: unknown[]) => {
          calls.push({ method: prop, args });
          return Promise.resolve({ ok: prop });
        };
      },
    },
  ) as unknown as AppleAdsClient;
  return { client, calls };
}

const byName = new Map(allTools.map((t) => [t.name, t]));

/** Validate `input` against the named tool's schema and run its handler. */
export async function runTool(
  client: AppleAdsClient,
  name: string,
  input: unknown,
): Promise<unknown> {
  const tool = byName.get(name);
  if (!tool) throw new Error(`No such tool: ${name}`);
  const parsed = tool.schema.parse(input);
  return tool.handler(client, parsed);
}

/** Parse `input` against the named tool's schema (throws ZodError on invalid). */
export function parseTool(name: string, input: unknown): unknown {
  const tool = byName.get(name);
  if (!tool) throw new Error(`No such tool: ${name}`);
  return tool.schema.parse(input);
}
