import type { MetadataRoute } from 'next'
import { findPoisByDepartment } from '@/api/generated/poi/poi'
import { nextCursor } from '@/api/fetcher'
import type { Poi } from '@/lib/poi'
import { DEPARTMENT_CODES } from '@/lib/seo/departments'
import { poiIndexVerdict } from '@/lib/seo/indexability'
import { with429Retry } from '@/lib/seo/retry'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-dynamic'

export async function generateSitemaps() {
  return DEPARTMENT_CODES.map((code) => ({ id: code }))
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const code = await props.id
  const now = Date.now()
  const entries: MetadataRoute.Sitemap = []
  let cursor: string | undefined

  do {
    const res = await with429Retry(() => findPoisByDepartment(code, { limit: 500, cursor }))
    for (const poi of res.data as unknown as Poi[]) {
      const verdict = poiIndexVerdict(poi, now)
      if (!verdict.index) continue
      entries.push({
        url: `${SITE_URL}/station/${poi.id}`,
        ...(verdict.lastModified && { lastModified: verdict.lastModified }),
      })
    }
    cursor = nextCursor(res)
  } while (cursor)

  return entries
}
