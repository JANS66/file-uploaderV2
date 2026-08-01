import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    allowedHosts: true, // Accepts external proxy hosts like Pinggy
    proxy: {
      "/api": {
        target: "http://localhost:5000", // Express backend port
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
