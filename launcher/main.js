const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path'), fs = require('fs'), crypto = require('crypto');
const { Client, Authenticator } = require('minecraft-launcher-core');
const { Auth } = require('msmc');
const extract = require('extract-zip');
const { autoUpdater } = require('electron-updater');

// %APPDATA%\LimeVisuals  (= userData, как у MekiksClient на видео)
const ROOT = app.getPath('userData');
const GAME = path.join(ROOT, 'game'), RUNTIME = path.join(ROOT, 'runtime'), LOGS = path.join(ROOT, 'logs');
const CFG = path.join(ROOT, 'lime-config.json');
const UA = { 'User-Agent': 'LimeVisuals/' + app.getVersion() + ' (github.com/YOUR_GITHUB_NAME/limevisuals)' };
let win, msToken = null;

const j = async u => { const r = await fetch(u, { headers: UA }); if (!r.ok) throw new Error(r.status + ' ' + u); return r.json(); };
const send = (c, m) => win && !win.isDestroyed() && win.webContents.send(c, m);
const log = m => { send('log', m); try { fs.appendFileSync(path.join(LOGS, 'launcher.log'), m + '\n'); } catch {} };
const modsDir = mc => path.join(GAME, 'mods-' + mc);
const readCfg = () => { try { return JSON.parse(fs.readFileSync(CFG, 'utf8')); } catch { return { name: '', accounts: [], ver: '', loader: 'Fabric', ram: 4 }; } };
const writeCfg = c => fs.writeFileSync(CFG, JSON.stringify(c, null, 2));

async function download(url, dest, sha512) {
  const r = await fetch(url, { headers: UA, redirect: 'follow' });
  if (!r.ok) throw new Error(r.status + ' ' + url);
  const buf = Buffer.from(await r.arrayBuffer());
  if (sha512 && crypto.createHash('sha512').update(buf).digest('hex') !== sha512) throw new Error('Хеш не совпал: ' + path.basename(dest));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
}

app.whenReady().then(() => {
  [ROOT, GAME, RUNTIME, LOGS].forEach(d => fs.mkdirSync(d, { recursive: true }));
  Menu.setApplicationMenu(null);
  win = new BrowserWindow({ width: 1040, height: 660, minWidth: 900, minHeight: 600, backgroundColor: '#2a2070', title: 'LimeVisuals',
    webPreferences: { preload: path.join(__dirname, 'preload.js') } });
  win.loadFile('index.html');
  if (app.isPackaged) {
    autoUpdater.on('update-downloaded', i => send('upd', i.version));
    autoUpdater.checkForUpdates().catch(() => {});
  }
});
ipcMain.handle('installUpdate', () => autoUpdater.quitAndInstall());

ipcMain.handle('cfg:get', () => readCfg());
ipcMain.handle('cfg:set', (_, c) => { writeCfg(c); return true; });

ipcMain.handle('versions', async () => {
  const m = await j('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
  let have = [];
  try { have = fs.readdirSync(path.join(GAME, 'versions'), { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name); } catch {}
  return m.versions.filter(v => v.type === 'release').map(v => ({ id: v.id, installed: have.includes(v.id) }));
});

ipcMain.handle('login', async () => {
  const xbox = await new Auth('select_account').launch('electron');
  const mc = await xbox.getMinecraft();
  msToken = mc.mclc();
  return mc.profile.name;
});

/* ---- Моды / ресурспаки / шейдеры (Modrinth) ---- */
const TYPE = { mod: 'mod', resourcepack: 'resourcepack', shader: 'shader' };
const dirFor = (type, mc) => type === 'mod' ? modsDir(mc) : path.join(GAME, type === 'shader' ? 'shaderpacks' : 'resourcepacks');
const loadersFor = (type, loader) => type === 'mod' ? [loader.toLowerCase()] : type === 'shader' ? ['iris'] : ['minecraft'];

ipcMain.handle('search', async (_, { query, type, mc, loader, category }) => {
  const facets = [[`project_type:${TYPE[type]}`], [`versions:${mc}`]];
  if (type === 'mod') facets.push([`categories:${loader.toLowerCase()}`]);
  if (category) facets.push([`categories:${category}`]);
  const r = await j(`https://api.modrinth.com/v2/search?limit=30&query=${encodeURIComponent(query || '')}&facets=${encodeURIComponent(JSON.stringify(facets))}`);
  return r.hits.map(h => ({ id: h.project_id, title: h.title, author: h.author, desc: h.description, icon: h.icon_url, downloads: h.downloads, cats: h.display_categories || [] }));
});

async function installProject(id, type, mc, loader) {
  const vs = await j(`https://api.modrinth.com/v2/project/${id}/version?game_versions=${encodeURIComponent(JSON.stringify([mc]))}&loaders=${encodeURIComponent(JSON.stringify(loadersFor(type, loader)))}`);
  if (!vs.length) throw new Error('Нет версии под ' + mc);
  const f = vs[0].files.find(x => x.primary) || vs[0].files[0];
  await download(f.url, path.join(dirFor(type, mc), f.filename), f.hashes.sha512);
  return f.filename;
}
ipcMain.handle('install', (_, a) => installProject(a.id, a.type, a.mc, a.loader));

ipcMain.handle('mods:list', (_, mc) => {
  const d = modsDir(mc); if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter(f => /\.jar(\.disabled)?$/.test(f)).map(f => ({ file: f, enabled: f.endsWith('.jar') }));
});
ipcMain.handle('mods:toggle', (_, { mc, file }) => {
  const d = modsDir(mc), on = file.endsWith('.jar');
  fs.renameSync(path.join(d, file), path.join(d, on ? file + '.disabled' : file.replace(/\.disabled$/, '')));
  return true;
});
ipcMain.handle('mods:remove', (_, { mc, file }) => { fs.rmSync(path.join(modsDir(mc), file), { force: true }); return true; });

/* ---- Java (runtime) ---- */
function javaMajor(mc) { const [, mi, pa] = mc.split('.').map(Number); return (mi > 20 || (mi === 20 && (pa || 0) >= 5)) ? 21 : mi >= 17 ? 17 : 8; }
async function ensureJava(mc) {
  const major = javaMajor(mc), dir = path.join(RUNTIME, 'java-' + major);
  const find = () => { if (!fs.existsSync(dir)) return null; const sub = fs.readdirSync(dir).find(n => fs.existsSync(path.join(dir, n, 'bin', 'javaw.exe'))); return sub && path.join(dir, sub, 'bin', 'javaw.exe'); };
  let p = find(); if (p) return p;
  log(`Скачиваю Java ${major}…`);
  const zip = path.join(RUNTIME, `java-${major}.zip`);
  await download(`https://api.adoptium.net/v3/binary/latest/${major}/ga/windows/x64/jre/hotspot/normal/eclipse`, zip);
  fs.mkdirSync(dir, { recursive: true }); await extract(zip, { dir }); fs.rmSync(zip, { force: true });
  p = find(); if (!p) throw new Error('Не удалось установить Java'); return p;
}

async function installFabric(mc) {
  const list = await j(`https://meta.fabricmc.net/v2/versions/loader/${mc}`);
  if (!list.length) throw new Error('Fabric не поддерживает ' + mc);
  const prof = await j(`https://meta.fabricmc.net/v2/versions/loader/${mc}/${list[0].loader.version}/profile/json`);
  const dir = path.join(GAME, 'versions', prof.id); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, prof.id + '.json'), JSON.stringify(prof));
  return prof.id;
}

// mods-<версия> → game\mods (Fabric читает только game\mods)
function syncMods(mc) {
  const src = modsDir(mc), dst = path.join(GAME, 'mods');
  fs.mkdirSync(src, { recursive: true }); fs.mkdirSync(dst, { recursive: true });
  const bundled = path.join(process.resourcesPath || '', 'mod'), local = path.join(__dirname, 'bundled');
  for (const b of [bundled, local]) if (fs.existsSync(b)) for (const f of fs.readdirSync(b).filter(x => x.endsWith('.jar'))) fs.copyFileSync(path.join(b, f), path.join(src, f));
  fs.readdirSync(dst).filter(f => f.endsWith('.jar')).forEach(f => fs.rmSync(path.join(dst, f)));
  fs.readdirSync(src).filter(f => f.endsWith('.jar')).forEach(f => fs.copyFileSync(path.join(src, f), path.join(dst, f)));
}

ipcMain.handle('play', async (_, { mc, loader, ram, name, ms }) => {
  const javaPath = await ensureJava(mc);
  let authorization;
  if (ms) { if (!msToken) throw new Error('Сначала войдите через Microsoft'); authorization = msToken; }
  else { if (!name) throw new Error('Введите ник'); authorization = await Authenticator.getAuth(name); }
  const version = { number: mc, type: 'release' };
  if (loader === 'Fabric') {
    version.custom = await installFabric(mc);
    fs.mkdirSync(modsDir(mc), { recursive: true });
    if (!fs.readdirSync(modsDir(mc)).some(f => /^fabric-api/.test(f))) {
      log('Устанавливаю Fabric API…'); await installProject('P7dR8mSH', 'mod', mc, 'Fabric');
    }
    syncMods(mc);
  }
  const l = new Client();
  l.on('progress', p => send('prog', Math.round(p.task / Math.max(p.total, 1) * 100)));
  l.on('package-extract', () => log('Распаковка файлов…'));
  l.on('debug', m => log(m)); l.on('data', m => log(String(m).trim()));
  l.on('close', c => { send('prog', 0); log('Игра закрыта, код ' + c); send('closed', c); });
  await l.launch({ authorization, root: GAME, javaPath, version, memory: { max: ram + 'G', min: '1G' } });
  return true;
});
