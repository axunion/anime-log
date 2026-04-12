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
		<th class="name" :title="actorName" @click="$emit('actorClick', actorName)">
			{{ actorName }}
		</th>
		<td class="part">
			<span
				v-for="(part, i) in characterName.split(', ')"
				:key="i"
				class="part-line"
			>{{ part }}</span>
		</td>
	</tr>
</template>

<style scoped>
th {
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

td {
	padding: 0 1em 0 0.5em;
	width: 60%;
}

.part {
	color: var(--text-muted);
	font-size: 85%;
}

.part-line {
	display: block;
}
</style>
