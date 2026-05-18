export async function postImport(
	baseUrl: string,
	token: string,
	path: string,
	payload: unknown,
): Promise<{ imported: number }> {
	console.log(`  → ${baseUrl}${path}`);
	const res = await fetch(`${baseUrl}${path}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(payload),
	});
	if (!res.ok) {
		const body = (await res.json().catch(() => null)) as { error?: string } | null;
		throw new Error(body?.error ?? `${res.status} ${res.statusText}`);
	}
	return res.json() as Promise<{ imported: number }>;
}
