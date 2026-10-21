# PromptNerdy

> Open source alternative to Semrush and Ahrefs

PromptNerdy is an SEO tool for _the people_. If tools like Semrush or Ahrefs are too expensive or bloated, PromptNerdy is a pay-as-you-go alternative that you actually control.

> All-in-one SEO tool for you and your AI agent.

Connect with any agent like Claude Code, OpenClaw or Hermes. We have pre-built skills, but you can build your own to tailor PromptNerdy to your needs.

## Hosted Version

Try PromptNerdy for free on our website. If you want to support the project, a hosted subscription is $10/month.

[promptnerdy.com](https://promptnerdy.com)

## Why use PromptNerdy?

- Best in class MCP and AI Skills.
- Modern, simple UI.
  - Focused workflows instead of a bloated, complex SEO suite.
- No subscriptions.
  - Bring your own DataForSEO API key and pay only for what you use.
- Fork and vibe code your own custom tool.

## Main SEO Workflows

- Keyword research
- Rank tracking
- Competitor Insights
- Backlinks
- Site Audits
- AI Visibility

## PromptNerdy MCP & Agent Skills

PromptNerdy exposes an MCP server so AI agents like Claude Code, OpenClaw, and Hermes can use your SEO data directly. Agent Skills are reusable workflows that guide your agent through SEO tasks using the MCP.

- [Set up ChatGPT web or desktop](https://promptnerdy.com/docs/chatgpt) (works on Free and paid ChatGPT plans)
- [Set up Codex](https://promptnerdy.com/docs/codex-plugin)
- [Set up PromptNerdy MCP](https://promptnerdy.com/docs/mcp)
- [Set up PromptNerdy Agent Skills](https://promptnerdy.com/docs/skills/setup)

## Self-Hosting

PromptNerdy supports two self-hosting paths:

- **Simple: Docker (Best for testing it out)** - For personal use on your own machine. See [`docs/SELF_HOSTING_DOCKER.md`](./docs/SELF_HOSTING_DOCKER.md).
  - Unless you already are self-hosting other apps and are confident doing so, we recommend self-hosting with Cloudflare as opposed to Railway, Coolify or Dokploy.
  - We plan to make it simpler to host on those platforms in the next few months.
- **Recommended: Cloudflare** - For internet-facing self-hosting across multiple devices or with your team (works on the free plan). See [`docs/SELF_HOSTING_CLOUDFLARE.md`](./docs/SELF_HOSTING_CLOUDFLARE.md).

Either way, you need a DataForSEO API key to get SEO data. See [`docs/DATAFORSEO_API_KEY.md`](./docs/DATAFORSEO_API_KEY.md).

## Costs

PromptNerdy needs a [DataForSEO](https://dataforseo.com/) API key so that you can get SEO data. You pay them directly when self hosting.

See [promptnerdy.com/pricing](https://promptnerdy.com/pricing)

When you self host, your costs will be slightly lower than the estimates on our website. The way the hosted service makes money is by charging 28% extra for every request we make to DataForSEO.

## Local Development

See [`docs/LOCAL_DEVELOPMENT.md`](./docs/LOCAL_DEVELOPMENT.md).

## Contributing

Creating clear issues is the best way to contribute.

Read more here: [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md)

We have this skill: `/simple-issue-description` which helps.

```sh
npx skills add TayoAki/PromptNerdy --skill simple-issue-description
```

## Community

Sign up for the mailing list on our website: [promptnerdy.com](https://promptnerdy.com)
