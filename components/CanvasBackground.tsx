'use client';

import React, { useRef, useEffect } from 'react';
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
    uMouse: new THREE.Vector2(0.5, 0.5),
    uResolution: new THREE.Vector2(),
    uColorBase: new THREE.Color('#05000c'),
    uColorPG7: new THREE.Color('#004a50'),
    uColorDust: new THREE.Color('#2d0040'),
    uColorMagenta: new THREE.Color('#e40078'),
    uColorBenzi: new THREE.Color('#962814'),
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
    uniform vec2 uMouse;
    uniform vec2 uResolution;
    uniform vec3 uColorBase;
    uniform vec3 uColorPG7;
    uniform vec3 uColorDust;
    uniform vec3 uColorMagenta;
    uniform vec3 uColorBenzi;
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

      // 1. PAPER TOOTH / RAW CANVAS (restored to subtle)
      vec2 toothUV = uv * (uResolution.x / uResolution.y) * 450.0;
      float grainBase = random(toothUV);
      float organicTooth = noise(uv * 200.0);
      float toothPattern = mix(grainBase, organicTooth, 0.5);
      toothPattern = smoothstep(0.35, 0.65, toothPattern);
      vec3 finalColor = mix(uColorBase, uColorPaper, toothPattern * 0.45);

      // 2. CHROMATIC GREY BAND (Interactive: cursor + scroll illumination)
      float posB = fract(0.5 + scrollOffset * 0.6);
      float band = drawBand(uv.x, posB, 0.02, 0.1); 
      vec3 chromaticGrey = mix(uColorPG7, uColorMagenta, 0.4);

      vec2 aspectUv = uv * vec2(uResolution.x / uResolution.y, 1.0);
      vec2 aspectMouse = uMouse * vec2(uResolution.x / uResolution.y, 1.0);
      float mouseDist = distance(aspectUv, aspectMouse);
      float mouseLight = smoothstep(0.35, 0.0, mouseDist) * 1.5;

      float barCenterMask = smoothstep(0.0, 0.15, uv.y) * smoothstep(1.0, 0.85, uv.y);
      float scrollLight = smoothstep(0.1, 5.0, abs(uVelocity)) * barCenterMask * 1.2;

      float activeLight = max(mouseLight, scrollLight);
      float bandOpacity = 0.05 + (activeLight * 0.8);
      finalColor += chromaticGrey * band * bandOpacity;

      // 3. PARTICLES (restored: light violet on top, Benzi brown instead of magenta)
      vec2 particleUV = uv * vec2(uResolution.x / uResolution.y, 1.0) * 2.0;

      float slowTime = uTime * 0.03;
      float noiseDiox = random(particleUV + slowTime);
      float dustDiox = pow(noiseDiox, 65.0);
      finalColor += uColorDust * dustDiox * 0.8;

      float fastTime = uTime * 0.08;
      vec2 benziParticleUV = uv * vec2(uResolution.x / uResolution.y, 1.0) * 2.5; 
      float noiseBenzi = random(benziParticleUV - fastTime);
      float dustBenzi = pow(noiseBenzi, 75.0); 
      finalColor += uColorBenzi * dustBenzi * 0.9;

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
  const mouseTracker = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseTracker.current.x = e.clientX / window.innerWidth;
      mouseTracker.current.y = 1.0 - e.clientY / window.innerHeight;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state) => {
    if (isCanvasPaused) return;

    velocityTracker.current.value += (scrollVelocity - velocityTracker.current.value) * 0.08;

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      materialRef.current.uniforms.uScroll.value = window.scrollY;
      materialRef.current.uniforms.uVelocity.value = velocityTracker.current.value;
      materialRef.current.uniforms.uMouse.value.set(mouseTracker.current.x, mouseTracker.current.y);
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

const CanvasBackgroundComponent = () => {
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

export const CanvasBackground = React.memo(CanvasBackgroundComponent);
CanvasBackground.displayName = 'CanvasBackground';
