import { computed, ref } from "vue";

// Token is persisted to localStorage by admin/main.ts on the first visit via the
// secret URL (/<API_TOKEN>). Subsequent reloads read it back from storage here.
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
