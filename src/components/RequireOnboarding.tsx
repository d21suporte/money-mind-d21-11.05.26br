import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "@/lib/router-compat";
import { useStorage } from "@/hooks/useStorage";

export function RequireOnboarding({ children }: { children: ReactNode }) {
  const [onboarded] = useStorage<boolean>("d21.onboarded", false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    setHasSession(typeof window !== "undefined" && !!localStorage.getItem("d21.activeUser"));
  }, []);

  if (hasSession === null) return null;
  if (!hasSession || !onboarded) return <Navigate to="/bem-vindo" replace />;
  return <>{children}</>;
}
