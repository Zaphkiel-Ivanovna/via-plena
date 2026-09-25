import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

const HUB_PATHS = ['', '/stats', '/methodologie', '/a-propos']

export default function sitemap(): MetadataRoute.Sitemap {
  return HUB_PATHS.map((path) => ({ url: `${SITE_URL}${path}` }))
}
