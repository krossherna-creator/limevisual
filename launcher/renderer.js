const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let cfg, ms = false, tab = 'B', cat = '', got = new Set(), busy = false;
const CATS = ['adventure', 'decoration', 'equipment', 'cursed', 'economy', 'food', 'optimization', 'utility'];
const log = m => { const l = $('#log'); l.textContent += m + '\n'; l.scrollTop = 1e9; };
api.onLog(log); api.onProg(p => $('#pb').style.width = p + '%'); api.onClosed(() => { $('#go').disabled = false; $('#go').textContent = 'PLAY'; });
api.onUpd(v => { $('#ut').textContent = 'LimeVisuals ' + v + ' is available'; $('#upd').style.display = 'flex'; });
$('#ui').onclick = () => api.installUpdate(); $('#ul').onclick = () => $('#upd').style.display = 'none';

function nav(i) { [0, 1].forEach(k => { $('#p' + k).classList.toggle('on', k == i); $('#n' + k).classList.toggle('on', k == i); }); $('#crumb').textContent = i ? '/ Mods' : '/ Home'; if (i) draw(); }
$('#n0').onclick = () => nav(0); $('#n1').onclick = () => nav(1);

async function init() {
  cfg = await api.cfgGet();
  $('#nm').value = cfg.name || ''; $('#ldr').value = cfg.loader; $('#ram').value = cfg.ram;
  const vs = await api.versions();
  $('#ver').innerHTML = vs.map(v => `<option>${v.id}</option>`).join('');
  $('#ver').value = cfg.ver || vs[0].id;
  $('#vl').innerHTML = vs.slice(0, 60).map(v => `<div class="v" data-v="${v.id}">${v.id}${v.installed ? '<small>установлена</small>' : ''}</div>`).join('');
  $('#vl').onclick = e => { const d = e.target.closest('.v'); if (d) { $('#ver').value = d.dataset.v; mark(); } };
  accs(); mark();
}
function mark() { document.querySelectorAll('.v').forEach(v => v.classList.toggle('on', v.dataset.v == $('#ver').value)); }
$('#ver').onchange = () => { mark(); if ($('#p1').classList.contains('on')) draw(); };
function accs() { const a = $('#acc'); a.style.display = cfg.accounts.length ? '' : 'none'; a.innerHTML = '<option value="">Сохранённые ники…</option>' + cfg.accounts.map(x => `<option>${esc(x)}</option>`).join(''); }
$('#acc').onchange = e => { if (e.target.value) { $('#nm').value = e.target.value; ms = false; } };
$('#nu').onclick = () => { $('#nm').value = ''; $('#nm').focus(); ms = false; $('#ms').textContent = 'or sign in with Microsoft'; };
$('#ms').onclick = async () => { try { const n = await api.login(); $('#nm').value = n; ms = true; $('#ms').textContent = '✓ signed in with Microsoft'; } catch (e) { log('Ошибка входа: ' + e.message); } };

$('#go').onclick = async () => {
  if (busy) return; const name = $('#nm').value.trim();
  if (!ms && !/^[A-Za-z0-9_]{3,16}$/.test(name)) return log('Ник: 3–16 символов, латиница, цифры и _');
  if (!ms && !cfg.accounts.includes(name)) cfg.accounts.push(name);
  Object.assign(cfg, { name, ver: $('#ver').value, loader: $('#ldr').value, ram: +$('#ram').value }); await api.cfgSet(cfg); accs();
  busy = true; $('#go').disabled = true; $('#go').textContent = 'LAUNCHING...';
  try { await api.play({ mc: cfg.ver, loader: cfg.loader, ram: cfg.ram, name, ms }); } catch (e) { log('Ошибка: ' + e.message); $('#go').disabled = false; $('#go').textContent = 'PLAY'; }
  busy = false;
};

/* Моды */
const type = () => $('#typ').value, mc = () => $('#ver').value, ld = () => $('#ldr').value;
async function draw() {
  $('#tB').classList.toggle('on', tab == 'B'); $('#tI').classList.toggle('on', tab == 'I');
  $('#cats').innerHTML = CATS.map(c => `<span class="${c == cat ? 'on' : ''}" data-c="${c}">${c}</span>`).join('');
  $('#cats').onclick = e => { const c = e.target.dataset.c; if (c) { cat = cat == c ? '' : c; draw(); } };
  const L = $('#lst');
  if (tab == 'I') {
    const m = await api.modsList(mc());
    L.innerHTML = m.map(x => `<div class="it"><div class="ic"></div><div class="t"><b>${esc(x.file.replace('.disabled', ''))}</b><small>mods-${esc(mc())}</small></div><div class="sw ${x.enabled ? 'on' : ''}" data-t="${esc(x.file)}"></div><button class="btn g" data-r="${esc(x.file)}">Remove</button></div>`).join('') || '<div style="padding:24px;color:#cfcaf2">Модов пока нет — откройте Browse Modrinth</div>';
    L.onclick = async e => { const t = e.target; if (t.dataset.t) { await api.modsToggle({ mc: mc(), file: t.dataset.t }); draw(); } if (t.dataset.r) { await api.modsRemove({ mc: mc(), file: t.dataset.r }); draw(); } };
    return;
  }
  L.innerHTML = '<div style="padding:24px;color:#cfcaf2">Загрузка…</div>';
  try {
    const r = await api.search({ query: $('#qs').value, type: type(), mc: mc(), loader: ld(), category: cat });
    L.innerHTML = r.map(h => `<div class="it"><img src="${esc(h.icon || '')}" alt=""><div class="t"><b>${esc(h.title)}</b><small>${esc(h.desc)}</small><small>${esc(h.author)} · ${esc(h.cats.join(' · '))} · ⭳ ${(h.downloads / 1e6).toFixed(2)}M</small></div><button class="btn" data-i="${esc(h.id)}">${got.has(h.id) ? 'Installed ✓' : 'Install'}</button></div>`).join('') || '<div style="padding:24px;color:#cfcaf2">Ничего не найдено</div>';
    L.onclick = async e => { const b = e.target.closest('[data-i]'); if (!b) return; b.textContent = '…'; try { log('Скачано: ' + await api.install({ id: b.dataset.i, type: type(), mc: mc(), loader: ld() })); got.add(b.dataset.i); b.textContent = 'Installed ✓'; } catch (x) { b.textContent = 'Error'; log(x.message); } };
  } catch (e) { L.innerHTML = '<div style="padding:24px">Ошибка: ' + esc(e.message) + '</div>'; }
}
$('#tB').onclick = () => { tab = 'B'; draw(); }; $('#tI').onclick = () => { tab = 'I'; draw(); };
$('#typ').onchange = draw; $('#clr').onclick = () => { cat = ''; $('#qs').value = ''; draw(); };
let t; $('#qs').oninput = () => { clearTimeout(t); t = setTimeout(draw, 350); };
init().catch(e => log('Ошибка запуска: ' + e.message));
