import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { installIpcLogger } from 'electron-ipc-logger';
import {
	APP_ID,
	APP_NAME,
	APP_NAME_TITLE_CASE,
	APP_NAME_TITLE_CASE_NO_SPACE,
	isOsMac,
	FIREWALL_BLOCK_IP_RULE_NAME_LEVEL_1,
	FIREWALL_BLOCK_IP_RULE_NAME_LEVEL_2,
} from '../Vue/utils/Common.util';
import path, { dirname } from 'path';
import sudo from '@vscode/sudo-prompt';
import ping from 'ping';
import fs from 'fs';
import os from 'os';
import logger from 'electron-log/main';
import type { SyncFirewallResponse } from '../types';

const osPlatform = os.platform();

const __exePath = app.getPath('exe');
const __exeDir = isOsMac(osPlatform)
	? path.join(path.dirname(__exePath), '../../../../')
	: path.dirname(__exePath);
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

const firewallRuleNameParts = getFirewallRuleName();

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
	ipcMain.handle('quit-app', handle_QuitApp);

	createWindow();
});

app.on('window-all-closed', () => {
	logger.info(`window-all-closed - Quitting app!`);
	logger.info(
		`--------------------------------------------------------------------------------------------\r\n`,
	);
	app.quit();
});

async function handle_GetOsPlatform(): Promise<NodeJS.Platform> {
	logger.info(`IPC handler for 'get-os-platform'`);
	return osPlatform;
}

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
}

async function handle_FetchSteamAppInfo(_: Electron.IpcMainInvokeEvent, steamAppId: string) {
	logger.info(`IPC handler for 'fetch-steam-app-info', steamAppId:`, steamAppId);
	const response = await fetch(
		`https://store.steampowered.com/api/appdetails?appids=${steamAppId}`,
	);
	if (!response.ok) throw new Error(`Failed to fetch Store details for App ${steamAppId}`);
	return await response.json();
}

async function handle_FetchSteamAppSdrConfig(_: Electron.IpcMainInvokeEvent, steamAppId: string) {
	logger.info(`IPC handler for 'fetch-steam-app-sdr-config', steamAppId:`, steamAppId);
	const response = await fetch(
		`https://api.steampowered.com/ISteamApps/GetSDRConfig/v1?appid=${steamAppId}`,
	);
	if (!response.ok) throw new Error(`Failed to fetch Steam data for App ${steamAppId}`);
	return await response.json();
}

async function handle_PingServer(_: Electron.IpcMainInvokeEvent, ip: string) {
	// logger.info(`IPC handler for 'ping-server', IP:`, ip);
	try {
		const result = await ping.promise.probe(ip, { timeout: 2 });
		return result.alive && typeof result.time === 'number' ? Math.round(result.time) : 9999;
	} catch {
		return 9999;
	}
}

async function handle_GetBlockedIps(_: Electron.IpcMainInvokeEvent, steamAppId: string) {
	logger.info(`IPC handler for 'get-blocked-ips', steamAppId:`, steamAppId);

	const blockedIpsOutPath = path.join(os.tmpdir(), `${APP_NAME}-fw-blocked-ips-out.txt`);
	let success = false;

	if (osPlatform === 'win32') {
		// WINDOWS: Query the OS Firewall directly (No admin required for reading)
		return new Promise((resolve) => {
			const deprecatedFirewallRuleName = `_${APP_NAME_TITLE_CASE_NO_SPACE}-SDRBlock*`;

			const psCommand = `$f = Get-NetFirewallRule -DisplayName '${deprecatedFirewallRuleName}','${firewallRuleNameParts.level1}' -ErrorAction SilentlyContinue | Get-NetFirewallAddressFilter; if ($f) { $f.RemoteAddress }`;
			exec(`powershell -NoProfile -Command "${psCommand}"`, (err, stdout) => {
				if (err || !stdout) {
					return resolve([]);
				}
				const ips = stdout
					.split('\n')
					.map((line) => line.trim())
					.filter((line) => line.length > 0);
				resolve(ips);
			});
		});
	}

	// --- LINUX (linux) ---
	else if (osPlatform === 'linux') {
		const tableName = firewallRuleNameParts.level1;
		const tableChainName = firewallRuleNameParts.level2;

		const linuxCommand = getLinuxCommand_BlockedIps({ tableName, tableChainName, blockedIpsOutPath });

		// Linux IPTables ALWAYS requires root
		success = await runElevated(linuxCommand);
	}

	// --- macOS (darwin) ---
	else if (osPlatform === 'darwin') {
		const macCommand = getMacCommand_BlockedIps({
			anchorName: firewallRuleNameParts.level1,
			anchorTableName: firewallRuleNameParts.level2,
			blockedIpsOutPath,
		});

		// Mac PF ALWAYS requires sudo
		success = await runElevated(macCommand);
	}

	// --- Process the Blocked IPs Result File for Linux/Mac ---
	let blockedIps: string[] = [];

	if (success && fs.existsSync(blockedIpsOutPath)) {
		// Read the blocked IPs file generated by the OS Firewall command
		const rawOutput = fs.readFileSync(blockedIpsOutPath, 'utf-8');
		blockedIps = rawOutput
			.split('\n')
			.map((line) => line.trim().replace(/[\0\r]/g, ''))
			.filter((line) => line.length > 0);

		// Delete the temp output file
		try {
			fs.rmSync(blockedIpsOutPath);
		} catch (error) {
			logger.error(`File Delete Failure, file:`, blockedIpsOutPath, `Error:`, error);
		}
	} else if (success) {
		// Fallback to reading config file if the file writing command failed for any reason
		blockedIps = await readBlockedIpsFromLocalFile();
	}

	// Return the actual network firewall-blocked IPs back
	return blockedIps;
}

async function handle_SyncFirewall(
	_: Electron.IpcMainInvokeEvent,
	ips: string[],
	elevate: boolean,
	steamAppId: string,
): Promise<SyncFirewallResponse> {
	logger.info(`IPC handler for 'sync-firewall'`);
	logger.info(`Arguments.ips:`, JSON.stringify(ips));
	logger.info(`Arguments.elevate:`, JSON.stringify(elevate));
	logger.info(`Arguments.steamAppId:`, JSON.stringify(steamAppId));

	const syncOutPath = path.join(os.tmpdir(), `${APP_NAME}-fw-sync-${Date.now()}-out.txt`);
	logger.info(`Sync IPs output file path:`, JSON.stringify(syncOutPath));

	let success = false;

	// --- WINDOWS (win32) ---
	if (osPlatform === 'win32') {
		const tempScriptFileName = path.join(os.tmpdir(), `${APP_NAME}-fw-sync-${Date.now()}.ps1`);
		const ipString = ips.map((ip) => `'${ip}'`).join(',');
		const psCommand = `
			$ips = @(${ipString});
			$rule = Get-NetFirewallRule -DisplayName '${firewallRuleNameParts.level1}' -ErrorAction SilentlyContinue;

			# 1. Sync
			if ($ips.Count -eq 0) {
					if ($rule) { Remove-NetFirewallRule -DisplayName '${firewallRuleNameParts.level1}' -ErrorAction SilentlyContinue }
			} else {
					if ($rule) {
							Set-NetFirewallRule -DisplayName '${firewallRuleNameParts.level1}' -RemoteAddress $ips
					} else {
							New-NetFirewallRule -DisplayName '${firewallRuleNameParts.level1}' -Direction Outbound -Action Block -RemoteAddress $ips
					}
			}

			# 2. Get blocked IPs directly from the Windows Firewall and export to temp file
			$f = Get-NetFirewallRule -DisplayName '${firewallRuleNameParts.level1}' -ErrorAction SilentlyContinue | Get-NetFirewallAddressFilter;
			if ($f) {
					$f.RemoteAddress | Out-File -FilePath "${syncOutPath}" -Encoding UTF8
			} else {
					New-Item -Path "${syncOutPath}" -ItemType File -Force
			}

			Remove-Item -Path "${tempScriptFileName}" -Force
		`;
		fs.writeFileSync(tempScriptFileName, psCommand);

		if (elevate) {
			success = await runElevated(
				`powershell -NoProfile -ExecutionPolicy Bypass -File "${tempScriptFileName}"`,
			);
		} else {
			// Run normally...
			success = await new Promise((resolve) =>
				exec(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tempScriptFileName}"`, (err) =>
					resolve(!err),
				),
			);
		}
	}

	// --- LINUX (linux) ---
	else if (osPlatform === 'linux') {
		const tableName = firewallRuleNameParts.level1;
		const tableChainName = firewallRuleNameParts.level2;

		// 1. Sync nftables
		// We use a dedicated table 'ip ${tableName}' and a chain to prevent conflicts
		let bashCommand = `
			nft add table ip ${tableName};
			nft add chain ip ${tableName} ${tableChainName} '{ type filter hook output priority 0; }';
			nft flush chain ip ${tableName} ${tableChainName};
		`;

		ips.forEach(ip => {
			bashCommand += `nft add rule ip ${tableName} ${tableChainName} ip daddr ${ip} drop; `;
		});

		// 2. Get active IPs from nftables rules and output to temp file
		bashCommand += getLinuxCommand_BlockedIps({ tableName, tableChainName, blockedIpsOutPath: syncOutPath });

		// Linux IPTables ALWAYS requires root
		success = await runElevated(bashCommand);
	}

	// --- macOS (darwin) ---
	else if (osPlatform === 'darwin') {
		// macOS uses PF (Packet Filter). Write the blocked IPs to an anchor file and reload it.

		const pfConfPath = '/etc/pf.conf';
		const anchorName = firewallRuleNameParts.level1;
		const anchorTableName = firewallRuleNameParts.level2;
		const anchorFileName = `/etc/pf.anchors/${anchorName}`;

		let anchorIps = ips.join(', ');

		// 1. Sync pfctl
		let macCommand = `
			# Create anchor file with rules
			echo "table <${anchorTableName}> { ${anchorIps} }" > "${anchorFileName}"
			echo "block drop out quick inet from any to <${anchorTableName}> no state" >> "${anchorFileName}"

			# Using anchor file in pfctl

			# Define variables
			CONF_FILE="${pfConfPath}"
			ANCHOR_NAME="${anchorName}"
			ANCHOR_PATH="${anchorFileName}"

			if grep -q "$ANCHOR_NAME" "$CONF_FILE"; then
				# The anchor '$ANCHOR_NAME' is already present in '$CONF_FILE'
				echo "" 2>/dev/null;
			else
				# The anchor is not present '$ANCHOR_NAME' in '$CONF_FILE'
				# Modify '$CONF_FILE'

				# Backup original '$CONF_FILE'
				cp "$CONF_FILE" "$CONF_FILE.bak"

				# Create temporary file for processing
				TMP_FILE=$(mktemp)

				# Flags to trace insertion state
				INSERTED=false

				# 3. Read line by line and insert right before the first 'load anchor \\"com.apple\\"' block
				while IFS= read -r line || [ -n "$line" ]; do
					if [[ "$line" == *"load anchor \\"com.apple\\""* && "$INSERTED" = false ]]; then
						echo "" >> "$TMP_FILE"
						echo "# Custom Steam Relay Server Picker Anchor" >> "$TMP_FILE"
						echo "load anchor \\"$ANCHOR_NAME\\" from \\"$ANCHOR_PATH\\"" >> "$TMP_FILE"
						echo "anchor \\"$ANCHOR_NAME\\"" >> "$TMP_FILE"
						echo "" >> "$TMP_FILE"
						INSERTED=true
					fi
					echo "$line" >> "$TMP_FILE"
				done < "$CONF_FILE"

				# If no com.apple line was found, append it cleanly at the end
				if [ "$INSERTED" = false ]; then
					echo "" >> "$TMP_FILE"
					echo "# Custom Steam Relay Server Picker Anchor" >> "$TMP_FILE"
					echo "load anchor \\"$ANCHOR_NAME\\" from \\"$ANCHOR_PATH\\"" >> "$TMP_FILE"
					echo "anchor \\"$ANCHOR_NAME\\"" >> "$TMP_FILE"
				fi

				# 4. Save changes back to /etc/pf.conf
				cp "$TMP_FILE" "$CONF_FILE"
				rm "$TMP_FILE"
			fi

			# 5. Flush state tables and reload the firewall configuration cleanly
			pfctl -a "${APP_ID}" -F all
			pfctl -F all -f /etc/pf.conf -e 2>/dev/null;
		`;

		// 2. Get active IPs from pfctl and output to temp file (grepping IPv4 addresses)
		macCommand += getMacCommand_BlockedIps({
			anchorName: APP_ID,
			anchorTableName,
			blockedIpsOutPath: syncOutPath,
		});

		logger.info('macCommand:', macCommand);

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
		blockedIps = rawOutput
			.split('\n')
			.map((line) => line.trim().replace(/[\0\r]/g, ''))
			.filter((line) => line.length > 0);

		// Delete the temp output file
		try {
			fs.rmSync(syncOutPath);
		} catch (error) {
			logger.error(`File Delete Failure, file:`, syncOutPath, `Error:`, error);
		}

		// Save to local JSON as well as a backup option
		saveBlockedIpsInLocalFile(blockedIps);
	} else if (success) {
		// Fallback to saving config file if the file writing command failed for any reason
		saveBlockedIpsInLocalFile(ips);
		blockedIps = ips;
	}

	logger.info(`Sync IPs output file blocked IPs:`, JSON.stringify(blockedIps));

	// Return the actual network firewall-blocked IPs back
	return { success, blockedIps };
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

		if (process.env.VITE_DEV_SERVER_URL && !args.some((a) => a.startsWith('--dev-server-url='))) {
			args.push(`--dev-server-url=${process.env.VITE_DEV_SERVER_URL}`);
		}
		let psArgs = args.length > 0 ? args.map((a) => `'${a}'`).join(',') : '';
		logger.info(`psArgs:`, psArgs);
		if (psArgs) {
			psArgs = `-ArgumentList '${psArgs}'`;
		}

		const psCmd = `powershell -NoProfile -Command "Start-Process -FilePath '${exePath}' ${psArgs} -WorkingDirectory '${cwd}' -Verb RunAs"`;
		logger.info(`psCmd:`, psCmd);

		exec(psCmd);
		mainWindow.close();
	} else {
		// macOS/Linux: Do nothing, or log a warning. The UI shouldn't allow this to be clicked.
		logger.warn('Relaunching as root is not supported or recommended on POSIX systems.');
	}
}

function getFirewallRuleName() {
	switch (osPlatform) {
		case 'win32':
			return { level1: `${FIREWALL_BLOCK_IP_RULE_NAME_LEVEL_1}_${FIREWALL_BLOCK_IP_RULE_NAME_LEVEL_2}`, level2: '' };

		case 'linux':
			return { level1: FIREWALL_BLOCK_IP_RULE_NAME_LEVEL_1, level2: FIREWALL_BLOCK_IP_RULE_NAME_LEVEL_2 };

		case 'darwin':
			return { level1: FIREWALL_BLOCK_IP_RULE_NAME_LEVEL_1, level2: FIREWALL_BLOCK_IP_RULE_NAME_LEVEL_2 };

		default:
			return { level1: '', level2: '' };
	}
}

function getLinuxCommand_BlockedIps({
	tableName,
	tableChainName,
	blockedIpsOutPath,
}: {
	tableName: string;
	tableChainName: string;
	blockedIpsOutPath: string;
}) {
	// Note: Use '|| true' so that if there are 0 IPs, grep's exit code 1 doesn't fail the entire script
	return `
		nft list chain ip ${tableName} ${tableChainName} 2>/dev/null | grep -oE '[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+' > "${blockedIpsOutPath}" || true;
		chmod 666 "${blockedIpsOutPath}";
	`;
}

function getMacCommand_BlockedIps({
	anchorName,
	anchorTableName,
	blockedIpsOutPath,
}: {
	anchorName: string;
	anchorTableName: string;
	blockedIpsOutPath: string;
}) {
	return `
		pfctl -a "${anchorName}" -t "${anchorTableName}" -T show 2>/dev/null | grep -oE '[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+' > "${blockedIpsOutPath}";
		chmod 666 "${blockedIpsOutPath}";
	`;
}

function getBlockedIpsLocalFilePath() {
	return path.join(BASE_CONFIG_SAVE_DIRECTORY, `blocked_ips.json`);
}

async function handle_QuitApp() {
	logger.info(`IPC handler for 'quit-app'`);
	mainWindow.close();
}

async function saveBlockedIpsInLocalFile(ips: string[]) {
	fs.writeFileSync(getBlockedIpsLocalFilePath(), JSON.stringify(ips));
}

async function readBlockedIpsFromLocalFile() {
	const blockedIpsFilePath = getBlockedIpsLocalFilePath();
	if (fs.existsSync(blockedIpsFilePath)) {
		try {
			const data = fs.readFileSync(blockedIpsFilePath, 'utf-8');
			return JSON.parse(data) as Array<string>;
		} catch (e) {
			logger.error('Failed to parse blocked IPs JSON:', e);
		}
	}
	return [] as Array<string>;
}

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
}
