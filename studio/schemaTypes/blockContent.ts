import {defineArrayMember, defineType} from 'sanity'

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
        annotations: [
          {
            name: 'link',
            title: 'Link',
            type: 'object',
            fields: [
              {
                name: 'href',
                title: 'URL',
                type: 'url',
                description: 'Full address (https://…) or a page on this site (/tours/…).',
                validation: (r) =>
                  r.required().uri({allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel']}),
              },
            ],
          },
        ],
      },
    }),
    defineArrayMember({type: 'table'}),
  ],
})
