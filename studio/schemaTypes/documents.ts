import {defineArrayMember, defineField, defineType} from 'sanity'
import {BookIcon} from '@sanity/icons/Book'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {PinIcon} from '@sanity/icons/Pin'
import {TagIcon} from '@sanity/icons/Tag'
import {UsersIcon} from '@sanity/icons/Users'
import {counter} from './seo'

// The slug is the page URL. Changing it on a published page breaks existing links and rankings.
const slug = defineField({
  name: 'slug',
  title: 'URL',
  type: 'slug',
  options: {source: 'title', maxLength: 80},
  description: 'Generated from the title. Avoid changing it once the page is live — old links will break.',
  validation: (r) => r.required(),
})
const seo = defineField({name: 'seo', title: 'SEO', type: 'seo', group: 'seo'})
const groups = [
  {name: 'content', title: 'Content', default: true},
  {name: 'seo', title: 'SEO'},
]
// Every photo: a crop and a focal point (the subject stays in frame on every card, banner and phone), what it shows
// (alt text: Google Images and screen readers read it) and, when a licence asks for one, who took it.
export const photoFields = [
  defineField({name: 'alt', title: 'Describe the photo', type: 'string', description: 'What the photo shows, for Google and screen readers, e.g. "Punakha Dzong between two rivers". Not the page title again.'}),
  defineField({name: 'credit', title: 'Photo credit', type: 'string', description: 'Only when the photo\'s licence asks for one, e.g. "Karma Wangdi" or "Wikimedia Commons, CC BY-SA 4.0". Shown under the photo.'}),
]
// Also warns when the file is too small to stay sharp on large and high-resolution screens (the site makes the small,
// light versions itself, so upload the biggest original you have).
export const needsAlt = (r: any, minWidth = 1600) =>
  r.custom(async (v: any, ctx: any) => {
    if (!v?.asset?._ref) return true
    if (!v.alt) return 'Add “Describe the photo”: Google and screen readers read it.'
    const w = await ctx.getClient({apiVersion: '2025-02-19'}).fetch('*[_id == $id][0].metadata.dimensions.width', {id: v.asset._ref})
    return w && w < minWidth ? `This photo is ${w} px wide; use one at least ${minWidth} px wide so it stays sharp.` : true
  }).warning()
const CROP_HELP = 'Click the crop icon and drag the circle onto the subject: it stays in frame on every screen size.'
const image = (name: string, title: string, required = true) =>
  defineField({
    name,
    title,
    type: 'image',
    options: {hotspot: true},
    description: CROP_HELP,
    fields: photoFields,
    group: 'content',
    validation: (r) => (required ? [r.required().assetRequired(), needsAlt(r)] : needsAlt(r)),
  })
export const lines = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    description,
    type: 'array',
    of: [{type: 'string'}],
    group: 'content',
  })

export const category = defineType({
  name: 'category',
  title: 'Tour category',
  type: 'document',
  icon: TagIcon,
  groups,
  fields: [
    defineField({name: 'menuTitle', title: 'Name', type: 'string', group: 'content', description: 'Shown in the menu and as the page heading, e.g. "Trekking tours".', validation: (r) => r.required()}),
    defineField({name: 'title', title: 'Page title', type: 'string', group: 'content', description: 'Longer title for the browser tab and Google, e.g. "Trekking in Bhutan".', validation: (r) => r.required()}),
    {...slug, group: 'content', options: {source: 'menuTitle', maxLength: 80}},
    defineField({name: 'excerpt', title: 'Short description', type: 'text', rows: 2, group: 'content', validation: (r) => r.required()}),
    image('image', 'Image'),
    defineField({name: 'order', title: 'Menu position', type: 'number', group: 'content', initialValue: 99, description: 'Lower numbers appear first.'}),
    seo,
  ],
  orderings: [{title: 'Menu position', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'menuTitle', subtitle: 'excerpt', media: 'image'}},
})

export const tour = defineType({
  name: 'tour',
  title: 'Tour',
  type: 'document',
  icon: EarthGlobeIcon,
  groups,
  fields: [
    defineField({name: 'title', title: 'Tour name', type: 'string', group: 'content', validation: (r) => r.required()}),
    {...slug, group: 'content'},
    defineField({name: 'category', title: 'Category', type: 'reference', to: [{type: 'category'}], group: 'content', validation: (r) => r.required()}),
    defineField({name: 'featured', title: 'Show on homepage', type: 'boolean', group: 'content', initialValue: false}),
    defineField({
      name: 'popularity',
      title: 'Popularity',
      type: 'number',
      group: 'content',
      description: '1 = most popular. Orders the tours page when it is sorted by "Most popular".',
      validation: (r) => r.integer().min(1),
    }),
    defineField({
      name: 'festivalDates',
      title: 'Festival dates',
      type: 'array',
      group: 'content',
      description: 'Festival tours only: the festival days for the coming years, from the Department of Tourism list. The next dates show on the tour page (a fact and the details bar), and they put the theme page’s tours in festival order (the "Festival date" sort).',
      of: [defineArrayMember({
        type: 'object',
        name: 'festivalDate',
        fields: [
          defineField({name: 'name', title: 'Festival', type: 'string', validation: (r) => r.required()}),
          defineField({name: 'start', title: 'First day', type: 'date', validation: (r) => r.required()}),
          defineField({name: 'end', title: 'Last day', type: 'date', validation: (r) => r.required().min(r.valueOfField('start'))}),
        ],
        preview: {select: {title: 'name', start: 'start', end: 'end'}, prepare: ({title, start, end}) => ({title, subtitle: `${start} → ${end}`})},
      })],
    }),
    defineField({name: 'nights', title: 'Nights', type: 'number', group: 'content', validation: (r) => r.required().integer().min(0)}),
    defineField({name: 'days', title: 'Days', type: 'number', group: 'content', validation: (r) => r.required().integer().min(1)}),
    defineField({name: 'price', title: 'Price from (USD per person)', type: 'number', group: 'content', validation: (r) => r.required().min(0)}),
    lines('priceNotes', 'Price notes', 'One note per line, e.g. "Based on 2 people sharing".'),
    defineField({name: 'summary', title: 'Overview', type: 'text', rows: 4, group: 'content', validation: (r) => r.required()}),
    lines('route', 'Route', 'Optional, for your own notes: not shown on the site. One stop per line, e.g. "Paro (2N)".'),
    image('image', 'Card image'),
    defineField({name: 'gallery', title: 'Gallery', type: 'array', of: [{type: 'image', options: {hotspot: true}, fields: photoFields, validation: (r) => needsAlt(r)}], options: {layout: 'grid'}, group: 'content', description: 'The cover photos, in the order they take turns. Open each one to set its focal point and describe it.'}),
    lines('highlights', 'Highlights'),
    // Trip facts shown under the photos. Accommodation, meals, guide and transport come from "What's included".
    // Trip facts, shown under the highlights. Each shows only when filled in.
    defineField({name: 'groupSize', title: 'Group size', type: 'string', group: 'content', description: 'e.g. "Private tour, from 1 traveller". Hidden when empty.'}),
    defineField({name: 'guideLanguages', title: 'Guide languages', type: 'string', group: 'content', description: 'e.g. "English, Hindi". Hidden when empty.'}),
    defineField({name: 'maxAltitude', title: 'Max altitude', type: 'string', group: 'content', description: 'The highest point of the trip, e.g. "3,120 m (Tiger\'s Nest)".'}),
    defineField({name: 'bestSeason', title: 'Best season', type: 'string', group: 'content', description: 'e.g. "March–May and September–November".'}),
    defineField({name: 'difficulty', title: 'Difficulty', type: 'string', group: 'content', description: 'How demanding it is, in plain words, e.g. "Easy, with one steep 5-hour hike" or "Moderate trek, 4 days camping up to 4,210 m". Hidden when empty.'}),
    defineField({
      name: 'itinerary',
      title: 'Day by day',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'day',
          fields: [
            defineField({name: 'title', title: 'Day title', type: 'string', validation: (r) => r.required()}),
            defineField({name: 'body', title: 'Description', type: 'text', rows: 5, description: 'Blank line = new paragraph. Start a line with "- " for a bullet. **Two stars** make words bold; [words](/travel-guide/visa/) or [words](https://…) makes a link.', validation: (r) => r.required()}),
            defineField({name: 'distance', title: 'Distance and time', type: 'string', description: 'One short line, e.g. "Drive: 71 km, about 3 hours" or "Walk: 11 km, 4–5 hours, up 600 m". Hidden when empty.'}),
            defineField({name: 'overnight', title: 'Overnight', type: 'string'}),
            defineField({
              name: 'places',
              title: 'Places this day',
              type: 'array',
              of: [{type: 'reference', to: [{type: 'sight'}, {type: 'destination'}], options: {disableNew: true}}],
              validation: (r) => r.unique().max(4),
              description: 'Sights and destinations visited this day, shown as small cards linking to their pages. When empty, the image below shows instead.',
            }),
            defineField({name: 'image', title: 'Image', type: 'image', options: {hotspot: true}, fields: photoFields, validation: (r) => needsAlt(r)}),
          ],
          preview: {select: {title: 'title', distance: 'distance', overnight: 'overnight', media: 'image'}, prepare: ({title, distance, overnight, media}) => ({title, subtitle: [distance, overnight && `Overnight: ${overnight}`].filter(Boolean).join(' · '), media})},
        }),
      ],
    }),
    lines('inclusions', "What's included"),
    lines('exclusions', "What's not included"),
    image('map', 'Route map', false),
    defineField({
      name: 'faqs',
      title: 'Questions about this tour',
      type: 'array',
      group: 'content',
      description: 'Shown first under "Common questions" on this tour, before the questions every tour shares (FAQs in the menu). E.g. fitness, altitude, festival seating.',
      of: [defineArrayMember({type: 'object', name: 'faq', fields: [
        defineField({name: 'q', title: 'Question', type: 'string', validation: (r) => r.required()}),
        defineField({name: 'a', title: 'Answer', type: 'text', rows: 4, description: '**Two stars** make words bold; [words](/page/) makes a link.', validation: (r) => r.required()}),
      ], preview: {select: {title: 'q', subtitle: 'a'}}})],
    }),
    seo,
  ],
  preview: {
    select: {title: 'title', nights: 'nights', days: 'days', price: 'price', media: 'image'},
    prepare: ({title, nights, days, price, media}) => ({
      title,
      subtitle: `${nights}N / ${days}D · from USD ${price?.toLocaleString('en-US') ?? '—'}`,
      media,
    }),
  },
})

export const post = defineType({
  name: 'post',
  title: 'Blog post',
  type: 'document',
  icon: DocumentTextIcon,
  groups,
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', group: 'content', validation: (r) => r.required()}),
    {...slug, group: 'content'},
    defineField({name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3, group: 'content', description: 'One or two sentences under the title and on the blog card.', validation: (r) => r.required()}),
    image('image', 'Cover image'),
    defineField({name: 'date', title: 'Publish date', type: 'date', group: 'content', initialValue: () => new Date().toISOString().slice(0, 10), validation: (r) => r.required()}),
    defineField({name: 'author', title: 'Author', type: 'string', group: 'content', initialValue: 'Bhutanova Travels'}),
    defineField({name: 'tags', title: 'Topics', type: 'array', of: [{type: 'string'}], options: {layout: 'tags'}, group: 'content', description: 'The first topic is shown on the card. Every topic becomes a filter tab on the Blog page, so reuse the exact spelling (Destinations, Festivals, Culture, Food).'}),
    defineField({name: 'body', title: 'Body', type: 'blockContent', group: 'content'}),
    seo,
  ],
  orderings: [{title: 'Newest first', name: 'dateDesc', by: [{field: 'date', direction: 'desc'}]}],
  preview: {select: {title: 'title', date: 'date', topic: 'tags.0', media: 'image'}, prepare: ({title, date, topic, media}) => ({title, subtitle: [topic, date].filter(Boolean).join(' · '), media})},
})

export const destination = defineType({
  name: 'destination',
  title: 'Destination',
  type: 'document',
  icon: PinIcon,
  groups,
  fields: [
    defineField({name: 'title', title: 'Name', type: 'string', group: 'content', description: 'e.g. "Paro".', validation: (r) => r.required()}),
    {...slug, group: 'content'},
    defineField({name: 'excerpt', title: 'Short description', type: 'text', rows: 2, group: 'content', description: 'One sentence, about 120 characters: the line under the page heading and the text on its card (cards cut anything longer).', components: {input: counter(120) as any}, validation: (r) => [r.required(), r.max(160).warning('Long for a card: aim for one sentence of about 120 characters.')]}),
    image('image', 'Cover photo'),
    defineField({name: 'body', title: 'Overview', type: 'blockContent', group: 'content', validation: (r) => r.required()}),
    lines('highlights', 'Highlights', 'One per line, e.g. "Tiger\'s Nest Monastery". Shown only while the destination has no sights yet — add sights under Sights.'),
    defineField({
      name: 'region',
      title: 'Region',
      type: 'string',
      group: 'content',
      options: {list: ['Western Bhutan', 'Central Bhutan', 'Eastern Bhutan', 'Northern Bhutan']},
      description: 'Groups the destinations page and picks the "Nearby" destinations.',
    }),
    defineField({name: 'altitude', title: 'Altitude', type: 'string', group: 'content', description: 'e.g. "2,200 m".'}),
    defineField({name: 'bestTime', title: 'Best time to visit', type: 'string', group: 'content', description: 'The short answer, e.g. "Mar–May, Sep–Nov". Reasons and festivals go in the text.', validation: (r) => r.max(40).warning('Keep it short: the detail belongs in the text.')}),
    defineField({name: 'gettingThere', title: 'Getting there', type: 'string', group: 'content', description: 'The short answer, e.g. "Paro airport" or "2 hours by road from Paro".', validation: (r) => r.max(50).warning('Keep it short: the detail belongs in the text.')}),
    defineField({
      name: 'tours',
      title: 'Tours that visit here',
      type: 'array',
      group: 'content',
      of: [{type: 'reference', to: [{type: 'tour'}]}],
      validation: (r) => r.unique(),
    }),
    defineField({
      name: 'nearby',
      title: 'Nearby destinations',
      type: 'array',
      group: 'content',
      of: [{type: 'reference', to: [{type: 'destination'}]}],
      validation: (r) => r.unique().max(3),
      description: 'Up to three, closest first. Leave empty to show others from the same region.',
    }),
    defineField({name: 'order', title: 'Menu position', type: 'number', group: 'content', initialValue: 99, description: 'Lower numbers appear first.'}),
    seo,
  ],
  orderings: [{title: 'Menu position', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'title', region: 'region', tours: 'tours', media: 'image'}, prepare: ({title, region, tours, media}) => ({title, subtitle: [region, tours?.length ? `${tours.length} tours` : 'no tours yet'].filter(Boolean).join(' · '), media})},
})

// A place to see inside a destination. Every sight has its own page at /destinations/<destination>/<sight>/ and a photo
// card on its destination's page. Until it has a body, its page shows the short description and stays out of Google.
export const sight = defineType({
  name: 'sight',
  title: 'Sight',
  type: 'document',
  icon: PinIcon,
  groups,
  fields: [
    defineField({name: 'title', title: 'Name', type: 'string', group: 'content', description: 'e.g. "Tiger\'s Nest Monastery".', validation: (r) => r.required()}),
    {...slug, group: 'content'},
    defineField({
      name: 'destination',
      title: 'Destination',
      type: 'reference',
      to: [{type: 'destination'}],
      group: 'content',
      validation: (r) => r.required(),
    }),
    defineField({name: 'excerpt', title: 'Short description', type: 'text', rows: 2, group: 'content', description: 'One sentence, about 120 characters: its card on the destination page (cards cut anything longer), and the text of its own page until it has a body.', components: {input: counter(120) as any}, validation: (r) => [r.required(), r.max(160).warning('Long for a card: aim for one sentence of about 120 characters.')]}),
    image('image', 'Cover photo', false),
    defineField({name: 'altitude', title: 'Altitude', type: 'string', group: 'content', description: 'e.g. "3,120 m". Leave empty if it doesn\'t matter.'}),
    defineField({name: 'timeNeeded', title: 'Time needed', type: 'string', group: 'content', description: 'The short answer, e.g. "5–6 hours on foot" or "About 1 hour".', validation: (r) => r.max(40).warning('Keep it short: the detail belongs in the text.')}),
    defineField({name: 'openingHours', title: 'Opening hours', type: 'string', group: 'content', description: 'The short answer, e.g. "9am–5pm, closed on public holidays" or "Open daily, dawn to dusk". Leave empty if it doesn\'t apply.', validation: (r) => r.max(60).warning('Keep it short: the detail belongs in the text.')}),
    defineField({name: 'entryFee', title: 'Entry fee', type: 'string', group: 'content', description: 'The short answer, e.g. "Nu. 1,000 per visitor, included in our tours" or "Free". Leave empty if it doesn\'t apply.', validation: (r) => r.max(60).warning('Keep it short: the detail belongs in the text.')}),
    defineField({
      name: 'difficulty',
      title: 'Difficulty',
      type: 'string',
      group: 'content',
      options: {list: ['Easy', 'Moderate', 'Strenuous'], layout: 'radio', direction: 'horizontal'},
      description: 'Walks and hikes only.',
    }),
    defineField({name: 'bestTime', title: 'Best time to visit', type: 'string', group: 'content', description: 'The short answer, e.g. "Mar–May, Sep–Nov". Reasons and festivals go in the text.', validation: (r) => r.max(40).warning('Keep it short: the detail belongs in the text.')}),
    defineField({...lines('highlights', 'Highlights', 'Two or three short reasons to go, one per line, e.g. "Temple on a cliff at 3,120 m". Shown on its own page, under the key facts.'), validation: (r) => r.max(4).warning('Keep it to four at most.')}),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'blockContent',
      group: 'content',
      description: 'The story of the place, with photos and links (link other sights and tours on this site first). Until it has text, the page shows the short description and is hidden from Google.',
      validation: (r) => r.custom((v: unknown[] | undefined) => (v?.length ? true : 'No body yet: this page shows only the short description and is hidden from Google.')).warning(),
    }),
    defineField({name: 'updated', title: 'Last reviewed', type: 'date', group: 'content', description: 'Update this whenever you check the facts.'}),
    defineField({name: 'order', title: 'Position', type: 'number', group: 'content', initialValue: 99, description: 'Lower numbers appear first on the destination page.'}),
    seo,
  ],
  orderings: [{title: 'Position', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {
    select: {title: 'title', destination: 'destination.title', body: 'body', media: 'image'},
    prepare: ({title, destination, body, media}) => ({title, subtitle: [destination, body?.length ? null : 'no text yet'].filter(Boolean).join(' · '), media}),
  },
})

export const guide = defineType({
  name: 'guide',
  title: 'Travel guide',
  type: 'document',
  icon: BookIcon,
  groups,
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', group: 'content', validation: (r) => r.required()}),
    {...slug, group: 'content'},
    defineField({name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3, group: 'content', validation: (r) => r.required()}),
    image('image', 'Cover image'),
    defineField({
      name: 'group',
      title: 'Section',
      type: 'string',
      group: 'content',
      options: {list: [{title: 'Plan and book', value: 'Plan & Book'}, {title: 'Entry and visa', value: 'Entry & Visa'}, {title: 'Money and costs', value: 'Money & Costs'}, {title: 'On the ground', value: 'On the Ground'}], layout: 'radio'},  // stored values stay; the site shows them in sentence case
      validation: (r) => r.required(),
    }),
    defineField({name: 'order', title: 'Position', type: 'number', group: 'content', initialValue: 99, description: 'Lower numbers appear first.'}),
    // Replaced by "menu"; hidden so older guides that still carry it don't show an unknown-field warning.
    defineField({name: 'inMenu', type: 'boolean', hidden: true}),
    defineField({
      name: 'menu',
      title: 'Show in the menu',
      type: 'string',
      group: 'content',
      options: {list: [{title: 'Under Bhutan', value: 'bhutan'}, {title: 'Under Travel guide', value: 'guide'}], layout: 'radio'},
      description: 'Leave empty to keep it off the menu. Keep each list to three or four guides — the rest are one click away on the guides page.',
    }),
    defineField({name: 'menuTitle', title: 'Menu label', type: 'string', group: 'content', description: 'Short, sentence-case label for the header menu, e.g. "Festival dates". Leave empty to use the title.', hidden: ({parent}) => !parent?.menu}),
    defineField({name: 'updated', title: 'Last reviewed', type: 'date', group: 'content', description: 'Update this whenever you check the facts — visitors see it and Google favours fresh guides.', validation: (r) => r.required()}),
    defineField({name: 'body', title: 'Body', type: 'blockContent', group: 'content'}),
    seo,
  ],
  orderings: [{title: 'Position', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'group', media: 'image'}},
})

// A person on the About page's team section, grouped office team, guides, drivers, all as the same photo cards.
export const teamMember = defineType({
  name: 'teamMember',
  title: 'Team member',
  type: 'document',
  icon: UsersIcon,
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'group',
      title: 'Group',
      type: 'string',
      options: {list: [{title: 'Office team', value: 'office'}, {title: 'Guide', value: 'guide'}, {title: 'Driver', value: 'driver'}], layout: 'radio', direction: 'horizontal'},
      initialValue: 'office',
      validation: (r) => r.required(),
    }),
    defineField({name: 'role', title: 'Role', type: 'string', description: 'e.g. "Operations manager", "Senior guide".', validation: (r) => r.required()}),
    defineField({name: 'photo', title: 'Photo', type: 'image', options: {hotspot: true}, fields: photoFields.slice(0, 1), description: 'A clear, friendly portrait. Drag the focal point onto the face. Without one, a plain avatar shows.'}),
    defineField({name: 'bio', title: 'One line about them', type: 'text', rows: 2, hidden: ({parent}) => parent?.group !== 'office'}),
    defineField({name: 'languages', title: 'Languages', type: 'string', description: 'e.g. "English, German".', hidden: ({parent}) => parent?.group !== 'guide'}),
    defineField({name: 'years', title: 'Years with us / on the road', type: 'number', hidden: ({parent}) => parent?.group === 'office'}),
    defineField({name: 'order', title: 'Position', type: 'number', initialValue: 99, description: 'Lower numbers appear first.'}),
    defineField({name: 'placeholder', title: 'Sample profile', type: 'boolean', initialValue: false, description: 'Ticked = a stand-in while real profiles are gathered. While any sample is showing, the section adds a line saying the profiles are placeholders.'}),
  ],
  orderings: [{title: 'Position', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {
    select: {title: 'name', role: 'role', group: 'group', media: 'photo', placeholder: 'placeholder'},
    prepare: ({title, role, group, media, placeholder}) => ({title: placeholder ? `${title} (sample)` : title, subtitle: [role, group].filter(Boolean).join(' · '), media}),
  },
})
