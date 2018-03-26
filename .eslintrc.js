module.exports = {
  "extends": [
    "plugin:flowtype/recommended",
    "google",
  ],
  "rules": {
    "max-len": 1,
  },
  "parser": "babel-eslint",
  "plugins": [
    "flowtype"
  ],
  "parserOptions": {
    "ecmaVersion": 6,
    "sourceType" : "module",
  }
};
