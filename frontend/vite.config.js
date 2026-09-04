import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const backend = process.env.VITE_BACKEND_URL || "http://localhost:8080";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/applications": backend,
      "/auth": backend,
      "/companies": backend,
      "/placement-drives": backend,
      "/resumes": backend,
      "/students": backend,
      "/api": backend,
      "/uploads": backend
    }
  }
});
