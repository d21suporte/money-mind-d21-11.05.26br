import { createFileRoute } from "@tanstack/react-router";
import Onboarding from "@/pages/Onboarding";

export const Route = createFileRoute("/bem-vindo")({
  component: Onboarding,
});
