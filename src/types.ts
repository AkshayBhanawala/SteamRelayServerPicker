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

declare global {
	interface Window {
		electronAPI?: {
			getAppDetails: (appId: string) => Promise<any>;
			getSteamSDR: (appId: string) => Promise<any>;
			ping: (ip: string) => Promise<number>;
			checkAdmin: () => Promise<boolean>;
			getBlockedIps: (appId: string) => Promise<string[]>;
			syncFirewall: (ips: string[], elevate: boolean, appId: string) => Promise<boolean>;
			relaunchElevated: () => Promise<void>;
		};
	}
}