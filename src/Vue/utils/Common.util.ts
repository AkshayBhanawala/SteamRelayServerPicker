export const MAX_PING = 9999;
export const BASE_APP_FILE_PREFIX = `_SteamRelayServerPicker`;
export const isMaxPing = (ping: number) => ping === MAX_PING;
export const isOsWindows = (osPlatform: NodeJS.Platform) => osPlatform === 'win32';
export const isOsLinux = (osPlatform: NodeJS.Platform) => osPlatform === 'linux';
export const isOsMac = (osPlatform: NodeJS.Platform) => osPlatform === 'darwin';
export const getOsDisplayName = (osPlatform: NodeJS.Platform) => {
	switch (osPlatform) {
		case 'win32':
			return 'Windows';
		case 'linux':
			return 'Linux';
		case 'darwin':
			return 'MacOS';
		default:
			return `'${osPlatform}'`;
	}
};
export const getOsFirewallType = (osPlatform: NodeJS.Platform) => {
	switch (osPlatform) {
		case 'win32':
			return 'Windows Defender Firewall';
		case 'linux':
			return 'iptables / ufw';
		case 'darwin':
			return 'pf (Packet Filter)';
		default:
			return '';
	}
};
