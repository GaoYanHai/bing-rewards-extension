export default [
  {
    files: ["*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        chrome: "readonly",
        document: "readonly",
        window: "readonly",
        console: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        location: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        fetch: "readonly",
        URLSearchParams: "readonly",
        $: "readonly",
        importScripts: "readonly",
        globalThis: "readonly",
        Notification: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-empty": "off",
      "no-console": "off",
      "no-undef": "error",
      "no-redeclare": "error",
      eqeqeq: ["warn", "smart"]
    }
  }
];
