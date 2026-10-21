import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Switch } from "@/client/components/ui/switch";
import { getStandardErrorMessage } from "@/client/lib/error-messages";
import {
  getReportPublication,
  setReportPublication,
} from "@/serverFunctions/clients";

// "Visible to <client>" on a report page (spec 0017). Reports stay
// agency-only until published; nothing renders for a project without a client.
export function ReportClientPublication({
  projectId,
  reportId,
}: {
  projectId: string;
  reportId: string;
}) {
  const queryClient = useQueryClient();
  const queryKey = ["report-publication", projectId, reportId];
  const publicationQuery = useQuery({
    queryKey,
    queryFn: () => getReportPublication({ data: { projectId, reportId } }),
  });
  const publishMutation = useMutation({
    mutationFn: (visible: boolean) =>
      setReportPublication({ data: { projectId, reportId, visible } }),
    onSuccess: (_result, visible) => {
      toast.success(
        visible ? "Published to the client portal" : "Hidden from the client",
      );
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => toast.error(getStandardErrorMessage(error)),
  });

  const client = publicationQuery.data?.client;
  if (!client) return null;
  const visible = Boolean(publicationQuery.data?.visibleAt);

  return (
    <label className="flex items-center gap-2 text-sm">
      <Switch
        checked={visible}
        disabled={publishMutation.isPending}
        onCheckedChange={(checked) => publishMutation.mutate(checked)}
      />
      Visible to {client.name}
    </label>
  );
}
