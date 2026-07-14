import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
	getSteamSDR: () => ipcRenderer.invoke('fetch-steam-data'),
	ping: (ip: string) => ipcRenderer.invoke('ping-server', ip)
});