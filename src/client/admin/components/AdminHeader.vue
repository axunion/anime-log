<script setup lang="ts">
function setToken() {
	const current = localStorage.getItem("api_token") ?? "";
	const token = prompt("API Token:", current);
	if (token !== null) localStorage.setItem("api_token", token);
}
</script>

<template>
	<header class="admin-header">
		<h1>anime admin</h1>
		<button class="btn-token" type="button" @click="setToken">token</button>
	</header>
</template>

<style scoped>
.admin-header {
	align-items: center;
	border-bottom: var(--border-strong) solid 1px;
	display: flex;
	justify-content: space-between;
	padding: 0.5em 0;
}

.admin-header h1 {
	font-size: 1em;
	font-weight: normal;
	letter-spacing: 0.1em;
	margin: 0;
}

.btn-token {
	background: none;
	border: var(--border-strong) solid 1px;
	border-radius: 4px;
	color: var(--text-muted);
	cursor: pointer;
	font-size: 12px;
	padding: 0.2em 0.75em;
}
</style>
