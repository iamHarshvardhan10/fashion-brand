"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArchiveIcon,
    ArchiveRestoreIcon,
    ImageIcon,
    MoreHorizontalIcon,
    PackageIcon,
    PencilIcon,
    PlusIcon,
    RefreshCwIcon,
    SearchIcon,
    Trash2Icon,
} from "lucide-react";
import { fetchCategories, type Category } from "@/services/operations/categoryAPI";
import { fetchIndustries, type Industry } from "@/services/operations/industryAPI";
import {
    deleteProduct,
    fetchProducts,
    updateProduct,
    type ProductList as ProductListData,
    type ProductListItem,
    type ProductListQuery,
    type ProductStatus,
} from "@/services/operations/productAPI";
import { discountPercent, formatPaise, statusLabels, statusStyles } from "@/lib/product-options";
import { errorMessage } from "@/utils/apiError";
import { formatDate } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DeleteDialog from "@/components/core/dashboard/categories/DeleteDialog";
import { NativeSelect } from "./fields";

const PAGE_SIZE = 20;
const TABS: { value: ProductStatus | "ALL"; label: string }[] = [
    { value: "ALL", label: "All" },
    { value: "ACTIVE", label: "Active" },
    { value: "DRAFT", label: "Drafts" },
    { value: "ARCHIVED", label: "Archived" },
];

export default function ProductList() {
    const router = useRouter();
    const [data, setData] = useState<ProductListData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [reload, setReload] = useState(0);

    const [searchInput, setSearchInput] = useState("");
    const [query, setQuery] = useState<ProductListQuery & { status?: ProductStatus }>({ sort: "newest", page: 1 });
    const [toDelete, setToDelete] = useState<ProductListItem | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);

    // Debounce typing into the search box
    useEffect(() => {
        const t = setTimeout(() => setQuery((q) => (q.search === (searchInput.trim() || undefined) ? q : { ...q, search: searchInput.trim() || undefined, page: 1 })), 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    useEffect(() => {
        fetchCategories({ includeInactive: true, withSubCategories: false }).then(setCategories).catch(() => {});
        fetchIndustries().then(setIndustries).catch(() => {});
    }, []);

    useEffect(() => {
        let cancelled = false;
        fetchProducts({ ...query, pageSize: PAGE_SIZE })
            .then((result) => {
                if (cancelled) return;
                setData(result);
                setError(null);
            })
            .catch((err) => !cancelled && setError(errorMessage(err, "Could not load products")))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [query, reload]);

    const refresh = () => {
        setLoading(true);
        setReload((n) => n + 1);
    };
    const patch = (next: Partial<typeof query>) => {
        setLoading(true);
        setQuery((q) => ({ ...q, page: 1, ...next }));
    };

    async function setStatus(item: ProductListItem, status: ProductStatus) {
        setActionError(null);
        try {
            await updateProduct(item.id, { status });
            refresh();
        } catch (err) {
            setActionError(`${item.name}: ${errorMessage(err)}`);
        }
    }

    const counts = data?.counts ?? {};
    const totalAll = (counts.ACTIVE ?? 0) + (counts.DRAFT ?? 0) + (counts.ARCHIVED ?? 0);
    const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
    const filtered = Boolean(query.search || query.categoryId || query.industryId || query.stock);

    return (
        <>
            <Card className="rounded-none">
                <CardContent className="grid gap-4">
                    {/* Status tabs */}
                    <div className="-mx-1 flex gap-1 overflow-x-auto border-b">
                        {TABS.map((tab) => {
                            const active = (query.status ?? "ALL") === tab.value;
                            const count = tab.value === "ALL" ? totalAll : (counts[tab.value] ?? 0);
                            return (
                                <button
                                    key={tab.value}
                                    type="button"
                                    onClick={() => patch({ status: tab.value === "ALL" ? undefined : tab.value })}
                                    className={cn(
                                        "-mb-px flex items-center gap-2 border-b-2 px-3 py-2 font-mono text-xs tracking-wider uppercase",
                                        active ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    {tab.label}
                                    {data && <span className="bg-muted px-1.5 text-[10px]">{count}</span>}
                                </button>
                            );
                        })}
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative min-w-56 flex-1">
                            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search name, style code, SKU or brand"
                                aria-label="Search products"
                                className="pl-8"
                            />
                        </div>
                        <NativeSelect
                            value={query.industryId ?? ""}
                            onChange={(e) => patch({ industryId: e.target.value || undefined })}
                            aria-label="Industry"
                            className="w-36"
                        >
                            <option value="">All industries</option>
                            {industries.map((i) => (
                                <option key={i.id} value={i.id}>
                                    {i.name}
                                </option>
                            ))}
                        </NativeSelect>
                        <NativeSelect
                            value={query.categoryId ?? ""}
                            onChange={(e) => patch({ categoryId: e.target.value || undefined })}
                            aria-label="Category"
                            className="w-44"
                        >
                            <option value="">All categories</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </NativeSelect>
                        <NativeSelect
                            value={query.stock ?? ""}
                            onChange={(e) => patch({ stock: (e.target.value || undefined) as ProductListQuery["stock"] })}
                            aria-label="Stock"
                            className="w-44"
                        >
                            <option value="">Any stock</option>
                            <option value="in">In stock</option>
                            <option value="low">Sizes running low</option>
                            <option value="sizes-out">Sizes sold out</option>
                            <option value="out">Fully out of stock</option>
                        </NativeSelect>
                        <NativeSelect
                            value={query.sort}
                            onChange={(e) => patch({ sort: e.target.value as ProductListQuery["sort"] })}
                            aria-label="Sort"
                            className="w-40"
                        >
                            <option value="newest">Newest first</option>
                            <option value="oldest">Oldest first</option>
                            <option value="name">Name A–Z</option>
                            <option value="price-asc">Price: low to high</option>
                            <option value="price-desc">Price: high to low</option>
                            <option value="stock-asc">Stock: low to high</option>
                            <option value="stock-desc">Stock: high to low</option>
                        </NativeSelect>
                        <Button variant="outline" size="icon" aria-label="Refresh" onClick={refresh}>
                            <RefreshCwIcon className={cn(loading && "animate-spin")} />
                        </Button>
                    </div>

                    {actionError && (
                        <p role="alert" className="border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                            {actionError}
                        </p>
                    )}

                    {error ? (
                        <Empty title="Couldn't load products" text={error} action={<Button variant="outline" onClick={refresh}>Try again</Button>} />
                    ) : !data ? (
                        <div className="grid gap-2">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full rounded-none" />
                            ))}
                        </div>
                    ) : !data.items.length ? (
                        filtered || query.status ? (
                            <Empty title="No matches" text="No products match these filters." />
                        ) : (
                            <Empty
                                title="No products yet"
                                text="Add your first product with its photos, sizes, stock and details."
                                action={
                                    <Button render={<Link href="/dashboard/products/new" />} nativeButton={false}>
                                        <PlusIcon />
                                        Add product
                                    </Button>
                                }
                            />
                        )
                    ) : (
                        <div className={cn("overflow-x-auto transition-opacity", loading && "opacity-60")}>
                            <Table className="min-w-[860px]">
                                <TableHeader>
                                    <TableRow className="font-mono text-[11px] tracking-[0.15em] uppercase">
                                        <TableHead>Product</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead className="text-right">Stock</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="hidden xl:table-cell">Updated</TableHead>
                                        <TableHead className="w-12">
                                            <span className="sr-only">Actions</span>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.items.map((item) => (
                                        <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/products/${item.id}`)}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-14 w-11 shrink-0 items-center justify-center overflow-hidden border bg-muted">
                                                        {item.image ? (
                                                            // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL
                                                            <img
                                                                src={item.image.url.replace("/upload/", "/upload/f_auto,q_auto,w_120/")}
                                                                alt=""
                                                                loading="lazy"
                                                                className="size-full object-cover"
                                                            />
                                                        ) : (
                                                            <ImageIcon className="size-4 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <Link
                                                            href={`/dashboard/products/${item.id}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="block max-w-72 truncate font-medium hover:underline"
                                                        >
                                                            {item.name}
                                                        </Link>
                                                        <p className="truncate font-mono text-xs text-muted-foreground">
                                                            {[item.styleCode, `${item.variantCount} variant${item.variantCount === 1 ? "" : "s"}`].filter(Boolean).join(" · ")}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {item.category.name}
                                                {item.subCategory && <span className="block text-xs text-muted-foreground">{item.subCategory.name}</span>}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm">
                                                {formatPaise(item.price)}
                                                {item.mrp > item.price && (
                                                    <span className="block text-xs text-muted-foreground">
                                                        <s>{formatPaise(item.mrp)}</s> · {discountPercent(item.price, item.mrp)}%
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className={cn("font-mono text-sm", item.totalStock === 0 && "text-destructive")}>{item.totalStock}</span>
                                                {(item.outOfStockCount > 0 || item.lowStockCount > 0) && (
                                                    <span className="block text-xs">
                                                        {item.outOfStockCount > 0 && <span className="text-destructive">{item.outOfStockCount} out</span>}
                                                        {item.outOfStockCount > 0 && item.lowStockCount > 0 && " · "}
                                                        {item.lowStockCount > 0 && <span className="text-amber-700">{item.lowStockCount} low</span>}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn("rounded-none font-mono text-[10px] tracking-widest uppercase", statusStyles[item.status])}>
                                                    {statusLabels[item.status]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden text-xs text-muted-foreground xl:table-cell">{formatDate(item.updatedAt)}</TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${item.name}`} />}>
                                                        <MoreHorizontalIcon />
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="min-w-44">
                                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/products/${item.id}`)}>
                                                            <PencilIcon />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        {item.status !== "ACTIVE" && (
                                                            <DropdownMenuItem onClick={() => setStatus(item, "ACTIVE")}>
                                                                <ArchiveRestoreIcon />
                                                                Publish
                                                            </DropdownMenuItem>
                                                        )}
                                                        {item.status !== "ARCHIVED" && (
                                                            <DropdownMenuItem onClick={() => setStatus(item, "ARCHIVED")}>
                                                                <ArchiveIcon />
                                                                Archive
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            variant="destructive"
                                                            onClick={() => {
                                                                setToDelete(item);
                                                                setDeleteOpen(true);
                                                            }}
                                                        >
                                                            <Trash2Icon />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {data && data.total > PAGE_SIZE && (
                        <div className="flex items-center justify-between gap-3 text-sm">
                            <p className="text-muted-foreground">
                                {(data.page - 1) * PAGE_SIZE + 1}–{Math.min(data.page * PAGE_SIZE, data.total)} of {data.total}
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled={data.page <= 1} onClick={() => patch({ page: data.page - 1 })}>
                                    Previous
                                </Button>
                                <Button variant="outline" size="sm" disabled={data.page >= pages} onClick={() => patch({ page: data.page + 1 })}>
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {toDelete && (
                <DeleteDialog
                    open={deleteOpen}
                    onOpenChange={setDeleteOpen}
                    title={`Delete ${toDelete.name}?`}
                    description="Deletes the product, its variants, images and stock history. Products that have been ordered can only be archived."
                    onConfirm={async () => {
                        await deleteProduct(toDelete.id);
                        refresh();
                    }}
                />
            )}
        </>
    );
}

function Empty({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center gap-3 border border-dashed px-6 py-14 text-center">
            <PackageIcon className="size-8 text-muted-foreground" />
            <div>
                <p className="font-display text-xl font-black tracking-tight uppercase font-stretch-75%">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
            {action}
        </div>
    );
}
