"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BarChart3Icon,
    BoxesIcon,
    ChevronsUpDownIcon,
    FolderTreeIcon,
    ImagesIcon,
    LayersIcon,
    LayoutDashboardIcon,
    LogOutIcon,
    MegaphoneIcon,
    PackageIcon,
    ShieldCheckIcon,
    ShirtIcon,
    ShoppingBagIcon,
    StoreIcon,
    TagIcon,
    UsersIcon,
    type LucideIcon,
} from "lucide-react";
import { site } from "@/lib/site";
import { roleLabels, type Role } from "@/lib/access";
import type { AuthUser } from "@/services/operations/authAPI";
import { useAuth } from "@/components/core/dashboard/auth/AuthProvider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";

type NavItem = { title: string; href: string; icon: LucideIcon; roles?: Role[] };
type NavGroup = { label: string; items: NavItem[] };

// TODO: create the remaining sub-pages under app/(dashboard)/dashboard/(panel)/* as they're built.
const staffNav: NavGroup[] = [
    {
        label: "Store",
        items: [
            { title: "Overview", href: "/dashboard", icon: LayoutDashboardIcon },
            { title: "Orders", href: "/dashboard/orders", icon: ShoppingBagIcon },
            { title: "Products", href: "/dashboard/products", icon: PackageIcon },
            { title: "Industries", href: "/dashboard/industries", icon: ShirtIcon },
            { title: "Categories", href: "/dashboard/categories", icon: FolderTreeIcon },
            { title: "Collections", href: "/dashboard/collections", icon: LayersIcon },
            { title: "Inventory", href: "/dashboard/inventory", icon: BoxesIcon },
            { title: "Customers", href: "/dashboard/customers", icon: UsersIcon },
        ],
    },
    {
        label: "Admin",
        items: [{ title: "Team", href: "/dashboard/team", icon: ShieldCheckIcon, roles: ["SUPER_ADMIN"] }],
    },
    {
        label: "Growth",
        items: [
            { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3Icon },
            { title: "Banners", href: "/dashboard/banners", icon: ImagesIcon },
            { title: "Discounts", href: "/dashboard/discounts", icon: TagIcon },
            { title: "Campaigns", href: "/dashboard/campaigns", icon: MegaphoneIcon },
        ],
    },
];

export function navForUser(user: AuthUser): NavGroup[] {
    return staffNav
        .map((group) => ({ ...group, items: group.items.filter((i) => !i.roles || i.roles.includes(user.role)) }))
        .filter((group) => group.items.length);
}

const initials = (name: string) =>
    name
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

export default function AppSidebar() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const brandName = site.name;

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
                            <span className="flex aspect-square size-8 items-center justify-center bg-sidebar-primary font-display text-sm font-black text-sidebar-primary-foreground uppercase">
                                {brandName.charAt(0)}
                            </span>
                            <span className="grid flex-1 leading-tight">
                                <span className="truncate font-display text-base font-black tracking-tight uppercase font-stretch-75%">
                                    {brandName}
                                </span>
                                <span className="truncate font-mono text-[10px] tracking-[0.2em] text-sidebar-foreground/60 uppercase">
                                    Admin
                                </span>
                            </span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {navForUser(user).map((group) => (
                    <SidebarGroup key={group.label}>
                        <SidebarGroupLabel className="font-mono text-[10px] tracking-[0.2em] text-sidebar-foreground/50 uppercase">
                            {group.label}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => {
                                    const active =
                                        item.href === "/dashboard"
                                            ? pathname === item.href
                                            : pathname.startsWith(item.href);
                                    return (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton
                                                isActive={active}
                                                tooltip={item.title}
                                                render={<Link href={item.href} />}
                                                className="data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground"
                                            >
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="View store" render={<Link href="/" />}>
                            <StoreIcon />
                            <span>View store</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
                                <Avatar className="size-8 rounded-none">
                                    <AvatarFallback className="rounded-none bg-cream font-mono text-xs text-neutral-950">
                                        {initials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{user.name}</span>
                                    <span className="truncate font-mono text-[10px] tracking-widest text-sidebar-foreground/60 uppercase">
                                        {roleLabels[user.role]}
                                    </span>
                                </span>
                                <ChevronsUpDownIcon className="ml-auto" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="top" align="start" className="min-w-56">
                                <DropdownMenuGroup>
                                    <DropdownMenuLabel>
                                        <span className="block truncate text-foreground">{user.name}</span>
                                        <span className="block truncate font-normal">{user.email}</span>
                                    </DropdownMenuLabel>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" onClick={signOut}>
                                    <LogOutIcon />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
