"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { ChevronLeftIcon, ChevronRightIcon, MinusIcon, PlusIcon, XIcon, ZoomInIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ImageBox from "@/components/home/ImageBox";

const ZOOM_LEVELS = [1, 2, 3];

type ProductGalleryProps = {
    images: string[];
    name: string;
};

export default function ProductGallery({ images, name }: ProductGalleryProps) {
    const [open, setOpen] = useState(false);
    const [index, setIndex] = useState(0);
    const [mobileIndex, setMobileIndex] = useState(0);
    const scrollerRef = useRef<HTMLDivElement>(null);

    const openAt = (i: number) => {
        setIndex(i);
        setOpen(true);
    };

    // Keep the mobile dots in sync with the swipe position
    const onScroll = () => {
        const el = scrollerRef.current;
        if (!el) return;
        setMobileIndex(Math.round(el.scrollLeft / el.clientWidth));
    };

    return (
        <>
            {/* Mobile: swipeable strip */}
            <div className="md:hidden">
                <div
                    ref={scrollerRef}
                    onScroll={onScroll}
                    className="-mx-4 flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
                >
                    {images.map((src, i) => (
                        <button
                            key={`${src}-${i}`}
                            type="button"
                            onClick={() => openAt(i)}
                            aria-label={`Open image ${i + 1} of ${images.length}`}
                            className="w-full shrink-0 snap-center"
                        >
                            <ImageBox src={src} alt={`${name}, image ${i + 1}`} className="aspect-[3/4] bg-neutral-100" />
                        </button>
                    ))}
                </div>
                <div className="mt-3 flex justify-center gap-1.5">
                    {images.map((src, i) => (
                        <span
                            key={`${src}-dot-${i}`}
                            className={cn(
                                "h-1 rounded-full transition-all",
                                i === mobileIndex ? "w-5 bg-neutral-950" : "w-1.5 bg-neutral-300"
                            )}
                        />
                    ))}
                </div>
            </div>

            {/* Desktop: two-column grid */}
            <div className="hidden grid-cols-2 gap-2 md:grid">
                {images.map((src, i) => (
                    <button
                        key={`${src}-${i}`}
                        type="button"
                        onClick={() => openAt(i)}
                        aria-label={`Open image ${i + 1} of ${images.length}`}
                        className="group relative cursor-zoom-in overflow-hidden"
                    >
                        <ImageBox
                            src={src}
                            alt={`${name}, image ${i + 1}`}
                            className="aspect-[3/4] bg-neutral-100 transition-transform duration-700 group-hover:scale-[1.04]"
                        />
                        <span className="absolute right-3 bottom-3 flex size-9 items-center justify-center rounded-full bg-white/85 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                            <ZoomInIcon className="size-4" />
                        </span>
                    </button>
                ))}
            </div>

            <Lightbox images={images} name={name} open={open} onOpenChange={setOpen} index={index} setIndex={setIndex} />
        </>
    );
}

type LightboxProps = {
    images: string[];
    name: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    index: number;
    setIndex: (i: number) => void;
};

function Lightbox({ images, name, open, onOpenChange, index, setIndex }: LightboxProps) {
    const [zoom, setZoom] = useState(1);
    const [origin, setOrigin] = useState({ x: 50, y: 50 });
    const stageRef = useRef<HTMLDivElement>(null);

    const go = useCallback(
        (delta: number) => {
            setIndex((index + delta + images.length) % images.length);
            setZoom(1);
            setOrigin({ x: 50, y: 50 });
        },
        [index, images.length, setIndex]
    );

    const stepZoom = useCallback((dir: 1 | -1) => {
        setZoom((z) => {
            const i = ZOOM_LEVELS.indexOf(z);
            return ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, Math.max(0, i + dir))];
        });
    }, []);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") go(1);
            else if (e.key === "ArrowLeft") go(-1);
            else if (e.key === "+" || e.key === "=") stepZoom(1);
            else if (e.key === "-") stepZoom(-1);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, go, stepZoom]);

    // Pan follows the pointer: mouse hover on desktop, finger drag on touch
    const updateOrigin = (e: React.PointerEvent) => {
        if (zoom === 1) return;
        if (e.pointerType !== "mouse" && e.buttons === 0) return;
        const rect = stageRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setOrigin({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) });
    };

    const toggleZoom = (e: React.MouseEvent) => {
        const rect = stageRef.current?.getBoundingClientRect();
        if (rect) {
            setOrigin({
                x: ((e.clientX - rect.left) / rect.width) * 100,
                y: ((e.clientY - rect.top) / rect.height) * 100,
            });
        }
        setZoom((z) => (z === 1 ? 2 : 1));
    };

    const src = images[index];

    return (
        <Dialog.Root
            open={open}
            onOpenChange={(next) => {
                // Start each viewing session un-zoomed
                if (!next) {
                    setZoom(1);
                    setOrigin({ x: 50, y: 50 });
                }
                onOpenChange(next);
            }}
        >
            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-50 bg-neutral-950/70 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
                <Dialog.Popup className="fixed inset-0 z-50 flex flex-col bg-white transition duration-200 outline-none data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 md:inset-6 md:shadow-2xl">
                    {/* Top bar */}
                    <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
                        <Dialog.Title className="truncate font-mono text-xs tracking-[0.2em] uppercase">
                            {name}
                            <span className="ml-3 text-neutral-500">
                                {index + 1} / {images.length}
                            </span>
                        </Dialog.Title>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon-lg"
                                aria-label="Zoom out"
                                disabled={zoom === ZOOM_LEVELS[0]}
                                onClick={() => stepZoom(-1)}
                            >
                                <MinusIcon className="size-4" />
                            </Button>
                            <span className="w-10 text-center font-mono text-xs tabular-nums">{zoom}x</span>
                            <Button
                                variant="ghost"
                                size="icon-lg"
                                aria-label="Zoom in"
                                disabled={zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
                                onClick={() => stepZoom(1)}
                            >
                                <PlusIcon className="size-4" />
                            </Button>
                            <Dialog.Close
                                render={<Button variant="ghost" size="icon-lg" aria-label="Close" className="ml-2" />}
                            >
                                <XIcon className="size-5" />
                            </Dialog.Close>
                        </div>
                    </div>

                    <div className="flex min-h-0 flex-1">
                        {/* Thumbnails */}
                        <ul className="hidden w-24 shrink-0 flex-col gap-2 overflow-y-auto border-r p-3 md:flex [scrollbar-width:thin]">
                            {images.map((thumb, i) => (
                                <li key={`${thumb}-thumb-${i}`}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIndex(i);
                                            setZoom(1);
                                        }}
                                        aria-label={`Show image ${i + 1}`}
                                        aria-current={i === index}
                                        className={cn(
                                            "block w-full border-2 transition-colors",
                                            i === index ? "border-neutral-950" : "border-transparent hover:border-neutral-300"
                                        )}
                                    >
                                        <ImageBox src={thumb} alt="" className="aspect-[3/4] bg-neutral-100" />
                                    </button>
                                </li>
                            ))}
                        </ul>

                        {/* Stage */}
                        <div className="relative flex min-w-0 flex-1 items-center justify-center bg-neutral-50">
                            <div
                                ref={stageRef}
                                onClick={toggleZoom}
                                onPointerMove={updateOrigin}
                                onPointerDown={updateOrigin}
                                className={cn(
                                    "relative h-full max-h-full aspect-[3/4] max-w-full overflow-hidden select-none",
                                    zoom === 1 ? "cursor-zoom-in" : "cursor-zoom-out touch-none"
                                )}
                            >
                                <div
                                    role="img"
                                    aria-label={`${name}, image ${index + 1}`}
                                    className="absolute inset-0 bg-neutral-200 bg-contain bg-center bg-no-repeat transition-transform duration-200 ease-out"
                                    style={{
                                        backgroundImage: `url(${src})`,
                                        transform: `scale(${zoom})`,
                                        transformOrigin: `${origin.x}% ${origin.y}%`,
                                    }}
                                />
                            </div>

                            {zoom === 1 && (
                                <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 bg-neutral-950/80 px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] text-cream uppercase">
                                    Click or tap to zoom
                                </p>
                            )}

                            <Button
                                variant="outline"
                                size="icon-lg"
                                aria-label="Previous image"
                                onClick={() => go(-1)}
                                className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-white/90"
                            >
                                <ChevronLeftIcon className="size-5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon-lg"
                                aria-label="Next image"
                                onClick={() => go(1)}
                                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-white/90"
                            >
                                <ChevronRightIcon className="size-5" />
                            </Button>
                        </div>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
