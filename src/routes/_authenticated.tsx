import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { AuthPageCard, AuthPageShell } from "@/client/features/auth/AuthPage";
import { useHostedAuthRouteGuard } from "@/client/features/auth/useHostedAuthRouteGuard";
import { PageLoading } from "@/client/components/Spinner";
import { Button } from "@/client/components/ui/button";
import { NoWorkspaceCard } from "@/client/features/clients/NoWorkspaceCard";
import { useClientPortalRedirect } from "@/client/features/clients/useClientPortalRedirect";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedShellLayout,
});

function AuthenticatedShellLayout() {
  const authGate = useHostedAuthRouteGuard();
  const viewer = useClientPortalRedirect(
    authGate.canRenderAuthenticatedContent,
  );

  // Every page under this layout is hosted-only.
  if (!authGate.isHostedMode) {
    return (
      <AuthPageShell>
        <AuthPageCard
          title="Not available"
          helperText="This page isn't available right now."
        >
          <Button
            nativeButton={false}
            render={<Link to="/" />}
            variant="secondary"
            className="w-full"
          >
            Back to PromptNerdy
          </Button>
        </AuthPageCard>
      </AuthPageShell>
    );
  }

  if (viewer === "no-workspace") return <NoWorkspaceCard />;
  if (!authGate.canRenderAuthenticatedContent || viewer === "pending") {
    return <PageLoading />;
  }

  return (
    <AuthPageShell>
      <Outlet />
    </AuthPageShell>
  );
}
