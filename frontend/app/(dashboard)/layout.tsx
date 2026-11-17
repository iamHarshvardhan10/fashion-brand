import type { Metadata } from "next";
import "../globals.css";
import StoreProvider from "@/components/providers/StoreProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { fontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
    title: "Dashboard",
    description: "Store admin dashboard",
};

// Separate root layout so the dashboard doesn't inherit the storefront Navbar / Footer.
export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${fontVariables} h-full antialiased`}>
            <body className="dashboard-theme min-h-full" suppressHydrationWarning>
                <StoreProvider>
                    <TooltipProvider>{children}</TooltipProvider>
                </StoreProvider>
            </body>
        </html>
    );
}
