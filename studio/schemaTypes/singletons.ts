import {defineArrayMember, defineField, defineType} from 'sanity'
import {HelpCircleIcon} from '@sanity/icons/HelpCircle'
import {StarIcon} from '@sanity/icons/Star'

export const faqs = defineType({
  name: 'faqs',
  title: 'FAQs',
  type: 'document',
  icon: HelpCircleIcon,
  fields: [
    defineField({
      name: 'items',
      title: 'Questions',
      description: 'Drag to reorder. These also appear in Google as FAQ answers.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faq',
          fields: [
            defineField({name: 'q', title: 'Question', type: 'string', validation: (r) => r.required()}),
            defineField({name: 'a', title: 'Answer', type: 'text', rows: 4, validation: (r) => r.required()}),
          ],
          preview: {select: {title: 'q', subtitle: 'a'}},
        }),
      ],
    }),
  ],
  preview: {prepare: () => ({title: 'FAQs'})},
})

const PLATFORMS = ['Google', 'Tripadvisor']

export const reviews = defineType({
  name: 'reviews',
  title: 'Reviews',
  type: 'document',
  icon: StarIcon,
  fields: [
    defineField({
      name: 'sample',
      title: 'These are sample reviews',
      type: 'boolean',
      initialValue: true,
      description: 'While ticked, the site links to your review pages instead of showing ratings. Untick once the ratings and counts below are real.',
    }),
    defineField({
      name: 'platforms',
      title: 'Review platforms',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'platform',
          fields: [
            defineField({name: 'name', title: 'Platform', type: 'string', options: {list: PLATFORMS}, validation: (r) => r.required()}),
            defineField({name: 'rating', title: 'Rating (0–5)', type: 'number', validation: (r) => r.required().min(0).max(5)}),
            defineField({name: 'count', title: 'Total reviews', type: 'number', validation: (r) => r.required().integer().min(0)}),
            defineField({name: 'url', title: 'Profile link', type: 'url', validation: (r) => r.required().uri({scheme: ['https']})}),
          ],
          preview: {
            select: {title: 'name', rating: 'rating', count: 'count'},
            prepare: ({title, rating, count}) => ({title, subtitle: `${rating} ★ · ${count} reviews`}),
          },
        }),
      ],
    }),
    defineField({
      name: 'items',
      title: 'Testimonials',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'testimonial',
          fields: [
            defineField({name: 'name', title: 'Name', type: 'string', validation: (r) => r.required()}),
            defineField({name: 'place', title: 'From', type: 'string', validation: (r) => r.required()}),
            defineField({name: 'trip', title: 'Tour taken', type: 'string'}),
            defineField({name: 'source', title: 'Posted on', type: 'string', options: {list: PLATFORMS}}),
            defineField({name: 'rating', title: 'Rating', type: 'number', initialValue: 5, validation: (r) => r.required().integer().min(1).max(5)}),
            defineField({name: 'text', title: 'Review', type: 'text', rows: 4, validation: (r) => r.required()}),
            defineField({
              name: 'photo',
              title: 'Guest photo',
              type: 'image',
              options: {hotspot: true},
              description:
                'A photo of the guest on their trip — only with their permission. The first review shows it large; the others as a small portrait. Drag the focal point onto their face. Without a photo, the tour’s own picture is shown.',
            }),
          ],
          preview: {select: {title: 'name', subtitle: 'text', media: 'photo'}},
        }),
      ],
    }),
  ],
  preview: {prepare: () => ({title: 'Reviews'})},
})
