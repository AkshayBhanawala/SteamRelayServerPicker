import { Configuration } from 'electron-builder';
import { APP_NAME_TITLE_CASE_NO_SPACE } from './src/Vue/utils/Common.util'

export const config: Configuration = {
	appId: 'com.th3az.steam-relay-server-picker',
	productName: APP_NAME_TITLE_CASE_NO_SPACE,
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
