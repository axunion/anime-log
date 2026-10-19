<script setup lang="ts">
import { Check, Pencil, Trash2, X } from "@lucide/vue";
import { ref, watchPostEffect } from "vue";
import { useConfirm } from "../../composables/useConfirm";

const props = defineProps<{
  id: number;
  titleName: string;
  year: number;
  selected: boolean;
}>();

const emit = defineEmits<{
  select: [];
  update: [id: number, fields: { title?: string; year?: number }];
  delete: [id: number];
}>();

const { confirm } = useConfirm();
const itemEl = ref<HTMLLIElement | null>(null);
const editing = ref(false);
const editTitle = ref("");
const editYear = ref("");

function startEdit(e: Event) {
  e.stopPropagation();
  editTitle.value = props.titleName;
  editYear.value = String(props.year);
  editing.value = true;
}

function cancelEdit(e: Event) {
  e.stopPropagation();
  editing.value = false;
}

function commitEdit(e: Event) {
  e.stopPropagation();
  const title = editTitle.value.trim();
  const year = Number(editYear.value);
  if (title && year) {
    emit("update", props.id, { title, year });
  }
  editing.value = false;
}

// Post-flush so a newly added title is scrolled to once its <li> has mounted.
watchPostEffect(() => {
  if (props.selected) itemEl.value?.scrollIntoView({ block: "nearest" });
});

async function onDelete(e: Event) {
  e.stopPropagation();
  if (!(await confirm({ message: `「${props.titleName}」を削除しますか？` })))
    return;
  emit("delete", props.id);
}
</script>

<template>
	<li ref="itemEl" class="search-item" :class="{ selected, editing }" @click="!editing && $emit('select')">
		<template v-if="editing">
			<input
				class="edit-input edit-input--title"
				type="text"
				v-model="editTitle"
				@click.stop
				@keydown.enter.prevent="commitEdit"
				@keydown.esc.prevent="cancelEdit"
			/>
			<input
				class="edit-input edit-input--year"
				type="text"
				inputmode="numeric"
				maxlength="4"
				v-model="editYear"
				@click.stop
				@keydown.enter.prevent="commitEdit"
				@keydown.esc.prevent="cancelEdit"
			/>
			<div class="action-buttons">
				<button class="btn-action btn-action--confirm" type="button" @click="commitEdit">
					<Check :size="13" :stroke-width="2.5" />
				</button>
				<button class="btn-action" type="button" @click="cancelEdit">
					<X :size="13" :stroke-width="2.5" />
				</button>
			</div>
		</template>
		<template v-else>
			<span class="item-title">{{ titleName }}</span>
			<span class="item-year">{{ year }}</span>
			<div class="action-buttons">
				<button class="btn-action" type="button" @click="startEdit">
					<Pencil :size="12" :stroke-width="2" />
				</button>
				<button class="btn-action btn-action--danger" type="button" @click="onDelete">
					<Trash2 :size="12" :stroke-width="2" />
				</button>
			</div>
		</template>
	</li>
</template>

<style scoped>
.search-item {
	align-items: center;
	border-radius: var(--radius-md);
	cursor: pointer;
	display: flex;
	font-size: 13px;
	gap: 0.5em;
	padding: 0.4em 0.5em;
	transition:
		background-color var(--dur-fast) var(--ease-out),
		color var(--dur-fast) var(--ease-out);
}

.search-item.editing {
	cursor: default;
}

.search-item:hover {
	background: var(--hover-overlay);
}

.search-item.selected {
	background: color-mix(in srgb, var(--accent-color) 12%, transparent);
	color: var(--accent-color);
}

.item-title {
	flex: 1 1 auto;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.item-year {
	color: var(--text-subtle);
	flex: 0 0 40px;
	font-size: 12px;
	font-variant-numeric: tabular-nums;
	text-align: right;
}

.action-buttons {
	align-items: center;
	display: flex;
	flex-shrink: 0;
	gap: 0.15em;
	opacity: 0;
	transition: opacity var(--dur-fast) var(--ease-out);
}

.search-item:hover .action-buttons,
.search-item.editing .action-buttons {
	opacity: 1;
}

.btn-action {
	align-items: center;
	background: none;
	border: none;
	border-radius: var(--radius-sm);
	color: var(--text-subtle);
	cursor: pointer;
	display: flex;
	justify-content: center;
	padding: 0.2em;
	transition:
		color var(--dur-fast) var(--ease-out),
		background-color var(--dur-fast) var(--ease-out);
}

.btn-action:hover {
	background: var(--hover-overlay);
	color: var(--contrast-color);
}

.btn-action--confirm:hover {
	color: var(--accent-color);
}

.btn-action--danger:hover {
	color: var(--danger-color);
}

.edit-input {
	background: var(--glass-bg-strong);
	border: 1px solid var(--glass-border);
	border-radius: var(--radius-sm);
	font-size: 13px;
	padding: 0.2em 0.4em;
}

.edit-input:focus {
	border-color: var(--focus-ring);
	outline: none;
}

.edit-input--title {
	flex: 1 1 auto;
	min-width: 0;
}

.edit-input--year {
	flex: 0 0 44px;
	min-width: 0;
	text-align: right;
	width: 44px;
}
</style>
