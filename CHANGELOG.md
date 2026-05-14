# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `data` CLI command now fetches indicator name and database name in parallel and includes them in output (`indicatorName`, `databaseName`)
- `formatDataResult()` utility — compact, sorted output format for CLI and MCP; hoists repeated fields to top level, strips SDMX default values (`_Z`, `_T`)
- Unit tests for `formatDataResult()`: sorting, metadata hoisting, SDMX noise filtering

## [0.1.0] — 2026-05-14

### Added
- `WorldBankClient` with fluent builder API
- `DataQueryBuilder` — fetch time-series data with autopagination (1000 records/page)
- `SearchBuilder` — full-text search via `/data360/searchv2` with `fetchItems()` for normalized output
- `discover()` — one-call overview of all databases and indicator counts
- `indicators()`, `metadata()`, `disaggregation()` endpoints
- V2 API: `countries()`, `v2Indicators()`, `topics()`
- `explain()` — describe a query without firing HTTP (sync)
- `toContext()` — markdown table ready to paste into an LLM prompt
- CLI (`worldbank` binary): `discover`, `search`, `data`, `explain`, `countries`, `help`
- Unit tests: `stripEmpty`, `normalizeDataRecord`, `parseFlags`, `paginate()`
