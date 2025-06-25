// os-transform.js v0.5.0

window.os = window.os || {};

os.Transform = {
    /**
     * Default configuration options.
     */
    options: {
        // Transformation type:
        // # ostn15-cgi - [default] OSTN15 Transformation via Common Gateway Interface (CGI) request to GIQTrans.
        // # ostn15-gsb - OSTN15 Transformation using Grid Based Datum Adjustments (NTv2 `.gsb` file).
        // # ostn15-tif - OSTN15 Transformation using Grid Based Datum Adjustments (GeoTIFF `.tif` file).
        // # simple-towgs84 - Simple seven-parameter geodetic transformation.
        type: 'ostn15-cgi',
        //
        gsbPath: 'resources/OSTN15_NTv2_OSGBtoETRS.gsb',
        tifPath: 'resources/uk_os_OSTN15_NTv2_OSGBtoETRS.tif',
        //
        proj4: {
            nadgrid: 'OSTN15_NTv2_OSGBtoETRS',
            defs: {
                towgs84: '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs',
                ostn15: '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +nadgrids=OSTN15_NTv2_OSGBtoETRS +units=m +no_defs +type=crs'
            }
        },
        //
        cgiPath: '/cgi-bin/giqtrans',
        // Bounds object (projected and geographic coordinates) for extent of GB.
        maxBounds: {
            projected: [[ 0.0, 0.0 ], [ 699999.9, 1299999.9 ]],
            geographic: [[ -8.74, 49.84 ], [ 1.96, 60.9 ]]
        }
    },

    /**
     * Test whether Proj4js has been installed in the browser application.
     */
    _isProj4: function() {
        return typeof proj4 !== 'undefined' ? proj4 : 'proj4 is not defined. Please ensure you have installed Proj4js in your browser application (see http://proj4js.org/).';
    },

    /**
     * Test whether geotiff.js has been installed in the browser application.
     */
    _isGeoTIFF: function() {
        return typeof GeoTIFF !== 'undefined' ? GeoTIFF : 'GeoTIFF is not defined. Please ensure you have installed geotiff.js in your browser application (see https://geotiffjs.github.io/geotiff.js/).';
    },

    /**
     * Test whether coordinates are within the permitted bounds.
     * @param {object} coordinates - The easting + northing or latlng to be validated.
     */
    _checkBounds: function(coordinates) {
        const isValid = true;
        if( coordinates.hasOwnProperty('ea') && coordinates.hasOwnProperty('no') ) {
            if( (coordinates.ea < this.options.maxBounds.projected[0][0] || coordinates.ea > this.options.maxBounds.projected[1][0])
                || (coordinates.no < this.options.maxBounds.projected[0][1] || coordinates.no > this.options.maxBounds.projected[1][1]) ) {
                isValid = false;
            }
        }
        else if( coordinates.hasOwnProperty('lat') && coordinates.hasOwnProperty('lng') ) {
            if( (coordinates.lng < this.options.maxBounds.geographic[0][0] || coordinates.lng > this.options.maxBounds.geographic[1][0])
                || (coordinates.lat < this.options.maxBounds.geographic[0][1] || coordinates.lat > this.options.maxBounds.geographic[1][1]) ) {
                isValid = false;
            }
        }

        const message = isValid ? '' : 'Coordinates out of range.';

        return { valid: isValid, message: message };
    },

    /**
     * Test whether a standard grid reference with a valid format has been provided.
     * param {string} gridref - The grid reference to be validated.
     */
    _validateGridRef: function(gridref) {
        const regex = /^[THJONS][VWXYZQRSTULMNOPFGHJKABCDE] ?[0-9]{1,5} ?[0-9]{1,5}$/;
        const match = Array.isArray(gridref.toUpperCase().match(regex)) ? true : false;

        const isValid = (gridref.replace(/ /g, '').length % 2 === 0) && match ? true: false;
        const message = isValid ? '' : 'Invalid grid reference.';

        return { valid: isValid, message: message };
    },

    /**
    * Return transformed point geometry in GeoJSON format via Common Gateway Interface (CGI)
    * request to GIQTrans.
    * @param {integer} source - The source spatial reference identifier (SRID) number.
    * @param {integer} target - The target spatial reference identifier (SRID) number.
    * @param {array} coordinates - The input coordinates in XY order.
    */
    _makeRequest: async function(source, target, coordinates) {
        const response = await fetch(this.options.cgiPath, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `SourceSRID=${source}&TargetSRID=${target}&Geometry={"type":"Point","coordinates":[${coordinates}]}`
        });
        const data = await response.json();

        return data.coordinates;
    },

    /**
     * Return latlng from an input easting + northing.
     * @param {object} coordinates - The easting + northing to be transformed.
     * @param {integer} decimals - [optional] The specified number of decimal places.
     */
    toLatLng: function(coordinates, decimals = 7) {
        const test = this._checkBounds(coordinates)
        if(! test.valid ) {
           console.log(test.message);
           return {};
        }

        if( this.options.type === 'ostn15-cgi' ) {
           return this._makeRequest(27700, 4937, [ coordinates.ea, coordinates.no ]).then(data => ({
                lat: Number(data[1].toFixed(decimals)),
                lng: Number(data[0].toFixed(decimals))
            }));
        }
        else {
            const point = proj4('EPSG:27700', 'EPSG:4326', [ coordinates.ea, coordinates.no ]);
            return {
                lat: Number(point[1].toFixed(decimals)),
                lng: Number(point[0].toFixed(decimals))
            };
        }
    },

    /**
     * Return easting + northing from an input latlng.
     * @param {object} coordinates - The latlng to be transformed.
     * @param {integer} decimals - [optional] The specified number of decimal places.
     */
    fromLatLng: function(coordinates, decimals = 2) {
        const test = this._checkBounds(coordinates)
        if(! test.valid ) {
           console.log(test.message);
           return {};
        }

        if( this.options.type === 'ostn15-cgi' ) {
            return this._makeRequest(4937, 27700, [ coordinates.lng, coordinates.lat ]).then(data => ({
                ea: Number(data[0].toFixed(decimals)),
                no: Number(data[1].toFixed(decimals))
            }));
        }
        else {
            const point = proj4('EPSG:4326', 'EPSG:27700', [ coordinates.lng, coordinates.lat ]);
            return {
                ea: Number(point[0].toFixed(decimals)),
                no: Number(point[1].toFixed(decimals))
            };
        }
    },

    /**
     * Return grid reference [plain | encoded | components] from an input easting + northing.
     * @param {object} coordinates - The easting + northing to be converted.
     */
    toGridRef: function(coordinates) {
        const test = this._checkBounds(coordinates)
        if(! test.valid ) {
           console.log(test.message);
           return {};
        }

        const prefixes = [
            [ 'SV', 'SW', 'SX', 'SY', 'SZ', 'TV', 'TW' ],
            [ 'SQ', 'SR', 'SS', 'ST', 'SU', 'TQ', 'TR' ],
            [ 'SL', 'SM', 'SN', 'SO', 'SP', 'TL', 'TM' ],
            [ 'SF', 'SG', 'SH', 'SJ', 'SK', 'TF', 'TG' ],
            [ 'SA', 'SB', 'SC', 'SD', 'SE', 'TA', 'TB' ],
            [ 'NV', 'NW', 'NX', 'NY', 'NZ', 'OV', 'OW' ],
            [ 'NQ', 'NR', 'NS', 'NT', 'NU', 'OQ', 'OR' ],
            [ 'NL', 'NM', 'NN', 'NO', 'NP', 'OL', 'OM' ],
            [ 'NF', 'NG', 'NH', 'NJ', 'NK', 'OF', 'OG' ],
            [ 'NA', 'NB', 'NC', 'ND', 'NE', 'OA', 'OB' ],
            [ 'HV', 'HW', 'HX', 'HY', 'HZ', 'JV', 'JW' ],
            [ 'HQ', 'HR', 'HS', 'HT', 'HU', 'JQ', 'JR' ],
            [ 'HL', 'HM', 'HN', 'HO', 'HP', 'JL', 'JM' ]
        ];

        const x = Math.floor(coordinates.ea / 100000);
        const y = Math.floor(coordinates.no / 100000);

        const prefix = prefixes[y][x];

        let e = Math.floor(coordinates.ea % 100000);
        let n = Math.floor(coordinates.no % 100000);

        e = String(e).padStart(5, '0');
        n = String(n).padStart(5, '0');

        const text = `${prefix} ${e} ${n}`;
        const html = `${prefix}&thinsp;${e}&thinsp;${n}`;

        return { text: text, html: html, letters: prefix, eastings: e, northings: n };
    },

    /**
     * Return easting + northing from an input grid reference.
     * @param {string} gridref - The grid reference to be converted.
     */
    fromGridRef: function(gridref) {
        gridref = String(gridref).trim();

        const test = this._validateGridRef(gridref)
        if(! test.valid ) {
           console.log(test.message);
           return {};
        }

        const gridLetters = 'VWXYZQRSTULMNOPFGHJKABCDE';

        const ref = gridref.toUpperCase().replace(/ /g, '');

        const majorEasting = gridLetters.indexOf(ref[0]) % 5  * 500000 - 1000000;
        const majorNorthing = Math.floor(gridLetters.indexOf(ref[0]) / 5) * 500000 - 500000;

        const minorEasting = gridLetters.indexOf(ref[1]) % 5  * 100000;
        const minorNorthing = Math.floor(gridLetters.indexOf(ref[1]) / 5) * 100000;

        const i = (ref.length-2) / 2;
        const m = Math.pow(10, 5-i);

        const e = majorEasting + minorEasting + (ref.substring(2, i+2) * m);
        const n = majorNorthing + minorNorthing + (ref.substring(i+2) * m);

        return { ea: e, no: n };
    }
};
