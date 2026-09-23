// One CTA label sitewide: every button that opens the contact page says "Plan a trip".
//   npx sanity exec scripts/cta-labels.ts --with-user-token
import {getCliClient} from 'sanity/cli'
const client = getCliClient({apiVersion: '2025-02-19'})

async function main() {
  const pages = await client.fetch<any[]>(`*[_type == "page" && count(sections[_type == "ctaBanner"]) > 0]{_id, sections}`)
  for (const page of pages) {
    const patches: Record<string, string> = {}
    for (const s of page.sections) {
      if (s._type === 'ctaBanner' && s.buttonLink === '/contact/' && s.buttonLabel !== 'Plan a trip') {
        patches[`sections[_key=="${s._key}"].buttonLabel`] = 'Plan a trip'
      }
    }
    if (Object.keys(patches).length) {
      await client.patch(page._id).set(patches).commit()
      console.log(`✓ ${page._id}: ${Object.values(patches).length} CTA label(s) → "Plan a trip"`)
    }
  }
  console.log('done')
}
main().catch((e) => { console.error(e); process.exit(1) })
