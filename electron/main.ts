import { app, BrowserWindow, ipcMain } from 'electron';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import ping from 'ping';

// --- Reconstruct __dirname for ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		minWidth: 900,
		minHeight: 600,
		backgroundColor: '#020617',
		webPreferences: {
			preload: path.join(__dirname, 'preload.mjs'),
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	// Load the Vite dev server in development, or the built HTML in production
	if (process.env.VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
	} else {
		mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
	}
};

app.whenReady().then(() => {
	// 1. Intercept Steam API calls (Bypasses CORS entirely)
	ipcMain.handle('fetch-steam-data', async () => {
		const response = await fetch('https://api.steampowered.com/ISteamApps/GetSDRConfig/v1?appid=730');
		if (!response.ok) throw new Error('Failed to fetch Steam data');
		return await response.json();
	});

	// 2. Intercept Ping calls (Uses OS-level Node networking)
	ipcMain.handle('ping-server', async (_, ip: string) => {
		try {
			const result = await ping.promise.probe(ip, { timeout: 2 });
			if (result.alive && typeof result.time === 'number') {
				return Math.round(result.time);
			}
			return 999;
		} catch {
			return 999;
		}
	});

	createWindow();
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});