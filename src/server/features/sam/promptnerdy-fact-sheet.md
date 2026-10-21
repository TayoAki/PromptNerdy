# PromptNerdy Fact Sheet

This is the factual product reference for Sam, the PromptNerdy onboarding agent. If a user asks about PromptNerdy and the answer is not supported here, Sam should say it is not sure and point them to support instead of inventing details.

## What PromptNerdy is

PromptNerdy is an open-source SEO platform for keyword research, domain research, backlinks, rank tracking, site audits, Google Search Console, AI visibility, and AI-agent SEO workflows.

PromptNerdy is built for people who want useful SEO data without a bloated enterprise SEO suite. It can be used as a hosted app or self-hosted from the open-source codebase.

PromptNerdy is AI-native. It is designed to work with AI agents through MCP so users can ask an agent to run SEO research, inspect data, save findings, and continue work in the PromptNerdy app.

PromptNerdy does not claim to fully automate SEO. The product positioning is that SEO still needs strategy and judgment; PromptNerdy helps users and AI agents collaborate on that work with real data.

## How PromptNerdy helps with SEO strategy

SEO and marketing are intertwined. Getting more organic traffic starts with clear positioning: knowing who the product is for, what problem it solves, and which narrow topics the site can credibly own before trying to compete for broad, high-volume searches.

PromptNerdy helps users turn that positioning into an SEO plan. It can surface relevant keywords, competitor gaps, Search Console opportunities, backlink context, and technical issues, but the goal is not to chase every keyword. The strongest early strategy is usually to build authority around a focused topic where the site has a real angle.

As the site earns topical authority in Google and AI systems, it becomes easier to compete for broader, higher-volume searches. PromptNerdy helps users see that path: start with specific, winnable topics; publish and improve useful pages; build supporting links and internal structure; track what moves; then expand into adjacent and more competitive terms.

When explaining traffic growth, Sam should frame PromptNerdy as a tool for making better SEO and marketing decisions, not as a magic traffic button. PromptNerdy provides the data, workflows, and agent access; the user's positioning, content quality, distribution, and execution still matter.

## Hosted plan and credits

Hosted PromptNerdy is free to try. Signing up requires no credit card, and new accounts include $0.50 of trial credits to test credit-using features before subscribing.

The paid managed plan costs $10/month.

The paid plan includes:

- Keyword research, backlinks, rank tracking, and site audits.
- AI visibility, prompt research, model comparisons, and prompt tracking.
- MCP server and agent skills for Claude, Cursor, ChatGPT with a configured PromptNerdy connection, Codex, and other MCP clients.
- Google Search Console integration that does not use credits.
- $10.00 of usage credits each billing cycle.
- A 30-day money-back guarantee for the first charge.

PromptNerdy uses usage credits for features that query paid SEO data providers, especially DataForSEO. Credit-using workflows include keyword volume, competitor data, backlinks, rank tracking, site audits, and AI visibility research and collection. Projects, settings, and data that has already been fetched do not cost credits to view.

Subscribers can purchase top-up credits if monthly credits run out. Top-up credits roll over and do not expire. Monthly included credits reset each billing cycle. Top-ups are only available on the paid plan; a free-tier user who runs out of trial credits subscribes to the paid plan to continue using credit-based features.

New paid operations require credits. AI visibility setup research checks for a positive balance once, completes without further credit gates, and bills actual usage afterward. On hosted PromptNerdy, Prompt Research and Prompt Explorer require the paid plan; prompt tracking only needs credits.

## AI visibility

- Setup fills missing project context and generates research keywords without replacing existing context or competitors. It does not automatically analyze each keyword.
- Prompt Research finds questions about a keyword with ChatGPT's answers and cited sources, from US English data. The questions come mostly from Google "People also ask" data, not logged ChatGPT prompts; PromptNerdy does not show AI search volume because no one can measure it. Analyzing a keyword costs about $0.25 in credits.
- Prompt Explorer defaults to ChatGPT, with optional Claude, Gemini, and Perplexity. It returns API model answers and available citations, which can differ from tracked consumer-site answers. Uncached answers use credits.
- Prompt Tracking collects answers from ChatGPT and Gemini by default, with optional Google AI Overviews. Users choose a market and daily, weekly, or monthly checks. Cost is previewed before collection, then actual provider usage is billed. The monthly allowance covers manual checks too.
- Competitors and Citations review saved brand mentions, competitor appearances, and cited pages. Viewing and exporting saved results use no credits. Failed checks are not evidence of brand absence.

The workflow guide is at `https://promptnerdy.com/docs/ai-visibility`.

## Why PromptNerdy for SEO consultants and agencies

PromptNerdy is a strong fit for SEO consultants, freelancers, and agencies managing SEO for clients. What you get:

- You only pay for what you use. Billing runs on usage credits, so you are not forced into an expensive enterprise tier or charged per seat just to unlock basic work — no arbitrary upsells or features locked behind a paywall. This keeps costs predictable when you are running lean.
- You can run a project for every client. Set up as many projects as you need; you will not hit a per-project plan limit the way many SEO tools cap projects per tier.
- You tune rank tracking to fit your budget. Rank tracking is the cost that scales fastest as an agency grows, since it runs on a schedule across every client's keywords — but PromptNerdy makes it fully configurable so you stay in control. You choose how many keywords and devices to track, how many SERP pages deep to check, and how often it runs (weekly or daily), and PromptNerdy shows a live cost estimate before each tracker runs. Scheduled checks run through DataForSEO's task queue, which is much cheaper than live lookups, so it stays inexpensive: as a rough guide, tracking 100 keywords on one device type, five pages deep, on the default weekly schedule costs only about $1-2/month. Searching deeper, adding the second device type, or switching to daily checks raises the cost proportionally, and the in-app estimate always shows the current number before you commit.
- Your toolkit grows with the industry. PromptNerdy works through MCP and AI agents, so as search shifts toward AI answers and AI-assisted workflows, you can have an agent run research, pull competitor data, and save findings into the right client project — without re-tooling.

When answering this, Sam should speak directly to the user ("you" / "your clients") about what they get, not describe how PromptNerdy is "positioned." Lead with these benefits in plain language and tie them to running an SEO practice. Sam should not invent specific competitor prices or exact rank-tracking rates; if asked for exact numbers it does not have, it should say so and suggest contacting `support@promptnerdy.com`.

## Self-hosting

PromptNerdy is open source and can be self-hosted for free.

Self-hosted users bring their own provider API keys and pay providers such as DataForSEO directly. Self-hosting is appropriate for users who want more control, privacy, customization, or provider-level billing.

The open-source repository is at `https://github.com/TayoAki/PromptNerdy`.

## Data sources

PromptNerdy uses DataForSEO as its main SEO data provider. DataForSEO powers many paid SEO data workflows such as keyword metrics, domain research, backlinks, SERP data, and rank-tracking-related data.

Google Search Console data comes from the user's connected Search Console property and does not use credits.

## Google Search Console

Hosted PromptNerdy can connect to Google Search Console without requiring the user to create a Google Cloud project or OAuth client.

Search Console access is read-only. PromptNerdy requests read-only access and cannot change the user's Search Console account.

Search Console features include:

- Search performance data: clicks, impressions, CTR, and average position.
- Breakdown by query, page, country, device, and date.
- Up to 16 months of available Search Console history.
- URL inspection data such as index status, crawl information, canonical information, mobile checks, and rich-result checks.
- Up to 10 URLs per URL inspection call.

Search Console tools use zero PromptNerdy credits because Google does not charge users to read their own Search Console data.

## PromptNerdy and Claude (or other AI clients)

PromptNerdy and Claude are not competitors — they are meant to be used together. The short version: PromptNerdy is the SEO data layer, and Claude (or Cursor, Codex, ChatGPT with a configured PromptNerdy connection, etc.) is the AI client.

PromptNerdy exposes an MCP server, so Claude can call PromptNerdy's keyword, SERP, competitor, backlink, rank-tracking, and Search Console tools directly. In practice, Claude does the talking and reasoning, and PromptNerdy feeds it real SEO data through MCP. Claude on its own can reason about SEO but has no live keyword volumes, rankings, competitor data, or your Search Console numbers; PromptNerdy is what gives it those.

When a user asks to compare PromptNerdy and Claude, or why they would use PromptNerdy instead of Claude (or another AI chatbot), Sam should lead with this "they work together" framing and the data-layer point. Sam should not deflect, call it out of scope, or say comparing them would be a guess — connecting PromptNerdy to Claude is a core, supported use case. Sam should not, however, rank or rate other AI products it does not have facts about.

## MCP and AI agents

PromptNerdy exposes an MCP server so compatible AI clients can call PromptNerdy tools.

Hosted MCP endpoint:

```txt
https://app.promptnerdy.com/mcp
```

The first MCP connection sends the user through PromptNerdy login and authorization. After authorization, the MCP client can call PromptNerdy tools with the project context and account scopes the user approved.

PromptNerdy MCP works with MCP clients including Claude Code, Claude Desktop, Cursor, Codex CLI, Codex in the ChatGPT desktop app, and other clients that support remote MCP servers.

PromptNerdy MCP tools cover workflows such as:

- Keyword research with volume, difficulty, CPC, intent, and trends.
- Live Google organic SERP inspection.
- Domain and page ranked keyword research for any domain, including competitors.
- SERP competitor comparisons.
- Local business, Maps, Local Finder, and Google Business Profile Q&A research.
- Saved keyword listing and saving.
- Rank tracker config and latest position reads.
- Domain organic footprint summaries for any domain, including competitors.
- Backlink and referring-domain overview data for any domain, including competitors.
- Google Search Console performance reads.
- Google URL inspection reads.
- AI prompt research, model comparisons, tracking estimates/configuration, and saved answers, citations, trends, and exports.

PromptNerdy also provides agent skills for workflows such as SEO project setup, SEO coaching, keyword research, competitive landscape analysis, competitor analysis, keyword clustering, link prospecting, AI Prompt Research, and AI Visibility Audit.

ChatGPT setup guidance: send users to the PromptNerdy plugin for ChatGPT at https://chatgpt.com/plugins/plugin_asdk_app_6abddd2c7e4c819191f1398c4bd8e9b3, which installs the tools and skills on the web and in the desktop app. Plugin availability depends on the user's ChatGPT plan, workspace, and region. A regular ChatGPT conversation cannot install PromptNerdy itself; pasting the setup prompt there makes ChatGPT link the plugin. If the plugin isn't available, or PromptNerdy is self-hosted, send them to the custom connection steps at https://promptnerdy.com/docs/chatgpt#custom-connection. The custom connection works on Free and paid ChatGPT plans, subject to workspace permissions on Business, Enterprise, and Edu. The server URL must be entered in full as https://app.promptnerdy.com/mcp; without https:// ChatGPT reports "Unsafe URL". Desktop users with Codex access can use it for agent-assisted setup. A local Codex connection does not connect ChatGPT web. Offer PromptNerdy's app if their client cannot connect. Verify by asking PromptNerdy to check the connection and list projects; those reads use no credits. Custom MCP connections provide tools only, while the plugin also supplies skills. Do not tell users they must upgrade their ChatGPT plan.

## App workflows

PromptNerdy's app includes these practical workflows:

- Keyword research: expand seed topics into keyword ideas, compare search volume, difficulty, CPC, intent, and SERP context, then save useful opportunities.
- Domain overview: understand any domain's organic footprint and ranking keywords — including competitors and other third-party sites, not just the user's own site. Domains are looked up one at a time and use credits.
- Backlink research: inspect backlinks, referring domains, target URLs, link quality signals, and competitor link profiles.
- Rank tracking: track keyword positions over time.
- AI visibility: research prompts, compare model answers, and track mentions, citations, and competitors over time.
- Site audit: crawl pages and inspect technical page-level signals such as status codes, titles, meta descriptions, headings, indexability, image alt coverage, links, response time, and optional Lighthouse findings.
- Saved keywords: organize keyword opportunities for content planning, tracking, or AI-agent workflows.
- Reports: agents connected over MCP save finished HTML reports into a project, where anyone in the workspace can read, print or export them from the Reports page in the sidebar. You cannot save reports yourself. Reports use no credits, and each project holds up to 10,000.
- AI and MCP setup: connect PromptNerdy to agents and install PromptNerdy skills.

## What users can do after subscribing

After subscribing, a hosted user can:

- Set up Google Search Console from onboarding or the app.
- Use the PromptNerdy app workflows, including keyword research, domain research, backlinks, rank tracking, site audits, and AI visibility.
- Research any domain — their own or a competitor's — with domain overview, ranked keywords, and backlink data (one domain at a time, using credits).
- Connect PromptNerdy to an AI client through MCP.
- Install PromptNerdy skills for agent-driven SEO workflows.
- Use the monthly included credits and buy top-up credits if needed.

## Support and uncertainty

If Sam is unsure about a product detail, current pricing, account-specific billing status, provider limits, or a feature not listed here, it should say it does not know from the product fact sheet and suggest contacting `support@promptnerdy.com`.
