"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, ImagePlusIcon, Loader2Icon, StarIcon, Trash2Icon } from "lucide-react";
import {
    deleteProductImage,
    reorderProductImages,
    updateProductImage,
    uploadProductImages,
    type ProductImage,
} from "@/services/operations/productAPI";
import { IMAGE_UPLOAD } from "@/utils/constants";
import { errorMessage } from "@/utils/apiError";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "./fields";

export const MAX_IMAGES = 15;

// Images picked before the product exists; uploaded right after it's created
export type LocalImage = { key: string; file: File; preview: string; color: string; alt: string };

type Tile = { key: string; src: string; color: string; alt: string };

type ImagesManagerProps = {
    colours: string[]; // variant colours an image can be tagged with
    productName: string;
} & (
    | { mode: "local"; items: LocalImage[]; onItemsChange: (items: LocalImage[]) => void }
    | { mode: "remote"; productId: string; images: ProductImage[]; onImagesChange: (images: ProductImage[]) => void }
);

let seq = 0;

export default function ImagesManager(props: ImagesManagerProps) {
    const { colours, productName } = props;
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const tiles: Tile[] =
        props.mode === "local"
            ? props.items.map((i) => ({ key: i.key, src: i.preview, color: i.color, alt: i.alt }))
            : props.images.map((img) => ({ key: img.id, src: img.url, color: img.color ?? "", alt: img.alt ?? "" }));

    // Revoke local previews when the component goes away
    const localRef = useRef<LocalImage[]>([]);
    const localItems = props.mode === "local" ? props.items : null;
    useEffect(() => {
        localRef.current = localItems ?? [];
    }, [localItems]);
    useEffect(() => () => localRef.current.forEach((i) => URL.revokeObjectURL(i.preview)), []);

    async function run(label: string, action: () => Promise<void>) {
        setBusy(label);
        setError(null);
        try {
            await action();
        } catch (err) {
            setError(errorMessage(err, "Could not update images"));
        } finally {
            setBusy(null);
        }
    }

    function addFiles(list: FileList | File[]) {
        const files = [...list];
        const room = MAX_IMAGES - tiles.length;
        const valid = files.filter((f) => IMAGE_UPLOAD.types.includes(f.type) && f.size <= IMAGE_UPLOAD.maxMb * 1024 * 1024);
        const skipped = files.length - valid.length;
        const accepted = valid.slice(0, Math.max(room, 0));
        const notes = [
            skipped && `${skipped} file${skipped === 1 ? "" : "s"} skipped (JPG/PNG/WEBP/AVIF up to ${IMAGE_UPLOAD.maxMb} MB)`,
            valid.length > accepted.length && `Only ${MAX_IMAGES} images allowed per product`,
        ].filter(Boolean);
        setError(notes.length ? notes.join(". ") : null);
        if (!accepted.length) return;

        if (props.mode === "local") {
            props.onItemsChange([
                ...props.items,
                ...accepted.map((file) => ({ key: `img${++seq}`, file, preview: URL.createObjectURL(file), color: "", alt: "" })),
            ]);
            return;
        }
        const { productId, onImagesChange } = props;
        // The API takes 10 files per request
        run("upload", async () => {
            let latest: ProductImage[] = [];
            for (let i = 0; i < accepted.length; i += 10) {
                latest = await uploadProductImages(productId, accepted.slice(i, i + 10).map((file) => ({ file })));
            }
            onImagesChange(latest);
            if (notes.length) setError(notes.join(". "));
        });
    }

    function move(index: number, delta: number) {
        const target = index + delta;
        if (target < 0 || target >= tiles.length) return;
        const swap = <T,>(list: T[]) => {
            const next = [...list];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        };
        if (props.mode === "local") return props.onItemsChange(swap(props.items));
        saveOrder(swap(props.images));
    }

    // Optimistic reorder, rolled back if the request fails
    function saveOrder(next: ProductImage[]) {
        if (props.mode !== "remote") return;
        const { productId, images, onImagesChange } = props;
        onImagesChange(next);
        run("order", async () => {
            try {
                onImagesChange(await reorderProductImages(productId, next.map((i) => i.id)));
            } catch (err) {
                onImagesChange(images);
                throw err;
            }
        });
    }

    function makeMain(index: number) {
        if (index === 0) return;
        if (props.mode === "local") {
            const next = [...props.items];
            next.unshift(...next.splice(index, 1));
            return props.onItemsChange(next);
        }
        const next = [...props.images];
        next.unshift(...next.splice(index, 1));
        saveOrder(next);
    }

    function remove(index: number) {
        if (props.mode === "local") {
            URL.revokeObjectURL(props.items[index].preview);
            return props.onItemsChange(props.items.filter((_, i) => i !== index));
        }
        const { productId, images, onImagesChange } = props;
        run(`remove-${images[index].id}`, async () => onImagesChange(await deleteProductImage(productId, images[index].id)));
    }

    function edit(index: number, patch: { color?: string; alt?: string }, persist: boolean) {
        if (props.mode === "local") {
            return props.onItemsChange(props.items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
        }
        const { productId, images, onImagesChange } = props;
        const image = images[index];
        const next = { color: patch.color ?? image.color, alt: patch.alt ?? image.alt };
        onImagesChange(images.map((img, i) => (i === index ? { ...img, ...next } : img)));
        if (persist) {
            run(`edit-${image.id}`, async () =>
                onImagesChange(await updateProductImage(productId, image.id, { color: next.color || null, alt: next.alt || null })),
            );
        }
    }

    return (
        <div className="grid gap-3">
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    addFiles(e.dataTransfer.files);
                }}
                className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4", dragging && "outline-2 outline-offset-4 outline-dashed outline-foreground/40")}
            >
                {tiles.map((tile, i) => (
                    <figure key={tile.key} className="group flex flex-col border bg-card">
                        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element -- blob/Cloudinary preview */}
                            <img src={tile.src} alt={tile.alt} className="size-full object-cover" />
                            {i === 0 && (
                                <span className="absolute top-1.5 left-1.5 bg-foreground px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-background uppercase">
                                    Main
                                </span>
                            )}
                            {busy === `remove-${tile.key}` && (
                                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                                    <Loader2Icon className="animate-spin" />
                                </div>
                            )}
                            <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between opacity-100 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
                                <div className="flex gap-1">
                                    <TileButton label="Move left" disabled={i === 0 || Boolean(busy)} onClick={() => move(i, -1)}>
                                        <ArrowLeftIcon />
                                    </TileButton>
                                    <TileButton label="Move right" disabled={i === tiles.length - 1 || Boolean(busy)} onClick={() => move(i, 1)}>
                                        <ArrowRightIcon />
                                    </TileButton>
                                    {i > 0 && (
                                        <TileButton label="Make main image" disabled={Boolean(busy)} onClick={() => makeMain(i)}>
                                            <StarIcon />
                                        </TileButton>
                                    )}
                                </div>
                                <TileButton label="Remove image" disabled={Boolean(busy)} onClick={() => remove(i)} destructive>
                                    <Trash2Icon />
                                </TileButton>
                            </div>
                        </div>
                        <figcaption className="grid gap-1.5 p-1.5">
                            <NativeSelect
                                value={tile.color}
                                onChange={(e) => edit(i, { color: e.target.value }, true)}
                                aria-label="Show for colour"
                                className="h-7 text-xs"
                            >
                                <option value="">All colours</option>
                                {[...new Set([...colours, tile.color].filter(Boolean))].map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </NativeSelect>
                            <Input
                                value={tile.alt}
                                maxLength={150}
                                placeholder={productName || "Alt text"}
                                aria-label="Alt text"
                                onChange={(e) => edit(i, { alt: e.target.value }, false)}
                                onBlur={(e) => props.mode === "remote" && edit(i, { alt: e.target.value }, true)}
                                className="h-7 text-xs"
                            />
                        </figcaption>
                    </figure>
                ))}

                {tiles.length < MAX_IMAGES && (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={busy === "upload"}
                        className="flex aspect-[3/4] flex-col items-center justify-center gap-2 border border-dashed text-muted-foreground transition-colors hover:border-foreground/50 hover:text-foreground"
                    >
                        {busy === "upload" ? <Loader2Icon className="animate-spin" /> : <ImagePlusIcon className="size-6" />}
                        <span className="px-2 text-center text-xs">{busy === "upload" ? "Uploading…" : "Add images or drop them here"}</span>
                    </button>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                multiple
                accept={IMAGE_UPLOAD.types.join(",")}
                className="sr-only"
                onChange={(e) => {
                    if (e.target.files) addFiles(e.target.files);
                    e.target.value = "";
                }}
            />

            {error && (
                <p role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            )}
            <p className="text-xs text-muted-foreground">
                {tiles.length}/{MAX_IMAGES} images · 3:4 portrait works best (e.g. 1200×1600). The first image is the main one on listings.
                Tag an image with a colour to show it only when that colour is selected.
                {props.mode === "remote" ? " Image changes save immediately." : " Images upload when you create the product."}
            </p>
        </div>
    );
}

function TileButton({
    label,
    onClick,
    disabled,
    destructive,
    children,
}: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    destructive?: boolean;
    children: React.ReactNode;
}) {
    return (
        <Button
            type="button"
            size="icon-xs"
            variant="secondary"
            aria-label={label}
            title={label}
            disabled={disabled}
            onClick={onClick}
            className={cn("bg-background/90 shadow-sm", destructive && "hover:text-destructive")}
        >
            {children}
        </Button>
    );
}
