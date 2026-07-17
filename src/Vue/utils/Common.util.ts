export const APP_NAME_TITLE_CASE = `Steam Relay Server Picker`;
export const APP_NAME_TITLE_CASE_NO_SPACE = APP_NAME_TITLE_CASE.split(' ').join('');
export const APP_NAME = APP_NAME_TITLE_CASE.toLowerCase().split(' ').join('-');
export const APP_ID = `com.th3az.${APP_NAME}`;
export const BASE_APP_FILE_PREFIX = `_${APP_NAME_TITLE_CASE_NO_SPACE}`;
export const MAC_PF_ANCHOR_BLOCKED_IPS_TABLE_NAME = `SDR_BLOCKED_IPS`;
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

const PingQuality = {
	EXCELLENT: 0,
	GOOD: 1,
	FAIR: 2,
	POOR: 3,
	BAD: 4,
};
type PingQuality = (typeof PingQuality)[keyof typeof PingQuality];

export const getPingColorClass = (ping: number) => {
	switch (getPingQuality(ping)) {
		case PingQuality.EXCELLENT:
			return 'ping-excellent';

		case PingQuality.GOOD:
			return 'ping-good';

		case PingQuality.FAIR:
			return 'ping-fair';

		case PingQuality.POOR:
			return 'ping-poor';

		default:
			return 'ping-bad';
	}
};

export const getPingColorHex = (ping: number) => {
	switch (getPingQuality(ping)) {
		case PingQuality.EXCELLENT:
			return '#4ade80';

		case PingQuality.GOOD:
			return '#06d2e0';

		case PingQuality.FAIR:
			return '#facc15';

		case PingQuality.POOR:
			return '#fb923c';

		default:
			return '#f87171';
	}
};

const getPingQuality = (ping: number): PingQuality => {
	if (ping <= 50) return PingQuality.EXCELLENT;
	if (ping < 100) return PingQuality.GOOD;
	if (ping < 150) return PingQuality.FAIR;
	if (ping < 300) return PingQuality.POOR;
	return PingQuality.BAD;
};
