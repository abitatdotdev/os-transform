# OS Transform - Bun Server

A modern Bun server implementation of the OS Transform library, providing REST API endpoints for coordinate transformations between OSGB36/British National Grid (EPSG:27700) and WGS84 (EPSG:4326).

Uses [proj4js](http://proj4js.org/) for accurate coordinate transformations with a simple seven-parameter Helmert datum transformation.

## Requirements

- [Bun](https://bun.sh) runtime (v1.0+)

## Installation

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install
```

## Running the Server

```bash
# Start the server
bun run server.js

# Or use the npm script
bun start

# Development mode with auto-reload
bun dev
```

The server will start on `http://localhost:3000` by default.

### Environment Variables

- `PORT` - Server port (default: 3000)

```bash
PORT=8080 bun run server.js
```

## API Endpoints

All endpoints support both `GET` (query parameters) and `POST` (JSON body) requests.

### 1. Convert Easting/Northing to Lat/Lng

**Endpoint:** `POST/GET /api/to-latlng`

**Parameters:**
- `ea` (number, required) - Easting coordinate
- `no` (number, required) - Northing coordinate
- `decimals` (number, optional) - Decimal places (default: 7)

**Example (GET):**
```bash
curl "http://localhost:3000/api/to-latlng?ea=337297&no=503695"
```

**Example (POST):**
```bash
curl -X POST http://localhost:3000/api/to-latlng \
  -H "Content-Type: application/json" \
  -d '{"ea": 337297, "no": 503695}'
```

**Response:**
```json
{
  "lat": 54.42481,
  "lng": -2.9679374
}
```

### 2. Convert Lat/Lng to Easting/Northing

**Endpoint:** `POST/GET /api/from-latlng`

**Parameters:**
- `lat` (number, required) - Latitude
- `lng` (number, required) - Longitude
- `decimals` (number, optional) - Decimal places (default: 2)

**Example (GET):**
```bash
curl "http://localhost:3000/api/from-latlng?lat=54.42480998&lng=-2.96793742"
```

**Example (POST):**
```bash
curl -X POST http://localhost:3000/api/from-latlng \
  -H "Content-Type: application/json" \
  -d '{"lat": 54.42480998, "lng": -2.96793742}'
```

**Response:**
```json
{
  "ea": 337297,
  "no": 503695
}
```

### 3. Convert Easting/Northing to Grid Reference

**Endpoint:** `POST/GET /api/to-gridref`

**Parameters:**
- `ea` (number, required) - Easting coordinate
- `no` (number, required) - Northing coordinate

**Example (GET):**
```bash
curl "http://localhost:3000/api/to-gridref?ea=337297&no=503695"
```

**Example (POST):**
```bash
curl -X POST http://localhost:3000/api/to-gridref \
  -H "Content-Type: application/json" \
  -d '{"ea": 337297, "no": 503695}'
```

**Response:**
```json
{
  "text": "NY 37297 03695",
  "html": "NY&thinsp;37297&thinsp;03695",
  "letters": "NY",
  "eastings": "37297",
  "northings": "03695"
}
```

### 4. Convert Grid Reference to Easting/Northing

**Endpoint:** `POST/GET /api/from-gridref`

**Parameters:**
- `gridref` (string, required) - Grid reference (e.g., "NY 37297 03695")

**Example (GET):**
```bash
curl "http://localhost:3000/api/from-gridref?gridref=NY%2037297%2003695"
```

**Example (POST):**
```bash
curl -X POST http://localhost:3000/api/from-gridref \
  -H "Content-Type: application/json" \
  -d '{"gridref": "NY 37297 03695"}'
```

**Response:**
```json
{
  "ea": 337297,
  "no": 503695
}
```

### 5. Convert Grid Reference to Lat/Lng (Direct)

**Endpoint:** `POST/GET /api/gridref-to-latlng`

**Parameters:**
- `gridref` (string, required) - Grid reference (e.g., "NY 37297 03695")
- `decimals` (number, optional) - Decimal places (default: 7)

**Example (GET):**
```bash
curl "http://localhost:3000/api/gridref-to-latlng?gridref=NY%2037297%2003695"
```

**Example (POST):**
```bash
curl -X POST http://localhost:3000/api/gridref-to-latlng \
  -H "Content-Type: application/json" \
  -d '{"gridref": "NY 37297 03695", "decimals": 5}'
```

**Response:**
```json
{
  "lat": 54.4248023,
  "lng": -2.9679342
}
```

This is a convenience endpoint that combines grid reference to easting/northing conversion with coordinate transformation in a single call.

### 6. Health Check

**Endpoint:** `GET /` or `GET /health`

Returns server status and available endpoints.

**Example:**
```bash
curl http://localhost:3000/health
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `400` - Bad Request (invalid parameters or coordinates out of bounds)
- `404` - Not Found (invalid endpoint)
- `500` - Internal Server Error

**Error Response Format:**
```json
{
  "error": "Error message here"
}
```

## CORS

CORS is enabled by default, allowing requests from any origin.

## Architecture

- **server.js** - Main Bun server with HTTP routing and request handling
- **transform.js** - Core transformation logic as an ES module (class-based)
- **package.json** - Project metadata and dependencies

All original transformation logic from `os-transform.js` has been preserved and converted to modern ES module format using a class-based approach.

## Transformation Method

The server uses **proj4js** with a simple seven-parameter Helmert datum transformation:

```
+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000
+ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489
+units=m +no_defs
```

This transformation provides ~95% accuracy across Great Britain (errors up to 3.5m vary by location).

For higher accuracy transformations using OSTN15 grid-based datum adjustments, see the original browser version documentation.

## Differences from Browser Version

1. **ES Modules** - Uses modern `import/export` instead of browser globals
2. **Class-based** - Logic encapsulated in `OSTransform` class
3. **REST API** - HTTP endpoints instead of direct function calls
4. **proj4 only** - Uses proj4js library (no CGI or grid file dependencies)
5. **No browser dependencies** - Runs in Bun runtime instead of browser

## Original Browser Version

The original browser-based version (`os-transform.js`) is still available and unchanged for backward compatibility. It includes additional transformation options (OSTN15 via CGI or grid files) not available in the server version.
