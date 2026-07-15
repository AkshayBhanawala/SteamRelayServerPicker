import { Configuration } from 'electron-builder';

export const config: Configuration = {
	appId: 'com.th3az.steam-server-relay-picker',
	productName: 'SteamRelayServerPicker',
	electronLanguages: ["en"],
	compression: 'normal',
	directories: {
		output: 'release',
	},
	files: ['dist/**/*', 'public/**/*', 'dist-electron/**/*'],
	win: {
		target: ['zip'],
		icon: "public/icons/icon.ico",
	},
	mac: {
		target: ['dmg', 'zip'],
		icon: "public/icons/icon.icns",
	},
	linux: {
		target: ['AppImage', 'zip'],
		icon: "public/icons/icon_256x256.png",
	},
};

export default config;
