import {defineField, defineType, useFormValue, type ObjectInputProps, type StringInputProps} from 'sanity'
import {Box, Card, Stack, Text} from '@sanity/ui'

const SITE = 'https://bhutanova-travels.pages.dev'
const SUFFIX = ' | Bhutanova Travels'
const PATHS: Record<string, string> = {
  tour: '/tours/',
  category: '/tours/category/',
  post: '/blog/',
  guide: '/travel-guide/',
}

// Live "42 / 60" under the field; turns orange once past the length Google shows.
const counter = (max: number) =>
  function CharCount(props: StringInputProps) {
    const n = (props.value ?? '').length
    return (
      <Stack gap={2}>
        {props.renderDefault(props)}
        <Text size={1} muted>
          <span style={{color: n > max ? '#b45309' : undefined}}>
            {n} / {max} characters{n > max ? ' — Google will cut this off' : ''}
          </span>
        </Text>
      </Stack>
    )
  }

// What the page will look like as a Google result, using the same fallbacks the site uses.
function SeoInput(props: ObjectInputProps) {
  const type = useFormValue(['_type']) as string
  const title = (useFormValue(['title']) as string) ?? ''
  const slug = (useFormValue(['slug', 'current']) as string) ?? ''
  const fallbackDesc = ((useFormValue(['excerpt']) ?? useFormValue(['summary'])) as string) ?? ''
  const seo = (props.value ?? {}) as {title?: string; description?: string; noindex?: boolean}
  const shownTitle = seo.title || `${title}${SUFFIX}`
  const shownDesc = seo.description || fallbackDesc
  const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)

  return (
    <Stack gap={4}>
      <Card padding={4} radius={3} border tone={seo.noindex ? 'caution' : 'default'}>
        <Stack gap={3}>
          <Text size={1} weight="medium" muted>
            {seo.noindex ? 'Hidden from search engines' : 'Google preview'}
          </Text>
          <Text size={1} muted>
            {SITE.replace('https://', '')}
            {PATHS[type] ?? '/'}
            {slug}
          </Text>
          <Box>
            <Text size={3}>
              <span style={{color: '#1a0dab'}}>{clip(shownTitle, 60)}</span>
            </Text>
          </Box>
          <Text size={2} muted>
            {clip(shownDesc, 160) || 'Add a meta description or excerpt to control this text.'}
          </Text>
        </Stack>
      </Card>
      {props.renderDefault(props)}
    </Stack>
  )
}

export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  components: {input: SeoInput},
  options: {collapsible: true, collapsed: false},
  fields: [
    defineField({
      name: 'title',
      title: 'Meta title',
      type: 'string',
      description: 'The blue headline in Google. Leave empty to use the page title + " | Bhutanova Travels".',
      components: {input: counter(60)},
      validation: (r) => r.max(60).warning('Over 60 characters — Google will shorten it.'),
    }),
    defineField({
      name: 'description',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      description: 'The grey text under the headline in Google. Leave empty to use the excerpt.',
      components: {input: counter(160)},
      validation: (r) => [
        r.max(160).warning('Over 160 characters — Google will shorten it.'),
        r.min(70).warning('Under 70 characters — a longer summary usually gets more clicks.'),
      ],
    }),
    defineField({
      name: 'image',
      title: 'Share image',
      type: 'image',
      description: 'Shown when the page is shared on WhatsApp, Facebook, LinkedIn or X. Leave empty to use the main image.',
    }),
    defineField({
      name: 'noindex',
      title: 'Hide this page from search engines',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})
