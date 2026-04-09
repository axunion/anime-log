<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
	text: string;
}>();

const emit = defineEmits<{
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
	<div class="h">
		<button class="close" type="button" @click="$emit('close')">×</button>
		<a class="goog" :href="googleUrl" target="_blank" rel="noopener">{{ text }}</a>
		<a class="wkpd icon-wikipedia" :href="wikiUrl" target="_blank" rel="noopener"></a>
	</div>
</template>

<style scoped>
.h {
	align-items: center;
	display: flex;
	justify-content: space-between;
	letter-spacing: 0.1em;
	margin: 1.5em 1em 1em;
}

.close,
.wkpd {
	cursor: pointer;
	flex: 0 1 32px;
	font-size: 16px;
	text-align: center;
}
</style>
