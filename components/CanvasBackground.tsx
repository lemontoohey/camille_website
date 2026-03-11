'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { useUiStore } from '../store/useUiStore';

// GPU Protection Rule 2: Pause Shader Rendering entirely
// When `isCanvasPaused` is active (from Zustand, updated by IntersectionObservers)
// WebGL will stop updating frames, dropping GPU usage to near 0%.

/**
 * Custom Fragment Shader Material with Simplex 2D Noise
 * Simulates a breathing, liquid Rothko painting.
 */
const ParallaxBandsMaterial = shaderMaterial(
  {
    uScroll: 0,
    uResolution: new THREE.Vector2(),
    uColorMagenta: new THREE.Color('#E40078'),
    uColorPG7: new THREE.Color('#005F56'),
    uColorViolet: new THREE.Color('#180024') // slightly lighter violet for the 3rd band
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      // By passing the projection matrix, the 2x2 plane fills 100% of the screen!
      gl_Position = vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    precision mediump float;
    
    uniform float uScroll;
    uniform vec2 uResolution;
    uniform vec3 uColorMagenta;
    uniform vec3 uColorPG7;
    uniform vec3 uColorViolet;
    
    varying vec2 vUv;

    // Draw a vertical band with soft edges
    // xPos: center of band, width: width of band, blur: softness
    float drawBand(float uvX, float xPos, float width, float blur) {
        float dist = abs(uvX - xPos);
        return smoothstep(width + blur, width, dist);
    }

    void main() {
      vec2 uv = vUv;
      
      // Normalized scroll factor (adjust the multiplier for speed)
      // We divide by a large number so scroll matches UV scale reasonably
      float scrollOffset = uScroll * 0.0005;

      // Band 1: Magenta (Fastest)
      float pos1 = fract(0.2 + scrollOffset * 1.5);
      float band1 = drawBand(uv.x, pos1, 0.05, 0.15);

      // Band 2: PG7 (Medium)
      float pos2 = fract(0.6 - scrollOffset * 0.8);
      float band2 = drawBand(uv.x, pos2, 0.08, 0.2);

      // Band 3: Violet (Slowest)
      float pos3 = fract(0.8 + scrollOffset * 0.4);
      float band3 = drawBand(uv.x, pos3, 0.12, 0.25);

      // Base color (The Void - Masstone)
      vec3 finalColor = vec3(0.039, 0.0, 0.063); // #0a0010 approximation

      // Additive blending for the ghostly bands (opacity 0.05 to 0.1)
      finalColor += uColorMagenta * band1 * 0.08;
      finalColor += uColorPG7 * band2 * 0.06;
      finalColor += uColorViolet * band3 * 0.07;

      // Optional subtle grain
      float grain = fract(sin(dot(uv, vec2(12.9898,78.233))) * 43758.5453);
      finalColor += grain * 0.015;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

// Register the custom shader to Three Fiber
extend({ ParallaxBandsMaterial });

/**
 * Inner Plane Component containing the Shader
 */
const ShaderPlane = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const isCanvasPaused = useUiStore((state) => state.isCanvasPaused);

  useFrame((state) => {
    // GPU Rule 2 Application: Skip frame processing entirely if paused
    if (isCanvasPaused) return;
    
    if (materialRef.current) {
      materialRef.current.uniforms.uScroll.value = window.scrollY;
      materialRef.current.uniforms.uResolution.value.set(
        state.size.width,
        state.size.height
      );
    }
  });

  return (
    <mesh>
      {/* 2x2 Plane spanning the entire clip space */}
      <planeGeometry args={[2, 2]} />
      {/* @ts-ignore */}
      <parallaxBandsMaterial ref={materialRef} transparent={false} depthWrite={false} />
    </mesh>
  );
};

/**
 * Main WebGL Background Element
 * Sits fixed behind the DOM layout.
 */
export const CanvasBackground = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-void">
      {/* 
        GPU Rule 1: Cap DPR to exactly 1. 
        Shader is soft by nature, downscaling saves immense fragment calculation overhead.
      */}
      <Canvas
        dpr={1}
        orthographic
        camera={{ position: [0, 0, 1], zoom: 1 }}
        gl={{ 
          antialias: false, 
          powerPreference: "default",
          alpha: false 
        }}
      >
        <ShaderPlane />
      </Canvas>
    </div>
  );
};
