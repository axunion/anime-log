<script setup lang="ts">
import { Library, Plus, X } from "@lucide/vue";
import { ref } from "vue";
import { useFilter } from "../../composables/useFilter";
import { useTitles } from "../../composables/useTitles";
import TitleAddModal from "./TitleAddModal.vue";
import TitleSearchItem from "./TitleSearchItem.vue";

const emit = defineEmits<{
  selectTitle: [id: number | null, title: string];
}>();

const { titles, updateTitle, deleteTitle } = useTitles();
const { query, filtered } = useFilter(titles, (t) => t.title);

const selectedId = ref<number | null>(null);
const addOpen = ref(false);

function onSelect(id: number, title: string) {
  if (selectedId.value === id) {
    selectedId.value = null;
    emit("selectTitle", null, "");
  } else {
    selectedId.value = id;
    emit("selectTitle", id, title);
  }
}

function onAdded(id: number, title: string) {
  query.value = "";
  selectedId.value = id;
  emit("selectTitle", id, title);
}

async function onUpdateTitle(
  id: number,
  fields: { title?: string; year?: number },
) {
  try {
    await updateTitle(id, fields);
  } catch {
    // Error displayed via App.vue banner.
  }
}

async function onDeleteTitle(id: number) {
  try {
    await deleteTitle(id);
  } catch {
    return;
  }
  if (selectedId.value === id) {
    selectedId.value = null;
    emit("selectTitle", null, "");
  }
}
</script>

<template>
	<section class="admin-section">
		<h2 class="admin-section-title">
			<Library :size="14" :stroke-width="2" />
			タイトル管理
			<span class="section-count">{{ titles.length }}件</span>
		</h2>

		<div class="admin-form">
			<button class="admin-form-button" type="button" @click="addOpen = true">
				<Plus :size="13" :stroke-width="2.5" />
				追加
			</button>
		</div>
		<TitleAddModal v-model:open="addOpen" @added="onAdded" />

		<div class="admin-form title-filter">
			<div class="filter-wrap">
				<input class="admin-form-input" v-model="query" type="text" placeholder="フィルター" />
				<button v-if="query" type="button" class="filter-clear" @click="query = ''" aria-label="フィルターをクリア">
					<X :size="12" :stroke-width="2.5" />
				</button>
			</div>
		</div>
		<ul class="admin-list">
			<TitleSearchItem
				v-for="t in filtered"
				:key="t.id"
				:id="t.id"
				:title-name="t.title"
				:year="t.year"
				:selected="t.id === selectedId"
				@select="onSelect(t.id, t.title)"
				@update="onUpdateTitle"
				@delete="onDeleteTitle"
			/>
		</ul>
	</section>
</template>

<style scoped>
@import "../styles/admin-shared.css";

.title-filter {
	border-top: 1px solid var(--glass-border);
	margin-bottom: 0.5em;
	margin-top: 0.75em;
	padding-top: 1em;
}
</style>
