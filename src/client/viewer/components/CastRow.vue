<script setup lang="ts">
defineProps<{
	actorName: string;
	characterName: string;
}>();

defineEmits<{
	actorClick: [name: string];
}>();
</script>

<template>
	<tr>
		<th class="cast-actor" :title="actorName" @click="$emit('actorClick', actorName)">
			{{ actorName }}
		</th>
		<td class="cast-character">
			<span
				v-for="(part, i) in characterName.split(', ')"
				:key="i"
				class="part-line"
			>{{ part }}</span>
		</td>
	</tr>
</template>

<style scoped>
.cast-actor {
	cursor: pointer;
	font-weight: normal;
	letter-spacing: 1px;
	overflow: hidden;
	padding: 2px 0 2px 1em;
	text-align: right;
	text-overflow: ellipsis;
	vertical-align: top;
	white-space: nowrap;
}

.cast-character {
	color: var(--text-muted);
	font-size: 85%;
	padding: 0 1em 0 0.5em;
	width: 60%;
}

.part-line {
	display: block;
}
</style>
