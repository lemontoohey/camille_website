'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { useUiStore } from '@/store/useUiStore';

const MagneticShearMaterial = shaderMaterial(
  {
    uScroll: 0,
    uVelocity: 0,
    uResolution: new THREE.Vector2(),
    uColorBase: new THREE.Color('#0a0010'),
    uColorMagenta: new THREE.Color('#8a0060'),
    uColorPG7: new THREE.Color('#004a50'),
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  // Fragment Shader
  `
    precision mediump float;
    uniform float uScroll;
    uniform float uVelocity;
    uniform vec2 uResolution;
    uniform vec3 uColorBase;
    uniform vec3 uColorMagenta;
    uniform vec3 uColorPG7;
    varying vec2 vUv;

    float drawBand(float uvX, float xPos, float width, float blur) {
      float dist = abs(uvX - xPos);
      return smoothstep(width + blur, width, dist);
    }

    void main() {
      vec2 uv = vUv;
      float scrollOffset = uScroll * 0.0008;
      vec3 finalColor = uColorBase;

      // 1. Green Band: The prominent, stable leader. Its position is based only on scroll.
      float posG = fract(0.5 + scrollOffset * 0.6);
      float bandG = drawBand(uv.x, posG, 0.035, 0.25);

      // 2. Magenta Band: The reactive follower. Torn away by velocity, fuses when velocity is 0.
      float velocityOffset = uVelocity * 0.0035; // How much velocity affects the split
      float posM = posG + velocityOffset;
      float bandM = drawBand(uv.x, posM, 0.01, 0.15);

      float opacity = 0.65;
      finalColor += uColorPG7 * bandG * opacity;
      finalColor += uColorMagenta * bandM * opacity;

      float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
      finalColor += grain * 0.015;
      finalColor = min(finalColor, vec3(1.0));
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

extend({ MagneticShearMaterial });

const ShaderPlane = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const isCanvasPaused = useUiStore((state) => state.isCanvasPaused);
  const scrollVelocity = useUiStore((state) => state.scrollVelocity);
  const velocityTracker = useRef({ value: 0 });

  useFrame((state) => {
    if (isCanvasPaused) return;

    // Spring physics: lerp tracker towards real-time velocity. Lower factor = springier return.
    const lerpFactor = 0.05;
    velocityTracker.current.value += (scrollVelocity - velocityTracker.current.value) * lerpFactor;

    if (materialRef.current) {
      materialRef.current.uniforms.uScroll.value = window.scrollY;
      materialRef.current.uniforms.uVelocity.value = velocityTracker.current.value;
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
      <magneticShearMaterial ref={materialRef} depthWrite={false} />
    </mesh>
  );
};

export const CanvasBackground = () => {
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
