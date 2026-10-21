import { AuthPageCard, AuthPageShell } from "@/client/features/auth/AuthPage";
import { Button } from "@/client/components/ui/button";
import { authClient } from "@/lib/auth-client";

// A signed-up invitee who hasn't accepted their invitation has no workspace,
// and with billing off can't start one of their own.
export function NoWorkspaceCard() {
  return (
    <AuthPageShell>
      <AuthPageCard
        title="You're not in a workspace yet"
        helperText="Open the invitation link you were sent to join your agency's workspace."
      >
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            void authClient.signOut().then(() => {
              window.location.href = "/sign-in";
            });
          }}
        >
          Sign out
        </Button>
      </AuthPageCard>
    </AuthPageShell>
  );
}
