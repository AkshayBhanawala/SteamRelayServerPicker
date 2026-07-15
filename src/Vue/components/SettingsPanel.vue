<template>
	<div class="view-container settings-view">
		<div class="panel-header text-left">
			<div class="header-text">
				<h2>Application Settings</h2>
				<p>Target specific Steam Application networks</p>
			</div>
			<button class="btn btn-ghost" @click="$emit('cancel')">Cancel</button>
		</div>

		<div class="settings-content">
			<div class="form-group">
				<label>Select Target Game / Application</label>
				<select class="ui-select" v-model="localSelectedGame" @change="onPreview()">
					<option value="730">Counter-Strike 2 (730)</option>
					<option value="1422450">Deadlock (1422450)</option>
					<option value="3065800">Marathon (3065800)</option>
					<option value="custom">Custom App ID...</option>
				</select>
			</div>

			<div v-if="localSelectedGame === 'custom'" class="form-group slide-down">
				<label>Enter Custom Steam App ID</label>
				<input
					type="number"
					min="1"
					class="ui-input"
					placeholder="e.g. 570 for Dota 2"
					v-model="localCustomAppId"
					@input="onPreview()"
				/>
				<p class="helper-text">
					Must be a positive integer matching a valid Steam Datagram network.
				</p>
			</div>

			<button class="btn btn-primary save-btn" @click="onSave">Save & Connect</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
	selectedGame: string;
	customAppId: string;
}>();

const emit = defineEmits<{
	(e: 'save', game: string, customId: string): void;
	(e: 'preview', game: string, customId: string): void;
	(e: 'cancel'): void;
}>();

const localSelectedGame = ref(props.selectedGame);
const localCustomAppId = ref(props.customAppId);

watch(
	() => props.selectedGame,
	(val) => (localSelectedGame.value = val),
);

watch(
	() => props.customAppId,
	(val) => (localCustomAppId.value = val),
);

const onSave = () => {
	emit('save', localSelectedGame.value, localCustomAppId.value);
};

const onPreview = () => {
	emit('preview', localSelectedGame.value, localCustomAppId.value);
};
</script>

<style scoped>
.settings-view {
	background-color: rgba(2, 6, 23, 0.4);
}
.settings-content {
	padding: 3rem 4rem;
	display: flex;
	flex-direction: column;
	gap: 2rem;
	max-width: 600px;
}
.form-group {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}
.form-group label {
	font-size: 0.875rem;
	font-weight: 600;
	color: #cbd5e1;
}
.helper-text {
	font-size: 0.75rem;
	color: #64748b;
	margin: 0;
}
.ui-select,
.ui-input {
	background-color: #0f172a;
	border: 1px solid #1e293b;
	color: white;
	padding: 0.75rem 1rem;
	border-radius: 0.5rem;
	font-size: 1rem;
	width: 100%;
	font-family: inherit;
	transition: border-color 0.2s;
}
.ui-select:focus,
.ui-input:focus {
	outline: none;
	border-color: #fb923c;
}
.save-btn {
	margin-top: 1rem;
	padding: 0.75rem;
	font-size: 1rem;
}
.slide-down {
	animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes slideDown {
	from {
		opacity: 0;
		transform: translateY(-10px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}
</style>
