import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/sessions/create")({
  component: () => <Outlet />,
});
