import type { MetadataRoute } from 'next'
import { getCommunesIndex } from '@/api/generated/communes/communes'
import { communePath, isCommuneIndexable } from '@/lib/commune-data'
import { with429Retry } from '@/lib/seo/retry'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const res = await with429Retry(() => getCommunesIndex())
  if (res.status !== 200) throw new Error(`communes index: HTTP ${res.status}`)
  return res.data
    .filter((c) => c.slug && isCommuneIndexable(Number(c.gasFresh), Number(c.evStations)))
    .map((c) => ({
      url: `${SITE_URL}${communePath(c.slug)}`,
      ...(c.lastModified && { lastModified: new Date(c.lastModified) }),
    }))
}
