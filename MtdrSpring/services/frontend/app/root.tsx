// app/root.tsx (updated with AuthGuard)
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { CookiesProvider } from "react-cookie";
import { CookieInitializer } from "./components/CookieInitializer";
import { AuthGuard } from "./components/AuthGuard";
import type { Route } from "./+types/root";
import "./app.css";
import "./font-apex.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

// This Layout component defines the main HTML structure
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Consider adding title here if it's static, or use Meta export */}
        {/* <title>Faro Chat Bot</title> */}
        <Meta />
        <Links />
      </head>
      {/* Move the body classes here from the App component */}
      <body className="bg-oc-bg text-oc-text">
        <div id="portal-root"></div>
        {/* The content from App (and nested routes) will render here */}
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// This App component renders the content INSIDE the Layout's body
export default function App() {
  // --- REMOVE <html>, <head>, <body> tags ---
  // --- REMOVE Meta and Links, they are in Layout ---
  // --- REMOVE ScrollRestoration and Scripts, they are in Layout ---
  return (
    <CookiesProvider>
      <CookieInitializer />
      <AuthGuard>
        <Outlet /> {/* Child routes render here */}
      </AuthGuard>
    </CookiesProvider>
  );
  // --- END REMOVALS ---
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
