"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { formatPrice, revenueSeries } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
    current: { label: "This period", color: "var(--chart-1)" },
    previous: { label: "Last period", color: "var(--chart-2)" },
} satisfies ChartConfig;

const compact = (value: number) => `₹${(value / 1000).toFixed(0)}k`;

type RevenueChartProps = {
    className?: string;
    data?: typeof revenueSeries;
    title?: string;
    description?: string;
};

export default function RevenueChart({
    className,
    data = revenueSeries,
    title = "Revenue",
    description = "Weekly revenue, this period vs last",
}: RevenueChartProps) {
    return (
        <Card className={cn("rounded-none", className)}>
            <CardHeader>
                <CardTitle className="font-display text-2xl font-black tracking-tight uppercase font-stretch-75%">
                    {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
                    <LineChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={compact} />
                        <ChartTooltip
                            cursor={{ strokeDasharray: "3 3" }}
                            content={
                                <ChartTooltipContent
                                    indicator="line"
                                    formatter={(value, name) => (
                                        <div className="flex w-full items-center justify-between gap-4">
                                            <span className="text-muted-foreground">
                                                {chartConfig[name as keyof typeof chartConfig]?.label}
                                            </span>
                                            <span className="font-mono font-medium tabular-nums">
                                                {formatPrice(Number(value))}
                                            </span>
                                        </div>
                                    )}
                                />
                            }
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                        {/* Dashed comparison line: identity isn't carried by color alone */}
                        <Line
                            dataKey="previous"
                            type="monotone"
                            stroke="var(--color-previous)"
                            strokeWidth={2}
                            strokeDasharray="5 4"
                            dot={false}
                            activeDot={{ r: 4 }}
                        />
                        <Line
                            dataKey="current"
                            type="monotone"
                            stroke="var(--color-current)"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
