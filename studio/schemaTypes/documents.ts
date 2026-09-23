import {defineArrayMember, defineField, defineType} from 'sanity'
import {BookIcon} from '@sanity/icons/Book'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {PinIcon} from '@sanity/icons/Pin'
import {TagIcon} from '@sanity/icons/Tag'

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
    lines('highlights', 'Highlights', 'One per line, e.g. "Tiger\'s Nest Monastery".'),
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
    defineField({name: 'order', title: 'Menu position', type: 'number', group: 'content', initialValue: 99, description: 'Lower numbers appear first.'}),
    seo,
  ],
  orderings: [{title: 'Menu position', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'excerpt', media: 'image'}},
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
    defineField({name: 'inMenu', title: 'Show in the menu', type: 'boolean', group: 'content', initialValue: false, description: 'The header menu shows up to five guides — tick this for the ones travellers need most.'}),
    defineField({name: 'menuTitle', title: 'Menu label', type: 'string', group: 'content', description: 'Short, sentence-case label for the header menu, e.g. "Visa and entry". Leave empty to use the title.', hidden: ({parent}) => !parent?.inMenu}),
    defineField({name: 'updated', title: 'Last reviewed', type: 'date', group: 'content', description: 'Update this whenever you check the facts — visitors see it and Google favours fresh guides.', validation: (r) => r.required()}),
    defineField({name: 'body', title: 'Body', type: 'blockContent', group: 'content'}),
    seo,
  ],
  orderings: [{title: 'Position', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'group', media: 'image'}},
})
