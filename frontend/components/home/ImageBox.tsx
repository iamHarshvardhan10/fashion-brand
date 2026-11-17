import { cn } from "@/lib/utils";

type ImageBoxProps = {
    src: string;
    alt: string;
    className?: string;
    children?: React.ReactNode;
};

// Background-image slot with a neutral fallback, so the layout holds up before real photos are added.
// TODO: switch to next/image once the catalogue images are in place.
export default function ImageBox({ src, alt, className, children }: ImageBoxProps) {
    return (
        <div
            role="img"
            aria-label={alt}
            className={cn("relative overflow-hidden bg-neutral-200 bg-cover bg-center", className)}
            style={{ backgroundImage: `url(${src})` }}
        >
            {children}
        </div>
    );
}
