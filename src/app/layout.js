import { AuthProvider } from "@/hooks/useAuth";
import "./globals.css";

export const metadata = {
  title: "Cloud Scheduler | Employee Management",
  description: "Seamlessly create and manage employee schedules with Google integration.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="grid-bg"></div>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
