// Creates the /about-bhutan/ destination page as page-builder blocks:
//   ABOUT_JSON=/path/to/about-bhutan.json npx sanity exec scripts/import-about-bhutan.ts --with-user-token
// The JSON is what the writers produced (banner, intro, three photo rows, long body, CTA).
import {getCliClient} from 'sanity/cli'
import {readFileSync} from 'node:fs'
import {toPortableText} from './md-to-pt'

const client = getCliClient({apiVersion: '2025-02-19'})
const FILE = process.env.ABOUT_JSON || '/tmp/about-bhutan.json'
const ID = 'page-about-bhutan'

// Cover photos, chosen from Unsplash and checked by eye.
const PHOTOS: Record<string, {id: string; alt: string}> = {
  banner: {id: 'photo-1761048163886-eefd0e08455e', alt: 'Himalayan ranges rising in layers above Bhutan'},
  intro: {id: 'photo-1650747857310-c359fd3ee5c5', alt: 'The Buddha Dordenma statue on the hillside above Thimphu'},
  row0: {id: 'photo-1697601287571-8099b071466c', alt: 'A farmhouse among rice terraces in a Bhutanese valley'},
  row1: {id: 'photo-1762179861385-793eba9c7623', alt: 'Two young monks in red robes in a monastery doorway'},
  row2: {id: 'photo-1785073368033-39330f987d2f', alt: 'Pack horses resting in a Bhutanese pine forest'},
  cta: {id: 'photo-1761048163664-0d3b52141114', alt: ''},
}

const key = (() => {
  let n = 0
  return () => `b${(++n).toString(36)}`
})()

async function upload(id: string, name: string) {
  const res = await fetch(`https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=2400`)
  if (!res.ok) throw new Error(`${name}: image ${res.status}`)
  const asset = await client.assets.upload('image', Buffer.from(await res.arrayBuffer()), {filename: `about-bhutan-${name}.jpg`})
  console.log(`  uploaded ${name}`)
  return asset._id
}

const image = (assetId: string, alt: string) => ({
  _type: 'image',
  asset: {_type: 'reference', _ref: assetId},
  ...(alt ? {alt} : {}),
})

/** Plain paragraphs → simpleText (the paragraph-only rich text used inside blocks). */
const paragraphs = (text: string) => toPortableText(text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).join('\n\n'))

async function main() {
  const p = JSON.parse(readFileSync(FILE, 'utf8'))
  const assets: Record<string, string> = {}
  for (const [name, photo] of Object.entries(PHOTOS)) assets[name] = await upload(photo.id, name)

  const sections = [
    {_type: 'pageBanner', _key: key(), heading: p.bannerHeading, text: p.bannerText, image: image(assets.banner, PHOTOS.banner.alt)},
    {
      _type: 'intro', _key: key(), heading: p.introHeading, text: paragraphs(p.introText),
      image: image(assets.intro, PHOTOS.intro.alt), quote: p.introQuote, grey: false,
    },
    {
      _type: 'storyRows', _key: key(), grey: true,
      rows: p.rows.map((row: any, i: number) => ({
        _type: 'row', _key: key(), heading: row.heading, text: paragraphs(row.text),
        image: image(assets[`row${i}`], PHOTOS[`row${i}`].alt),
      })),
    },
    {_type: 'richText', _key: key(), heading: p.bodyHeading, body: toPortableText(p.body), grey: false},
    {_type: 'categoryTiles', _key: key(), heading: 'Bhutan tours by travel style', text: 'Every trip is private and can be tailored to your dates and pace.', grey: true},
    {
      _type: 'ctaBanner', _key: key(), heading: p.ctaHeading, text: p.ctaText,
      buttonLabel: 'Start planning', buttonLink: '/contact/', image: image(assets.cta, ''),
    },
  ]

  await client.createOrReplace({
    _id: ID,
    _type: 'page',
    title: 'About Bhutan',
    slug: {_type: 'slug', current: 'about-bhutan'},
    sections,
    seo: {_type: 'seo', title: p.seoTitle, description: p.seoDescription, noindex: false},
  })
  console.log(`✓ ${ID} — ${sections.length} blocks, body ${toPortableText(p.body).length} blocks`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
