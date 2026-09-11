import type { ImageMetadata } from "astro";

type ImageEntry = {
  src: ImageMetadata;
  alt: string;
};

const imageModules = import.meta.glob<ImageMetadata>(
  "/src/assets/*.{jpg,jpeg,png,webp}",
  {
    eager: true,
    import: "default"
  }
);

console.log({ imageModules });
const imageEntries = Object.entries(imageModules);
console.log({ imageEntries });

const images: ImageEntry[] = Object.entries(imageModules)
  .sort(([pathA], [pathB]) =>
    pathA.localeCompare(pathB, undefined, { numeric: true })
  )
  .map(([path, src]) => ({
    src,
    alt:
      path
        .split("/")
        .pop()
        ?.replace(/\.[^.]+$/, "") ?? ""
  }));

export default images;
