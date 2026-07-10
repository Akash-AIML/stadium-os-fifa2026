import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, ContactShadows } from '@react-three/drei';
import { motion } from 'framer-motion';

// ── Stadium Rings representing modern digital stadium architecture ───────────
function StadiumRings() {
  const ringsRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (ringsRef.current) {
      ringsRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group ref={ringsRef}>
      {/* Seating tier representation 1 */}
      <mesh rotation-x={-Math.PI / 2} position-y={1.5}>
        <ringGeometry args={[28, 32, 64]} />
        <meshStandardMaterial
          color="#0e1726"
          roughness={0.4}
          metalness={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Light Ring 1 */}
      <mesh rotation-x={-Math.PI / 2} position-y={6}>
        <ringGeometry args={[34, 35, 64]} />
        <meshBasicMaterial
          color="#06b6d4"
          side={THREE.DoubleSide}
          transparent
          opacity={0.6}
        />
      </mesh>
      {/* Light Ring 2 */}
      <mesh rotation-x={-Math.PI / 2} position-y={12}>
        <ringGeometry args={[38, 38.5, 64]} />
        <meshBasicMaterial
          color="#a855f7"
          side={THREE.DoubleSide}
          transparent
          opacity={0.4}
        />
      </mesh>
      {/* Cyber pillars */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i * Math.PI * 2) / 16;
        const radius = 33;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <mesh key={i} position={[x, 6, z]}>
            <cylinderGeometry args={[0.2, 0.2, 12, 8]} />
            <meshStandardMaterial
              color="#1e293b"
              roughness={0.2}
              metalness={0.9}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function StadiumField() {
  const fieldRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    timeRef.current += delta;
    if (fieldRef.current) {
      (fieldRef.current.material as any).uniforms.time.value = timeRef.current;
    }
  });

  return (
    <mesh ref={fieldRef} rotation-x={-Math.PI / 2} position-y={0.1}>
      <planeGeometry args={[56, 38, 30, 30]} />
      <shaderMaterial
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float time;
          varying vec2 vUv;
          void main() {
            vec2 center = vec2(0.5, 0.5);
            float dist = distance(vUv, center);
            vec3 color1 = vec3(0.01, 0.08, 0.04);
            vec3 color2 = vec3(0.02, 0.16, 0.06);
            vec3 grass = mix(color1, color2, smoothstep(0.35, 0.45, dist));
            
            // Neon field boundaries/markings
            float borderX = smoothstep(0.02, 0.025, vUv.x) * (1.0 - smoothstep(0.975, 0.98, vUv.x));
            float borderY = smoothstep(0.03, 0.035, vUv.y) * (1.0 - smoothstep(0.965, 0.97, vUv.y));
            float isBorder = 1.0 - (borderX * borderY);
            
            // Dynamic pulse waves representing smart technology flow
            float wave = sin(dist * 15.0 - time * 2.0) * 0.5 + 0.5;
            grass += vec3(0.0, 0.04, 0.05) * wave * (1.0 - dist);
            
            if (isBorder > 0.5 && dist < 0.48) {
              grass = mix(grass, vec3(0.02, 0.4, 0.45), 0.7);
            }
            
            gl_FragColor = vec4(grass, 1.0);
          }
        `}
        uniforms={{ time: { value: 0 } }}
      />
    </mesh>
  );
}

function StadiumLights() {
  const lightsRef = useRef<THREE.PointLight[]>([]);
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    timeRef.current += delta;
    lightsRef.current.forEach((light, i) => {
      if (light) {
        light.intensity = 3 + Math.sin(timeRef.current * 2.5 + i) * 0.8;
      }
    });
  });

  return (
    <group>
      {[0, 90, 180, 270].map((angle, i) => (
        <group key={i} rotation-y={(angle * Math.PI) / 180}>
          <pointLight
            ref={el => { if (el) lightsRef.current[i] = el; }}
            position={[0, 25, 45]}
            intensity={3}
            color={i % 2 === 0 ? '#06b6d4' : '#a855f7'}
            distance={120}
            decay={2}
          />
          <mesh position={[0, 25, 45]}>
            <sphereGeometry args={[1.2, 16, 16]} />
            <meshBasicMaterial color={i % 2 === 0 ? '#22d3ee' : '#c084fc'} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CrowdParticles() {
  const particles = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    timeRef.current += delta;
    if (particles.current) {
      particles.current.rotation.y = timeRef.current * 0.02;
    }
  });

  const [geometry] = useState(() => {
    const geo = new THREE.BufferGeometry();
    const count = 3000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 30 + Math.random() * 8;
      const height = Math.random() * 8;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      // Cyan / Magenta crowd lighting colors
      const isCyan = Math.random() > 0.5;
      colors[i * 3] = isCyan ? 0.02 : 0.65;
      colors[i * 3 + 1] = isCyan ? 0.71 : 0.2;
      colors[i * 3 + 2] = isCyan ? 0.83 : 0.96;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  });

  return (
    <points ref={particles}>
      <primitive object={geometry} attach="geometry" />
      <pointsMaterial
        size={0.4}
        vertexColors
        transparent
        opacity={0.7}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function FloatingFootball() {
  const ballRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    timeRef.current += delta;
    if (ballRef.current) {
      ballRef.current.rotation.y += delta * 0.4;
      ballRef.current.rotation.z += delta * 0.25;
      ballRef.current.position.y = 8 + Math.sin(timeRef.current * 1.8) * 0.8;
    }
  });

  return (
    <mesh ref={ballRef} position={[0, 8, 0]}>
      <sphereGeometry args={[2, 16, 16]} />
      <meshStandardMaterial
        color="#ffffff"
        roughness={0.2}
        metalness={0.1}
        wireframe
      />
    </mesh>
  );
}

export function StadiumHero3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full" style={{ background: '#020408' }}>
      <Canvas
        camera={{ position: [0, 14, 52], fov: 50 }}
        shadows
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
        eventSource={containerRef as React.RefObject<HTMLElement>}
        onCreated={({ gl }) => {
          // Prevent passive event listener warnings from Three.js internal wheel handler
          const canvas = gl.domElement;
          canvas.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
        }}
      >
        <color attach="background" args={["#020408"]} />
        <fog attach="fog" args={["#020408", 40, 150]} />

        <Environment preset="city" background={false} />
        <Stars radius={200} depth={50} count={800} factor={4} saturation={0.5} fade />

        <ambientLight intensity={0.25} />
        {/* Cinematic Rim Lights */}
        <directionalLight position={[0, 30, -50]} intensity={2.5} color="#a855f7" />
        <directionalLight position={[0, 30, 50]} intensity={1.5} color="#06b6d4" />
        
        <StadiumField />
        <StadiumRings />
        <StadiumLights />
        <CrowdParticles />
        <FloatingFootball />
        <ContactShadows opacity={0.4} scale={90} blur={2.5} far={20} />

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableRotate={false}
          autoRotate={true}
          autoRotateSpeed={0.2}
        />
      </Canvas>
    </div>
  );
}