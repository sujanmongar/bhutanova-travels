// Restricted markdown → Sanity Portable Text: ##/### headings, - and 1. lists, > quotes,
// **bold**, *italic*, [text](href) and simple pipe tables. Used by import-guides.ts.
let n = 0
const key = () => `k${(++n).toString(36)}`

type Span = {_type: 'span'; _key: string; text: string; marks: string[]}

/** Inline markdown → spans + the link annotations they point at. */
function inline(text: string) {
  const markDefs: any[] = []
  const spans: Span[] = []
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|(?<!\*)\*([^*]+)\*(?!\*)|`([^`]+)`/g
  let at = 0
  const push = (t: string, marks: string[] = []) => {
    if (t) spans.push({_type: 'span', _key: key(), text: t, marks})
  }
  for (const m of text.matchAll(re)) {
    push(text.slice(at, m.index))
    if (m[1]) {
      const def = {_type: 'link', _key: key(), href: m[2]}
      markDefs.push(def)
      push(m[1], [def._key])
    } else if (m[3]) push(m[3], ['strong'])
    else if (m[4]) push(m[4], ['em'])
    else if (m[5]) push(m[5], ['em'])
    at = (m.index ?? 0) + m[0].length
  }
  push(text.slice(at))
  return {children: spans.length ? spans : [{_type: 'span', _key: key(), text: '', marks: []}], markDefs}
}

const block = (style: string, text: string, listItem?: 'bullet' | 'number') => {
  const {children, markDefs} = inline(text.trim())
  return {_type: 'block', _key: key(), style, children, markDefs, ...(listItem ? {listItem, level: 1} : {})}
}

const cells = (row: string) =>
  row
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim())

export function toPortableText(md: string) {
  const out: any[] = []
  const lines = md.replace(/\r/g, '').split('\n')
  let para: string[] = []
  const flush = () => {
    if (para.length) out.push(block('normal', para.join(' ')))
    para = []
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const t = line.trim()
    if (!t) {
      flush()
      continue
    }
    if (t.startsWith('### ')) {
      flush()
      out.push(block('h3', t.slice(4)))
    } else if (t.startsWith('## ')) {
      flush()
      out.push(block('h2', t.slice(3)))
    } else if (t.startsWith('> ')) {
      flush()
      out.push(block('blockquote', t.slice(2)))
    } else if (/^[-*]\s+/.test(t)) {
      flush()
      out.push(block('normal', t.replace(/^[-*]\s+/, ''), 'bullet'))
    } else if (/^\d+[.)]\s+/.test(t)) {
      flush()
      out.push(block('normal', t.replace(/^\d+[.)]\s+/, ''), 'number'))
    } else if (t.startsWith('|') && /^\|[\s:|-]+\|$/.test((lines[i + 1] || '').trim())) {
      flush()
      const rows = [{_type: 'tableRow', _key: key(), cells: cells(t)}]
      i++ // separator row
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith('|')) {
        rows.push({_type: 'tableRow', _key: key(), cells: cells(lines[++i])})
      }
      out.push({_type: 'table', _key: key(), rows})
    } else {
      para.push(t)
    }
  }
  flush()
  return out
}

