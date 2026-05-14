import { DataQueryBuilder } from './endpoints/data.js'
import { IndicatorsBuilder } from './endpoints/indicators.js'
import { DisaggregationBuilder } from './endpoints/disaggregation.js'
import { MetadataBuilder } from './endpoints/metadata.js'
import { SearchBuilder } from './endpoints/search.js'
import { CountriesBuilder, V2IndicatorsBuilder, TopicsBuilder } from './endpoints/v2.js'
import { discover as _discover } from './endpoints/discover.js'
import type { DiscoverResult } from './types/params.js'

export class WorldBankClient {
  data(databaseId: string): DataQueryBuilder {
    return new DataQueryBuilder(databaseId)
  }

  indicators(datasetId: string): IndicatorsBuilder {
    return new IndicatorsBuilder(datasetId)
  }

  disaggregation(datasetId: string): DisaggregationBuilder {
    return new DisaggregationBuilder(datasetId)
  }

  metadata(): MetadataBuilder {
    return new MetadataBuilder()
  }

  search(): SearchBuilder {
    return new SearchBuilder()
  }

  countries(): CountriesBuilder {
    return new CountriesBuilder()
  }

  v2Indicators(): V2IndicatorsBuilder {
    return new V2IndicatorsBuilder()
  }

  topics(): TopicsBuilder {
    return new TopicsBuilder()
  }

  async discover(): Promise<DiscoverResult> {
    return _discover()
  }
}
