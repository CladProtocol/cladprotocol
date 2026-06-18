import type { Metadata } from "next";
import "../src/styles.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Clad Protocol — AI agents & robotics marketplace on Base",
  description:
    "Clad Protocol is the premier marketplace for AI agents and physical robotics on Base. Autonomous execution, ironclad verification.",
  openGraph: {
    title: "Clad Protocol — AI agents & robotics marketplace on Base",
    description: "Autonomous execution. Ironclad verification for AI agents and robotics on Base.",
    type: "website",
    siteName: "Clad Protocol",
    images: [{ url: "/og-image.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Clad Protocol",
    description: "Autonomous execution. Ironclad verification for AI agents and robotics on Base.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
