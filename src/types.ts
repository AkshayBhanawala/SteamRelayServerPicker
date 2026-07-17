declare global {
	interface Window {
		electronAPI?: {
			getOsPlatform: () => Promise<NodeJS.Platform>;
			checkAdminAccess: () => Promise<boolean>;
			getAppDetails: (appId: string) => Promise<any>;
			getSteamSDR: (appId: string) => Promise<any>;
			ping: (ip: string) => Promise<number>;
			getBlockedIps: (appId: string) => Promise<string[]>;
			syncFirewall: (ips: string[], elevate: boolean, appId: string) => Promise<string[]>;
			relaunchElevated: () => Promise<void>;
			quitApp: () => Promise<void>;
		};
	}
}

export interface Relay {
	ipv4: string;
	port_range: number[];
	ping?: number;
	selected: boolean;
	blocked: boolean;
}

export interface ProcessedLocation {
	id: string;
	description: string;
	relays: Relay[];
	avgPing: number;
	isExpanded: boolean;
	geo?: [number, number];
}