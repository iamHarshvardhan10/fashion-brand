"use client";

import { usePathname } from "next/navigation";
import { BellIcon, SearchIcon } from "lucide-react";
import { useAuth } from "@/components/core/dashboard/auth/AuthProvider";
import { navForUser } from "@/components/core/dashboard/AppSidebar";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function DashboardHeader() {
    const pathname = usePathname();
    const { user } = useAuth();

    const items = navForUser(user).flatMap((g) => g.items);
    const current =
        items.find((i) => i.href !== "/dashboard" && pathname.startsWith(i.href)) ??
        items.find((i) => i.href === "/dashboard");

    return (
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur md:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-5" />
            <Breadcrumb>
                <BreadcrumbList className="font-mono text-xs tracking-[0.15em] uppercase">
                    <BreadcrumbItem>
                        <BreadcrumbPage>{current?.title ?? "Overview"}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="ml-auto flex items-center gap-2">
                <div className="relative hidden md:block">
                    <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search orders, products…" className="w-64 bg-card pl-8" />
                </div>
                {/* TODO: wire up notifications */}
                <Button variant="ghost" size="icon-lg" aria-label="Notifications" className="relative">
                    <BellIcon className="size-5" />
                    <span className="absolute top-2 right-2 size-2 rounded-full bg-brand" />
                </Button>
            </div>
        </header>
    );
}
