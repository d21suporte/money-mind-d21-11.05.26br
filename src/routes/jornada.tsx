import { createFileRoute } from "@tanstack/react-router";
import Journey from "@/pages/Journey";
import { RequireOnboarding } from "@/components/RequireOnboarding";

export const Route = createFileRoute("/jornada")({
  component: () => (
    <RequireOnboarding>
      <Journey />
    </RequireOnboarding>
  ),
});
