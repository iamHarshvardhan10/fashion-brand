import { AlertTriangleIcon } from "lucide-react";
import { lowStock } from "@/lib/dashboard-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function LowStock({ items = lowStock }: { items?: typeof lowStock }) {
    return (
        <Card className="rounded-none">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-2xl font-black tracking-tight uppercase font-stretch-75%">
                    <AlertTriangleIcon className="size-5 text-brand" />
                    Low stock
                </CardTitle>
                <CardDescription>Items below 20% of capacity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {items.map((item) => (
                    <div key={item.sku} className="space-y-2">
                        <div className="flex items-baseline justify-between gap-2 text-sm">
                            <span className="truncate font-medium">{item.name}</span>
                            <span className="shrink-0 font-mono text-xs text-muted-foreground">
                                {item.stock} / {item.capacity} left
                            </span>
                        </div>
                        <Progress
                            value={(item.stock / item.capacity) * 100}
                            aria-label={`${item.name} stock level`}
                            className="[&_[data-slot=progress-indicator]]:bg-brand"
                        />
                        <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">{item.sku}</p>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
