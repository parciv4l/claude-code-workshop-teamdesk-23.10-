import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Footer from "#/components/footer";
import Header from "#/components/header";
import ThemedToaster from "#/components/themed-toaster";
import { TooltipProvider } from "#/components/ui/tooltip";
import type { getRouter } from "#/router";
import { Route as AboutRoute } from "#/routes/about";
import { Route as BookingsRoute } from "#/routes/bookings";
import { Route as IndexRoute } from "#/routes/index";
import { Route as NotesRoute } from "#/routes/notes";
import { Route as RoomsRoute } from "#/routes/rooms";
import { Route as TasksRoute } from "#/routes/tasks";
import { Route as TeamRoute } from "#/routes/team";
import "./styles.css";
import { resetDatabase } from "./database";

function DemoBanner() {
  return (
    <div className="border-border border-b bg-muted px-4 py-2 text-center text-muted-foreground text-xs">
      Live demo: the real Teamdesk app running entirely in your browser (SQLite
      in the page). Changes are saved on this device only.{" "}
      <button
        className="font-semibold text-foreground underline"
        onClick={resetDatabase}
        type="button"
      >
        Reset demo data
      </button>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: () => (
    <TooltipProvider>
      <DemoBanner />
      <Header />
      <div className="flex-1 pb-20">
        <Outlet />
      </div>
      <Footer />
      <ThemedToaster />
    </TooltipProvider>
  ),
});

// The same cast routeTree.gen.ts makes: each route's update() has its own type.
// biome-ignore lint/suspicious/noExplicitAny: see above
const child = (route: any, path: string) =>
  route.update({ getParentRoute: () => rootRoute, id: path, path });

const routeTree = rootRoute.addChildren([
  child(IndexRoute, "/"),
  child(AboutRoute, "/about"),
  child(NotesRoute, "/notes"),
  child(TeamRoute, "/team"),
  child(RoomsRoute, "/rooms"),
  child(BookingsRoute, "/bookings"),
  child(TasksRoute, "/tasks"),
]);

const router = createRouter({
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  history: createMemoryHistory({ initialEntries: ["/"] }),
  routeTree,
});

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    {/* Register types the router as src/router.tsx's. Same routes, different root. */}
    <RouterProvider
      router={router as unknown as ReturnType<typeof getRouter>}
    />
  </StrictMode>
);
