import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

/**
 * Port of collidingScopes/liquid-logo GLSL shader.
 * Detects logo edges, applies flowing noise vector fields, and paints
 * liquid metal in Hawa palette (petrol, baby-pink, tangerine, cool-blue).
 */

const LiquidLogoMaterial = shaderMaterial(
  {
    uTime: 0,
    uTexture: null,
    uSpeed: 0.8,
    uEdgeThreshold: 0.1,
    uNoiseScale: 3.5,
    uColorPetrol: new THREE.Color('#1E5560'),
    uColorBabyPink: new THREE.Color('#F5C6D2'),
    uColorTangerine: new THREE.Color('#FF8A3D'),
    uColorCoolBlue: new THREE.Color('#5B8EF2'),
    uResolution: new THREE.Vector2(1, 1),
    uIsHeader: 0.0,
  },
  // Vertex Shader
  /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  /* glsl */ `
    precision highp float;

    uniform float uTime;
    uniform sampler2D uTexture;
    uniform float uSpeed;
    uniform float uNoiseScale;
    uniform vec3 uColorPetrol;
    uniform vec3 uColorBabyPink;
    uniform vec3 uColorTangerine;
    uniform vec3 uColorCoolBlue;
    uniform vec2 uResolution;
    uniform float uIsHeader;

    varying vec2 vUv;

    // Simplex 2D noise
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
               -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
        dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      m = m*m ;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      vec2 uv = vUv;
      float t = uTime * uSpeed;

      // Sample logo mask
      vec4 baseSample = texture2D(uTexture, uv);
      float mask = baseSample.a * baseSample.r;

      // Edge detection gradient
      vec2 pixel = vec2(1.0 / 512.0, 1.0 / 256.0);
      float top = texture2D(uTexture, uv + vec2(0.0, pixel.y)).a;
      float bottom = texture2D(uTexture, uv - vec2(0.0, pixel.y)).a;
      float left = texture2D(uTexture, uv - vec2(pixel.x, 0.0)).a;
      float right = texture2D(uTexture, uv + vec2(pixel.x, 0.0)).a;

      vec2 normal = normalize(vec2(left - right, bottom - top) + 0.0001);
      float edge = length(vec2(left - right, bottom - top));

      // Flowing vector field around edges
      float n1 = snoise(uv * uNoiseScale + vec2(t * 0.4, t * 0.3));
      float n2 = snoise(uv * (uNoiseScale * 1.5) - vec2(t * 0.3, t * 0.5));
      vec2 flow = vec2(n1, n2) * 0.12;

      // Distorted UV for liquid metal reflection
      vec2 distortedUv = uv + flow + normal * 0.08 * edge;

      // Palette blending
      float sheen = sin(distortedUv.x * 6.0 + distortedUv.y * 4.0 + t * 2.0) * 0.5 + 0.5;
      float tintMix = cos(distortedUv.y * 5.0 - t * 1.2) * 0.5 + 0.5;

      // Petrol -> Cool Blue -> Tangerine -> Baby Pink
      vec3 metalColor = mix(uColorPetrol, uColorCoolBlue, sheen);
      metalColor = mix(metalColor, uColorTangerine, pow(sheen, 2.5) * 0.6);
      metalColor = mix(metalColor, uColorBabyPink, tintMix * 0.4);

      // Specular highlight on contours
      float highlight = pow(max(0.0, dot(normal, normalize(vec2(1.0, 1.0)))), 4.0);
      metalColor += vec3(highlight * 0.45);

      // If outside the logo letters, stay transparent or soft air aura
      if (mask < 0.08 && edge < 0.05) {
        discard;
      }

      float alpha = smoothstep(0.02, 0.25, mask + edge * 0.8);
      gl_FragColor = vec4(metalColor, alpha);
    }
  `
);

extend({ LiquidLogoMaterial });

export { LiquidLogoMaterial };
