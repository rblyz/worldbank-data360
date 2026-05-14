import { getJSON, V2_BASE } from '../utils/http.js'
import type { V2Country, V2Indicator, V2Topic, V2Result, V2PaginationMeta } from '../types/params.js'

async function fetchV2All<T>(path: string): Promise<V2Result<T>> {
  const raw = await getJSON<[V2PaginationMeta, T[]]>(V2_BASE, path, { format: 'json', per_page: 300 })
  const [meta, items] = raw
  return { meta, items }
}

export class CountriesBuilder {
  async fetch(): Promise<V2Result<V2Country>> {
    return fetchV2All<V2Country>('/country')
  }
}

export class V2IndicatorsBuilder {
  async fetch(): Promise<V2Result<V2Indicator>> {
    return fetchV2All<V2Indicator>('/indicator')
  }
}

export class TopicsBuilder {
  async fetch(): Promise<V2Result<V2Topic>> {
    return fetchV2All<V2Topic>('/topic')
  }
}
