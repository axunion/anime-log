/// <reference types="@cloudflare/vitest-pool-workers/types" />
import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { callApp } from "../../../test/helpers/app.ts";
import {
  applySchema,
  seedCast,
  seedHistory,
  seedTitle,
} from "../../../test/helpers/d1.ts";
import type { Bindings } from "../types.ts";

const typedEnv = env as unknown as Bindings;

describe("POST /api/import/data", () => {
  beforeEach(() => applySchema(typedEnv.DB));

  it("returns 401 without auth token", async () => {
    const res = await callApp(typedEnv, {
      method: "POST",
      path: "/import/data",
      body: [],
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 when confirm param is missing", async () => {
    const res = await callApp(typedEnv, {
      method: "POST",
      path: "/import/data",
      auth: true,
      body: [],
    });
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/Missing confirmation/);
  });

  it("returns 400 when confirm param has wrong value", async () => {
    const res = await callApp(typedEnv, {
      method: "POST",
      path: "/import/data?confirm=wrong",
      auth: true,
      body: [],
    });
    expect(res.status).toBe(400);
  });

  it("replaces all titles and cast with imported data", async () => {
    await seedTitle(typedEnv.DB, { title: "Old Anime", year: 2000 });

    const res = await callApp(typedEnv, {
      method: "POST",
      path: "/import/data?confirm=replace-all",
      auth: true,
      body: [
        {
          title: "New Anime",
          year: 2024,
          cast: [
            ["Actor A", "Char A"],
            ["Actor B", "Char B"],
          ],
        },
      ],
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { imported: number };
    expect(data.imported).toBe(1);

    const exported = await callApp(typedEnv, { path: "/export/data" });
    const rows = (await exported.json()) as {
      title: string;
      year: number;
      cast: [string, string][];
    }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("New Anime");
    expect(rows[0].cast).toEqual([
      ["Actor A", "Char A"],
      ["Actor B", "Char B"],
    ]);
  });

  it("cascades: existing history is removed when data is replaced", async () => {
    const id = await seedTitle(typedEnv.DB, {
      title: "Has History",
      year: 2010,
    });
    await seedHistory(typedEnv.DB, [{ title_id: id, year: 2020 }]);

    const res = await callApp(typedEnv, {
      method: "POST",
      path: "/import/data?confirm=replace-all",
      auth: true,
      body: [{ title: "Fresh Title", year: 2024, cast: [] }],
    });
    expect(res.status).toBe(200);

    const histRes = await callApp(typedEnv, { path: "/export/history" });
    const history = (await histRes.json()) as unknown[];
    expect(history).toHaveLength(0);
  });

  it("returns 400 for duplicate titles in payload", async () => {
    const res = await callApp(typedEnv, {
      method: "POST",
      path: "/import/data?confirm=replace-all",
      auth: true,
      body: [
        { title: "Same Anime", year: 2024, cast: [] },
        { title: "Same Anime", year: 2025, cast: [] },
      ],
    });
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/Duplicate/);
  });

  it("preserves existing data when payload has duplicate titles", async () => {
    await seedTitle(typedEnv.DB, { title: "Existing Anime", year: 2000 });

    const res = await callApp(typedEnv, {
      method: "POST",
      path: "/import/data?confirm=replace-all",
      auth: true,
      body: [
        { title: "Dup", year: 2024, cast: [] },
        { title: "Dup", year: 2025, cast: [] },
      ],
    });
    expect(res.status).toBe(400);

    // Existing data must be untouched — the duplicate check fires before deletion.
    const exported = await callApp(typedEnv, { path: "/export/data" });
    const rows = (await exported.json()) as { title: string }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Existing Anime");
  });

  it("returns 400 for invalid body (empty title)", async () => {
    const res = await callApp(typedEnv, {
      method: "POST",
      path: "/import/data?confirm=replace-all",
      auth: true,
      body: [{ title: "", year: 2024, cast: [] }],
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for malformed cast tuple", async () => {
    const res = await callApp(typedEnv, {
      method: "POST",
      path: "/import/data?confirm=replace-all",
      auth: true,
      body: [{ title: "Anime", year: 2024, cast: [["Actor Only"]] }],
    });
    expect(res.status).toBe(400);
  });

  it("handles titles with no cast", async () => {
    const res = await callApp(typedEnv, {
      method: "POST",
      path: "/import/data?confirm=replace-all",
      auth: true,
      body: [{ title: "No Cast", year: 2024 }],
    });
    expect(res.status).toBe(200);

    const exported = await callApp(typedEnv, { path: "/export/data" });
    const rows = (await exported.json()) as {
      title: string;
      cast: unknown[];
    }[];
    expect(rows[0].cast).toEqual([]);
  });

  it("handles a title with more than 100 cast members (batch split)", async () => {
    const cast: [string, string][] = Array.from({ length: 105 }, (_, i) => [
      `Actor ${i}`,
      `Char ${i}`,
    ]);

    const res = await callApp(typedEnv, {
      method: "POST",
      path: "/import/data?confirm=replace-all",
      auth: true,
      body: [{ title: "Big Cast", year: 2024, cast }],
    });
    expect(res.status).toBe(200);

    const exported = await callApp(typedEnv, { path: "/export/data" });
    const rows = (await exported.json()) as { cast: [string, string][] }[];
    expect(rows[0].cast).toHaveLength(105);
  });
});

describe("POST /api/import/history", () => {
  beforeEach(() => applySchema(typedEnv.DB));

  it("returns 401 without auth token", async () => {
    const res = await callApp(typedEnv, {
      method: "POST",
      path: "/import/history",
      body: [],
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 when confirm param is missing", async () => {
    const res = await callApp(typedEnv, {
      method: "POST",
      path: "/import/history",
      auth: true,
      body: [],
    });
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/Missing confirmation/);
  });

  it("returns 400 when confirm param has wrong value", async () => {
    const res = await callApp(typedEnv, {
      method: "POST",
      path: "/import/history?confirm=wrong",
      auth: true,
      body: [],
    });
    expect(res.status).toBe(400);
  });

  it("replaces existing history with imported data", async () => {
    const id = await seedTitle(typedEnv.DB, { title: "Eva", year: 1995 });
    await seedHistory(typedEnv.DB, [{ title_id: id, year: 2020 }]);

    await seedTitle(typedEnv.DB, { title: "NGE Rebuild", year: 2007 });

    const res = await callApp(typedEnv, {
      method: "POST",
      path: "/import/history?confirm=replace-all",
      auth: true,
      body: [
        { title: "Eva", year: 2023 },
        { title: "NGE Rebuild", name: "序", year: 2024 },
      ],
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { imported: number };
    expect(data.imported).toBe(2);

    const exported = await callApp(typedEnv, { path: "/export/history" });
    const rows = (await exported.json()) as Record<string, unknown>[];
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ title: "Eva", year: 2023 });
    expect("name" in rows[0]).toBe(false);
    expect(rows[1]).toEqual({ title: "NGE Rebuild", name: "序", year: 2024 });
  });

  it("returns 400 with unknown title in response body", async () => {
    const res = await callApp(typedEnv, {
      method: "POST",
      path: "/import/history?confirm=replace-all",
      auth: true,
      body: [{ title: "Unknown Anime", year: 2024 }],
    });
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string; title: string };
    expect(data.error).toBe("Unknown title");
    expect(data.title).toBe("Unknown Anime");
  });

  it("does not modify titles or cast_members", async () => {
    const id = await seedTitle(typedEnv.DB, { title: "Eva", year: 1995 });
    await seedCast(typedEnv.DB, id, [
      { actor_name: "Ogata Megumi", character_name: "Shinji" },
    ]);

    await callApp(typedEnv, {
      method: "POST",
      path: "/import/history?confirm=replace-all",
      auth: true,
      body: [{ title: "Eva", year: 2024 }],
    });

    const exported = await callApp(typedEnv, { path: "/export/data" });
    const rows = (await exported.json()) as {
      title: string;
      cast: [string, string][];
    }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Eva");
    expect(rows[0].cast).toHaveLength(1);
  });

  it("accepts empty array and clears history", async () => {
    const id = await seedTitle(typedEnv.DB, { title: "Eva", year: 1995 });
    await seedHistory(typedEnv.DB, [{ title_id: id, year: 2020 }]);

    const res = await callApp(typedEnv, {
      method: "POST",
      path: "/import/history?confirm=replace-all",
      auth: true,
      body: [],
    });
    expect(res.status).toBe(200);

    const exported = await callApp(typedEnv, { path: "/export/history" });
    const rows = (await exported.json()) as unknown[];
    expect(rows).toHaveLength(0);
  });
});

describe("import size limits", () => {
  beforeEach(() => applySchema(typedEnv.DB));

  it("returns 400 when data payload exceeds max rows", async () => {
    const body = Array.from({ length: 10001 }, (_, i) => ({
      title: `Title ${i}`,
      year: 2024,
    }));

    const res = await callApp(typedEnv, {
      method: "POST",
      path: "/import/data?confirm=replace-all",
      auth: true,
      body,
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when history payload exceeds max rows", async () => {
    const body = Array.from({ length: 10001 }, (_, i) => ({
      title: `Title ${i}`,
      year: 2024,
    }));

    const res = await callApp(typedEnv, {
      method: "POST",
      path: "/import/history?confirm=replace-all",
      auth: true,
      body,
    });
    expect(res.status).toBe(400);
  });
});
