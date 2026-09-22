import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '234ghw8x',
    dataset: 'production'
  },
  studioHost: 'bhutanova',
  deployment: {
    appId: 'gkih9o21nu3vubvqkomlw46q',
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: false,
  },
})
