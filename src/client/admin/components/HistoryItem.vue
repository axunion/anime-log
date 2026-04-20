<script setup lang="ts">
import { GripVertical, Trash2 } from "lucide-vue-next";
import { ref, watch } from "vue";
import type { HistoryEntry } from "../../lib/types";

const props = defineProps<{
	entry: HistoryEntry;
}>();

const emit = defineEmits<{
	delete: [];
	update: [payload: { display_name: string | null; year: number }];
}>();

const displayName = ref(props.entry.display_name ?? "");
const year = ref(props.entry.year ? String(props.entry.year) : "");

watch(
	() => props.entry,
	(e) => {
		displayName.value = e.display_name ?? "";
		year.value = e.year ? String(e.year) : "";
	},
	{ deep: true },
);

function onBlur() {
	const dn = displayName.value.trim() || null;
	const yr = Number(year.value.trim());
	if (!yr) {
		year.value = String(props.entry.year);
		return;
	}
	if (dn === (props.entry.display_name ?? null) && yr === props.entry.year)
		return;
	emit("update", { display_name: dn, year: yr });
}
</script>

<template>
	<li class="history-item">
		<span class="drag-handle">
			<GripVertical :size="16" :stroke-width="1.75" />
		</span>
		<span class="item-title">{{ entry.title }}</span>
		<input
			class="item-input item-input--name"
			type="text"
			v-model="displayName"
			:placeholder="entry.title"
			@blur="onBlur"
			@keydown.enter="($event.target as HTMLInputElement).blur()"
		/>
		<input
			class="item-input item-input--year"
			type="text"
			inputmode="numeric"
			maxlength="4"
			v-model="year"
			placeholder="年"
			@blur="onBlur"
			@keydown.enter="($event.target as HTMLInputElement).blur()"
		/>
		<button class="btn-delete" type="button" @click="$emit('delete')">
			<Trash2 :size="13" :stroke-width="1.75" />
		</button>
	</li>
</template>

<style scoped>
.history-item {
	align-items: center;
	border-bottom: 1px solid var(--glass-border);
	display: flex;
	gap: 0.4em;
	padding: 0.4em 0.25em;
}

.history-item:last-child {
	border-bottom: none;
}

.item-title {
	color: var(--text-muted);
	flex: 0 1 120px;
	font-size: 12px;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.item-input {
	background: transparent;
	border: 1px solid transparent;
	border-radius: 4px;
	font-size: 13px;
	min-width: 0;
	padding: 0.1em 0.5em;
	transition: border-color 0.15s, box-shadow 0.15s;
}

.item-input:focus {
	border-color: var(--focus-ring);
	box-shadow: 0 0 0 3px var(--focus-glow);
	outline: none;
}

.item-input--name {
	flex: 1 1 auto;
}

.item-input--year {
	flex: 0 0 44px;
	text-align: right;
}

.drag-handle {
	align-items: center;
	color: var(--text-subtle);
	cursor: grab;
	display: flex;
	flex: 0 0 22px;
	justify-content: center;
}

.drag-handle:active {
	cursor: grabbing;
}

.btn-delete {
	align-items: center;
	background: none;
	border: none;
	color: var(--text-subtle);
	cursor: pointer;
	display: flex;
	flex: 0 0 24px;
	justify-content: center;
	padding: 0;
	transition: color 0.15s;
}

.btn-delete:hover {
	color: var(--contrast-color);
}
</style>
