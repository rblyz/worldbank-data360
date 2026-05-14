import { postJSON, DATA360_BASE } from '../utils/http.js'
import type { MetadataResult } from '../types/params.js'

export interface IndicatorMeta {
  name: string
  databaseName: string
}

export async function fetchIndicatorMeta(indicatorId: string): Promise<IndicatorMeta | null> {
  const raw = await postJSON<{ value?: Array<{ series_description?: { name?: string; database_name?: string } }> }>(
    DATA360_BASE, '/data360/metadata', { query: `series_description/idno eq '${indicatorId}'` }
  )
  const sd = raw.value?.[0]?.series_description
  if (!sd?.name || !sd?.database_name) return null
  return { name: sd.name, databaseName: sd.database_name }
}

export class MetadataBuilder {
  async query(oDataQuery: string): Promise<MetadataResult> {
    return postJSON<unknown>(DATA360_BASE, '/data360/metadata', { query: oDataQuery })
  }
}
