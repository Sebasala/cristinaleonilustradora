import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://cristinaleonilustradora.com/",
  image: {
    responsiveStyles: true,
    layout: "constrained"
  }
});
