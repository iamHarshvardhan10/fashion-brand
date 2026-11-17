import AppSidebar from "@/components/core/dashboard/AppSidebar";
import DashboardHeader from "@/components/core/dashboard/DashboardHeader";
import AuthProvider from "@/components/core/dashboard/auth/AuthProvider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

// Everything under (panel) requires a signed-in Super admin or Admin.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <DashboardHeader />
                    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
                </SidebarInset>
            </SidebarProvider>
        </AuthProvider>
    );
}
