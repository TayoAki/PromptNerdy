import installerSkill from "../../../../.agents/skills/setup-promptnerdy/SKILL.md?raw";
import updatePrompt from "./agentUpdatePrompt.md?raw";

export const agentUpdatePrompt = updatePrompt.trim();

// The copyable installer and internal skill share one source of truth.
export function getAgentSetupPrompt(origin: string) {
  const instructions = installerSkill
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "")
    .trim();
  return instructions.replaceAll("https://app.promptnerdy.com", origin);
}
