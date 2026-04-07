const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
	const res = await fetch(`${BASE}${path}`, options);
	if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
	return res.json() as Promise<T>;
}

export function get<T>(path: string): Promise<T> {
	return request<T>(path);
}

function getToken(): string {
	return localStorage.getItem("api_token") ?? "";
}

function authHeaders(): HeadersInit {
	return {
		"Content-Type": "application/json",
		Authorization: `Bearer ${getToken()}`,
	};
}

export function post<T>(path: string, body: unknown): Promise<T> {
	return request<T>(path, {
		method: "POST",
		headers: authHeaders(),
		body: JSON.stringify(body),
	});
}

export function put<T>(path: string, body: unknown): Promise<T> {
	return request<T>(path, {
		method: "PUT",
		headers: authHeaders(),
		body: JSON.stringify(body),
	});
}

export function del<T>(path: string): Promise<T> {
	return request<T>(path, { method: "DELETE", headers: authHeaders() });
}
