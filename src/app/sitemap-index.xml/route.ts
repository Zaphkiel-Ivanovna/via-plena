import { DEPARTMENT_CODES } from '@/lib/seo/departments'
import { SITE_URL } from '@/lib/site'

export const revalidate = 86400

export function GET() {
  const locs = [
    `${SITE_URL}/sitemap.xml`,
    `${SITE_URL}/prix-carburant/sitemap.xml`,
    ...DEPARTMENT_CODES.map((code) => `${SITE_URL}/station/sitemap/${code}.xml`),
  ]
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    locs.map((loc) => `  <sitemap><loc>${loc}</loc></sitemap>`).join('\n') +
    '\n</sitemapindex>\n'
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}
