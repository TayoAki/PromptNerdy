import { beforeEach, describe, expect, it, vi } from "vitest";
import { isBillingEnabled } from "@/server/billing/billing-mode";
import { AuthRepository } from "@/server/auth/repositories/AuthRepository";
import { canCreateAccount } from "./signup-policy";

vi.mock("cloudflare:workers", () => ({
  env: { SIGNUP_ALLOWED_EMAILS: " Owner@Agency.com , second@agency.com" },
}));
vi.mock("@/server/billing/billing-mode", () => ({
  isBillingEnabled: vi.fn(),
}));
vi.mock("@/server/auth/repositories/AuthRepository", () => ({
  AuthRepository: { hasPendingInvitationForEmail: vi.fn() },
}));

describe("canCreateAccount", () => {
  beforeEach(() => {
    vi.mocked(isBillingEnabled).mockResolvedValue(false);
    vi.mocked(AuthRepository.hasPendingInvitationForEmail).mockResolvedValue(
      false,
    );
  });

  it("lets anyone sign up while billing caps usage", async () => {
    vi.mocked(isBillingEnabled).mockResolvedValue(true);
    await expect(canCreateAccount("stranger@example.com")).resolves.toBe(true);
  });

  it("lets allowlisted addresses in regardless of case", async () => {
    await expect(canCreateAccount("owner@agency.COM")).resolves.toBe(true);
  });

  it("lets invited people in", async () => {
    vi.mocked(AuthRepository.hasPendingInvitationForEmail).mockResolvedValue(
      true,
    );
    await expect(canCreateAccount("client@example.com")).resolves.toBe(true);
  });

  it("turns everyone else away while billing is off", async () => {
    await expect(canCreateAccount("stranger@example.com")).resolves.toBe(false);
  });
});
