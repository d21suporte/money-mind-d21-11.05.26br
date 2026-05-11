import { createFileRoute } from "@tanstack/react-router";
import Calculator from "@/pages/Calculator";
import { RequireOnboarding } from "@/components/RequireOnboarding";

export const Route = createFileRoute("/calculadora")({
  component: () => (
    <RequireOnboarding>
      <Calculator />
    </RequireOnboarding>
  ),
});
