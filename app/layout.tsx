import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aberdeen Lawrence - AI Hiring System',
  description: 'AI-powered interview prediction and hiring management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100">{children}</body>
    </html>
  );
}
