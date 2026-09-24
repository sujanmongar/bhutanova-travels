import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {table} from '@sanity/table'
import {HomeIcon} from '@sanity/icons/Home'
import {schemaTypes} from './schemaTypes'

// FAQs and Reviews are one fixed document each: no "create new", no delete, no duplicate.
// The Homepage and About page are always linked from the site, so they get the same protection.
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
            S.listItem().title('Homepage').id('home').icon(HomeIcon).child(S.document().schemaType('page').documentId('home')),
            S.listItem()
              .title('Pages')
              .schemaType('page')
              .child(S.documentTypeList('page').title('Pages').filter('_type == "page" && !(_id in ["home", "drafts.home"])')),
            S.divider(),
            S.documentTypeListItem('tour').title('Tours'),
            S.documentTypeListItem('category').title('Tour categories'),
            S.documentTypeListItem('destination').title('Destinations'),
            S.documentTypeListItem('sight').title('Sights'),
            S.divider(),
            S.documentTypeListItem('post').title('Blog posts'),
            S.documentTypeListItem('guide').title('Travel guides'),
            S.documentTypeListItem('teamMember').title('Team'),
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
    actions: (actions, {schemaType, documentId}) =>
      SINGLETONS.has(schemaType) || ['home', 'page-about'].includes(documentId ?? '')
        ? actions.filter(({action}) => action && ['publish', 'discardChanges', 'restore'].includes(action))
        : actions,
  },
})
