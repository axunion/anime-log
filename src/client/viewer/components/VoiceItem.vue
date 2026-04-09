<script setup lang="ts">
import { ref } from "vue";

defineProps<{
	titleName: string;
	characterName: string;
}>();

const showPart = ref(false);
</script>

<template>
	<dt @click="showPart = !showPart">
		<span class="title">{{ titleName }}</span>
	</dt>
	<dd :class="{ show: showPart }">
		<span
			v-for="(part, i) in characterName.split(', ')"
			:key="i"
			class="part-line"
		>{{ part }}</span>
	</dd>
</template>

<style scoped>
dt {
	letter-spacing: 0.1em;
	padding: 0.25em 0;
	cursor: pointer;
}

dd {
	display: none;
	margin: 0 0 0.25em 2em;
}

dd.show {
	display: block;
}

.part-line {
	color: var(--gray-color);
	display: block;
	font-size: 85%;
	line-height: 1.5;
}
</style>
