import { ApiError } from '@/api/fetcher'

export async function with429Retry<T>(fn: () => Promise<T>, attempts = 5): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn()
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 429 || i >= attempts - 1) throw error
      await new Promise((r) => setTimeout(r, 2 ** i * 2000))
    }
  }
}
