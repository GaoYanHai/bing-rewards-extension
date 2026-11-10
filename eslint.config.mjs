export default [
  {
    files: ["*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        chrome: "readonly",
        document: "readonly",
        window: "readonly",
        console: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        location: "readonly",
        history: "readonly",
        navigator: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        fetch: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        Blob: "readonly",
        Event: "readonly",
        screen: "readonly",
        getComputedStyle: "readonly",
        IntersectionObserver: "readonly",
        MutationObserver: "readonly",
        FileReader: "readonly",
        Image: "readonly",
        HTMLInputElement: "readonly",
        HTMLTextAreaElement: "readonly",
        $: "readonly",
        importScripts: "readonly",
        globalThis: "readonly",
        Notification: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
      "no-empty": "off",
      "no-console": "off",
      "no-undef": "error",
      "no-redeclare": "error",
      eqeqeq: ["warn", "smart"]
    }
  },
  {
    files: ["background.js", "content.js", "popup.js", "options.js"],
    languageOptions: {
      globals: {
        BingAssistant: "readonly"
      }
    }
  }
];
