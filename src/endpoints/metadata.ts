import { postJSON, DATA360_BASE } from '../utils/http.js'
import type { MetadataResult } from '../types/params.js'

export class MetadataBuilder {
  async query(oDataQuery: string): Promise<MetadataResult> {
    return postJSON<unknown>(DATA360_BASE, '/data360/metadata', { query: oDataQuery })
  }
}
