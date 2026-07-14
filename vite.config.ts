import { defineConfig, type ServerOptions, type ViteDevServer } from 'vite';
import electron from 'vite-plugin-electron/simple';
import vue from '@vitejs/plugin-vue';
import ping from 'ping';
import url from 'url';

export const pingApiPlugin = {
	name: 'local-ping-api',
	configureServer(server: ViteDevServer) {
		server.middlewares.use('/api-ping', async (req, res) => {
			try {
				// Extract the IP address from the request URL
				const parsedUrl = url.parse(req.url || '', true);
				const targetIp = parsedUrl.query.ip as string;

				if (!targetIp) {
					res.statusCode = 400;
					return res.end(JSON.stringify({ error: 'IP is required' }));
				}

				// Perform the actual network ping
				const result = await ping.promise.probe(targetIp, {
					timeout: 2, // 2-second timeout
				});

				// Send the results back to the Vue frontend
				res.setHeader('Content-Type', 'application/json');
				res.end(
					JSON.stringify({
						ip: targetIp,
						time: result.time,
						alive: result.alive,
					}),
				);
			} catch (error) {
				res.statusCode = 500;
				res.end(JSON.stringify({ error: 'Ping execution failed' }));
			}
		});
	},
};

export const electronPlugin = electron({
	main: {
		// This is your Node.js backend
		entry: 'electron/main.ts',
	},
	preload: {
		// This bridges Node.js and your Vue frontend safely
		input: 'electron/preload.ts',
	},
	// Injects Node.js API polyfills for the Vue renderer if needed
	renderer: {},
});

export const viteDevServerConfig: ServerOptions = {
	proxy: {
		'/api-steam': {
			target: 'https://api.steampowered.com',
			changeOrigin: true,
			rewrite: (path) => path.replace(/^\/api-steam/, ''),
		},
	},
};

export default defineConfig((args) => {
	console.log(`vite.defineConfig().args:`, args);

	const isElectron = args.mode === 'electron';

	return {
		plugins: [
			vue(),
			pingApiPlugin,
			...(isElectron ? [electronPlugin] : [])
		],
		server: !isElectron ? viteDevServerConfig : undefined,
	};
});
