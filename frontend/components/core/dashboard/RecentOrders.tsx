import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { formatPrice, recentOrders, type Order, type OrderStatus } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Status is always shown as a text label; the tint only reinforces it.
const statusStyles: Record<OrderStatus, string> = {
    Pending: "bg-amber-100 text-amber-900",
    Processing: "bg-sky-100 text-sky-900",
    Shipped: "bg-neutral-950 text-cream",
    Delivered: "bg-emerald-100 text-emerald-900",
    Returned: "bg-brand/10 text-brand",
};

type RecentOrdersProps = {
    className?: string;
    orders?: Order[];
    title?: string;
    description?: string;
};

export default function RecentOrders({
    className,
    orders = recentOrders,
    title = "Recent orders",
    description = "Latest orders across all channels",
}: RecentOrdersProps) {
    return (
        <Card className={cn("rounded-none", className)}>
            <CardHeader>
                <CardTitle className="font-display text-2xl font-black tracking-tight uppercase font-stretch-75%">
                    {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
                <CardAction>
                    <Link
                        href="/dashboard/orders"
                        className="group flex items-center gap-2 font-mono text-xs tracking-[0.2em] uppercase underline-offset-8 hover:underline"
                    >
                        View all
                        <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </CardAction>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="font-mono text-[11px] tracking-[0.15em] uppercase">
                            <TableHead>Order</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead className="hidden md:table-cell">Date</TableHead>
                            <TableHead className="hidden sm:table-cell text-right">Items</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell className="font-mono text-xs font-medium">{order.id}</TableCell>
                                <TableCell>
                                    <div className="font-medium">{order.customer}</div>
                                    <div className="text-xs text-muted-foreground">{order.email}</div>
                                </TableCell>
                                <TableCell className="hidden text-muted-foreground md:table-cell">{order.date}</TableCell>
                                <TableCell className="hidden text-right font-mono sm:table-cell">{order.items}</TableCell>
                                <TableCell>
                                    <Badge
                                        className={cn(
                                            "rounded-none font-mono text-[10px] tracking-widest uppercase",
                                            statusStyles[order.status],
                                        )}
                                    >
                                        {order.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono font-semibold">
                                    {formatPrice(order.total)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
