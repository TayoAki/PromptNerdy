---
title: "Use PromptNerdy with ChatGPT"
description: "Install the PromptNerdy plugin in ChatGPT, or add a custom connection, and check that it works."
---

Install the [PromptNerdy plugin for ChatGPT](https://chatgpt.com/plugins/plugin_asdk_app_6abddd2c7e4c819191f1398c4bd8e9b3) to use PromptNerdy on chatgpt.com and in the ChatGPT desktop app. It adds the PromptNerdy tools and SEO skills, and you sign in with your PromptNerdy account.

If you paste the setup prompt into a regular ChatGPT chat, it sends you to the plugin. ChatGPT cannot install it by itself.

## Choose your setup path

| Where you want to work                   | How to connect                                                     |
| ---------------------------------------- | ------------------------------------------------------------------ |
| ChatGPT on the web or in the desktop app | [Install the PromptNerdy plugin](#install-the-promptnerdy-plugin)  |
| Plugin unavailable, or self-hosted       | [Add a custom connection](#custom-connection)                      |
| Codex in the ChatGPT desktop app         | [Paste the agent setup prompt in Codex](#codex-in-the-desktop-app) |

PromptNerdy billing is separate from your ChatGPT subscription. See [OpenAI's plan support](https://learn.chatgpt.com/docs/pricing) for Codex access.

## Install the PromptNerdy plugin

1. Open the [PromptNerdy plugin in ChatGPT](https://chatgpt.com/plugins/plugin_asdk_app_6abddd2c7e4c819191f1398c4bd8e9b3).
2. Select **Install plugin**, then sign in to PromptNerdy in the window that opens and approve the connection. No account yet? Create one from that sign-in page.
3. Start a **new chat**. Type `@` and select PromptNerdy, or open the **+** menu and choose PromptNerdy.
4. Send the [connection check](#check-that-promptnerdy-is-connected) below.

You do not need a PromptNerdy API key. The plugin connects to hosted PromptNerdy.

## Custom connection

Use a custom connection if the plugin isn't available for your account, or to connect a self-hosted instance. It works on ChatGPT Free and paid plans. It gives ChatGPT the PromptNerdy tools but not the SEO skills. To use it in the ChatGPT desktop app, add it on chatgpt.com first.

1. Sign in to [chatgpt.com](https://chatgpt.com).
2. If your version shows it, open **Settings → Security and login** and enable **Developer mode**. Some versions expose the custom connection flow directly in Plugins.
3. Open **Plugins**, select **+**, then **Create MCP App**. In versions with the older interface, look for **Settings → Apps → Advanced settings → Developer mode**, then **Create** or **Add custom app**.
4. Enter these details:

   | Field          | Value                             |
   | -------------- | --------------------------------- |
   | Name           | `PromptNerdy`                     |
   | Server URL     | `https://app.promptnerdy.com/mcp` |
   | Authentication | `OAuth`                           |

   Type the full URL, including `https://`. These settings apply to hosted PromptNerdy. For a self-hosted instance, use a publicly reachable HTTPS endpoint with authentication supported by ChatGPT; localhost URLs cannot work from ChatGPT web. Follow the [self-hosting guide](/docs/self-hosting) or use a local Codex connection instead.

5. Review the custom connection notice and create the connection. Sign in to PromptNerdy in the window that opens and approve the connection. Return to ChatGPT. If the new plugin needs installation, open it under **Personal** and select **Install** or **+**.
6. Start a **new chat**. Open the **+ / tools** menu and select PromptNerdy. In versions that show **Developer mode** in that menu, choose it and enable PromptNerdy there. If the composer offers plugin mentions, you can also type `@` and select PromptNerdy.
7. Send the connection-check request below.

Use OAuth for this flow. You do not need to create a PromptNerdy API key or paste one into ChatGPT. Without the skills, you can still ask for keyword research, audits, or competitor research in plain language.

See [OpenAI's connection guide](https://developers.openai.com/plugins/deploy/connect-chatgpt) for its current interface.

## Codex in the desktop app

If you already use Codex in the desktop app, start a new **Codex** chat, then copy the [agent setup prompt](/docs/agent-setup#set-up-your-agent) into that chat. Codex can configure its own connection and guide you through sign-in. Approve the PromptNerdy login when prompted.

If you prefer manual setup, follow the [Codex plugin guide](/docs/codex-plugin#desktop-app), or add the [MCP connection alone](/docs/mcp#codex-in-the-chatgpt-desktop-app). Start a new Codex chat after installation if needed, then run the connection check below.

Codex and ChatGPT chats use separate connections. Run the connection check in the chat where you want to use PromptNerdy. For the current mode controls, see [OpenAI's desktop guide](https://learn.chatgpt.com/docs/app).

## Check that PromptNerdy is connected

Send this in a new chat with PromptNerdy selected:

```text
Use PromptNerdy to check my connection and list my projects. Do not run SEO research or create anything.
```

ChatGPT should call PromptNerdy and return your connection status and project list. An empty project list is a successful connection check too. These reads use no PromptNerdy credits.

If it says it cannot access PromptNerdy, or only describes how to connect, setup is still incomplete. Check that PromptNerdy is installed, signed in, and selected in this chat. Start a new chat after changing the connection.

Once the check succeeds, try:

```text
Use PromptNerdy to help me choose one SEO task for my website. Ask about my goal before starting paid research.
```

The PromptNerdy plugin also includes SEO skills, such as SEO Audit. Use the available skill picker or ask for a workflow by name.

## Troubleshooting

| What you see                                                | What to do                                                                                                                                                                                                       |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The PromptNerdy plugin isn't available                      | Availability depends on your ChatGPT plan, workspace, and region. On a workspace plan, ask your admin to allow it. Otherwise, add a [custom connection](#custom-connection).                                     |
| No Developer mode or Create MCP App option                  | Check **Settings → Security and login** and **Settings → Plugins → Developer mode**. On a workspace plan, ask your admin whether custom connections are allowed.                                                 |
| "Error fetching OAuth configuration: Unsafe URL"            | Enter the server URL in full as `https://app.promptnerdy.com/mcp`, with no spaces. A URL without `https://` is rejected.                                                                                         |
| ChatGPT asks for a client ID or secret                      | Keep OAuth selected and wait for discovery. Open Advanced OAuth settings and use Dynamic Client Registration (DCR) if offered. You should not need to supply your own client credentials for hosted PromptNerdy. |
| The login window never appears                              | Allow the sign-in window to open, then retry authentication from the PromptNerdy connection's details.                                                                                                           |
| Login succeeds but tools are unavailable                    | Finish installing the plugin if prompted, start a new chat, and select PromptNerdy from the tools menu.                                                                                                          |
| ChatGPT gives general advice instead of calling PromptNerdy | Select PromptNerdy and resend the connection-check request. Check that ChatGPT calls a PromptNerdy tool.                                                                                                         |
| Codex works, but chatgpt.com cannot find PromptNerdy        | Connect ChatGPT web separately. It does not read your desktop Codex configuration.                                                                                                                               |
| You have no projects                                        | An empty project list still confirms the connection. Create a project in PromptNerdy when you are ready to start research.                                                                                       |

If setup still fails, contact [support@promptnerdy.com](mailto:support@promptnerdy.com) with your ChatGPT plan, web or desktop version, the step that failed, and the error message. Do not include passwords, API keys, or sign-in codes.

## Update PromptNerdy

For the PromptNerdy plugin, start a new chat to load the latest tools and skills. Reconnect if ChatGPT reports that sign-in needs attention. Local Codex update commands do not update ChatGPT web.

For a custom MCP connection, open its details under **Plugins**, select **Refresh** to reload the tools, and start a new chat. Refresh updates tool definitions; it does not add repository skills. If sign-in has expired, authenticate again.

For Codex, use the [agent update prompt or plugin commands](/docs/agent-setup#update-your-skills) in your Codex environment.
