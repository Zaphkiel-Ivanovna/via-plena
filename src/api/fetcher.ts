const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`API ${status}`)
    this.name = 'ApiError'
  }
}

interface OrvalResponse<T> {
  data: T
  status: number
  headers: Headers
}

export async function viaplenaFetcher<T extends OrvalResponse<unknown>>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`

  const hasBody = init?.body != null
  const res = await fetch(fullUrl, {
    ...init,
    headers: {
      ...(hasBody && { 'Content-Type': 'application/json' }),
      ...init?.headers,
    },
  })

  if (!res.ok) {
    let body: unknown
    try {
      body = await res.json()
    } catch {
      body = await res.text().catch(() => '')
    }
    throw new ApiError(res.status, body)
  }

  const data = res.status === 204 ? undefined : await res.json()
  return { data, status: res.status, headers: res.headers } as T
}

export const nextCursor = (last: { headers: Headers }): string | undefined =>
  last.headers.get('x-next-cursor') ?? undefined
