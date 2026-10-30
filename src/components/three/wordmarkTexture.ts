import * as THREE from 'three';

/**
 * Creates a high-contrast canvas texture with thick, bold rounded "hawa" wordmark.
 * Edge-detection in the liquid shader relies on the alpha / luminance threshold.
 */
export function createHawaWordmarkTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Clear transparent
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background is transparent; text is crisp solid white
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw thick, bold rounded "hawa"
  ctx.font = '900 130px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('hawa', canvas.width / 2, canvas.height / 2 + 10);

  // Optional: subtle thick outline stroke to accentuate edges for shader Sobel filter
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 6;
  ctx.strokeText('hawa', canvas.width / 2, canvas.height / 2 + 10);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
