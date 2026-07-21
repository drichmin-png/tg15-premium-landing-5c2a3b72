import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getLocalSaasSession } from "@/lib/saas-local";

export const Route = createFileRoute("/master/")({
  component: MasterIndexRedirect,
});

function MasterIndexRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    const session = getLocalSaasSession();
    navigate({ to: session?.role === "master" ? "/master/tenants" : "/master/login", replace: true });
  }, [navigate]);
  return null;
}
