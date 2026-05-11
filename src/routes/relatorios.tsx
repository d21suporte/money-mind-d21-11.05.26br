import { createFileRoute } from "@tanstack/react-router";
import Reports from "@/pages/Reports";
import { RequireOnboarding } from "@/components/RequireOnboarding";

export const Route = createFileRoute("/relatorios")({
  component: () => (
    <RequireOnboarding>
      <Reports />
    </RequireOnboarding>
  ),
});
