/** The Cloudflare plugin supplies the worker entry point and the dev server. */
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [cloudflare()],
});
