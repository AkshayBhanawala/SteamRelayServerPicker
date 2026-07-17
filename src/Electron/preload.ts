import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
	getOsPlatform: () => ipcRenderer.invoke('get-os-platform'),
	checkAdminAccess: () => ipcRenderer.invoke('check-admin'),
	getAppDetails: (steamAppId: string) => ipcRenderer.invoke('fetch-steam-app-info', steamAppId),
	getSteamSDR: (steamAppId: string) => ipcRenderer.invoke('fetch-steam-app-sdr-config', steamAppId),
	ping: (ip: string) => ipcRenderer.invoke('ping-server', ip),
	getBlockedIps: (steamAppId: string) => ipcRenderer.invoke('get-blocked-ips', steamAppId),
	syncFirewall: (ips: string[], elevate: boolean, steamAppId: string) => ipcRenderer.invoke('sync-firewall', ips, elevate, steamAppId),
	relaunchElevated: () => ipcRenderer.invoke('relaunch-elevated'),
});