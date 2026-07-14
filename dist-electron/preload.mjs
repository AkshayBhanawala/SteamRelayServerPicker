let electron = require("electron");
//#region electron/preload.ts
electron.contextBridge.exposeInMainWorld("electronAPI", {
	getSteamSDR: () => electron.ipcRenderer.invoke("fetch-steam-data"),
	ping: (ip) => electron.ipcRenderer.invoke("ping-server", ip)
});
//#endregion
