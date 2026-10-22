// Folds the demo build into one self-contained HTML page, demo/dist/teamdesk-demo.html,
// for hosts that serve a single file (Claude artifacts, a Gist, an email attachment).
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dist = join(import.meta.dir, "dist");
const assets = join(dist, "assets");
const read = (ext: string) => {
  const file = readdirSync(assets).find((name) => name.endsWith(ext));
  if (!file) {
    throw new Error(`No ${ext} file in ${assets}; run vite build first.`);
  }
  return readFileSync(join(assets, file), "utf8");
};

const FONTS =
  "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300..700&family=Newsreader:opsz,wght@6..72,300..600&display=swap";

// The fonts load from a <link>; an @import inside an inline <style> is often blocked.
const css = read(".css").replace(
  /@import\s*(url\()?"[^"]*fonts\.googleapis[^"]*"\)?;?/,
  ""
);
const js = read(".js").replace(/<\/(script)/gi, "<\\/$1");
// Same script as THEME_INIT_SCRIPT in src/routes/__root.tsx: sets the theme
// class before first paint so a dark-mode viewer never sees a light flash.
const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){document.documentElement.classList.add('light')}})();`;

const html = `<title>Teamdesk Demo</title>
<link rel="stylesheet" href="${FONTS}">
<script>${THEME_INIT_SCRIPT}</script>
<style>${css}
body{display:flex;flex-direction:column;min-height:100dvh}
</style>
<div id="app" class="flex min-h-dvh flex-col font-sans antialiased [overflow-wrap:anywhere] selection:bg-primary/30"></div>
<script type="module">${js}</script>
`;

writeFileSync(join(dist, "teamdesk-demo.html"), html);
console.log(
  `Wrote ${join(dist, "teamdesk-demo.html")} (${(html.length / 1024).toFixed(0)} kB)`
);
