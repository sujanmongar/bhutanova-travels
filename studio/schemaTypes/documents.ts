import {defineArrayMember, defineField, defineType} from 'sanity'
import {BookIcon} from '@sanity/icons/Book'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {PinIcon} from '@sanity/icons/Pin'
import {TagIcon} from '@sanity/icons/Tag'
import {UsersIcon} from '@sanity/icons/Users'

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
const image = (name: string, title: string, required = true) =>
  defineField({
    name,
    title,
    type: 'image',
    options: {hotspot: false},
    group: 'content',
    validation: required ? (r) => r.required() : undefined,
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
    defineField({name: 'nights', title: 'Nights', type: 'number', group: 'content', validation: (r) => r.required().integer().min(0)}),
    defineField({name: 'days', title: 'Days', type: 'number', group: 'content', validation: (r) => r.required().integer().min(1)}),
    defineField({name: 'price', title: 'Price from (USD per person)', type: 'number', group: 'content', validation: (r) => r.required().min(0)}),
    lines('priceNotes', 'Price notes', 'One note per line, e.g. "Based on 2 people sharing".'),
    defineField({name: 'summary', title: 'Overview', type: 'text', rows: 4, group: 'content', validation: (r) => r.required()}),
    defineField({...lines('route', 'Route', 'One stop per line, e.g. "Paro (2N)".'), validation: (r) => r.required().min(1)}),
    image('image', 'Card image'),
    defineField({name: 'gallery', title: 'Gallery', type: 'array', of: [{type: 'image'}], options: {layout: 'grid'}, group: 'content'}),
    lines('highlights', 'Highlights'),
    // Trip facts shown under the photos. Accommodation, meals, guide and transport come from "What's included".
    // Trip facts: no longer shown on the site (owner's call); hidden so existing values are kept, not lost.
    defineField({name: 'groupSize', title: 'Group size', type: 'string', group: 'content', hidden: true, description: 'e.g. "Private tour, from 1 traveller". Hidden when empty.'}),
    defineField({name: 'guideLanguages', title: 'Guide languages', type: 'string', group: 'content', hidden: true, description: 'e.g. "English, Hindi". Hidden when empty.'}),
    defineField({name: 'maxAltitude', title: 'Max altitude', type: 'string', group: 'content', hidden: true, description: 'The highest point of the trip, e.g. "3,120 m (Tiger\'s Nest)".'}),
    defineField({name: 'bestSeason', title: 'Best season', type: 'string', group: 'content', hidden: true, description: 'e.g. "March–May and September–November".'}),
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
            defineField({name: 'body', title: 'Description', type: 'text', rows: 5, description: 'Blank line = new paragraph. Start a line with "- " for a bullet.', validation: (r) => r.required()}),
            defineField({name: 'overnight', title: 'Overnight', type: 'string'}),
            defineField({
              name: 'places',
              title: 'Places this day',
              type: 'array',
              of: [{type: 'reference', to: [{type: 'sight'}, {type: 'destination'}], options: {disableNew: true}}],
              validation: (r) => r.unique().max(4),
              description: 'Sights and destinations visited this day, shown as small cards linking to their pages. When empty, the image below shows instead.',
            }),
            defineField({name: 'image', title: 'Image', type: 'image'}),
          ],
          preview: {select: {title: 'title', subtitle: 'overnight', media: 'image'}},
        }),
      ],
    }),
    lines('inclusions', "What's included"),
    lines('exclusions', "What's not included"),
    image('map', 'Route map', false),
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
    defineField({name: 'tags', title: 'Topics', type: 'array', of: [{type: 'string'}], options: {layout: 'tags'}, group: 'content', description: 'The first topic is shown on the card and used for the blog filter.'}),
    defineField({name: 'body', title: 'Body', type: 'blockContent', group: 'content'}),
    seo,
  ],
  orderings: [{title: 'Newest first', name: 'dateDesc', by: [{field: 'date', direction: 'desc'}]}],
  preview: {select: {title: 'title', subtitle: 'date', media: 'image'}},
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
    defineField({name: 'excerpt', title: 'Short description', type: 'text', rows: 2, group: 'content', validation: (r) => r.required()}),
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
    defineField({name: 'bestTime', title: 'Best time to visit', type: 'string', group: 'content'}),
    defineField({name: 'gettingThere', title: 'Getting there', type: 'string', group: 'content', description: 'e.g. "45 minutes by road from Paro International Airport".'}),
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
  preview: {select: {title: 'title', subtitle: 'excerpt', media: 'image'}},
})

// A place to see inside a destination. Every sight shows on its destination's page; tick "Own page" to give it a page
// at /destinations/<destination>/<sight>/ (write the body first).
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
    defineField({name: 'excerpt', title: 'Short description', type: 'text', rows: 3, group: 'content', description: 'Two or three sentences, shown on the destination page.', validation: (r) => r.required()}),
    defineField({name: 'page', title: 'Own page', type: 'boolean', group: 'content', initialValue: false, description: 'Give this sight its own page. Needs a cover photo and a body.'}),
    image('image', 'Cover photo', false),
    defineField({name: 'altitude', title: 'Altitude', type: 'string', group: 'content', description: 'e.g. "3,120 m". Leave empty if it doesn\'t matter.', hidden: ({parent}) => !parent?.page}),
    defineField({name: 'timeNeeded', title: 'Time needed', type: 'string', group: 'content', description: 'e.g. "5–6 hours return on foot".', hidden: ({parent}) => !parent?.page}),
    defineField({
      name: 'difficulty',
      title: 'Difficulty',
      type: 'string',
      group: 'content',
      options: {list: ['Easy', 'Moderate', 'Strenuous'], layout: 'radio', direction: 'horizontal'},
      description: 'Walks and hikes only.',
      hidden: ({parent}) => !parent?.page,
    }),
    defineField({name: 'bestTime', title: 'Best time to visit', type: 'string', group: 'content', hidden: ({parent}) => !parent?.page}),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'blockContent',
      group: 'content',
      hidden: ({parent}) => !parent?.page,
      validation: (r) => r.custom((v: unknown[] | undefined, ctx) => ((ctx.parent as {page?: boolean})?.page && !v?.length ? 'A sight with its own page needs a body' : true)),
    }),
    defineField({name: 'updated', title: 'Last reviewed', type: 'date', group: 'content', description: 'Update this whenever you check the facts.', hidden: ({parent}) => !parent?.page}),
    defineField({name: 'order', title: 'Position', type: 'number', group: 'content', initialValue: 99, description: 'Lower numbers appear first on the destination page.'}),
    seo,
  ],
  orderings: [{title: 'Position', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {
    select: {title: 'title', destination: 'destination.title', page: 'page', media: 'image'},
    prepare: ({title, destination, page, media}) => ({title, subtitle: [destination, page ? 'own page' : null].filter(Boolean).join(' · '), media}),
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
      options: {list: ['Plan & Book', 'Entry & Visa', 'Money & Costs', 'On the Ground'], layout: 'radio'},
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

// A person on the About page's team section. Office staff show as cards; guides and drivers as a row of small portraits.
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
    defineField({name: 'photo', title: 'Photo', type: 'image', options: {hotspot: true}, description: 'A clear, friendly portrait. Without one, a plain avatar shows.'}),
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
