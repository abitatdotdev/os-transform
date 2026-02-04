// example-client.js - Example usage of OS Transform API

const API_BASE = 'http://localhost:3000';

/**
 * Example 1: Convert Easting/Northing to Grid Reference
 */
async function example1() {
    console.log('\n=== Example 1: Convert to Grid Reference ===');

    const response = await fetch(`${API_BASE}/api/to-gridref?ea=337297&no=503695`);
    const data = await response.json();

    console.log('Input: ea=337297, no=503695');
    console.log('Output:', data);
    // Output: { text: 'NY 37297 03695', html: 'NY&thinsp;37297&thinsp;03695', ... }
}

/**
 * Example 2: Convert Grid Reference to Easting/Northing
 */
async function example2() {
    console.log('\n=== Example 2: Convert from Grid Reference ===');

    const response = await fetch(`${API_BASE}/api/from-gridref?gridref=NY%2037297%2003695`);
    const data = await response.json();

    console.log('Input: gridref="NY 37297 03695"');
    console.log('Output:', data);
    // Output: { ea: 337297, no: 503695 }
}

/**
 * Example 3: POST request to convert coordinates
 */
async function example3() {
    console.log('\n=== Example 3: POST Request ===');

    const response = await fetch(`${API_BASE}/api/to-gridref`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ea: 651409,
            no: 313177
        })
    });
    const data = await response.json();

    console.log('Input: { ea: 651409, no: 313177 }');
    console.log('Output:', data);
    // Output: { text: 'TG 51409 13177', ... }
}

/**
 * Example 4: Convert to Lat/Lng using proj4
 */
async function example4() {
    console.log('\n=== Example 4: Convert to Lat/Lng ===');

    const response = await fetch(`${API_BASE}/api/to-latlng?ea=337297&no=503695`);
    const data = await response.json();

    console.log('Input: ea=337297, no=503695');
    console.log('Output:', data);
    // Output: { lat: 54.4248023, lng: -2.9679342 }
}

/**
 * Example 5: Convert from Lat/Lng using proj4
 */
async function example5() {
    console.log('\n=== Example 5: Convert from Lat/Lng ===');

    const response = await fetch(`${API_BASE}/api/from-latlng?lat=54.42480998&lng=-2.96793742`);
    const data = await response.json();

    console.log('Input: lat=54.42480998, lng=-2.96793742');
    console.log('Output:', data);
    // Output: { ea: 337296.8, no: 503695.86 }
}

/**
 * Example 6: Convert Grid Reference to Lat/Lng directly
 */
async function example6() {
    console.log('\n=== Example 6: Grid Reference to Lat/Lng (Direct) ===');

    const response = await fetch(`${API_BASE}/api/gridref-to-latlng?gridref=TG%2051409%2013177`);
    const data = await response.json();

    console.log('Input: gridref="TG 51409 13177"');
    console.log('Output:', data);
    // Output: { lat: 52.65798, lng: 1.71604 }
}

/**
 * Example 7: Using the OSTransform class directly (without server)
 */
async function example7() {
    console.log('\n=== Example 7: Direct Module Usage ===');

    // Import the class directly
    const { OSTransform } = await import('./transform.js');
    const transformer = new OSTransform();

    // Convert to grid reference
    const gridRef = transformer.toGridRef({ ea: 337297, no: 503695 });
    console.log('Grid Reference:', gridRef.text);

    // Convert from grid reference
    const coords = transformer.fromGridRef('NY 37297 03695');
    console.log('Coordinates:', coords);

    // Convert grid reference directly to lat/lng
    const latLng = transformer.gridRefToLatLng('NY 37297 03695');
    console.log('Grid Ref to Lat/Lng:', latLng);
}

// Run all examples
async function runExamples() {
    console.log('OS Transform API - Example Usage');
    console.log('=================================');

    await example1();
    await example2();
    await example3();
    await example4();
    await example5();
    await example6();
    await example7();

    console.log('\n✓ All examples completed!');
}

// Run examples
runExamples().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
});
