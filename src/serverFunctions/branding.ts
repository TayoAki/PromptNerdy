import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireOrgPermission } from "@/server/auth/org-gate";
import { AuthRepository } from "@/server/auth/repositories/AuthRepository";
import { BrandingService } from "@/server/features/clients/services/BrandingService";
import { AppError } from "@/server/lib/errors";
import { requireAuthenticatedContext } from "@/serverFunctions/middleware";

// The agency's portal branding (spec 0017): every staff member can see it,
// owners and admins can change it.

export const getAgencyBranding = createServerFn({ method: "GET" })
  .middleware(requireAuthenticatedContext)
  .handler(async ({ context }) => {
    const branding = await AuthRepository.getOrganizationBranding(
      context.organizationId,
    );
    return { name: branding?.name ?? "", logo: branding?.logo ?? null };
  });

export const renameAgency = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .validator(z.object({ name: z.string().trim().min(1).max(80) }))
  .handler(async ({ data, context }) => {
    requireOrgPermission(context, { organization: ["update"] });
    await BrandingService.rename(
      getRequest().headers,
      context.organizationId,
      data.name,
    );
  });

export const uploadAgencyLogo = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .validator((data: unknown) => {
    const file = data instanceof FormData ? data.get("logo") : null;
    if (!(file instanceof File)) {
      throw new AppError("VALIDATION_ERROR", "Choose an image to upload.");
    }
    return file;
  })
  .handler(async ({ data, context }) => {
    requireOrgPermission(context, { organization: ["update"] });
    await BrandingService.uploadLogo(
      getRequest().headers,
      context.organizationId,
      data,
    );
  });

export const removeAgencyLogo = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .handler(async ({ context }) => {
    requireOrgPermission(context, { organization: ["update"] });
    await BrandingService.removeLogo(
      getRequest().headers,
      context.organizationId,
    );
  });
