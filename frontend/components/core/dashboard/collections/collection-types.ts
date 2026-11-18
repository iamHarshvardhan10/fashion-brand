import type { CollectionType } from "@/services/operations/collectionAPI";

// How each home page section uses a collection. Drives the dashboard tabs, form and previews.
export type CollectionTypeConfig = {
    tab: string;
    title: string;
    description: string;
    noun: string;
    aspect: string; // card shape on the home page
    imageHint: string;
    descriptionField: { label: string; hint: string; placeholder: string; max: number; shownOnCard: boolean };
    urlPrefix: string;
};

export const collectionTypes: Record<Exclude<CollectionType, "DROP">, CollectionTypeConfig> = {
    EDIT: {
        tab: "Edits",
        title: "Home page edits",
        description: "The tall cards under the bestsellers banner, three per row: a title, a tagline and an Explore link.",
        noun: "edit",
        aspect: "aspect-[3/4]",
        imageHint: "Portrait, about 1200×1600",
        descriptionField: {
            label: "Tagline",
            hint: "One short line under the title",
            placeholder: "e.g. Layers that mean business",
            max: 80,
            shownOnCard: true,
        },
        urlPrefix: "/collections/",
    },
    VIBE: {
        tab: "Vibes",
        title: "Shop by vibe",
        description: "The landscape tiles in the “Shop by vibe” grid, three per row on desktop and two on mobile.",
        noun: "vibe",
        aspect: "aspect-[4/3]",
        imageHint: "Landscape, about 1200×900",
        descriptionField: {
            label: "Description",
            hint: "Not on the tile; shown at the top of the vibe's page",
            placeholder: "e.g. Easy fits for slow Saturdays",
            max: 300,
            shownOnCard: false,
        },
        urlPrefix: "/vibes/",
    },
};

export type ManagedCollectionType = keyof typeof collectionTypes;
export const managedCollectionTypes = Object.keys(collectionTypes) as ManagedCollectionType[];
