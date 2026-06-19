// Token is persisted to localStorage by admin/main.ts on the first visit via the
// secret URL (/<API_TOKEN>). Subsequent reloads read it back from storage here.
let token = localStorage.getItem("api_token") ?? "";

export function useAuth() {
  function setToken(t: string) {
    token = t;
    localStorage.setItem("api_token", t);
  }

  function getToken(): string {
    return token;
  }

  return { setToken, getToken };
}
