import { defineConfig } from "tsdown"

export default defineConfig({
  entry: ["src/index.tsx"],
  format: "esm",
  platform: "browser",
  dts: true,
  fixedExtension: false,
})
