import type { AppRouter } from "@badminton-app/api/routers/index";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  useLocation,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";

import { Topbar } from "@/components/topbar";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../index.css?url";

const AUTH_ROUTES = ["/login", "/signup", "/complete-profile"];
export interface RouterAppContext {
  trpc: TRPCOptionsProxy<AppRouter>;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Badminton App",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  component: RootDocument,
});

function RootDocument() {
  const location = useLocation();
  const isAuthRoute = AUTH_ROUTES.includes(location.pathname);

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <div className="flex h-svh flex-col">
          {!isAuthRoute && <Topbar />}
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
        </div>
        <Toaster richColors />
        <TanStackRouterDevtools position="bottom-left" />
        <ReactQueryDevtools buttonPosition="bottom-right" position="bottom" />
        <Scripts />
      </body>
    </html>
  );
}
