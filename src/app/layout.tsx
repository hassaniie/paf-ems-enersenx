import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Enersenx EMS",
    template: "%s · Enersenx EMS",
  },
  description: "Enersenx Energy Monitoring System",
};

export const viewport: Viewport = {
  themeColor: "#0a0e17",
  colorScheme: "dark",
};

/*
 * Dark-first control surface. Theme is fixed to dark for now; a per-tenant
 * brand accent and an opt-in light theme (data-theme="light") plug in here
 * in Step 3. Fonts use a system stack (no runtime/build network dependency,
 * per the restrained-network constraint); a self-hosted variable font is a
 * Step 3 typography decision.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="dark" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
