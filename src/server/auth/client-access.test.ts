import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthRepository } from "@/server/auth/repositories/AuthRepository";
import { assertInvitationShape, refuseClientCaller } from "./client-access";

vi.mock("@/server/auth/repositories/AuthRepository", () => ({
  AuthRepository: {
    getMembership: vi.fn(),
    getOrganizationIdBySlug: vi.fn(),
  },
}));

const session = {
  user: { id: "user-1" },
  session: { activeOrganizationId: "agency" },
};

describe("refuseClientCaller", () => {
  beforeEach(() => {
    vi.mocked(AuthRepository.getMembership).mockResolvedValue({
      role: "client",
    });
  });

  // The plugin checks no permission on its org-wide reads, so a client
  // contact could otherwise list every other client's contacts.
  it.each([
    "/organization/get-full-organization",
    "/organization/list-members",
    "/organization/list-invitations",
    "/organization/list-teams",
    "/api-key/create",
  ])("refuses a client contact %s", async (path) => {
    await expect(refuseClientCaller({ path }, session)).rejects.toMatchObject({
      status: "FORBIDDEN",
    });
  });

  it("leaves a client contact their own invitations and sign-out", async () => {
    await expect(
      refuseClientCaller({ path: "/organization/accept-invitation" }, session),
    ).resolves.toBeUndefined();
    await expect(
      refuseClientCaller({ path: "/sign-out" }, session),
    ).resolves.toBeUndefined();
  });

  it("lets staff through, judged in the organization the request names", async () => {
    vi.mocked(AuthRepository.getMembership).mockImplementation(
      async (_userId, organizationId) => ({
        role: organizationId === "own-agency" ? "owner" : "client",
      }),
    );
    await expect(
      refuseClientCaller(
        {
          path: "/organization/list-members",
          query: { organizationId: "own-agency" },
        },
        session,
      ),
    ).resolves.toBeUndefined();
  });
});

describe("assertInvitationShape", () => {
  it.each([
    [{ role: "admin", teamIds: [] }, true],
    [{ role: "client", teamIds: ["team-acme"] }, true],
    [{ role: "client", teamIds: [] }, false],
    [{ role: "admin", teamIds: ["team-acme"] }, false],
    [{ role: "client", teamIds: ["team-acme", "team-other"] }, false],
    [{ role: "owner", teamIds: [] }, false],
  ])("%o allowed: %s", (invitation, allowed) => {
    const attempt = () => assertInvitationShape(invitation);
    if (allowed) expect(attempt).not.toThrow();
    else expect(attempt).toThrow();
  });
});
