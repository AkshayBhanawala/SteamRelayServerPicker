import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { installIpcLogger } from 'electron-ipc-logger';
import { APP_ID, APP_NAME, APP_NAME_TITLE_CASE, APP_NAME_TITLE_CASE_NO_SPACE, isOsMac } from '../Vue/utils/Common.util';
import path, { dirname } from 'path';
import sudo from '@vscode/sudo-prompt';
import ping from 'ping';
import fs from 'fs';
import os from 'os';
import logger from 'electron-log/main';

const osPlatform = os.platform();

const __exePath = app.getPath('exe');
const __exeDir = isOsMac(osPlatform) ? path.join(path.dirname(__exePath), '../../../../') : path.dirname(__exePath);
const __appAsarPath = app.getAppPath();
const __appDataPath = app.getPath('appData');
const __documentsPath = app.getPath('documents');
const __fileStorageBasePath = path.join(__documentsPath, APP_NAME_TITLE_CASE_NO_SPACE);
const __loggerFilePath = path.join(__fileStorageBasePath, 'logs', 'main.log');
const __tempFilesBasePath = path.join(__fileStorageBasePath, 'temp');

logger.transports.file.resolvePathFn = () => __loggerFilePath;
logger.transports.file.maxSize = 1 * 1024 * 1024; // 1 MB

logger.initialize();
logger.info(`Application is starting up...`);
logger.info(`osPlatform:`, osPlatform);
logger.info(`app.isPackaged?:`, app.isPackaged);

logger.info(`__exePath:`, __exePath);
logger.info(`__exeDir:`, __exeDir);
logger.info(`__appAsarPath:`, __appAsarPath);
logger.info(`__appDataPath:`, __appDataPath);
logger.info(`__fileStorageBasePath:`, __fileStorageBasePath);
logger.info(`__loggerFilePath:`, __loggerFilePath);
logger.info(`__tempFilesBasePath:`, __tempFilesBasePath);

const __appIconPath = path.join(__appAsarPath, 'public', 'icons', 'icon.ico');
logger.info(`__appIconPath:`, __appIconPath);

const __entrypointFile = fileURLToPath(import.meta.url);
logger.info(`__entrypointFile:`, __entrypointFile);

const __entrypointDir = dirname(__entrypointFile);
logger.info(`__entrypointDir:`, __entrypointDir);

const __preloadFilePath = path.join(__entrypointDir, 'preload.mjs');
logger.info(`__preloadFilePath:`, __preloadFilePath);

if (osPlatform !== 'darwin') {
	// Break the V-Sync lock
	app.commandLine.appendSwitch('disable-gpu-vsync');
	app.commandLine.appendSwitch('disable-frame-rate-limit');

	// Prevent Windows from putting the app into 30fps "Efficiency Mode"
	app.commandLine.appendSwitch('disable-renderer-backgrounding');
	app.commandLine.appendSwitch('disable-background-timer-throttling');
	app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

	// Other GPU Flags
	app.commandLine.appendSwitch('ignore-gpu-blocklist');
	app.commandLine.appendSwitch('enable-gpu-rasterization');
	app.commandLine.appendSwitch('enable-zero-copy');
}

const BASE_CONFIG_SAVE_DIRECTORY = path.join(__fileStorageBasePath, 'config');
const BASE_FIREWALL_RULE_NAME = `_${APP_NAME_TITLE_CASE_NO_SPACE}-SDRBlock--`;
const getBlockedIpsLocalFilePath = (steamAppId: string) => path.join(BASE_CONFIG_SAVE_DIRECTORY, `blocked_ips_${steamAppId}.json`);
const getRuleName = (steamAppId: string) => `${BASE_FIREWALL_RULE_NAME}${steamAppId}`;

let mainWindow: BrowserWindow;
const createWindow = () => {
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 720,
		minWidth: 900,
		minHeight: 600,
		backgroundColor: '#020617',
		icon: __appIconPath,
		webPreferences: {
			preload: __preloadFilePath,
			contextIsolation: true,
			nodeIntegration: false,
			backgroundThrottling: false,
			webgl: true,
			scrollBounce: false,
		},
	});

	if (app.isPackaged) {
		// Built App
		mainWindow.loadFile(path.join(__entrypointDir, '../dist/index.html'));
	} else if (process.env.VITE_DEV_SERVER_URL) {
		// Dev Running App
		mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
	} else {
		// Invalid run
		mainWindow.loadURL('');
	}

	if (!fs.existsSync(BASE_CONFIG_SAVE_DIRECTORY)) {
		fs.mkdirSync(BASE_CONFIG_SAVE_DIRECTORY);
	}
};

app.whenReady().then(async () => {
	if (app.isPackaged) {
		// Remove the default menu
		Menu.setApplicationMenu(null);
	} else {
		await installIpcLogger({ parent: mainWindow });
	}

	logger.info('GPU Feature Status:', app.getGPUFeatureStatus());

	ipcMain.handle('get-os-platform', handle_GetOsPlatform);
	ipcMain.handle('check-admin', handle_AppCheckAdminAccess);
	ipcMain.handle('fetch-steam-app-info', handle_FetchSteamAppInfo);
	ipcMain.handle('fetch-steam-app-sdr-config', handle_FetchSteamAppSdrConfig);
	ipcMain.handle('ping-server', handle_PingServer);
	ipcMain.handle('get-blocked-ips', handle_GetBlockedIps);
	ipcMain.handle('sync-firewall', handle_SyncFirewall);
	ipcMain.handle('relaunch-elevated', handle_RelaunchElevated);

	createWindow();
});

app.on('window-all-closed', () => {
	logger.info(`window-all-closed - Quitting app!`);
	logger.info(`--------------------------------------------------------------------------------------------\r\n`);
	app.quit();
});

async function handle_GetOsPlatform(): Promise<NodeJS.Platform> {
	logger.info(`IPC handler for 'get-os-platform'`);
	return osPlatform;
};

async function handle_AppCheckAdminAccess(): Promise<boolean> {
	logger.info(`IPC handler for 'check-admin'`);
	if (osPlatform === 'win32') {
		return new Promise((resolve) => {
			exec('net session', (err) => resolve(!err));
		});
	} else {
		// macOS and Linux
		// process.getuid() returns 0 if the process is running as root
		const isRoot = process.getuid ? process.getuid() === 0 : false;
		return Promise.resolve(isRoot);
	}
};

async function handle_FetchSteamAppInfo(_: Electron.IpcMainInvokeEvent, steamAppId: string) {
	logger.info(`IPC handler for 'fetch-steam-app-info', steamAppId:`, steamAppId);
	const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${steamAppId}`);
	if (!response.ok) throw new Error(`Failed to fetch Store details for App ${steamAppId}`);
	return await response.json();
}

async function handle_FetchSteamAppSdrConfig(_: Electron.IpcMainInvokeEvent, steamAppId: string) {
	logger.info(`IPC handler for 'fetch-steam-app-sdr-config', steamAppId:`, steamAppId);
	const response = await fetch(`https://api.steampowered.com/ISteamApps/GetSDRConfig/v1?appid=${steamAppId}`);
	if (!response.ok) throw new Error(`Failed to fetch Steam data for App ${steamAppId}`);
	return await response.json();
}

async function handle_PingServer(_: Electron.IpcMainInvokeEvent, ip: string) {
	// logger.info(`IPC handler for 'ping-server', IP:`, ip);
	try {
		const result = await ping.promise.probe(ip, { timeout: 2 });
		return (result.alive && typeof result.time === 'number') ? Math.round(result.time) : 9999;
	} catch {
		return 9999;
	}
}

async function handle_GetBlockedIps(_: Electron.IpcMainInvokeEvent, steamAppId: string) {
	logger.info(`IPC handler for 'get-blocked-ips', steamAppId:`, steamAppId);

	const ruleName = getRuleName(steamAppId);
	const blockedIpsOutPath = path.join(os.tmpdir(), `${APP_NAME}-fw-blocked-ips-out.txt`);
	let success = false;

	if (osPlatform === 'win32') {
		// WINDOWS: Query the OS Firewall directly (No admin required for reading)
		return new Promise((resolve) => {
			const psCommand = `$f = Get-NetFirewallRule -DisplayName '${ruleName}' -ErrorAction SilentlyContinue | Get-NetFirewallAddressFilter; if ($f) { $f.RemoteAddress }`;
			exec(`powershell -NoProfile -Command "${psCommand}"`, (err, stdout) => {
				if (err || !stdout) {
					return resolve([]);
				}
				const ips = stdout.split('\n')
					.map(line => line.trim())
					.filter(line => line.length > 0);
				resolve(ips);
			});
		});
	}

	// --- LINUX (linux) ---
	else if (osPlatform === 'linux') {
		const bashCommand = `
			iptables -S ${ruleName} 2>/dev/null | awk '/-d/ {print $4}' | cut -d/ -f1 > "${blockedIpsOutPath}";
			chmod 666 "${blockedIpsOutPath}";
		`;

		// Linux IPTables ALWAYS requires root
		success = await runElevated(bashCommand);
	}

	// --- macOS (darwin) ---
	else if (osPlatform === 'darwin') {
		const macCommand = `
			pfctl -a ${APP_ID} -s rules 2>/dev/null | grep -oE '[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+' > "${blockedIpsOutPath}";
			chmod 666 "${blockedIpsOutPath}";
		`;

		// Mac PF ALWAYS requires sudo
		success = await runElevated(macCommand);
	}

	// --- Process the Blocked IPs Result File for Linux/Mac ---
	let blockedIps: string[] = [];

	if (success && fs.existsSync(blockedIpsOutPath)) {
		// Read the blocked IPs file generated by the OS Firewall command
		const rawOutput = fs.readFileSync(blockedIpsOutPath, 'utf-8');
		blockedIps = rawOutput.split('\n')
			.map(line => line.trim().replace(/[\0\r]/g, ''))
			.filter(line => line.length > 0);

		// Delete the temp output file
		fs.unlinkSync(blockedIpsOutPath);
	} else if (success) {
		// Fallback to reading config file if the file writing command failed for any reason
		blockedIps = await readBlockedIpsFromLocalFile(steamAppId);
	}

	// Return the actual network firewall-blocked IPs back
	return blockedIps;
}

async function handle_SyncFirewall(_: Electron.IpcMainInvokeEvent, ips: string[], elevate: boolean, steamAppId: string) {
	logger.info(`IPC handler for 'sync-firewall'`);
	logger.info(`Arguments.ips:`, JSON.stringify(ips));
	logger.info(`Arguments.elevate:`, JSON.stringify(elevate));
	logger.info(`Arguments.steamAppId:`, JSON.stringify(steamAppId));

	const ruleName = getRuleName(steamAppId);

	const syncOutPath = path.join(os.tmpdir(), `${APP_NAME}-fw-sync-${Date.now()}-out.txt`);
	logger.info(`Sync IPs output file path:`, JSON.stringify(syncOutPath));

	let success = false;

	// --- WINDOWS (win32) ---
	if (osPlatform === 'win32') {
		const tempScriptFileName = path.join(os.tmpdir(), `${APP_NAME}-fw-sync-${Date.now()}.ps1`);
		const ipString = ips.map(ip => `'${ip}'`).join(',');
		const psCommand = `
			$ips = @(${ipString});
			$rule = Get-NetFirewallRule -DisplayName '${ruleName}' -ErrorAction SilentlyContinue;

			# 1. Sync
			if ($ips.Count -eq 0) {
					if ($rule) { Remove-NetFirewallRule -DisplayName '${ruleName}' -ErrorAction SilentlyContinue }
			} else {
					if ($rule) {
							Set-NetFirewallRule -DisplayName '${ruleName}' -RemoteAddress $ips
					} else {
							New-NetFirewallRule -DisplayName '${ruleName}' -Direction Outbound -Action Block -RemoteAddress $ips
					}
			}

			# 2. Get blocked IPs directly from the Windows Firewall and export to temp file
			$f = Get-NetFirewallRule -DisplayName '${ruleName}' -ErrorAction SilentlyContinue | Get-NetFirewallAddressFilter;
			if ($f) {
					$f.RemoteAddress | Out-File -FilePath "${syncOutPath}" -Encoding UTF8
			} else {
					New-Item -Path "${syncOutPath}" -ItemType File -Force
			}

			Remove-Item -Path "${tempScriptFileName}" -Force
		`;
		fs.writeFileSync(tempScriptFileName, psCommand);

		if (elevate) {
			success = await runElevated(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tempScriptFileName}"`);
		} else {
			// Run normally...
			success = await new Promise((resolve) => exec(
				`powershell -NoProfile -ExecutionPolicy Bypass -File "${tempScriptFileName}"`,
				(err) => resolve(!err)
			));
		}
	}

	// --- LINUX (linux) ---
	else if (osPlatform === 'linux') {
		// 1. Sync iptables
		// Linux uses iptables. Flush custom chain, then add the new IPs.
		let bashCommand = `
			iptables -F ${ruleName} 2>/dev/null || iptables -N ${ruleName};
			iptables -D OUTPUT -j ${ruleName} 2>/dev/null;
			iptables -I OUTPUT -j ${ruleName};
		`;
		ips.forEach(ip => {
			bashCommand += `iptables -A ${ruleName} -d ${ip} -j DROP; `;
		});

		// 2. Get blocked IPs from iptables rules and output to temp file
		bashCommand += `
			iptables -S ${ruleName} 2>/dev/null | awk '/-d/ {print $4}' | cut -d/ -f1 > "${syncOutPath}";
			chmod 666 "${syncOutPath}";
		`;

		// Linux IPTables ALWAYS requires root
		success = await runElevated(bashCommand);
	}

	// --- macOS (darwin) ---
	else if (osPlatform === 'darwin') {
		// macOS uses PF (Packet Filter). Write the blocked IPs to an anchor file and reload it.
		const ipString = ips.map(ip => `"${ip}"`).join(', ');
		const anchorContent = ips.length > 0 ? `block drop out proto udp to { ${ipString} }` : '';

		// 1. Sync pfctl
		let macCommand = `
			echo '${anchorContent}' > /tmp/${ruleName}_pf_rule;
			pfctl -a ${APP_ID} -f /tmp/${ruleName}_pf_rule;
			pfctl -E 2>/dev/null;
		`;

		// 2. Get active IPs from pfctl and output to temp file (grepping IPv4 addresses)
		macCommand += `
			pfctl -a ${APP_ID} -s rules 2>/dev/null | grep -oE '[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+' > "${syncOutPath}";
			chmod 666 "${syncOutPath}";
		`;

		// Mac PF ALWAYS requires sudo
		success = await runElevated(macCommand);
	}

	logger.info(`Sync IPs command success?:`, JSON.stringify(success));

	const outFileExists = fs.existsSync(syncOutPath);
	logger.info(`Sync IPs output file exists?:`, JSON.stringify(outFileExists));

	// --- Process the Blocked IPs Result File ---
	let blockedIps: string[] = [];

	if (success && outFileExists) {
		// Read the blocked IPs file generated by the OS Firewall command
		const rawOutput = fs.readFileSync(syncOutPath, 'utf-8');
		blockedIps = rawOutput.split('\n')
			.map(line => line.trim().replace(/[\0\r]/g, ''))
			.filter(line => line.length > 0);

		// Delete the temp output file
		fs.unlinkSync(syncOutPath);

		// Save to local JSON as well as a backup option
		saveBlockedIpsInLocalFile(blockedIps, steamAppId);
	} else if (success) {
		// Fallback to saving config file if the file writing command failed for any reason
		saveBlockedIpsInLocalFile(ips, steamAppId);
		blockedIps = ips;
	}

	logger.info(`Sync IPs output file blocked IPs:`, JSON.stringify(blockedIps));

	// Return the actual network firewall-blocked IPs back
	return { success, ips: blockedIps };
}

async function handle_RelaunchElevated() {
	logger.info(`IPC handler for 'relaunch-elevated'`);

	if (process.platform === 'win32') {
		const exePath = process.execPath;
		logger.info(`exePath:`, exePath);

		const args = [...process.argv.slice(1)];
		logger.info(`args:`, args);

		const cwd = process.cwd();
		logger.info(`cwd:`, cwd);

		if (process.env.VITE_DEV_SERVER_URL && !args.some(a => a.startsWith('--dev-server-url='))) {
			args.push(`--dev-server-url=${process.env.VITE_DEV_SERVER_URL}`);
		}
		let psArgs = args.length > 0 ? args.map(a => `'${a}'`).join(',') : '';
		logger.info(`psArgs:`, psArgs);
		if (psArgs) {
			psArgs = `-ArgumentList '${psArgs}'`;
		}

		const psCmd = `powershell -NoProfile -Command "Start-Process -FilePath '${exePath}' ${psArgs} -WorkingDirectory '${cwd}' -Verb RunAs"`;
		logger.info(`psCmd:`, psCmd);

		exec(psCmd);
		app.quit();
	} else {
		// macOS/Linux: Do nothing, or log a warning. The UI shouldn't allow this to be clicked.
		logger.warn("Relaunching as root is not supported or recommended on POSIX systems.");
	}
}

async function saveBlockedIpsInLocalFile(ips: string[], steamAppId: string) {
	fs.writeFileSync(getBlockedIpsLocalFilePath(steamAppId), JSON.stringify(ips));
};

async function readBlockedIpsFromLocalFile(steamAppId: string) {
	const blockedIpsFilePath = getBlockedIpsLocalFilePath(steamAppId);
	if (fs.existsSync(blockedIpsFilePath)) {
		try {
			const data = fs.readFileSync(blockedIpsFilePath, 'utf-8');
			return JSON.parse(data) as Array<string>;
		} catch (e) {
			logger.error("Failed to parse blocked IPs JSON:", e);
		}
	}
	return [] as Array<string>;
};

async function runElevated(command: string, name: string = APP_NAME_TITLE_CASE): Promise<boolean> {
	return new Promise((resolve) => {
		sudo.exec(command, { name }, (error) => {
			if (error) {
				logger.error(error);
				resolve(false);
			} else {
				resolve(true);
			}
		});
	});
};