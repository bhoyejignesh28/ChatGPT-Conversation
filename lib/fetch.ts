export async function fetchJSON<T>({
  url,
  method = "GET",
  body,
  headers,
  formData
}: {
  url: string;
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  formData?: FormData;
}): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: formData
      ? undefined
      : {
          "Content-Type": "application/json",
          ...(headers ?? {})
        },
    body: formData ? formData : body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  return data as T;
}
