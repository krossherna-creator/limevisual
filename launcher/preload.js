const { contextBridge, ipcRenderer } = require('electron');
const inv = c => a => ipcRenderer.invoke(c, a);
const on = c => cb => ipcRenderer.on(c, (_, m) => cb(m));
contextBridge.exposeInMainWorld('api', {
  cfgGet: inv('cfg:get'), cfgSet: inv('cfg:set'), versions: inv('versions'), login: inv('login'),
  search: inv('search'), install: inv('install'), modsList: inv('mods:list'), modsToggle: inv('mods:toggle'), modsRemove: inv('mods:remove'),
  play: inv('play'), installUpdate: inv('installUpdate'),
  onLog: on('log'), onProg: on('prog'), onUpd: on('upd'), onClosed: on('closed'),
});
