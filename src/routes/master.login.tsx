import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/master/login")({
  head: () => ({ meta: [{ title: "Redirecionando..." }, { name: "robots", content: "noindex" }] }),
  component: () => <Navigate to="/admin" replace />,
});
