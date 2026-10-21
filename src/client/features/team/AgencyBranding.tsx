import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { revalidateLogic } from "@tanstack/react-form";
import { ImageUp } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { SectionHeader } from "@/client/components/PageHeader";
import { PermissionHint } from "@/client/components/PermissionHint";
import { QueryError } from "@/client/components/QueryState";
import { SkeletonCard } from "@/client/components/SkeletonPresets";
import { useAppForm } from "@/client/components/form/useAppForm";
import { Button } from "@/client/components/ui/button";
import { organizationContextQueryOptions } from "@/client/features/team/organizationQueries";
import {
  getErrorCode,
  getStandardErrorMessage,
} from "@/client/lib/error-messages";
import { hasOrgPermission } from "@/lib/org-permissions";
import {
  getAgencyBranding,
  removeAgencyLogo,
  renameAgency,
  uploadAgencyLogo,
} from "@/serverFunctions/branding";

const BRANDING_KEY = ["agency-branding"];

const nameSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(80),
});

// The agency's name and logo, shown at the top of every client's portal
// (spec 0017).
export function AgencyBranding() {
  const orgContextQuery = useQuery(organizationContextQueryOptions());
  const brandingQuery = useQuery({
    queryKey: BRANDING_KEY,
    queryFn: () => getAgencyBranding(),
  });
  const canEdit = hasOrgPermission(orgContextQuery.data?.role ?? "member", {
    organization: ["update"],
  });

  if (brandingQuery.isError) {
    return (
      <QueryError
        error={brandingQuery.error}
        fallback="We couldn't load your agency branding."
        onRetry={() => void brandingQuery.refetch()}
        isRetrying={brandingQuery.isFetching}
      />
    );
  }

  return (
    <section className="space-y-3">
      <SectionHeader title="Agency branding" />
      <p className="text-sm text-muted-foreground">
        Your clients see this name and logo at the top of their portal.
      </p>
      {orgContextQuery.isSuccess && !canEdit ? (
        <PermissionHint action="change the agency name or logo" />
      ) : null}
      {brandingQuery.data ? (
        <BrandingFields branding={brandingQuery.data} canEdit={canEdit} />
      ) : (
        <SkeletonCard />
      )}
    </section>
  );
}

// Mounted once the branding has loaded, so the name field starts filled in.
function BrandingFields({
  branding,
  canEdit,
}: {
  branding: { name: string; logo: string | null };
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);

  const onSaved = (message: string) => {
    toast.success(message);
    for (const queryKey of [
      BRANDING_KEY,
      ["portal-home"],
      organizationContextQueryOptions().queryKey,
    ]) {
      void queryClient.invalidateQueries({ queryKey });
    }
  };
  const onError = (error: Error) => toast.error(getStandardErrorMessage(error));

  const renameMutation = useMutation({
    mutationFn: (name: string) => renameAgency({ data: { name } }),
    onSuccess: () => onSaved("Agency name saved"),
    onError,
  });
  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const data = new FormData();
      data.set("logo", file);
      return uploadAgencyLogo({ data });
    },
    onSuccess: () => onSaved("Logo uploaded"),
    // The server sends only the code; the file's type or size is the cause.
    onError: (error: Error) =>
      getErrorCode(error) === "VALIDATION_ERROR"
        ? toast.error("Choose a PNG, JPEG or WebP image of up to 512 KB.")
        : onError(error),
  });
  const removeMutation = useMutation({
    mutationFn: () => removeAgencyLogo(),
    onSuccess: () => onSaved("Logo removed"),
    onError,
  });

  const form = useAppForm({
    defaultValues: { name: branding.name },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: nameSchema },
    onSubmit: ({ value }) => renameMutation.mutateAsync(value.name.trim()),
  });

  return (
    <>
      <form.AppForm>
        <form.Form className="flex max-w-md items-end gap-2">
          <form.AppField name="name">
            {(field) => (
              <field.TextField label="Agency name" disabled={!canEdit} />
            )}
          </form.AppField>
          {canEdit ? <form.SubmitButton>Save</form.SubmitButton> : null}
        </form.Form>
      </form.AppForm>
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg border bg-card">
          {branding.logo ? (
            <img
              src={branding.logo}
              alt=""
              className="size-full object-contain"
            />
          ) : (
            <ImageUp className="size-5 text-muted-foreground" aria-hidden />
          )}
        </span>
        {canEdit ? (
          <>
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) uploadMutation.mutate(file);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              pending={uploadMutation.isPending}
              onClick={() => fileInput.current?.click()}
            >
              {branding.logo ? "Replace logo" : "Upload logo"}
            </Button>
            {branding.logo ? (
              <Button
                variant="ghost"
                size="sm"
                pending={removeMutation.isPending}
                onClick={() => removeMutation.mutate()}
              >
                Remove
              </Button>
            ) : null}
            <span className="text-xs text-muted-foreground">
              PNG, JPEG or WebP, up to 512 KB. A square image works best.
            </span>
          </>
        ) : null}
      </div>
    </>
  );
}
