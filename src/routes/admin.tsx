import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — redirecionando" }, { name: "robots", content: "noindex" }] }),
  component: () => <Navigate to="/master/login" replace />,
});
