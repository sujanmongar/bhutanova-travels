import {defineArrayMember, defineField, defineType} from 'sanity'
import {linkRules} from './blockContent'
import {lines, photoFields, needsAlt} from './documents'
import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {CommentIcon} from '@sanity/icons/Comment'
import {BlockContentIcon} from '@sanity/icons/BlockContent'
import {DocumentsIcon} from '@sanity/icons/Documents'
import {OlistIcon} from '@sanity/icons/Olist'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {HelpCircleIcon} from '@sanity/icons/HelpCircle'
import {ImageIcon} from '@sanity/icons/Image'
import {ImagesIcon} from '@sanity/icons/Images'
import {LaunchIcon} from '@sanity/icons/Launch'
import {SplitHorizontalIcon} from '@sanity/icons/SplitHorizontal'
import {StarIcon} from '@sanity/icons/Star'
import {TagIcon} from '@sanity/icons/Tag'
import {TextIcon} from '@sanity/icons/Text'
import {UserIcon} from '@sanity/icons/User'
import {UsersIcon} from '@sanity/icons/Users'

// ---------- Shared fields ----------
const heading = (initialValue?: string) =>
  defineField({name: 'heading', title: 'Heading', type: 'string', initialValue, validation: (r) => r.required()})
const grey = (initialValue = false) =>
  defineField({name: 'grey', title: 'Grey background', type: 'boolean', initialValue, description: 'Use it to separate this section from the one above.'})
const photo = (name = 'image', title = 'Photo', required = true, alt = true) =>
  defineField({
    name,
    title,
    type: 'image',
    options: {hotspot: true},
    description: 'Click the crop icon and drag the circle to the subject — it stays in frame on every screen size.',
    fields: alt ? photoFields : [],
    // assetRequired: removing a photo keeps its alt text, which plain required() would accept as "filled in".
    validation: (r) => (required ? [r.required().assetRequired(), needsAlt(r)] : needsAlt(r)),
  })
// Phosphor Regular (outline, one colour) so the reasons read as a family
const ICONS = ['seal-check', 'path', 'receipt', 'identification-badge', 'stamp', 'headset', 'users-three', 'handshake', 'plant']
const points = (name: string, title: string, max: number, withIcon = false) =>
  defineField({
    name,
    title,
    type: 'array',
    validation: (r) => r.max(max),
    of: [
      defineArrayMember({
        type: 'object',
        name: 'point',
        fields: [
          defineField({name: 'title', title: 'Title', type: 'string', validation: (r) => r.required()}),
          defineField({name: 'text', title: 'Text', type: 'text', rows: 2}),
          ...(withIcon ? [defineField({name: 'icon', title: 'Icon', type: 'string', options: {list: ICONS}, validation: (r: any) => r.required()})] : []),
        ],
        preview: {select: {title: 'title', subtitle: 'text', icon: 'icon'}, prepare: ({title, subtitle, icon}: any) => ({title: icon ? `${icon} — ${title}` : title, subtitle})},
      }),
    ],
  })
// Every block shows its own heading in the page's section list, with the block name underneath.
const preview = (name: string, extra: Record<string, string> = {}) => ({
  select: {heading: 'heading', ...extra},
  prepare: ({heading, media}: {heading?: string; media?: any}) => ({title: heading || name, subtitle: name, media}),
})

// ---------- Blocks ----------
// One photo, one headline, two buttons — no slideshow. A carousel here meant most visitors never saw slides
// 2 onward; this is what a first-time visitor actually reads in the second they decide whether to stay.
const hero = defineType({
  name: 'hero',
  title: 'Hero (photo + headline)',
  type: 'object',
  icon: ImageIcon,
  description: 'One full-screen photo with the page’s main heading. Top of the page only.',
  fields: [
    defineField({name: 'heading', title: 'Headline (H1)', type: 'string', validation: (r) => [r.required(), r.max(60).warning('Shorter headlines look better over a photo.')]}),
    defineField({name: 'text', title: 'Short line', type: 'string', validation: (r) => r.max(120).warning('One short sentence works best.')}),
    photo(),
    defineField({name: 'primaryLabel', title: 'Main button text', type: 'string', initialValue: 'Explore tours', description: 'Opens the tours page.', validation: (r) => r.required()}),
    defineField({name: 'secondaryLabel', title: 'Second button text', type: 'string', initialValue: 'Get a free trip plan', description: 'Opens WhatsApp with a short message asking for a free trip plan (when, travellers, interests). The header already has Enquire.', validation: (r) => r.required()}),
    defineField({
      name: 'proof',
      title: 'Proof line',
      type: 'array',
      of: [{type: 'string'}],
      validation: (r) => r.max(3),
      description: 'Two or three short facts under the buttons, e.g. "Licensed by the Department of Tourism", "Licence no. …", "Since 2016".',
    }),
  ],
  preview: {select: {title: 'heading', subtitle: 'text', media: 'image'}},
})

const pageBanner = defineType({
  name: 'pageBanner',
  title: 'Page banner',
  type: 'object',
  icon: ImageIcon,
  description: 'Big photo with the page’s main heading. Top of the page only.',
  fields: [
    defineField({name: 'heading', title: 'Main heading (H1)', type: 'string', validation: (r) => [r.required(), r.max(70).warning('Shorter headings look better on the photo.')]}),
    defineField({name: 'text', title: 'Line under the heading', type: 'string'}),
    photo(),
  ],
  preview: preview('Page banner', {media: 'image'}),
})

const intro = defineType({
  name: 'intro',
  title: 'Intro',
  type: 'object',
  icon: TextIcon,
  description: 'Heading and a short intro, with an optional checklist, link and photo. A photo on its own sits beside the text with the logo on it; a photo with a quote sits below the text.',
  fields: [
    heading(),
    defineField({name: 'text', title: 'Intro', type: 'simpleText'}),
    {...lines('expertise', 'Expertise checklist', 'A few short, concrete lines, e.g. "Licensed Bhutanese operator, not a reseller". Shown as a checklist.'), group: undefined, validation: (r: any) => r.max(4)},
    defineField({name: 'linkLabel', title: 'Link text', type: 'string', description: 'e.g. "Learn more about us". Leave empty for no link.'}),
    defineField({name: 'linkHref', title: 'Link', type: 'url', description: 'e.g. /about/', hidden: ({parent}) => !parent?.linkLabel, validation: (r) => linkRules(r)}),
    photo('image', 'Photo', false),
    defineField({name: 'quote', title: 'Quote under the photo', type: 'text', rows: 2, description: 'Leave empty to show the photo beside the text instead.', hidden: ({parent}) => !parent?.image?.asset}),
    grey(),
  ],
  preview: preview('Intro', {media: 'image'}),
})

const founderNote = defineType({
  name: 'founderNote',
  title: 'Founder note',
  type: 'object',
  icon: UserIcon,
  description: 'A short note in the founder’s own words, signed with their name and role. Their portrait sits beside it (a small round photo on phones).',
  fields: [
    heading('A small team in Thimphu'),
    defineField({name: 'text', title: 'Note', type: 'simpleText', description: 'Two short paragraphs in the first person.', validation: (r) => r.required()}),
    defineField({name: 'person', title: 'Signed by', type: 'reference', to: [{type: 'teamMember'}], description: 'Name, role and portrait come from Team.', validation: (r) => r.required()}),
    defineField({name: 'linkLabel', title: 'Link text', type: 'string', initialValue: 'More about us'}),
    defineField({name: 'linkHref', title: 'Link', type: 'url', initialValue: '/about/', hidden: ({parent}) => !parent?.linkLabel, validation: (r) => linkRules(r)}),
    grey(),
  ],
  preview: {select: {heading: 'heading', media: 'person.photo'}, prepare: ({heading, media}) => ({title: heading || 'Founder note', subtitle: 'Founder note', media})},
})

const reasons = defineType({
  name: 'reasons',
  title: 'Reasons to choose us',
  type: 'object',
  icon: CheckmarkCircleIcon,
  description: 'Short, concrete reasons in a row: a few words, then one sentence. Each reason needs an icon. Use 4 or 8 reasons for full rows on desktop.',
  fields: [heading('Why travel with us'), points('items', 'Reasons', 8, true), grey(true)],
  preview: preview('Reasons to choose us'),
})

const storyRows = defineType({
  name: 'storyRows',
  title: 'Photo + text rows',
  type: 'object',
  icon: SplitHorizontalIcon,
  description: 'Photo beside text; each new row swaps sides.',
  fields: [
    defineField({
      name: 'rows',
      title: 'Rows',
      type: 'array',
      validation: (r) => r.required().min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'row',
          fields: [photo(), heading(), defineField({name: 'text', title: 'Text', type: 'simpleText'})],
          preview: {select: {title: 'heading', media: 'image'}},
        }),
      ],
    }),
    grey(),
  ],
  preview: {
    select: {title: 'rows.0.heading', media: 'rows.0.image'},
    prepare: ({title, media}) => ({title: title || 'Photo + text rows', subtitle: 'Photo + text rows', media}),
  },
})

const richText = defineType({
  name: 'richText',
  title: 'Text',
  type: 'object',
  icon: BlockContentIcon,
  description: 'Free text with headings, lists, links and tables — for policies, longer explanations and similar.',
  fields: [
    defineField({name: 'heading', title: 'Heading (optional)', type: 'string'}),
    defineField({name: 'body', title: 'Text', type: 'blockContent', validation: (r) => r.required()}),
    defineField({name: 'aside', title: 'Plan card and share buttons beside the text', type: 'boolean', initialValue: false, description: 'For long texts: from wide screens, the plan card and share icons stay in view beside the text. Below that, the share icons follow the text.'}),
    grey(),
  ],
  preview: preview('Text'),
})

const tourRail = defineType({
  name: 'tourRail',
  title: 'Tour packages',
  type: 'object',
  icon: EarthGlobeIcon,
  description: 'A row of tour cards (swipe on phones) with an "All tours" link.',
  fields: [
    heading('Popular tour packages'),
    defineField({name: 'text', title: 'Intro', type: 'string'}),
    defineField({
      name: 'tours',
      title: 'Tours to show',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'tour'}]}],
      validation: (r) => r.unique().max(12),
      description: 'Pick a mix of tours, in the order they should appear. Leave empty to show six automatically, “Show on homepage” tours first.',
    }),
    grey(),
  ],
  preview: preview('Tour packages'),
})

const categoryTiles = defineType({
  name: 'categoryTiles',
  title: 'Tour categories',
  type: 'object',
  icon: TagIcon,
  description: 'A row of tall photo cards, one per tour category, with each category’s short description. Visitors swipe it or use the arrows; it never moves on its own.',
  fields: [heading('Bhutan tours by theme'), defineField({name: 'text', title: 'Intro', type: 'string'}), grey()],
  preview: preview('Tour categories'),
})

const latestPosts = defineType({
  name: 'latestPosts',
  title: 'Latest blog posts',
  type: 'object',
  icon: DocumentTextIcon,
  description: 'The three newest posts side by side (swipe on phones), with an "All articles" link.',
  fields: [heading('From our blog'), grey()],
  preview: preview('Latest blog posts'),
})

const reviewList = defineType({
  name: 'reviewList',
  title: 'Reviews',
  type: 'object',
  icon: StarIcon,
  description: 'Every review as a quote card (stars, words, a small round photo, name and trip): every review, two or three across on larger screens, swiped on phones. Google and Tripadvisor links at the top right. Reviews come from Content → Reviews.',
  fields: [heading('What travellers say'), grey()],
  preview: preview('Reviews'),
})

const team = defineType({
  name: 'team',
  title: 'Team',
  type: 'object',
  icon: UsersIcon,
  description: 'Everyone in Team as photo cards, grouped office team, guides, drivers. People are added under Team in the menu.',
  fields: [
    defineField({name: 'heading', title: 'Heading', type: 'string', initialValue: 'Meet the team', validation: (r) => r.required()}),
    defineField({name: 'text', title: 'Intro', type: 'text', rows: 2}),
    defineField({name: 'grey', title: 'Grey background', type: 'boolean', initialValue: false}),
  ],
  preview: {select: {title: 'heading'}, prepare: ({title}) => ({title, subtitle: 'Team'})},
})

const bookingSteps = defineType({
  name: 'bookingSteps',
  title: 'Plan your trip (steps + contact)',
  type: 'object',
  icon: OlistIcon,
  description: 'A navy closing section: up to five numbered steps from first message to arrival, beside a contact panel with a named trip planner, WhatsApp, the enquiry form, email and phone.',
  fields: [
    heading('Plan your trip'),
    defineField({name: 'text', title: 'Intro', type: 'string'}),
    points('steps', 'Steps', 5),
    defineField({name: 'person', title: 'Trip planner', type: 'reference', to: [{type: 'teamMember'}], description: 'Shown in the contact panel: “Your message comes to …”. Name, role and photo come from Team.'}),
  ],
  preview: preview('Plan your trip'),
})

const faqList = defineType({
  name: 'faqList',
  title: 'FAQs',
  type: 'object',
  icon: HelpCircleIcon,
  description: 'The questions from Content → FAQs, with your heading and intro beside them.',
  fields: [heading('Frequently asked questions'), defineField({name: 'text', title: 'Intro (optional)', type: 'simpleText'}), grey(true)],
  preview: preview('FAQs'),
})

const ctaBanner = defineType({
  name: 'ctaBanner',
  title: 'Call to action',
  type: 'object',
  icon: LaunchIcon,
  description: 'The closing contact section: heading and text, with the trip planner (from the homepage’s Plan your trip section), a WhatsApp button, your button, phone and email.',
  fields: [
    heading('Your Bhutan journey starts with a conversation'),
    defineField({
      name: 'text',
      title: 'Text',
      type: 'text',
      rows: 3,
      initialValue: 'Tell us when you would like to travel and what draws you to Bhutan. A trip planner in Thimphu will reply within a day with ideas and a clear quote.',
    }),
    defineField({name: 'buttonLabel', title: 'Button text', type: 'string', initialValue: 'Start planning', validation: (r) => r.required()}),
    defineField({name: 'buttonLink', title: 'Button link', type: 'url', initialValue: '/contact/', validation: (r) => [r.required(), ...linkRules(r)]}),
    // No longer shown (the section has no photo now); kept hidden so existing pages keep their data.
    {...photo('image', 'Background photo', false, false), hidden: true},
  ],
  preview: preview('Call to action', {media: 'image'}),
})

const whatsapp = defineType({
  name: 'whatsapp',
  title: 'WhatsApp contact card',
  type: 'object',
  icon: CommentIcon,
  description: 'The closing contact section with the trip planner and a WhatsApp button; the chat opens with a link to this page.',
  fields: [
    heading('Not sure which trip fits?'),
    defineField({name: 'text', title: 'Text', type: 'string', initialValue: 'Message a planner in Thimphu on WhatsApp. We reply within 24 hours.'}),
    defineField({name: 'topic', title: 'Chat topic (optional)', type: 'string', description: 'Adds “I’d like to ask about …” to the message, e.g. “corporate retreats”.'}),
  ],
  preview: preview('WhatsApp contact card'),
})

const partners = defineType({
  name: 'partners',
  title: 'Partner logos',
  type: 'object',
  icon: UsersIcon,
  description: 'Logos in full colour, standing still: one row beside the label on desktop, wrapped into rows on phones.',
  fields: [
    defineField({name: 'label', title: 'Label', type: 'string', initialValue: 'Licences, memberships and airline partners'}),
    defineField({
      name: 'logos',
      title: 'Logos',
      type: 'array',
      validation: (r) => r.max(8),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'logo',
          fields: [
            defineField({name: 'name', title: 'Organisation', type: 'string', validation: (r) => r.required()}),
            defineField({name: 'image', title: 'Logo (PNG or SVG with transparent background)', type: 'image', validation: (r) => r.required()}),
            defineField({name: 'url', title: 'Link', type: 'url', validation: (r) => r.uri({allowRelative: true, scheme: ['https', 'http']}), description: 'Their official site (opens in a new tab), or a page on this site such as /travel-guide/flight-schedules/. Empty = no link.'}),
          ],
          preview: {select: {title: 'name', media: 'image'}},
        }),
      ],
    }),
  ],
  preview: {prepare: () => ({title: 'Partner logos'})},
})

export const blockTypes = [hero, pageBanner, intro, founderNote, reasons, storyRows, richText, tourRail, categoryTiles, latestPosts, reviewList, bookingSteps, team, faqList, ctaBanner, whatsapp, partners]

// ---------- Page ----------
const TOP = ['hero', 'pageBanner']
const TOP_NAME: Record<string, string> = {hero: 'hero', pageBanner: 'page banner'}
const ONCE: Record<string, string> = {founderNote: 'Founder note', bookingSteps: 'Plan your trip section', faqList: 'FAQs section', reviewList: 'Reviews section', ctaBanner: 'Call to action', whatsapp: 'WhatsApp card'}
// URLs already used by the site's own pages.
const RESERVED = ['home', 'index', 'tours', 'bhutan-tours', 'blog', 'travel-guide', 'destinations', 'contact', 'search', 'sitemap', 'styleguide', '404', 'admin', 'images', 'sitemap-index', 'sitemap-0', 'robots']
const isHome = (id?: string) => id?.replace(/^drafts\./, '') === 'home'
// Addresses the site links to by hand (menu, footer, cookie card) can't be changed in the Studio.
const fixedSlug = (id?: string) => ['page-about', 'page-about-bhutan', 'page-privacy', 'page-cancellation-policy'].includes(id?.replace(/^drafts\./, '') ?? '')

export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  icon: DocumentsIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Page name',
      type: 'string',
      group: 'content',
      description: 'Used in the browser tab, breadcrumbs and Google (unless the SEO tab says otherwise).',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL',
      type: 'slug',
      group: 'content',
      options: {source: 'title', maxLength: 60},
      description: 'The page’s address: bhutanova-travels.pages.dev/<this>/. Avoid changing it once live.',
      hidden: ({document}) => isHome(document?._id),
      readOnly: ({document}) => fixedSlug(document?._id),
      validation: (r) =>
        r.custom((slug: {current?: string} | undefined, ctx) => {
          if (isHome(ctx.document?._id)) return true
          const v = slug?.current
          if (!v) return 'Required — click “Generate”.'
          if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)) return 'Use lowercase letters, numbers and hyphens only, e.g. "corporate-retreats".'
          if (RESERVED.includes(v)) return `"/${v}/" is already used by the site — choose another URL.`
          return true
        }),
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      group: 'content',
      description: 'Add, drag to reorder, or remove sections. Changes go live about a minute after you publish.',
      of: blockTypes.map((b) => defineArrayMember({type: b.name})),
      options: {
        insertMenu: {
          filter: true,
          groups: [
            {name: 'top', title: 'Top of page', of: ['hero', 'pageBanner']},
            {name: 'text', title: 'Text & photos', of: ['intro', 'founderNote', 'reasons', 'storyRows', 'richText', 'team']},
            {name: 'lists', title: 'Tours, blog & reviews', of: ['tourRail', 'categoryTiles', 'latestPosts', 'reviewList', 'faqList']},
            {name: 'contact', title: 'Contact & trust', of: ['bookingSteps', 'ctaBanner', 'whatsapp', 'partners']},
          ],
          views: [{name: 'grid', previewImageUrl: (type: string) => `/static/blocks/${type}.jpg`}, {name: 'list'}],
        },
      },
      validation: (r) => [
        r.custom((blocks) => {
          const types = ((blocks ?? []) as {_type: string}[]).map((b) => b._type)
          if (types.includes('hero') && types.includes('pageBanner')) return 'Use a hero or a page banner at the top — not both.'
          for (const [t, name] of Object.entries(ONCE)) if (types.filter((x) => x === t).length > 1) return `Only one ${name} per page.`
          for (const t of TOP) {
            const n = types.filter((x) => x === t).length
            if (n > 1) return `Only one ${TOP_NAME[t]} per page.`
            if (n === 1 && types[0] !== t) return `Move the ${TOP_NAME[t]} to the top — it holds the page’s main heading.`
          }
          return true
        }),
        r
          .custom((blocks) =>
            TOP.includes((blocks as {_type: string}[] | undefined)?.[0]?._type ?? '') ? true : 'Tip: start with a Page banner — it gives the page a photo and its main heading.',
          )
          .warning(),
      ],
    }),
    defineField({name: 'seo', title: 'SEO', type: 'seo', group: 'seo'}),
  ],
  preview: {
    select: {title: 'title', slug: 'slug.current', id: '_id'},
    prepare: ({title, slug, id}) => ({title, subtitle: isHome(id) ? 'Homepage' : `/${slug ?? ''}/`}),
  },
})
