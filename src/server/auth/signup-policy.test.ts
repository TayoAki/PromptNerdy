import { beforeEach, describe, expect, it, vi } from "vitest";
import { isBillingEnabled } from "@/server/billing/billing-mode";
import { AuthRepository } from "@/server/auth/repositories/AuthRepository";
import { canCreateAccount, canFoundOrganization } from "./signup-policy";

vi.mock("@/server/lib/runtime-env", () => ({
  getOptionalEnvValue: (name: string) =>
    Promise.resolve(
      name === "SIGNUP_ALLOWED_EMAILS"
        ? " Owner@Agency.com , second@agency.com"
        : undefined,
    ),
}));
vi.mock("@/server/billing/billing-mode", () => ({
  isBillingEnabled: vi.fn(),
}));
vi.mock("@/server/auth/repositories/AuthRepository", () => ({
  AuthRepository: { hasPendingInvitationForEmail: vi.fn() },
}));

describe("signup policy with billing off", () => {
  beforeEach(() => {
    vi.mocked(isBillingEnabled).mockResolvedValue(false);
    vi.mocked(AuthRepository.hasPendingInvitationForEmail).mockResolvedValue(
      false,
    );
  });

  it("lets anyone sign up and found a workspace while billing caps usage", async () => {
    vi.mocked(isBillingEnabled).mockResolvedValue(true);
    await expect(canCreateAccount("stranger@example.com")).resolves.toBe(true);
    await expect(canFoundOrganization("stranger@example.com")).resolves.toBe(
      true,
    );
  });

  it("lets allowlisted addresses sign up and found a workspace, regardless of case", async () => {
    await expect(canCreateAccount("owner@agency.COM")).resolves.toBe(true);
    await expect(canFoundOrganization("owner@agency.COM")).resolves.toBe(true);
  });

  it("lets invited people sign up but not found a workspace of their own", async () => {
    vi.mocked(AuthRepository.hasPendingInvitationForEmail).mockResolvedValue(
      true,
    );
    await expect(canCreateAccount("client@example.com")).resolves.toBe(true);
    await expect(canFoundOrganization("client@example.com")).resolves.toBe(
      false,
    );
  });

  it("turns everyone else away", async () => {
    await expect(canCreateAccount("stranger@example.com")).resolves.toBe(false);
  });
});
