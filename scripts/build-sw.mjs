import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";

async function listFiles(path, prefix = "") {
  const out = [];
  for (const f of await readdir(path, { withFileTypes: true })) {
    const relative = prefix + f.name;
    if (f.isDirectory())
      out.push(...(await listFiles(join(path, f.name), relative + "/")));
    else if (f.name !== "sw.js") out.push("./" + relative);
  }
  return out;
}
const assets = (await listFiles("dist")).sort();
const digest = createHash("sha256");
for (const file of assets)
  digest.update(await readFile(join("dist", file.slice(2))));
const cache = `mathveo-${digest.digest("hex").slice(0, 16)}`;
const sw = `const CACHE=${JSON.stringify(cache)};
const ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('mathveo-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).catch(()=>caches.open(CACHE).then(cache=>cache.match('./index.html'))));return;
  }
  event.respondWith(caches.open(CACHE).then(cache=>cache.match(event.request)).then(cached=>cached||fetch(event.request)));
});
`;
await writeFile("dist/sw.js", sw);
console.log(
  `PWA: ${assets.length} local assets, ${cache}; YouTube content is never cached.`,
);
