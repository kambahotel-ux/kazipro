import { createBrowserRouter } from "react-router-dom";
import { appRoutes } from "./app-routes";

/** Flags React Router v7 — constante stable pour éviter les warnings de dépréciation. */
export const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

export const appRouter = createBrowserRouter(appRoutes, {
  future: {
    v7_relativeSplatPath: routerFuture.v7_relativeSplatPath,
  },
});
