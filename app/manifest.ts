import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FIXIHUB — Publisher & Reader",
    short_name: "FIXIHUB",
    description: "Books, preorders, and your reading life in one place.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f7f5",
    theme_color: "#111111",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
