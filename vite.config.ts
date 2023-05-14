import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    host: true,
    port: 3080,
    open: true,
  },
  server: {
    host: true,
    port: 3000,
    open: true,
  },
  css: {
    devSourcemap: true,
  },
});
