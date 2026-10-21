import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { revalidateLogic } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { CopyButton } from "@/client/components/CopyButton";
import { SectionHeader } from "@/client/components/PageHeader";
import { PermissionHint } from "@/client/components/PermissionHint";
import { QueryError } from "@/client/components/QueryState";
import { SkeletonCard } from "@/client/components/SkeletonPresets";
import { useAppForm } from "@/client/components/form/useAppForm";
import { Button } from "@/client/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/client/components/ui/card";
import {
  announceInvitation,
  inviteErrorMessage,
} from "@/client/features/team/InviteTeammateModal";
import { organizationContextQueryOptions } from "@/client/features/team/organizationQueries";
import { getStandardErrorMessage } from "@/client/lib/error-messages";
import { authClient } from "@/lib/auth-client";
import { ProjectAssignments } from "@/client/features/clients/ProjectAssignments";
import { hasOrgPermission } from "@/lib/org-permissions";
import {
  createClient,
  getClients,
  inviteClientContact,
  removeClientContact,
  renameClient,
} from "@/serverFunctions/clients";

const CLIENTS_KEY = ["organization-clients"];

export type ClientsOverview = Awaited<ReturnType<typeof getClients>>;
type Client = ClientsOverview["clients"][number];

const nameSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(80),
});
const emailSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

function inviteLink(invitationId: string) {
  return `${window.location.origin}/accept-invitation/${invitationId}`;
}

// The agency's side of the client portal (spec 0017): clients, their contacts
// and which projects each client can see.
export function ClientsSettings() {
  const queryClient = useQueryClient();
  const orgContextQuery = useQuery(organizationContextQueryOptions());
  const clientsQuery = useQuery({
    queryKey: CLIENTS_KEY,
    queryFn: () => getClients(),
  });
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: CLIENTS_KEY });

  const canManage = hasOrgPermission(orgContextQuery.data?.role ?? "member", {
    team: ["create"],
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => createClient({ data: { name } }),
    onSuccess: () => {
      toast.success("Client added");
      void refresh();
    },
    onError: (error: Error) => toast.error(getStandardErrorMessage(error)),
  });

  const createForm = useAppForm({
    defaultValues: { name: "" },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: nameSchema },
    onSubmit: async ({ value, formApi }) => {
      await createMutation.mutateAsync(value.name.trim());
      formApi.reset();
    },
  });

  if (clientsQuery.isError && clientsQuery.data === undefined) {
    return (
      <QueryError
        error={clientsQuery.error}
        fallback="We couldn't load your clients right now."
        onRetry={() => void clientsQuery.refetch()}
        isRetrying={clientsQuery.isFetching}
      />
    );
  }

  const clients = clientsQuery.data?.clients ?? [];

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <SectionHeader title="Clients" />
        <p className="text-sm text-muted-foreground">
          Each client gets a view-only portal with the projects you assign to
          them and the reports you publish. Their contacts can&rsquo;t run
          research or see your other clients.
        </p>
        {orgContextQuery.isSuccess && !canManage ? (
          <PermissionHint action="add clients or invite their contacts" />
        ) : null}
        {canManage ? (
          <createForm.AppForm>
            <createForm.Form className="flex max-w-md items-end gap-2">
              <createForm.AppField name="name">
                {(field) => (
                  <field.TextField
                    label="New client"
                    hideLabel
                    placeholder="Client name, e.g. Acme Plumbing"
                  />
                )}
              </createForm.AppField>
              <createForm.SubmitButton>Add client</createForm.SubmitButton>
            </createForm.Form>
          </createForm.AppForm>
        ) : null}

        {clientsQuery.isPending ? (
          <SkeletonCard />
        ) : clients.length === 0 ? (
          <p className="text-sm text-muted-foreground">No clients yet.</p>
        ) : (
          clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              canManage={canManage}
              onChanged={() => void refresh()}
            />
          ))
        )}
      </section>

      {clientsQuery.data && clients.length > 0 ? (
        <ProjectAssignments
          overview={clientsQuery.data}
          canManage={canManage}
          onChanged={() => void refresh()}
        />
      ) : null}
    </div>
  );
}

function ClientCard({
  client,
  canManage,
  onChanged,
}: {
  client: Client;
  canManage: boolean;
  onChanged: () => void;
}) {
  const [isRenaming, setIsRenaming] = useState(false);

  const renameMutation = useMutation({
    mutationFn: (name: string) =>
      renameClient({ data: { clientId: client.id, name } }),
    onSuccess: () => {
      setIsRenaming(false);
      onChanged();
    },
    onError: (error: Error) => toast.error(getStandardErrorMessage(error)),
  });
  const inviteMutation = useMutation({
    mutationFn: (email: string) =>
      inviteClientContact({ data: { clientId: client.id, email } }),
    onSuccess: (result) => {
      void announceInvitation(result, "Invitation sent");
      onChanged();
    },
    onError: (error: Error) => {
      toast.error(inviteErrorMessage(error));
      onChanged();
    },
  });
  const removeMutation = useMutation({
    mutationFn: (memberId: string) =>
      removeClientContact({ data: { memberId } }),
    onSuccess: () => {
      toast.success("Contact removed");
      onChanged();
    },
    onError: (error: Error) => toast.error(getStandardErrorMessage(error)),
  });
  const cancelMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const result = await authClient.organization.cancelInvitation({
        invitationId,
      });
      if (result.error) {
        throw new Error(
          result.error.message || "Failed to cancel the invitation",
        );
      }
    },
    onSuccess: () => {
      toast.success("Invitation canceled");
      onChanged();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const renameForm = useAppForm({
    defaultValues: { name: client.name },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: nameSchema },
    onSubmit: ({ value }) => renameMutation.mutateAsync(value.name.trim()),
  });
  const inviteForm = useAppForm({
    defaultValues: { email: "" },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: emailSchema },
    onSubmit: async ({ value, formApi }) => {
      await inviteMutation.mutateAsync(value.email.trim());
      formApi.reset();
    },
  });

  const hasPeople =
    client.contacts.length > 0 || client.pendingInvitations.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        {isRenaming ? (
          <renameForm.AppForm>
            <renameForm.Form className="flex flex-1 items-end gap-2">
              <renameForm.AppField name="name">
                {(field) => <field.TextField label="Client name" hideLabel />}
              </renameForm.AppField>
              <renameForm.SubmitButton>Save</renameForm.SubmitButton>
              <Button variant="ghost" onClick={() => setIsRenaming(false)}>
                Cancel
              </Button>
            </renameForm.Form>
          </renameForm.AppForm>
        ) : (
          <>
            <CardTitle>
              <h3>{client.name}</h3>
            </CardTitle>
            <span className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={
                  <Link
                    to="/portal/$clientId"
                    params={{ clientId: client.id }}
                  />
                }
              >
                View as client
              </Button>
              {canManage ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsRenaming(true)}
                >
                  Rename
                </Button>
              ) : null}
            </span>
          </>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {hasPeople ? (
          <ul className="divide-y rounded-lg border text-sm">
            {client.contacts.map((contact) => (
              <li
                key={contact.memberId}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <span>
                  {contact.email}
                  {contact.name && contact.name !== contact.email ? (
                    <span className="text-muted-foreground">
                      {" "}
                      · {contact.name}
                    </span>
                  ) : null}
                </span>
                {canManage ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    pending={
                      removeMutation.isPending &&
                      removeMutation.variables === contact.memberId
                    }
                    onClick={() => removeMutation.mutate(contact.memberId)}
                  >
                    Remove
                  </Button>
                ) : null}
              </li>
            ))}
            {client.pendingInvitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <span>
                  {invitation.email}
                  <span className="text-muted-foreground">
                    {" "}
                    · Invited, expires{" "}
                    {new Date(invitation.expiresAt).toLocaleDateString()}
                  </span>
                </span>
                {canManage ? (
                  <span className="flex gap-1">
                    <CopyButton
                      value={inviteLink(invitation.id)}
                      label="Copy link"
                      successMessage="Invite link copied"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      pending={
                        cancelMutation.isPending &&
                        cancelMutation.variables === invitation.id
                      }
                      onClick={() => cancelMutation.mutate(invitation.id)}
                    >
                      Cancel
                    </Button>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No contacts yet.</p>
        )}
        {canManage ? (
          <inviteForm.AppForm>
            <inviteForm.Form className="flex max-w-md items-end gap-2">
              <inviteForm.AppField name="email">
                {(field) => (
                  <field.TextField
                    label="Contact email"
                    hideLabel
                    type="email"
                    placeholder="contact@client.com"
                  />
                )}
              </inviteForm.AppField>
              <inviteForm.SubmitButton>Invite contact</inviteForm.SubmitButton>
            </inviteForm.Form>
          </inviteForm.AppForm>
        ) : null}
      </CardContent>
    </Card>
  );
}
