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
    uColorBase: new THREE.Color('#05000c'),
    uColorPG7: new THREE.Color('#004a50'),
    uColorDust: new THREE.Color('#2d0040'),
    uColorMagenta: new THREE.Color('#e40078'),
    uColorPaper: new THREE.Color('#2a0044'),
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
    uniform vec3 uColorPG7;
    uniform vec3 uColorDust;
    uniform vec3 uColorMagenta;
    uniform vec3 uColorPaper;
    varying vec2 vUv;

    float drawBand(float uvX, float xPos, float width, float blur) {
      float dist = abs(uvX - xPos);
      return smoothstep(width + blur, width, dist);
    }

    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    void main() {
      vec2 uv = vUv;
      float scrollOffset = uScroll * 0.0008;

      // 1. PAPER TOOTH
      vec2 toothUV = uv * (uResolution.x / uResolution.y) * 450.0;
      float grainBase = random(toothUV);
      float organicTooth = noise(uv * 200.0);
      float toothPattern = mix(grainBase, organicTooth, 0.5);
      toothPattern = smoothstep(0.35, 0.65, toothPattern);
      vec3 finalColor = mix(uColorBase, uColorPaper, toothPattern * 0.75);

      // 2. CHROMATIC GREY BAND (Felt, Not Seen)
      float posB = fract(0.5 + scrollOffset * 0.6);
      float band = drawBand(uv.x, posB, 0.02, 0.1); 
      
      // True Chromatic Grey: Mixing complementary PG7 and Magenta, then muting with paper tone
      vec3 rawChromatic = mix(uColorPG7, uColorMagenta, 0.48); 
      vec3 chromaticGrey = mix(rawChromatic, uColorPaper, 0.35); 

      // Deep Friction Light: Extremely subtle. Peaks at a very low opacity.
      // Smooth falloff from the center to edges so it feels volumetric.
      float barCenterMask = smoothstep(0.0, 0.4, uv.y) * smoothstep(1.0, 0.6, uv.y);
      float scrollLight = smoothstep(0.1, 8.0, abs(uVelocity)) * barCenterMask * 0.18;

      // Base opacity is nearly invisible (0.02), max light only raises it slightly. Creates weight.
      float bandOpacity = 0.02 + scrollLight; 
      finalColor += chromaticGrey * band * bandOpacity;

      // 3. PARTICLES
      vec2 particleUV = uv * vec2(uResolution.x / uResolution.y, 1.0) * 2.0;

      float slowTime = uTime * 0.03;
      float noiseDiox = random(particleUV + slowTime);
      float dustDiox = pow(noiseDiox, 65.0);
      finalColor += uColorDust * dustDiox * 1.0;

      float fastTime = uTime * 0.08;
      vec2 magParticleUV = uv * vec2(uResolution.x / uResolution.y, 1.0) * 2.5; 
      float noiseMag = random(magParticleUV - fastTime);
      float dustMag = pow(noiseMag, 45.0); 
      finalColor += uColorMagenta * dustMag * 2.5;

      // Screen Grain
      float screenGrain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
      finalColor += screenGrain * 0.015;

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

    velocityTracker.current.value += (scrollVelocity - velocityTracker.current.value) * 0.08;

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
});

CanvasBackground.displayName = 'CanvasBackground';
