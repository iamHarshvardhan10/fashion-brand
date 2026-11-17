import { formatPrice, topProducts } from "@/lib/dashboard-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ImageBox from "@/components/home/ImageBox";

export default function TopProducts() {
    return (
        <Card className="rounded-none">
            <CardHeader>
                <CardTitle className="font-display text-2xl font-black tracking-tight uppercase font-stretch-75%">
                    Top products
                </CardTitle>
                <CardDescription>Best sellers this month</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {topProducts.map(({ product, sold }, index) => (
                        <li key={product.id} className="flex items-center gap-3">
                            <span className="w-4 font-mono text-xs text-muted-foreground">{index + 1}</span>
                            <ImageBox src={product.image} alt={product.name} className="size-12 shrink-0 bg-neutral-100" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{product.name}</p>
                                <p className="font-mono text-xs text-muted-foreground">{formatPrice(product.price)}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-mono text-sm font-semibold">{sold}</p>
                                <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">sold</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
