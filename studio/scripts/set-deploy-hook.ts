// Creates (or replaces) the Sanity webhook that rebuilds the website whenever content is published.
// The GitHub token is read from GH_DEPLOY_TOKEN, checked against GitHub, then stored only inside Sanity.
// Run from studio/ (re-run the same way when the token expires):
//   read -rs 'GH_DEPLOY_TOKEN?GitHub token: ' && GH_DEPLOY_TOKEN="$GH_DEPLOY_TOKEN" npx sanity exec scripts/set-deploy-hook.ts --with-user-token
import {getCliClient} from 'sanity/cli'

const REPO = 'sujanmongar/bhutanova-travels'
const WORKFLOW = `https://api.github.com/repos/${REPO}/actions/workflows/deploy.yml`
const NAME = 'Rebuild website on publish'

const token = process.env.GH_DEPLOY_TOKEN?.trim()
if (!token?.startsWith('github_pat_')) throw new Error('GH_DEPLOY_TOKEN must be a fine-grained GitHub token (starts with github_pat_).')

const github = {
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
}
const check = await fetch(WORKFLOW, {headers: github})
if (!check.ok) throw new Error(`GitHub rejected the token (HTTP ${check.status}). It needs access to ${REPO} with "Actions: Read and write".`)

const client = getCliClient({apiVersion: '2021-10-04'})
const {projectId, dataset} = client.config()
const base = `/hooks/projects/${projectId}`

const existing: {id: string; name: string}[] = await client.request({url: base})
for (const h of existing.filter((h) => h.name === NAME)) await client.request({url: `${base}/${h.id}`, method: 'DELETE'})

await client.request({
  url: base,
  method: 'POST',
  body: {
    type: 'document',
    name: NAME,
    description: `Starts the Deploy workflow in ${REPO} (managed by studio/scripts/set-deploy-hook.ts).`,
    url: `${WORKFLOW}/dispatches`,
    httpMethod: 'POST',
    dataset,
    apiVersion: 'v2025-02-19',
    includeDrafts: false,
    headers: github,
    rule: {
      on: ['create', 'update', 'delete'],
      filter: '_type in ["page", "tour", "category", "destination", "sight", "post", "guide", "teamMember", "faqs", "reviews"]',
      projection: '{"ref": "main"}',
    },
  },
})
console.log(`${existing.some((h) => h.name === NAME) ? 'Replaced' : 'Created'} webhook "${NAME}". Publishing in the Studio now rebuilds the site.`)
