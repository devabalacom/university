// @ts-check
import { defineConfig } from 'astro/config';

// Defaults build for GitHub Pages (devabalacom.github.io/university/).
// The hosting deploy overrides both: SITE_URL=http://<ip or domain>, BASE_PATH=/.
// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || 'https://devabalacom.github.io',
  base: process.env.BASE_PATH || '/university',
});
