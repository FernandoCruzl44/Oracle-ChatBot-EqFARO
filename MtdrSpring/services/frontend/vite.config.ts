import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  return {
    base: "/",
    plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
    server: {
      port: 3000,
      proxy: {
        "/debug": {
          target: "http://localhost:4000",
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 8080,
    },
  };
});
