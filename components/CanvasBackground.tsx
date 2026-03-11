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
const RothkoMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorBase: new THREE.Color('#180024'), // Deepest Dioxazine Violet
    uColorMagenta: new THREE.Color('#E40078'), // Quinacridone Magenta
    uColorPG7: new THREE.Color('#005F56'), // Phthalo Green
    uResolution: new THREE.Vector2(),
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform vec3 uColorBase;
    uniform vec3 uColorMagenta;
    uniform vec3 uColorPG7;
    uniform vec2 uResolution;
    
    varying vec2 vUv;

    // Fast Simplex 2D noise implementation
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
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
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
      // Correct aspect ratio for uniform blob shapes
      vec2 aspectUv = vUv;
      aspectUv.x *= uResolution.x / uResolution.y;

      // Create two offset, slow-moving noise layers for the blobs
      float slowTime = uTime * 0.08;
      float noiseMagenta = snoise(aspectUv * 1.5 + vec2(slowTime, -slowTime));
      float noisePG7 = snoise(aspectUv * 1.8 - vec2(slowTime * 1.2, slowTime * 0.5) + 50.0);

      // Distance vignette so Dioxazine Violet dominates the edges
      // Mapping distance from center (0.5, 0.5)
      float dist = distance(vUv, vec2(0.5, 0.5));
      // Smooth fade: 1.0 at center, drops to 0.0 as it approaches 0.8
      float vignette = smoothstep(0.8, 0.35, dist);

      // Remap noise from [-1, 1] to [0, 1]
      noiseMagenta = noiseMagenta * 0.5 + 0.5;
      noisePG7 = noisePG7 * 0.5 + 0.5;

      // Initial color starts at Violet Base
      vec3 finalColor = uColorBase;

      // Softly mix in Magenta and PG7, heavily gated by the vignette to keep edges dark
      finalColor = mix(finalColor, uColorMagenta, noiseMagenta * vignette * 0.85);
      finalColor = mix(finalColor, uColorPG7, noisePG7 * vignette * 0.75);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

// Register the custom shader to Three Fiber
extend({ RothkoMaterial });

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
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
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
      <rothkoMaterial ref={materialRef} transparent={false} depthWrite={false} />
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
        GPU Rule 1: Cap DPR to [1, 1.5] max. 
        Shader is soft by nature, downscaling saves immense fragment calculation overhead.
      */}
      <Canvas
        dpr={[1, 1.5]}
        orthographic
        camera={{ position: [0, 0, 1], zoom: 1 }}
        gl={{ 
          antialias: false, 
          powerPreference: "high-performance",
          alpha: false 
        }}
      >
        <ShaderPlane />
      </Canvas>
    </div>
  );
};
