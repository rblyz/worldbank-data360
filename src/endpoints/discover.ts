import { postJSON, DATA360_BASE } from '../utils/http.js'
import type { DiscoverResult, DatabaseInfo } from '../types/params.js'

interface FacetValue { value: string; count: number }
interface FacetResponse {
  '@odata.count': number
  '@search.facets': Record<string, FacetValue[]>
}

export async function discover(): Promise<DiscoverResult> {
  const raw = await postJSON<FacetResponse>(DATA360_BASE, '/data360/searchv2', {
    count: true,
    top: 0,
    facets: ['series_description/database_id,count:100']
  })

  const facetValues = raw['@search.facets']?.['series_description/database_id'] ?? []

  const databases: DatabaseInfo[] = facetValues.map(f => ({
    id: f.value,
    indicatorCount: f.count
  }))

  return {
    totalIndicators: raw['@odata.count'] ?? 0,
    databases,
    hint: "Use client.search('your topic').fetchItems() to find indicators, then client.data(databaseId).indicator(id).from('2000').to('2023').fetch()"
  }
}
