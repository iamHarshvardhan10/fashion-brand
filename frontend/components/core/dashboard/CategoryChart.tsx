"use client";

import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
import { formatPrice, salesByCategory } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const chartConfig = {
    sales: { label: "Sales", color: "var(--chart-1)" },
} satisfies ChartConfig;

export default function CategoryChart({ className }: { className?: string }) {
    return (
        <Card className={cn("rounded-none", className)}>
            <CardHeader>
                <CardTitle className="font-display text-2xl font-black tracking-tight uppercase font-stretch-75%">
                    Sales by category
                </CardTitle>
                <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
                    <BarChart data={salesByCategory} layout="vertical" margin={{ right: 56 }} barCategoryGap={8}>
                        <XAxis type="number" dataKey="sales" hide />
                        <YAxis
                            type="category"
                            dataKey="category"
                            tickLine={false}
                            axisLine={false}
                            width={84}
                        />
                        <ChartTooltip
                            cursor={{ fill: "var(--muted)" }}
                            content={
                                <ChartTooltipContent
                                    hideIndicator
                                    formatter={(value) => (
                                        <span className="font-mono font-medium tabular-nums">
                                            {formatPrice(Number(value))}
                                        </span>
                                    )}
                                />
                            }
                        />
                        <Bar dataKey="sales" fill="var(--color-sales)" radius={[0, 4, 4, 0]}>
                            <LabelList
                                dataKey="sales"
                                position="right"
                                className="fill-muted-foreground font-mono"
                                fontSize={11}
                                formatter={(value) => `₹${(Number(value) / 1000).toFixed(0)}k`}
                            />
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
