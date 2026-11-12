---
name: page-check
description: >-
  Look at a deck, figure, or landing page headlessly: screenshot it, or take a figure's SVG
  export, with Bun's WebView driving Chromium. Use only when the user asks you to look at a
  page or to export a figure (AGENTS.md rule 8); otherwise the user checks in their own browser.
---

# Checking Pages Headlessly

The browser is Bun's `Bun.WebView`, driving the Chromium binary named by `BUN_CHROME_PATH`.

- Each sandboxed command has its own network: the user's server on 8099, or one left running in
  the background, is out of reach. Start a server on port 8100 in the same command that loads
  the pages, and stop it before the command ends.
- Pass `--no-sandbox`: Chromium's own sandbox cannot start inside the agent's.
- `evaluate()` takes one expression, not statements; wrap several in an async arrow function.
- A figure's SVG export is `await view.evaluate("Figure.svgText(document.querySelector('.figure-stage svg'))")`;
  write the string to a file. There is no headless PNG export: screenshot the page, or, for
  transparent edges, draw that SVG onto a canvas in the page and return `canvas.toDataURL()`.
- Write the script and its screenshots to the agent's scratch folder, never into the repo.

```js
// BUN_CHROME_PATH=<chromium> bun check.js /decks/<name>/   (run from the project root)
const server = Bun.spawn(["bun", "run", "core/tools/serve.js"], { env: { ...process.env, PORT: "8100" } });
await Bun.sleep(1000);
const view = new Bun.WebView({ width: 1440, height: 900,
  backend: { type: "chrome", path: process.env.BUN_CHROME_PATH, argv: ["--no-sandbox"] } });
await view.navigate("http://localhost:8100" + process.argv[2]);
await Bun.sleep(2500);   // let figures, MathJax, and apps render
await Bun.write("shot.png", await view.screenshot());
await view.close(); server.kill();
```

Working on the core alone, run the script from the core folder with `tools/serve.js`; pages are
then under `/example/`.

## Installing Chromium

Chromium has to be readable by the sandbox, so not under the home folder. If it is missing, ask
the user to install it once, with the libraries it needs:

```bash
sudo env PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright "$(command -v bun)" x playwright install chromium
sudo apt install libnss3 libnspr4 libasound2t64
```

`BUN_CHROME_PATH` is then
`/opt/ms-playwright/chromium_headless_shell-<version>/chrome-headless-shell-linux64/chrome-headless-shell`.
