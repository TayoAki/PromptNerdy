import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleLogoRequest } from "@/routes/api/organization-logo.$organizationId";
import { BrandingService } from "./BrandingService";

const mocks = vi.hoisted(() => ({
  put: vi.fn(),
  get: vi.fn(),
  updateOrganization: vi.fn(),
  resolveUserContextFromHeaders: vi.fn(),
  getMembership: vi.fn(),
}));

vi.mock("cloudflare:workers", () => ({
  env: { R2: { put: mocks.put, get: mocks.get, delete: vi.fn() } },
}));
vi.mock("@/lib/auth", () => ({
  getAuth: () => ({ api: { updateOrganization: mocks.updateOrganization } }),
}));
vi.mock("@/middleware/ensure-user/resolve", () => ({
  resolveUserContextFromHeaders: mocks.resolveUserContextFromHeaders,
}));
vi.mock("@/server/auth/repositories/AuthRepository", () => ({
  AuthRepository: { getMembership: mocks.getMembership },
}));

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const headers = new Headers();
const request = () =>
  new Request("https://app.example.com/api/organization-logo/agency");

beforeEach(() => {
  mocks.resolveUserContextFromHeaders.mockResolvedValue({
    userId: "user-1",
    organizationId: "agency",
    role: "client",
  });
  mocks.getMembership.mockResolvedValue({ role: "client" });
  mocks.get.mockResolvedValue({
    body: "logo-bytes",
    httpMetadata: { contentType: "image/png" },
  });
});

describe("BrandingService.uploadLogo", () => {
  it("stores the type the bytes show, not the one the browser claims", async () => {
    const file = new File([new Uint8Array(PNG)], "logo.jpg", {
      type: "image/jpeg",
    });

    await BrandingService.uploadLogo(headers, "agency", file);

    expect(mocks.put).toHaveBeenCalledWith(
      "organization-logos/agency",
      expect.any(Uint8Array),
      { httpMetadata: { contentType: "image/png" } },
    );
  });

  it("refuses an SVG, which can carry script, even named as a PNG", async () => {
    const file = new File(["<svg onload='alert(1)'></svg>"], "logo.png", {
      type: "image/png",
    });

    await expect(
      BrandingService.uploadLogo(headers, "agency", file),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(mocks.put).not.toHaveBeenCalled();
    expect(mocks.updateOrganization).not.toHaveBeenCalled();
  });
});

describe("the logo route", () => {
  it("serves the logo to the agency's own members, locked down", async () => {
    const response = await handleLogoRequest("agency", request());

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("answers not found to someone outside the agency", async () => {
    mocks.getMembership.mockResolvedValue(null);

    const response = await handleLogoRequest("agency", request());

    expect(response.status).toBe(404);
    expect(mocks.get).not.toHaveBeenCalled();
  });
});
