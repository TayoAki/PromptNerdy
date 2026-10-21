// One logo object per organization (spec 0017). A leaf module so account
// erasure can name the key without importing the auth stack.
export function organizationLogoKey(organizationId: string) {
  return `organization-logos/${organizationId}`;
}
