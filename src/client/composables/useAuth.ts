import { computed, ref } from "vue";

const token = ref(localStorage.getItem("api_token") ?? "");

export function useAuth() {
	const isAuthenticated = computed(() => token.value.length > 0);

	function setToken(t: string) {
		token.value = t;
		localStorage.setItem("api_token", t);
	}

	function clearToken() {
		token.value = "";
		localStorage.removeItem("api_token");
	}

	function getToken(): string {
		return token.value;
	}

	return { token, isAuthenticated, setToken, clearToken, getToken };
}
