import type { Metadata } from "next";
import "./globals.css";
import { ATSCopilotProvider } from "@/components/ats-copilot/ATSCopilotProvider";
import { ATSCopilotSidebar } from "@/components/ats-copilot/ATSCopilotSidebar";

export const metadata: Metadata = {
  title: "Aberdeen Lawrence Ultimate - ATS AI Copilot",
  description: "AI-powered Applicant Tracking System with intelligent copilot assistance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ATSCopilotProvider>
          <div className="flex min-h-screen">
            <main className="flex-1">{children}</main>
            <ATSCopilotSidebar />
          </div>
        </ATSCopilotProvider>
      </body>
    </html>
  );
}
