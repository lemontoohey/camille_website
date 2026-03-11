'use client';

import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { useUiStore } from '../store/useUiStore';

const ParallaxBandsMaterial = shaderMaterial(
  {
    uScroll: 0,
    uResolution: new THREE.Vector2(),
    uColorBase: new THREE.Color('#2d0040'),
    uColorMagenta: new THREE.Color('#8a0060'),
    uColorPG7: new THREE.Color('#004a50'),
    uColorViolet: new THREE.Color('#1a0a2e'),
  },
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  `
    precision mediump float;

    uniform float uScroll;
    uniform vec2 uResolution;
    uniform vec3 uColorBase;
    uniform vec3 uColorMagenta;
    uniform vec3 uColorPG7;
    uniform vec3 uColorViolet;

    varying vec2 vUv;

    float drawBand(float uvX, float xPos, float width, float blur) {
      float dist = abs(uvX - xPos);
      return smoothstep(width + blur, width, dist);
    }

    void main() {
      vec2 uv = vUv;
      float scrollOffset = uScroll * 0.0005;

      vec3 finalColor = uColorBase;

      float mSpeed = 1.8;
      float gSpeed = 0.6;
      float mPosAbs = 0.5 + scrollOffset * mSpeed;
      float gPosAbs = 0.5 + scrollOffset * gSpeed;
      float posM = fract(mPosAbs);
      float posG = fract(gPosAbs);

      // Magenta: step/pow for sharp, low-frequency "snaps" (flashes)
      float bandMRaw = drawBand(uv.x, posM, 0.04, 0.08);
      float flash = step(0.55, fract(scrollOffset * 0.12));
      float bandM = pow(bandMRaw, 2.0) * flash;

      float bandG = drawBand(uv.x, posG, 0.08, 0.2);

      // High transparency (0.15) - overlap forms chromatic black naturally
      float opacity = 0.15;
      finalColor = mix(finalColor, uColorMagenta, bandM * opacity);
      finalColor = mix(finalColor, uColorPG7, bandG * opacity);

      float posV = fract(0.8 + scrollOffset * 0.4);
      float bandV = drawBand(uv.x, posV, 0.12, 0.25);
      finalColor = mix(finalColor, uColorViolet, bandV * opacity * 0.8);

      float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
      finalColor += grain * 0.012;

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
      <parallaxBandsMaterial ref={materialRef} transparent={false} depthWrite={false} />
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
    <div className="fixed inset-0 z-0 pointer-events-none bg-void">
      <Canvas
        dpr={1}
        orthographic
        camera={{ position: [0, 0, 1], zoom: 1 }}
        gl={{
          antialias: false,
          powerPreference: 'default',
          alpha: false,
        }}
      >
        <ShaderPlane />
      </Canvas>
    </div>
  );
};
