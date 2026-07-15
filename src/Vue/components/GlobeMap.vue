<template>
	<div class="map-container" ref="mapContainerWrapper" v-show="!isSettingsOpen">
		<!-- <FPSCounter class="fps-counter"></FPSCounter> -->
		<canvas
			ref="mapCanvas"
			width="800"
			height="600"
			class="map-canvas"
			@mousemove="handleMapMouseMove"
			@mouseleave="handleMapMouseLeave"
			@click="handleMapClick"
		></canvas>

		<div
			v-if="hoveredLoc"
			class="map-tooltip"
			:style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px' }"
		>
			<h4>{{ hoveredLoc.description }} ({{ hoveredLoc.id }})</h4>
			<div class="tooltip-ips">
				<div
					v-for="relay in hoveredLoc.relays"
					:key="relay.ipv4"
					:style="{ color: getPingColorHex(relay.ping || 9999) }"
				>
					<span>{{ relay.ipv4 }}</span>
					<span v-if="relay.blocked">🔒 Blocked</span>
					<span v-else>
						{{
							relay.ping ? (isMaxPing(relay.ping) ? `Timeout` : `${relay.ping} ms`) : 'Measuring...'
						}}
					</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, toRaw } from 'vue';
import * as d3 from 'd3';
import { isMaxPing } from '../utils/Common.util';
import type { ProcessedLocation } from '../../types';

const props = defineProps<{
	locations: ProcessedLocation[];
	isSettingsOpen: boolean;
}>();

const emit = defineEmits<{
	(e: 'location-click', locId: string): void;
}>();

// --- Map State Variables ---
const geoFeatures = ref<any[]>([]);
const mapCanvas = ref<HTMLCanvasElement | null>(null);
const zoomScale = ref<number>(1);
const hoveredLoc = ref<ProcessedLocation | null>(null);
const tooltipPos = ref({ x: 0, y: 0 });

// 3D Globe specific state
let targetZoom = 1;
let currentZoom = 1;
let targetRotation: [number, number] = [0, 0];
let currentRotation: [number, number] = [0, 0];
const isHoveringGlobe = ref(false);
const isDragging = ref(false);
let isAnimating = false;
let resizeObserver: ResizeObserver | null = null;
const mapContainerWrapper = ref<HTMLElement | null>(null);

let width = 800;
let height = 600;
let initialScale: number = 0;
let projection: d3.GeoProjection;
let pathGenerator: d3.GeoPath<any, d3.GeoPermissibleObjects>;

const fetchMapData = async () => {
	try {
		const res = await fetch(
			'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson',
		);
		const data = await res.json();
		geoFeatures.value = data.features;
	} catch (e) {
		console.error('Failed to load map geometry', e);
	}
};

const drawMap = () => {
	const canvas = mapCanvas.value;
	if (!canvas || canvas.clientWidth === 0) return;

	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	if (hoveredLoc.value) {
		canvas.style.cursor = 'pointer';
	} else if (isHoveringGlobe.value) {
		canvas.style.cursor = isDragging.value ? 'grabbing' : 'grab';
	} else {
		canvas.style.cursor = 'default';
	}

	pathGenerator.context(ctx);
	ctx.clearRect(0, 0, width, height);

	// 1. Draw Atmospheric Outer Glow
	const cx = width / 2;
	const cy = height / 2;
	const currentRadius = initialScale * currentZoom;

	const atmosGradient = ctx.createRadialGradient(
		cx,
		cy,
		currentRadius * 0.95,
		cx,
		cy,
		currentRadius * 1.15,
	);
	atmosGradient.addColorStop(0, '#00a6fb44');
	atmosGradient.addColorStop(1, '#00a6fb00');

	ctx.beginPath();
	ctx.arc(cx, cy, currentRadius * 1.15, 0, 2 * Math.PI);
	ctx.fillStyle = atmosGradient;
	ctx.fill();

	// 2. Draw Holographic Ocean
	ctx.beginPath();
	pathGenerator({ type: 'Sphere' } as d3.GeoPermissibleObjects);
	ctx.fillStyle = '#1b9aaa77';
	ctx.fill();
	ctx.strokeStyle = '#00a6fb';
	ctx.lineWidth = 2;
	ctx.stroke();

	// 3. Draw Countries
	ctx.beginPath();
	const rawGeo = toRaw(geoFeatures.value);
	rawGeo.forEach((f) => pathGenerator(f));

	ctx.fillStyle = '#020617';
	ctx.fill();
	ctx.strokeStyle = '#1e293b';
	ctx.lineWidth = 1;
	ctx.stroke();

	// 3.5 Draw Inner Vignette (3D Sphere Depth)
	const vignette = ctx.createRadialGradient(
		cx, cy, currentRadius * 0.1, // Start fading near the middle
		cx, cy, currentRadius * 1.02 // End exactly at the globe edge
	);
	vignette.addColorStop(0, 'rgba(2, 6, 23, 0)'); // Transparent core
	vignette.addColorStop(1, 'rgba(2, 6, 23, 0.9)'); // Dark edges matching background

	ctx.beginPath();
	ctx.arc(cx, cy, currentRadius, 0, 2 * Math.PI);
	ctx.fillStyle = vignette;
	ctx.fill();

	const center = projection.invert!([cx, cy]);
	if (!center) return;

	// 4. Draw Server Nodes
	const rawLocations = toRaw(props.locations);

	rawLocations.forEach((loc) => {
		if (!loc.geo) return;
		const lat = loc.geo[1];
		const lon = loc.geo[0];

		// Calculate the exact distance from the center of our view
		const distance = d3.geoDistance([lon, lat], center);
		// The absolute horizon is exactly 90 degrees (Math.PI / 2)
		const horizon = Math.PI / 2;
		if (distance > horizon) return;

		const proj = projection([lon, lat]);
		if (!proj) return;

		// --- Graceful Fade Math ---
		// Start fading the dot when it is about 17 degrees away from the edge
		const fadeThreshold = horizon - 0.3;
		let dotOpacity = 1;
		if (distance > fadeThreshold) {
			// Calculate a value between 1.0 (fully visible) and 0.0 (invisible)
			dotOpacity = Math.max(0, 1 - (distance - fadeThreshold) / (horizon - fadeThreshold));
		}

		const isHovered = hoveredLoc.value?.id === loc.id;
		// Base radius scaled by zoom, and slightly shrunk as it curves away for forced perspective
		const baseRadius = (isHovered ? 10 : 5) / Math.pow(currentZoom, 0.3);
		const radius = baseRadius * (0.6 + 0.4 * dotOpacity);
		const baseColor = getPingColorHex(loc.avgPing);

		// Opacity
		ctx.globalAlpha = dotOpacity;

		// Glow
		ctx.beginPath();
		ctx.arc(proj[0], proj[1], radius * 2, 0, 2 * Math.PI);
		ctx.fillStyle = baseColor + '44';
		ctx.fill();

		// Core Dot
		ctx.beginPath();
		ctx.arc(proj[0], proj[1], radius, 0, 2 * Math.PI);
		ctx.fillStyle = baseColor;
		ctx.fill();

		// Border
		ctx.strokeStyle = '#FFFFFF';
		ctx.lineWidth = 1;
		ctx.stroke();

		// Reset alpha for the next dot
		ctx.globalAlpha = 1.0;
	});

	ctx.globalCompositeOperation = 'source-over';
};

const handleMapMouseMove = (event: MouseEvent) => {
	const canvas = mapCanvas.value;
	if (!canvas) return;

	const rect = canvas.getBoundingClientRect();
	const mouseX = event.clientX - rect.left;
	const mouseY = event.clientY - rect.top;

	// Calculate if mouse is physically inside the globe's radius
	const dxGlobe = mouseX - width / 2;
	const dyGlobe = mouseY - height / 2;
	isHoveringGlobe.value =
		Math.sqrt(dxGlobe * dxGlobe + dyGlobe * dyGlobe) <= initialScale * currentZoom;

	let foundLoc = null;
	const center = projection.invert!([width / 2, height / 2]);

	if (center) {
		const rawLocations = toRaw(props.locations);
		for (const loc of rawLocations) {
			if (!loc.geo) continue;
			const lat = loc.geo[1];
			const lon = loc.geo[0];

			if (d3.geoDistance([lon, lat], center) > Math.PI / 2) continue;
			const proj = projection([lon, lat]);
			if (!proj) continue;

			const dx = mouseX - proj[0];
			const dy = mouseY - proj[1];
			if (Math.sqrt(dx * dx + dy * dy) < 20) {
				foundLoc = loc;
				break;
			}
		}
	}

	if (foundLoc) {
		if (hoveredLoc.value?.id !== foundLoc.id) {
			hoveredLoc.value = foundLoc;
		}
		tooltipPos.value = { x: event.clientX + 15, y: event.clientY + 15 };
	} else if (hoveredLoc.value) {
		hoveredLoc.value = null;
	}
};

const handleMapMouseLeave = () => {
	hoveredLoc.value = null;
	isHoveringGlobe.value = false;
};

const handleMapClick = () => {
	if (hoveredLoc.value) {
		emit('location-click', hoveredLoc.value.id);
	}
};

const getPingColorHex = (ping: number) => {
	if (ping === 999 || !ping) return '#ef4444';
	if (ping <= 50) return '#10b981';
	if (ping <= 100) return '#eab308';
	if (ping <= 200) return '#f97316';
	return '#ef4444';
};

const handleResize = (entries: ResizeObserverEntry[]) => {
	for (let entry of entries) {
		const newWidth = entry.contentRect.width;
		const newHeight = entry.contentRect.height;

		if (newWidth === 0 || newHeight === 0) continue;

		width = newWidth;
		height = newHeight;

		// Re-center projection based on dynamic size
		projection.translate([width / 2, height / 2]);

		if (mapCanvas.value) {
			// Handle High-DPI/Retina Displays
			const dpr = window.devicePixelRatio || 1;
			mapCanvas.value.width = width * dpr;
			mapCanvas.value.height = height * dpr;
			mapCanvas.value.style.width = `${width}px`;
			mapCanvas.value.style.height = `${height}px`;

			const ctx = mapCanvas.value.getContext('2d');
			if (ctx) ctx.scale(dpr, dpr);
		}

		if (!isAnimating) drawMap(); // Draw immediately to prevent flicker on resize
	}
};

const setupMap = () => {
	if (mapCanvas.value) {
		const mapWrapperWidth = mapCanvas.value.parentElement?.clientWidth || 800;
		const mapWrapperHeight = mapCanvas.value.parentElement?.clientHeight || 600;
		initialScale = Math.min(mapWrapperWidth, mapWrapperHeight) * 0.4;
		projection = d3
			.geoOrthographic()
			.scale(initialScale)
			.translate([width / 2, height / 2]);
		pathGenerator = d3.geoPath().projection(projection);

		// Setup dynamic resizer
		if (mapContainerWrapper.value) {
			resizeObserver = new ResizeObserver(handleResize);
			resizeObserver.observe(mapContainerWrapper.value);
		}

		let lastX = 0;
		let lastY = 0;

		const zoom = d3
			.zoom<HTMLCanvasElement, unknown>()
			.scaleExtent([1, 8])
			.on('start', (event) => {
				isDragging.value = true;
				lastX = event.transform.x;
				lastY = event.transform.y;
			})
			.on('zoom', (event) => {
				targetZoom = event.transform.k;

				if (event.sourceEvent) {
					if (event.sourceEvent.type === 'wheel') {
						const cssMouse = d3.pointer(event.sourceEvent, mapCanvas.value);
						const geoPos = projection.invert!(cssMouse);

						if (geoPos && event.transform.k > currentZoom) {
							const targetLon = -geoPos[0];
							const targetLat = -geoPos[1];
							targetRotation[0] += (targetLon - targetRotation[0]) * 0.8;
							targetRotation[1] += (targetLat - targetRotation[1]) * 0.8;
						}
					} else {
						const dx = event.transform.x - lastX;
						const dy = event.transform.y - lastY;
						const sensitivity = 0.5 / currentZoom;
						targetRotation[0] += dx * sensitivity;
						targetRotation[1] -= dy * sensitivity;
					}
				}

				targetRotation[1] = Math.max(-90, Math.min(90, targetRotation[1]));
				lastX = event.transform.x;
				lastY = event.transform.y;
			})
			.on('end', () => {
				isDragging.value = false;
			});

		d3.select(mapCanvas.value)
			.call(zoom)
			.on('dblclick.zoom', (event) => {
				const cssMouse = d3.pointer(event, mapCanvas.value);
				const geoPos = projection.invert!(cssMouse);

				if (geoPos) {
					targetRotation[0] = -geoPos[0];
					targetRotation[1] = -geoPos[1];
					d3.select(mapCanvas.value!).transition().duration(0).call(zoom.scaleBy, 2);
				}
			});

		isAnimating = true;
		d3.timer(() => {
			if (!isDragging.value) {
				targetRotation[0] += 0.02 / currentZoom;
			}
			currentZoom += (targetZoom - currentZoom) * 0.15;
			projection.scale(initialScale * currentZoom);
			zoomScale.value = currentZoom;
			currentRotation[0] += (targetRotation[0] - currentRotation[0]) * 0.15;
			currentRotation[1] += (targetRotation[1] - currentRotation[1]) * 0.15;
			projection.rotate([currentRotation[0], currentRotation[1], 0]);
			drawMap();
		});
	}
};

onMounted(() => {
	fetchMapData();
	setupMap();
});

onBeforeUnmount(() => {
	if (resizeObserver) resizeObserver.disconnect();
	isAnimating = false;
});
</script>

<style scoped>
.map-container {
	flex: 1;
	width: 100%;
	height: 100%;
	position: relative;
	overflow: hidden;
	border-top: 1px solid #1e293b;
	border-bottom: 1px solid #1e293b;
	background-color: #00000044;
}
.fps-counter {
	position: absolute;
	top: 0;
	right: 0;
}
.map-canvas {
	display: block;
	width: 100%;
	height: 100%;
	outline: none;
	user-select: none;
}
.map-tooltip {
	position: fixed;
	z-index: 9999;
	background: rgba(2, 6, 23, 0.95);
	border: 1px solid #334155;
	border-radius: 0.5rem;
	padding: 0.75rem;
	pointer-events: none;
	box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
	backdrop-filter: blur(4px);
	min-width: 200px;
}
.map-tooltip h4 {
	margin: 0 0 0.5rem 0;
	color: #f8fafc;
	font-size: 0.8rem;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	border-bottom: 1px solid #1e293b;
	padding-bottom: 0.25rem;
}
.tooltip-ips {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	font-family: var(--mono);
	font-size: 0.75rem;
}
.tooltip-ips > div {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
}
</style>
