<template>
	<div class="modal-overlay">
		<div class="modal-content">
			<h3>{{ isOsWindows(osPlatform) ? 'Admin' : 'Root' }} Privileges Required</h3>
			<p>
				{{ getOsDisplayName(osPlatform) }}
				requires
				{{ isOsWindows(osPlatform) ? 'Administrator' : 'Root' }}
				access to modify Network Firewall rules.
			</p>
			<div class="modal-actions">
				<button v-if="isOsWindows(osPlatform)" class="btn btn-primary" @click="$emit('choice', 'restart')">
					Restart App as Admin
				</button>
				<button class="btn btn-warning" @click="$emit('choice', 'continue')">
					Elevate this action
				</button>
				<button class="btn btn-ghost" @click="$emit('choice', 'cancel')">Cancel</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { getOsDisplayName, isOsWindows } from '../utils/Common.util';

const props = defineProps<{
	osPlatform: NodeJS.Platform;
}>();

defineEmits<{
	(e: 'choice', action: 'restart' | 'continue' | 'cancel'): void;
}>();
</script>

<style scoped>
.modal-overlay {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.8);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 50;
	backdrop-filter: blur(50px);
}
.modal-content {
	background: #0f172a;
	padding: 2rem;
	border-radius: 0.5rem;
	border: 1px solid #1e293b;
	max-width: 80vw;
	text-align: center;
}
.modal-content h3 {
	margin: 0 0 1rem 0;
	color: #f87171;
}
.modal-content p {
	font-size: 0.875rem;
	color: #94a3b8;
	margin-bottom: 2rem;
}
.modal-actions {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}
</style>
