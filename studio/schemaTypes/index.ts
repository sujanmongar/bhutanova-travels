import {blockContent, simpleText} from './blockContent'
import {category, guide, post, tour} from './documents'
import {blockTypes, page} from './page'
import {seo} from './seo'
import {faqs, reviews} from './singletons'

export const schemaTypes = [page, tour, category, post, guide, faqs, reviews, seo, blockContent, simpleText, ...blockTypes]
