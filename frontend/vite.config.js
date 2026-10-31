import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // in dev the API runs on :3001; proxying keeps requests same-origin like the Docker build
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
