<script setup lang="ts">
import { ref } from "vue";

defineProps<{
	titleName: string;
	characterName: string;
}>();

const showPart = ref(false);
</script>

<template>
	<dt class="voice-title" @click="showPart = !showPart">
		<span class="title">{{ titleName }}</span>
	</dt>
	<dd class="voice-detail" :class="{ show: showPart }">
		<span
			v-for="(part, i) in characterName.split(', ')"
			:key="i"
			class="part-line"
		>{{ part }}</span>
	</dd>
</template>

<style scoped>
.voice-title {
	cursor: pointer;
	letter-spacing: 0.1em;
	padding: 0.25em 0;
}

.voice-detail {
	display: none;
	margin: 0 0 0.25em 2em;
}

.voice-detail.show {
	display: block;
}

.part-line {
	color: var(--text-muted);
	display: block;
	font-size: 85%;
	line-height: 1.5;
}
</style>
