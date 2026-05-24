<script setup lang="ts">
import { ref } from "vue";
import { useAuth } from "../../composables/useAuth";

const { setToken } = useAuth();
const input = ref("");
const error = ref("");

function onSubmit() {
	const t = input.value.trim();
	if (!t) {
		error.value = "トークンを入力してください";
		return;
	}
	setToken(t);
}
</script>

<template>
	<div class="login-container">
		<div class="login-card glass-surface">
			<h2 class="login-title">Admin</h2>
			<form class="login-form" @submit.prevent="onSubmit">
				<input
					v-model="input"
					class="login-input"
					type="password"
					placeholder="API トークン"
					autocomplete="current-password"
					autofocus
				/>
				<p v-if="error" class="login-error">{{ error }}</p>
				<button class="login-btn" type="submit">ログイン</button>
			</form>
		</div>
	</div>
</template>

<style scoped>
.login-container {
	align-items: center;
	display: flex;
	height: 100vh;
	justify-content: center;
}

.login-card {
	border: 1px solid var(--glass-border);
	border-radius: 16px;
	padding: 2em 2.5em;
	width: 320px;
}

.login-title {
	font-size: 1.1em;
	font-weight: 600;
	margin: 0 0 1.25em;
}

.login-form {
	display: flex;
	flex-direction: column;
	gap: 0.75em;
}

.login-input {
	background: var(--glass-bg-strong);
	border: 1px solid var(--glass-border);
	border-radius: 8px;
	font-size: 13px;
	padding: 0.55em 0.75em;
	transition: border-color 0.15s, box-shadow 0.15s;
	width: 100%;
	box-sizing: border-box;
}

.login-input:focus {
	border-color: var(--focus-ring);
	box-shadow: 0 0 0 3px var(--focus-glow);
	outline: none;
}

.login-error {
	color: var(--danger-color, #e53e3e);
	font-size: 12px;
	margin: 0;
}

.login-btn {
	background: var(--accent-color);
	border-radius: 8px;
	color: #fff;
	cursor: pointer;
	font-size: 13px;
	font-weight: 500;
	height: 34px;
	transition: filter 0.15s;
}

.login-btn:hover {
	filter: brightness(1.1);
}
</style>
