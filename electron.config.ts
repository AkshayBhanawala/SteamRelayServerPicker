import { Configuration } from 'electron-builder';

export const config: Configuration = {
	appId: 'com.th3az.steam-server-relay-picker',
	productName: 'Steam Relay Server Picker',
	compression: 'maximum',
	directories: {
		output: 'release',
	},
	files: ['dist/**/*', 'public/**/*', 'dist-electron/**/*'],
	win: {
		target: ['portable'],
		icon: "public/icons/icon.ico",
	},
	mac: {
		target: ['dmg'],
		icon: "public/icons/icon.icns",
	},
	linux: {
		target: ['AppImage'],
		icon: "public/icons/icon_256x256.png",
	},
};

export default config;
