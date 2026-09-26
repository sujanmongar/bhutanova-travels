import {useEffect, useState} from 'react'
import {defineField, defineType, useClient, useFormValue, type ObjectInputProps, type StringInputProps} from 'sanity'
import {Box, Card, Stack, Text} from '@sanity/ui'

const SITE = 'https://bhutanova-travels.pages.dev'
const SUFFIX = ' | Bhutanova Travels'
const HOME_TITLE = 'Bhutanova Travels | Bhutan tours, treks & festival journeys'
const SITE_DESC =
  'Bhutanova Travels is a Thimphu-based tour operator crafting cultural, festival, trekking and luxury tours across Bhutan, guided by the values of Gross National Happiness.'
const PATHS: Record<string, string> = {
  page: '/',
  category: '/bhutan-tours/',
  post: '/blog/',
  guide: '/travel-guide/',
  destination: '/destinations/',
}

// A tour's address holds its theme, a sight's its destination: look up the picked one (slug + name).
function useRef(ref?: string) {
  const client = useClient({apiVersion: '2025-02-19'})
  const [doc, setDoc] = useState<{slug?: string; title?: string}>({})
  useEffect(() => {
    if (!ref) return setDoc({})
    client.fetch('*[_id in [$id, "drafts." + $id]][0]{"slug": slug.current, title}', {id: ref}).then((d) => setDoc(d ?? {}))
  }, [client, ref])
  return doc
}

// Live "42 / 60" under the field; turns orange once past the length Google shows.
export const counter = (max: number) =>
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
  const excerpt = useFormValue(['excerpt']) as string | undefined
  const summary = useFormValue(['summary']) as string | undefined
  const fallbackDesc = excerpt ?? summary ?? ''
  const seo = (props.value ?? {}) as {title?: string; description?: string; noindex?: boolean; keyword?: string}
  const id = ((useFormValue(['_id']) as string) ?? '').replace(/^drafts\./, '')
  const home = id === 'home'
  const days = useFormValue(['days']) as number | undefined
  const catRef = useFormValue(['category', '_ref']) as string | undefined
  const destRef = useFormValue(['destination', '_ref']) as string | undefined
  const cat = useRef(type === 'tour' ? catRef : undefined)
  const dest = useRef(type === 'sight' ? destRef : undefined)
  // The same addresses and default titles the site builds
  const path =
    type === 'tour' ? `/bhutan-tours/${cat.slug ?? '…'}/${days ?? '…'}-days-${slug}/`
    : type === 'sight' ? `/destinations/${dest.slug ?? '…'}/${slug}/`
    : home ? '/' : `${PATHS[type] ?? '/'}${slug}/`
  const baseTitle =
    type === 'tour' ? `${title}, ${days ?? '…'} days`
    : type === 'destination' ? `${title} travel guide`
    : type === 'sight' ? `${title}, ${dest.title ?? '…'}`
    : title
  const shownTitle = seo.title || (home ? HOME_TITLE : `${baseTitle}${SUFFIX}`)
  // Pages have no excerpt, so the site falls back to its general description (same as here).
  const shownDesc = seo.description || fallbackDesc || (type === 'page' ? SITE_DESC : '')
  const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)
  // Focus keyword: does it appear where Google weighs it most? (words in any order; the URL uses hyphens)
  const words = (seo.keyword ?? '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  const has = (s: string) => words.length > 0 && words.every((w) => s.toLowerCase().includes(w))
  const checks: [string, boolean][] = words.length
    ? [
        ['In the Google title', has(shownTitle)],
        ['In the description', has(shownDesc)],
        ['In the page address', has(path.replace(/-/g, ' '))],
        ['In the page heading', has(title)],
      ]
    : []

  return (
    <Stack gap={4}>
      <Card padding={4} radius={3} border tone={seo.noindex ? 'caution' : 'default'}>
        <Stack gap={3}>
          <Text size={1} weight="medium" muted>
            {seo.noindex ? 'Hidden from search engines' : 'Google preview'}
          </Text>
          <Text size={1} muted>
            {SITE.replace('https://', '')}
            {path}
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
      {checks.length > 0 && (
        <Card padding={3} radius={3} border tone={checks.every(([, ok]) => ok) ? 'positive' : 'default'}>
          <Stack gap={2}>
            <Text size={1} weight="medium">Focus keyword “{seo.keyword}”</Text>
            {checks.map(([label, ok]) => (
              <Text key={label} size={1} muted={ok}>
                {ok ? '✓' : '○'} {label}
              </Text>
            ))}
          </Stack>
        </Card>
      )}
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
      name: 'keyword',
      title: 'Focus keyword',
      type: 'string',
      description: 'The search people would type to find this page, e.g. "Bhutan cultural tour" or "Bhutan visa". The checks above show where it appears. Google ignores a separate keywords tag, so this guides your writing only.',
    }),
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
      description: 'Shown when the page is shared on WhatsApp, Facebook, LinkedIn or X (cut to a wide frame around the focal point). Leave empty to use the main image.',
      options: {hotspot: true},
    }),
    defineField({
      name: 'noindex',
      title: 'Hide this page from search engines',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})
