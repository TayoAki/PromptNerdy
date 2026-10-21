import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getErrorCode } from "@/client/lib/error-messages";
import { isHostedClientAuthMode } from "@/lib/auth-mode";
import { getPortalViewer } from "@/serverFunctions/portal";

// Sends a client contact (spec 0017) from any app page to the portal, before
// the page calls server functions the contact would be refused. `enabled`
// waits for a verified session. "no-workspace" is a signed-up invitee who
// hasn't accepted their invitation yet.
export function useClientPortalRedirect(enabled: boolean) {
  const navigate = useNavigate();
  const active = enabled && isHostedClientAuthMode();
  const viewerQuery = useQuery({
    queryKey: ["portal-viewer"],
    queryFn: () => getPortalViewer(),
    enabled: active,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const isClient = viewerQuery.data?.isClient === true;

  useEffect(() => {
    if (isClient) void navigate({ to: "/portal", replace: true });
  }, [isClient, navigate]);

  if (!active) return "staff" as const;
  if (getErrorCode(viewerQuery.error) === "FORBIDDEN") {
    return "no-workspace" as const;
  }
  if (viewerQuery.isPending || isClient) return "pending" as const;
  return "staff" as const;
}
