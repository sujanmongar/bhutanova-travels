import {defineArrayMember, defineField, defineType} from 'sanity'
import {linkRules} from './blockContent'
import {lines} from './documents'
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
    fields: alt
      ? [
          defineField({
            name: 'alt',
            title: 'Describe the photo',
            type: 'string',
            description: 'For Google and screen readers, e.g. "Punakha Dzong between two rivers".',
          }),
        ]
      : [],
    // assetRequired: removing a photo keeps its alt text, which plain required() would accept as "filled in".
    validation: required ? (r) => r.required().assetRequired() : undefined,
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
    defineField({name: 'secondaryLabel', title: 'Second button text', type: 'string', initialValue: 'Enquire', description: 'Opens the contact page.', validation: (r) => r.required()}),
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

const reasons = defineType({
  name: 'reasons',
  title: 'Reasons to choose us',
  type: 'object',
  icon: CheckmarkCircleIcon,
  description: 'Short, concrete reasons in a row, each with an icon.',
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
    grey(),
  ],
  preview: preview('Text'),
})

const tourRail = defineType({
  name: 'tourRail',
  title: 'Tour packages',
  type: 'object',
  icon: EarthGlobeIcon,
  description: 'A scrolling row of tour cards.',
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
  description: 'A scrolling row of tall photo cards, one per tour category, with each category’s short description.',
  fields: [heading('Bhutan tours by theme'), defineField({name: 'text', title: 'Intro', type: 'string'}), grey()],
  preview: preview('Tour categories'),
})

const latestPosts = defineType({
  name: 'latestPosts',
  title: 'Latest blog posts',
  type: 'object',
  icon: DocumentTextIcon,
  description: 'The newest post large, plus the three before it.',
  fields: [heading('Travel blogs'), defineField({name: 'text', title: 'Intro', type: 'string'}), grey(true)],
  preview: preview('Latest blog posts'),
})

const reviewList = defineType({
  name: 'reviewList',
  title: 'Reviews',
  type: 'object',
  icon: StarIcon,
  description: 'Every review as a quote card (stars, words, a small round photo, name and trip): all six on desktop, swipe on phones. Google and Tripadvisor links at the top right. Reviews come from Content → Reviews.',
  fields: [heading('What travelers say'), grey()],
  preview: preview('Reviews'),
})

const team = defineType({
  name: 'team',
  title: 'Team',
  type: 'object',
  icon: UsersIcon,
  description: 'Office team as cards, then guides and drivers as a row of portraits. People are added under Team in the menu.',
  fields: [
    defineField({name: 'heading', title: 'Heading', type: 'string', initialValue: 'Meet the team', validation: (r) => r.required()}),
    defineField({name: 'text', title: 'Intro', type: 'text', rows: 2}),
    defineField({name: 'grey', title: 'Grey background', type: 'boolean', initialValue: false}),
  ],
  preview: {select: {title: 'heading'}, prepare: ({title}) => ({title, subtitle: 'Team'})},
})

const bookingSteps = defineType({
  name: 'bookingSteps',
  title: 'Booking steps',
  type: 'object',
  icon: OlistIcon,
  description: 'How booking works: three or four short numbered steps from first message to arrival, with WhatsApp and enquiry buttons.',
  fields: [
    heading('How booking works'),
    defineField({name: 'text', title: 'Intro', type: 'string'}),
    points('steps', 'Steps', 5),
    defineField({name: 'whatsapp', title: 'Show a WhatsApp button', type: 'boolean', initialValue: true, description: 'The fastest way to start: opens a WhatsApp chat with the planner.'}),
    defineField({name: 'buttonLabel', title: 'Second button text', type: 'string', initialValue: 'Send an enquiry'}),
    defineField({name: 'buttonLink', title: 'Second button link', type: 'url', initialValue: '/contact/', hidden: ({parent}) => !parent?.buttonLabel, validation: (r) => linkRules(r)}),
    grey(),
  ],
  preview: preview('Booking steps'),
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
  title: 'Call to action (photo)',
  type: 'object',
  icon: LaunchIcon,
  description: 'Full-width photo with a heading, a button and the WhatsApp number.',
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
    // Background only (the text sits on top), so no alt text.
    photo('image', 'Background photo', true, false),
  ],
  preview: preview('Call to action', {media: 'image'}),
})

const whatsapp = defineType({
  name: 'whatsapp',
  title: 'WhatsApp contact card',
  type: 'object',
  icon: CommentIcon,
  description: 'The big WhatsApp number; the chat opens with a link to this page.',
  fields: [
    heading('Not sure which trip fits?'),
    defineField({name: 'text', title: 'Text', type: 'string', initialValue: 'Message a planner in Thimphu on WhatsApp. We usually reply within the hour.'}),
    defineField({name: 'topic', title: 'Chat topic (optional)', type: 'string', description: 'Adds “I’d like to ask about …” to the message, e.g. “corporate retreats”.'}),
  ],
  preview: preview('WhatsApp contact card'),
})

const partners = defineType({
  name: 'partners',
  title: 'Partner logos',
  type: 'object',
  icon: UsersIcon,
  description: 'A row of greyscale logos that turn to colour on hover. It scrolls on its own when the logos don\'t fit the width.',
  fields: [
    defineField({name: 'label', title: 'Label', type: 'string', initialValue: 'Registered with and flying in partnership with'}),
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
            defineField({name: 'url', title: 'Website', type: 'url', description: 'Their official site. The logo links to it in a new tab.'}),
          ],
          preview: {select: {title: 'name', media: 'image'}},
        }),
      ],
    }),
  ],
  preview: {prepare: () => ({title: 'Partner logos'})},
})

export const blockTypes = [hero, pageBanner, intro, reasons, storyRows, richText, tourRail, categoryTiles, latestPosts, reviewList, bookingSteps, team, faqList, ctaBanner, whatsapp, partners]

// ---------- Page ----------
const TOP = ['hero', 'pageBanner']
const TOP_NAME: Record<string, string> = {hero: 'hero', pageBanner: 'page banner'}
const ONCE: Record<string, string> = {faqList: 'FAQs section', reviewList: 'Reviews section', ctaBanner: 'Call to action', whatsapp: 'WhatsApp card'}
// URLs already used by the site's own pages.
const RESERVED = ['home', 'index', 'tours', 'blog', 'travel-guide', 'contact', 'privacy', '404', 'admin', 'images', 'sitemap-index', 'sitemap-0', 'robots']
const isHome = (id?: string) => id?.replace(/^drafts\./, '') === 'home'
const isAbout = (id?: string) => id?.replace(/^drafts\./, '') === 'page-about'

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
      readOnly: ({document}) => isAbout(document?._id),
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
            {name: 'text', title: 'Text & photos', of: ['intro', 'reasons', 'storyRows', 'richText']},
            {name: 'lists', title: 'Tours, blog & reviews', of: ['tourRail', 'categoryTiles', 'latestPosts', 'reviewList', 'faqList']},
            {name: 'contact', title: 'Contact & trust', of: ['ctaBanner', 'whatsapp', 'partners']},
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
