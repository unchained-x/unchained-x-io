import { useCallback, useState } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { ClientOnly } from "remix-utils/client-only";

import type { Route } from "./+types/root";
import "./app.css";

import Footer from "~/components/layout/Footer";
import Header from "~/components/layout/Header";
import MenuOverlay from "~/components/layout/MenuOverlay.client";
import Cursor from "~/components/ui/Cursor.client";
import LoadingScreen from "~/components/ui/LoadingScreen.client";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=DotGothic16&family=Rubik:ital,wght@0,300..900;1,300..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const toggleMenu = useCallback(() => setIsMenuOpen((prev) => !prev), []);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);
  const handleLoadComplete = useCallback(() => setIsLoaded(true), []);

  return (
    <>
      <ClientOnly fallback={null}>{() => <Cursor />}</ClientOnly>
      <ClientOnly fallback={null}>
        {() => !isLoaded && <LoadingScreen onComplete={handleLoadComplete} />}
      </ClientOnly>
      <Header isMenuOpen={isMenuOpen} onMenuToggle={toggleMenu} onMenuClose={closeMenu} />
      <ClientOnly fallback={null}>
        {() => <MenuOverlay isOpen={isMenuOpen} onClose={closeMenu} />}
      </ClientOnly>
      <main>
        <Outlet />
      </main>
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
