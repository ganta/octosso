export default {
  sourceDir: "dist",
  artifactsDir: ".",
  build: {
    filename: "octosso.zip",
    overwriteDest: true,
  },
  run: {
    startUrl: ["https://github.com"],
  },
  ignoreFiles: [".DS_Store"],
};
