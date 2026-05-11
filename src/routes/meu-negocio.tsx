import { createFileRoute } from "@tanstack/react-router";
import MeuNegocio from "@/pages/MeuNegocio";
import { RequireOnboarding } from "@/components/RequireOnboarding";

export const Route = createFileRoute("/meu-negocio")({
  component: () => (
    <RequireOnboarding>
      <MeuNegocio />
    </RequireOnboarding>
  ),
});
