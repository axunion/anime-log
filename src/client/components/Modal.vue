<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue";

const props = withDefaults(
	defineProps<{
		open: boolean;
		title?: string;
		size?: "sm" | "md";
		closeOnOverlay?: boolean;
		closeOnEsc?: boolean;
	}>(),
	{ size: "md", closeOnOverlay: true, closeOnEsc: true },
);

const emit = defineEmits<{
	"update:open": [value: boolean];
	close: [];
}>();

function close() {
	emit("update:open", false);
	emit("close");
}

function onOverlayClick() {
	if (props.closeOnOverlay) close();
}

function onKeydown(e: KeyboardEvent) {
	if (props.closeOnEsc && e.key === "Escape") {
		e.preventDefault();
		close();
	}
}

watch(
	() => props.open,
	(isOpen) => {
		document.body.style.overflow = isOpen ? "hidden" : "";
		if (isOpen) {
			document.addEventListener("keydown", onKeydown);
		} else {
			document.removeEventListener("keydown", onKeydown);
		}
	},
);

onBeforeUnmount(() => {
	document.removeEventListener("keydown", onKeydown);
	document.body.style.overflow = "";
});
</script>

<template>
	<Teleport to="body">
		<Transition name="modal">
			<div v-if="open" class="modal-overlay" @click.self="onOverlayClick">
				<div
					class="modal-dialog"
					:class="`modal-dialog--${size}`"
					role="dialog"
					aria-modal="true"
					:aria-labelledby="title ? 'modal-title' : undefined"
				>
					<div class="modal-header">
						<slot name="header">
							<span v-if="title" id="modal-title" class="modal-title">{{ title }}</span>
						</slot>
					</div>
					<div class="modal-body">
						<slot />
					</div>
					<div class="modal-footer">
						<slot name="footer" />
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped>
.modal-overlay {
	align-items: center;
	backdrop-filter: blur(2px);
	background: var(--shadow-overlay);
	bottom: 0;
	display: flex;
	justify-content: center;
	left: 0;
	padding: 16px;
	position: fixed;
	right: 0;
	top: 0;
	z-index: 100;
}

.modal-dialog {
	background: var(--glass-bg-strong);
	backdrop-filter: var(--glass-blur);
	-webkit-backdrop-filter: var(--glass-blur);
	border: 1px solid var(--glass-border);
	border-radius: 12px;
	box-shadow: 0 12px 40px var(--shadow-overlay);
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	max-height: calc(100vh - 32px);
	padding: 1.5em;
	width: 100%;
}

.modal-dialog--sm {
	max-width: 360px;
}

.modal-dialog--md {
	max-width: 520px;
}

.modal-header {
	flex-shrink: 0;
	margin-bottom: 1em;
}

.modal-title {
	color: var(--text-muted);
	font-size: 0.8em;
	font-weight: 600;
	letter-spacing: 0.08em;
	text-transform: uppercase;
}

.modal-body {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
}

.modal-footer {
	align-items: center;
	display: flex;
	flex-shrink: 0;
	gap: 0.5em;
	justify-content: flex-end;
	margin-top: 1em;
}

/* enter/leave transitions */
.modal-enter-active {
	transition: opacity 0.15s ease, transform 0.15s ease;
}

.modal-leave-active {
	transition: opacity 0.12s ease, transform 0.12s ease;
}

.modal-enter-from,
.modal-leave-to {
	opacity: 0;
}

.modal-enter-from .modal-dialog,
.modal-leave-to .modal-dialog {
	transform: scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
	.modal-enter-active,
	.modal-leave-active {
		transition: none;
	}
}
</style>
