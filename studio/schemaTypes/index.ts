import {blockContent, simpleText} from './blockContent'
import {category, destination, guide, post, sight, teamMember, tour} from './documents'
import {blockTypes, page} from './page'
import {seo} from './seo'
import {faqs, reviews, settings} from './singletons'

export const schemaTypes = [page, tour, category, destination, sight, teamMember, post, guide, faqs, reviews, settings, seo, blockContent, simpleText, ...blockTypes]
