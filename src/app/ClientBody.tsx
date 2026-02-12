"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/pwa";
import { AuthProvider } from "@/lib/auth-context";

interface ClientBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function ClientBody({ children, className }: ClientBodyProps) {
  // Register service worker and set up PWA
  useEffect(() => {
    // Register service worker for PWA functionality
    registerServiceWorker();

    // This runs only on the client after hydration
    document.body.className = className || "antialiased";
  }, [className]);

  return (
    <body className={className}>
      <AuthProvider>{children}</AuthProvider>
    </body>
  );
}

export default ClientBody;
