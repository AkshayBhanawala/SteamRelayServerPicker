import { Configuration } from 'electron-builder';

export const config: Configuration = {
	appId: 'com.th3az.steam-server-relay-picker',
	productName: 'Steam Relay Server Picker',
	compression: 'maximum',
	directories: {
		output: 'release',
	},
	files: ['dist/**/*', 'dist-electron/**/*'],
	win: {
		target: ['portable'],
	},
	mac: {
		target: ['dmg'],
	},
	linux: {
		target: ['AppImage'],
	},
};

export default config;
