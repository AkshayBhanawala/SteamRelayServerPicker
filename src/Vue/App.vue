<template>
	<div class="app-container">
		<div class="left-panel">
			<div class="panel-content">
				<div class="banner-wrapper">
					<div v-if="gameMeta.image === '---INVALID---'" class="">
						<h1 class="ping-bad">INVALID APP ID</h1>
					</div>
					<img v-else-if="gameMeta.image" :src="gameMeta.image" alt="Game Banner" class="banner-image" />
				</div>
				<div class="game-info">
					<h1 class="game-title">{{ gameMeta.title }}</h1>
					<p class="game-description">{{ gameMeta.desc }}</p>
				</div>
			</div>

			<div class="status-footer">
				<span class="status-indicator">
					<span class="pulse-dot" :class="{ 'pulse-dot-admin': isAdmin }"></span>
					{{
						isElectron
							? isAdmin
								? 'Admin Firewall Link Active'
								: 'User Mode - Firewall Limited'
							: 'Web Diagnostic Mode'
					}}
				</span>
			</div>
		</div>

		<div class="right-panel">
			<div v-show="currentView === 'dashboard'" class="view-container">
				<div class="panel-header text-left">
					<div class="header-text">
						<h2>Relay Configuration</h2>
						<p v-if="!isElectron" class="warning-text">Management requires the Windows Client.</p>
					</div>

					<div class="header-actions">
						<input
							type="text"
							v-model="searchQuery"
							class="filter-input"
							:placeholder="
								areOperationsBlocked ? 'Wait please...' : 'Filter IPs, IDs, or Locations...'
							"
							:disabled="areOperationsBlocked"
						/>
						<button class="settings-btn" @click="openSettings()" title="Settings">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
								/>
							</svg>
						</button>
					</div>
				</div>

				<div class="action-bar top-action-bar">
					<div class="action-group">
						<button
							v-if="isElectron"
							class="btn btn-ghost"
							@click="toggleAll(true)"
							:disabled="areOperationsBlocked"
						>
							Select All
						</button>
						<button
							v-if="isElectron && hasAnySelected"
							class="btn btn-ghost"
							@click="toggleAll(false)"
							:disabled="areOperationsBlocked"
						>
							Unselect All
						</button>
					</div>

					<button
						class="btn btn-primary"
						@click="triggerPings"
						:disabled="isLoading || isUpdatingPings"
					>
						{{ isUpdatingPings ? 'Updating Pings...' : 'Refresh Pings' }}
					</button>
				</div>

				<div class="scroll-container">
					<div v-if="isLoading || isProcessingFirewall" class="state-container">
						<div class="spinner"></div>
						<p class="pulse-text">
							{{
								isProcessingFirewall
									? 'Configuring Windows Firewall...'
									: 'Mapping worldwide infrastructure...'
							}}
						</p>
					</div>

					<div v-else-if="errorMessage" class="error-box">
						<p class="error-title">Network Error</p>
						<p class="error-text">{{ errorMessage }}</p>
					</div>

					<div
						v-else
						v-for="loc in filteredLocations"
						:key="loc.id"
						class="location-card"
						:class="{ 'card-selected': isGroupSelected(loc) }"
					>
						<div
							:class="{
								'location-toggle': true,
								'ping-poor': isLocationSomeIpsBlocked(loc),
								'ping-bad': isLocationAllIpsBlocked(loc),
							}"
							@click="toggleLocationExpand(locations.indexOf(loc))"
						>
							<div class="location-identity">
								<input
									v-if="isElectron"
									type="checkbox"
									class="ui-checkbox"
									:checked="isGroupSelected(loc)"
									@click="toggleGroupSelection(loc, $event)"
									:disabled="isUpdatingPings"
								/>
								<span
									:class="{
										'loc-id': true,
										'ping-poor': isLocationSomeIpsBlocked(loc),
										'ping-bad': isLocationAllIpsBlocked(loc),
									}"
								>
									{{ loc.id }}
								</span>
								<span class="loc-name">{{ loc.description }}</span>
							</div>

							<div class="location-status">
								<span v-if="isLocationSomeIpsBlocked(loc)" class="ping-badge ping-partial-block">
									🔒 {{ getBlockedCount(loc) }}/{{ loc.relays.length }} Blocked
								</span>
								<span v-if="isLocationAllIpsBlocked(loc)" class="ping-badge ping-blocked">
									🔒 Blocked
								</span>
								<template v-else class="ping-badge">
									<span v-if="!isLocationSomeIpsBlocked(loc)" class="ping-badge">
										{{ loc.relays.length }} Relays
									</span>
									<span class="ping-badge" :class="getPingColorClass(loc.avgPing)">
										{{
											loc.avgPing
												? isMaxPing(loc.avgPing)
													? `Timeout`
													: `${loc.avgPing} ms`
												: 'Testing...'
										}}
									</span>
								</template>

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
						</div>

						<div v-show="loc.isExpanded" class="relays-drawer">
							<div v-for="relay in loc.relays" :key="relay.ipv4" class="relay-row">
								<div class="relay-details">
									<input
										v-if="isElectron"
										type="checkbox"
										class="ui-checkbox"
										v-model="relay.selected"
										:disabled="areOperationsBlocked"
									/>
									<span class="relay-ip" :class="{ 'text-blocked': relay.blocked }">{{
										relay.ipv4
									}}</span>
								</div>
								<span v-if="isElectron && relay.blocked" class="ping-badge small ping-blocked">
									🔒 Blocked
								</span>
								<span v-else class="ping-badge small" :class="getPingColorClass(relay.ping || 0)">
									{{
										relay.ping
											? isMaxPing(relay.ping)
												? `Timeout`
												: `${relay.ping} ms`
											: 'Measuring...'
									}}
								</span>
							</div>
						</div>
					</div>
				</div>

				<div v-if="isElectron" class="action-bar bottom-action-bar">
					<div class="action-group">
						<button
							v-if="hasSelectedUnblocked"
							class="btn btn-warning"
							@click="handleFirewallRequest('block', getTargetIps('selected', 'unblocked'))"
							:disabled="areOperationsBlocked"
						>
							Block Selected
						</button>
						<button
							v-if="hasSelectedBlocked"
							class="btn btn-success"
							@click="handleFirewallRequest('unblock', getTargetIps('selected', 'blocked'))"
							:disabled="areOperationsBlocked"
						>
							Unblock Selected
						</button>
					</div>
					<div class="action-group">
						<button
							v-if="hasAnyUnblocked"
							class="btn btn-danger"
							@click="handleFirewallRequest('block', getTargetIps('all', 'unblocked'))"
							:disabled="areOperationsBlocked"
						>
							Block All
						</button>
						<button
							v-if="hasAnyBlocked"
							class="btn btn-ghost"
							@click="handleFirewallRequest('unblock', getTargetIps('all', 'blocked'))"
							:disabled="areOperationsBlocked"
						>
							Unblock All
						</button>
					</div>
				</div>
			</div>

			<div v-if="currentView === 'settings'" class="view-container settings-view">
				<div class="panel-header text-left">
					<div class="header-text">
						<h2>Application Settings</h2>
						<p>Target specific Steam Application networks</p>
					</div>
					<button class="btn btn-ghost" @click="cancelSettings()">Cancel</button>
				</div>

				<div class="settings-content">
					<div class="form-group">
						<label>Select Target Game / Application</label>
						<select v-model="selectedGame" class="ui-select">
							<option value="730">Counter-Strike 2 (730)</option>
							<option value="1422450">Deadlock (1422450)</option>
							<option value="3065800">Marathon (3065800)</option>
							<option value="custom">Custom App ID...</option>
						</select>
					</div>

					<div v-if="selectedGame === 'custom'" class="form-group slide-down">
						<label>Enter Custom Steam App ID</label>
						<input
							type="number"
							min="1"
							v-model="customAppId"
							class="ui-input"
							placeholder="e.g. 570 for Dota 2"
						/>
						<p class="helper-text">
							Must be a positive integer matching a valid Steam Datagram network.
						</p>
					</div>

					<button class="btn btn-primary save-btn" @click="saveAndApplySettings">
						Save & Connect
					</button>
				</div>
			</div>
		</div>

		<div v-if="adminModal.show" class="modal-overlay">
			<div class="modal-content">
				<h3>Admin Privileges Required</h3>
				<p>Windows requires Administrator rights to modify Firewall rules.</p>
				<div class="modal-actions">
					<button class="btn btn-primary" @click="executeAdminModalChoice('restart')">
						Restart App as Admin
					</button>
					<button class="btn btn-warning" @click="executeAdminModalChoice('continue')">
						Elevate this action only
					</button>
					<button class="btn btn-ghost" @click="executeAdminModalChoice('cancel')">Cancel</button>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
/* --- Base Layout & Variables --- */
:root {
	--bg-dark: #020617;
	--bg-panel: #0f172a;
	--border-color: rgba(30, 41, 59, 0.6);
	--text-main: #f8fafc;
	--text-muted: #94a3b8;
}

.text-left {
	text-align: left;
}

.app-container {
	display: flex;
	height: 100vh;
	width: 100%;
	background-color: var(--bg-dark);
	color: var(--text-main);
	font-family: ui-sans-serif, system-ui, sans-serif;
	overflow: hidden;
}

/* --- Left Panel --- */
.left-panel {
	width: 40%;
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

.view-container {
	display: flex;
	flex-direction: column;
	height: 100%;
	width: 100%;
}

.banner-wrapper {
	overflow: hidden;
	border-radius: 0.75rem;
	border: 1px solid rgba(51, 65, 85, 0.5);
}
.banner-image {
	width: 100%;
	aspect-ratio: 460 / 215;
	object-fit: cover;
}
.game-title {
	font-size: 2rem;
	font-weight: 900;
	line-height: 1;
	text-transform: uppercase;
	font-style: italic;
	margin: 0 0 1rem 0;
	background: linear-gradient(to right, #fb923c, #f59e0b);
	-webkit-background-clip: text;
	color: transparent;
}
.game-description {
	color: var(--text-muted);
	line-height: 1.6;
	font-size: 0.875rem;
	margin: 0;
}

.status-footer {
	padding-top: 1rem;
	border-top: 1px solid #0f172a;
	font-size: 0.75rem;
	color: #64748b;
}
.status-indicator {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}
.pulse-dot {
	width: 0.5rem;
	height: 0.5rem;
	border-radius: 50%;
	background-color: #3b82f6;
	animation: pulse 2s infinite;
}
.pulse-dot-admin {
	background-color: #10b981;
}

/* --- Right Panel --- */
.right-panel {
	width: 60%;
	height: 100%;
	display: flex;
	flex-direction: column;
}
.panel-header {
	padding: 1rem;
	background-color: rgba(2, 6, 23, 0.95);
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-bottom: 1px solid var(--border-color);
	z-index: 10;
}
.header-text h2 {
	font-size: 1.25rem;
	margin: 0;
	font-weight: 700;
}
.warning-text {
	font-size: 0.75rem;
	color: #f87171;
	margin-top: 0.25rem;
}
.filter-input {
	background-color: #0f172a;
	border: 1px solid #1e293b;
	color: white;
	padding: 0.5rem 1rem;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	width: 250px;
}
.filter-input:focus {
	outline: 1px solid #fb923c;
	border-color: #fb923c;
}
.header-actions {
	display: flex;
	align-items: center;
	gap: 1rem;
}
.settings-btn {
	background: transparent;
	border: none;
	color: #94a3b8;
	cursor: pointer;
	padding: 0.5rem;
	border-radius: 0.375rem;
	transition: all 0.2s;
	display: grid;
	place-items: center;
}
.settings-btn svg {
	width: 1.5rem;
	height: 1.5rem;
}
.settings-btn:hover {
	color: #fb923c;
	background: rgba(15, 23, 42, 0.5);
}

/* --- Action Bars --- */
.action-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	padding: 1rem;
	background-color: rgba(15, 23, 42, 0.4);
	border-top: 1px solid var(--border-color);
}
.top-action-bar {
}
.bottom-action-bar {
}
.action-group {
	display: flex;
	gap: 1rem;
}

/* Buttons */
.btn {
	padding: 0.5rem 1rem;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	border: none;
	transition: opacity 0.2s;
}
.btn:hover {
	opacity: 0.8;
}
.btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}
.btn-primary {
	background-color: #fb923c;
	color: #fff;
}
.btn-warning {
	background-color: #f59e0b;
	color: #fff;
}
.btn-danger {
	background-color: #ef4444;
	color: #fff;
}
.btn-success {
	background-color: #10b981;
	color: #fff;
}
.btn-ghost {
	background-color: transparent;
	border: 1px solid #334155;
	color: #cbd5e1;
}

/* --- Scrollable List --- */
.scroll-container {
	flex: 1;
	overflow-y: auto;
	padding: 0.5rem;
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	transform: translateZ(0);
	will-change: scroll-position;
	backface-visibility: hidden;
}
.scroll-container::-webkit-scrollbar {
	width: 6px;
}
.scroll-container::-webkit-scrollbar-track {
	background: transparent;
}
.scroll-container::-webkit-scrollbar-thumb {
	background: #1e293b;
	border-radius: 10px;
}

/* Checkboxes */
.ui-checkbox {
	flex-shrink: 0;
	appearance: none;
	width: 1.125rem;
	height: 1.125rem;
	border: 2px solid #475569;
	border-radius: 0.25rem;
	background-color: #0f172a;
	cursor: pointer;
	display: grid;
	place-content: center;
}
.ui-checkbox::before {
	content: '';
	width: 0.65em;
	height: 0.65em;
	transform: scale(0);
	box-shadow: inset 1em 1em #fb923c;
	transform-origin: center;
	clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
}
.ui-checkbox:checked::before {
	transform: scale(1);
}
.ui-checkbox:disabled {
	opacity: 0.4;
	cursor: not-allowed;
	border-color: #334155;
	background-color: #020617;
}

/* Server Cards */
.location-card {
	border: 1px solid var(--border-color);
	border-radius: 0.5rem;
	background-color: rgba(15, 23, 42, 0.2);
	transition: border-color 0.2s;
	contain: content;
	content-visibility: auto;
	contain-intrinsic-size: 64px;
}
.card-selected {
	border-color: #fb923c;
}

.location-toggle {
	display: flex;
	justify-content: space-between;
	gap: 1rem;
	padding: 0.5rem;
	cursor: pointer;
	background: rgba(15, 23, 42, 0.4);
}
.location-identity {
	display: flex;
	align-items: center;
	gap: 1rem;
}
.loc-id {
	flex-shrink: 0;
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100%;
	font-family: monospace;
	font-size: 0.75rem;
	font-weight: bold;
	background: #020617;
	padding: 2px 6px;
	border: 1px solid #1e293b;
	border-radius: 4px;
	color: #94a3b8;
	width: 60px;
}
.loc-name {
	text-align: left;
	font-size: 0.875rem;
	font-weight: 500;
}
.group-block-status {
	font-size: 0.7rem;
	color: #ef4444;
	background: rgba(239, 68, 68, 0.1);
	border: 1px solid rgba(239, 68, 68, 0.3);
	padding: 2px 6px;
	border-radius: 4px;
	display: flex;
	align-items: center;
	font-weight: 600;
	white-space: nowrap;
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
	transition: transform 0.2s;
}
.rotated {
	transform: rotate(180deg);
}

/* Drawer */
.relays-drawer {
	border-top: 1px solid rgba(30, 41, 59, 0.4);
	padding: 0.5rem 1rem;
	background: rgba(2, 6, 23, 0.6);
}
.relay-row {
	display: flex;
	justify-content: space-between;
	padding: 0.5rem 0;
	border-bottom: 1px solid #0f172a;
}
.relay-row:last-child {
	border-bottom: none;
}
.relay-details {
	display: flex;
	align-items: center;
	gap: 1rem;
}
.relay-ip {
	font-family: monospace;
	font-size: 0.875rem;
}
.text-blocked {
	text-decoration: line-through;
	color: #ef4444;
}
.lock-icon {
	font-size: 0.7rem;
	color: #ef4444;
}

/* Badges */
.ping-badge {
	font-family: monospace;
	font-size: 0.75rem;
	padding: 4px 8px;
	border-radius: 4px;
	border: 1px solid;
	white-space: nowrap;
}
.ping-badge.small {
	font-size: 11px;
	padding: 2px 6px;
}
.ping-excellent {
	color: #4ade80;
	background: rgba(34, 197, 94, 0.1);
	border-color: rgba(34, 197, 94, 0.3);
}
.ping-good {
	color: #10b981;
	background: rgba(5, 150, 105, 0.1);
	border-color: rgba(5, 150, 105, 0.3);
}
.ping-fair {
	color: #facc15;
	background: rgba(234, 179, 8, 0.1);
	border-color: rgba(234, 179, 8, 0.3);
}
.ping-poor {
	color: #fb923c;
	background: rgba(249, 115, 22, 0.1);
	border-color: rgba(249, 115, 22, 0.3);
}
.ping-bad {
	color: #f87171;
	background: rgba(239, 68, 68, 0.1);
	border-color: rgba(239, 68, 68, 0.3);
}
.ping-blocked {
	color: #ef4444;
	background: rgba(127, 29, 29, 0.3);
	border-color: rgba(185, 28, 28, 0.5);
	text-transform: uppercase;
	letter-spacing: 0.05em;
	font-size: 0.7rem;
}
.ping-partial-block {
	color: #f59e0b;
	background: rgba(245, 158, 11, 0.1);
	border-color: rgba(245, 158, 11, 0.3);
	display: flex;
	align-items: center;
	gap: 0.25rem;
}

/* --- Settings Page Specifics --- */
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

/* --- Modals & Loaders --- */
.state-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 15rem;
	gap: 1rem;
}
.spinner {
	width: 2rem;
	height: 2rem;
	border: 2px solid #fb923c;
	border-top-color: transparent;
	border-radius: 50%;
	animation: spin 1s linear infinite;
}
@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}
@keyframes pulse {
	50% {
		opacity: 0.5;
	}
}

.modal-overlay {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.8);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 50;
}
.modal-content {
	background: #0f172a;
	padding: 2rem;
	border-radius: 0.5rem;
	border: 1px solid #1e293b;
	max-width: 400px;
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

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';

// Constants
const MAX_PING = 9999;

// --- TypeScript Interfaces ---
interface Relay {
	ipv4: string;
	port_range: number[];
	ping?: number;
	selected: boolean;
	blocked: boolean;
}

interface ProcessedLocation {
	id: string;
	description: string;
	relays: Relay[];
	avgPing: number;
	isExpanded: boolean;
}

declare global {
	interface Window {
		electronAPI?: {
			getAppDetails: (appId: string) => Promise<any>;
			getSteamSDR: (appId: string) => Promise<any>;
			ping: (ip: string) => Promise<number>;
			checkAdmin: () => Promise<boolean>;
			getBlockedIps: (appId: string) => Promise<string[]>;
			syncFirewall: (ips: string[], elevate: boolean, appId: string) => Promise<boolean>;
			relaunchElevated: () => Promise<void>;
		};
	}
}

// --- State Variables ---
const isElectron = 'electronAPI' in window;
const currentView = ref<'dashboard' | 'settings'>('dashboard');
const gameMeta = ref({
	title: 'Loading...',
	desc: 'Fetching application details from Steam...',
	image: '',
});
const locations = ref<ProcessedLocation[]>([]);
const isLoading = ref<boolean>(true);
const isUpdatingPings = ref<boolean>(false);
const isProcessingFirewall = ref<boolean>(false);
const errorMessage = ref<string | null>(null);
const searchQuery = ref<string>('');
const isAdmin = ref<boolean>(false);
const selectedGame = ref<string>('730');
const customAppId = ref<string>('');
const activeAppId = computed(() =>
	selectedGame.value === 'custom' ? customAppId.value : selectedGame.value,
);

const gameDetails = computed(() => {
	const map: Record<string, { title: string; desc: string }> = {
		'730': {
			title: 'Counter-Strike 2',
			desc: 'Network relay architecture mapper and Windows Firewall configurator.',
		},
		'1422450': {
			title: 'Deadlock',
			desc: 'Optimize your hero shooter matchmaking by restricting routing nodes.',
		},
		'3065800': {
			title: 'Marathon',
			desc: 'Secure your extraction shooter connection routing via SDR.',
		},
	};
	return (
		map[activeAppId.value] || {
			title: `App ID: ${activeAppId.value}`,
			desc: 'Custom Steam Datagram Relay Tracker.',
		}
	);
});
const epochTime = computed(() => Math.floor(Date.now() / 1000));
const filteredLocations = computed(() => {
	if (!searchQuery.value)
		return locations.value.filter((loc) => [`bom2`, `maa2`, `sgp`, `mad`, `ctut`].includes(loc.id));
	const lowerQ = searchQuery.value.toLowerCase();

	return locations.value.filter(
		(loc) =>
			loc.id.toLowerCase().includes(lowerQ) ||
			loc.description.toLowerCase().includes(lowerQ) ||
			loc.relays.some((r) => r.ipv4.includes(lowerQ)),
	);
});
const hasAnySelected = computed(() =>
	locations.value.some((l) => l.relays.some((r) => r.selected)),
);
const hasAnyUnblocked = computed(() =>
	locations.value.some((l) => l.relays.some((r) => !r.blocked)),
);
const hasAnyBlocked = computed(() => locations.value.some((l) => l.relays.some((r) => r.blocked)));
const hasSelectedUnblocked = computed(() =>
	locations.value.some((l) => l.relays.some((r) => r.selected && !r.blocked)),
);
const hasSelectedBlocked = computed(() =>
	locations.value.some((l) => l.relays.some((r) => r.selected && r.blocked)),
);
const areOperationsBlocked = computed(() => isLoading.value || isUpdatingPings.value);
const isLocationAllIpsBlocked = computed(
	() => (loc: ProcessedLocation) =>
		isElectron && loc.relays.length > 0 && getBlockedCount(loc) === loc.relays.length,
);
const isLocationSomeIpsBlocked = computed(
	() => (loc: ProcessedLocation) =>
		isElectron && getBlockedCount(loc) > 0 && getBlockedCount(loc) < loc.relays.length,
);
const isMaxPing = computed(() => (ping: number) => ping === MAX_PING);

// --- Modal State ---
const adminModal = ref({
	show: false,
	newBlocked: [] as string[],
});

let fetchTimeout: number | null = null;
const fetchGameMeta = async (appId: string) => {
	if (!appId) return;

	// Set temporary loading state
	gameMeta.value = { title: `App ID: ${appId}`, desc: 'Fetching details...', image: '' };

	try {
		let data;
		if (isElectron && window.electronAPI) {
			data = await window.electronAPI.getAppDetails(appId);
		} else {
			const res = await fetch(`/api-store/api/appdetails?appids=${appId}`);
			data = await res.json();
		}

		if (data && data[appId] && data[appId].success) {
			const appData = data[appId].data;
			gameMeta.value = {
				title: appData.name,
				desc: appData.short_description || 'No description available.',
				image: appData.header_image,
			};
		} else {
			gameMeta.value = {
				title: `App ID: ${appId}`,
				desc: 'Custom Application Network.',
				image: '---INVALID---',
			};
		}
	} catch (e) {
		gameMeta.value = { title: `App ID: ${appId}`, desc: 'Failed to fetch details.', image: '' };
	}
};
watch(
	activeAppId,
	(newId) => {
		if (fetchTimeout) clearTimeout(fetchTimeout);
		fetchTimeout = window.setTimeout(() => {
			fetchGameMeta(newId);
		}, 500);
	},
	{ immediate: true },
);

const pingServer = async (ip: string): Promise<number> => {
	try {
		if (isElectron && window.electronAPI) {
			return await window.electronAPI.ping(ip);
		}
		const response = await fetch(`/api-ping?ip=${ip}`);
		const data = await response.json();
		return data.alive && typeof data.time === 'number' ? Math.round(data.time) : MAX_PING;
	} catch (err) {
		return MAX_PING;
	}
};

const refreshFirewallState = async () => {
	if (!isElectron || !window.electronAPI) return;
	const blockedIps = await window.electronAPI.getBlockedIps(activeAppId.value);

	locations.value.forEach((loc) => {
		loc.relays.forEach((relay) => {
			relay.blocked = blockedIps.includes(relay.ipv4);
		});
	});
};

const triggerPings = async () => {
	if (isUpdatingPings.value) return;

	isUpdatingPings.value = true;

	await Promise.all(
		filteredLocations.value.map(async (loc) => {
			let validSum = 0;
			let validCount = 0;

			const pingPromises = loc.relays.map(async (relay) => {
				const latency = await pingServer(relay.ipv4);
				relay.ping = latency;

				if (!relay.blocked && latency !== MAX_PING) {
					validSum += latency;
					validCount++;
				}
			});

			await Promise.all(pingPromises);

			loc.avgPing = validCount > 0 ? Math.round(validSum / validCount) : MAX_PING;
		}),
	);

	locations.value.sort((a, b) => a.avgPing - b.avgPing);
	isUpdatingPings.value = false;
};

// --- Core Initialization ---
const loadGameData = async () => {
	try {
		isLoading.value = true;
		errorMessage.value = null;

		let data;
		if (isElectron && window.electronAPI) {
			data = await window.electronAPI.getSteamSDR(activeAppId.value);
		} else {
			const response = await fetch(
				`/api-steam/ISteamApps/GetSDRConfig/v1?appid=${activeAppId.value}`,
			);
			if (!response.ok) throw new Error('Failed to retrieve SDR Configuration.');
			data = await response.json();
		}

		locations.value = Object.entries(data.pops)
			.map(([key, value]: any) => ({
				id: key,
				description: value.desc,
				relays: (value.relays || []).map((r: any) => ({
					...r,
					ping: undefined,
					selected: false,
					blocked: false,
				})),
				avgPing: 0,
				isExpanded: false,
			}))
			.filter((loc) => loc.relays.length > 0);

		if (isElectron) await refreshFirewallState();

		isLoading.value = false;
		await triggerPings();
	} catch (err: any) {
		errorMessage.value = err.message || 'An unexpected error occurred.';
		isLoading.value = false;
	}
};

// --- Settings Logic ---
const loadSettings = () => {
	const saved = localStorage.getItem('sdr_settings');
	if (saved) {
		const parsed = JSON.parse(saved);
		selectedGame.value = parsed.selectedGame || '730';
		customAppId.value = parsed.customAppId || '';
	} else {
		// strict reset if nothing has ever been saved
		selectedGame.value = '730';
		customAppId.value = '';
	}
};

const saveAndApplySettings = async () => {
	if (selectedGame.value === 'custom') {
		const num = parseInt(customAppId.value, 10);
		if (isNaN(num) || num <= 0) {
			alert('App ID must be a valid positive number.');
			return;
		}
		customAppId.value = num.toString(); // Sanitize
	}

	localStorage.setItem(
		'sdr_settings',
		JSON.stringify({
			selectedGame: selectedGame.value,
			customAppId: customAppId.value,
		}),
	);

	currentView.value = 'dashboard';
	await loadGameData();
};

const getPingColorClass = (ping: number): string => {
	if (ping <= 50) return 'ping-excellent';
	if (ping <= 100) return 'ping-good';
	if (ping <= 200) return 'ping-fair';
	if (ping <= 300) return 'ping-poor';
	return 'ping-bad';
};

const getBlockedCount = (loc: ProcessedLocation) => {
	return loc.relays.filter((r) => r.blocked).length;
};

onMounted(async () => {
	loadSettings();
	if (isElectron && window.electronAPI) {
		isAdmin.value = await window.electronAPI.checkAdmin();
		const pendingStr = localStorage.getItem('cs2_pending_fw_action');
		if (pendingStr && isAdmin.value) {
			isProcessingFirewall.value = true;
			const pending = JSON.parse(pendingStr);
			await window.electronAPI.syncFirewall(pending.ips, false, pending.appId);
			localStorage.removeItem('cs2_pending_fw_action');
			isProcessingFirewall.value = false;
		}
	}
	await loadGameData();
});

const toggleLocationExpand = (index: number) => {
	locations.value[index].isExpanded = !locations.value[index].isExpanded;
};

const isGroupSelected = (loc: ProcessedLocation) => {
	return loc.relays.length > 0 && loc.relays.every((r) => r.selected);
};

const toggleGroupSelection = (loc: ProcessedLocation, event: Event) => {
	event.stopPropagation();
	const targetState = !isGroupSelected(loc);
	loc.relays.forEach((r) => (r.selected = targetState));
};

const toggleAll = (state: boolean) => {
	locations.value.forEach((loc) => loc.relays.forEach((r) => (r.selected = state)));
};

const getTargetIps = (context: 'all' | 'selected', requirement: 'blocked' | 'unblocked') => {
	const ips: string[] = [];
	locations.value.forEach((loc) => {
		loc.relays.forEach((r) => {
			const matchContext = context === 'all' || r.selected;
			const matchReq = requirement === 'blocked' ? r.blocked : !r.blocked;
			if (matchContext && matchReq) ips.push(r.ipv4);
		});
	});
	return ips;
};

const openSettings = () => {
	currentView.value = 'settings';
};

const cancelSettings = () => {
	loadSettings();
	currentView.value = 'dashboard';
};

// --- Firewall Actions ---
const handleFirewallRequest = async (action: 'block' | 'unblock', targetIps: string[]) => {
	targetIps = JSON.parse(JSON.stringify(targetIps));
	if (targetIps.length === 0) return;

	// 1. Calculate the NEW master list of blocked IPs
	const currentBlocked = getTargetIps('all', 'blocked');
	let newBlocked = [...currentBlocked];

	if (action === 'block') {
		// Add new IPs and remove duplicates using a Set
		newBlocked = [...new Set([...newBlocked, ...targetIps])];
	} else {
		// Filter out the IPs we want to unblock
		newBlocked = newBlocked.filter((ip) => !targetIps.includes(ip));
	}

	if (isAdmin.value && window.electronAPI) {
		isProcessingFirewall.value = true;
		await window.electronAPI.syncFirewall(newBlocked, false, activeAppId.value);
		await refreshFirewallState();
		toggleAll(false);
		isProcessingFirewall.value = false;
		await triggerPings();
	} else {
		// Prompt the Elevation Modal with the computed master list
		adminModal.value = { show: true, newBlocked };
	}
};

const executeAdminModalChoice = async (choice: 'restart' | 'continue' | 'cancel') => {
	const { newBlocked } = JSON.parse(JSON.stringify(adminModal.value));
	adminModal.value.show = false;

	if (choice === 'cancel' || !window.electronAPI) return;

	if (choice === 'restart') {
		localStorage.setItem(
			'cs2_pending_fw_action',
			JSON.stringify({ ips: newBlocked, appId: activeAppId.value }),
		);
		await window.electronAPI.relaunchElevated();
	}

	if (choice === 'continue') {
		isProcessingFirewall.value = true;
		await window.electronAPI.syncFirewall(newBlocked, true, activeAppId.value);
		await refreshFirewallState();
		toggleAll(false);
		isProcessingFirewall.value = false;
		await triggerPings();
	}
};
</script>
