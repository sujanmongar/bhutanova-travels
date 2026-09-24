// Imports destinations and their sights into Sanity as DRAFTS (nothing goes live until someone publishes).
//   CONTENT_DIR=/path/to/dest-content IMAGES_JSON=/path/to/images.json npx sanity exec scripts/import-destinations.ts --with-user-token
// CONTENT_DIR holds the writers' files: {destinations: [...], sights: [...]}, bodies in the restricted markdown
// md-to-pt.ts understands. IMAGES_JSON maps "<destination>" or "<destination>/<sight>" to
// {url, credit?, source?: {name, id, url}} (downloaded and uploaded) or {asset: "image-…"} (an existing asset).
// Existing destinations keep their content; only the fields present in the file (and a new cover) change.
import {getCliClient} from 'sanity/cli'
import {readFileSync, readdirSync} from 'node:fs'
import {join} from 'node:path'

import {toPortableText} from './md-to-pt'

const client = getCliClient({apiVersion: '2025-02-19'}).withConfig({perspective: 'raw'})
const DIR = process.env.CONTENT_DIR || '/tmp/dest-content'
const IMAGES: Record<string, any> = JSON.parse(readFileSync(process.env.IMAGES_JSON || '/tmp/images.json', 'utf8'))
const BRAND = ' | Bhutanova Travels'
const today = new Date().toISOString().slice(0, 10)

// Menu order runs west to east; "nearby" is closest first by road.
const ORDER = ['paro', 'thimphu', 'punakha', 'haa-valley', 'wangdue-phodrang', 'phobjikha-gangtey', 'trongsa', 'bumthang']
const NEARBY: Record<string, string[]> = {
  paro: ['haa-valley', 'thimphu', 'punakha'],
  thimphu: ['paro', 'punakha', 'haa-valley'],
  punakha: ['thimphu', 'wangdue-phodrang', 'phobjikha-gangtey'],
  'haa-valley': ['paro', 'thimphu'],
  'wangdue-phodrang': ['punakha', 'phobjikha-gangtey', 'trongsa'],
  'phobjikha-gangtey': ['wangdue-phodrang', 'trongsa', 'punakha'],
  trongsa: ['bumthang', 'phobjikha-gangtey', 'wangdue-phodrang'],
  bumthang: ['trongsa', 'phobjikha-gangtey'],
}
// Tours whose itinerary stops here (existing destinations keep the tours they already list).
const TOURS: Record<string, string[]> = {
  'phobjikha-gangtey': ['bhutan-cultural-extravaganza', 'bumthang-heartland-journey'],
  trongsa: ['bumthang-heartland-journey'],
  bumthang: ['bumthang-heartland-journey'],
}

const key = (s: string) => s.replace(/[^a-z0-9]/gi, '').slice(0, 12) + Math.random().toString(36).slice(2, 6)
let published = new Set<string>()
// A reference to a document that only exists as a draft must be weak until that document is published.
const ref = (id: string, type: string, inArray = false) => ({
  _type: 'reference',
  _ref: id,
  ...(inArray ? {_key: key(id)} : {}),
  ...(published.has(id) ? {} : {_weak: true, _strengthenOnPublish: {type}}),
})
const seo = (e: any) =>
  e.seoTitle || e.seoDescription
    ? {_type: 'seo', title: e.seoTitle && (e.seoTitle.length + BRAND.length <= 60 ? e.seoTitle + BRAND : e.seoTitle), description: e.seoDescription, noindex: false}
    : undefined

async function image(k: string) {
  const m = IMAGES[k]
  if (!m) return undefined
  let assetId = m.asset
  if (!assetId) {
    const res = await fetch(m.url, {headers: {'User-Agent': 'BhutanovaTravels/1.0 (image import)'}})
    if (!res.ok) throw new Error(`image ${k}: ${m.url} → ${res.status}`)
    const asset = await client.assets.upload('image', Buffer.from(await res.arrayBuffer()), {
      filename: `${k.replace('/', '-')}.jpg`,
      creditLine: m.credit,
      source: m.source,
    })
    assetId = asset._id
    console.log(`  uploaded ${k}`)
  }
  return {_type: 'image', asset: {_type: 'reference', _ref: assetId}}
}
const clean = (doc: Record<string, any>) => Object.fromEntries(Object.entries(doc).filter(([, v]) => v !== undefined && v !== ''))

async function main() {
  const files = readdirSync(DIR).filter((f) => f.endsWith('.json'))
  const data = files.map((f) => JSON.parse(readFileSync(join(DIR, f), 'utf8')))
  const destinations = data.flatMap((d) => d.destinations ?? [])
  const sights = data.flatMap((d) => d.sights ?? [])
  published = new Set(await client.fetch<string[]>(`*[_type in ["destination", "tour"] && !(_id in path("drafts.**"))]._id`))

  for (const e of destinations) {
    const id = `destination-${e.slug}`
    const existing = await client.fetch<any>(`coalesce(*[_id == $d][0], *[_id == $id][0])`, {d: `drafts.${id}`, id})
    const {_rev, _createdAt, _updatedAt, ...base} = existing ?? {}
    const cover = await image(e.slug)
    const tours = TOURS[e.slug]
    const doc = clean({
      ...base,
      _id: `drafts.${id}`,
      _type: 'destination',
      title: e.title ?? base.title,
      slug: base.slug ?? {_type: 'slug', current: e.slug},
      excerpt: e.excerpt ?? base.excerpt,
      image: cover ?? base.image,
      body: e.body ? toPortableText(e.body) : base.body,
      region: e.region,
      altitude: e.altitude,
      bestTime: e.bestTime ?? base.bestTime,
      gettingThere: e.gettingThere ?? base.gettingThere,
      tours: tours ? tours.map((t) => ref(`tour-${t}`, 'tour', true)) : base.tours,
      nearby: (NEARBY[e.slug] ?? []).map((n) => ref(`destination-${n}`, 'destination', true)),
      order: ORDER.indexOf(e.slug) + 1 || base.order || 99,
      seo: seo(e) ?? base.seo,
    })
    if (!doc.image) throw new Error(`${e.slug}: no cover image`)
    await client.createOrReplace(doc as any)
    console.log(`✓ destination ${e.slug}${existing ? ' (updated)' : ''}`)
  }

  for (const e of sights) {
    const k = `${e.destination}/${e.slug}`
    const cover = e.page ? await image(k) : undefined
    if (e.page && !cover) throw new Error(`${k}: a page sight needs an image`)
    const doc = clean({
      _id: `drafts.sight-${e.destination}-${e.slug}`,
      _type: 'sight',
      title: e.title,
      slug: {_type: 'slug', current: e.slug},
      destination: ref(`destination-${e.destination}`, 'destination'),
      excerpt: e.excerpt,
      page: !!e.page,
      image: cover,
      altitude: e.page ? e.altitude : undefined,
      timeNeeded: e.page ? e.timeNeeded : undefined,
      difficulty: e.page ? e.difficulty : undefined,
      bestTime: e.page ? e.bestTime : undefined,
      body: e.page ? toPortableText(e.body) : undefined,
      updated: e.page ? today : undefined,
      order: e.order ?? 99,
      seo: e.page ? seo(e) : undefined,
    })
    await client.createOrReplace(doc as any)
    console.log(`✓ sight ${k}${e.page ? ' (page)' : ''}`)
  }
  console.log(`done: ${destinations.length} destinations, ${sights.length} sights (drafts)`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
