require("@babel/register")({
  presets: ["@babel/preset-env", ["@babel/preset-react", { runtime: "automatic" }], "@babel/preset-typescript"],
  extensions: [".js", ".jsx", ".ts", ".tsx"],
  plugins: ["@babel/plugin-transform-modules-commonjs"]
});
const React = require("react");
const ReactDOMServer = require("react-dom/server");

// mock next router / next navigation etc if needed
require("module-alias/register"); // We might need to alias @ to src

// Actually, simpler: let's just write a Node script that requires ToolExecutor and logs all its imported components
// to see if any are undefined.
