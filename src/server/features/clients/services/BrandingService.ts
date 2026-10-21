import { env } from "cloudflare:workers";
import { getAuth } from "@/lib/auth";
import { organizationLogoKey } from "@/server/features/clients/organizationLogo";
import { AppError } from "@/server/lib/errors";

// The agency's name and logo, shown at the top of the client portal (spec
// 0017). The name is the organization's; the logo is one R2 object per
// organization, replaced on each upload. Writes go through Better Auth so its
// organization permission check runs too.

const MAX_LOGO_BYTES = 512 * 1024;

// The type comes from the file's own bytes, not the browser's claim. SVG is
// refused because it can carry script.
function detectImageType(bytes: Uint8Array) {
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.subarray(start, end));
  if (ascii(1, 4) === "PNG" && bytes[0] === 0x89) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

function updateOrganization(
  headers: Headers,
  organizationId: string,
  data: { name?: string; logo?: string | null },
) {
  return getAuth().api.updateOrganization({
    headers,
    body: { organizationId, data },
  });
}

async function rename(headers: Headers, organizationId: string, name: string) {
  await updateOrganization(headers, organizationId, { name });
}

async function uploadLogo(
  headers: Headers,
  organizationId: string,
  file: File,
) {
  if (file.size > MAX_LOGO_BYTES) {
    throw new AppError("VALIDATION_ERROR", "Choose an image under 512 KB.");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = detectImageType(bytes);
  if (!contentType) {
    throw new AppError("VALIDATION_ERROR", "Choose a PNG, JPEG or WebP image.");
  }
  await env.R2.put(organizationLogoKey(organizationId), bytes, {
    httpMetadata: { contentType },
  });
  // The version busts browser caches, which keep the image for a day.
  await updateOrganization(headers, organizationId, {
    logo: `/api/organization-logo/${organizationId}?v=${Date.now()}`,
  });
}

async function removeLogo(headers: Headers, organizationId: string) {
  await updateOrganization(headers, organizationId, { logo: null });
  await env.R2.delete(organizationLogoKey(organizationId));
}

export const BrandingService = { rename, uploadLogo, removeLogo };
