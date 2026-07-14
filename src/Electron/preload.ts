import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
	getAppDetails: (appId: string) => ipcRenderer.invoke('fetch-app-details', appId),
	getSteamSDR: (appId: string) => ipcRenderer.invoke('fetch-steam-data', appId),
	ping: (ip: string) => ipcRenderer.invoke('ping-server', ip),
	checkAdmin: () => ipcRenderer.invoke('check-admin'),
	getBlockedIps: (appId: string) => ipcRenderer.invoke('get-blocked-ips', appId),
	syncFirewall: (ips: string[], elevate: boolean, appId: string) => ipcRenderer.invoke('sync-firewall', ips, elevate, appId),
	relaunchElevated: () => ipcRenderer.invoke('relaunch-elevated')
});