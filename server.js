// server.js - Modern Bun server for OS Transform API
import { OSTransform } from './transform.js';

const transformer = new OSTransform();

// Configure options based on environment
const PORT = process.env.PORT || 3000;

/**
 * Helper function to parse request body or query parameters
 */
async function getRequestData(req) {
    const url = new URL(req.url);

    // Try to get data from query parameters first (for GET requests)
    if (url.searchParams.size > 0) {
        const data = {};
        for (const [key, value] of url.searchParams.entries()) {
            // Try to parse numbers
            data[key] = isNaN(value) ? value : Number(value);
        }
        return data;
    }

    // Try to get data from request body (for POST requests)
    if (req.method === 'POST') {
        try {
            return await req.json();
        } catch {
            return {};
        }
    }

    return {};
}

/**
 * Create JSON response with CORS headers
 */
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}

/**
 * Main server handler
 */
Bun.serve({
    port: PORT,

    async fetch(req) {
        const url = new URL(req.url);
        const path = url.pathname;

        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }

        // API Routes
        if (path === '/api/to-latlng') {
            try {
                const data = await getRequestData(req);
                const { ea, no, decimals } = data;

                if (ea === undefined || no === undefined) {
                    return jsonResponse({
                        error: 'Missing required parameters: ea (easting) and no (northing)'
                    }, 400);
                }

                const result = transformer.toLatLng(
                    { ea: Number(ea), no: Number(no) },
                    decimals !== undefined ? Number(decimals) : undefined
                );

                if (Object.keys(result).length === 0) {
                    return jsonResponse({ error: 'Invalid coordinates or out of bounds' }, 400);
                }

                return jsonResponse(result);
            } catch (error) {
                return jsonResponse({ error: error.message }, 500);
            }
        }

        if (path === '/api/from-latlng') {
            try {
                const data = await getRequestData(req);
                const { lat, lng, decimals } = data;

                if (lat === undefined || lng === undefined) {
                    return jsonResponse({
                        error: 'Missing required parameters: lat (latitude) and lng (longitude)'
                    }, 400);
                }

                const result = transformer.fromLatLng(
                    { lat: Number(lat), lng: Number(lng) },
                    decimals !== undefined ? Number(decimals) : undefined
                );

                if (Object.keys(result).length === 0) {
                    return jsonResponse({ error: 'Invalid coordinates or out of bounds' }, 400);
                }

                return jsonResponse(result);
            } catch (error) {
                return jsonResponse({ error: error.message }, 500);
            }
        }

        if (path === '/api/to-gridref') {
            try {
                const data = await getRequestData(req);
                const { ea, no } = data;

                if (ea === undefined || no === undefined) {
                    return jsonResponse({
                        error: 'Missing required parameters: ea (easting) and no (northing)'
                    }, 400);
                }

                const result = transformer.toGridRef({ ea: Number(ea), no: Number(no) });

                if (Object.keys(result).length === 0) {
                    return jsonResponse({ error: 'Invalid coordinates or out of bounds' }, 400);
                }

                return jsonResponse(result);
            } catch (error) {
                return jsonResponse({ error: error.message }, 500);
            }
        }

        if (path === '/api/from-gridref') {
            try {
                const data = await getRequestData(req);
                const { gridref } = data;

                if (!gridref) {
                    return jsonResponse({
                        error: 'Missing required parameter: gridref (grid reference)'
                    }, 400);
                }

                const result = transformer.fromGridRef(gridref);

                if (Object.keys(result).length === 0) {
                    return jsonResponse({ error: 'Invalid grid reference' }, 400);
                }

                return jsonResponse(result);
            } catch (error) {
                return jsonResponse({ error: error.message }, 500);
            }
        }

        if (path === '/api/gridref-to-latlng') {
            try {
                const data = await getRequestData(req);
                const { gridref, decimals } = data;

                if (!gridref) {
                    return jsonResponse({
                        error: 'Missing required parameter: gridref (grid reference)'
                    }, 400);
                }

                const result = transformer.gridRefToLatLng(
                    gridref,
                    decimals !== undefined ? Number(decimals) : undefined
                );

                if (Object.keys(result).length === 0) {
                    return jsonResponse({ error: 'Invalid grid reference or out of bounds' }, 400);
                }

                return jsonResponse(result);
            } catch (error) {
                return jsonResponse({ error: error.message }, 500);
            }
        }

        // Health check endpoint
        if (path === '/health' || path === '/') {
            return jsonResponse({
                status: 'ok',
                service: 'OS Transform API',
                version: '0.5.0',
                endpoints: {
                    'POST/GET /api/to-latlng': 'Convert easting + northing to lat/lng (params: ea, no, decimals?)',
                    'POST/GET /api/from-latlng': 'Convert lat/lng to easting + northing (params: lat, lng, decimals?)',
                    'POST/GET /api/to-gridref': 'Convert easting + northing to grid reference (params: ea, no)',
                    'POST/GET /api/from-gridref': 'Convert grid reference to easting + northing (params: gridref)',
                    'POST/GET /api/gridref-to-latlng': 'Convert grid reference directly to lat/lng (params: gridref, decimals?)'
                }
            });
        }

        // 404 for unknown routes
        return jsonResponse({ error: 'Not found' }, 404);
    },

    error(error) {
        return jsonResponse({ error: 'Internal server error', details: error.message }, 500);
    }
});

console.log(`🚀 OS Transform API running on port ${PORT}`);
console.log(`📍 Health check path: /health`);
console.log(`📖 API Documentation path: /`);
