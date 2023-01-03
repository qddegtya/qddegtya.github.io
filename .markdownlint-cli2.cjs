const options = require("@github/markdownlint-github").init();
module.exports = {
  config: options,
  customRules: ["@github/markdownlint-github"],
};
