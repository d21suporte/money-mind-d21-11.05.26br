import { createFileRoute } from "@tanstack/react-router";
import Audios from "@/pages/Audios";
import { RequireOnboarding } from "@/components/RequireOnboarding";

export const Route = createFileRoute("/audios")({
  component: () => (
    <RequireOnboarding>
      <Audios />
    </RequireOnboarding>
  ),
});
