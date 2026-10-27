import { expect, test } from 'bun:test';
import { OSTransform } from './transform.js';

const transformer = new OSTransform();

test('converts WGS84 coordinates to a full grid reference', () => {
    expect(transformer.latLngToGridRef({ lat: 54.424815, lng: -2.96793 })).toEqual({
        text: 'NY 37297 03695',
        html: 'NY&thinsp;37297&thinsp;03695',
        letters: 'NY',
        eastings: '37297',
        northings: '03695'
    });
});

test('truncates grid references without rounding intermediate coordinates up', () => {
    const coordinates = transformer.toLatLng({ ea: 337297.999, no: 503695.999 }, 12);
    expect(transformer.latLngToGridRef(coordinates).text).toBe('NY 37297 03695');
});

test('rejects coordinates outside Great Britain', () => {
    expect(transformer.latLngToGridRef({ lat: 0, lng: 0 })).toEqual({});
});

test('rejects non-finite coordinates', () => {
    expect(transformer.latLngToGridRef({ lat: NaN, lng: -2.96793 })).toEqual({});
    expect(transformer.latLngToGridRef({ lat: 54.424815, lng: Infinity })).toEqual({});
});
