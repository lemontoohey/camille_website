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
  // Fragment Shader (Corrected Magnetic Shear Logic)
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

      // 1. Green Band: Prominent and stable leader.
      float posG = fract(0.5 + scrollOffset * 0.6);
      // CORRECTED: Much wider base width
      float bandG = drawBand(uv.x, posG, 0.05, 0.25); 

      // 2. Magenta Band: Ephemeral follower.
      // CORRECTED: Added a 'dead zone' clamp. If abs(uVelocity) is less than 0.1, it's treated as 0.
      float clampedVelocity = smoothstep(0.1, 8.0, abs(uVelocity)) * uVelocity;
      float velocityOffset = clampedVelocity * 0.004;
      float posM = posG + velocityOffset;
      // CORRECTED: Much thinner width for a subtle effect
      float bandM = drawBand(uv.x, posM, 0.005, 0.1); 

      float opacity = 0.65;
      finalColor += uColorPG7 * bandG * opacity;
      finalColor += uColorMagenta * bandM * opacity;

      // Grain & Final Output
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

    // The "spring" that smoothly animates the return to zero
    velocityTracker.current.value += (scrollVelocity - velocityTracker.current.value) * 0.05;

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
