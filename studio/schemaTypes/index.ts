import {blockContent, simpleText} from './blockContent'
import {category, destination, guide, post, tour} from './documents'
import {blockTypes, page} from './page'
import {seo} from './seo'
import {faqs, reviews} from './singletons'

export const schemaTypes = [page, tour, category, destination, post, guide, faqs, reviews, seo, blockContent, simpleText, ...blockTypes]
