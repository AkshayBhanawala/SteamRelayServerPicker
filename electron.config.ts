import { Configuration } from 'electron-builder';

export const config: Configuration = {
	appId: 'com.th3az.steam-relay-server-picker',
	productName: 'SteamRelayServerPicker',
	electronLanguages: ["en"],
	directories: {
		output: 'release',
	},
	files: ['dist/**/*', 'public/**/*', 'dist-electron/**/*'],
	artifactName: "${productName}-${version}-${os}-${arch}.${ext}",
	win: {
		target: ['zip'],
		compression: 'normal',
		icon: "public/icons/icon.ico",
	},
	mac: {
		target: ['dmg', 'zip'],
		compression: 'normal',
		icon: "public/icons/icon.icns",
	},
	linux: {
		target: ['AppImage', 'zip'],
		compression: 'normal',
		icon: "public/icons/icon_256x256.png",
	},
};

export default config;
