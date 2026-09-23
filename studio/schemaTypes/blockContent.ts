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
