import { createFileRoute, redirect } from "@tanstack/react-router";
import { getCurrentSession } from "@/lib/saas.functions";

export const Route = createFileRoute("/master/")({
  beforeLoad: async () => {
    const s = await getCurrentSession();
    if (s?.role === "master") throw redirect({ to: "/master/tenants" });
    throw redirect({ to: "/master/login" });
  },
  component: () => null,
});
