// Optional shared-password gate for a deployment that runs without app auth
// (AUTH_MODE=local_noauth) but is reachable from the internet, e.g. Docker on
// Railway. It is on only when both BASIC_AUTH_USERNAME and BASIC_AUTH_PASSWORD
// are set. /api/health stays open so platform health checks keep working.

const HEALTH_PATHS = new Set(["/api/health", "/api/health/"]);

function readEnv(env: object, name: string) {
  const value: unknown = Reflect.get(env, name);
  return typeof value === "string" ? value.trim() : "";
}

function decodeBasicCredentials(header: string | null) {
  if (!header?.startsWith("Basic ")) return "";
  try {
    const binary = atob(header.slice("Basic ".length).trim());
    return new TextDecoder().decode(
      Uint8Array.from(binary, (char) => char.charCodeAt(0)),
    );
  } catch {
    return "";
  }
}

// Compares SHA-256 digests so the comparison time doesn't depend on how much
// of the secret a guess got right.
async function sameSecret(a: string, b: string) {
  const encoder = new TextEncoder();
  const [digestA, digestB] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(a)),
    crypto.subtle.digest("SHA-256", encoder.encode(b)),
  ]);
  const bytesA = new Uint8Array(digestA);
  const bytesB = new Uint8Array(digestB);
  let diff = 0;
  for (let i = 0; i < bytesA.length; i++) diff |= bytesA[i] ^ bytesB[i];
  return diff === 0;
}

/** Returns a 401 challenge when the gate is on and the request lacks valid
 *  credentials; null when the request may continue. */
export async function siteBasicAuthChallenge(
  request: Request,
  env: object,
  pathname: string,
): Promise<Response | null> {
  const username = readEnv(env, "BASIC_AUTH_USERNAME");
  const password = readEnv(env, "BASIC_AUTH_PASSWORD");
  if (!username || !password || HEALTH_PATHS.has(pathname)) return null;

  const credentials = decodeBasicCredentials(
    request.headers.get("authorization"),
  );
  if (await sameSecret(credentials, `${username}:${password}`)) return null;

  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="PromptNerdy", charset="UTF-8"',
    },
  });
}
