// Imports travel guides into Sanity from a JSON file.
//   GUIDES_JSON=/path/to/guides.json npx sanity exec scripts/import-guides.ts --with-user-token
// Each entry: {slug, title, excerpt, seoTitle, seoDescription, body (markdown), group, order,
//              inMenu?, updated?, image?: {url, alt, credit?}}
// The body is the restricted markdown the writers produce: ##/### headings, - and 1. lists,
// > quotes, **bold**, *italic*, [text](href) and simple pipe tables.
import {getCliClient} from 'sanity/cli'
import {readFileSync} from 'node:fs'

import {toPortableText} from './md-to-pt'

const client = getCliClient({apiVersion: '2025-02-19'})
const FILE = process.env.GUIDES_JSON || '/tmp/guides.json'

// ---------- image ----------
async function upload(url: string, filename: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`image ${url} → ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const asset = await client.assets.upload('image', buf, {filename})
  return asset._id
}

// ---------- run ----------
async function main() {
  const guides = JSON.parse(readFileSync(FILE, 'utf8'))
  const today = new Date().toISOString().slice(0, 10)
  for (const g of guides) {
    const _id = `guide-${g.slug}`
    const existing = await client.fetch<{image?: any} | null>(`*[_id == $id][0]{image}`, {id: _id})
    let image = existing?.image
    if (g.image?.url) {
      const assetId = await upload(g.image.url, `${g.slug}.jpg`)
      image = {_type: 'image', asset: {_type: 'reference', _ref: assetId}, alt: g.image.alt || ''}
      console.log(`  uploaded cover for ${g.slug}`)
    }
    if (!image) throw new Error(`${g.slug}: no cover image (existing doc has none and none supplied)`)
    const doc = {
      _id,
      _type: 'guide',
      title: g.title,
      slug: {_type: 'slug', current: g.slug},
      excerpt: g.excerpt,
      image,
      group: g.group,
      order: g.order ?? 99,
      inMenu: !!g.inMenu,
      updated: g.updated || today,
      body: toPortableText(g.body),
      seo: {
        _type: 'seo',
        title: g.seoTitle,
        description: g.seoDescription,
        noindex: false,
      },
    }
    await client.createOrReplace(doc)
    console.log(`✓ ${g.slug} — ${doc.body.length} blocks`)
  }
  console.log(`done: ${guides.length} guides`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
