'use client';

import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { useUiStore } from '@/store/useUiStore';

const ParallaxBandsMaterial = shaderMaterial(
  {
    uScroll: 0,
    uResolution: new THREE.Vector2(),
    uColorBase: new THREE.Color('#0a0010'),
    uColorMagenta: new THREE.Color('#8a0060'),
    uColorPG7: new THREE.Color('#004a50'),
    uColorViolet: new THREE.Color('#1a0a2e'),
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      // Safely lock to Z=0 to prevent camera clipping
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  // Fragment Shader
  `
    precision mediump float;

    uniform float uScroll;
    uniform vec2 uResolution;
    uniform vec3 uColorBase;
    uniform vec3 uColorMagenta;
    uniform vec3 uColorPG7;
    uniform vec3 uColorViolet;

    varying vec2 vUv;

    // Helper: Draw a soft vertical band
    float drawBand(float uvX, float xPos, float width, float blur) {
      float dist = abs(uvX - xPos);
      return smoothstep(width + blur, width, dist);
    }

    void main() {
      vec2 uv = vUv;
      
      // Time/Scroll variables
      float slowTime = uScroll * 0.0005;
      float driftTime = uScroll * 0.002;

      vec3 finalColor = uColorBase;

      // 1. DOMAIN WARPING (The Liquid Effect)
      // We distort the X coordinate based on the Y coordinate to create a swaying, underwater feel
      float sway = sin(uv.y * 3.0 - slowTime * 2.0) * 0.05;
      
      // 2. THE BASE PATH
      // The shared trajectory for both colors
      float basePath = fract(0.5 + sway + slowTime * 0.5);

      // 3. THE SPLIT (Fusing and Separating)
      // A slow oscillator that drives how far apart the colors drift.
      // When splitFactor is 0, they perfectly overlap into Chromatic Black.
      float splitFactor = sin(uv.y * 5.0 + driftTime) * 0.04;

      // Calculate individual positions by shifting away from the base path
      float posM = basePath + splitFactor; // Magenta drifts right/left
      float posG = basePath - splitFactor; // Green drifts the exact opposite way

      // 4. RENDER BANDS
      // Magenta: Very thin, sharp inner core, soft outer glow
      float bandM = drawBand(uv.x, posM, 0.01, 0.15);
      
      // Green: Slightly wider, envelops the magenta when fused
      float bandG = drawBand(uv.x, posG, 0.02, 0.25);

      // 5. COLOR MIXING (Additive Blending)
      float opacity = 0.55; 
      
      finalColor += uColorMagenta * bandM * opacity;
      finalColor += uColorPG7 * bandG * opacity;

      // 6. ATMOSPHERIC VIOLET (Background depth layer)
      // Moves much slower, provides environmental depth
      float posV = fract(0.8 + sway * 0.5 + slowTime * 0.2);
      float bandV = drawBand(uv.x, posV, 0.15, 0.4);
      finalColor += uColorViolet * bandV * opacity * 0.7;

      // 7. SUBTLE GRAIN
      float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
      finalColor += grain * 0.015;
      
      finalColor = min(finalColor, vec3(1.0));

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

extend({ ParallaxBandsMaterial });

const ShaderPlane = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const isCanvasPaused = useUiStore((state) => state.isCanvasPaused);

  useFrame((state) => {
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
      <planeGeometry args={[2, 2]} />
      {/* @ts-ignore */}
      <parallaxBandsMaterial ref={materialRef} depthWrite={false} />
    </mesh>
  );
};

export const CanvasBackground = () => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('[Camille] WebGL Shader Initialized');
    }
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none bg-void" style={{ zIndex: 0 }}>
      <Canvas
        dpr={1}
        orthographic
        camera={{ position: [0, 0, 1], zoom: 1 }}
        gl={{ antialias: false, powerPreference: 'default' }}
      >
        <ShaderPlane />
      </Canvas>
    </div>
  );
};
