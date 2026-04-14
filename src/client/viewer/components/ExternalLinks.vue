<script setup lang="ts">
import { X } from "lucide-vue-next";
import { computed } from "vue";
import WikipediaIcon from "./WikipediaIcon.vue";

const props = defineProps<{
	text: string;
}>();

defineEmits<{
	close: [];
}>();

const googleUrl = computed(
	() => `https://www.google.com/search?q=${encodeURIComponent(props.text)}`,
);

const wikiUrl = computed(
	() =>
		`https://ja.wikipedia.org/w/index.php?search=${encodeURIComponent(props.text)}`,
);
</script>

<template>
	<div class="links-header">
		<button class="panel-close-btn" type="button" aria-label="Close" @click="$emit('close')">
			<X :size="16" :stroke-width="1.75" />
		</button>
		<a class="link-google" :href="googleUrl" target="_blank" rel="noopener">{{ text }}</a>
		<a class="link-wikipedia" :href="wikiUrl" target="_blank" rel="noopener" aria-label="Wikipedia">
			<WikipediaIcon />
		</a>
	</div>
</template>

<style scoped>
.links-header {
	align-items: center;
	display: flex;
	gap: 0.5em;
	justify-content: space-between;
	letter-spacing: 0.05em;
	margin: 1em;
}

.panel-close-btn,
.link-wikipedia {
	align-items: center;
	border-radius: 8px;
	color: var(--text-muted);
	cursor: pointer;
	display: inline-flex;
	flex: 0 0 28px;
	height: 28px;
	justify-content: center;
	transition: color 0.15s, background 0.15s;
	width: 28px;
}

.panel-close-btn:hover,
.link-wikipedia:hover {
	background: var(--hover-overlay);
}

.link-wikipedia:hover :deep(.wiki-icon) {
	opacity: 1;
}

.link-google {
	flex: 1;
	overflow: hidden;
	text-align: center;
	text-overflow: ellipsis;
	white-space: nowrap;
}
</style>
