---
title: "Set up PromptNerdy Agent Skills"
description: "Add PromptNerdy skill files to your AI agent after connecting PromptNerdy MCP."
---

PromptNerdy Agent Skills are separate files from PromptNerdy MCP.

On Claude Code or Claude Cowork, skip the steps below and use the [PromptNerdy plugin](/docs/claude-code-plugin) instead — it installs MCP and every skill in one step. On Codex CLI, use the [PromptNerdy plugin](/docs/codex-plugin) the same way.

First, [set up PromptNerdy MCP](/docs/mcp). MCP gives your agent access to PromptNerdy data.

Then add the PromptNerdy `SKILL.md` files you want your agent to use. Each skill gives your agent one SEO workflow.

## ChatGPT

Use the [ChatGPT setup guide](/docs/chatgpt). A directory plugin can include skills; a custom MCP connection provides tools only. You can ask for SEO research in plain language with those tools. The terminal commands below apply to agents with a local skills installer, such as Codex or Claude Code.

## Choose an installation option

Pick the option that matches how you want to install the files.

### Option 1: Install and choose interactively

Use this if you want the installer to show the available skills and agents.

```bash
npx skills add TayoAki/PromptNerdy
```

### Option 2: Install all PromptNerdy skills

Use this if you want every PromptNerdy skill.

```bash
npx skills add TayoAki/PromptNerdy --skill '*'
```

### Option 3: Install all skills for Claude Code only

Use this if the skills should be available in Claude Code only.

```bash
npx skills add TayoAki/PromptNerdy --skill '*' --agent claude-code
```

### Option 4: Install all skills for OpenAI Codex only

Use this if the skills should be available in Codex only.

```bash
npx skills add TayoAki/PromptNerdy --skill '*' --agent codex
```

### Option 5: Copy the skill files manually

Use this if you prefer to copy files into your agent's skills folder.

```bash
git clone https://github.com/TayoAki/PromptNerdy.git

# Codex
mkdir -p ~/.codex/skills
cp -R promptnerdy/plugins/promptnerdy/skills/* ~/.codex/skills/

# Claude Code
mkdir -p ~/.claude/skills
cp -R promptnerdy/plugins/promptnerdy/skills/* ~/.claude/skills/
```

You can also review the source skills on GitHub:

- [PromptNerdy Agent Skills on GitHub](https://github.com/TayoAki/PromptNerdy/tree/main/.agents/skills)

Each skill page also links to its source `SKILL.md`.

## Update installed skills

Use the [update prompt or commands for your installation method](/docs/agent-setup#update-your-skills). Update the PromptNerdy plugin if it supplies your skills; otherwise use the installer you originally chose or update your manual copies.

## Run a skill

Use your agent's skill picker or ask for a workflow by name. In Codex, type `$`; Claude Code plugin skills use `/promptnerdy:skill-name`. Other clients have their own invocation syntax. The available workflows include:

- `seo-project-setup`
- `seo-coach`
- `keyword-research`
- `keyword-clustering`
- `competitive-landscape`
- `competitor-analysis`
- `link-prospecting`
- `local-seo`
- `seo-audit`

## Next step

Start with [SEO Project Setup](/docs/skills/seo-project-setup) if this is a new SEO project, or [SEO Coach](/docs/skills/seo-coach) if you are not sure which workflow to run first.
