"use client";

import { useCallback, useEffect, useState } from "react";
import { ImagesIcon, PencilIcon, PlusIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import { ApiError } from "@/utils/apiError";
import {
    createBanner,
    deleteBanner,
    fetchBanners,
    toggleBanner,
    updateBanner,
    type Banner,
    type BannerFormValues,
} from "@/services/operations/bannerAPI";
import { refreshBanners } from "@/lib/actions/banners";
import { bannerSlots, type SlotPlacement } from "@/lib/banner-slots";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import DeleteDialog from "@/components/core/dashboard/categories/DeleteDialog";
import BannerFormDialog from "./BannerFormDialog";

// "standby": live, but a single-slot placement only shows the first live banner
type Status = "live" | "standby" | "hidden" | "scheduled" | "ended";

function statusOf(banner: Banner, now = Date.now()): Status {
    if (!banner.isActive) return "hidden";
    if (banner.startsAt && new Date(banner.startsAt).getTime() > now) return "scheduled";
    if (banner.endsAt && new Date(banner.endsAt).getTime() <= now) return "ended";
    return "live";
}

const statusStyles: Record<Status, string> = {
    live: "bg-emerald-100 text-emerald-900",
    standby: "bg-sky-100 text-sky-900",
    hidden: "bg-neutral-200 text-neutral-700",
    scheduled: "bg-amber-100 text-amber-900",
    ended: "bg-red-100 text-red-900",
};

const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default function BannerManager({ placement }: { placement: SlotPlacement }) {
    const slot = bannerSlots[placement];
    const noun = slot.carousel ? "slide" : "banner";

    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    // Dialog state is kept separately from `open` so content doesn't vanish mid close-animation
    const [editing, setEditing] = useState<{ banner?: Banner } | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [formKey, setFormKey] = useState(0);
    const [toDelete, setToDelete] = useState<Banner | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);

    // The storefront caches banners; expire that cache so changes show straight away
    const syncStorefront = useCallback(() => refreshBanners(placement).catch(() => {}), [placement]);

    const load = useCallback(async () => {
        setLoadError(null);
        try {
            setBanners(await fetchBanners({ placement }));
        } catch (error) {
            setLoadError(error instanceof ApiError ? error.message : "Could not load banners");
        } finally {
            setLoading(false);
        }
    }, [placement]);

    useEffect(() => {
        let cancelled = false;
        fetchBanners({ placement })
            .then((data) => !cancelled && setBanners(data))
            .catch((error) => {
                if (!cancelled) setLoadError(error instanceof ApiError ? error.message : "Could not load banners");
            })
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [placement]);

    const liveCount = banners.filter((b) => statusOf(b) === "live").length;
    // Banners arrive in display order, so the first live one is what a single slot shows
    const shownId = banners.find((b) => statusOf(b) === "live")?.id;
    const displayStatus = (banner: Banner): Status => {
        const status = statusOf(banner);
        return status === "live" && !slot.carousel && banner.id !== shownId ? "standby" : status;
    };

    function openForm(banner?: Banner) {
        setEditing({ banner });
        setFormKey((k) => k + 1);
        setFormOpen(true);
    }

    async function handleSubmit(values: BannerFormValues) {
        const withItems = Boolean(slot.items);
        if (editing?.banner) await updateBanner(editing.banner.id, values, placement, withItems);
        else await createBanner(values, placement, withItems);
        await Promise.all([load(), syncStorefront()]);
    }

    async function handleDelete() {
        if (!toDelete) return;
        await deleteBanner(toDelete.id);
        await Promise.all([load(), syncStorefront()]);
    }

    // Optimistic toggle, rolled back if the request fails
    async function handleToggle(id: string, isActive: boolean) {
        const apply = (value: boolean) =>
            setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, isActive: value } : b)));
        setActionError(null);
        apply(isActive);
        try {
            await toggleBanner(id, isActive);
            syncStorefront();
        } catch (error) {
            apply(!isActive);
            setActionError(error instanceof ApiError ? error.message : "Could not update status");
        }
    }

    return (
        <>
            <Card className="rounded-none">
                <CardHeader>
                    <CardTitle className="font-display text-2xl font-black tracking-tight uppercase font-stretch-75%">
                        {slot.title}
                    </CardTitle>
                    <CardDescription>
                        {slot.description}{" "}
                        {!loading &&
                            (slot.carousel
                                ? `${liveCount} of ${banners.length} live, shown in slide order.`
                                : liveCount
                                  ? "Only the first live banner is shown; others wait on standby."
                                  : "Nothing live, so this section is hidden on the home page.")}
                    </CardDescription>
                    <CardAction className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon-lg"
                            aria-label="Refresh"
                            onClick={() => {
                                setLoading(true);
                                load();
                            }}
                        >
                            <RefreshCwIcon className={cn(loading && "animate-spin")} />
                        </Button>
                        <Button size="lg" onClick={() => openForm()} className="font-mono text-xs tracking-wider uppercase">
                            <PlusIcon />
                            Add {noun}
                        </Button>
                    </CardAction>
                </CardHeader>

                <CardContent className="space-y-4">
                    {actionError && (
                        <p role="alert" className="border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                            {actionError}
                        </p>
                    )}

                    {loadError ? (
                        <EmptyState
                            title="Couldn't load banners"
                            text={loadError}
                            action={
                                <Button variant="outline" onClick={() => { setLoading(true); load(); }}>
                                    Try again
                                </Button>
                            }
                        />
                    ) : loading && !banners.length ? (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="aspect-[16/9] w-full rounded-none" />
                            ))}
                        </div>
                    ) : !banners.length ? (
                        <EmptyState
                            title={`No ${noun}s yet`}
                            text="This section is hidden on the home page until you add a live one."
                            action={
                                <Button onClick={() => openForm()}>
                                    <PlusIcon />
                                    Add {noun}
                                </Button>
                            }
                        />
                    ) : (
                        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {banners.map((banner) => (
                                <BannerCard
                                    key={banner.id}
                                    banner={banner}
                                    status={displayStatus(banner)}
                                    onEdit={() => openForm(banner)}
                                    onDelete={() => {
                                        setToDelete(banner);
                                        setDeleteOpen(true);
                                    }}
                                    onToggle={(v) => handleToggle(banner.id, v)}
                                />
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            {editing && (
                <BannerFormDialog
                    key={formKey}
                    open={formOpen}
                    onOpenChange={setFormOpen}
                    placement={placement}
                    initial={editing.banner}
                    onSubmit={handleSubmit}
                />
            )}

            {toDelete && (
                <DeleteDialog
                    open={deleteOpen}
                    onOpenChange={setDeleteOpen}
                    title={`Delete “${toDelete.title.replace(/\n/g, " ")}”?`}
                    description="The banner and its images will be permanently removed. This can't be undone."
                    onConfirm={handleDelete}
                />
            )}
        </>
    );
}

function BannerCard({
    banner,
    status,
    onEdit,
    onDelete,
    onToggle,
}: {
    banner: Banner;
    status: Status;
    onEdit: () => void;
    onDelete: () => void;
    onToggle: (isActive: boolean) => void;
}) {
    const name = banner.title.replace(/\n/g, " ");
    const offer = [banner.subtitle, banner.highlight].filter(Boolean).join(" ");

    return (
        <li className="flex flex-col border bg-card">
            <div
                style={{ backgroundColor: banner.backgroundColor ?? undefined }}
                className="relative isolate flex aspect-[16/9] flex-col justify-end overflow-hidden bg-neutral-900 p-3"
            >
                {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL */}
                <img
                    src={banner.imageUrl}
                    alt=""
                    loading="lazy"
                    // Cut-out photos (with a backdrop colour) are shown whole; photos fill the card
                    className={cn("absolute inset-0 -z-20 size-full", banner.backgroundColor ? "object-contain" : "object-cover")}
                />
                <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
                <span className="absolute top-2 left-2 bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-cream">
                    #{banner.sortOrder}
                </span>
                {banner.subtitle && (
                    <p className="truncate font-mono text-[10px] tracking-[0.15em] text-cream/90 uppercase">{banner.subtitle}</p>
                )}
                <p className="line-clamp-2 font-display text-2xl leading-none font-black tracking-tight text-cream uppercase font-stretch-75%">
                    {name}
                </p>
            </div>

            <div className="flex flex-1 flex-col gap-3 p-3">
                <dl className="grid gap-1 text-xs">
                    {offer && (
                        <div className="flex gap-2">
                            <dt className="w-14 shrink-0 text-muted-foreground">Offer</dt>
                            <dd className="truncate">{offer}</dd>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <dt className="w-14 shrink-0 text-muted-foreground">{banner.items?.length ? "Cards" : "Link"}</dt>
                        <dd className="min-w-0 truncate">
                            {banner.items?.length ? (
                                banner.items.map((card) => `${card.label} ${card.value}`).join(" · ")
                            ) : banner.linkUrl ? (
                                <>
                                    {banner.ctaLabel && `${banner.ctaLabel} `}
                                    <span className="font-mono text-muted-foreground">→ {banner.linkUrl}</span>
                                </>
                            ) : (
                                <span className="text-muted-foreground">None</span>
                            )}
                        </dd>
                    </div>
                    <div className="flex gap-2">
                        <dt className="w-14 shrink-0 text-muted-foreground">Runs</dt>
                        <dd className="truncate">
                            {banner.startsAt || banner.endsAt
                                ? `${banner.startsAt ? formatDate(banner.startsAt) : "Now"} – ${banner.endsAt ? formatDate(banner.endsAt) : "no end"}`
                                : "Always"}
                        </dd>
                    </div>
                    {banner.mobileImageUrl && (
                        <div className="flex gap-2">
                            <dt className="w-14 shrink-0 text-muted-foreground">Mobile</dt>
                            <dd>Own image</dd>
                        </div>
                    )}
                </dl>

                <div className="mt-auto flex items-center gap-2 border-t pt-3">
                    <Switch size="sm" checked={banner.isActive} onCheckedChange={onToggle} aria-label={`${name} visible in store`} />
                    <Badge className={cn("rounded-none font-mono text-[10px] tracking-widest uppercase", statusStyles[status])}>
                        {status}
                    </Badge>
                    <div className="ml-auto flex">
                        <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label={`Edit ${name}`}>
                            <PencilIcon />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={onDelete}
                            aria-label={`Delete ${name}`}
                            className="text-muted-foreground hover:text-destructive"
                        >
                            <Trash2Icon />
                        </Button>
                    </div>
                </div>
            </div>
        </li>
    );
}

function EmptyState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center gap-3 border border-dashed px-6 py-12 text-center">
            <ImagesIcon className="size-8 text-muted-foreground" />
            <div>
                <p className="font-display text-xl font-black tracking-tight uppercase font-stretch-75%">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
            {action}
        </div>
    );
}
