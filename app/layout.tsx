import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MOLLA — Your music career, connected",
  description: "Connect. Create. Grow.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans text-molla-black flex justify-center">
        <div className="w-full max-w-[430px] min-h-screen bg-white relative">
          {children}
        </div>
      </body>
    </html>
  );
}
