"use client";

import { useState } from "react";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { ApiError } from "@/utils/apiError";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type DeleteDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: React.ReactNode;
    onConfirm: () => Promise<void>;
};

export default function DeleteDialog({ open, onOpenChange, title, description, onConfirm }: DeleteDialogProps) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleConfirm() {
        setDeleting(true);
        setError(null);
        try {
            await onConfirm();
            onOpenChange(false);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Could not delete, please try again");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <AlertDialog
            open={open}
            onOpenChange={(next) => {
                if (deleting) return;
                setError(null);
                onOpenChange(next);
            }}
        >
            <AlertDialogContent className="rounded-none">
                <AlertDialogHeader>
                    <AlertDialogMedia className="rounded-none bg-destructive/10 text-destructive">
                        <Trash2Icon />
                    </AlertDialogMedia>
                    <AlertDialogTitle className="font-display text-2xl font-black tracking-tight uppercase font-stretch-75%">
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                {error && (
                    <p role="alert" className="text-sm text-destructive">
                        {error}
                    </p>
                )}
                <AlertDialogFooter className="rounded-none">
                    <AlertDialogCancel disabled={deleting} className="font-mono text-xs tracking-wider uppercase">
                        Cancel
                    </AlertDialogCancel>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={deleting}
                        className="font-mono text-xs tracking-wider uppercase"
                    >
                        {deleting && <Loader2Icon className="animate-spin" />}
                        Delete
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
