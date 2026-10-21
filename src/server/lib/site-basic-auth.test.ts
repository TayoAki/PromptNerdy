import { describe, expect, it } from "vitest";
import { siteBasicAuthChallenge } from "./site-basic-auth";

const env = { BASIC_AUTH_USERNAME: "agency", BASIC_AUTH_PASSWORD: "s3cret" };

function request(authorization?: string) {
  return new Request("https://app.example.test/", {
    headers: authorization ? { authorization } : {},
  });
}

const basic = (credentials: string) => `Basic ${btoa(credentials)}`;

describe("siteBasicAuthChallenge", () => {
  it.each([
    ["no credentials", undefined, "/", 401],
    ["a wrong password", basic("agency:nope"), "/", 401],
    ["malformed credentials", "Basic %%%", "/mcp", 401],
    ["the right credentials", basic("agency:s3cret"), "/", null],
    ["the health check", undefined, "/api/health", null],
  ])("answers %s", async (_name, authorization, pathname, status) => {
    const response = await siteBasicAuthChallenge(
      request(authorization),
      env,
      pathname,
    );
    expect(response?.status ?? null).toBe(status);
    if (response) {
      expect(response.headers.get("WWW-Authenticate")).toContain("Basic");
    }
  });

  it("stays off unless both username and password are set", async () => {
    await expect(
      siteBasicAuthChallenge(request(), { BASIC_AUTH_PASSWORD: "s3cret" }, "/"),
    ).resolves.toBeNull();
  });
});
