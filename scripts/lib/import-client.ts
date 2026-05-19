function errorDetail(
	body: { issues?: unknown[]; title?: string } | null,
): string {
	if (body?.title) return `: "${body.title}"`;
	if (body?.issues) return `\n${JSON.stringify(body.issues, null, 2)}`;
	return "";
}

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
		const body = (await res.json().catch(() => null)) as {
			error?: string;
			issues?: unknown[];
			title?: string;
		} | null;
		throw new Error(
			(body?.error ?? `${res.status} ${res.statusText}`) + errorDetail(body),
		);
	}
	return res.json() as Promise<{ imported: number }>;
}
