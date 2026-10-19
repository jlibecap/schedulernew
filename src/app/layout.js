import "./globals.css";

export const metadata = {
  title: "Furniture Fair Scheduler",
  description: "Weekly staff schedule for Furniture Fair.",
};

export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
