"use client";

import { useCallback, useEffect, useState } from "react";
import { LayersIcon, PencilIcon, PlusIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import {
    createCollection,
    deleteCollection,
    fetchCollections,
    toggleCollection,
    updateCollection,
    type Collection,
    type CollectionFormValues,
} from "@/services/operations/collectionAPI";
import { refreshCollections } from "@/lib/actions/collections";
import { errorMessage } from "@/utils/apiError";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import DeleteDialog from "@/components/core/dashboard/categories/DeleteDialog";
import CollectionFormDialog from "./CollectionFormDialog";
import { collectionTypes, type ManagedCollectionType } from "./collection-types";

const isLive = (c: Collection) => c.isActive && (!c.endsAt || new Date(c.endsAt).getTime() > Date.now());

export default function CollectionManager({ type }: { type: ManagedCollectionType }) {
    const config = collectionTypes[type];
    const [items, setItems] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    // Dialog state is kept separately from `open` so content doesn't vanish mid close-animation
    const [editing, setEditing] = useState<{ collection?: Collection } | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [formKey, setFormKey] = useState(0);
    const [toDelete, setToDelete] = useState<Collection | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);

    // The home page caches collections; expire that cache so changes show straight away
    const syncStorefront = useCallback(() => refreshCollections(type).catch(() => {}), [type]);

    const load = useCallback(async () => {
        setLoadError(null);
        try {
            setItems(await fetchCollections(type));
        } catch (error) {
            setLoadError(errorMessage(error, "Could not load collections"));
        } finally {
            setLoading(false);
        }
    }, [type]);

    useEffect(() => {
        let cancelled = false;
        fetchCollections(type)
            .then((data) => !cancelled && setItems(data))
            .catch((error) => !cancelled && setLoadError(errorMessage(error, "Could not load collections")))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [type]);

    function openForm(collection?: Collection) {
        setEditing({ collection });
        setFormKey((k) => k + 1);
        setFormOpen(true);
    }

    async function handleSubmit(values: CollectionFormValues) {
        if (editing?.collection) await updateCollection(editing.collection.id, values);
        else await createCollection(type, values);
        await Promise.all([load(), syncStorefront()]);
    }

    async function handleToggle(id: string, isActive: boolean) {
        const apply = (value: boolean) => setItems((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: value } : c)));
        setActionError(null);
        apply(isActive);
        try {
            await toggleCollection(id, isActive);
            syncStorefront();
        } catch (error) {
            apply(!isActive);
            setActionError(errorMessage(error, "Could not update status"));
        }
    }

    const liveCount = items.filter(isLive).length;

    return (
        <>
            <Card className="rounded-none">
                <CardHeader>
                    <CardTitle className="font-display text-2xl font-black tracking-tight uppercase font-stretch-75%">{config.title}</CardTitle>
                    <CardDescription>
                        {config.description}{" "}
                        {!loading && (liveCount ? `${liveCount} of ${items.length} live, shown in order.` : "Nothing live, so this section is hidden on the home page.")}
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
                            Add {config.noun}
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
                        <Empty title="Couldn't load collections" text={loadError} action={<Button variant="outline" onClick={() => { setLoading(true); load(); }}>Try again</Button>} />
                    ) : loading && !items.length ? (
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className={cn("w-full rounded-none", config.aspect)} />
                            ))}
                        </div>
                    ) : !items.length ? (
                        <Empty
                            title={`No ${config.noun}s yet`}
                            text="This section is hidden on the home page until you add one."
                            action={
                                <Button onClick={() => openForm()}>
                                    <PlusIcon />
                                    Add {config.noun}
                                </Button>
                            }
                        />
                    ) : (
                        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                            {items.map((c) => {
                                const live = isLive(c);
                                const expired = c.isActive && !live;
                                return (
                                    <li key={c.id} className="flex flex-col border bg-card">
                                        <button
                                            type="button"
                                            onClick={() => openForm(c)}
                                            className={cn("group relative isolate flex flex-col justify-end overflow-hidden bg-neutral-800 p-3 text-left", config.aspect)}
                                            aria-label={`Edit ${c.name}`}
                                        >
                                            {c.imageUrl && (
                                                // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL
                                                <img
                                                    src={c.imageUrl.replace("/upload/", "/upload/f_auto,q_auto,w_500/")}
                                                    alt=""
                                                    loading="lazy"
                                                    className="absolute inset-0 -z-20 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            )}
                                            <span className="absolute inset-0 -z-10 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
                                            <span className="absolute top-2 left-2 bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-cream">#{c.sortOrder}</span>
                                            <span className="font-display text-2xl leading-[0.9] font-black text-cream uppercase font-stretch-75%">{c.name}</span>
                                            {config.descriptionField.shownOnCard && c.description && (
                                                <span className="mt-1 font-didot text-sm text-cream italic">{c.description}</span>
                                            )}
                                        </button>
                                        <div className="flex items-center gap-2 p-2">
                                            <Switch size="sm" checked={c.isActive} onCheckedChange={(v) => handleToggle(c.id, v)} aria-label={`${c.name} visible on home page`} />
                                            <Badge
                                                className={cn(
                                                    "rounded-none font-mono text-[10px] tracking-widest uppercase",
                                                    live ? "bg-emerald-100 text-emerald-900" : expired ? "bg-red-100 text-red-900" : "bg-neutral-200 text-neutral-700",
                                                )}
                                            >
                                                {live ? "Live" : expired ? "Ended" : "Hidden"}
                                            </Badge>
                                            <span className="truncate font-mono text-[11px] text-muted-foreground" title="Products in this collection">
                                                {c._count.products} products
                                            </span>
                                            <div className="ml-auto flex">
                                                <Button variant="ghost" size="icon-sm" onClick={() => openForm(c)} aria-label={`Edit ${c.name}`}>
                                                    <PencilIcon />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    aria-label={`Delete ${c.name}`}
                                                    className="text-muted-foreground hover:text-destructive"
                                                    onClick={() => {
                                                        setToDelete(c);
                                                        setDeleteOpen(true);
                                                    }}
                                                >
                                                    <Trash2Icon />
                                                </Button>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </CardContent>
            </Card>

            {editing && (
                <CollectionFormDialog key={formKey} open={formOpen} onOpenChange={setFormOpen} type={type} initial={editing.collection} onSubmit={handleSubmit} />
            )}

            {toDelete && (
                <DeleteDialog
                    open={deleteOpen}
                    onOpenChange={setDeleteOpen}
                    title={`Delete ${toDelete.name}?`}
                    description="The card and its image are removed. The products in it are not affected."
                    onConfirm={async () => {
                        await deleteCollection(toDelete.id);
                        await Promise.all([load(), syncStorefront()]);
                    }}
                />
            )}
        </>
    );
}

function Empty({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center gap-3 border border-dashed px-6 py-12 text-center">
            <LayersIcon className="size-8 text-muted-foreground" />
            <div>
                <p className="font-display text-xl font-black tracking-tight uppercase font-stretch-75%">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
            {action}
        </div>
    );
}
