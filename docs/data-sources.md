# Climate Data Sources

This document describes the external APIs used by the Climate Risk Intelligence
Platform backend to fetch flood, hurricane, heat, and wildfire hazard data for a
given latitude/longitude.

---

## NOAA Climate Data Online (CDO) API

### Base URL

```
https://www.ncei.noaa.gov/cdo-web/api/v2/
```

Key endpoints:

| Endpoint | Purpose |
|---|---|
| `/stations` | Find weather stations by bounding box |
| `/data` | Fetch observations for a station |
| `/datasets` | List available datasets |

### Authentication

Request a free token at https://www.ncdc.noaa.gov/cdo-web/token and pass it on
every request:

```http
token: YOUR_NOAA_CDO_TOKEN
```

Stored in the backend as `NOAA_API_KEY`.

### Querying temperature normals and extreme event history

CDO does **not** support direct lat/lng queries. Use a two-step workflow:

1. **Find a station** in a ±0.5° bounding box (`extent` =
   `south_lat,west_lon,north_lat,east_lon`) that reports annual hot-day counts:

```
GET /stations?datasetid=GSOY&datatypeid=DX90&extent=25.27,-80.63,26.27,-79.63&limit=100
```

   A station qualifies with a long record: `mindate` early enough to give at least
   10 years in the 30-year window, `maxdate` within the last 2 years, and
   `datacoverage` ≥ 0.7. The closest station alone is often a short-lived backup.
   Among qualifying stations the app prefers the nearest **first-order NWS/ASOS
   station** (`GHCND:USW…`) within 50 km whose elevation is within 100 m of the
   nearest station of any kind (a proxy for the property's elevation); otherwise it
   uses the nearest qualifying station. Live checks found co-op gauges with shifted
   records (Key Biscayne for Miami Beach: +47 hot days/decade) and a rainforest
   valley gauge for downtown Honolulu (0 hot days); the elevation guard stops a
   valley airport being used for a ridge town (Oroville for Paradise, CA).

2. **Fetch annual days ≥ 90°F** (`DX90`, Global Summary of the Year) in 10-year chunks:

```
GET /data?datasetid=GSOY&stationid=GHCND:USW00092811&datatypeid=DX90
    &startdate=2015-01-01&enddate=2024-12-31&limit=1000
```

   Three requests cover 30 years. The earlier approach (one `GHCND` daily `TMAX`
   request per year, 30 per analysis) hit the 5 req/s limit and took 25–40 s.
   The trend is an ordinary least-squares slope in hot days per decade, computed
   against the actual years (gaps in the record don't compress time). Factors cite
   the observed span, e.g. "1996–2025". A single HTTP 429 is retried after 1.2 s.

### Rate limits

- 5 requests/second per token
- 10,000 requests/day per token
- `/data` returns max 1,000 records per request (paginate with `offset`)
- Daily data (`GHCND`): max 1-year date range per request
- Monthly/annual data (`GSOM`, `GSOY`): max 10-year date range per request

### Response format

JSON with a `results` array. Temperature values are in °F when
`units=standard`.

### Known edge cases

- Sparse station coverage in rural and mountainous areas
- Missing or flagged values in `attributes` field (e.g. `,W,` = estimated)
- Station `mindate`/`maxdate` may not cover the full analysis window
- Without a valid token, all requests return HTTP 401

---

## NASA EarthData API (NEX-GDDP-CMIP6)

> **Not used.** The backend does not query NASA. Heat projections use NOAA
> trend extrapolation. This section is kept as a reference for a future
> integration only. There is no `NASA_API_KEY` setting.

### Purpose

Temperature **projections** (e.g. 2050 scenarios). Historical observations come
from NOAA CDO; NASA data supplements forward-looking analysis.

### Datasets

| Property | Value |
|---|---|
| Short name | `NEX-GDDP-CMIP6` |
| Resolution | 0.25° (~25 km) daily |
| Variables | `tas`, `tasmax`, `tasmin` (Kelvin) |
| Scenarios | `historical`, `ssp126`, `ssp245`, `ssp370`, `ssp585` |

### Authentication

**AWS S3 open access (recommended):** no auth required.

```
https://nex-gddp-cmip6.s3.amazonaws.com/NEX-GDDP-CMIP6/{MODEL}/{SCENARIO}/{VARIANT}/{VAR}/{FILE}.nc
```

**Earthdata Login** (for restricted DAAC granules): bearer token from
https://urs.earthdata.nasa.gov/. Not configured in this app.

**CMR Search API** (metadata, no auth):

```
GET https://cmr.earthdata.nasa.gov/search/granules.json
    ?short_name=NEX-GDDP-CMIP6&bounding_box=west,south,east,north
```

### Coordinate-based query format

NetCDF files use 0–360° longitude. Convert US coordinates:
`lon_360 = lon + 360 if lon < 0 else lon`. Subset with `xarray`:

```python
point = ds["tas"].sel(lat=25.76, lon=lon360(-80.19), method="nearest")
celsius = point.values - 273.15
```

### Rate limits

No published limits on AWS S3. Each yearly file is ~230 MB — cache aggressively.

### Known edge cases

- Temperature stored in Kelvin, not Celsius
- Southern latitude cutoff at -60°
- Multiple model runs exist; ensemble means improve robustness
- THREDDS NCSS subsetting has been unreliable; prefer S3 direct access
- v1 and v2.0 file suffixes coexist on S3 (`_v2.0.nc`)

---

## FEMA National Flood Hazard Layer (NFHL)

### ArcGIS REST endpoint

```
https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer
```

| Layer | ID | Content |
|---|---|---|
| NFHL availability | 0 | Coverage footprint |
| FIRM panels | 3 | Map panel metadata |
| Base Flood Elevations | 16 | BFE lines |
| **Flood zones (primary)** | **28** | Zone polygons |

> Use `/arcgis/rest/services/public/NFHL/MapServer` — the legacy `/gis/nfhl/rest/`
> path returns 404.

### Authentication

None. Public, keyless ArcGIS REST. No FEMA API key is sent.

### Querying flood zone by latitude/longitude

ArcGIS geometry order is **longitude,latitude**:

```
GET .../MapServer/28/query
    ?where=1=1
    &geometry=-80.1918,25.7617
    &geometryType=esriGeometryPoint
    &inSR=4326
    &spatialRel=esriSpatialRelIntersects
    &outFields=FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE
    &returnGeometry=false
    &f=json
```

### Response format

ArcGIS JSON (`f=json`) or GeoJSON (`f=geojson`). Key fields:

| Field | Meaning |
|---|---|
| `FLD_ZONE` | Zone code: `AE`, `VE`, `X`, `AO`, etc. |
| `SFHA_TF` | `T` = Special Flood Hazard Area |
| `STATIC_BFE` | Base flood elevation (feet), may be null |
| `ZONE_SUBTY` | e.g. `0.2 PCT ANNUAL CHANCE FLOOD HAZARD` for shaded X |

### Rate limits

Undocumented. Use a descriptive `User-Agent` and cache results.

### Fallback: Esri Living Atlas mirror

`hazards.fema.gov` resets TLS connections from some networks (observed from a
Canadian IP) and is often slow. When the FEMA query fails or returns an ArcGIS
`error` body, the app queries Esri's mirror of the same flood zone polygons:

```
https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Flood_Hazard_Reduced_Set_gdb/FeatureServer/0/query
```

It has the same `FLD_ZONE`, `ZONE_SUBTY`, `SFHA_TF`, and `STATIC_BFE` fields.
The "reduced set" keeps 1% and 0.2% annual chance zones and levee areas but omits
minimal-hazard zone X, so a miss there is reported as "outside FEMA-mapped 1% and
0.2% flood hazard areas" with **Low** confidence: it can't rule out an unmapped
area. Its subtype text is title case (`0.2 Percent Annual Chance Flood Hazard`),
so subtypes are matched case-insensitively. Reports name the mirror in the flood
factors when it was used.

### How zones are scored

| Zone | Score | Notes |
|---|---|---|
| `V`, `VE`, `A`, `AE`, `A99`, `AR*` | 80 (+8 with a real BFE) | 1% annual chance SFHA |
| `AO`, `AH` | 60 | shallow flooding |
| `X` with `ZONE_SUBTY` 0.2% or levee | 40 | shaded X; `SFHA_TF` is `F` for these |
| `X` (minimal) | 12 | High confidence on the full NFHL; Low on a mirror miss |
| `D`, `AREA NOT INCLUDED`, or no NFHL polygon | unavailable | FEMA has not determined the hazard |

### Known edge cases

- Empty `features[]` outside mapped FEMA areas (common in interior West): reported
  as unavailable, not as zone X
- Points on zone boundaries may return multiple features — select highest-risk zone
- `STATIC_BFE` is often null for Zone X, and `-9999` means "no BFE"
- Preliminary (non-effective) maps live in a separate `Prelim_NFHL` service

---

## USGS / NIFC Wildland Fire Interagency Geospatial Services (WFIGS)

### Endpoints

| Layer | URL suffix |
|---|---|
| **Historical all years** | `InterAgencyFirePerimeterHistory_All_Years_View/FeatureServer/0/query` |
| Current active | `WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query` |
| Year to date | `WFIGS_Interagency_Perimeters_YearToDate/FeatureServer/0/query` |

Base host:

```
https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/
```

Open data portal: https://data-nifc.opendata.arcgis.com/

### Authentication

None. CC BY 3.0. Set a descriptive `User-Agent` header.

### Querying fire perimeter history by geographic area

50 km radius around a point:

```
GET .../InterAgencyFirePerimeterHistory_All_Years_View/FeatureServer/0/query
    ?where=FIRE_YEAR_INT >= 2006 AND FEATURE_CA LIKE '%Final%'
    &geometry=-122.4194,37.7749
    &geometryType=esriGeometryPoint
    &inSR=4326
    &spatialRel=esriSpatialRelIntersects
    &distance=50000
    &units=esriSRUnit_Meter
    &outFields=INCIDENT,GIS_ACRES,FIRE_YEAR_INT,AGENCY,FEATURE_CA
    &returnGeometry=false
    &f=json
    &resultRecordCount=2000
```

### Response format

ArcGIS JSON. Key fields: `INCIDENT`, `FIRE_YEAR_INT`, `GIS_ACRES`, `FEATURE_CA`.
`exceededTransferLimit: true` signals pagination via `resultOffset`.

### Rate limits

No hard published limit. Max 2,000 records per query. Avoid high-frequency
polling of current-perimeter layers (refreshed every ~5 minutes).

### Known edge cases

- Empty results mean low wildfire risk, not an error
- Filter `FEATURE_CA LIKE '%Final%'` to exclude provisional perimeters
- Dense fire regions (CA, OR) require pagination
- Fuel type and WUI designation are **not** in this layer. The app uses it only
  for a small fire-history bonus (up to +10); hazard comes from USFS WHP below.
- Cloud/datacenter IPs may see connection resets without a `User-Agent`

---

## USFS Wildfire Hazard Potential (WHP), 2023 classified

Primary wildfire signal. ImageServer on the federal GeoPlatform:

```
https://imagery.geoplatform.gov/iipp/rest/services/Fire_Aviation/USFS_EDW_RMRS_WildfireHazardPotentialClassified/ImageServer
```

The app calls `computeHistograms` with a ±2 km envelope around the property
(geometry as JSON with `spatialReference.wkid = 4326`; the plain `x,y` form
returns `NoData`) and converts the counts to the share of pixels per class:
1 Very Low, 2 Low, 3 Moderate, 4 High, 5 Very High, 6 Non-burnable, 7 Water.

Score = mean class weight of burnable land (10/25/50/75/100), scaled down when
less than 30% of land within 2 km is burnable, plus up to +10 for NIFC fire
history. Dense urban cores score low even in fire-prone regions; WHP 2023 does
not cover Hawaii well.

---

## NOAA IBTrACS (Hurricane Tracks)

Hurricane track data is **not** available through the CDO API. Use the NOAA
ArcGIS FeatureServer:

```
https://services2.arcgis.com/FiaPA4ga0iQKduv3/ArcGIS/rest/services/
IBTrACS_ALL_list_v04r00_lines_1/FeatureServer/0/query
```

Query with point geometry + `distance` (meters) and filter by the lowercase
`year` field for the lookback window (`year >= 1976`). The layer has **no
`SEASON` field**: a `SEASON` filter returns HTTP 200 with an `error` body, which
earlier versions of this app parsed as "no storms". Fields: `SID`, `NAME`,
`year`, `USA_WIND`, `LAT`, `LON`, `Hurricane_Date`.

The app fetches a 500 km radius (first `returnCountOnly`, then all pages in
parallel, ordered by `OBJECTID`) and scores on **close passes**: distinct storms
whose track segment came within 100 km of the property, classed by their
strongest `USA_WIND` while that close. Distance is measured to the segment
between consecutive 6-hourly points, not just to the points.
Derive Saffir-Simpson category from `USA_WIND` (knots):

| Category | Wind (kt) |
|---|---|
| 1 | ≥ 64 |
| 2 | ≥ 83 |
| 3 | ≥ 96 |
| 4 | ≥ 113 |
| 5 | ≥ 137 |

### Known edge cases

- Max 1,000 records per query — paginate with `resultOffset`
- Service version (`v04r00`) may lag bulk file version (`v04r01`)
- Track segments, not unique storm centroids — deduplicate by `SID`

---

## Service integration summary

| Hazard | Primary source | Auth | Backend module |
|---|---|---|---|
| Flood | FEMA NFHL MapServer/28, Esri Living Atlas mirror fallback | None | `flood_data.py` |
| Hurricane | IBTrACS FeatureServer | None | `hurricane_data.py` |
| Heat | NOAA CDO GSOY `DX90` | `token` header | `heat_data.py` |
| Wildfire | USFS WHP 2023 + WFIGS Fire Perimeter History | None | `wildfire_data.py` |
| Projections | Not queried (NASA NEX-GDDP documented only) | — | outlook points are linear projections from today's scores (`trend_builder.py`), labelled as such |

All spatial ArcGIS queries share the pattern: point geometry (`lon,lat`),
`esriSpatialRelIntersects`, optional `distance` + `units` for radius searches.
