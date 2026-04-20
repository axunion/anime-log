import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { del, get, post, put } from "./api.ts";

const mockFetch = vi.fn();

beforeEach(() => {
	mockFetch.mockClear();
	vi.stubGlobal("fetch", mockFetch);
	vi.stubGlobal("localStorage", {
		getItem: vi.fn().mockReturnValue("my-secret-token"),
	});
});

afterEach(() => {
	vi.unstubAllGlobals();
});

function makeResponse(body: unknown, ok = true, status = 200) {
	return {
		ok,
		status,
		statusText: ok ? "OK" : "Error",
		json: () => Promise.resolve(body),
	};
}

describe("get", () => {
	it("does not attach Authorization header", async () => {
		mockFetch.mockResolvedValue(makeResponse([]));
		await get("/titles");
		const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
		const headers = new Headers(options?.headers);
		expect(headers.has("authorization")).toBe(false);
	});

	it("calls /api<path>", async () => {
		mockFetch.mockResolvedValue(makeResponse([]));
		await get("/titles");
		expect(mockFetch.mock.calls[0][0]).toBe("/api/titles");
	});
});

describe("post", () => {
	it("attaches Authorization Bearer token", async () => {
		mockFetch.mockResolvedValue(makeResponse({}));
		await post("/titles", { title: "X", year: 2024 });
		const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
		const headers = new Headers(options?.headers);
		expect(headers.get("authorization")).toBe("Bearer my-secret-token");
	});

	it("sets Content-Type application/json", async () => {
		mockFetch.mockResolvedValue(makeResponse({}));
		await post("/titles", {});
		const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
		const headers = new Headers(options?.headers);
		expect(headers.get("content-type")).toBe("application/json");
	});

	it("serializes body as JSON string", async () => {
		mockFetch.mockResolvedValue(makeResponse({}));
		const payload = { title: "Test", year: 2024 };
		await post("/titles", payload);
		const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
		expect(options?.body).toBe(JSON.stringify(payload));
	});
});

describe("put", () => {
	it("attaches Authorization Bearer token", async () => {
		mockFetch.mockResolvedValue(makeResponse({}));
		await put("/titles/1", { title: "Updated" });
		const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
		const headers = new Headers(options?.headers);
		expect(headers.get("authorization")).toBe("Bearer my-secret-token");
	});
});

describe("del", () => {
	it("attaches Authorization Bearer token", async () => {
		mockFetch.mockResolvedValue(makeResponse({}));
		await del("/titles/1");
		const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
		const headers = new Headers(options?.headers);
		expect(headers.get("authorization")).toBe("Bearer my-secret-token");
	});

	it("uses DELETE method", async () => {
		mockFetch.mockResolvedValue(makeResponse({}));
		await del("/titles/1");
		const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
		expect(options?.method).toBe("DELETE");
	});
});

describe("error handling", () => {
	it("throws Error with status when response is not ok", async () => {
		mockFetch.mockResolvedValue(makeResponse({}, false, 404));
		await expect(get("/missing")).rejects.toThrow("404");
	});
});
