# OS Transform

A set of JavaScript helper functions for transforming between the OSGB36/British National Grid (EPSG:27700) and WGS84 (EPSG:4326) coordinate systems; as well as providing support for OS Grid Reference conversions.

## 🆕 Bun Server Version

This library now includes a modern **Bun server** implementation with REST API endpoints! See [server/SERVER.md](server/SERVER.md) for details.

**Quick start:**
```bash
cd server
bun run server.js
# Server runs at http://localhost:3000
```

**API Example:**
```bash
curl "http://localhost:3000/api/to-gridref?ea=337297&no=503695"
# Returns: {"text":"NY 37297 03695", ...}
```

---

## Browser Installation (Original)

Include the following `<script>` tag in the header section of your HTML document:

```html
<script src="os-transform.js"></script>
```

## Background

In August 2016, Ordnance Survey released a transformation grid called OSTN15 which improves the accuracy of the transformation between OSGB36/British National Grid and WGS84<sup>[1]</sup>. It does this by implementing a 'rubber-sheet' style transformation that works by using bilinear interpolation to essentially apply different transformations in different parts of the country.

You can find more information in relation to the transformation by [reading our guide to coordinate systems in Great Britain](https://www.ordnancesurvey.co.uk/documents/resources/guide-coordinate-systems-great-britain.pdf) (PDF).

## Configuration

### GIQTrans [default]

GIQTrans (provided as part of the [Grid InQuestII](https://www.ordnancesurvey.co.uk/geodesy-positioning/coordinate-transformations/grid-inquest2-software) software) is an excutable binary which can be placed in the CGI-BIN directory on your web server to perform the OSTN15 transformation.

[Common Gateway Interface](https://en.wikipedia.org/wiki/Common_Gateway_Interface) (CGI) is a communication bridge between a web server and programs or scripts which allows the generation of dynamic content for users.

Once configured, GISTrans doesn't have any other external dependencies. Individual coordinates can be transformed using a POST request as follows:

```js
async function fetchAndProcessData(source, target, coordinates) {
    const response = await fetch('/cgi-bin/giqtrans', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `SourceSRID=${source}&TargetSRID=${target}&Geometry={"type":"Point","coordinates":[${coordinates}]}`
    });
    const data = await response.json();
    ....
    const point = data.coordinates;
}
```

### Proj4js [alternative]

[Proj4js](http://proj4js.org/) is a JavaScript library to transform point coordinates from one coordinate system to another, including datum transformations.

It can be added as a source at the top of your HTML document (before  `os-transform.js` is defined):

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.19.0/proj4.min.js"></script>
<script src="os-transform.js"></script>
```

Version 2.7.0 (and above) of the library includes support for [grid based datum adjustments](https://github.com/proj4js/proj4js#grid-based-datum-adjustments) (using the `+nadgrids` keyword in a coordinate system definition).

This means that OSTN15 can be added to the conversion as follows:

1. **NTv2 method** (using a `.gsb` file)

   ```js
   async function fetchAndProcessData(fromProjection, toProjection, coordinates) {
       const response = await fetch('OSTN15_NTv2_OSGBtoETRS.gsb');
       const arrayBuffer = await response.arrayBuffer();
       proj4.nadgrid('OSTN15_NTv2_OSGBtoETRS', arrayBuffer);
       proj4.defs('EPSG:27700', '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +nadgrids=OSTN15_NTv2_OSGBtoETRS +units=m +no_defs +type=crs');
       ....
       const point = proj4(fromProjection, toProjection, coordinates);
   }
   ```

   `OSTN15_NTv2_OSGBtoETRS.gsb` is provided as part of the [NTv2 format files](https://www.ordnancesurvey.co.uk/documents/resources/OSTN15-NTv2.zip) ZIP archive.

2. **GeoTIFF method** (using a `.tif` file)

   ```js
   async function fetchAndProcessData(fromProjection, toProjection, coordinates) {
       const tiff = await GeoTIFF.fromUrl('uk_os_OSTN15_NTv2_OSGBtoETRS.tif');
       await proj4.nadgrid('OSTN15_NTv2_OSGBtoETRS', tiff).ready;
       proj4.defs('EPSG:27700', '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +nadgrids=OSTN15_NTv2_OSGBtoETRS +units=m +no_defs +type=crs');
       ....
       const point = proj4(fromProjection, toProjection, coordinates);
   }
   ```

   `uk_os_OSTN15_NTv2_OSGBtoETRS.tif` is locally mirrored from https://cdn.proj.org/.

   NOTE: This method requires [geotiff.js](https://geotiffjs.github.io/) with the prebuilt CDN version added as a source at the top of your HTML document.

   ```html
   <script src="https://cdn.jsdelivr.net/npm/geotiff"></script>
   ```

Please see https://github.com/proj4js/proj4js#grid-based-datum-adjustments for further reading on the two grid based datum adjustment methods.

Although earlier versions of the Proj4js library can also be used, the `+nadgrids` grid shift won't be supported, i.e. the point coordinate conversion will only be implemented using a simple seven-parameter geodetic transformation:

```js
proj4.defs('EPSG:27700', '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs');
```

This particular transformation (more commonly known as a [Helmert datum transformation](https://en.wikipedia.org/wiki/Helmert_transformation)) is an averaged transformation between the two datums which will smooth out localised distortions in OSGB36/British National Grid. Because the transformation uses a single set of parameters for the whole country it has a 95% accuracy; and can give errors of up to 3.5m (this value varies across the country).

## Usage

### os.Transform.toLatLng()

**Description:** Return latlng from an input easting + northing.

**Parameters:**

`coordinates` `{object}`: The easting + northing to be transformed.<br>
`decimals` `{integer}`: [Optional | Default = 7] The specified number of decimal places.

```js
os.Transform.toLatLng({ ea: 337297, no: 503695 });
// Returns { lat: 54.42481, lng: -2.9679374 }
```

### os.Transform.fromLatLng()

**Description:** Return easting + northing from an input latlng.

**Parameters:**

`coordinates` `{object}`: The latlng to be transformed.<br>
`decimals` `{integer}`: [Optional | Default = 2] The specified number of decimal places.

```js
os.Transform.fromLatLng({ lat: 54.42480998276385, lng: -2.96793742245737 });
// Returns { ea: 337297, no: 503695 }
```

### os.Transform.toGridRef()

**Description:** Return grid reference [plain | encoded | components] from an input easting + northing.

**Parameters:**

`coordinates` `{object}`: The easting + northing to be converted.

```js
os.Transform.toGridRef({ ea: 337297, no: 503695 });
// Returns { text: "NY 37297 03695", html: "NY&thinsp;37297&thinsp;03695", letters: "NY", eastings: "37297", northings: "03695" }
```

### os.Transform.fromGridRef()

**Description:** Return easting + northing from an input grid reference.

**Parameters:**

`gridref` `{string}`: The grid reference to be converted.

```js
os.Transform.fromGridRef("NY 37297 03695");
// Returns { ea: 337297, no: 503695 }
```

## Change Log

**Version 0.1.0** (March 2020)
- Initial release.

**Version 0.2.0** (June 2020)
- Updated to include `_checkBounds()` function, which ensures input coordinates are within the permitted bounds (extent of GB).

**Version 0.3.0** (February 2021)
- Included support for grid based datum adjustments (NTv2 `.gsb`).
- Minor code refactoring.
- Additional usage examples provided.

**Version 0.4.0** (March 2021)
- Added support for 4-figure to 12-figure grid references.
- Updated to include `_validateGridRef()` function, which validates input grid references.
- `toGridRef()` function includes components (letters, eastings + northings) of grid reference in returned object.

**Version 0.5.0** (June 2025)
- Added configuration options.
- Includes functionality to transform coordinates via a Common Gateway Interface (CGI) request to GIQTrans.
- Additional support for grid based datum adjustments (GeoTIFF `.tif`).
- Replaced [depreciated] `substr()` JS method with `substring()`.

## Notes

<sup>[1]</sup> OSTN15 is actually a transformation to [European Terrestrial Reference System 1989 (ETRS89)](https://en.wikipedia.org/wiki/European_Terrestrial_Reference_System_1989), which can be considered as a higher accuracy version of WGS84 for Europe.

## Licence

The contents of this repository are licensed under the [Open Government Licence 3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/).

![Logo](https://www.nationalarchives.gov.uk/images/infoman/ogl-symbol-41px-retina-black.png "OGL logo")
