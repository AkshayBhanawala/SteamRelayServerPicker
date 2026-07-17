export const APP_NAME_TITLE_CASE = `Steam Relay Server Picker`;
export const APP_NAME_TITLE_CASE_NO_SPACE = APP_NAME_TITLE_CASE.split(' ').join('');
export const APP_NAME = APP_NAME_TITLE_CASE.toLowerCase().split(' ').join('-');
export const APP_ID = `com.th3az.${APP_NAME}`;
export const BASE_APP_FILE_PREFIX = `_${APP_NAME_TITLE_CASE_NO_SPACE}`;
export const MAX_PING = 9999;
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
