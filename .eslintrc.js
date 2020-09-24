module.exports = {
  "root": true,
  "env": {
    "node": true
  },
  "extends": [
    "plugin:vue/essential",
    "eslint:recommended",
    "@vue/typescript"
  ],
  "globals": {
    "Keycloak": true,
  },
  "rules": {
    "no-console": "off",
    "no-irregular-whitespace": "off"
  },
  "parserOptions": {
    "parser": "@typescript-eslint/parser"
  },
  "rules": {
    "no-async-promise-executor": 0,
  }
}