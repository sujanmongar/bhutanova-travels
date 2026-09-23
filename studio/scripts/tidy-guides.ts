// One-off tidy after the guide library was expanded:
//   npx sanity exec scripts/tidy-guides.ts --with-user-token
// - retitles and reorders the guides that already existed, and ticks the six for the header menu
// - rewrites every /tours/… link in every document to the new /bhutan-tours/… address
// - retires the two guides whose content was split into new ones (redirects live in scripts/redirects.mjs)
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2025-02-19'})

const UPDATE: Record<string, {title?: string; order: number; inMenu?: boolean}> = {
  'how-to-book': {order: 1},
  'visa-and-immigration': {title: 'Bhutan Visa Guide', order: 7, inMenu: true},
  'getting-to-bhutan': {title: 'Flights to Bhutan', order: 8, inMenu: true},
  'sustainable-development-fee': {title: 'Sustainable Development Fee (SDF)', order: 10, inMenu: true},
  'money-and-payments': {title: 'Bhutan Currency & Payments', order: 11},
  'what-to-pack': {title: 'Bhutan Packing Checklist', order: 6},
  'mountains-and-trekking': {title: 'Mountains & Trekking in Bhutan', order: 20},
}
const RETIRE = ['guide-best-time-and-weather', 'guide-etiquette-health-and-safety']

// Old flat tour URLs → where that tour lives now.
const TOUR_URL: Record<string, string> = {
  'glimpse-of-bhutan': '/bhutan-tours/cultural-tours/6-days-glimpse-of-bhutan/',
  'bhutan-cultural-extravaganza': '/bhutan-tours/cultural-tours/8-days-bhutan-cultural-extravaganza/',
  'druk-path-trek': '/bhutan-tours/trekking-tours/8-days-druk-path-trek/',
  'jomolhari-trek': '/bhutan-tours/trekking-tours/10-days-jomolhari-trek/',
  'paro-tshechu-festival': '/bhutan-tours/festival-tours/7-days-paro-tshechu-festival/',
  'punakha-drubchen-tshechu': '/bhutan-tours/festival-tours/6-days-punakha-drubchen-tshechu/',
  'bhutan-luxury-escape': '/bhutan-tours/luxury-tours/7-days-bhutan-luxury-escape/',
  'family-bhutan-adventure': '/bhutan-tours/family-tours/7-days-family-bhutan-adventure/',
  'bumthang-heartland-journey': '/bhutan-tours/exclusive-tours/10-days-bumthang-heartland-journey/',
}

function newHref(href: string): string | null {
  if (!href.startsWith('/tours')) return null
  const cat = href.match(/^\/tours\/category\/([^/]+)\/?$/)
  if (cat) return `/bhutan-tours/${cat[1]}/`
  const tour = href.match(/^\/tours\/([^/]+)\/?$/)
  if (tour) return TOUR_URL[tour[1]] ?? '/bhutan-tours/'
  return '/bhutan-tours/'
}

async function retitle() {
  for (const [slug, patch] of Object.entries(UPDATE)) {
    const id = `guide-${slug}`
    const doc = await client.fetch(`*[_id == $id][0]{_id}`, {id})
    if (!doc) {
      console.log(`- ${slug}: not found, skipped`)
      continue
    }
    await client.patch(id).set({...patch, inMenu: !!patch.inMenu}).commit()
    console.log(`✓ ${slug} → order ${patch.order}${patch.title ? `, "${patch.title}"` : ''}${patch.inMenu ? ', in menu' : ''}`)
  }
}

/** Rewrites link annotations inside any Portable Text body/section that still points at /tours/…. */
async function relink() {
  const docs = await client.fetch<any[]>(`*[defined(body) || defined(sections)]{_id, _type, body, sections}`)
  for (const doc of docs) {
    const patches: Record<string, string> = {}
    const walk = (node: any, path: string) => {
      if (Array.isArray(node)) return node.forEach((child, i) => walk(child, `${path}[_key=="${child._key}"]`))
      if (!node || typeof node !== 'object') return
      if (node._type === 'link' && typeof node.href === 'string') {
        const to = newHref(node.href)
        if (to) patches[`${path}.href`] = to
        return
      }
      for (const [k, v] of Object.entries(node)) if (v && typeof v === 'object') walk(v, `${path}.${k}`)
    }
    for (const field of ['body', 'sections']) if (doc[field]) walk(doc[field], field)
    if (Object.keys(patches).length) {
      await client.patch(doc._id).set(patches).commit()
      console.log(`✓ ${doc._id}: ${Object.keys(patches).length} link(s) → /bhutan-tours/`)
    }
  }
}

async function retire() {
  for (const id of RETIRE) {
    const doc = await client.fetch(`*[_id == $id][0]{_id}`, {id})
    if (!doc) continue
    await client.delete(id)
    console.log(`✓ retired ${id}`)
  }
}

async function main() {
  await retitle()
  await relink()
  await retire()
  console.log('done')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
