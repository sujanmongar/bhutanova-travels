// DRAFTS ONLY (nothing goes live): the new story across the CMS. Where a draft exists it's edited, else one is made.
import {getCliClient} from 'sanity/cli'
import {randomUUID} from 'node:crypto'
const c = getCliClient({apiVersion: '2025-02-19'}).withConfig({perspective: 'raw'})
const k = () => randomUUID().replace(/-/g, '').slice(0, 12)
const para = (t) => ({_type: 'block', _key: k(), style: 'normal', markDefs: [], children: [{_type: 'span', _key: k(), text: t, marks: []}]})
const strip = ({_rev, _createdAt, _updatedAt, ...d}) => d
const log = []
async function edit(id, fn) {
  const draft = await c.getDocument(`drafts.${id}`)
  const d = strip(draft ?? await c.getDocument(id))
  if (!d) throw new Error(`missing ${id}`)
  fn(d)
  await c.createOrReplace({...d, _id: `drafts.${id}`})
  log.push(`${draft ? 'edited' : 'new'} drafts.${id}`)
}
const swap = (span, from, to) => { if (!span.text.includes(from)) throw new Error(`not found: ${from}`); span.text = span.text.replace(from, to) }
const spanWith = (blocks, key, text) => blocks.find((b) => b._key === key).children.find((s) => s.text.includes(text))

await edit('home', (d) => {
  const at = (key) => d.sections.find((s) => s._key === key)
  at('bookingsteps1').person = {_type: 'reference', _ref: 'team-sample-office-1'}   // guests talk to the founder
  const fn = at('leyhkaty7g')
  if (!fn.text.some((b) => b.children?.[0]?.text?.includes('Gross National Happiness')))
    fn.text.push(para('Like Bhutan, we are rooted in Gross National Happiness, and you, our guest, come first.'))
  at('526e95f7b423').label = 'Licences, memberships and the airlines we book'
  d.seo = {...d.seo, description: 'Private Bhutan tours, treks and festival trips, planned and guided by licensed local guides with more than ten years on the trails. Reply within 24 hours.'}
})
await edit('page-about', (d) => {
  const values = d.sections.find((s) => s._key === '02390036cdb9')
  values.items.find((i) => i._key === '93e04d9c1ab9').text = 'We eat in family-run places and spend what our guests pay in the valleys they visit.'
  d.sections.find((s) => s._key === 'hqoz9j35qc').label = 'Licences, memberships and the airlines we book'
  const cta = d.sections.find((s) => s._key === '4eea830d95d3')
  cta.text = 'Share your dates and interests and we will send a first itinerary within 24 hours. No payment needed to ask.'
  d.seo = {...d.seo, description: "Bhutanova Travels is a new, Bhutanese-owned tour company in Babesa, Thimphu, started by a licensed guide with more than ten years on Bhutan's trails."}
})
await edit('faqs', (d) => {
  d.items.find((i) => i._key === '1a4240a6102e').a = 'We are a new, Bhutanese-owned company in Babesa, Thimphu, started by a licensed trekking, cultural and birding guide with more than ten years of guiding. You deal with the founder from your first question to your last day. Our guides, drivers and vehicles are our own, and when a trip needs more we hire only experienced people. We go by Gross National Happiness, as Bhutan does: the guest first, and fair pay for the people who look after you.'
  const pack = d.items.find((i) => i._key === '574c3ff1801a')
  if (typeof pack.a === 'string') pack.a = pack.a.replace('the Travel Guide', 'the travel guide')
})
await edit('reviews', (d) => { d.platforms = [] })   // no real listings yet: no "Read our reviews on" badges
await edit('team-sample-office-3', (d) => { d.bio = 'Books your hotels and permits once your plan is agreed.' })
await edit('team-sample-office-1', (d) => { d.bio = 'Licensed trekking, cultural and birding guide for more than ten years. Plans every trip and answers your messages, from first question to last day.' })
await edit('guide-travel-faqs', (d) => {
  swap(spanWith(d.body, 'khl', 'We answer inquiries ourselves'), 'We answer inquiries ourselves, from Thimphu, usually within a day.', 'The founder answers every enquiry, from Thimphu, within 24 hours.')
})
await edit('tour-bhutan-luxury-escape', (d) => {
  if (!d.summary.includes("finest")) throw new Error('summary changed')
  d.summary = 'Western Bhutan at a slower pace, in five-star lodges, with a private guide, a butter-lamp blessing and hot stone bath evenings.'
})
await edit('post-hidden-gems-of-bhutan', (d) => {
  const b = d.body.find((x) => x._key === 'eca5f14b8f86')
  const s = b.children.find((x) => x._key === '0d24897fbe11')
  s.text = 'off-the-beaten-path journeys'
  const first = b.children[0]; if (first !== s && /Our $/.test(first.text) === false && first.text.endsWith('Our ')) {}
})
console.log(log.join('\n'))
