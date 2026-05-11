import { createFileRoute } from "@tanstack/react-router";
import Profile from "@/pages/Profile";
import { RequireOnboarding } from "@/components/RequireOnboarding";

export const Route = createFileRoute("/perfil")({
  component: () => (
    <RequireOnboarding>
      <Profile />
    </RequireOnboarding>
  ),
});
