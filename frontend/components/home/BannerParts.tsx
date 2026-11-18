import { Fragment } from "react";
import Link from "next/link";

// Whole-banner link; falls back to a plain block when the banner has no link
export function BannerLink({
    href,
    className,
    style,
    children,
}: {
    href: string | null;
    className?: string;
    style?: React.CSSProperties;
    children: React.ReactNode;
}) {
    if (!href) return <div className={className} style={style}>{children}</div>;
    return (
        <Link href={href} className={className} style={style}>
            {children}
        </Link>
    );
}

// Renders a headline, breaking where the editor pressed Enter
export function Lines({ text }: { text: string }) {
    return text.split("\n").map((line, i) => (
        <Fragment key={i}>
            {i > 0 && <br />}
            {line}
        </Fragment>
    ));
}
