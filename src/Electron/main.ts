import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import ping from 'ping';
import { exec } from 'child_process';
import sudo from '@vscode/sudo-prompt';
import fs from 'fs';
import os from 'os';
import { installIpcLogger } from 'electron-ipc-logger';
import logger from 'electron-log/main';

const __exePath = app.getPath('exe');
const __exeDir = path.dirname(__exePath);
const __appAsarPath = app.getAppPath();

let __fileStorageBasePath = '';
if (app.isPackaged) {
	__fileStorageBasePath = __exeDir;
} else {
	__fileStorageBasePath = path.join(__appAsarPath, 'release'); ;
}
logger.transports.file.resolvePathFn = (variables) => {
	return path.join(__fileStorageBasePath, 'logs', variables.fileName || 'main.log');
};

logger.initialize();
logger.info(`Application is starting up...`);
logger.info(`app.isPackaged?:`, app.isPackaged);

logger.log(`__exePath:`, __exePath);
logger.log(`__exeDir:`, __exeDir);
logger.log(`__appAsarPath:`, __appAsarPath);
logger.log(`__fileStorageBasePath:`, __fileStorageBasePath);

const __appIconPath = path.join(__appAsarPath, 'public', 'icons', 'icon.ico');
logger.log(`__appIconPath:`, __appIconPath);

const __entrypointFile = fileURLToPath(import.meta.url);
logger.log(`__entrypointFile:`, __entrypointFile);

const __entrypointDir = dirname(__entrypointFile);
logger.log(`__entrypointDir:`, __entrypointDir);

const __preloadFilePath = path.join(__entrypointDir, 'preload.mjs');
logger.log(`__preloadFilePath:`, __preloadFilePath);

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

const BASE_CONFIG_SAVE_DIRECTORY = path.join(__fileStorageBasePath, 'config');
const BASE_FIREWALL_RULE_NAME = `_SteamRelayServerPicker-SDRBlock--`;
const getConfigFilePath = (appId: string) => path.join(BASE_CONFIG_SAVE_DIRECTORY, `blocked_ips_${appId}.json`);
const getRuleName = (appId: string) => `${BASE_FIREWALL_RULE_NAME}${appId}`;

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

// Helper: Check if running as Admin in Windows
const checkAdmin = (): Promise<boolean> => {
	const os = process.platform;
	if (os === 'win32') {
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

const saveIpsLocally = (ips: string[], appId: string) => {
	fs.writeFileSync(getConfigFilePath(appId), JSON.stringify(ips));
};

const runElevated = (command: string, name: string = 'Steam Relay Server Picker'): Promise<boolean> => {
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

app.whenReady().then(async () => {
	if (app.isPackaged) {
		// Remove the default menu completely
		Menu.setApplicationMenu(null);
	} else {
		await installIpcLogger({ parent: mainWindow });
	}
	console.log('GPU Feature Status:', app.getGPUFeatureStatus());

	ipcMain.handle('fetch-app-details', async (_, appId: string) => {
		const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
		if (!response.ok) throw new Error(`Failed to fetch Store details for App ${appId}`);
		return await response.json();
	});

	ipcMain.handle('fetch-steam-data', async (_, appId: string) => {
		const response = await fetch(`https://api.steampowered.com/ISteamApps/GetSDRConfig/v1?appid=${appId}`);
		if (!response.ok) throw new Error(`Failed to fetch Steam data for App ${appId}`);
		return await response.json();
	});

	ipcMain.handle('ping-server', async (_, ip: string) => {
		try {
			const result = await ping.promise.probe(ip, { timeout: 2 });
			return (result.alive && typeof result.time === 'number') ? Math.round(result.time) : 9999;
		} catch {
			return 9999;
		}
	});

	ipcMain.handle('check-admin', async () => {
		return await checkAdmin();
	});

	ipcMain.handle('get-blocked-ips', async (_, appId: string) => {
		const os = process.platform;
		const ruleName = getRuleName(appId);

		if (os === 'win32') {
			// WINDOWS: Query the OS Firewall directly (No admin required for reading)
			return new Promise((resolve) => {
				const psCommand = `$f = Get-NetFirewallRule -DisplayName '${ruleName}' -ErrorAction SilentlyContinue | Get-NetFirewallAddressFilter; if ($f) { $f.RemoteAddress }`;

				exec(`powershell -NoProfile -Command "${psCommand}"`, (err, stdout) => {
					if (err || !stdout) return resolve([]);

					const ips = stdout.split('\n')
						.map(line => line.trim())
						.filter(line => line.length > 0);

					resolve(ips);
				});
			});
		} else {
			// MAC/LINUX: Read from the local state file to avoid sudo prompts on boot
			const blockedIpsFilePath = getConfigFilePath(appId);
			if (fs.existsSync(blockedIpsFilePath)) {
				try {
					const data = fs.readFileSync(blockedIpsFilePath, 'utf-8');
					return JSON.parse(data);
				} catch (e) {
					logger.error("Failed to parse blocked IPs JSON:", e);
					return [];
				}
			}
			return []; // Return empty array if file doesn't exist yet
		}
	});

	ipcMain.handle('sync-firewall', async (_, ips: string[], elevate: boolean, appId: string) => {
		const osName = process.platform;
		const ruleName = getRuleName(appId);
		let success = false;

		// --- WINDOWS (win32) ---
		if (osName === 'win32') {
			const tempScriptFileName = path.join(os.tmpdir(), `steam-relay-server-picker-fw-sync-${Date.now()}.ps1`);
			const ipString = ips.map(ip => `'${ip}'`).join(',');
			const psCommand = `
				$ips = @(${ipString});
				$rule = Get-NetFirewallRule -DisplayName '${ruleName}' -ErrorAction SilentlyContinue;
				if ($ips.Count -eq 0) { if ($rule) { Remove-NetFirewallRule -DisplayName '${ruleName}' -ErrorAction SilentlyContinue } }
				else {
					if ($rule) {
						Set-NetFirewallRule -DisplayName '${ruleName}' -RemoteAddress $ips
					} else {
						New-NetFirewallRule -DisplayName '${ruleName}' -Direction Outbound -Action Block -RemoteAddress $ips
					}
				}
				Remove-Item -Path "${tempScriptFileName}" -Force
			`;
			fs.writeFileSync(tempScriptFileName, psCommand);

			if (elevate) {
				// On Windows, sudo-prompt works, or you can stick to your Start-Process Verb RunAs script
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
		else if (osName === 'linux') {
			// Linux uses iptables. We flush our custom chain, then add the new IPs.
			let bashCommand = `
				iptables -F ${ruleName} 2>/dev/null || iptables -N ${ruleName};
				iptables -D OUTPUT -j ${ruleName} 2>/dev/null;
				iptables -I OUTPUT -j ${ruleName};
			`;
			ips.forEach(ip => {
				bashCommand += `iptables -A ${ruleName} -d ${ip} -j DROP; `;
			});

			// Linux IPTables ALWAYS requires root
			success = await runElevated(bashCommand);
		}

		// --- macOS (darwin) ---
		else if (osName === 'darwin') {
			// macOS uses PF (Packet Filter). We write the blocked IPs to an anchor file and reload it.
			const ipString = ips.map(ip => `"${ip}"`).join(', ');
			const anchorContent = ips.length > 0 ? `block drop out proto udp to { ${ipString} }` : '';

			const macCommand = `
				echo '${anchorContent}' > /tmp/${ruleName}_pf_rule;
				pfctl -a com.th3az.steam-relay-server-picker -f /tmp/${ruleName}_pf_rule;
				pfctl -E;
			`;

			// Mac PF ALWAYS requires sudo
			success = await runElevated(macCommand);
		}

		if (success) {
			saveIpsLocally(ips, appId);
		}

		return success;
	});

	ipcMain.handle('relaunch-elevated', () => {
		logger.info(`IPC handler for 'relaunch-elevated'`);
		logger.info(`process.platform:`, process.platform);

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
	});

	createWindow();
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});