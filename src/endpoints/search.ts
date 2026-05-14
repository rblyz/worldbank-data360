import { postJSON, DATA360_BASE } from '../utils/http.js'
import type { SearchResult, SearchQuery, SearchResponse, SearchResultItem } from '../types/params.js'

interface RawSearchResultItem {
  '@search.score': number
  series_description?: {
    idno?: string
    name?: string
    database_id?: string
    topics?: Array<{ id?: string; name?: string; value?: string }>
  }
}

interface RawSearchResponse {
  '@odata.count'?: number
  value?: RawSearchResultItem[]
}

export class SearchBuilder {
  private _params: SearchQuery = {}

  search(term: string): this { this._params.search = term; return this }
  database(id: string): this { this._params.filter = `series_description/database_id eq '${id}'`; return this }
  filter(expr: string): this {
    if (this._params.filter) this._params.filter = `(${this._params.filter}) and (${expr})`
    else this._params.filter = expr
    return this
  }
  select(fields: string): this { this._params.select = fields; return this }
  orderBy(expr: string): this { this._params.orderby = expr; return this }
  top(n: number): this { this._params.top = n; return this }
  skip(n: number): this { this._params.skip = n; return this }
  count(include: boolean = true): this { this._params.count = include; return this }
  searchFields(fields: string): this { this._params.searchFields = fields; return this }
  facets(fields: string[]): this { this._params.facets = fields; return this }

  async fetch(): Promise<SearchResult> {
    return postJSON<unknown>(DATA360_BASE, '/data360/searchv2', this._params)
  }

  async fetchItems(): Promise<SearchResponse> {
    const body = {
      ...this._params,
      count: true,
      select: 'series_description/idno,series_description/name,series_description/database_id,series_description/topics'
    }

    const raw = await postJSON<RawSearchResponse>(DATA360_BASE, '/data360/searchv2', body)

    const items: SearchResultItem[] = (raw.value ?? [])
      .map(r => {
        const topics = (r.series_description?.topics ?? [])
          .map(t => t.name ?? t.value ?? '')
          .filter(Boolean)
        return {
          id: r.series_description?.idno ?? '',
          name: r.series_description?.name ?? '',
          databaseId: r.series_description?.database_id ?? '',
          score: r['@search.score'] ?? 0,
          ...(topics.length ? { topics } : {})
        }
      })
      .filter(item => item.id !== '')

    return {
      total: raw['@odata.count'] ?? 0,
      shown: items.length,
      items
    }
  }
}
