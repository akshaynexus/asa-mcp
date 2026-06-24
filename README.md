<div align="center">

# 🍎 Apple Search Ads MCP Server

[![MCP](https://img.shields.io/badge/MCP-Compatible-blue?style=flat-square&logo=anthropic)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](https://opensource.org/licenses/MIT)

**Connect your AI assistant to Apple Search Ads**

Manage campaigns, ad groups, keywords, ads, creatives, budgets, and reports — all through natural language. Full Apple Ads Campaign Management API v5 coverage in **12 focused tools**.

[Getting Started](#quick-start) · [Available Tools](#available-tools) · [Usage Examples](#usage-examples) · [Troubleshooting](#troubleshooting)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📊 **Campaign Management** | Create, read, find, update, and delete campaigns |
| 🎯 **Ad Group Targeting** | Configure age, gender, device, location, and daypart targeting |
| 🔑 **Keyword Management** | Manage targeting keywords and negative keywords at all levels |
| 🖼️ **Ads & Creatives** | Manage creatives, Custom Product Pages, and ads that bind them to ad groups |
| 💳 **Budget Orders** | Create and manage budget orders for LOC/agency accounts |
| 📈 **Performance Reports** | Reports at campaign, ad group, keyword, search term, and ad levels |
| 🥇 **Impression Share** | Async share-of-voice, search popularity, and rank reports |
| 🔐 **Secure Auth** | OAuth 2.0 JWT-based authentication with automatic token refresh |
| 🧩 **Consolidated Tools** | One `manage_*` tool per resource with an `action` param — 12 tools, not 40+ |

## 📋 Prerequisites

- An [Apple Search Ads](https://searchads.apple.com) account (you need an app in the App Store to advertise)
- Node.js 18+ **OR** Docker
- OpenSSL (for generating keys)

## 🚀 Quick Start

### Option A: Run with Node.js

```bash
git clone https://github.com/akshaynexus/asa-mcp.git
cd asa-mcp
npm install
npm run build
```

### Option B: Run with Docker

```bash
git clone https://github.com/akshaynexus/asa-mcp.git
cd asa-mcp
npm install
npm run build
docker compose up --build
```

## 🔧 Setup Guide

<details>
<summary><strong>Step 1: Create an API User in Apple Search Ads</strong></summary>

Apple Search Ads requires a **separate API user** (not your main admin account) to access the API.

1. Sign in to [Apple Search Ads](https://searchads.apple.com) with your admin account
2. Go to **Account Settings** (click your name in the top right) > **User Management**
3. Click **Invite Users**
4. Fill in the new user details:
   - **Email**: Use a different email address (can be a `+` alias like `you+api@gmail.com`)
   - **First/Last Name**: Can be anything (e.g., "API User")
   - **Role**: Check **API Account Manager**
5. Click **Invite**

</details>

<details>
<summary><strong>Step 2: Sign In as the API User</strong></summary>

1. Open an **incognito/private browser window** (important - keeps your admin session separate!)
2. Check your email for the invitation from Apple Search Ads
3. Accept the invitation and set up the new API user account
4. Sign in to [Apple Search Ads](https://searchads.apple.com) with the **new API user credentials**

</details>

<details>
<summary><strong>Step 3: Generate Your API Keys</strong></summary>

On your local machine, run these commands to generate your private and public keys:

```bash
# Generate private key (keep this secret!)
openssl ecparam -genkey -name prime256v1 -noout -out private-key.pem

# Extract public key (this gets uploaded to Apple)
openssl ec -in private-key.pem -pubout -out public-key.pem

# Display public key to copy
cat public-key.pem
```

</details>

<details>
<summary><strong>Step 4: Upload Public Key to Apple Search Ads</strong></summary>

In the incognito window where you're signed in as the API user:

1. Go to **Account Settings** > **API**
4. Paste the entire contents of `public-key.pem` including:
   ```
   -----BEGIN PUBLIC KEY-----
   MFkw...(your key)...
   -----END PUBLIC KEY-----
   ```
5. Click **Save**
6. **Copy and save** the three values Apple shows you:
   - `clientId` (starts with `SEARCHADS.`)
   - `teamId` (starts with `SEARCHADS.`)
   - `keyId` (a UUID)

</details>

<details>
<summary><strong>Step 5: Find Your Organization ID</strong></summary>

Your `orgId` is in the URL when logged into Apple Search Ads:
```
https://app-ads.apple.com/cm/app/123456789/...
                              ↑↑↑↑↑↑↑↑↑
                              This is your orgId
```

</details>

<details>
<summary><strong>Step 6: Configure Environment Variables</strong></summary>

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
APPLE_ADS_CLIENT_ID=SEARCHADS.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
APPLE_ADS_TEAM_ID=SEARCHADS.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
APPLE_ADS_KEY_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
APPLE_ADS_PRIVATE_KEY_PATH=/absolute/path/to/private-key.pem
APPLE_ADS_ORG_ID=123456789
```

**Important**: Use the absolute path to your private key file.

</details>

<details>
<summary><strong>Step 7: Configure your MCP client</strong></summary>

Add the server to your MCP client config. The same `mcpServers` block works for any MCP client — Cursor, Claude Desktop, or Claude Code:

- **Cursor** — `~/.cursor/mcp.json` (macOS) · `%APPDATA%\Cursor\mcp.json` (Windows)
- **Claude Desktop** — `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) · `%APPDATA%\Claude\claude_desktop_config.json` (Windows)
- **Claude Code** — run `claude mcp add` or edit `~/.claude.json`

#### Using Node.js directly:

```json
{
  "mcpServers": {
    "apple-search-ads": {
      "command": "node",
      "args": ["/path/to/asa-mcp/dist/index.js"],
      "env": {
        "APPLE_ADS_CLIENT_ID": "SEARCHADS.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "APPLE_ADS_TEAM_ID": "SEARCHADS.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "APPLE_ADS_KEY_ID": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "APPLE_ADS_PRIVATE_KEY_PATH": "/path/to/private-key.pem",
        "APPLE_ADS_ORG_ID": "123456789"
      }
    }
  }
}
```

#### Using Docker:

```json
{
  "mcpServers": {
    "apple-search-ads": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "APPLE_ADS_CLIENT_ID=SEARCHADS.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "-e", "APPLE_ADS_TEAM_ID=SEARCHADS.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "-e", "APPLE_ADS_KEY_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "-e", "APPLE_ADS_ORG_ID=123456789",
        "-e", "APPLE_ADS_PRIVATE_KEY_PATH=/keys/private-key.pem",
        "-v", "/path/to/private-key.pem:/keys/private-key.pem:ro",
        "asa-mcp-apple-search-ads-mcp"
      ]
    }
  }
}
```

</details>

<details>
<summary><strong>Step 8: Restart your MCP client</strong></summary>

Restart your MCP client (Cursor, Claude Desktop, or Claude Code) completely for the server to load.

</details>

---

## 🛠️ Available Tools

The server exposes **12 focused tools**. Most are consolidated `manage_*` tools that take an `action` parameter (`create` / `get` / `find` / `update` / `delete`) instead of a separate tool per operation — fewer tools to reason about, with the same full coverage of the Apple Ads Campaign Management API v5.

| Tool | `action` / params | Description |
|------|-------------------|-------------|
| `get_user_acl` | _(none)_ | Get organizations and roles; find your `orgId` |
| `search` | `target: apps \| geo` | Find apps to promote (returns `adamId`) or targetable locations |
| `manage_campaigns` | create, get, find, update, delete | Campaign lifecycle |
| `manage_adgroups` | create, get, find, update, delete | Ad group lifecycle and targeting dimensions |
| `manage_keywords` | create, get, find, update | Targeting keywords in an ad group |
| `manage_negative_keywords` | `scope: campaign \| adgroup` × create, get, find, update, delete | Negative keywords at either level |
| `manage_creatives` | create, get, find | Creatives wrapping a Default/Custom Product Page |
| `manage_ads` | create, get, find, update, delete | Bind creatives to ad groups (find supports org-wide) |
| `get_product_pages` | `adamId` | An app's Custom Product Pages (returns `productPageId`) |
| `manage_budget_orders` | create, get, update | Budget orders (no delete by API design) |
| `get_reports` | `type: campaign \| adgroup \| keyword \| searchterm \| ad` | Performance reports at any level |
| `manage_custom_reports` | create, get | Async Impression Share reports (share of voice, rank) |

> **How `action` works:** each tool validates only the fields relevant to the chosen action. For example, `manage_campaigns` with `action: "create"` requires `name`, `adamId`, `countriesOrRegions`, `budgetAmount`, and `currency`, while `action: "delete"` only requires `campaignId`. Invalid combinations return a clear validation error.

---

## 💬 Usage Examples

Once configured, you can ask your AI assistant (Cursor, Claude Desktop, or Claude Code) to manage your account in plain language — it picks the right tool and `action` for you:

```
📊 "Show me how my campaigns performed last week"            → get_reports (type: campaign)

🚀 "Create a campaign for my app (adamId: 123456789)          → manage_campaigns (action: create)
    targeting US and Canada with a $1000 budget"

🔑 "Add these keywords to my ad group: fitness app,          → manage_keywords (action: create)
    workout tracker, exercise planner"

⏸️ "Find keywords with CTR below 1% and pause them"          → manage_keywords (find + update)

🔍 "Show me the search terms report to find new keywords"    → get_reports (type: searchterm)

🖼️ "Create a creative from my Custom Product Page and run    → manage_creatives + manage_ads
    an ad for it in ad group 42"

🥇 "Pull an impression share report for the US over the      → manage_custom_reports (action: create)
    last 4 weeks"
```

---

## 🐛 Troubleshooting

<details>
<summary><strong>"API credentials not configured"</strong></summary>

- Make sure all 5 environment variables are set
- Check that `APPLE_ADS_PRIVATE_KEY_PATH` is an absolute path
- Restart your MCP client after changing the MCP config

</details>

<details>
<summary><strong>"Failed to fetch access token"</strong></summary>

- Verify your private key matches the public key you uploaded
- Check that `clientId`, `teamId`, and `keyId` are correct
- Make sure the API user invitation was accepted

</details>

<details>
<summary><strong>"Forbidden" or permission errors</strong></summary>

- Verify your API user has "API Account Manager" role
- Check that `orgId` is correct (from the URL)
- Try `get_user_acl` to see what orgs you have access to

</details>

<details>
<summary><strong>"Invalid public key" when uploading</strong></summary>

- Make sure you're copying the entire key including `-----BEGIN PUBLIC KEY-----` and `-----END PUBLIC KEY-----`
- Try using Safari if other browsers give errors
- Disable ad blockers

</details>

---

## 🐳 Docker Commands Reference

```bash
# Build the image
npm run build
docker compose build

# Run with docker compose (uses .env file)
docker compose up

# Run directly with docker
docker run -it --rm \
  -e APPLE_ADS_CLIENT_ID=SEARCHADS.xxx \
  -e APPLE_ADS_TEAM_ID=SEARCHADS.xxx \
  -e APPLE_ADS_KEY_ID=xxx \
  -e APPLE_ADS_ORG_ID=123456789 \
  -e APPLE_ADS_PRIVATE_KEY_PATH=/keys/private-key.pem \
  -v $(pwd)/private-key.pem:/keys/private-key.pem:ro \
  asa-mcp-apple-search-ads-mcp

# Stop containers
docker compose down
```

---

## 🧱 Development & Architecture

```
src/
  index.ts            # thin entry: build client provider, register tools, start stdio server
  auth.ts             # OAuth (ES256 JWT → access token, cached)
  client.ts           # typed Apple Ads REST client (one method per endpoint)
  mcp/
    schema.ts         # shared zod fragments + helpers (buildSelector, money, requireFields, zodToInputSchema)
    registry.ts       # ToolDescriptor + registerTools (validation, errors, serialization)
  tools/
    index.ts          # aggregates every tool into `allTools`
    *.ts              # one file per resource, each exporting ToolDescriptor[]
test/                 # node:test unit tests (run with tsx)
```

Key ideas that keep the code DRY and testable:

- **One schema per tool.** Tools declare a single `zod` schema; the MCP `inputSchema` is generated from it (`zodToInputSchema`) — no more hand-written JSON Schema duplicated alongside zod.
- **Registry instead of a switch.** `registerTools` centralizes argument validation, credential checks, error formatting, and JSON serialization, so each handler is a small pure function `(client, args) => data`.
- **Consolidated `manage_*` tools.** Per-action required fields are enforced with `requireFields` in a `superRefine`, so one tool safely covers create/get/find/update/delete.

```bash
npm run build       # compile to dist/
npm test            # run unit tests (tsx + node:test)
npm run typecheck   # type-check without emitting
```

Handlers are tested by validating against the real tool schema and dispatching to a recording mock client (`test/helpers.ts`) — no network or credentials required.

---

## 📚 API Reference

This MCP server implements the [Apple Search Ads Campaign Management API](https://developer.apple.com/documentation/apple_ads).

| Resource | Link |
|----------|------|
| Campaign Management API Overview | [Apple Ads Help](https://ads.apple.com/app-store/help/campaigns/0022-use-the-campaign-management-api) |
| Apple Developer Documentation | [Apple Developer](https://developer.apple.com/documentation/apple_ads) |
| Model Context Protocol | [MCP Docs](https://modelcontextprotocol.io) |

---

## 🔒 Security Notes

> **Warning**
> Never commit your `.env` file or `private-key.pem` to git!

- The `.gitignore` is configured to exclude these files
- Keep your private key secure — if compromised, regenerate both keys and re-upload

---

## 📄 License

MIT

---

<div align="center">

**[⬆ Back to Top](#-apple-search-ads-mcp-server)**

Made with ❤️ for the MCP community

</div>
