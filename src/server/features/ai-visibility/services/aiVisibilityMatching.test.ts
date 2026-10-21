import { describe, expect, it } from "vitest";
import type { ParsedAiAnswer } from "../providers/dataforseoEvidence";
import {
  aiMentionSpans,
  aiPromptIsBranded,
  matchAiBrand,
  ownedAiDomain,
} from "./aiVisibilityMatching";

const brand = { name: "PromptNerdy", domain: "promptnerdy.com" };
function answer(text: string, citedHosts: string[] = []): ParsedAiAnswer {
  return {
    answerMarkdown: text,
    answerText: text,
    citations: citedHosts.map((domain, index) => ({
      url: `https://${domain}/guide`,
      domain,
      title: null,
      position: index + 1,
    })),
    collectedAt: null,
  };
}

describe("brand mentions", () => {
  it.each([
    ["PromptNerdy is an open-source toolkit.", 0],
    ["PromptNerdy's MCP supports research.", 0],
    ["Try promptnerdy.com for audits.", 4],
    ["PromptNerdysomething and MyPromptNerdy are different names.", null],
    [
      "Links: https://promptnerdy.com/PromptNerdy and www.promptnerdy.com/PromptNerdy",
      null,
    ],
    ["Email PromptNerdy@example.com or help@promptnerdy.com.", null],
    ["An unrelated toolkit has similar features.", null],
  ])("%s", (text, firstMention) => {
    expect(matchAiBrand(answer(text), brand)).toMatchObject({
      mentioned: firstMention !== null,
      firstMention,
    });
  });

  it.each([
    ["acmeride.com", true],
    ["shop.acmeride.com", false],
  ])("bare name mentions a brand named %s: %s", (domain, mentioned) => {
    const text = "- [Acmeride](https://www.acmeride.com/): Connects directly.";
    expect(matchAiBrand(answer(text), { name: domain, domain }).mentioned).toBe(
      mentioned,
    );
  });

  it("returns original UTF-16 offsets through emoji and both Unicode accent forms", () => {
    const text = "🔎 Café and Café are the same spelling.";
    const spans = aiMentionSpans(text, ["Café"]);
    expect(spans.map((span) => text.slice(span.start, span.end))).toEqual([
      "Café",
      "Café",
    ]);
    expect(spans[0]).toEqual({ start: 3, end: 7 });
  });

  it("escapes regex syntax and keeps the longest overlapping name", () => {
    const text = "C++ Tools and Open SEO Tools";
    expect(
      aiMentionSpans(text, ["C++ Tools", "Open SEO", "Open SEO Tools"]).map(
        (s) => text.slice(s.start, s.end),
      ),
    ).toEqual(["C++ Tools", "Open SEO Tools"]);
  });
});

describe("brand citations", () => {
  it.each(["promptnerdy.com", "www.promptnerdy.com", "docs.promptnerdy.com"])(
    "counts a cited page on %s",
    (host) => {
      expect(matchAiBrand(answer("Other tools.", [host]), brand)).toMatchObject(
        { mentioned: false, cited: true },
      );
    },
  );
  it.each([
    "promptnerdy.com.evil.example",
    "notpromptnerdy.com",
    "promptnerdy.net",
  ])("does not count %s", (host) => {
    expect(ownedAiDomain(host, brand.domain)).toBe(false);
    expect(matchAiBrand(answer("Other tools.", [host]), brand).cited).toBe(
      false,
    );
  });
});

describe("branded prompt cohort", () => {
  it.each([
    "What is PromptNerdy?",
    "Review https://promptnerdy.com",
    "What does www.promptnerdy.com offer?",
    "Review docs.promptnerdy.com/mcp",
  ])("includes %s", (prompt) => {
    expect(aiPromptIsBranded(prompt, brand)).toBe(true);
  });
  it.each([
    "Best open source SEO tools?",
    "Review https://promptnerdy.com.evil.example",
    "Review https://notpromptnerdy.com",
  ])("excludes %s", (prompt) => {
    expect(aiPromptIsBranded(prompt, brand)).toBe(false);
  });
});
