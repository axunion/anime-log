<script setup lang="ts">
import { computed } from "vue";
import { useConfirm } from "../composables/useConfirm";
import Modal from "./Modal.vue";

const { state, resolve } = useConfirm();

const open = computed(() => state.value !== null);
const confirmLabel = computed(() => state.value?.confirmLabel ?? "削除");
const cancelLabel = computed(() => state.value?.cancelLabel ?? "キャンセル");
const danger = computed(() => state.value?.danger !== false);
</script>

<template>
	<Modal
		:open="open"
		:title="state?.title"
		size="sm"
		:close-on-overlay="false"
		@close="resolve(false)"
	>
		<p class="confirm-message">{{ state?.message }}</p>
		<template #footer>
			<button class="btn-cancel" type="button" @click="resolve(false)">
				{{ cancelLabel }}
			</button>
			<button
				class="btn-confirm"
				:class="{ 'btn-confirm--danger': danger }"
				type="button"
				@click="resolve(true)"
			>
				{{ confirmLabel }}
			</button>
		</template>
	</Modal>
</template>

<style scoped>
.confirm-message {
	font-size: 14px;
	line-height: 1.6;
	margin: 0;
}

.btn-cancel {
	background: none;
	border: none;
	color: var(--text-subtle);
	cursor: pointer;
	font-size: 13px;
	padding: 0.35em 0.75em;
	transition: color 0.1s;
}

.btn-cancel:hover {
	color: var(--contrast-color);
}

.btn-confirm {
	align-items: center;
	background: var(--accent-color);
	border: 1px solid transparent;
	border-radius: 8px;
	color: var(--base-color);
	cursor: pointer;
	display: inline-flex;
	font-size: 13px;
	font-weight: 500;
	padding: 0.35em 1em;
	transition: opacity 0.15s;
}

.btn-confirm:hover {
	opacity: 0.85;
}

.btn-confirm--danger {
	background: color-mix(in srgb, #e05555 80%, var(--base-color));
}
</style>
