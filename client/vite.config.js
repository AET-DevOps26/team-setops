import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
	},
	esbuild: {
		jsx: "automatic",
		jsxImportSource: "react",
	},
	server: {
		allowedHosts: [".stud.k8s.aet.cit.tum.de"],
		proxy: {
			"/api/v1/logs": {
				target: "http://localhost:8080",
				changeOrigin: true,
			},
			"/api/v1/alerts": {
				target: "http://localhost:8080",
				changeOrigin: true,
			},
			"/api/v1/incidents": {
				target: "http://localhost:8080",
				changeOrigin: true,
			},
			"/api/v1/analyze": {
				target: "http://localhost:8080",
				changeOrigin: true,
			},
			"/api/v1/rag": {
				target: "http://localhost:8080",
				changeOrigin: true,
			},
			"/health": {
				target: "http://localhost:8080",
				changeOrigin: true,
			},
		},
	},
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: "./src/test/setup.js",
	},
});
