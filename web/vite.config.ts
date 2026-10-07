import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // The browser calls /api on the same origin; Vite forwards it to the backend.
    proxy: { "/api": "http://localhost:3001" },
  },
});
