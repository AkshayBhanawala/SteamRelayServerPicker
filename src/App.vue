<template>
	<div class="app-container">
		<div class="left-panel">
			<div class="panel-content">
				<div class="banner-wrapper">
					<img
						:src="`https://shared.steamstatic.com/store_item_assets/steam/apps/730/header.jpg?t=${epochTime}`"
						alt="Counter-Strike 2 Banner"
						class="banner-image"
					/>
				</div>

				<div class="game-info">
					<h1 class="game-title">Counter-Strike 2</h1>
					<p class="game-description">
						Counter-Strike 2 stands as the largest technical leap forward in Counter-Strike’s
						history, powering features and updates for years to come. Built on the Source 2 engine,
						it introduces physically-based rendering, state-of-the-art architecture tools, and
						upgraded Steam Datagram Relay networks.
					</p>
				</div>
			</div>

			<div class="status-footer">
				<span>Data direct via Steam Datagram Relay (SDR)</span>
				<span class="status-indicator">
					<span class="pulse-dot"></span>
					Client Diagnostics Active
				</span>
			</div>
		</div>

		<div class="right-panel">
			<div class="panel-header">
				<div class="header-text">
					<h2 style="text-align: left;">Network Relay Manager</h2>
					<p>Real-time connection metrics mapped from your device</p>
				</div>
				<div v-if="!isLoading && !errorMessage" class="tracked-count">
					Populations Tracked: <span>{{ locations.length }}</span>
				</div>
			</div>

			<div class="scroll-container">
				<div v-if="isLoading" class="state-container">
					<div class="spinner"></div>
					<p class="pulse-text">Mapping worldwide infrastructure and measuring system latency...</p>
				</div>

				<div v-else-if="errorMessage" class="error-box">
					<p class="error-title">Network Error Encountered</p>
					<p class="error-text">{{ errorMessage }}</p>
				</div>

				<div v-else v-for="(loc, index) in locations" :key="loc.id" class="location-card">
					<button @click="toggleLocation(index)" class="location-toggle">
						<div class="location-identity">
							<span class="loc-id">{{ loc.id }}</span>
							<span class="loc-name">{{ loc.description }}</span>
						</div>

						<div class="location-status">
							<span class="ping-badge" :class="getPingColorClass(loc.avgPing)">
								{{ loc.avgPing ? `${loc.avgPing} ms` : 'Testing...' }}
							</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="2.5"
								stroke="currentColor"
								class="chevron-icon"
								:class="{ rotated: loc.isExpanded }"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M19.5 8.25l-7.5 7.5-7.5-7.5"
								/>
							</svg>
						</div>
					</button>

					<div v-show="loc.isExpanded" class="relays-drawer">
						<div v-for="relay in loc.relays" :key="relay.ipv4" class="relay-row">
							<div class="relay-details">
								<span class="relay-ip">{{ relay.ipv4 }}</span>
								<span class="relay-port">Port Range: {{ relay.port_range.join('-') }}</span>
							</div>
							<span class="ping-badge small" :class="getPingColorClass(relay.ping || 0)">
								{{ relay.ping ? `${relay.ping} ms` : 'Measuring...' }}
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
/* --- Base Layout & Variables ---
*/
:root {
	--bg-dark: #020617;
	--bg-panel: #0f172a;
	--border-color: rgba(30, 41, 59, 0.6);
	--text-main: #f8fafc;
	--text-muted: #94a3b8;
}

.app-container {
	display: flex;
	height: 100vh;
	width: 100%;
	background-color: var(--bg-dark);
	color: var(--text-main);
	font-family: ui-sans-serif, system-ui, sans-serif;
	overflow: hidden;
	box-sizing: border-box;
}

/* --- Left Panel ---
*/
.left-panel {
	width: 50%;
	height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	padding: 3rem;
	border-right: 1px solid var(--border-color);
	background: linear-gradient(to bottom, #0f172a, #020617);
	box-sizing: border-box;
}

.panel-content {
	display: flex;
	flex-direction: column;
	gap: 2rem;
}

.banner-wrapper {
	overflow: hidden;
	border-radius: 0.75rem;
	border: 1px solid rgba(51, 65, 85, 0.5);
	box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.banner-image {
	width: 100%;
	aspect-ratio: 460 / 215;
	object-fit: cover;
	display: block;
	transition: transform 0.7s ease-out;
}

.banner-wrapper:hover .banner-image {
	transform: scale(1.05);
}

.game-title {
	font-size: 2.25rem;
	font-weight: 900;
	text-transform: uppercase;
	font-style: italic;
	letter-spacing: -0.025em;
	margin: 0 0 1rem 0;
	background: linear-gradient(to right, #fb923c, #f59e0b);
	-webkit-background-clip: text;
	background-clip: text;
	color: transparent;
	line-height: 1;
}

.game-description {
	color: var(--text-muted);
	line-height: 1.625;
	font-size: 0.875rem;
	margin: 0;
}

.status-footer {
	padding-top: 1.5rem;
	border-top: 1px solid #0f172a;
	font-size: 0.75rem;
	color: #64748b;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.status-indicator {
	display: flex;
	align-items: center;
	gap: 0.375rem;
}

.pulse-dot {
	width: 0.5rem;
	height: 0.5rem;
	border-radius: 50%;
	background-color: #10b981;
	animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* --- Right Panel ---
*/
.right-panel {
	width: 50%;
	height: 100%;
	display: flex;
	flex-direction: column;
	box-sizing: border-box;
}

.panel-header {
	padding: 2rem;
	border-bottom: 1px solid var(--border-color);
	background-color: rgba(2, 6, 23, 0.8);
	backdrop-filter: blur(12px);
	display: flex;
	justify-content: space-between;
	align-items: center;
	z-index: 10;
}

.header-text h2 {
	font-size: 1.25rem;
	font-weight: 700;
	letter-spacing: 0.025em;
	margin: 0;
}

.header-text p {
	font-size: 0.75rem;
	color: var(--text-muted);
	margin: 0.25rem 0 0 0;
}

.tracked-count {
	font-size: 0.75rem;
	background-color: #0f172a;
	border: 1px solid #1e293b;
	padding: 0.375rem 0.75rem;
	border-radius: 0.375rem;
	color: var(--text-muted);
}

.tracked-count span {
	color: #e2e8f0;
	font-weight: 600;
}

/* --- Scrollable List ---
*/
.scroll-container {
	flex: 1;
	overflow-y: auto;
	padding: 2rem;
	background-color: rgba(2, 6, 23, 0.4);
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

/* Custom Scrollbar */
.scroll-container::-webkit-scrollbar {
	width: 6px;
}
.scroll-container::-webkit-scrollbar-track {
	background: transparent;
}
.scroll-container::-webkit-scrollbar-thumb {
	background: #1e293b;
	border-radius: 9999px;
}
.scroll-container::-webkit-scrollbar-thumb:hover {
	background: #334155;
}

/* --- Server Cards ---
*/
.location-card {
	border: 1px solid var(--border-color);
	border-radius: 0.75rem;
	overflow: hidden;
	background-color: rgba(15, 23, 42, 0.2);
	transition: all 0.2s ease;
}

.location-card:hover {
	border-color: rgba(51, 65, 85, 0.5);
	box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.location-toggle {
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1rem;
	background-color: rgba(15, 23, 42, 0.4);
	border: none;
	color: inherit;
	cursor: pointer;
	transition: background-color 0.2s ease;
}

.location-toggle:hover {
	background-color: rgba(15, 23, 42, 0.8);
}

.location-identity {
	display: flex;
	align-items: center;
	gap: 1rem;
}

.loc-id {
	width: 60px;
	font-size: 0.75rem;
	font-family: monospace;
	font-weight: 700;
	text-transform: uppercase;
	color: #64748b;
	letter-spacing: 0.05em;
	background-color: #020617;
	padding: 0.125rem 0.5rem;
	border-radius: 0.25rem;
	border: 1px solid #1e293b;
}

.loc-name {
	font-weight: 500;
	font-size: 0.875rem;
	color: #e2e8f0;
}

.location-status {
	display: flex;
	align-items: center;
	gap: 1rem;
}

.chevron-icon {
	width: 1rem;
	height: 1rem;
	color: #64748b;
	transition: transform 0.2s ease;
}

.chevron-icon.rotated {
	transform: rotate(180deg);
}

/* --- Children Drawer (Relays) ---
*/
.relays-drawer {
	border-top: 1px solid rgba(30, 41, 59, 0.4);
	background-color: rgba(2, 6, 23, 0.6);
	padding: 0.5rem 1rem;
}

.relay-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.625rem 0;
	border-bottom: 1px solid #0f172a;
}
.relay-row:last-child {
	border-bottom: none;
}

.relay-details {
	display: flex;
	flex-direction: column;
	gap: 0.125rem;
}

.relay-ip {
	font-family: monospace;
	color: #cbd5e1;
	font-weight: 500;
	font-size: 0.75rem;
}

.relay-port {
	font-size: 10px;
	color: #64748b;
	font-family: monospace;
}

/* --- Ping Badges ---
*/
.ping-badge {
	font-size: 0.75rem;
	font-family: monospace;
	font-weight: 700;
	padding: 0.25rem 0.625rem;
	border-radius: 0.375rem;
	border-width: 1px;
	border-style: solid;
}
.ping-badge.small {
	font-size: 11px;
	padding: 0.125rem 0.5rem;
}

.ping-excellent {
	color: #4ade80;
	background-color: rgba(34, 197, 94, 0.1);
	border-color: rgba(34, 197, 94, 0.3);
}
.ping-good {
	color: #10b981;
	background-color: rgba(5, 150, 105, 0.1);
	border-color: rgba(5, 150, 105, 0.3);
}
.ping-fair {
	color: #facc15;
	background-color: rgba(234, 179, 8, 0.1);
	border-color: rgba(234, 179, 8, 0.3);
}
.ping-poor {
	color: #fb923c;
	background-color: rgba(249, 115, 22, 0.1);
	border-color: rgba(249, 115, 22, 0.3);
}
.ping-bad {
	color: #f87171;
	background-color: rgba(239, 68, 68, 0.1);
	border-color: rgba(239, 68, 68, 0.3);
}

/* --- States & Animations ---
*/
.state-container {
	height: 16rem;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 1rem;
}

.spinner {
	width: 2rem;
	height: 2rem;
	border: 2px solid #f97316;
	border-top-color: transparent;
	border-radius: 50%;
	animation: spin 1s linear infinite;
}

.pulse-text {
	font-size: 0.875rem;
	color: var(--text-muted);
	animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.error-box {
	padding: 1.5rem;
	background-color: rgba(69, 10, 10, 0.2);
	border: 1px solid rgba(127, 29, 29, 0.4);
	border-radius: 0.75rem;
	text-align: center;
}

.error-title {
	font-size: 0.875rem;
	color: #f87171;
	font-weight: 500;
	margin: 0 0 0.5rem 0;
}

.error-text {
	font-size: 0.75rem;
	color: #64748b;
	margin: 0;
}

@keyframes spin {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

@keyframes pulse {
	0%,
	100% {
		opacity: 1;
	}
	50% {
		opacity: 0.5;
	}
}
</style>

<script setup lang="ts">
declare global {
	interface Window {
		electronAPI: {
			getSteamSDR: () => Promise<any>;
			ping: (ip: string) => Promise<number>;
		};
	}
}

import { ref, onMounted, computed } from 'vue';

// --- TypeScript Interfaces ---
interface Relay {
	ipv4: string;
	port_range: number[];
	ping?: number;
}

interface PopData {
	desc: string;
	geo: number[];
	partners: number;
	tier: number;
	relays: Relay[];
}

interface SDRConfigResponse {
	revision: number;
	pops: Record<string, PopData>;
}

interface ProcessedLocation {
	id: string;
	description: string;
	relays: Relay[];
	avgPing: number;
	isExpanded: boolean;
}

const isElectron = 'electronAPI' in window;

// --- State Variables ---
const locations = ref<ProcessedLocation[]>([]);
const isLoading = ref<boolean>(true);
const errorMessage = ref<string | null>(null);

// Generate epoch timestamp for Steam asset bust caching
const epochTime = computed(() => Math.floor(Date.now() / 1000));

// --- 1. Unified Ping Function ---
const pingServer = async (ip: string): Promise<number> => {
	try {
		if (isElectron) {
			// DESKTOP MODE: Use native OS Node.js ping
			return await window.electronAPI.ping(ip);
		} else {
			// WEB MODE: Fall back to your web server's proxy backend
			const response = await fetch(`/api-ping?ip=${ip}`);
			const data = await response.json();
			return data.alive && typeof data.time === 'number' ? Math.round(data.time) : 9999;
		}
	} catch (err) {
		return 9999;
	}
};

// --- 2. Unified Steam Data Fetching ---
const fetchSteamSDRConfig = async (): Promise<SDRConfigResponse> => {
	if (isElectron) {
		// DESKTOP MODE: Bypasses CORS completely
		return await window.electronAPI.getSteamSDR();
	} else {
		// WEB MODE: Relies on Vite proxy (dev) or your real backend (production)
		const response = await fetch('/api-steam/ISteamApps/GetSDRConfig/v1?appid=730');
		if (!response.ok) throw new Error('Failed to retrieve SDR Configuration.');
		return await response.json();
	}
};

// --- Standardized CSS Class Mapper for Pings ---
const getPingColorClass = (ping: number): string => {
	if (ping <= 50) return 'ping-excellent';
	if (ping <= 100) return 'ping-good';
	if (ping <= 200) return 'ping-fair';
	if (ping <= 300) return 'ping-poor';
	return 'ping-bad';
};

// --- Data Fetching & Processing Lifecycle ---
onMounted(async () => {
	try {
		isLoading.value = true;

		const sdrConfigResponse: SDRConfigResponse = await fetchSteamSDRConfig();
		// console.log(`sdrConfigResponse:`, sdrConfigResponse);

		// Parse response into working structures
		const tempLocations: ProcessedLocation[] = Object.entries(sdrConfigResponse.pops)
			.map(([key, value]) => ({
				id: key,
				description: value.desc,
				relays: value.relays?.map((r) => ({ ...r, ping: undefined })),
				avgPing: 0,
				isExpanded: false,
			}))
			.filter((v) => v.relays?.length)
			.filter((v) => [`bom2`, `maa2`, `hkg`, `eze`].includes(v.id));
		// console.log(`tempLocations:`, tempLocations);

		locations.value = tempLocations;
		isLoading.value = false;

		// Concurrently trigger asynchronous ping tests across all points
		await Promise.all(
			locations.value.map(async (loc, i) => {
				loc = locations.value.at(i)!;
				// console.log(`loc: ${loc.id}`, loc);

				let dynamicSum = 0;

				const pingPromises = loc.relays?.map(async (relay) => {
					const latency = await pingServer(relay.ipv4);
					relay.ping = latency;
					dynamicSum += latency;
				});
				// console.log(`pingPromises:`, pingPromises);

				await Promise.all(pingPromises);

				// Calculate the location's total average latency profile
				loc.avgPing = loc.relays.length > 0 ? Math.round(dynamicSum / loc.relays.length) : 999;
			}),
		);

		// Sort locations dynamically: lowest latency pops to the top
		locations.value.sort((a, b) => a.avgPing - b.avgPing);
	} catch (err: any) {
		console.error('Error:', err);
		errorMessage.value = err.message || 'An unexpected error occurred.';
		isLoading.value = false;
	}
});

const toggleLocation = (index: number) => {
	locations.value[index].isExpanded = !locations.value[index].isExpanded;
};
</script>
