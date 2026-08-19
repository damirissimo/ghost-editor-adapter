# Contributing

Contributions should keep the project small, browser-only and compatible with Ghost's current editor-loading contract.

Before opening a pull request:

```bash
npm run check
```

Runtime JavaScript and CSS live directly under `dist/`; there is intentionally no generated/minified copy in the initial release. Keep the entry module and its relative sibling imports deployable from the same directory.

For Ghost compatibility changes, include the upstream Ghost behavior that motivated the change and add or update a regression test where practical.

Do not add commercial editor code, copied Ghost Admin code, credentials, example production tokens, or third-party assets whose redistribution terms are unclear.
