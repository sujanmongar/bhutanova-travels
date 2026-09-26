import {defineArrayMember, defineType} from 'sanity'

// Links must be absolute (https://…), site-relative (/bhutan-tours/…), mailto: or tel:. Sanity's uri() alone lets
// "contact" or "www.site.com" through, which become broken relative links; javascript:/data: are rejected.
export const linkRules = (r: any) => [
  r.uri({allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel']}),
  r.custom((v?: string) => !v || /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(v) || 'Start with https://, /, mailto: or tel:'),
]
export const link = {
  name: 'link',
  title: 'Link',
  type: 'object',
  fields: [
    {
      name: 'href',
      title: 'URL',
      type: 'url',
      description: 'Full address (https://…), a page on this site (/bhutan-tours/…), mailto: or tel:.',
      validation: (r: any) => [r.required(), ...linkRules(r)],
    },
  ],
}

// A photo inside an article: drag the focal point, describe it for screen readers, optional caption, and a credit when
// its licence asks for one (older photos carry theirs on the image file, which the site still reads).
const photo = {
  name: 'photo',
  title: 'Photo',
  type: 'image',
  options: {hotspot: true},
  validation: (r: any) => r.required().assetRequired(),
  fields: [
    {name: 'alt', title: 'Describe the photo', type: 'string', description: 'For screen readers and search, e.g. "Prayer flags above Dochula Pass".', validation: (r: any) => r.required()},
    {name: 'credit', title: 'Photo credit', type: 'string', description: 'Only when the photo\'s licence asks for one, e.g. "Wikimedia Commons, CC BY-SA 4.0". Shown after the caption.'},
    {name: 'caption', title: 'Caption', type: 'string'},
  ],
}

// No H1 here on purpose: the page title is the page's only H1 (an SEO rule).
export const blockContent = defineType({
  name: 'blockContent',
  title: 'Body',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        {title: 'Paragraph', value: 'normal'},
        {title: 'Heading', value: 'h2'},
        {title: 'Subheading', value: 'h3'},
        {title: 'Quote / note', value: 'blockquote'},
      ],
      lists: [
        {title: 'Bullets', value: 'bullet'},
        {title: 'Numbered', value: 'number'},
      ],
      marks: {
        decorators: [
          {title: 'Bold', value: 'strong'},
          {title: 'Italic', value: 'em'},
        ],
        annotations: [link],
      },
    }),
    defineArrayMember({type: 'table'}),
    defineArrayMember(photo),
    defineArrayMember({
      name: 'gallery',
      title: 'Photos side by side',
      type: 'object',
      fields: [
        {name: 'images', title: 'Photos', type: 'array', of: [photo], validation: (r: any) => r.required().min(2).max(3), description: 'Two or three. With three, the first runs full width.'},
        {name: 'caption', title: 'Caption', type: 'string'},
      ],
      preview: {select: {title: 'caption', media: 'images.0'}, prepare: ({title, media}: any) => ({title: title || 'Photos side by side', subtitle: 'Gallery', media})},
    }),
    defineArrayMember({
      name: 'embed',
      title: 'Video or map',
      type: 'object',
      fields: [
        {
          name: 'url',
          title: 'Link',
          type: 'url',
          description: 'A YouTube or Vimeo link, or a Google Maps link to a place (the maps.app.goo.gl short link can only show as a link).',
          validation: (r: any) => [r.required(), r.uri({scheme: ['https']})],
        },
        {name: 'title', title: 'What it shows', type: 'string', description: 'Read out by screen readers, e.g. "Masked dancers at Paro Tshechu".', validation: (r: any) => r.required()},
        {name: 'caption', title: 'Caption', type: 'string'},
      ],
      preview: {select: {title: 'title', subtitle: 'url'}},
    }),
    defineArrayMember({
      name: 'tourCard',
      title: 'Tour',
      type: 'object',
      fields: [{name: 'tour', title: 'Tour', type: 'reference', to: [{type: 'tour'}], validation: (r: any) => r.required()}],
      preview: {select: {title: 'tour.title', media: 'tour.image'}, prepare: ({title, media}: any) => ({title, subtitle: 'Tour card', media})},
    }),
    defineArrayMember({
      name: 'pullQuote',
      title: 'Pull quote',
      type: 'object',
      fields: [
        {name: 'text', title: 'Quote', type: 'text', rows: 3, validation: (r: any) => r.required().max(240)},
        {name: 'attribution', title: 'Who said it', type: 'string', description: 'Leave empty for a line lifted from the article itself.'},
      ],
      preview: {select: {title: 'text', subtitle: 'attribution'}},
    }),
  ],
})

// Paragraphs only (bold, italic, links) — for short intros inside page blocks.
export const simpleText = defineType({
  name: 'simpleText',
  title: 'Text',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [{title: 'Paragraph', value: 'normal'}],
      lists: [],
      marks: {
        decorators: [
          {title: 'Bold', value: 'strong'},
          {title: 'Italic', value: 'em'},
        ],
        annotations: [link],
      },
    }),
  ],
})
