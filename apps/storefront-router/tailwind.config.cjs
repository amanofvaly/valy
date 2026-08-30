const current = require("./tailwind.base.cjs")

module.exports = {
  ...current,
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./app/legacy/modules/**/*.{js,ts,jsx,tsx}",
    "./app/legacy/lib/**/*.{js,ts,jsx,tsx}",
  ],
}
