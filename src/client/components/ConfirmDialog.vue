<script setup lang="ts">
import { computed } from "vue";
import { useConfirm } from "../composables/useConfirm";
import Modal from "./AppModal.vue";

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
			<button class="btn btn--ghost" type="button" @click="resolve(false)">
				{{ cancelLabel }}
			</button>
			<button
				class="btn"
				:class="danger ? 'btn--danger' : 'btn--primary'"
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
</style>
