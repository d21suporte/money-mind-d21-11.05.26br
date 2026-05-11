import { createFileRoute } from "@tanstack/react-router";
import Vitrine from "@/pages/Vitrine";
import { RequireOnboarding } from "@/components/RequireOnboarding";

export const Route = createFileRoute("/vitrine")({
  component: () => (
    <RequireOnboarding>
      <Vitrine />
    </RequireOnboarding>
  ),
});
