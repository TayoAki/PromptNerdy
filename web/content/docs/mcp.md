---
title: "Set up PromptNerdy MCP"
description: "Connect PromptNerdy MCP to ChatGPT, Claude, Codex, and other AI clients."
---

PromptNerdy MCP lets compatible AI clients call PromptNerdy tools for keyword research, SERP inspection, local business research, competitive search intelligence, domain research, backlink overview, saved keywords, rank tracking, shared project context, and Google Search Console performance and URL inspection.

The hosted MCP server URL is:

```txt
https://app.promptnerdy.com/mcp
```

The first connection sends you through PromptNerdy login. After authorization, your MCP client can call PromptNerdy tools with the project context and account scopes you approved. For headless environments and CI, [connect with an API key](#connect-with-an-api-key) instead.

For the most current setup UI and a copyable endpoint, open [Agent setup in PromptNerdy](https://app.promptnerdy.com/ai).

For setup prompts, plugin commands, and skill updates, see [Agent setup](/docs/agent-setup).

No account yet? Try the [free SEO tools](/tools).

## ChatGPT web and desktop

Install the [PromptNerdy plugin for ChatGPT](https://chatgpt.com/plugins/plugin_asdk_app_6abddd2c7e4c819191f1398c4bd8e9b3). It adds MCP and the SEO skills together. If the plugin isn't available for your account, or you self-host PromptNerdy, add a [custom connection](/docs/chatgpt#custom-connection) instead. The [ChatGPT setup guide](/docs/chatgpt) covers both.

## Claude Code

The [PromptNerdy plugin](/docs/claude-code-plugin) is the preferred way to connect Claude Code — one install adds MCP and the public SEO skills together. Use the steps below only if you want MCP on its own.

Use user scope to make PromptNerdy available across projects. Use local scope for the current repository.

```bash
claude mcp add --transport http --scope user promptnerdy https://app.promptnerdy.com/mcp
```

After adding the server, approve the PromptNerdy login when prompted.

## Claude Desktop

On a paid Claude plan, prefer the [PromptNerdy plugin](/docs/claude-code-plugin#install-in-claude-cowork), which adds MCP and the SEO skills in one install. Use the custom connector below for MCP only or on the Free plan.

1. Open Customize -> Connectors.
2. Click Add (or +), then choose Add custom connector.
3. Paste `https://app.promptnerdy.com/mcp`.
4. Approve the PromptNerdy login when prompted.

Claude Desktop custom connectors are available on Free, Pro, Max, Team, and Enterprise plans. Free plans support one custom connector.

## Cursor

1. Open Cursor Settings -> Tools & Integrations -> MCP Tools.
2. Click New MCP Server. Cursor opens `mcp.json`.
3. Add:

```json
{
  "mcpServers": {
    "promptnerdy": {
      "url": "https://app.promptnerdy.com/mcp"
    }
  }
}
```

4. Approve the PromptNerdy login when prompted.

## Codex CLI

The [PromptNerdy plugin](/docs/codex-plugin) is the preferred way to connect Codex CLI — one install adds MCP and the public SEO skills together. Use the steps below only if you want MCP on its own.

Run this in your terminal:

```bash
codex mcp add promptnerdy --url https://app.promptnerdy.com/mcp
```

Approve the login when prompted.

## Codex in the ChatGPT desktop app

The [PromptNerdy plugin](/docs/codex-plugin#desktop-app) includes MCP and SEO skills. For MCP alone:

1. Open **Codex**, then **Settings → MCP servers → Add server**.
2. Name it `promptnerdy`, choose **Streamable HTTP**, and enter `https://app.promptnerdy.com/mcp`.
3. Save and select **Restart** when prompted.
4. Select **Authenticate** for PromptNerdy and approve sign-in when prompted. Skip this step for a local server configured without authentication.
5. Start a new Codex chat and ask: “Use PromptNerdy to check my connection and list my projects.”

This local connection is separate from ChatGPT web. See [OpenAI's MCP documentation](https://learn.chatgpt.com/docs/extend/mcp).

## Connect with an API key

Use an API key in headless environments, CI, or clients where OAuth is inconvenient. API keys are personal: anything an agent does with your key acts as you in your workspace.

In the [PromptNerdy app](https://app.promptnerdy.com/settings), open **Settings -> API keys**, create a key, and copy it when it appears. It won't be shown again.

For Claude Code, run:

```bash
claude mcp add --transport http --scope user promptnerdy https://app.promptnerdy.com/mcp --header "Authorization: Bearer pnrd_YOUR_KEY"
```

For Cursor, add `headers` to the server entry in `mcp.json`:

```json
{
  "mcpServers": {
    "promptnerdy": {
      "url": "https://app.promptnerdy.com/mcp",
      "headers": {
        "Authorization": "Bearer pnrd_YOUR_KEY"
      }
    }
  }
}
```

For Codex CLI, put the key in an environment variable and reference it:

```bash
export PROMPTNERDY_API_KEY=pnrd_YOUR_KEY
codex mcp add promptnerdy --url https://app.promptnerdy.com/mcp --bearer-token-env-var PROMPTNERDY_API_KEY
```

Any other client that supports custom HTTP headers can send `Authorization: Bearer pnrd_YOUR_KEY` or `x-api-key: pnrd_YOUR_KEY`.

## Available tools

PromptNerdy MCP exposes tools for SEO research workflows:

- Research keywords with volume, difficulty, and CPC.
- Fetch live Google organic SERP results for keywords.
- Find exact keyword, page, rank, volume, CPC, intent, and traffic rows for a domain or page.
- Compare SERP competitors across a supplied keyword set.
- Search local businesses near a coordinate, filtering by rating, review count, or claimed status.
- Fetch one Maps or Local Finder SERP, and read Google Business Q&A when needed.
- Audit a Google Business Profile: categories, rating, hours, photos, and claim status.
- Collect Google reviews (including reviews from other sites) and Google Business posts.
- Look up valid Google Business category slugs.
- Check Google Maps rank at each point of a grid around a business.
- Hydrate keywords with search volume, difficulty, intent, CPC, and trends.
- List saved keywords from a PromptNerdy project.
- Save useful keywords back to PromptNerdy.
- Read rank tracker configs and latest keyword positions.
- Summarize a domain's organic footprint.
- Find keywords a domain already ranks for.
- Check backlink and referring-domain overview data.
- Explore a prompt in ChatGPT or compare answers and available citations across selected AI models. ChatGPT is the default; uncached answers use credits.
- Research questions about a keyword with ChatGPT's answers and cited sources (uses credits).
- Configure AI prompt tracking, preview cost, and start or pause scheduled checks.
- Read and export saved AI answers, trends, citations, and competitor appearances without using credits.
- Read first-party Google Search Console performance (clicks, impressions, CTR, position).
- Inspect index status, crawl, and canonical for specific URLs (up to 10 per call).
- Tell Bing and other IndexNow search engines which pages on your site were added, changed, or removed (free, no credits). Your site hosts the project's key file, shown in Settings > Integrations. Google doesn't use IndexNow.
- Read and update a project's shared context: business, goal, positioning, writing preferences, competitors, key pages, and a research log (free, no credits).
- Save and read HTML reports on a project (free, no credits). New reports are private. On hosted PromptNerdy, explicitly ask the agent to publish with `set_report_sharing` (`public: true`) or revoke the link (`public: false`). `get_report` returns `report.shareUrl` for an existing public link, or `null` when unavailable.
- List a project's report templates, and save a reusable report brief to the project (free, no credits).

## What to do after setup

See the [AI Visibility guide](/docs/ai-visibility) for supported engines, research coverage, and costs.

Once PromptNerdy MCP is connected, [set up PromptNerdy Agent Skills](/docs/skills/setup). MCP gives your agent access to PromptNerdy data. Skills are separate `SKILL.md` files that tell your agent how to use that data for specific SEO jobs.

Start with one focused workflow instead of asking your agent to "do SEO" broadly.

- Use [SEO project setup](/docs/skills/seo-project-setup) to save your goals, positioning, competitors, and key pages to your project context, so every other skill reuses them.
- Use [SEO coach](/docs/skills/seo-coach) if you are new to SEO or are not sure which workflow to run first.
- Use [AI Prompt Research](/docs/skills/ai-prompt-research) to find questions and cited sources before choosing what to track.
- Use [AI Visibility Audit](/docs/skills/ai-visibility-audit) to investigate why competitors appear and which changes to try.
- Use [keyword research](/docs/skills/keyword-research) to discover keyword opportunities.
- Use [competitive landscape](/docs/skills/competitive-landscape) to map a market before choosing competitors or pages.
- Use [competitor analysis](/docs/skills/competitor-analysis) to study one competitor.
- Use [keyword clustering](/docs/skills/keyword-clustering) to turn keywords into page groups.
- Use [link prospecting](/docs/skills/link-prospecting) to find outreach prospects for a linkable asset.

## Troubleshooting

If your client cannot connect, check that the server URL is exactly `https://app.promptnerdy.com/mcp`.

If Codex reports `Authorization server response missing required issuer: expected https://app.promptnerdy.com`, upgrade Codex CLI or the Codex desktop app to 0.147.0 or later. Codex 0.143 through 0.146 drop the issuer from the OAuth callback. You can also [connect with an API key](#connect-with-an-api-key) instead of OAuth.

If authorization fails, disconnect the PromptNerdy server in your client, add it again, and repeat the login flow.

If your agent cannot find a project, ask it to list PromptNerdy projects first and use the returned project ID in later tool calls.
