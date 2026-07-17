import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
	getOsPlatform: () => ipcRenderer.invoke('get-os-platform'),
	checkAdminAccess: () => ipcRenderer.invoke('check-admin'),
	getAppDetails: (appId: string) => ipcRenderer.invoke('fetch-steam-app-info', appId),
	getSteamSDR: (appId: string) => ipcRenderer.invoke('fetch-steam-app-sdr-config', appId),
	ping: (ip: string) => ipcRenderer.invoke('ping-server', ip),
	getBlockedIps: (appId: string) => ipcRenderer.invoke('get-blocked-ips', appId),
	syncFirewall: (ips: string[], elevate: boolean, appId: string) => ipcRenderer.invoke('sync-firewall', ips, elevate, appId),
	relaunchElevated: () => ipcRenderer.invoke('relaunch-elevated'),
});