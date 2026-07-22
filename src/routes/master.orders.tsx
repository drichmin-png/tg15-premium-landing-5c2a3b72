import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/master/orders")({
  head: () => ({ meta: [{ title: "Redirecionando..." }, { name: "robots", content: "noindex" }] }),
  component: () => <Navigate to="/admin" replace />,
});
