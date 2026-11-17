import { Archivo, Azeret_Mono, GFS_Didot } from "next/font/google";

// Shared by every root layout (storefront and dashboard) so both surfaces use the same type.
export const azeretMono = Azeret_Mono({
    variable: "--font-azeretMono",
    subsets: ["latin"],
});

export const gfsDidot = GFS_Didot({
    variable: "--font-gfsDidot",
    weight: "400",
    subsets: ["latin"],
});

export const archivo = Archivo({
    variable: "--font-archivo",
    axes: ["wdth"],
    subsets: ["latin"],
});

export const fontVariables = `${azeretMono.variable} ${gfsDidot.variable} ${archivo.variable}`;
