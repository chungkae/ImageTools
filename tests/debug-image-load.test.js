import { describe, it, expect } from 'vitest';
import { createPNGBuffer, createPNGFile, bufferToDataURL } from './helpers/imageBuffers.js';
import { loadImage } from '../src/utils/canvasHelpers.js';

describe('Debug Image Loading', () => {
  it('should create valid PNG buffer', () => {
    const buffer = createPNGBuffer(10, 10, 'red');
    console.log('Buffer created:', buffer.length, 'bytes');
    console.log('Buffer type:', buffer.constructor.name);
    console.log('First 8 bytes:', Array.from(buffer.slice(0, 8)));
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should create valid PNG File', () => {
    const file = createPNGFile('test.png', 10, 10, 'red');
    console.log('File created:', file.name, file.size, 'bytes', file.type);
    console.log('File constructor:', file.constructor.name);
    console.log('Has arrayBuffer method:', typeof file.arrayBuffer);
    expect(file).toBeDefined();
    expect(file.size).toBeGreaterThan(0);
  });

  it('should load image from Buffer', async () => {
    const buffer = createPNGBuffer(10, 10, 'red');
    const dataURL = bufferToDataURL(buffer, 'image/png');
    console.log('DataURL length:', dataURL.length);
    console.log('DataURL prefix:', dataURL.substring(0, 50));
    
    const img = await loadImage(dataURL);
    console.log('Image loaded:', img.width, 'x', img.height);
    expect(img.width).toBe(10);
    expect(img.height).toBe(10);
  });

  it('should load image from File', async () => {
    const file = createPNGFile('test.png', 10, 10, 'blue');
    console.log('Loading file:', file.name, file.size, file.type);
    
    const img = await loadImage(file);
    console.log('Image loaded from file:', img.width, 'x', img.height);
    expect(img.width).toBe(10);
    expect(img.height).toBe(10);
  });
});
