import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {table} from '@sanity/table'
import {schemaTypes} from './schemaTypes'

// FAQs and Reviews are one fixed document each: no "create new", no delete, no duplicate.
const SINGLETONS = new Set(['faqs', 'reviews'])

export default defineConfig({
  name: 'default',
  title: 'Bhutanova Travels',

  projectId: '234ghw8x',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.documentTypeListItem('tour').title('Tours'),
            S.documentTypeListItem('category').title('Tour categories'),
            S.divider(),
            S.documentTypeListItem('post').title('Blog posts'),
            S.documentTypeListItem('guide').title('Travel guides'),
            S.divider(),
            ...[...SINGLETONS].map((id) =>
              S.listItem()
                .title(id === 'faqs' ? 'FAQs' : 'Reviews')
                .id(id)
                .schemaType(id)
                .child(S.document().schemaType(id).documentId(id)),
            ),
          ]),
    }),
    table(),
    // GROQ playground for developers only; clients never see it on the deployed Studio.
    ...(process.env.NODE_ENV === 'development' ? [visionTool()] : []),
  ],

  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter(({schemaType}) => !SINGLETONS.has(schemaType)),
  },

  document: {
    actions: (actions, {schemaType}) =>
      SINGLETONS.has(schemaType)
        ? actions.filter(({action}) => action && ['publish', 'discardChanges', 'restore'].includes(action))
        : actions,
  },
})
