import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { stats, type Stat } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Metrics where a drop is the good direction.
const lowerIsBetter = new Set(["Return rate"]);

export default function StatCards({ items = stats }: { items?: Stat[] }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((stat) => {
                const up = stat.change >= 0;
                const good = lowerIsBetter.has(stat.label) ? !up : up;
                const Icon = up ? TrendingUpIcon : TrendingDownIcon;
                return (
                    <Card key={stat.label} className="rounded-none">
                        <CardHeader>
                            <CardDescription className="font-mono text-[11px] tracking-[0.2em] uppercase">
                                {stat.label}
                            </CardDescription>
                            <CardTitle className="font-display text-4xl font-black tracking-tight font-stretch-75% tabular-nums">
                                {stat.value}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-2 text-xs">
                            <span
                                className={cn(
                                    "inline-flex items-center gap-1 font-mono font-semibold",
                                    good ? "text-emerald-700" : "text-brand",
                                )}
                            >
                                <Icon className="size-3.5" />
                                {up ? "+" : ""}
                                {stat.change}%
                            </span>
                            <span className="text-muted-foreground">{stat.hint}</span>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
