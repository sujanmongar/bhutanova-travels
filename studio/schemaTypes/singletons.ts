import {defineArrayMember, defineField, defineType} from 'sanity'
import {HelpCircleIcon} from '@sanity/icons/HelpCircle'
import {StarIcon} from '@sanity/icons/Star'
import {CogIcon} from '@sanity/icons/Cog'
import {photoFields, needsAlt} from './documents'

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
            defineField({name: 'a', title: 'Answer', type: 'text', rows: 4, description: 'Blank line = new paragraph. Start a line with "- " for a bullet. **Two stars** make words bold; [words](/travel-guide/visa/) or [words](https://…) makes a link.', validation: (r) => r.required()}),
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
            defineField({name: 'text', title: 'Review', type: 'text', rows: 4, description: 'Wrap a short phrase in **double asterisks** to highlight it, e.g. **the best week of my year**. One or two per review.', validation: (r) => r.required()}),
            defineField({
              name: 'photo',
              title: 'Guest photo',
              type: 'image',
              options: {hotspot: true},
              description:
                'A photo of the guest on their trip — only with their permission. It shows as a small round portrait beside the name. Drag the focal point onto the person. Without a photo, the tour’s own picture is shown.',
              fields: [defineField({name: 'alt', title: 'Describe the photo', type: 'string', description: 'What the photo shows, e.g. "Two hikers on the trail to Tiger’s Nest".'})],
            }),
          ],
          preview: {select: {title: 'name', subtitle: 'text', media: 'photo'}},
        }),
      ],
    }),
  ],
  preview: {prepare: () => ({title: 'Reviews'})},
})

const PROMISE = 'Free day-by-day plan and price within 24 hours. Nothing to pay to ask.'

// Site settings: the details every page shares (contact, office hours, licence, social profiles, the footer's line about
// us) and the banners of the pages the site builds itself (tours, destinations, travel guide, blog, contact). Empty
// fields keep the site's built-in wording.
const listingPage = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'object',
    group: 'pages',
    options: {collapsible: true, collapsed: true},
    fields: [
      defineField({name: 'heading', title: 'Main heading (H1)', type: 'string', validation: (r) => r.max(70).warning('Shorter headings look better on the photo.')}),
      defineField({name: 'line', title: 'Line under the heading', type: 'string'}),
      defineField({name: 'image', title: 'Banner photo', type: 'image', options: {hotspot: true}, fields: photoFields.slice(0, 1), description: 'Landscape, at least 2400 px wide. Drag the circle onto the subject: phones show a tall slice around it. Empty keeps the current photo.', validation: (r) => needsAlt(r, 2400)}),
      defineField({name: 'seoTitle', title: 'Google title', type: 'string', validation: (r) => r.max(60).warning('Over 60 characters — Google will shorten it.')}),
      defineField({name: 'seoDescription', title: 'Google description', type: 'text', rows: 2, validation: (r) => r.max(160).warning('Over 160 characters — Google will shorten it.')}),
    ],
  })

export const settings = defineType({
  name: 'settings',
  title: 'Site settings',
  type: 'document',
  icon: CogIcon,
  groups: [
    {name: 'contact', title: 'Contact', default: true},
    {name: 'footer', title: 'Footer and social'},
    {name: 'brand', title: 'Brand and SEO'},
    {name: 'pages', title: 'Page banners'},
  ],
  fields: [
    defineField({name: 'phone', title: 'WhatsApp and main phone', type: 'string', group: 'contact', description: 'With the country code, e.g. "+975 77 34 44 26". Every WhatsApp button uses this number.', validation: (r) => r.required().regex(/^\+[\d\s]{8,}$/, {name: 'phone'}).error('Start with + and the country code, digits and spaces only.')}),
    defineField({name: 'phoneAlt', title: 'Second phone', type: 'string', group: 'contact', description: 'Optional. With the country code, e.g. "+975 17 44 99 32". Shown in the footer and on the contact page.', validation: (r) => r.regex(/^\+[\d\s]{8,}$/, {name: 'phone'}).error('Start with + and the country code, digits and spaces only.')}),
    defineField({name: 'email', title: 'Email shown on the site', type: 'string', group: 'contact', validation: (r) => r.required().email()}),
    defineField({name: 'emailTo', title: 'Where emails go', type: 'string', group: 'contact', description: 'The inbox that email links and the enquiry form\'s email fallback actually send to. Empty = the email shown above. (The enquiry form itself sends to the inbox its Web3Forms key belongs to.)', validation: (r) => r.email()}),
    defineField({name: 'address', title: 'Office address', type: 'string', group: 'contact'}),
    defineField({name: 'hours', title: 'Office hours', type: 'string', group: 'contact', description: 'e.g. "Mon–Sat, 9am–6pm Bhutan time (GMT+6)".'}),
    defineField({name: 'licence', title: 'Tour operator licence number', type: 'string', group: 'contact', description: 'Shown in the footer and the homepage proof line. Until you type the real number, the stand-in 1234 shows.'}),
    defineField({name: 'promise', title: 'Reply promise', type: 'string', group: 'contact', description: `The line under enquiry buttons and forms across the site. Empty keeps the default: "${PROMISE}"`, validation: (r) => r.max(120).warning('Keep it to one short line.')}),
    defineField({name: 'waPlan', title: 'WhatsApp message for a free trip plan', type: 'text', rows: 4, group: 'contact', description: 'What WhatsApp opens with when a visitor taps "Get a free trip plan" on the homepage. One question per line; the page address is added at the end. Empty keeps the default.'}),
    defineField({name: 'formSubject', title: 'Enquiry email subject', type: 'string', group: 'contact', description: 'The subject of the enquiry emails the form sends you. Empty keeps "New trip enquiry".'}),
    defineField({name: 'about', title: 'Line about us', type: 'text', rows: 2, group: 'footer', description: 'One sentence under the logo in the footer.'}),
    defineField({name: 'facebook', title: 'Facebook page', type: 'url', group: 'footer', description: 'Empty = no Facebook icon.'}),
    defineField({name: 'instagram', title: 'Instagram profile', type: 'url', group: 'footer'}),
    defineField({name: 'linkedin', title: 'LinkedIn page', type: 'url', group: 'footer'}),
    defineField({name: 'twitter', title: 'X profile', type: 'url', group: 'footer'}),
    defineField({name: 'google', title: 'Google Business Profile', type: 'url', group: 'footer', description: 'The link from your profile\'s Share button, e.g. https://maps.app.goo.gl/… Empty = no Google icon.'}),
    defineField({name: 'tripadvisor', title: 'Tripadvisor listing', type: 'url', group: 'footer', description: 'Empty = no Tripadvisor icon.'}),
    defineField({
      name: 'quickLinks',
      title: 'Footer quick links',
      type: 'array',
      group: 'footer',
      description: 'The Quick links column in the footer, up to 8. An address starting with / is a page on this site; https:// is another site and opens in a new tab. Empty keeps the default list.',
      validation: (r) => r.max(8).warning('More than 8 makes the column long.'),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'quickLink',
          fields: [
            defineField({name: 'label', title: 'Words shown', type: 'string', validation: (r) => r.required()}),
            defineField({name: 'href', title: 'Address', type: 'string', description: 'e.g. /travel-guide/entry-requirements/ or https://www.drukair.com.bt/', validation: (r) => r.required().custom((v?: string) => !v || /^(\/|https:\/\/)/.test(v) || 'Start with / (a page on this site) or https://.')}),
          ],
          preview: {select: {title: 'label', subtitle: 'href'}},
        }),
      ],
    }),
    defineField({name: 'ogImage', title: 'Default share image', type: 'image', group: 'brand', options: {hotspot: true}, fields: photoFields.slice(0, 1), description: 'Shown when a page without its own photo is shared on WhatsApp, Facebook and the like. Landscape, at least 1200 × 630 px. Empty keeps the current photo.', validation: (r) => needsAlt(r, 1200)}),
    defineField({
      name: 'verify',
      title: 'Search engine verification',
      type: 'object',
      group: 'brand',
      description: 'Only needed if Google Search Console or Bing Webmaster Tools asks for an HTML tag. Paste only the content="…" value, without the quotes. Empty adds nothing.',
      fields: [
        defineField({name: 'google', title: 'Google Search Console', type: 'string', validation: (r) => r.regex(/^[\w-]+$/).error('Paste only the code inside content="…".')}),
        defineField({name: 'bing', title: 'Bing Webmaster Tools', type: 'string', validation: (r) => r.regex(/^[\w-]+$/).error('Paste only the code inside content="…".')}),
      ],
    }),
    listingPage('tours', 'Tours page (/bhutan-tours/)'),
    listingPage('destinations', 'Destinations page'),
    listingPage('guides', 'Travel guide page'),
    listingPage('blog', 'Blog page'),
    listingPage('contact', 'Contact page'),
  ],
  preview: {prepare: () => ({title: 'Site settings'})},
})
