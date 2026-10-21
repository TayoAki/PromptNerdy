import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { SectionHeader } from "@/client/components/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/client/components/ui/select";
import {
  Table,
  TableBody,
  TableCard,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/client/components/ui/table";
import type { ClientsOverview } from "@/client/features/clients/ClientsSettings";
import { getStandardErrorMessage } from "@/client/lib/error-messages";
import { assignProjectClient } from "@/serverFunctions/clients";

const NO_CLIENT = "__none__";

// Which client each project belongs to (spec 0017): a client's contacts see
// only the projects assigned to that client.
export function ProjectAssignments({
  overview,
  canManage,
  onChanged,
}: {
  overview: ClientsOverview;
  canManage: boolean;
  onChanged: () => void;
}) {
  const assignMutation = useMutation({
    mutationFn: (input: { projectId: string; clientId: string | null }) =>
      assignProjectClient({ data: input }),
    onSuccess: () => onChanged(),
    onError: (error: Error) => toast.error(getStandardErrorMessage(error)),
  });

  const items = [
    { value: NO_CLIENT, label: "No client (agency only)" },
    ...overview.clients.map((client) => ({
      value: client.id,
      label: client.name,
    })),
  ];

  return (
    <section className="space-y-3">
      <SectionHeader title="Projects" />
      <p className="text-sm text-muted-foreground">
        A client&rsquo;s contacts see only the projects assigned to that client.
      </p>
      <TableCard>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead className="w-72">Client</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {overview.projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  {project.name}
                  {project.domain ? (
                    <span className="text-muted-foreground">
                      {" "}
                      · {project.domain}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Select
                    items={items}
                    value={project.clientId ?? NO_CLIENT}
                    disabled={!canManage || assignMutation.isPending}
                    onValueChange={(value) => {
                      if (value == null) return;
                      assignMutation.mutate({
                        projectId: project.id,
                        clientId: value === NO_CLIENT ? null : value,
                      });
                    }}
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-label={`Client for ${project.name}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableCard>
    </section>
  );
}
