'use client';

import { memo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { useUiStore } from '@/store/useUiStore';

const MagneticShearMaterial = shaderMaterial(
  {
    uTime: 0,
    uScroll: 0,
    uVelocity: 0,
    uResolution: new THREE.Vector2(),
    uColorBase: new THREE.Color('#0a0010'),
    uColorMagenta: new THREE.Color('#8a0060'),
    uColorPG7: new THREE.Color('#004a50'),
    uColorDust: new THREE.Color('#2d0040'),
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  // Fragment Shader (Final Refined "Hierarchical Shear" Logic)
  `
    precision mediump float;
    uniform float uTime;
    uniform float uScroll;
    uniform float uVelocity;
    uniform vec2 uResolution;
    uniform vec3 uColorBase;
    uniform vec3 uColorMagenta;
    uniform vec3 uColorPG7;
    uniform vec3 uColorDust;
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
      vec3 finalColor = uColorBase;

      // 1. Particle Film Layer (as before)
      float slowTime = uTime * 0.03;
      vec2 particleUV = uv * vec2(uResolution.x / uResolution.y, 1.0) * 2.0;
      float noise = random(particleUV + vec2(slowTime, slowTime * 0.3));
      float dust = pow(noise, 60.0);
      finalColor += uColorDust * dust * 0.5;

      // 2. HIERARCHICAL SHEAR LOGIC
      // Green Band: The stable "shell." Its position is the baseline.
      float posG = fract(0.5 + scrollOffset * 0.6);
      // Width: 0.02 core, 0.1 blur. This is the fuzzy green aura.
      float bandG = drawBand(uv.x, posG, 0.02, 0.1); 

      // Magenta Band: The hidden "core."
      // It is pulled out from under the Green by velocity.
      float clampedVelocity = smoothstep(0.1, 8.0, abs(uVelocity)) * uVelocity;
      float velocityOffset = clampedVelocity * 0.005; // How far it's pulled
      float posM = posG - velocityOffset; // Move in the opposite direction of scroll
      // Width: 0.015 core, 0.05 blur. Sharper and contained within the Green.
      float bandM = drawBand(uv.x, posM, 0.015, 0.05); 

      // 3. Color Mixing
      // We use mix() and then add() for a more controlled "chromatic grey."
      vec3 bandColor = mix(uColorPG7, uColorMagenta, bandM);
      finalColor += bandColor * bandG; // The Green acts as a mask for the fused color

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

    // Spring: slightly more responsive (0.08)
    velocityTracker.current.value += (scrollVelocity - velocityTracker.current.value) * 0.08;

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
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

export const CanvasBackground = memo(CanvasBackgroundComponent);
