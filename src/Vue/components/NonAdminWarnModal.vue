<template>
	<div class="modal-overlay">
		<div class="modal-content">
			<h3>Root Privileges Required</h3>
			<p>
				You are running on
				<strong class="highlight">{{ getOsDisplayName(osPlatform) }}</strong>.
				<br /><br />
				Viewing or modifying network firewall configurations on Unix-based systems requires elevated
				<code>root</code>/<code>sudo</code> privileges.
				<br /><br />
				Modifying <code>{{ getOsFirewallType(osPlatform) }}</code> rules can <strong>permanently</strong> change your network
				stack if handled improperly, automated modifications is disabled for your safety.
				<br /><br />
				No Actions will be performed unless you provide elevated access every time (also there is no going around it unless you run the app elevated).
				<br /><br />
				Application will ask you to approve <code>root</code>/<code>sudo</code> request <strong>every time</strong> it needs to access/modify rules.
				<br /><br />
				I hope that is understood.
			</p>
			<div class="modal-actions">
				<button class="btn btn-success" @click="$emit('choice', 'continue')">Understood</button>
				<button class="btn btn-danger" @click="$emit('choice', 'cancel')">No, Exit</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { getOsDisplayName, getOsFirewallType } from '../utils/Common.util';

const props = defineProps<{
	osPlatform: NodeJS.Platform;
}>();

defineEmits<{
	(e: 'choice', action: 'continue' | 'cancel'): void;
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
	backdrop-filter: blur(10px);
}
.modal-content {
	background: #0f172a;
	padding: 2rem;
	border-radius: 0.5rem;
	border: 1px solid #1e293b;
	min-width: 300px;
	max-width: 80vw;
	text-align: justify;
}
.modal-content h3 {
	margin: 0 0 1rem 0;
	color: #f87171;
	text-align: center;
}
.modal-content p {
	font-size: 0.875rem;
	color: #94a3b8;
	margin-bottom: 2rem;
}
.modal-actions {
	display: flex;
	flex-direction: row;
	justify-content: center;
	gap: 0.75rem;
}
br {
	margin-bottom: 2px;
}
</style>
