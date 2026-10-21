import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { QueryError } from "@/client/components/QueryState";
import { PageLoading } from "@/client/components/Spinner";
import { Button } from "@/client/components/ui/button";
import { AuthPageCard, AuthPageShell } from "@/client/features/auth/AuthPage";
import { useHostedAuthRouteGuard } from "@/client/features/auth/useHostedAuthRouteGuard";
import { NoWorkspaceCard } from "@/client/features/clients/NoWorkspaceCard";
import { portalHomeQueryOptions } from "@/client/features/portal/portalQueries";
import { getErrorCode } from "@/client/lib/error-messages";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/portal")({
  component: PortalLayout,
});

// The client portal (spec 0017): view-only, branded with the agency, and
// separate from the app shell. Agency staff can open it too, to preview.
function PortalLayout() {
  const authGate = useHostedAuthRouteGuard();
  const homeQuery = useQuery({
    ...portalHomeQueryOptions(),
    enabled: authGate.isHostedMode && authGate.canRenderAuthenticatedContent,
  });

  if (!authGate.isHostedMode) {
    return (
      <AuthPageShell>
        <AuthPageCard
          title="Not available"
          helperText="The client portal isn't available on this deployment."
        >
          {null}
        </AuthPageCard>
      </AuthPageShell>
    );
  }
  if (getErrorCode(homeQuery.error) === "FORBIDDEN") {
    return <NoWorkspaceCard />;
  }
  if (homeQuery.isError) {
    return (
      <AuthPageShell>
        <QueryError
          error={homeQuery.error}
          fallback="We couldn't load your portal right now."
          onRetry={() => void homeQuery.refetch()}
          isRetrying={homeQuery.isFetching}
        />
      </AuthPageShell>
    );
  }
  if (!authGate.canRenderAuthenticatedContent || !homeQuery.data) {
    return <PageLoading />;
  }

  const { agencyName, agencyLogo } = homeQuery.data;
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/portal" className="flex items-center gap-2 font-semibold">
            {agencyLogo ? (
              <img
                src={agencyLogo}
                alt=""
                className="size-7 rounded object-contain"
              />
            ) : null}
            {agencyName}
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              void authClient.signOut().then(() => {
                window.location.href = "/sign-in";
              });
            }}
          >
            Sign out
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="mx-auto w-full max-w-5xl px-4 pb-6 text-xs text-muted-foreground">
        Powered by PromptNerdy
      </footer>
    </div>
  );
}
