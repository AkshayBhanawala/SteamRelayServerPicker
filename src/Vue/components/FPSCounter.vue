<template>
	<div class="fps-counter">
		<h2 class="fps-value">{{ fps }}</h2>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const fps = ref(0);
const frameCount = ref(0);
const lastTime = ref(performance.now());
let animationFrameId: number;

const loop = (now: number) => {
	frameCount.value++;
	const elapsed = now - lastTime.value;
	if (elapsed >= 1000) {
		fps.value = Math.round((frameCount.value * 1000) / elapsed);
		frameCount.value = 0;
		lastTime.value = now;
	}
	animationFrameId = requestAnimationFrame(loop);
};

onMounted(() => {
	animationFrameId = requestAnimationFrame(loop);
});

onUnmounted(() => {
	cancelAnimationFrame(animationFrameId);
});
</script>

<style scoped>
.fps-counter {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	padding: 5px;
	background-color: #303030;
	border-radius: 10px;
	overflow: hidden;
}
.fps-value {
	font-family: var(--mono);
	font-weight: 900;
	margin: 0;
	line-height: 0;
}
</style>
