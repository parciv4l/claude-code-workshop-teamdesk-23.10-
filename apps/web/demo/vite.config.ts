// Static, browser-only build of Teamdesk for hosting as a demo. The real
// router, services and query functions run in the page against sql.js.
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  base: "./",
  build: { assetsInlineLimit: 0, emptyOutDir: true, outDir: here("./dist") },
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  plugins: [
    tailwindcss(),
    viteReact(),
    {
      // tRPC refuses to build a router in the browser unless told to.
      enforce: "pre",
      name: "trpc-in-browser",
      transform(code, id) {
        if (id.endsWith("/server/trpc/init.ts")) {
          return code.replace(
            "initTRPC.context<Context>().create({",
            "initTRPC.context<Context>().create({ allowOutsideOfServer: true,"
          );
        }
      },
    },
  ],
  resolve: {
    alias: [
      {
        find: "#/integrations/trpc/client",
        replacement: here("./trpc-client.ts"),
      },
      { find: "cloudflare:workers", replacement: here("./cf-stub.ts") },
      { find: /^#\/(.*)$/, replacement: `${here("../src/")}$1` },
    ],
  },
  root: here("."),
});
