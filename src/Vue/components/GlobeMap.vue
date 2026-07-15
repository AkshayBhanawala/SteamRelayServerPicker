<template>
	<div class="map-container" v-show="!isSettingsOpen">
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
					:style="{ color: getPingColorHex(relay.ping || 999) }"
				>
					<span>{{ relay.ipv4 }}</span>
					<span v-if="relay.blocked">🔒 Blocked</span>
					<span v-else>{{ relay.ping ? relay.ping + 'ms' : 'Measuring' }}</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as d3 from 'd3';
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

const width = 800;
const height = 600;
const initialScale = 260;
const projection = d3
	.geoOrthographic()
	.scale(initialScale)
	.translate([width / 2, height / 2]);
const pathGenerator = d3.geoPath().projection(projection);

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
	if (!canvas) return;
	if (canvas.clientWidth === 0) return;

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

	ctx.beginPath();
	pathGenerator({ type: 'Sphere' } as d3.GeoPermissibleObjects);
	ctx.fillStyle = '#48cae466';
	ctx.fill();
	ctx.strokeStyle = '#03045e';
	ctx.lineWidth = 2;
	ctx.stroke();

	ctx.shadowBlur = 40;
	ctx.shadowColor = '#48cae4';
	ctx.strokeStyle = '#02c39a';
	ctx.lineWidth = 2;
	ctx.stroke();
	ctx.stroke();
	ctx.stroke();
	ctx.stroke();
	ctx.shadowBlur = 0;

	ctx.beginPath();
	geoFeatures.value.forEach((f) => pathGenerator(f));
	ctx.fillStyle = '#020617';
	ctx.fill();
	ctx.strokeStyle = '#1e293b';
	ctx.lineWidth = 1;
	ctx.stroke();

	const center = projection.invert!([width / 2, height / 2]);
	if (!center) return;

	props.locations.forEach((loc) => {
		if (!loc.geo) return;
		const lat = loc.geo[1];
		const lon = loc.geo[0];

		if (d3.geoDistance([lon, lat], center) > Math.PI / 2) return;

		const proj = projection([lon, lat]);
		if (!proj) return;

		const isHovered = hoveredLoc.value?.id === loc.id;
		const radius = isHovered ? 10 : 5;

		ctx.beginPath();
		ctx.arc(proj[0], proj[1], radius, 0, 2 * Math.PI);
		ctx.fillStyle = getPingColorHex(loc.avgPing);

		ctx.shadowBlur = 15;
		ctx.shadowColor = ctx.fillStyle;
		ctx.fill();

		ctx.shadowBlur = 0;
		ctx.strokeStyle = '#FFFFFF';
		ctx.lineWidth = 1;
		ctx.stroke();
	});
};

const handleMapMouseMove = (event: MouseEvent) => {
	const canvas = mapCanvas.value;
	if (!canvas) return;

	const rect = canvas.getBoundingClientRect();
	const scaleX = width / rect.width;
	const scaleY = height / rect.height;
	const mouseX = (event.clientX - rect.left) * scaleX;
	const mouseY = (event.clientY - rect.top) * scaleY;

	// Calculate if mouse is physically inside the globe's radius
	const dxGlobe = mouseX - width / 2;
	const dyGlobe = mouseY - height / 2;
	isHoveringGlobe.value = Math.sqrt(dxGlobe * dxGlobe + dyGlobe * dyGlobe) <= (initialScale * zoomScale.value);

	let foundLoc = null;
	const center = projection.invert!([width / 2, height / 2]);

	if (center) {
		for (const loc of props.locations) {
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

const setupMap = () => {
	if (mapCanvas.value) {
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
						const rect = mapCanvas.value!.getBoundingClientRect();
						const scaleX = width / rect.width;
						const scaleY = height / rect.height;
						const cssMouse = d3.pointer(event.sourceEvent, mapCanvas.value);
						const internalMousePos = [cssMouse[0] * scaleX, cssMouse[1] * scaleY] as [
							number,
							number,
						];
						const geoPos = projection.invert!(internalMousePos);

						if (geoPos && event.transform.k > currentZoom) {
							const targetLon = -geoPos[0];
							const targetLat = -geoPos[1];
							targetRotation[0] += (targetLon - targetRotation[0]) * 0.2;
							targetRotation[1] += (targetLat - targetRotation[1]) * 0.2;
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
				const rect = mapCanvas.value!.getBoundingClientRect();
				const scaleX = width / rect.width;
				const scaleY = height / rect.height;
				const cssMouse = d3.pointer(event, mapCanvas.value);
				const internalMousePos = [cssMouse[0] * scaleX, cssMouse[1] * scaleY] as [number, number];
				const geoPos = projection.invert!(internalMousePos);

				if (geoPos) {
					const targetLon = -geoPos[0];
					const targetLat = -geoPos[1];
					targetRotation[0] = targetLon;
					targetRotation[1] = targetLat;
					d3.select(mapCanvas.value!).transition().duration(0).call(zoom.scaleBy, 2);
				}
			});

		d3.timer(() => {
			if (!isDragging.value) {
				targetRotation[0] += 0.05 / currentZoom;
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
</script>

<style scoped>
.map-container {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
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
	max-width: 100%;
	max-height: 100%;
	aspect-ratio: 4 / 3;
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
	font-family: monospace;
	font-size: 0.75rem;
}
.tooltip-ips > div {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
}
</style>
