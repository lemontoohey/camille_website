'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { useUiStore } from '@/store/useUiStore';

const ArchivalCanvasMaterial = shaderMaterial(
  {
    uTime: 0,
    uScroll: 0,
    uVelocity: 0,
    uResolution: new THREE.Vector2(),
    uColorBase: new THREE.Color('#06000c'),
    uColorPaper: new THREE.Color('#0c0614'),
    uColorPG7: new THREE.Color('#003038'),
    uColorMagenta: new THREE.Color('#6b0038'),
    uColorGlow: new THREE.Color('#7c3aed'),
    uColorViolet: new THREE.Color('#5c3d70'), // Light violet for particles
  },
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  `
    precision mediump float;
    uniform float uTime;
    uniform float uScroll;
    uniform float uVelocity;
    uniform vec2 uResolution;
    uniform vec3 uColorBase;
    uniform vec3 uColorPaper;
    uniform vec3 uColorPG7;
    uniform vec3 uColorMagenta;
    uniform vec3 uColorGlow;
    uniform vec3 uColorViolet;
    varying vec2 vUv;

    float drawBand(float uvX, float xPos, float width, float blur) {
      float dist = abs(uvX - xPos);
      return smoothstep(width + blur, width, dist);
    }

    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
      vec2 uv = vUv;
      float scrollOffset = uScroll * 0.0008;

      // 1. ULTRA-SUBTLE PAPER TOOTH
      vec2 toothUV = uv * (uResolution.x / uResolution.y) * 600.0;
      float grainBase = random(toothUV);
      float toothPattern = smoothstep(0.45, 0.55, grainBase);
      vec3 finalColor = mix(uColorBase, uColorPaper, toothPattern * 0.15);

      // 2. CHROMATIC GREY BAND & PALE BLUE FRICTION LIGHT
      float posB = fract(0.5 + scrollOffset * 0.6);
      float band = drawBand(uv.x, posB, 0.015, 0.15); 
      
      vec3 chromaticGrey = mix(uColorPG7, uColorMagenta, 0.5); 

      float barCenterMask = smoothstep(0.0, 0.3, uv.y) * smoothstep(1.0, 0.7, uv.y);
      float scrollLight = smoothstep(0.1, 6.0, abs(uVelocity)) * barCenterMask;

      vec3 bandColor = mix(chromaticGrey, uColorGlow, scrollLight * 0.6);
      
      float bandOpacity = 0.04 + (scrollLight * 0.12); 
      finalColor += bandColor * band * bandOpacity;

      // 3. BARELY-THERE PARTICLES (Light violet, not Benzi)
      vec2 particleUV = uv * vec2(uResolution.x / uResolution.y, 1.0) * 2.0;
      float noiseV = random(particleUV - (uTime * 0.04));
      float dustV = pow(noiseV, 90.0);
      finalColor += uColorViolet * dustV * 0.15; 

      float screenGrain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
      finalColor += screenGrain * 0.008;

      finalColor = min(finalColor, vec3(1.0));
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

extend({ ArchivalCanvasMaterial });

const ShaderPlane = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const isCanvasPaused = useUiStore((state) => state.isCanvasPaused);
  const scrollVelocity = useUiStore((state) => state.scrollVelocity);
  const velocityTracker = useRef({ value: 0 });

  useFrame((state) => {
    if (isCanvasPaused) return;
    velocityTracker.current.value += (scrollVelocity - velocityTracker.current.value) * 0.05;

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      materialRef.current.uniforms.uScroll.value = window.scrollY;
      materialRef.current.uniforms.uVelocity.value = velocityTracker.current.value;
      materialRef.current.uniforms.uResolution.value.set(state.size.width, state.size.height);
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      {/* @ts-ignore */}
      <archivalCanvasMaterial ref={materialRef} depthWrite={false} />
    </mesh>
  );
};

export const CanvasBackground = React.memo(() => {
  return (
    <div className="fixed inset-0 pointer-events-none bg-void" style={{ zIndex: 0 }}>
      <Canvas dpr={1} orthographic camera={{ position: [0, 0, 1], zoom: 1 }} gl={{ antialias: false, powerPreference: 'default' }}>
        <ShaderPlane />
      </Canvas>
    </div>
  );
});
CanvasBackground.displayName = 'CanvasBackground';
