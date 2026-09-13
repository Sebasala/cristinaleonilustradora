import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://cristinaleon.art",

  image: {
    responsiveStyles: true,
    layout: "constrained"
  },

  integrations: [mdx(), sitemap()]
});
