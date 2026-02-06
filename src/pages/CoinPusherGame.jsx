// import React, { useState, useEffect, useRef, Suspense, useMemo, memo, useImperativeHandle, forwardRef } from 'react';
// import { Canvas, useFrame, useThree } from '@react-three/fiber';
// import { PerspectiveCamera, Sky, Trail, Float, Stars, RoundedBox } from '@react-three/drei';
// import { EffectComposer, Bloom, Vignette, ChromaticAberration, DepthOfField } from '@react-three/postprocessing';
// import * as THREE from 'three';
// import { db, auth } from '../firebase';
// import { doc, getDoc, updateDoc, increment, setDoc, collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';

// // ==================== ⚙️ GAME CONFIG ====================
// const CONFIG = {
//     PLAY_COST: 10000,
//     LANE_COUNT: 5,
//     LANE_WIDTH: 2.2,
//     START_SPEED: 1.5,
//     MAX_SPEED: 5.0,
//     BOOST_MULTIPLIER: 2.2,
//     SPAWN_DISTANCE: -280,
//     ITEM_SPAWN_RATE: 0.30,
//     BASE_SPAWN_INTERVAL: 1.4,
//     MIN_SPAWN_INTERVAL: 0.4,
//     POOL_SIZE: 80, // 🔥 증가
//     MAX_DELTA: 0.033, // 🔥 30fps 이하 방지
// };

// const LANES = Array.from({ length: CONFIG.LANE_COUNT }, (_, i) => 
//     (i - Math.floor(CONFIG.LANE_COUNT / 2)) * CONFIG.LANE_WIDTH
// );

// // ==================== 🎵 AUDIO SYSTEM ====================
// class AudioManager {
//     constructor() {
//         this.ctx = null;
//         this.engineOsc = null;
//         this.engineGain = null;
//         this.isMuted = false;
//         this.soundQueue = []; // 🔥 사운드 큐
//         this.lastSoundTime = {}; // 🔥 디바운싱
//     }

//     init() {
//         if (!this.ctx) {
//             this.ctx = new (window.AudioContext || window.webkitAudioContext)();
//         }
//         if (this.ctx.state === 'suspended') {
//             this.ctx.resume();
//         }
//     }

//     startEngine() {
//         this.init();
//         if (this.engineOsc || this.isMuted) return;
        
//         this.engineOsc = this.ctx.createOscillator();
//         this.engineGain = this.ctx.createGain();
        
//         this.engineOsc.type = 'sawtooth';
//         this.engineOsc.frequency.value = 60;
//         this.engineGain.gain.value = 0.05;
        
//         this.engineOsc.connect(this.engineGain);
//         this.engineGain.connect(this.ctx.destination);
//         this.engineOsc.start();
//     }

//     updateEngine(speed, isBoosting) {
//         if (!this.engineOsc || this.isMuted) return;
//         const baseFreq = 60 + (speed * 15);
//         const targetFreq = isBoosting ? baseFreq * 1.5 : baseFreq;
//         this.engineOsc.frequency.exponentialRampToValueAtTime(
//             targetFreq, 
//             this.ctx.currentTime + 0.1
//         );
//         this.engineGain.gain.value = isBoosting ? 0.08 : 0.05;
//     }

//     stopEngine() {
//         if (this.engineOsc) {
//             this.engineOsc.stop();
//             this.engineOsc = null;
//             this.engineGain = null;
//         }
//     }

//     playSound(type) {
//         this.init();
//         if (this.isMuted) return;

//         // 🔥 디바운싱: 같은 사운드 0.05초 내 중복 방지
//         const now = performance.now();
//         if (this.lastSoundTime[type] && now - this.lastSoundTime[type] < 50) return;
//         this.lastSoundTime[type] = now;

//         const osc = this.ctx.createOscillator();
//         const gain = this.ctx.createGain();
//         osc.connect(gain);
//         gain.connect(this.ctx.destination);

//         const ct = this.ctx.currentTime;

//         switch(type) {
//             case 'move':
//                 osc.type = 'sine';
//                 osc.frequency.setValueAtTime(400, ct);
//                 osc.frequency.exponentialRampToValueAtTime(800, ct + 0.08);
//                 gain.gain.setValueAtTime(0.12, ct);
//                 gain.gain.exponentialRampToValueAtTime(0.001, ct + 0.08);
//                 osc.start(ct);
//                 osc.stop(ct + 0.08);
//                 break;
//             case 'coin':
//                 osc.type = 'sine';
//                 osc.frequency.setValueAtTime(1400, ct);
//                 osc.frequency.exponentialRampToValueAtTime(2200, ct + 0.15);
//                 gain.gain.setValueAtTime(0.15, ct);
//                 gain.gain.exponentialRampToValueAtTime(0.001, ct + 0.25);
//                 osc.start(ct);
//                 osc.stop(ct + 0.25);
//                 break;
//             case 'boost':
//                 osc.type = 'sawtooth';
//                 osc.frequency.setValueAtTime(100, ct);
//                 osc.frequency.linearRampToValueAtTime(300, ct + 0.4);
//                 gain.gain.setValueAtTime(0.25, ct);
//                 gain.gain.linearRampToValueAtTime(0.001, ct + 0.4);
//                 osc.start(ct);
//                 osc.stop(ct + 0.4);
//                 break;
//             case 'crash':
//                 osc.type = 'sawtooth';
//                 osc.frequency.setValueAtTime(150, ct);
//                 osc.frequency.exponentialRampToValueAtTime(20, ct + 0.8);
//                 gain.gain.setValueAtTime(0.4, ct);
//                 gain.gain.exponentialRampToValueAtTime(0.001, ct + 0.8);
//                 osc.start(ct);
//                 osc.stop(ct + 0.8);
//                 break;
//             case 'combo':
//                 osc.type = 'triangle';
//                 osc.frequency.setValueAtTime(800, ct);
//                 osc.frequency.exponentialRampToValueAtTime(1600, ct + 0.12);
//                 gain.gain.setValueAtTime(0.1, ct);
//                 gain.gain.exponentialRampToValueAtTime(0.001, ct + 0.12);
//                 osc.start(ct);
//                 osc.stop(ct + 0.12);
//                 break;
//             case 'shield':
//                 osc.type = 'sine';
//                 osc.frequency.setValueAtTime(600, ct);
//                 osc.frequency.exponentialRampToValueAtTime(1200, ct + 0.2);
//                 gain.gain.setValueAtTime(0.2, ct);
//                 gain.gain.exponentialRampToValueAtTime(0.001, ct + 0.3);
//                 osc.start(ct);
//                 osc.stop(ct + 0.3);
//                 break;
//         }
//     }

//     setMuted(muted) {
//         this.isMuted = muted;
//         if (muted) this.stopEngine();
//     }
// }

// const audioManager = new AudioManager();

// // ==================== 🎨 MAP THEMES ====================
// const MAP_THEMES = {
//     city: { name: 'NEON METROPOLIS', sky: '#0a0015', road: '#0d0d1a', fog: '#1a0033', light: '#00ffff', accent: '#ff00ff', skybox: 'night' },
//     desert: { name: 'SUNSET WASTELAND', sky: '#ff6b35', road: '#4a3228', fog: '#ff8c42', light: '#ffaa00', accent: '#ff4500', skybox: 'sunset' },
//     snow: { name: 'FROZEN HORIZON', sky: '#b8e6f0', road: '#e8f4f8', fog: '#d4e9f7', light: '#ffffff', accent: '#4fc3f7', skybox: 'dawn' },
//     hell: { name: 'INFERNO HIGHWAY', sky: '#330000', road: '#1a0505', fog: '#4d0000', light: '#ff0000', accent: '#ff6600', skybox: 'night' },
//     sky: { name: 'CLOUD KINGDOM', sky: '#87CEEB', road: '#f0f8ff', fog: '#b0d4f1', light: '#ffffff', accent: '#4dd0e1', skybox: 'day' },
//     heaven: { name: 'DIVINE PATHWAY', sky: '#fff9e6', road: '#ffffff', fog: '#fffacd', light: '#ffd700', accent: '#ffeb3b', skybox: 'sunset' },
//     ocean: { name: 'DEEP ABYSS', sky: '#001a33', road: '#000d1a', fog: '#002244', light: '#00bcd4', accent: '#0097a7', skybox: 'night' }
// };

// const updateRanking = async (user, newScore, playerName) => {
//     if (!user || newScore <= 0) return;
//     const rankRef = doc(db, "highway_ranks", user.uid);
//     try {
//         const docSnap = await getDoc(rankRef);
//         const shouldUpdate = !docSnap.exists() || (docSnap.exists() && newScore > docSnap.data().score);
//         if (shouldUpdate) {
//             await setDoc(rankRef, { name: playerName, score: newScore, timestamp: Date.now() }, { merge: true });
//         }
//     } catch (e) { console.error('Ranking update failed:', e); }
// };

// const fetchLeaderboard = async () => {
//     try {
//         const q = query(collection(db, "highway_ranks"), orderBy("score", "desc"), limit(10));
//         const querySnapshot = await getDocs(q);
//         return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//     } catch (e) { return []; }
// };

// // ==================== 🚙 POOLED OBJECT COMPONENT ====================
// const PooledGameEntity = forwardRef((props, ref) => {
//     const groupRef = useRef();
//     const meshRef = useRef(); // 🔥 메쉬 직접 참조
//     const stateRef = useRef({ type: null, visible: false, rotationSpeed: 0 }); // 🔥 State 대신 Ref

//     useImperativeHandle(ref, () => ({
//         activate: (newType, x, z) => {
//             stateRef.current.type = newType;
//             stateRef.current.visible = true;
//             stateRef.current.rotationSpeed = 0.03 + Math.random() * 0.02; // 🔥 랜덤 회전속도
//             if (groupRef.current) {
//                 groupRef.current.position.set(x, 0, z);
//                 groupRef.current.visible = true;
//             }
//         },
//         deactivate: () => {
//             stateRef.current.visible = false;
//             if (groupRef.current) groupRef.current.visible = false;
//         },
//         isActive: () => stateRef.current.visible,
//         updatePosition: (z) => {
//             if (groupRef.current) groupRef.current.position.z = z;
//         },
//         setX: (x) => {
//             if (groupRef.current) groupRef.current.position.x = x;
//         },
//         getPosition: () => groupRef.current ? groupRef.current.position : new THREE.Vector3(),
//         getType: () => stateRef.current.type
//     }));

//     // 🔥 애니메이션 최적화: visible일 때만 회전
//     useFrame(() => {
//         if (!stateRef.current.visible || !meshRef.current) return;
//         const type = stateRef.current.type;
//         if (type === 'coin' || type === 'boost' || type === 'shield' || type === 'magnet' || type === 'slowmotion' || type === 'doublepoints') {
//             meshRef.current.rotation.y += stateRef.current.rotationSpeed;
//         }
//     });

//     if (!stateRef.current.visible) return <group ref={groupRef} visible={false} />;

//     const type = stateRef.current.type;

//     return (
//         <group ref={groupRef}>
//             {type === 'coin' && (
//                 <Float speed={6} rotationIntensity={2} floatIntensity={0.4}>
//                     <group position={[0, 0.6, 0]} ref={meshRef}>
//                         <mesh rotation={[Math.PI/2, 0, 0]}>
//                             <cylinderGeometry args={[0.5, 0.5, 0.1, 24]} />
//                             <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={1.2} metalness={0.9} roughness={0.1} />
//                         </mesh>
//                         <pointLight color="#ffd700" intensity={1.5} distance={3} />
//                     </group>
//                 </Float>
//             )}
//             {type === 'boost' && (
//                 <Float speed={8} rotationIntensity={4} floatIntensity={0.6}>
//                     <group position={[0, 0.6, 0]} ref={meshRef}>
//                         <mesh>
//                             <octahedronGeometry args={[0.55, 0]} />
//                             <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={3} toneMapped={false} />
//                         </mesh>
//                         <pointLight color="#00ffff" intensity={4} distance={6} />
//                     </group>
//                 </Float>
//             )}
//             {type === 'magnet' && (
//                 <Float speed={5} rotationIntensity={2} floatIntensity={0.5}>
//                     <group position={[0, 0.6, 0]} ref={meshRef}>
//                         <mesh rotation={[0, 0, Math.PI]}>
//                             <torusGeometry args={[0.45, 0.15, 12, 24, Math.PI]} />
//                             <meshStandardMaterial color="#e74c3c" metalness={0.8} />
//                         </mesh>
//                         <mesh>
//                             <torusGeometry args={[0.45, 0.15, 12, 24, Math.PI]} />
//                             <meshStandardMaterial color="#3498db" metalness={0.8} />
//                         </mesh>
//                         <pointLight color="#ffd700" intensity={1.5} distance={4} />
//                     </group>
//                 </Float>
//             )}
//             {type === 'shield' && (
//                 <Float speed={7} rotationIntensity={3} floatIntensity={0.6}>
//                     <group position={[0, 0.6, 0]} ref={meshRef}>
//                         <mesh>
//                             <dodecahedronGeometry args={[0.55, 0]} />
//                             <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={2.5} metalness={0.9} roughness={0.1} />
//                         </mesh>
//                         <pointLight color="#00ff00" intensity={3} distance={5} />
//                     </group>
//                 </Float>
//             )}
//             {type === 'slowmotion' && (
//                 <Float speed={6} rotationIntensity={3} floatIntensity={0.5}>
//                     <group position={[0, 0.6, 0]} ref={meshRef}>
//                         <mesh>
//                             <icosahedronGeometry args={[0.55, 0]} />
//                             <meshStandardMaterial color="#9c27b0" emissive="#9c27b0" emissiveIntensity={2.5} metalness={0.9} roughness={0.1} />
//                         </mesh>
//                         <pointLight color="#9c27b0" intensity={3} distance={5} />
//                     </group>
//                 </Float>
//             )}
//             {type === 'doublepoints' && (
//                 <Float speed={7} rotationIntensity={3} floatIntensity={0.6}>
//                     <group position={[0, 0.6, 0]} ref={meshRef}>
//                         <mesh>
//                             <octahedronGeometry args={[0.55, 0]} />
//                             <meshStandardMaterial color="#ff6600" emissive="#ff6600" emissiveIntensity={2.5} metalness={0.9} roughness={0.1} />
//                         </mesh>
//                         <pointLight color="#ff6600" intensity={3} distance={5} />
//                     </group>
//                 </Float>
//             )}
//             {type === 'barrier' && (
//                 <group position={[0, 0.5, 0]}>
//                     <mesh castShadow>
//                         <boxGeometry args={[1.5, 0.8, 0.2]} />
//                         <meshStandardMaterial color="#f1c40f" metalness={0.3} roughness={0.7} />
//                     </mesh>
//                     {[-0.25, 0.25].map((x, i) => (
//                         <mesh key={i} position={[x, 0, 0.11]}>
//                             <boxGeometry args={[0.25, 0.7, 0.02]} />
//                             <meshBasicMaterial color="#000000" />
//                         </mesh>
//                     ))}
//                 </group>
//             )}
//             {type === 'drum' && (
//                 <group position={[0, 0.6, 0]}>
//                     <mesh castShadow>
//                         <cylinderGeometry args={[0.4, 0.4, 1.2, 12]} />
//                         <meshStandardMaterial color="#c0392b" metalness={0.4} roughness={0.6} />
//                     </mesh>
//                     <mesh position={[0, 0.35, 0]}>
//                         <cylinderGeometry args={[0.42, 0.42, 0.25, 12]} />
//                         <meshBasicMaterial color="#ffffff" />
//                     </mesh>
//                 </group>
//             )}
//         </group>
//     );
// });

// // ==================== 🚗 SUPER CAR ====================
// const SuperCar = memo(({ laneIndex, isBoosting, isRecovering, hasMagnet, hasShield, theme }) => {
//     const meshRef = useRef();
//     const currentX = useRef(0);
//     const shieldRef = useRef();
//     const wheelRefs = [useRef(), useRef(), useRef(), useRef()];
//     const glowRef = useRef();

//     const carColor = useMemo(() => {
//         if (isBoosting) return '#ff0066';
//         if (theme === 'heaven') return '#ffd700';
//         if (theme === 'hell') return '#cc0000';
//         if (theme === 'ocean') return '#00bcd4';
//         return '#00d4ff';
//     }, [isBoosting, theme]);

//     useFrame((state, delta) => {
//         const safeDelta = Math.min(delta, CONFIG.MAX_DELTA);
//         const targetX = LANES[laneIndex];
        
//         // 🔥 더 부드러운 이동
//         currentX.current = THREE.MathUtils.lerp(currentX.current, targetX, 18 * safeDelta);

//         if (meshRef.current) {
//             meshRef.current.position.x = currentX.current;
//             meshRef.current.rotation.z = (targetX - currentX.current) * 0.15;
//             meshRef.current.rotation.y = (targetX - currentX.current) * -0.08;
//             if (isBoosting) {
//                 meshRef.current.position.y = 0.35 + Math.sin(state.clock.elapsedTime * 15) * 0.04;
//             } else {
//                 meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 0.3, safeDelta * 4);
//             }
//         }
        
//         const wheelSpeed = safeDelta * (isBoosting ? 35 : 18);
//         wheelRefs.forEach(ref => {
//             if (ref.current) ref.current.rotation.y += wheelSpeed;
//         });
        
//         if (shieldRef.current) {
//             shieldRef.current.rotation.y += safeDelta * 3;
//             shieldRef.current.rotation.z += safeDelta * 1.5;
//         }
        
//         if (glowRef.current) {
//             glowRef.current.intensity = isBoosting ? 8 : 4;
//         }
//     });

//     return (
//         <group ref={meshRef} position={[0, 0.3, 0]}>
//             {(isRecovering || isBoosting || hasShield) && (
//                 <group ref={shieldRef}>
//                     <mesh>
//                         <sphereGeometry args={[1.6, 16, 16]} />
//                         <meshBasicMaterial 
//                             color={hasShield ? '#00ff00' : isBoosting ? '#00ffff' : '#ffaa00'} 
//                             transparent 
//                             opacity={0.12} 
//                             wireframe 
//                         />
//                     </mesh>
//                 </group>
//             )}
//             {hasMagnet && (
//                 <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
//                     <mesh><ringGeometry args={[1.8, 2.2, 32]} /><meshBasicMaterial color="#ffd700" transparent opacity={0.4} /></mesh>
//                 </group>
//             )}
//             <group>
//                 <RoundedBox args={[1.1, 0.25, 2.5]} radius={0.08} smoothness={4}>
//                     <meshStandardMaterial color="#0a0a0a" metalness={0.9} roughness={0.1} />
//                 </RoundedBox>
//                 <RoundedBox args={[1.15, 0.18, 1.8]} radius={0.1} smoothness={4} position={[0, 0.4, -0.1]}>
//                     <meshStandardMaterial 
//                         color={carColor} 
//                         metalness={0.95} 
//                         roughness={0.05} 
//                         emissive={carColor} 
//                         emissiveIntensity={isBoosting ? 0.4 : 0.15} 
//                     />
//                 </RoundedBox>
//                 <mesh position={[0, 0.58, -0.25]} rotation={[0.15, 0, 0]}>
//                     <boxGeometry args={[0.65, 0.2, 1.0]} />
//                     <meshPhysicalMaterial color="#000000" metalness={1} roughness={0} transmission={0.5} />
//                 </mesh>
//                 <mesh position={[0, 0.25, -1.3]}>
//                     <boxGeometry args={[0.8, 0.15, 0.1]} />
//                     <meshStandardMaterial 
//                         color={isBoosting ? '#ff0066' : '#ffffff'} 
//                         emissive={isBoosting ? '#ff0066' : '#ffffff'} 
//                         emissiveIntensity={isBoosting ? 1.5 : 0.8} 
//                     />
//                 </mesh>
//                 {[[-0.65, 0.1, 0.9], [0.65, 0.1, 0.9], [-0.7, 0.1, -0.9], [0.7, 0.1, -0.9]].map((pos, i) => (
//                     <group key={i} position={pos} ref={wheelRefs[i]}>
//                         <mesh rotation={[0, 0, Math.PI / 2]}>
//                             <cylinderGeometry args={[0.35, 0.35, 0.35, 16]} />
//                             <meshStandardMaterial color="#0a0a0a" metalness={0.6} />
//                         </mesh>
//                     </group>
//                 ))}
//                 <pointLight ref={glowRef} position={[0, -0.2, 0]} color={carColor} intensity={4} distance={6} />
//             </group>
//             {isBoosting && (
//                 <Trail width={3} length={18} color='#ff0066' attenuation={(t) => t * t}>
//                     <mesh position={[0, 0.2, 1.5]}>
//                         <sphereGeometry args={[0.08, 6, 6]} />
//                         <meshBasicMaterial color='#ff0066' />
//                     </mesh>
//                 </Trail>
//             )}
//         </group>
//     );
// });

// // ==================== 🌟 SPEED LINES ====================
// const SpeedLines = memo(({ isBoosting, theme }) => {
//     const groupRef = useRef();
//     const lines = useMemo(() => Array.from({ length: 30 }, () => ({ 
//         x: (Math.random() - 0.5) * 50, 
//         y: Math.random() * 15 + 1, 
//         z: Math.random() * 40 - 50, 
//         length: Math.random() * 10 + 6, 
//         speed: 0.7 + Math.random() * 0.3 
//     })), []);
    
//     useFrame((state, delta) => {
//         if (!isBoosting || !groupRef.current) return;
//         const safeDelta = Math.min(delta, CONFIG.MAX_DELTA);
//         const children = groupRef.current.children;
//         for (let i = 0; i < children.length; i++) {
//             children[i].position.z += 120 * safeDelta * lines[i].speed;
//             if (children[i].position.z > 15) children[i].position.z = -50;
//         }
//     });
    
//     if (!isBoosting) return null;
    
//     return (
//         <group ref={groupRef}>
//             {lines.map((line, i) => (
//                 <mesh key={i} position={[line.x, line.y, line.z]} rotation={[Math.PI / 2, 0, 0]}>
//                     <cylinderGeometry args={[0.03, 0.03, line.length, 6]} />
//                     <meshBasicMaterial color={MAP_THEMES[theme]?.light || '#ffffff'} transparent opacity={0.35} />
//                 </mesh>
//             ))}
//         </group>
//     );
// });

// // ==================== 🌲 THEME PARTICLES ====================
// const ThemeParticles = memo(({ theme, speed }) => {
//     const particlesRef = useRef();
//     const particles = useMemo(() => {
//         const count = 60;
//         const positions = [];
//         for (let i = 0; i < count; i++) {
//             positions.push({ 
//                 x: (Math.random() - 0.5) * 50, 
//                 y: Math.random() * 20 + 2, 
//                 z: Math.random() * 150 - 100, 
//                 speed: 0.5 + Math.random() * 1.5 
//             });
//         }
//         return positions;
//     }, []);

//     useFrame((state, delta) => {
//         if (!particlesRef.current) return;
//         const safeDelta = Math.min(delta, CONFIG.MAX_DELTA);
//         particlesRef.current.children.forEach((particle, i) => {
//             const data = particles[i];
//             particle.position.z += speed * 50 * safeDelta * data.speed;
//             if (particle.position.z > 20) particle.position.z = -100;
//         });
//     });

//     return (
//         <group ref={particlesRef}>
//             {particles.map((p, i) => (
//                 <mesh key={i} position={[p.x, p.y, p.z]}>
//                     <sphereGeometry args={[0.08, 8, 8]} />
//                     <meshBasicMaterial color={MAP_THEMES[theme].accent} transparent opacity={0.6} />
//                 </mesh>
//             ))}
//         </group>
//     );
// });

// // ==================== 🌲 SIDE SCENERY ====================
// const SideScenery = memo(({ speed, theme }) => {
//     const groupRef = useRef();
//     const objects = useMemo(() => {
//         const objs = [];
//         for (let i = 0; i < 30; i++) {
//             const side = Math.random() > 0.5 ? 1 : -1;
//             objs.push({ 
//                 x: side * (18 + Math.random() * 20), 
//                 z: -i * 20, 
//                 scale: 0.7 + Math.random() * 1.2
//             });
//         }
//         return objs;
//     }, [theme]);
    
//     useFrame((state, delta) => {
//         if (!groupRef.current) return;
//         const safeDelta = Math.min(delta, CONFIG.MAX_DELTA);
//         const moveAmount = speed * 55 * safeDelta;
//         const children = groupRef.current.children;
        
//         for (let i = 0; i < children.length; i++) {
//             const child = children[i];
//             child.position.z += moveAmount;
//             if (child.position.z > 20) {
//                 child.position.z -= 600;
//             }
//         }
//     });
    
//     return (
//         <group ref={groupRef}>
//             {objects.map((obj, i) => (
//                 <mesh key={i} position={[obj.x, obj.scale * 2, obj.z]}>
//                     <coneGeometry args={[2.5 * obj.scale, 8 * obj.scale, 6]} />
//                     <meshStandardMaterial color={theme==='snow'?'#fff':'#2e7d32'} />
//                 </mesh>
//             ))}
//         </group>
//     );
// });

// // ==================== 🛣️ CYBERPUNK ROAD ====================
// const CyberpunkRoad = memo(({ speed, theme }) => {
//     const linesRef = useRef();
//     const gridRef = useRef();
//     const themeConfig = MAP_THEMES[theme];
    
//     useFrame((state, delta) => {
//         const safeDelta = Math.min(delta, CONFIG.MAX_DELTA);
//         const moveAmount = speed * 55 * safeDelta;
        
//         if (linesRef.current) { 
//             linesRef.current.position.z += moveAmount; 
//             if (linesRef.current.position.z > 20) linesRef.current.position.z -= 20; 
//         }
//         if (gridRef.current) { 
//             gridRef.current.position.z += moveAmount; 
//             if (gridRef.current.position.z > 40) gridRef.current.position.z -= 40; 
//         }
//     });
    
//     const roadMesh = useMemo(() => (
//         <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -50]} receiveShadow>
//             <planeGeometry args={[CONFIG.LANE_COUNT * CONFIG.LANE_WIDTH + 3, 600]} />
//             <meshStandardMaterial color={themeConfig.road} roughness={0.9} metalness={0.1} />
//         </mesh>
//     ), [themeConfig.road]);
    
//     const gridLines = useMemo(() => 
//         Array.from({ length: 15 }).map((_, i) => (
//             <mesh key={`grid-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -i * 40]}>
//                 <planeGeometry args={[CONFIG.LANE_COUNT * CONFIG.LANE_WIDTH + 2, 0.12]} />
//                 <meshBasicMaterial color={themeConfig.accent} transparent opacity={0.25} />
//             </mesh>
//         ))
//     , [themeConfig.accent]);
    
//     const laneLines = useMemo(() => {
//         const lines = [];
//         for (let i = 0; i <= CONFIG.LANE_COUNT; i++) {
//             const x = (i - CONFIG.LANE_COUNT / 2) * CONFIG.LANE_WIDTH;
//             const isBorder = i === 0 || i === CONFIG.LANE_COUNT;
//             for (let j = 0; j < 30; j++) {
//                 lines.push(
//                     <mesh key={`lane-${i}-${j}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.03, -j * 20]}>
//                         <planeGeometry args={[isBorder ? 0.35 : 0.1, isBorder ? 18 : 9]} />
//                         <meshBasicMaterial color={isBorder ? themeConfig.light : '#ffffff'} transparent opacity={isBorder ? 0.8 : 0.6} />
//                     </mesh>
//                 );
//             }
//         }
//         return lines;
//     }, [themeConfig.light]);
    
//     return (
//         <group>
//             {roadMesh}
//             <group ref={gridRef} position={[0, 0.02, 0]}>
//                 {gridLines}
//             </group>
//             <group ref={linesRef}>
//                 {laneLines}
//             </group>
//         </group>
//     );
// });

// // ==================== 💥 EXPLOSION EFFECT ====================
// const ExplosionEffect = memo(({ position }) => {
//     const particles = useMemo(() => Array.from({ length: 20 }, () => ({ 
//         direction: new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 2, (Math.random() - 0.5) * 2).normalize(), 
//         speed: 2 + Math.random() * 3, 
//         size: 0.25 + Math.random() * 0.4, 
//         color: Math.random() > 0.5 ? '#ff6600' : '#ffaa00' 
//     })), []);
    
//     const groupRef = useRef();
    
//     useFrame((state, delta) => {
//         if (!groupRef.current) return;
//         const safeDelta = Math.min(delta, CONFIG.MAX_DELTA);
//         const children = groupRef.current.children;
//         for (let i = 0; i < children.length - 1; i++) {
//             const p = particles[i];
//             children[i].position.add(p.direction.clone().multiplyScalar(p.speed * safeDelta));
//             children[i].rotation.x += safeDelta * 4;
//             p.direction.y -= safeDelta * 2.5;
//         }
//     });
    
//     return (
//         <group ref={groupRef} position={position}>
//             {particles.map((p, i) => (
//                 <mesh key={i}>
//                     <boxGeometry args={[p.size, p.size, p.size]} />
//                     <meshBasicMaterial color={p.color} />
//                 </mesh>
//             ))}
//             <pointLight color="#ff6600" intensity={8} distance={12} decay={2} />
//         </group>
//     );
// });

// // ==================== 📷 DYNAMIC CAMERA ====================
// const DynamicCamera = memo(({ isBoosting, isRecovering, isCrashed }) => {
//     const { camera, size } = useThree();
//     const shakeOffset = useRef({ x: 0, y: 0 });
    
//     useFrame((state, delta) => {
//         const safeDelta = Math.min(delta, CONFIG.MAX_DELTA);
//         const isMobile = size.width < 768;
//         const baseZ = isMobile ? 24 : 16;
//         const baseY = isMobile ? 11 : 9;
//         let targetFov = 60, targetY = baseY, targetZ = baseZ;
        
//         if (isBoosting) { 
//             targetFov = 85; 
//             targetY = baseY - 0.8; 
//             targetZ = baseZ - 3; 
//             shakeOffset.current.x = (Math.random() - 0.5) * 0.2; 
//             shakeOffset.current.y = (Math.random() - 0.5) * 0.08; 
//         } else if (isRecovering) { 
//             targetFov = 68; 
//             targetY = baseY - 0.4; 
//             targetZ = baseZ - 1.5; 
//             shakeOffset.current.x = THREE.MathUtils.lerp(shakeOffset.current.x, 0, safeDelta * 4); 
//             shakeOffset.current.y = THREE.MathUtils.lerp(shakeOffset.current.y, 0, safeDelta * 4); 
//         } else { 
//             shakeOffset.current.x = THREE.MathUtils.lerp(shakeOffset.current.x, 0, safeDelta * 6); 
//             shakeOffset.current.y = THREE.MathUtils.lerp(shakeOffset.current.y, 0, safeDelta * 6); 
//         }
        
//         if (isCrashed) { 
//             targetY = 16; 
//             targetZ = 8; 
//             targetFov = 50; 
//         }
        
//         camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, safeDelta * 2.5);
//         camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, safeDelta * 2.5);
//         camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, safeDelta * 2.5);
//         camera.position.x = THREE.MathUtils.lerp(camera.position.x, shakeOffset.current.x, safeDelta * 8);
//         camera.lookAt(0, shakeOffset.current.y, -25);
//         camera.updateProjectionMatrix();
//     });
    
//     return null;
// });

// // ==================== 🎮 WORLD CONTROLLER (렉 제거 + 부스터 버그 수정) ====================
// const WorldController = ({
//     isPlaying, laneIndex, isBoosting, isRecovering, hasMagnet, hasShield, isSlowMotion, doublePoints,
//     onCrash, onCoin, onBoost, onMagnet, onShield, onSlowMotion, onDoublePoints,
//     setScore, setSpeedDisplay, setCombo, removeShield,
//     theme, audioManager
// }) => {
//     const poolRefs = useRef([]); 
//     const poolData = useRef([]); 
    
//     const spawnTimer = useRef(0);
//     const speedRef = useRef(CONFIG.START_SPEED);
//     const scoreAcc = useRef(0);
//     const comboRef = useRef(0);
//     const comboTimer = useRef(0);
//     const frameCount = useRef(0);
    
//     // 🔥 수집된 아이템 추적 (중복 방지)
//     const collectedItems = useRef(new Set());

//     useEffect(() => {
//         poolData.current = Array.from({ length: CONFIG.POOL_SIZE }, () => ({
//             active: false,
//             lane: 0,
//             z: 0,
//             type: null,
//             id: Math.random() // 🔥 고유 ID
//         }));
//     }, []);

//     useEffect(() => {
//         if (isPlaying) {
//             poolData.current.forEach((item, i) => {
//                 item.active = false;
//                 item.id = Math.random(); // 🔥 ID 재생성
//                 if(poolRefs.current[i]) poolRefs.current[i].deactivate();
//             });
//             spawnTimer.current = 0;
//             speedRef.current = CONFIG.START_SPEED;
//             scoreAcc.current = 0;
//             comboRef.current = 0;
//             comboTimer.current = 0;
//             collectedItems.current.clear(); // 🔥 클리어
//             audioManager.startEngine();
//         } else {
//             audioManager.stopEngine();
//         }
//     }, [isPlaying, audioManager]);

//     useFrame((state, delta) => {
//         if (!isPlaying) return;

//         const safeDelta = Math.min(delta, CONFIG.MAX_DELTA); // 🔥 렉 방지
//         const timeScale = isSlowMotion ? 0.5 : 1.0;
//         const effectiveDelta = safeDelta * timeScale;

//         // 속도 계산
//         let baseSpeed = CONFIG.START_SPEED + (scoreAcc.current * 0.00005);
//         if (baseSpeed > CONFIG.MAX_SPEED) baseSpeed = CONFIG.MAX_SPEED;
//         const targetSpeed = isBoosting ? baseSpeed * CONFIG.BOOST_MULTIPLIER : baseSpeed;
//         const lerpFactor = isRecovering ? effectiveDelta * 1.8 : effectiveDelta * 3.5;
//         speedRef.current = THREE.MathUtils.lerp(speedRef.current, targetSpeed, lerpFactor);
        
//         audioManager.updateEngine(speedRef.current, isBoosting);

//         // 콤보 타이머
//         if (comboTimer.current > 0) comboTimer.current -= effectiveDelta;
//         else if (comboRef.current > 0) { comboRef.current = 0; setCombo(0); }

//         // 점수
//         const speedBonus = isBoosting ? 1.5 : 1;
//         const pointBonus = doublePoints ? 2 : 1;
//         scoreAcc.current += speedRef.current * 55 * effectiveDelta * speedBonus * pointBonus;

//         // UI 업데이트 (30프레임마다)
//         frameCount.current += 1;
//         if (frameCount.current % 30 === 0) {
//             setScore(Math.floor(scoreAcc.current));
//             setSpeedDisplay(Math.floor(speedRef.current * 200));
//         }

//         // 스폰 로직
//         spawnTimer.current -= effectiveDelta * speedRef.current;
//         if (spawnTimer.current <= 0) {
//             spawnTimer.current = Math.max(CONFIG.MIN_SPAWN_INTERVAL, CONFIG.BASE_SPAWN_INTERVAL - (scoreAcc.current * 0.00012));
//             const z = CONFIG.SPAWN_DISTANCE;
//             const rand = Math.random();

//             const spawnObject = (lane, type) => {
//                 const index = poolData.current.findIndex(p => !p.active);
//                 if (index !== -1) {
//                     const obj = poolData.current[index];
//                     obj.active = true;
//                     obj.lane = lane;
//                     obj.z = z;
//                     obj.type = type;
//                     obj.id = Math.random(); // 🔥 새 ID 할당
//                     const laneX = LANES[lane];
//                     if(poolRefs.current[index]) {
//                         poolRefs.current[index].activate(type, laneX, z);
//                     }
//                 }
//             };

//             if (rand < CONFIG.ITEM_SPAWN_RATE) {
//                 const lane = Math.floor(Math.random() * CONFIG.LANE_COUNT);
//                 const itemRand = Math.random();
//                 let type = 'coin';
//                 if (itemRand < 0.05) type = 'shield';
//                 else if (itemRand < 0.10) type = 'slowmotion';
//                 else if (itemRand < 0.15) type = 'doublepoints';
//                 else if (itemRand < 0.22) type = 'magnet';
//                 else if (itemRand < 0.35) type = 'boost';
//                 spawnObject(lane, type);
//             } else {
//                 const count = Math.min(Math.floor(Math.random() * 3) + 1, CONFIG.LANE_COUNT - 1);
//                 const lanes = [];
//                 while (lanes.length < count) {
//                     const l = Math.floor(Math.random() * CONFIG.LANE_COUNT);
//                     if (!lanes.includes(l)) lanes.push(l);
//                 }
//                 lanes.forEach(l => {
//                     spawnObject(l, Math.random() > 0.6 ? 'barrier' : 'drum');
//                 });
//             }
//         }

//         const moveDist = speedRef.current * 55 * effectiveDelta;
//         const isInvincible = isBoosting || isRecovering;

//         // 풀 데이터 업데이트 및 충돌 처리
//         for (let i = 0; i < CONFIG.POOL_SIZE; i++) {
//             const obj = poolData.current[i];
//             if (!obj.active) continue;

//             obj.z += moveDist;

//             // 마그넷 (부드럽게)
//             if (hasMagnet && obj.type === 'coin' && obj.z > -15 && obj.z < 5) {
//                 const laneDiff = laneIndex - obj.lane;
//                 if (Math.abs(laneDiff) < 2.5) {
//                     obj.lane += Math.sign(laneDiff) * Math.min(Math.abs(laneDiff), effectiveDelta * 8); // 🔥 더 강하게
//                 }
//             }

//             // 시각적 위치 업데이트
//             if (poolRefs.current[i]) {
//                 poolRefs.current[i].updatePosition(obj.z);
                
//                 // X축 업데이트 (마그넷용)
//                 const x = typeof obj.lane === 'number' && Number.isInteger(obj.lane)
//                         ? LANES[obj.lane]
//                         : LANES[Math.floor(obj.lane)] + (obj.lane % 1) * CONFIG.LANE_WIDTH;
//                 poolRefs.current[i].setX(x);
//             }

//             // 🔥 충돌 체크 (ID 기반 중복 방지)
//             if (obj.z > -1.5 && obj.z < 1.5) {
//                 const laneDiff = Math.abs(LANES[Math.round(obj.lane)] - LANES[laneIndex]);
                
//                 if (laneDiff < 0.75 && !collectedItems.current.has(obj.id)) { // 🔥 ID 체크
//                     collectedItems.current.add(obj.id); // 🔥 수집 기록
                    
//                     if (obj.type === 'barrier' || obj.type === 'drum') {
//                         if (isInvincible) {
//                             obj.active = false;
//                             poolRefs.current[i].deactivate();
//                             onCoin(30); 
//                             audioManager.playSound('crash');
//                         } else if (hasShield) {
//                             obj.active = false;
//                             poolRefs.current[i].deactivate();
//                             removeShield();
//                             audioManager.playSound('shield');
//                         } else {
//                             audioManager.playSound('crash'); 
//                             onCrash();
//                         }
//                     } else {
//                         // 아이템 획득
//                         obj.active = false;
//                         poolRefs.current[i].deactivate();
                        
//                         if (obj.type === 'coin') {
//                             const comboBonus = Math.min(comboRef.current * 10, 100);
//                             onCoin((50 + comboBonus) * (doublePoints ? 2 : 1)); 
//                             audioManager.playSound('coin');
//                             comboRef.current++; 
//                             comboTimer.current = 2.5; 
//                             setCombo(comboRef.current);
//                             if (comboRef.current > 1) audioManager.playSound('combo');
//                         } else if (obj.type === 'magnet') { 
//                             onMagnet(); 
//                             audioManager.playSound('coin'); 
//                         } else if (obj.type === 'boost') { 
//                             onBoost(); // 🔥 부스터 중에도 획득 가능 (버그 수정)
//                             audioManager.playSound('boost'); 
//                         } else if (obj.type === 'shield') {
//                             onShield(); 
//                             audioManager.playSound('shield');
//                         } else if (obj.type === 'slowmotion') {
//                             onSlowMotion(); 
//                             audioManager.playSound('coin');
//                         } else if (obj.type === 'doublepoints') {
//                             onDoublePoints(); 
//                             audioManager.playSound('coin');
//                         }
//                     }
//                 }
//             }
            
//             // 화면 밖 비활성화
//             if (obj.z > 12) {
//                 obj.active = false;
//                 if(poolRefs.current[i]) poolRefs.current[i].deactivate();
//                 collectedItems.current.delete(obj.id); // 🔥 수집 기록 삭제
//             }
//         }
//     });

//     return (
//         <group>
//             <CyberpunkRoad speed={speedRef.current} theme={theme} />
//             <SideScenery speed={speedRef.current} theme={theme} />
//             <ThemeParticles theme={theme} speed={speedRef.current} />
//             <SpeedLines isBoosting={isBoosting} theme={theme} />
            
//             {Array.from({ length: CONFIG.POOL_SIZE }).map((_, i) => (
//                 <PooledGameEntity key={i} ref={el => poolRefs.current[i] = el} />
//             ))}
//         </group>
//     );
// };

// // ==================== 🎨 GAME UI ====================
// const GameUI = ({ score, speed, combo, isPlaying, isGameOver, onStart, onExit, finalScore, theme, hasMagnet, boostTime, isRecovering, hasShield, isSlowMotion, doublePoints, touchIndicator }) => {
//     const themeConfig = MAP_THEMES[theme];
    
//     const handleMove = (dir, e) => { 
//         if (e && e.cancelable) e.preventDefault(); 
//         window.dispatchEvent(new CustomEvent('moveLane', { detail: { dir } })); 
//     };

//     return (
//         <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none', display:'flex', flexDirection:'column', justifyContent:'space-between', fontFamily: "'Orbitron', 'Rajdhani', sans-serif", userSelect: 'none' }}>
//             <div style={{ padding: '15px 20px', background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${themeConfig.light}`, boxShadow: `0 0 20px ${themeConfig.light}50` }}>
//                 <div>
//                     <h1 style={{ margin: 0, color: themeConfig.light, fontSize: 'clamp(1rem, 4vw, 1.4rem)', fontWeight: 'bold', textShadow: `0 0 10px ${themeConfig.light}, 0 0 20px ${themeConfig.light}`, letterSpacing: '2px' }}>{themeConfig.name}</h1>
//                     <div style={{ color: '#fff', fontSize: 'clamp(1.2rem, 5vw, 1.8rem)', fontWeight: 'bold', marginTop: '5px', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>{speed} <span style={{ fontSize: '0.7em', opacity: 0.7 }}>KM/H</span></div>
//                 </div>
//                 <div style={{ textAlign: 'right' }}>
//                     <div style={{ fontSize: 'clamp(0.7rem, 3vw, 0.9rem)', color: '#aaa', letterSpacing: '1px' }}>SCORE</div>
//                     <div style={{ fontSize: 'clamp(1.5rem, 6vw, 2.2rem)', color: '#ffd700', fontWeight: 'bold', textShadow: '0 0 10px #ffd700' }}>{score.toLocaleString()}</div>
//                 </div>
//             </div>
            
//             <div style={{ position: 'absolute', top: '100px', left: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
//                 {combo > 1 && <div style={{ background: 'linear-gradient(135deg, #ff6b00, #ffa500)', padding: '8px 18px', borderRadius: '20px', color: '#fff', fontWeight: 'bold', fontSize: 'clamp(0.95rem, 3.8vw, 1.2rem)', textShadow: '0 2px 4px rgba(0,0,0,0.5)', boxShadow: '0 4px 15px rgba(255,107,0,0.6)', border: '2px solid #fff' }}>🔥 x{combo}</div>}
//                 {hasMagnet && <div style={{ background: 'linear-gradient(135deg, #ffd700, #ffaa00)', padding: '7px 14px', borderRadius: '18px', color: '#000', fontWeight: 'bold', fontSize: 'clamp(0.85rem, 3.3vw, 1.05rem)', boxShadow: '0 4px 15px rgba(255,215,0,0.6)', border: '2px solid #fff' }}>🧲 MAGNET</div>}
//                 {boostTime > 0 && <div style={{ background: 'linear-gradient(135deg, #00ffff, #0088ff)', padding: '7px 14px', borderRadius: '18px', color: '#fff', fontWeight: 'bold', fontSize: 'clamp(0.85rem, 3.3vw, 1.05rem)', boxShadow: '0 4px 15px rgba(0,255,255,0.6)', border: '2px solid #fff' }}>⚡ BOOST</div>}
//                 {isRecovering && <div style={{ background: 'linear-gradient(135deg, #ffff00, #ffaa00)', padding: '7px 14px', borderRadius: '18px', color: '#000', fontWeight: 'bold', fontSize: 'clamp(0.85rem, 3.3vw, 1.05rem)', boxShadow: '0 4px 15px rgba(255,255,0,0.6)', border: '2px solid #fff' }}>🛡️ SAFE</div>}
//                 {hasShield && <div style={{ background: 'linear-gradient(135deg, #00ff00, #00cc00)', padding: '7px 14px', borderRadius: '18px', color: '#fff', fontWeight: 'bold', fontSize: 'clamp(0.85rem, 3.3vw, 1.05rem)', boxShadow: '0 4px 15px rgba(0,255,0,0.6)', border: '2px solid #fff' }}>🛡️ SHIELD</div>}
//                 {isSlowMotion && <div style={{ background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)', padding: '7px 14px', borderRadius: '18px', color: '#fff', fontWeight: 'bold', fontSize: 'clamp(0.85rem, 3.3vw, 1.05rem)', boxShadow: '0 4px 15px rgba(156,39,176,0.6)', border: '2px solid #fff' }}>⏱️ SLOW</div>}
//                 {doublePoints && <div style={{ background: 'linear-gradient(135deg, #ff6600, #ff4400)', padding: '7px 14px', borderRadius: '18px', color: '#fff', fontWeight: 'bold', fontSize: 'clamp(0.85rem, 3.3vw, 1.05rem)', boxShadow: '0 4px 15px rgba(255,102,0,0.6)', border: '2px solid #fff' }}>💎 x2</div>}
//             </div>
            
//             {(!isPlaying || isGameOver) && (
//                 <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.95) 100%)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', pointerEvents: 'auto' }}>
//                     {isGameOver ? (
//                         <>
//                             <h1 style={{ fontSize: 'clamp(3rem, 12vw, 5rem)', color: '#e74c3c', margin: 0, textShadow: '0 0 30px #e74c3c, 5px 5px 0 #000', fontWeight: 'bold', animation: 'shake 0.5s' }}>CRASH!</h1>
//                             <h2 style={{ color: '#fff', marginTop: '20px', fontSize: 'clamp(1.2rem, 5vw, 1.8rem)' }}>FINAL SCORE: <span style={{ color: '#ffd700' }}>{finalScore.toLocaleString()}</span></h2>
//                             <button onClick={onStart} style={buttonStyle(themeConfig.light)}>🔄 RETRY</button>
//                         </>
//                     ) : (
//                         <>
//                             <div style={{ textAlign: 'center' }}>
//                                 <h1 style={{ fontSize: 'clamp(2.5rem, 10vw, 4rem)', color: '#fff', margin: 0, textShadow: '3px 3px 0 #000', fontWeight: 'bold' }}>HIGHWAY</h1>
//                                 <h1 style={{ fontSize: 'clamp(2.5rem, 10vw, 4rem)', color: '#ffd700', margin: 0, textShadow: '0 0 20px #ffd700, 3px 3px 0 #000', fontWeight: 'bold' }}>RUSH 5</h1>
//                                 <p style={{ color: '#ccc', fontSize: 'clamp(0.9rem, 3.5vw, 1.2rem)', marginTop: '20px', maxWidth: '400px', lineHeight: '1.6' }}>← → 키 또는 화면 터치로 차선 변경<br />장애물을 피하고 아이템을 수집하세요!</p>
//                             </div>
//                             <button onClick={onStart} style={buttonStyle(themeConfig.light)}>🏁 START ({CONFIG.PLAY_COST.toLocaleString()}P)</button>
//                         </>
//                     )}
//                     <button onClick={onExit} style={{ marginTop: '25px', background: 'none', border: 'none', color: '#888', fontSize: 'clamp(0.9rem, 3.5vw, 1.1rem)', textDecoration: 'underline', cursor: 'pointer', transition: 'color 0.3s' }} onMouseEnter={(e) => (e.target.style.color = '#fff')} onMouseLeave={(e) => (e.target.style.color = '#888')}>← EXIT GAME</button>
//                 </div>
//             )}
//             {isPlaying && !isGameOver && (
//                 <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '100%', display: 'flex', pointerEvents: 'auto' }}>
//                     <div style={{ flex: 1, background: touchIndicator === 'left' ? 'rgba(255,255,255,0.1)' : 'transparent', transition: 'background 0.1s', borderRight: '1px solid rgba(255,255,255,0.1)' }} onPointerDown={(e) => handleMove('left', e)} />
//                     <div style={{ flex: 1, background: touchIndicator === 'right' ? 'rgba(255,255,255,0.1)' : 'transparent', transition: 'background 0.1s', borderLeft: '1px solid rgba(255,255,255,0.1)' }} onPointerDown={(e) => handleMove('right', e)} />
//                 </div>
//             )}
//         </div>
//     );
// };

// const buttonStyle = (accentColor) => ({ 
//     padding: 'clamp(12px, 3vw, 18px) clamp(40px, 10vw, 70px)', 
//     fontSize: 'clamp(1.2rem, 5vw, 2rem)', 
//     background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, 
//     color: '#000', 
//     border: '3px solid #fff', 
//     borderRadius: '50px', 
//     fontWeight: 'bold', 
//     cursor: 'pointer', 
//     boxShadow: `0 8px 0 ${accentColor}88, 0 10px 25px rgba(0,0,0,0.5)`, 
//     marginTop: '35px', 
//     transition: 'transform 0.1s, box-shadow 0.1s', 
//     fontFamily: "'Orbitron', sans-serif", 
//     letterSpacing: '2px', 
//     textShadow: '1px 1px 2px rgba(0,0,0,0.3)' 
// });

// const MuteButton = ({ isMuted, toggleMute }) => (
//     <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} style={{ position: 'absolute', top: '90px', right: '20px', background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(10px)', border: '2px solid #555', borderRadius: '50%', width: '50px', height: '50px', color: 'white', fontSize: '1.5rem', cursor: 'pointer', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>{isMuted ? '🔇' : '🔊'}</button>
// );

// const LeaderBoard = memo(({ ranks, theme }) => {
//     const themeConfig = MAP_THEMES[theme];
//     return (
//         <div style={{ width: '100%', maxWidth: '600px', background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%)', padding: '25px', borderRadius: '20px', border: `3px solid ${themeConfig.light}`, boxShadow: `0 0 30px ${themeConfig.light}50`, color: 'white', marginTop: '25px', marginBottom: '25px', fontFamily: "'Orbitron', sans-serif" }}>
//             <h3 style={{ textAlign: 'center', margin: '0 0 20px 0', color: themeConfig.light, fontSize: 'clamp(1.3rem, 5vw, 1.8rem)', borderBottom: `2px solid ${themeConfig.accent}`, paddingBottom: '15px', textShadow: `0 0 10px ${themeConfig.light}` }}>🏆 TOP 10 DRIVERS</h3>
//             {ranks.length === 0 ? <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>Loading Rankings...</div> : <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>{ranks.map((r, i) => (<li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', borderBottom: '1px solid #333', background: i < 3 ? 'rgba(255,215,0,0.1)' : 'transparent', borderRadius: '8px', marginBottom: '8px' }}><span style={{ color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#ccc', fontWeight: i < 3 ? 'bold' : 'normal', fontSize: 'clamp(1rem, 4vw, 1.2rem)', minWidth: '40px' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span><span style={{ flex: 1, marginLeft: '15px', fontSize: 'clamp(0.9rem, 3.5vw, 1.1rem)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span><span style={{ fontWeight: 'bold', color: themeConfig.light, fontSize: 'clamp(1rem, 4vw, 1.3rem)', textShadow: `0 0 5px ${themeConfig.light}` }}>{r.score.toLocaleString()}</span></li>))}</ul>}
//         </div>
//     );
// });

// // ==================== 🚀 MAIN COMPONENT ====================
// export default function HighwayGame() {
//     const [isPlaying, setIsPlaying] = useState(false);
//     const [isGameOver, setIsGameOver] = useState(false);
//     const [isCrashed, setIsCrashed] = useState(false);
//     const [score, setScore] = useState(0);
//     const [speedDisplay, setSpeedDisplay] = useState(0);
//     const [finalScore, setFinalScore] = useState(0);
//     const [combo, setCombo] = useState(0);
//     const [lane, setLane] = useState(2);
//     const [boostTime, setBoostTime] = useState(0);
//     const [magnetTime, setMagnetTime] = useState(0);
//     const [shieldActive, setShieldActive] = useState(false);
//     const [slowMotionTime, setSlowMotionTime] = useState(0);
//     const [doublePointsTime, setDoublePointsTime] = useState(0);
//     const [isRecovering, setIsRecovering] = useState(false);
//     const [theme, setTheme] = useState('city');
//     const [ranks, setRanks] = useState([]);
//     const [playerName, setPlayerName] = useState('Driver');
//     const [isMuted, setIsMuted] = useState(false);
//     const [touchIndicator, setTouchIndicator] = useState(null);

//     const navigate = useNavigate();
//     const user = auth.currentUser;
//     const prevBoostTime = useRef(0);

//     useEffect(() => { 
//         window.scrollTo(0, 0); 
//         if (!user) navigate('/login'); 
//     }, [user, navigate]);

//     useEffect(() => {
//         const handleVisibilityChange = () => {
//             if (document.hidden && isPlaying && !isGameOver) {
//                 handleGameOver();
//                 alert("🚫 게임 중 탭을 이동하여 게임이 종료되었습니다.");
//             }
//         };
//         document.addEventListener('visibilitychange', handleVisibilityChange);
//         return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
//     }, [isPlaying, isGameOver]);

//     useEffect(() => {
//         const fetchUserData = async () => {
//             if (user) {
//                 try {
//                     const snap = await getDoc(doc(db, 'users', user.uid));
//                     if (snap.exists() && snap.data().name) setPlayerName(snap.data().name);
//                     else setPlayerName(user.email.split('@')[0]);
//                 } catch (e) { setPlayerName(user.email.split('@')[0]); }
//             }
//         };
//         fetchUserData();
//         fetchLeaderboard().then(setRanks);
//     }, [user]);
//     useEffect(() => { if (isGameOver || !isPlaying) fetchLeaderboard().then(setRanks); }, [isGameOver, isPlaying]);
    
//     useEffect(() => {
//         const handleKey = (e) => {
//             if (!isPlaying || isGameOver) return;
//             if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
            
//             if (e.key === 'ArrowLeft') {
//                 setLane((l) => Math.max(0, l - 1));
//                 audioManager.playSound('move');
//                 setTouchIndicator('left'); setTimeout(() => setTouchIndicator(null), 100);
//             }
//             if (e.key === 'ArrowRight') {
//                 setLane((l) => Math.min(CONFIG.LANE_COUNT - 1, l + 1));
//                 audioManager.playSound('move');
//                 setTouchIndicator('right'); setTimeout(() => setTouchIndicator(null), 100);
//             }
//         };

//         const handleMoveLane = (e) => {
//             if (!isPlaying || isGameOver) return;
//             const dir = e.detail.dir;
//             if (dir === 'left') setLane((l) => Math.max(0, l - 1));
//             if (dir === 'right') setLane((l) => Math.min(CONFIG.LANE_COUNT - 1, l + 1));
            
//             audioManager.playSound('move');
//             setTouchIndicator(dir); 
//             setTimeout(() => setTouchIndicator(null), 100);
//             if (window.navigator.vibrate) window.navigator.vibrate(50);
//         };
        
//         window.addEventListener('keydown', handleKey, { passive: false });
//         window.addEventListener('moveLane', handleMoveLane);
//         return () => { 
//             window.removeEventListener('keydown', handleKey); 
//             window.removeEventListener('moveLane', handleMoveLane); 
//         };
//     }, [isPlaying, isGameOver]);

//     useEffect(() => { if (boostTime > 0) { const timer = setTimeout(() => setBoostTime((time) => Math.max(0, time - 0.1)), 100); return () => clearTimeout(timer); } }, [boostTime]);
//     useEffect(() => { if (prevBoostTime.current > 0 && boostTime <= 0 && isPlaying) setIsRecovering(true); prevBoostTime.current = boostTime; }, [boostTime, isPlaying]);
//     useEffect(() => { if (isRecovering) { const timer = setTimeout(() => setIsRecovering(false), 2000); return () => clearTimeout(timer); } }, [isRecovering]);
//     useEffect(() => { if (magnetTime > 0) { const timer = setTimeout(() => setMagnetTime((time) => Math.max(0, time - 0.1)), 100); return () => clearTimeout(timer); } }, [magnetTime]);
//     useEffect(() => { if (slowMotionTime > 0) { const timer = setTimeout(() => setSlowMotionTime((time) => Math.max(0, time - 0.1)), 100); return () => clearTimeout(timer); } }, [slowMotionTime]);
//     useEffect(() => { if (doublePointsTime > 0) { const timer = setTimeout(() => setDoublePointsTime((time) => Math.max(0, time - 0.1)), 100); return () => clearTimeout(timer); } }, [doublePointsTime]);
//     useEffect(() => { audioManager.setMuted(isMuted); }, [isMuted]);

//     const handleStart = async () => {
//         if (window.navigator.vibrate) window.navigator.vibrate(200);
        
//         try { 
//             const userRef = doc(db, 'users', user.uid);
//             const userSnap = await getDoc(userRef);
//             const currentPoint = userSnap.data()?.point || 0;

//             if (currentPoint < CONFIG.PLAY_COST) {
//                 alert(`포인트가 부족합니다! (보유: ${currentPoint.toLocaleString()}P, 필요: ${CONFIG.PLAY_COST.toLocaleString()}P)`);
//                 return;
//             }

//             await updateDoc(userRef, { point: increment(-CONFIG.PLAY_COST) });
//             await addDoc(collection(db, "history"), {
//                 uid: user.uid,
//                 type: "게임",
//                 msg: `🏎️ 하이웨이 러쉬 시작`,
//                 amount: -CONFIG.PLAY_COST,
//                 createdAt: serverTimestamp()
//             });
//         } catch (e) { 
//             console.error('Start game failed:', e);
//             alert("게임 시작 중 오류가 발생했습니다.");
//             return;
//         }

//         const themes = Object.keys(MAP_THEMES);
//         setTheme(themes[Math.floor(Math.random() * themes.length)]);
//         setIsPlaying(true);
//         setIsGameOver(false);
//         setIsCrashed(false);
//         setScore(0);
//         setCombo(0);
//         setLane(2);
//         setBoostTime(0);
//         setMagnetTime(0);
//         setShieldActive(false);
//         setSlowMotionTime(0);
//         setDoublePointsTime(0);
//         setIsRecovering(false);
//         audioManager.startEngine();
//     };

//     const handleGameOver = () => {
//         if (isGameOver) return;
//         setIsPlaying(false);
//         setIsGameOver(true);
//         setIsCrashed(true);
//         setFinalScore(score);
//         audioManager.stopEngine();
//         if (window.navigator.vibrate) window.navigator.vibrate([200, 100, 200]);
        
//         if (score > 0) {
//             updateDoc(doc(db, 'users', user.uid), { point: increment(score) }).catch((e) => console.error('Point update failed:', e));
            
//             addDoc(collection(db, "history"), {
//                 uid: user.uid,
//                 type: "게임",
//                 msg: `🏁 하이웨이 러쉬 보상`,
//                 amount: score,
//                 createdAt: serverTimestamp()
//             }).catch(e => console.error(e));

//             updateRanking(user, score, playerName);
//         }
//         setTimeout(() => setIsCrashed(false), 1500);
//     };

//     return (
//         <div style={{ width: '100vw', minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #0f0f1e 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', touchAction: 'none', padding: '15px 0', overflow: 'hidden' }}>
//             <div style={{ width: '100%', maxWidth: '600px', height: '90dvh', maxHeight: '900px', position: 'relative', overflow: 'hidden', boxShadow: `0 0 60px ${MAP_THEMES[theme].light}80`, border: `4px solid ${MAP_THEMES[theme].light}`, borderRadius: '30px', background: '#000' }}>
//                 <MuteButton isMuted={isMuted} toggleMute={() => setIsMuted(!isMuted)} />
//                 <GameUI 
//                     score={score} 
//                     speed={speedDisplay} 
//                     combo={combo} 
//                     isPlaying={isPlaying} 
//                     isGameOver={isGameOver} 
//                     finalScore={finalScore} 
//                     onStart={handleStart} 
//                     onExit={() => navigate('/home')} 
//                     theme={theme} 
//                     hasMagnet={magnetTime > 0} 
//                     boostTime={boostTime} 
//                     isRecovering={isRecovering} 
//                     hasShield={shieldActive}
//                     isSlowMotion={slowMotionTime > 0}
//                     doublePoints={doublePointsTime > 0}
//                     touchIndicator={touchIndicator} 
//                 />
//                 <Canvas 
//                     shadows 
//                     dpr={[1, window.innerWidth < 768 ? 1.5 : 2]} 
//                     gl={{ 
//                         antialias: true, 
//                         alpha: false, 
//                         powerPreference: 'high-performance',
//                         stencil: false,
//                         depth: true
//                     }}
//                     frameloop="always"
//                 >
//                     <Suspense fallback={null}>
//                         <PerspectiveCamera makeDefault position={[0, 9, 16]} fov={60} />
//                         <DynamicCamera isBoosting={boostTime > 0} isRecovering={isRecovering} isCrashed={isCrashed} />
//                         <color attach="background" args={[MAP_THEMES[theme].sky]} />
//                         <fog attach="fog" args={[MAP_THEMES[theme].fog, 90, 250]} />
//                         <ambientLight intensity={0.6} />
//                         <directionalLight 
//                             position={[15, 60, 30]} 
//                             intensity={1.8} 
//                             castShadow 
//                             shadow-mapSize={[2048, 2048]} 
//                             shadow-camera-left={-50} 
//                             shadow-camera-right={50} 
//                             shadow-camera-top={50} 
//                             shadow-camera-bottom={-50} 
//                         />
//                         {theme === 'city' || theme === 'hell' || theme === 'ocean' ? 
//                             <Stars radius={120} depth={60} count={1500} factor={5} saturation={0} fade /> : 
//                             <Sky sunPosition={theme === 'heaven' ? [0, 50, 0] : [100, 25, 100]} turbidity={theme === 'desert' ? 10 : 0.5} />
//                         }
//                         {!isCrashed && <SuperCar laneIndex={lane} isBoosting={boostTime > 0} isRecovering={isRecovering} hasMagnet={magnetTime > 0} hasShield={shieldActive} theme={theme} />}
//                         {isCrashed && <ExplosionEffect position={[LANES[lane], 0.5, 0]} />}
//                         <WorldController 
//                             isPlaying={isPlaying} 
//                             laneIndex={lane} 
//                             isBoosting={boostTime > 0} 
//                             isRecovering={isRecovering} 
//                             hasMagnet={magnetTime > 0} 
//                             hasShield={shieldActive}
//                             isSlowMotion={slowMotionTime > 0}
//                             doublePoints={doublePointsTime > 0}
//                             setScore={setScore} 
//                             setSpeedDisplay={setSpeedDisplay} 
//                             setCombo={setCombo} 
//                             onCrash={handleGameOver} 
//                             onCoin={() => {}} 
//                             onBoost={() => { setBoostTime((prev) => prev + 3.5); if (window.navigator.vibrate) window.navigator.vibrate(200); }} 
//                             onMagnet={() => { setMagnetTime((prev) => prev + 6.0); if (window.navigator.vibrate) window.navigator.vibrate(100); }} 
//                             onShield={() => { setShieldActive(true); if (window.navigator.vibrate) window.navigator.vibrate(100); }}
//                             onSlowMotion={() => { setSlowMotionTime((prev) => prev + 5.0); if (window.navigator.vibrate) window.navigator.vibrate(100); }}
//                             onDoublePoints={() => { setDoublePointsTime((prev) => prev + 7.0); if (window.navigator.vibrate) window.navigator.vibrate(100); }}
//                             removeShield={() => setShieldActive(false)}
//                             theme={theme} 
//                             audioManager={audioManager} 
//                         />
//                         <EffectComposer disableNormalPass>
//                             <Bloom luminanceThreshold={0.7} luminanceSmoothing={0.9} intensity={1.2} mipmapBlur />
//                             <Vignette eskil={false} offset={0.15} darkness={0.6} />
//                             <ChromaticAberration offset={[0.0015, 0.0015]} />
//                             {isCrashed && <DepthOfField focusDistance={0.01} focalLength={0.05} bokehScale={8} />}
//                         </EffectComposer>
//                     </Suspense>
//                 </Canvas>
//             </div>
//             <LeaderBoard ranks={ranks} theme={theme} />
//             <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet" />
//             <style>{`@keyframes pulse { from { transform: scale(1); } to { transform: scale(1.05); } } @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }`}</style>
//         </div>
//     );
// }

import React, { useState, useEffect, useRef, Suspense, useMemo, memo, useImperativeHandle, forwardRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Sky, Trail, Float, Stars, RoundedBox } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration, DepthOfField } from '@react-three/postprocessing';
import * as THREE from 'three';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, increment, setDoc, collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// ==================== ⚙️ GAME CONFIG ====================
const CONFIG = {
    PLAY_COST: 10000,
    LANE_COUNT: 5,
    LANE_WIDTH: 2.2,
    START_SPEED: 1.5,
    MAX_SPEED: 5.0,
    BOOST_MULTIPLIER: 2.2,
    SPAWN_DISTANCE: -280,
    ITEM_SPAWN_RATE: 0.30,
    BASE_SPAWN_INTERVAL: 1.4,
    MIN_SPAWN_INTERVAL: 0.4,
    POOL_SIZE: 80,
    MAX_DELTA: 0.033,
};

const LANES = Array.from({ length: CONFIG.LANE_COUNT }, (_, i) => 
    (i - Math.floor(CONFIG.LANE_COUNT / 2)) * CONFIG.LANE_WIDTH
);

// ==================== 🎵 AUDIO SYSTEM ====================
class AudioManager {
    constructor() {
        this.ctx = null;
        this.engineOsc = null;
        this.engineGain = null;
        this.isMuted = false;
        this.soundQueue = [];
        this.lastSoundTime = {};
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    startEngine() {
        this.init();
        if (this.engineOsc || this.isMuted) return;
        
        this.engineOsc = this.ctx.createOscillator();
        this.engineGain = this.ctx.createGain();
        
        this.engineOsc.type = 'sawtooth';
        this.engineOsc.frequency.value = 60;
        this.engineGain.gain.value = 0.05;
        
        this.engineOsc.connect(this.engineGain);
        this.engineGain.connect(this.ctx.destination);
        this.engineOsc.start();
    }

    updateEngine(speed, isBoosting) {
        if (!this.engineOsc || this.isMuted) return;
        const baseFreq = 60 + (speed * 15);
        const targetFreq = isBoosting ? baseFreq * 1.5 : baseFreq;
        this.engineOsc.frequency.exponentialRampToValueAtTime(
            targetFreq, 
            this.ctx.currentTime + 0.1
        );
        this.engineGain.gain.value = isBoosting ? 0.08 : 0.05;
    }

    stopEngine() {
        if (this.engineOsc) {
            this.engineOsc.stop();
            this.engineOsc = null;
            this.engineGain = null;
        }
    }

    playSound(type) {
        this.init();
        if (this.isMuted) return;

        const now = performance.now();
        if (this.lastSoundTime[type] && now - this.lastSoundTime[type] < 50) return;
        this.lastSoundTime[type] = now;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        const ct = this.ctx.currentTime;

        switch(type) {
            case 'move':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, ct);
                osc.frequency.exponentialRampToValueAtTime(800, ct + 0.08);
                gain.gain.setValueAtTime(0.12, ct);
                gain.gain.exponentialRampToValueAtTime(0.001, ct + 0.08);
                osc.start(ct);
                osc.stop(ct + 0.08);
                break;
            case 'coin':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1400, ct);
                osc.frequency.exponentialRampToValueAtTime(2200, ct + 0.15);
                gain.gain.setValueAtTime(0.15, ct);
                gain.gain.exponentialRampToValueAtTime(0.001, ct + 0.25);
                osc.start(ct);
                osc.stop(ct + 0.25);
                break;
            case 'boost':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, ct);
                osc.frequency.linearRampToValueAtTime(300, ct + 0.4);
                gain.gain.setValueAtTime(0.25, ct);
                gain.gain.linearRampToValueAtTime(0.001, ct + 0.4);
                osc.start(ct);
                osc.stop(ct + 0.4);
                break;
            case 'crash':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, ct);
                osc.frequency.exponentialRampToValueAtTime(20, ct + 0.8);
                gain.gain.setValueAtTime(0.4, ct);
                gain.gain.exponentialRampToValueAtTime(0.001, ct + 0.8);
                osc.start(ct);
                osc.stop(ct + 0.8);
                break;
            case 'combo':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(800, ct);
                osc.frequency.exponentialRampToValueAtTime(1600, ct + 0.12);
                gain.gain.setValueAtTime(0.1, ct);
                gain.gain.exponentialRampToValueAtTime(0.001, ct + 0.12);
                osc.start(ct);
                osc.stop(ct + 0.12);
                break;
            case 'shield':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, ct);
                osc.frequency.exponentialRampToValueAtTime(1200, ct + 0.2);
                gain.gain.setValueAtTime(0.2, ct);
                gain.gain.exponentialRampToValueAtTime(0.001, ct + 0.3);
                osc.start(ct);
                osc.stop(ct + 0.3);
                break;
        }
    }

    setMuted(muted) {
        this.isMuted = muted;
        if (muted) this.stopEngine();
    }
}

const audioManager = new AudioManager();

// ==================== 🎨 MAP THEMES ====================
const MAP_THEMES = {
    city: { name: 'NEON METROPOLIS', sky: '#0a0015', road: '#0d0d1a', fog: '#1a0033', light: '#00ffff', accent: '#ff00ff', skybox: 'night' },
    desert: { name: 'SUNSET WASTELAND', sky: '#ff6b35', road: '#4a3228', fog: '#ff8c42', light: '#ffaa00', accent: '#ff4500', skybox: 'sunset' },
    snow: { name: 'FROZEN HORIZON', sky: '#b8e6f0', road: '#e8f4f8', fog: '#d4e9f7', light: '#ffffff', accent: '#4fc3f7', skybox: 'dawn' },
    hell: { name: 'INFERNO HIGHWAY', sky: '#330000', road: '#1a0505', fog: '#4d0000', light: '#ff0000', accent: '#ff6600', skybox: 'night' },
    sky: { name: 'CLOUD KINGDOM', sky: '#87CEEB', road: '#f0f8ff', fog: '#b0d4f1', light: '#ffffff', accent: '#4dd0e1', skybox: 'day' },
    heaven: { name: 'DIVINE PATHWAY', sky: '#fff9e6', road: '#ffffff', fog: '#fffacd', light: '#ffd700', accent: '#ffeb3b', skybox: 'sunset' },
    ocean: { name: 'DEEP ABYSS', sky: '#001a33', road: '#000d1a', fog: '#002244', light: '#00bcd4', accent: '#0097a7', skybox: 'night' }
};

const updateRanking = async (user, newScore, playerName) => {
    if (!user || newScore <= 0) return;
    const rankRef = doc(db, "highway_ranks", user.uid);
    try {
        const docSnap = await getDoc(rankRef);
        const shouldUpdate = !docSnap.exists() || (docSnap.exists() && newScore > docSnap.data().score);
        if (shouldUpdate) {
            await setDoc(rankRef, { name: playerName, score: newScore, timestamp: Date.now() }, { merge: true });
        }
    } catch (e) { console.error('Ranking update failed:', e); }
};

const fetchLeaderboard = async () => {
    try {
        const q = query(collection(db, "highway_ranks"), orderBy("score", "desc"), limit(10));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) { return []; }
};

// ==================== 🚙 POOLED OBJECT COMPONENT ====================
const PooledGameEntity = forwardRef((props, ref) => {
    const groupRef = useRef();
    const meshRef = useRef();
    const stateRef = useRef({ type: null, visible: false, rotationSpeed: 0 });

    useImperativeHandle(ref, () => ({
        activate: (newType, x, z) => {
            stateRef.current.type = newType;
            stateRef.current.visible = true;
            stateRef.current.rotationSpeed = 0.03 + Math.random() * 0.02;
            if (groupRef.current) {
                groupRef.current.position.set(x, 0, z);
                groupRef.current.visible = true;
            }
        },
        deactivate: () => {
            stateRef.current.visible = false;
            if (groupRef.current) groupRef.current.visible = false;
        },
        isActive: () => stateRef.current.visible,
        updatePosition: (z) => {
            if (groupRef.current) groupRef.current.position.z = z;
        },
        setX: (x) => {
            if (groupRef.current) groupRef.current.position.x = x;
        },
        getPosition: () => groupRef.current ? groupRef.current.position : new THREE.Vector3(),
        getType: () => stateRef.current.type
    }));

    useFrame(() => {
        if (!stateRef.current.visible || !meshRef.current) return;
        const type = stateRef.current.type;
        if (type === 'coin' || type === 'boost' || type === 'shield' || type === 'magnet' || type === 'slowmotion' || type === 'doublepoints') {
            meshRef.current.rotation.y += stateRef.current.rotationSpeed;
        }
    });

    if (!stateRef.current.visible) return <group ref={groupRef} visible={false} />;

    const type = stateRef.current.type;

    return (
        <group ref={groupRef}>
            {type === 'coin' && (
                <Float speed={6} rotationIntensity={2} floatIntensity={0.4}>
                    <group position={[0, 0.6, 0]} ref={meshRef}>
                        <mesh rotation={[Math.PI/2, 0, 0]}>
                            <cylinderGeometry args={[0.5, 0.5, 0.1, 24]} />
                            <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={1.2} metalness={0.9} roughness={0.1} />
                        </mesh>
                        <pointLight color="#ffd700" intensity={1.5} distance={3} />
                    </group>
                </Float>
            )}
            {type === 'boost' && (
                <Float speed={8} rotationIntensity={4} floatIntensity={0.6}>
                    <group position={[0, 0.6, 0]} ref={meshRef}>
                        <mesh>
                            <octahedronGeometry args={[0.55, 0]} />
                            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={3} toneMapped={false} />
                        </mesh>
                        <pointLight color="#00ffff" intensity={4} distance={6} />
                    </group>
                </Float>
            )}
            {type === 'magnet' && (
                <Float speed={5} rotationIntensity={2} floatIntensity={0.5}>
                    <group position={[0, 0.6, 0]} ref={meshRef}>
                        <mesh rotation={[0, 0, Math.PI]}>
                            <torusGeometry args={[0.45, 0.15, 12, 24, Math.PI]} />
                            <meshStandardMaterial color="#e74c3c" metalness={0.8} />
                        </mesh>
                        <mesh>
                            <torusGeometry args={[0.45, 0.15, 12, 24, Math.PI]} />
                            <meshStandardMaterial color="#3498db" metalness={0.8} />
                        </mesh>
                        <pointLight color="#ffd700" intensity={1.5} distance={4} />
                    </group>
                </Float>
            )}
            {type === 'shield' && (
                <Float speed={7} rotationIntensity={3} floatIntensity={0.6}>
                    <group position={[0, 0.6, 0]} ref={meshRef}>
                        <mesh>
                            <dodecahedronGeometry args={[0.55, 0]} />
                            <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={2.5} metalness={0.9} roughness={0.1} />
                        </mesh>
                        <pointLight color="#00ff00" intensity={3} distance={5} />
                    </group>
                </Float>
            )}
            {type === 'slowmotion' && (
                <Float speed={6} rotationIntensity={3} floatIntensity={0.5}>
                    <group position={[0, 0.6, 0]} ref={meshRef}>
                        <mesh>
                            <icosahedronGeometry args={[0.55, 0]} />
                            <meshStandardMaterial color="#9c27b0" emissive="#9c27b0" emissiveIntensity={2.5} metalness={0.9} roughness={0.1} />
                        </mesh>
                        <pointLight color="#9c27b0" intensity={3} distance={5} />
                    </group>
                </Float>
            )}
            {type === 'doublepoints' && (
                <Float speed={7} rotationIntensity={3} floatIntensity={0.6}>
                    <group position={[0, 0.6, 0]} ref={meshRef}>
                        <mesh>
                            <octahedronGeometry args={[0.55, 0]} />
                            <meshStandardMaterial color="#ff6600" emissive="#ff6600" emissiveIntensity={2.5} metalness={0.9} roughness={0.1} />
                        </mesh>
                        <pointLight color="#ff6600" intensity={3} distance={5} />
                    </group>
                </Float>
            )}
            {type === 'barrier' && (
                <group position={[0, 0.5, 0]}>
                    <mesh castShadow>
                        <boxGeometry args={[1.5, 0.8, 0.2]} />
                        <meshStandardMaterial color="#f1c40f" metalness={0.3} roughness={0.7} />
                    </mesh>
                    {[-0.25, 0.25].map((x, i) => (
                        <mesh key={i} position={[x, 0, 0.11]}>
                            <boxGeometry args={[0.25, 0.7, 0.02]} />
                            <meshBasicMaterial color="#000000" />
                        </mesh>
                    ))}
                </group>
            )}
            {type === 'drum' && (
                <group position={[0, 0.6, 0]}>
                    <mesh castShadow>
                        <cylinderGeometry args={[0.4, 0.4, 1.2, 12]} />
                        <meshStandardMaterial color="#c0392b" metalness={0.4} roughness={0.6} />
                    </mesh>
                    <mesh position={[0, 0.35, 0]}>
                        <cylinderGeometry args={[0.42, 0.42, 0.25, 12]} />
                        <meshBasicMaterial color="#ffffff" />
                    </mesh>
                </group>
            )}
        </group>
    );
});

// ==================== 🚗 SUPER CAR ====================
const SuperCar = memo(({ laneIndex, isBoosting, isRecovering, hasMagnet, hasShield, theme }) => {
    const meshRef = useRef();
    const currentX = useRef(0);
    const shieldRef = useRef();
    const wheelRefs = [useRef(), useRef(), useRef(), useRef()];
    const glowRef = useRef();

    const carColor = useMemo(() => {
        if (isBoosting) return '#ff0066';
        if (theme === 'heaven') return '#ffd700';
        if (theme === 'hell') return '#cc0000';
        if (theme === 'ocean') return '#00bcd4';
        return '#00d4ff';
    }, [isBoosting, theme]);

    useFrame((state, delta) => {
        const safeDelta = Math.min(delta, CONFIG.MAX_DELTA);
        const targetX = LANES[laneIndex];
        
        currentX.current = THREE.MathUtils.lerp(currentX.current, targetX, 18 * safeDelta);

        if (meshRef.current) {
            meshRef.current.position.x = currentX.current;
            meshRef.current.rotation.z = (targetX - currentX.current) * 0.15;
            meshRef.current.rotation.y = (targetX - currentX.current) * -0.08;
            if (isBoosting) {
                meshRef.current.position.y = 0.35 + Math.sin(state.clock.elapsedTime * 15) * 0.04;
            } else {
                meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 0.3, safeDelta * 4);
            }
        }
        
        const wheelSpeed = safeDelta * (isBoosting ? 35 : 18);
        wheelRefs.forEach(ref => {
            if (ref.current) ref.current.rotation.y += wheelSpeed;
        });
        
        if (shieldRef.current) {
            shieldRef.current.rotation.y += safeDelta * 3;
            shieldRef.current.rotation.z += safeDelta * 1.5;
        }
        
        if (glowRef.current) {
            glowRef.current.intensity = isBoosting ? 8 : 4;
        }
    });

    return (
        <group ref={meshRef} position={[0, 0.3, 0]}>
            {(isRecovering || isBoosting || hasShield) && (
                <group ref={shieldRef}>
                    <mesh>
                        <sphereGeometry args={[1.6, 16, 16]} />
                        <meshBasicMaterial 
                            color={hasShield ? '#00ff00' : isBoosting ? '#00ffff' : '#ffaa00'} 
                            transparent 
                            opacity={0.12} 
                            wireframe 
                        />
                    </mesh>
                </group>
            )}
            {hasMagnet && (
                <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
                    <mesh><ringGeometry args={[1.8, 2.2, 32]} /><meshBasicMaterial color="#ffd700" transparent opacity={0.4} /></mesh>
                </group>
            )}
            <group>
                <RoundedBox args={[1.1, 0.25, 2.5]} radius={0.08} smoothness={4}>
                    <meshStandardMaterial color="#0a0a0a" metalness={0.9} roughness={0.1} />
                </RoundedBox>
                <RoundedBox args={[1.15, 0.18, 1.8]} radius={0.1} smoothness={4} position={[0, 0.4, -0.1]}>
                    <meshStandardMaterial 
                        color={carColor} 
                        metalness={0.95} 
                        roughness={0.05} 
                        emissive={carColor} 
                        emissiveIntensity={isBoosting ? 0.4 : 0.15} 
                    />
                </RoundedBox>
                <mesh position={[0, 0.58, -0.25]} rotation={[0.15, 0, 0]}>
                    <boxGeometry args={[0.65, 0.2, 1.0]} />
                    <meshPhysicalMaterial color="#000000" metalness={1} roughness={0} transmission={0.5} />
                </mesh>
                <mesh position={[0, 0.25, -1.3]}>
                    <boxGeometry args={[0.8, 0.15, 0.1]} />
                    <meshStandardMaterial 
                        color={isBoosting ? '#ff0066' : '#ffffff'} 
                        emissive={isBoosting ? '#ff0066' : '#ffffff'} 
                        emissiveIntensity={isBoosting ? 1.5 : 0.8} 
                    />
                </mesh>
                {[[-0.65, 0.1, 0.9], [0.65, 0.1, 0.9], [-0.7, 0.1, -0.9], [0.7, 0.1, -0.9]].map((pos, i) => (
                    <group key={i} position={pos} ref={wheelRefs[i]}>
                        <mesh rotation={[0, 0, Math.PI / 2]}>
                            <cylinderGeometry args={[0.35, 0.35, 0.35, 16]} />
                            <meshStandardMaterial color="#0a0a0a" metalness={0.6} />
                        </mesh>
                    </group>
                ))}
                <pointLight ref={glowRef} position={[0, -0.2, 0]} color={carColor} intensity={4} distance={6} />
            </group>
            {isBoosting && (
                <Trail width={3} length={18} color='#ff0066' attenuation={(t) => t * t}>
                    <mesh position={[0, 0.2, 1.5]}>
                        <sphereGeometry args={[0.08, 6, 6]} />
                        <meshBasicMaterial color='#ff0066' />
                    </mesh>
                </Trail>
            )}
        </group>
    );
});

// ==================== 🌟 SPEED LINES ====================
const SpeedLines = memo(({ isBoosting, theme }) => {
    const groupRef = useRef();
    const lines = useMemo(() => Array.from({ length: 30 }, () => ({ 
        x: (Math.random() - 0.5) * 50, 
        y: Math.random() * 15 + 1, 
        z: Math.random() * 40 - 50, 
        length: Math.random() * 10 + 6, 
        speed: 0.7 + Math.random() * 0.3 
    })), []);
    
    useFrame((state, delta) => {
        if (!isBoosting || !groupRef.current) return;
        const safeDelta = Math.min(delta, CONFIG.MAX_DELTA);
        const children = groupRef.current.children;
        for (let i = 0; i < children.length; i++) {
            children[i].position.z += 120 * safeDelta * lines[i].speed;
            if (children[i].position.z > 15) children[i].position.z = -50;
        }
    });
    
    if (!isBoosting) return null;
    
    return (
        <group ref={groupRef}>
            {lines.map((line, i) => (
                <mesh key={i} position={[line.x, line.y, line.z]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.03, 0.03, line.length, 6]} />
                    <meshBasicMaterial color={MAP_THEMES[theme]?.light || '#ffffff'} transparent opacity={0.35} />
                </mesh>
            ))}
        </group>
    );
});

// ==================== 🌲 SIDE SCENERY ====================
const SideScenery = memo(({ speed, theme }) => {
    const groupRef = useRef();
    const objects = useMemo(() => {
        const objs = [];
        for (let i = 0; i < 30; i++) {
            const side = Math.random() > 0.5 ? 1 : -1;
            objs.push({ 
                x: side * (18 + Math.random() * 20), 
                z: -i * 20, 
                scale: 0.7 + Math.random() * 1.2
            });
        }
        return objs;
    }, [theme]);
    
    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const safeDelta = Math.min(delta, CONFIG.MAX_DELTA);
        const moveAmount = speed * 55 * safeDelta;
        const children = groupRef.current.children;
        
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            child.position.z += moveAmount;
            if (child.position.z > 20) {
                child.position.z -= 600;
            }
        }
    });
    
    return (
        <group ref={groupRef}>
            {objects.map((obj, i) => (
                <mesh key={i} position={[obj.x, obj.scale * 2, obj.z]}>
                    <coneGeometry args={[2.5 * obj.scale, 8 * obj.scale, 6]} />
                    <meshStandardMaterial color={theme==='snow'?'#fff':'#2e7d32'} />
                </mesh>
            ))}
        </group>
    );
});

// ==================== 🛣️ CYBERPUNK ROAD ====================
const CyberpunkRoad = memo(({ speed, theme }) => {
    const linesRef = useRef();
    const gridRef = useRef();
    const themeConfig = MAP_THEMES[theme];
    
    useFrame((state, delta) => {
        const safeDelta = Math.min(delta, CONFIG.MAX_DELTA);
        const moveAmount = speed * 55 * safeDelta;
        
        if (linesRef.current) { 
            linesRef.current.position.z += moveAmount; 
            if (linesRef.current.position.z > 20) linesRef.current.position.z -= 20; 
        }
        if (gridRef.current) { 
            gridRef.current.position.z += moveAmount; 
            if (gridRef.current.position.z > 40) gridRef.current.position.z -= 40; 
        }
    });
    
    const roadMesh = useMemo(() => (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -50]} receiveShadow>
            <planeGeometry args={[CONFIG.LANE_COUNT * CONFIG.LANE_WIDTH + 3, 600]} />
            <meshStandardMaterial color={themeConfig.road} roughness={0.9} metalness={0.1} />
        </mesh>
    ), [themeConfig.road]);
    
    const gridLines = useMemo(() => 
        Array.from({ length: 15 }).map((_, i) => (
            <mesh key={`grid-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -i * 40]}>
                <planeGeometry args={[CONFIG.LANE_COUNT * CONFIG.LANE_WIDTH + 2, 0.12]} />
                <meshBasicMaterial color={themeConfig.accent} transparent opacity={0.25} />
            </mesh>
        ))
    , [themeConfig.accent]);
    
    const laneLines = useMemo(() => {
        const lines = [];
        for (let i = 0; i <= CONFIG.LANE_COUNT; i++) {
            const x = (i - CONFIG.LANE_COUNT / 2) * CONFIG.LANE_WIDTH;
            const isBorder = i === 0 || i === CONFIG.LANE_COUNT;
            for (let j = 0; j < 30; j++) {
                lines.push(
                    <mesh key={`lane-${i}-${j}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.03, -j * 20]}>
                        <planeGeometry args={[isBorder ? 0.35 : 0.1, isBorder ? 18 : 9]} />
                        <meshBasicMaterial color={isBorder ? themeConfig.light : '#ffffff'} transparent opacity={isBorder ? 0.8 : 0.6} />
                    </mesh>
                );
            }
        }
        return lines;
    }, [themeConfig.light]);
    
    return (
        <group>
            {roadMesh}
            <group ref={gridRef} position={[0, 0.02, 0]}>
                {gridLines}
            </group>
            <group ref={linesRef}>
                {laneLines}
            </group>
        </group>
    );
});

// ==================== 💥 EXPLOSION EFFECT ====================
const ExplosionEffect = memo(({ position }) => {
    const particles = useMemo(() => Array.from({ length: 20 }, () => ({ 
        direction: new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 2, (Math.random() - 0.5) * 2).normalize(), 
        speed: 2 + Math.random() * 3, 
        size: 0.25 + Math.random() * 0.4, 
        color: Math.random() > 0.5 ? '#ff6600' : '#ffaa00' 
    })), []);
    
    const groupRef = useRef();
    
    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const safeDelta = Math.min(delta, CONFIG.MAX_DELTA);
        const children = groupRef.current.children;
        for (let i = 0; i < children.length - 1; i++) {
            const p = particles[i];
            children[i].position.add(p.direction.clone().multiplyScalar(p.speed * safeDelta));
            children[i].rotation.x += safeDelta * 4;
            p.direction.y -= safeDelta * 2.5;
        }
    });
    
    return (
        <group ref={groupRef} position={position}>
            {particles.map((p, i) => (
                <mesh key={i}>
                    <boxGeometry args={[p.size, p.size, p.size]} />
                    <meshBasicMaterial color={p.color} />
                </mesh>
            ))}
            <pointLight color="#ff6600" intensity={8} distance={12} decay={2} />
        </group>
    );
});

// ==================== 📷 DYNAMIC CAMERA ====================
const DynamicCamera = memo(({ isBoosting, isRecovering, isCrashed }) => {
    const { camera, size } = useThree();
    const shakeOffset = useRef({ x: 0, y: 0 });
    
    useFrame((state, delta) => {
        const safeDelta = Math.min(delta, CONFIG.MAX_DELTA);
        const isMobile = size.width < 768;
        const baseZ = isMobile ? 24 : 16;
        const baseY = isMobile ? 11 : 9;
        let targetFov = 60, targetY = baseY, targetZ = baseZ;
        
        if (isBoosting) { 
            targetFov = 85; 
            targetY = baseY - 0.8; 
            targetZ = baseZ - 3; 
            shakeOffset.current.x = (Math.random() - 0.5) * 0.2; 
            shakeOffset.current.y = (Math.random() - 0.5) * 0.08; 
        } else if (isRecovering) { 
            targetFov = 68; 
            targetY = baseY - 0.4; 
            targetZ = baseZ - 1.5; 
            shakeOffset.current.x = THREE.MathUtils.lerp(shakeOffset.current.x, 0, safeDelta * 4); 
            shakeOffset.current.y = THREE.MathUtils.lerp(shakeOffset.current.y, 0, safeDelta * 4); 
        } else { 
            shakeOffset.current.x = THREE.MathUtils.lerp(shakeOffset.current.x, 0, safeDelta * 6); 
            shakeOffset.current.y = THREE.MathUtils.lerp(shakeOffset.current.y, 0, safeDelta * 6); 
        }
        
        if (isCrashed) { 
            targetY = 16; 
            targetZ = 8; 
            targetFov = 50; 
        }
        
        camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, safeDelta * 2.5);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, safeDelta * 2.5);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, safeDelta * 2.5);
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, shakeOffset.current.x, safeDelta * 8);
        camera.lookAt(0, shakeOffset.current.y, -25);
        camera.updateProjectionMatrix();
    });
    
    return null;
});

// ==================== 🎮 WORLD CONTROLLER ====================
const WorldController = ({
    isPlaying, laneIndex, isBoosting, isRecovering, hasMagnet, hasShield, isSlowMotion, doublePoints,
    onCrash, onCoin, onBoost, onMagnet, onShield, onSlowMotion, onDoublePoints,
    setScore, setSpeedDisplay, setCombo, removeShield,
    theme, audioManager
}) => {
    const poolRefs = useRef([]); 
    const poolData = useRef([]); 
    
    const spawnTimer = useRef(0);
    const speedRef = useRef(CONFIG.START_SPEED);
    const scoreAcc = useRef(0);
    const comboRef = useRef(0);
    const comboTimer = useRef(0);
    const frameCount = useRef(0);
    
    const collectedItems = useRef(new Set());

    useEffect(() => {
        poolData.current = Array.from({ length: CONFIG.POOL_SIZE }, () => ({
            active: false,
            lane: 0,
            z: 0,
            type: null,
            id: Math.random()
        }));
    }, []);

    useEffect(() => {
        if (isPlaying) {
            poolData.current.forEach((item, i) => {
                item.active = false;
                item.id = Math.random();
                if(poolRefs.current[i]) poolRefs.current[i].deactivate();
            });
            spawnTimer.current = 0;
            speedRef.current = CONFIG.START_SPEED;
            scoreAcc.current = 0;
            comboRef.current = 0;
            comboTimer.current = 0;
            collectedItems.current.clear();
            audioManager.startEngine();
        } else {
            audioManager.stopEngine();
        }
    }, [isPlaying, audioManager]);

    useFrame((state, delta) => {
        if (!isPlaying) return;

        const safeDelta = Math.min(delta, CONFIG.MAX_DELTA);
        const timeScale = isSlowMotion ? 0.5 : 1.0;
        const effectiveDelta = safeDelta * timeScale;

        let baseSpeed = CONFIG.START_SPEED + (scoreAcc.current * 0.00005);
        if (baseSpeed > CONFIG.MAX_SPEED) baseSpeed = CONFIG.MAX_SPEED;
        const targetSpeed = isBoosting ? baseSpeed * CONFIG.BOOST_MULTIPLIER : baseSpeed;
        const lerpFactor = isRecovering ? effectiveDelta * 1.8 : effectiveDelta * 3.5;
        speedRef.current = THREE.MathUtils.lerp(speedRef.current, targetSpeed, lerpFactor);
        
        audioManager.updateEngine(speedRef.current, isBoosting);

        if (comboTimer.current > 0) comboTimer.current -= effectiveDelta;
        else if (comboRef.current > 0) { comboRef.current = 0; setCombo(0); }

        const speedBonus = isBoosting ? 1.5 : 1;
        const pointBonus = doublePoints ? 2 : 1;
        scoreAcc.current += speedRef.current * 55 * effectiveDelta * speedBonus * pointBonus;

        frameCount.current += 1;
        if (frameCount.current % 30 === 0) {
            setScore(Math.floor(scoreAcc.current));
            setSpeedDisplay(Math.floor(speedRef.current * 200));
        }

        // 🔥 스폰 로직: 장애물 1개만 생성
        spawnTimer.current -= effectiveDelta * speedRef.current;
        if (spawnTimer.current <= 0) {
            spawnTimer.current = Math.max(CONFIG.MIN_SPAWN_INTERVAL, CONFIG.BASE_SPAWN_INTERVAL - (scoreAcc.current * 0.00012));
            const z = CONFIG.SPAWN_DISTANCE;
            const rand = Math.random();

            const spawnObject = (lane, type) => {
                const index = poolData.current.findIndex(p => !p.active);
                if (index !== -1) {
                    const obj = poolData.current[index];
                    obj.active = true;
                    obj.lane = lane;
                    obj.z = z;
                    obj.type = type;
                    obj.id = Math.random();
                    const laneX = LANES[lane];
                    if(poolRefs.current[index]) {
                        poolRefs.current[index].activate(type, laneX, z);
                    }
                }
            };

            if (rand < CONFIG.ITEM_SPAWN_RATE) {
                const lane = Math.floor(Math.random() * CONFIG.LANE_COUNT);
                const itemRand = Math.random();
                let type = 'coin';
                if (itemRand < 0.05) type = 'shield';
                else if (itemRand < 0.10) type = 'slowmotion';
                else if (itemRand < 0.15) type = 'doublepoints';
                else if (itemRand < 0.22) type = 'magnet';
                else if (itemRand < 0.35) type = 'boost';
                spawnObject(lane, type);
            } else {
                // 🔥 장애물 랜덤 1-2개 생성
                const count = Math.floor(Math.random() * 2) + 1; // 1 or 2
                const lanes = [];
                while (lanes.length < count) {
                    const l = Math.floor(Math.random() * CONFIG.LANE_COUNT);
                    if (!lanes.includes(l)) lanes.push(l);
                }
                lanes.forEach(l => {
                    spawnObject(l, Math.random() > 0.6 ? 'barrier' : 'drum');
                });
            }
        }

        const moveDist = speedRef.current * 55 * effectiveDelta;
        const isInvincible = isBoosting || isRecovering;

        for (let i = 0; i < CONFIG.POOL_SIZE; i++) {
            const obj = poolData.current[i];
            if (!obj.active) continue;

            obj.z += moveDist;

            // 🔥 마그넷: 범위 증가 + 모든 아이템 수집 가능
            if (hasMagnet && obj.z > -20 && obj.z < 5) {
                const isItem = ['coin', 'boost', 'shield', 'magnet', 'slowmotion', 'doublepoints'].includes(obj.type);
                if (isItem) {
                    const laneDiff = laneIndex - obj.lane;
                    if (Math.abs(laneDiff) < 3.5) { // 🔥 범위 증가 (2.5 → 3.5)
                        obj.lane += Math.sign(laneDiff) * Math.min(Math.abs(laneDiff), effectiveDelta * 12); // 🔥 더 강력한 흡입력
                    }
                }
            }

            if (poolRefs.current[i]) {
                poolRefs.current[i].updatePosition(obj.z);
                
                const x = typeof obj.lane === 'number' && Number.isInteger(obj.lane)
                        ? LANES[obj.lane]
                        : LANES[Math.floor(obj.lane)] + (obj.lane % 1) * CONFIG.LANE_WIDTH;
                poolRefs.current[i].setX(x);
            }

            if (obj.z > -1.5 && obj.z < 1.5) {
                const laneDiff = Math.abs(LANES[Math.round(obj.lane)] - LANES[laneIndex]);
                
                if (laneDiff < 0.75 && !collectedItems.current.has(obj.id)) {
                    collectedItems.current.add(obj.id);
                    
                    if (obj.type === 'barrier' || obj.type === 'drum') {
                        if (isInvincible) {
                            obj.active = false;
                            poolRefs.current[i].deactivate();
                            onCoin(30); 
                            audioManager.playSound('crash');
                        } else if (hasShield) {
                            obj.active = false;
                            poolRefs.current[i].deactivate();
                            removeShield();
                            audioManager.playSound('shield');
                        } else {
                            audioManager.playSound('crash'); 
                            onCrash();
                        }
                    } else {
                        obj.active = false;
                        poolRefs.current[i].deactivate();
                        
                        if (obj.type === 'coin') {
                            const comboBonus = Math.min(comboRef.current * 10, 100);
                            onCoin((50 + comboBonus) * (doublePoints ? 2 : 1)); 
                            audioManager.playSound('coin');
                            comboRef.current++; 
                            comboTimer.current = 2.5; 
                            setCombo(comboRef.current);
                            if (comboRef.current > 1) audioManager.playSound('combo');
                        } else if (obj.type === 'magnet') { 
                            onMagnet(); 
                            audioManager.playSound('coin'); 
                        } else if (obj.type === 'boost') { 
                            onBoost();
                            audioManager.playSound('boost'); 
                        } else if (obj.type === 'shield') {
                            onShield(); 
                            audioManager.playSound('shield');
                        } else if (obj.type === 'slowmotion') {
                            onSlowMotion(); 
                            audioManager.playSound('coin');
                        } else if (obj.type === 'doublepoints') {
                            onDoublePoints(); 
                            audioManager.playSound('coin');
                        }
                    }
                }
            }
            
            if (obj.z > 12) {
                obj.active = false;
                if(poolRefs.current[i]) poolRefs.current[i].deactivate();
                collectedItems.current.delete(obj.id);
            }
        }
    });

    return (
        <group>
            <CyberpunkRoad speed={speedRef.current} theme={theme} />
            <SideScenery speed={speedRef.current} theme={theme} />
            <SpeedLines isBoosting={isBoosting} theme={theme} />
            
            {Array.from({ length: CONFIG.POOL_SIZE }).map((_, i) => (
                <PooledGameEntity key={i} ref={el => poolRefs.current[i] = el} />
            ))}
        </group>
    );
};

// ==================== 🎨 GAME UI (터치 이펙트 강화) ====================
const GameUI = ({ score, speed, combo, isPlaying, isGameOver, onStart, onExit, finalScore, theme, hasMagnet, boostTime, isRecovering, hasShield, isSlowMotion, doublePoints, touchIndicator }) => {
    const themeConfig = MAP_THEMES[theme];
    
    const handleMove = (dir, e) => { 
        if (e && e.cancelable) e.preventDefault(); 
        window.dispatchEvent(new CustomEvent('moveLane', { detail: { dir } })); 
    };

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none', display:'flex', flexDirection:'column', justifyContent:'space-between', fontFamily: "'Orbitron', 'Rajdhani', sans-serif", userSelect: 'none' }}>
            <div style={{ padding: '15px 20px', background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${themeConfig.light}`, boxShadow: `0 0 20px ${themeConfig.light}50` }}>
                <div>
                    <h1 style={{ margin: 0, color: themeConfig.light, fontSize: 'clamp(1rem, 4vw, 1.4rem)', fontWeight: 'bold', textShadow: `0 0 10px ${themeConfig.light}, 0 0 20px ${themeConfig.light}`, letterSpacing: '2px' }}>{themeConfig.name}</h1>
                    <div style={{ color: '#fff', fontSize: 'clamp(1.2rem, 5vw, 1.8rem)', fontWeight: 'bold', marginTop: '5px', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>{speed} <span style={{ fontSize: '0.7em', opacity: 0.7 }}>KM/H</span></div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 'clamp(0.7rem, 3vw, 0.9rem)', color: '#aaa', letterSpacing: '1px' }}>SCORE</div>
                    <div style={{ fontSize: 'clamp(1.5rem, 6vw, 2.2rem)', color: '#ffd700', fontWeight: 'bold', textShadow: '0 0 10px #ffd700' }}>{score.toLocaleString()}</div>
                </div>
            </div>
            
            <div style={{ position: 'absolute', top: '100px', left: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {combo > 1 && <div style={{ background: 'linear-gradient(135deg, #ff6b00, #ffa500)', padding: '8px 18px', borderRadius: '20px', color: '#fff', fontWeight: 'bold', fontSize: 'clamp(0.95rem, 3.8vw, 1.2rem)', textShadow: '0 2px 4px rgba(0,0,0,0.5)', boxShadow: '0 4px 15px rgba(255,107,0,0.6)', border: '2px solid #fff' }}>🔥 x{combo}</div>}
                {hasMagnet && <div style={{ background: 'linear-gradient(135deg, #ffd700, #ffaa00)', padding: '7px 14px', borderRadius: '18px', color: '#000', fontWeight: 'bold', fontSize: 'clamp(0.85rem, 3.3vw, 1.05rem)', boxShadow: '0 4px 15px rgba(255,215,0,0.6)', border: '2px solid #fff' }}>🧲 MAGNET</div>}
                {boostTime > 0 && <div style={{ background: 'linear-gradient(135deg, #00ffff, #0088ff)', padding: '7px 14px', borderRadius: '18px', color: '#fff', fontWeight: 'bold', fontSize: 'clamp(0.85rem, 3.3vw, 1.05rem)', boxShadow: '0 4px 15px rgba(0,255,255,0.6)', border: '2px solid #fff' }}>⚡ BOOST</div>}
                {isRecovering && <div style={{ background: 'linear-gradient(135deg, #ffff00, #ffaa00)', padding: '7px 14px', borderRadius: '18px', color: '#000', fontWeight: 'bold', fontSize: 'clamp(0.85rem, 3.3vw, 1.05rem)', boxShadow: '0 4px 15px rgba(255,255,0,0.6)', border: '2px solid #fff' }}>🛡️ SAFE</div>}
                {hasShield && <div style={{ background: 'linear-gradient(135deg, #00ff00, #00cc00)', padding: '7px 14px', borderRadius: '18px', color: '#fff', fontWeight: 'bold', fontSize: 'clamp(0.85rem, 3.3vw, 1.05rem)', boxShadow: '0 4px 15px rgba(0,255,0,0.6)', border: '2px solid #fff' }}>🛡️ SHIELD</div>}
                {isSlowMotion && <div style={{ background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)', padding: '7px 14px', borderRadius: '18px', color: '#fff', fontWeight: 'bold', fontSize: 'clamp(0.85rem, 3.3vw, 1.05rem)', boxShadow: '0 4px 15px rgba(156,39,176,0.6)', border: '2px solid #fff' }}>⏱️ SLOW</div>}
                {doublePoints && <div style={{ background: 'linear-gradient(135deg, #ff6600, #ff4400)', padding: '7px 14px', borderRadius: '18px', color: '#fff', fontWeight: 'bold', fontSize: 'clamp(0.85rem, 3.3vw, 1.05rem)', boxShadow: '0 4px 15px rgba(255,102,0,0.6)', border: '2px solid #fff' }}>💎 x2</div>}
            </div>
            
            {(!isPlaying || isGameOver) && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.95) 100%)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', pointerEvents: 'auto' }}>
                    {isGameOver ? (
                        <>
                            <h1 style={{ fontSize: 'clamp(3rem, 12vw, 5rem)', color: '#e74c3c', margin: 0, textShadow: '0 0 30px #e74c3c, 5px 5px 0 #000', fontWeight: 'bold', animation: 'shake 0.5s' }}>CRASH!</h1>
                            <h2 style={{ color: '#fff', marginTop: '20px', fontSize: 'clamp(1.2rem, 5vw, 1.8rem)' }}>FINAL SCORE: <span style={{ color: '#ffd700' }}>{finalScore.toLocaleString()}</span></h2>
                            <button onClick={onStart} style={buttonStyle(themeConfig.light)}>🔄 RETRY</button>
                        </>
                    ) : (
                        <>
                            <div style={{ textAlign: 'center' }}>
                                <h1 style={{ fontSize: 'clamp(2.5rem, 10vw, 4rem)', color: '#fff', margin: 0, textShadow: '3px 3px 0 #000', fontWeight: 'bold' }}>HIGHWAY</h1>
                                <h1 style={{ fontSize: 'clamp(2.5rem, 10vw, 4rem)', color: '#ffd700', margin: 0, textShadow: '0 0 20px #ffd700, 3px 3px 0 #000', fontWeight: 'bold' }}>RUSH 5</h1>
                                <p style={{ color: '#ccc', fontSize: 'clamp(0.9rem, 3.5vw, 1.2rem)', marginTop: '20px', maxWidth: '400px', lineHeight: '1.6' }}>← → 키 또는 화면 터치로 차선 변경<br />장애물을 피하고 아이템을 수집하세요!</p>
                            </div>
                            <button onClick={onStart} style={buttonStyle(themeConfig.light)}>🏁 START ({CONFIG.PLAY_COST.toLocaleString()}P)</button>
                        </>
                    )}
                    <button onClick={onExit} style={{ marginTop: '25px', background: 'none', border: 'none', color: '#888', fontSize: 'clamp(0.9rem, 3.5vw, 1.1rem)', textDecoration: 'underline', cursor: 'pointer', transition: 'color 0.3s' }} onMouseEnter={(e) => (e.target.style.color = '#fff')} onMouseLeave={(e) => (e.target.style.color = '#888')}>← EXIT GAME</button>
                </div>
            )}
            {/* 터치 영역 */}
            {isPlaying && !isGameOver && (
                <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '100%', display: 'flex', pointerEvents: 'auto' }}>
                    <div 
                        style={{ 
                            flex: 1, 
                            borderRight: '1px solid rgba(255,255,255,0.05)'
                        }} 
                        onPointerDown={(e) => handleMove('left', e)}
                    />
                    <div 
                        style={{ 
                            flex: 1, 
                            borderLeft: '1px solid rgba(255,255,255,0.05)'
                        }} 
                        onPointerDown={(e) => handleMove('right', e)}
                    />
                </div>
            )}
        </div>
    );
};

const buttonStyle = (accentColor) => ({ 
    padding: 'clamp(12px, 3vw, 18px) clamp(40px, 10vw, 70px)', 
    fontSize: 'clamp(1.2rem, 5vw, 2rem)', 
    background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, 
    color: '#000', 
    border: '3px solid #fff', 
    borderRadius: '50px', 
    fontWeight: 'bold', 
    cursor: 'pointer', 
    boxShadow: `0 8px 0 ${accentColor}88, 0 10px 25px rgba(0,0,0,0.5)`, 
    marginTop: '35px', 
    transition: 'transform 0.1s, box-shadow 0.1s', 
    fontFamily: "'Orbitron', sans-serif", 
    letterSpacing: '2px', 
    textShadow: '1px 1px 2px rgba(0,0,0,0.3)' 
});

const MuteButton = ({ isMuted, toggleMute }) => (
    <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} style={{ position: 'absolute', top: '90px', right: '20px', background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(10px)', border: '2px solid #555', borderRadius: '50%', width: '50px', height: '50px', color: 'white', fontSize: '1.5rem', cursor: 'pointer', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>{isMuted ? '🔇' : '🔊'}</button>
);

const LeaderBoard = memo(({ ranks, theme }) => {
    const themeConfig = MAP_THEMES[theme];
    return (
        <div style={{ width: '100%', maxWidth: '600px', background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%)', padding: '25px', borderRadius: '20px', border: `3px solid ${themeConfig.light}`, boxShadow: `0 0 30px ${themeConfig.light}50`, color: 'white', marginTop: '25px', marginBottom: '25px', fontFamily: "'Orbitron', sans-serif" }}>
            <h3 style={{ textAlign: 'center', margin: '0 0 20px 0', color: themeConfig.light, fontSize: 'clamp(1.3rem, 5vw, 1.8rem)', borderBottom: `2px solid ${themeConfig.accent}`, paddingBottom: '15px', textShadow: `0 0 10px ${themeConfig.light}` }}>🏆 TOP 10 DRIVERS</h3>
            {ranks.length === 0 ? <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>Loading Rankings...</div> : <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>{ranks.map((r, i) => (<li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', borderBottom: '1px solid #333', background: i < 3 ? 'rgba(255,215,0,0.1)' : 'transparent', borderRadius: '8px', marginBottom: '8px' }}><span style={{ color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#ccc', fontWeight: i < 3 ? 'bold' : 'normal', fontSize: 'clamp(1rem, 4vw, 1.2rem)', minWidth: '40px' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span><span style={{ flex: 1, marginLeft: '15px', fontSize: 'clamp(0.9rem, 3.5vw, 1.1rem)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span><span style={{ fontWeight: 'bold', color: themeConfig.light, fontSize: 'clamp(1rem, 4vw, 1.3rem)', textShadow: `0 0 5px ${themeConfig.light}` }}>{r.score.toLocaleString()}</span></li>))}</ul>}
        </div>
    );
});

// ==================== 🚀 MAIN COMPONENT ====================
export default function HighwayGame() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isCrashed, setIsCrashed] = useState(false);
    const [score, setScore] = useState(0);
    const [speedDisplay, setSpeedDisplay] = useState(0);
    const [finalScore, setFinalScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [lane, setLane] = useState(2);
    const [boostTime, setBoostTime] = useState(0);
    const [magnetTime, setMagnetTime] = useState(0);
    const [shieldActive, setShieldActive] = useState(false);
    const [slowMotionTime, setSlowMotionTime] = useState(0);
    const [doublePointsTime, setDoublePointsTime] = useState(0);
    const [isRecovering, setIsRecovering] = useState(false);
    const [theme, setTheme] = useState('city');
    const [ranks, setRanks] = useState([]);
    const [playerName, setPlayerName] = useState('Driver');
    const [isMuted, setIsMuted] = useState(false);
    const [touchIndicator, setTouchIndicator] = useState(null);

    const navigate = useNavigate();
    const user = auth.currentUser;
    const prevBoostTime = useRef(0);

    useEffect(() => { 
        window.scrollTo(0, 0); 
        if (!user) navigate('/login'); 
    }, [user, navigate]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && isPlaying && !isGameOver) {
                handleGameOver();
                alert("🚫 게임 중 탭을 이동하여 게임이 종료되었습니다.");
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isPlaying, isGameOver]);

    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                try {
                    const snap = await getDoc(doc(db, 'users', user.uid));
                    if (snap.exists() && snap.data().name) setPlayerName(snap.data().name);
                    else setPlayerName(user.email.split('@')[0]);
                } catch (e) { setPlayerName(user.email.split('@')[0]); }
            }
        };
        fetchUserData();
        fetchLeaderboard().then(setRanks);
    }, [user]);
    useEffect(() => { if (isGameOver || !isPlaying) fetchLeaderboard().then(setRanks); }, [isGameOver, isPlaying]);
    
    useEffect(() => {
        const handleKey = (e) => {
            if (!isPlaying || isGameOver) return;
            if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
            
            if (e.key === 'ArrowLeft') {
                setLane((l) => Math.max(0, l - 1));
                audioManager.playSound('move');
                setTouchIndicator('left'); setTimeout(() => setTouchIndicator(null), 300);
            }
            if (e.key === 'ArrowRight') {
                setLane((l) => Math.min(CONFIG.LANE_COUNT - 1, l + 1));
                audioManager.playSound('move');
                setTouchIndicator('right'); setTimeout(() => setTouchIndicator(null), 300);
            }
        };

        const handleMoveLane = (e) => {
            if (!isPlaying || isGameOver) return;
            const dir = e.detail.dir;
            if (dir === 'left') setLane((l) => Math.max(0, l - 1));
            if (dir === 'right') setLane((l) => Math.min(CONFIG.LANE_COUNT - 1, l + 1));
            
            audioManager.playSound('move');
            setTouchIndicator(dir); 
            setTimeout(() => setTouchIndicator(null), 300);
            if (window.navigator.vibrate) window.navigator.vibrate(50);
        };
        
        window.addEventListener('keydown', handleKey, { passive: false });
        window.addEventListener('moveLane', handleMoveLane);
        return () => { 
            window.removeEventListener('keydown', handleKey); 
            window.removeEventListener('moveLane', handleMoveLane); 
        };
    }, [isPlaying, isGameOver]);

    useEffect(() => { if (boostTime > 0) { const timer = setTimeout(() => setBoostTime((time) => Math.max(0, time - 0.1)), 100); return () => clearTimeout(timer); } }, [boostTime]);
    useEffect(() => { if (prevBoostTime.current > 0 && boostTime <= 0 && isPlaying) setIsRecovering(true); prevBoostTime.current = boostTime; }, [boostTime, isPlaying]);
    useEffect(() => { if (isRecovering) { const timer = setTimeout(() => setIsRecovering(false), 2000); return () => clearTimeout(timer); } }, [isRecovering]);
    
    // 🔥 마그넷 중첩 방지: setMagnetTime 대신 고정값 설정
    useEffect(() => { if (magnetTime > 0) { const timer = setTimeout(() => setMagnetTime((time) => Math.max(0, time - 0.1)), 100); return () => clearTimeout(timer); } }, [magnetTime]);
    
    useEffect(() => { if (slowMotionTime > 0) { const timer = setTimeout(() => setSlowMotionTime((time) => Math.max(0, time - 0.1)), 100); return () => clearTimeout(timer); } }, [slowMotionTime]);
    useEffect(() => { if (doublePointsTime > 0) { const timer = setTimeout(() => setDoublePointsTime((time) => Math.max(0, time - 0.1)), 100); return () => clearTimeout(timer); } }, [doublePointsTime]);
    useEffect(() => { audioManager.setMuted(isMuted); }, [isMuted]);

    const handleStart = async () => {
        if (window.navigator.vibrate) window.navigator.vibrate(200);
        
        try { 
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            const currentPoint = userSnap.data()?.point || 0;

            if (currentPoint < CONFIG.PLAY_COST) {
                alert(`포인트가 부족합니다! (보유: ${currentPoint.toLocaleString()}P, 필요: ${CONFIG.PLAY_COST.toLocaleString()}P)`);
                return;
            }

            await updateDoc(userRef, { point: increment(-CONFIG.PLAY_COST) });
            await addDoc(collection(db, "history"), {
                uid: user.uid,
                type: "게임",
                msg: `🏎️ 하이웨이 러쉬 시작`,
                amount: -CONFIG.PLAY_COST,
                createdAt: serverTimestamp()
            });
        } catch (e) { 
            console.error('Start game failed:', e);
            alert("게임 시작 중 오류가 발생했습니다.");
            return;
        }

        const themes = Object.keys(MAP_THEMES);
        setTheme(themes[Math.floor(Math.random() * themes.length)]);
        setIsPlaying(true);
        setIsGameOver(false);
        setIsCrashed(false);
        setScore(0);
        setCombo(0);
        setLane(2);
        setBoostTime(0);
        setMagnetTime(0);
        setShieldActive(false);
        setSlowMotionTime(0);
        setDoublePointsTime(0);
        setIsRecovering(false);
        audioManager.startEngine();
    };

    const handleGameOver = () => {
        if (isGameOver) return;
        setIsPlaying(false);
        setIsGameOver(true);
        setIsCrashed(true);
        setFinalScore(score);
        audioManager.stopEngine();
        if (window.navigator.vibrate) window.navigator.vibrate([200, 100, 200]);
        
        if (score > 0) {
            updateDoc(doc(db, 'users', user.uid), { point: increment(score) }).catch((e) => console.error('Point update failed:', e));
            
            addDoc(collection(db, "history"), {
                uid: user.uid,
                type: "게임",
                msg: `🏁 하이웨이 러쉬 보상`,
                amount: score,
                createdAt: serverTimestamp()
            }).catch(e => console.error(e));

            updateRanking(user, score, playerName);
        }
        setTimeout(() => setIsCrashed(false), 1500);
    };

    return (
        <div style={{ width: '100vw', minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #0f0f1e 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', touchAction: 'none', padding: '15px 0', overflow: 'hidden' }}>
            <div style={{ width: '100%', maxWidth: '600px', height: '90dvh', maxHeight: '900px', position: 'relative', overflow: 'hidden', boxShadow: `0 0 60px ${MAP_THEMES[theme].light}80`, border: `4px solid ${MAP_THEMES[theme].light}`, borderRadius: '30px', background: '#000' }}>
                <MuteButton isMuted={isMuted} toggleMute={() => setIsMuted(!isMuted)} />
                <GameUI 
                    score={score} 
                    speed={speedDisplay} 
                    combo={combo} 
                    isPlaying={isPlaying} 
                    isGameOver={isGameOver} 
                    finalScore={finalScore} 
                    onStart={handleStart} 
                    onExit={() => navigate('/home')} 
                    theme={theme} 
                    hasMagnet={magnetTime > 0} 
                    boostTime={boostTime} 
                    isRecovering={isRecovering} 
                    hasShield={shieldActive}
                    isSlowMotion={slowMotionTime > 0}
                    doublePoints={doublePointsTime > 0}
                    touchIndicator={touchIndicator} 
                />
                <Canvas 
                    shadows 
                    dpr={[1, window.innerWidth < 768 ? 1.5 : 2]} 
                    gl={{ 
                        antialias: true, 
                        alpha: false, 
                        powerPreference: 'high-performance',
                        stencil: false,
                        depth: true
                    }}
                    frameloop="always"
                >
                    <Suspense fallback={null}>
                        <PerspectiveCamera makeDefault position={[0, 9, 16]} fov={60} />
                        <DynamicCamera isBoosting={boostTime > 0} isRecovering={isRecovering} isCrashed={isCrashed} />
                        <color attach="background" args={[MAP_THEMES[theme].sky]} />
                        <fog attach="fog" args={[MAP_THEMES[theme].fog, 90, 250]} />
                        <ambientLight intensity={0.6} />
                        <directionalLight 
                            position={[15, 60, 30]} 
                            intensity={1.8} 
                            castShadow 
                            shadow-mapSize={[2048, 2048]} 
                            shadow-camera-left={-50} 
                            shadow-camera-right={50} 
                            shadow-camera-top={50} 
                            shadow-camera-bottom={-50} 
                        />
                        {theme === 'city' || theme === 'hell' || theme === 'ocean' ? 
                            <Stars radius={120} depth={60} count={1500} factor={5} saturation={0} fade /> : 
                            <Sky sunPosition={theme === 'heaven' ? [0, 50, 0] : [100, 25, 100]} turbidity={theme === 'desert' ? 10 : 0.5} />
                        }
                        {!isCrashed && <SuperCar laneIndex={lane} isBoosting={boostTime > 0} isRecovering={isRecovering} hasMagnet={magnetTime > 0} hasShield={shieldActive} theme={theme} />}
                        {isCrashed && <ExplosionEffect position={[LANES[lane], 0.5, 0]} />}
                        <WorldController 
                            isPlaying={isPlaying} 
                            laneIndex={lane} 
                            isBoosting={boostTime > 0} 
                            isRecovering={isRecovering} 
                            hasMagnet={magnetTime > 0} 
                            hasShield={shieldActive}
                            isSlowMotion={slowMotionTime > 0}
                            doublePoints={doublePointsTime > 0}
                            setScore={setScore} 
                            setSpeedDisplay={setSpeedDisplay} 
                            setCombo={setCombo} 
                            onCrash={handleGameOver} 
                            onCoin={() => {}} 
                            onBoost={() => { 
                                setBoostTime((prev) => prev + 3.5); 
                                if (window.navigator.vibrate) window.navigator.vibrate(200); 
                            }} 
                            onMagnet={() => { 
                                // 🔥 마그넷 중첩 방지: 이미 활성화되어 있으면 무시
                                if (magnetTime <= 0) {
                                    setMagnetTime(6.0);
                                    if (window.navigator.vibrate) window.navigator.vibrate(100);
                                }
                            }} 
                            onShield={() => { setShieldActive(true); if (window.navigator.vibrate) window.navigator.vibrate(100); }}
                            onSlowMotion={() => { setSlowMotionTime((prev) => prev + 5.0); if (window.navigator.vibrate) window.navigator.vibrate(100); }}
                            onDoublePoints={() => { setDoublePointsTime((prev) => prev + 7.0); if (window.navigator.vibrate) window.navigator.vibrate(100); }}
                            removeShield={() => setShieldActive(false)}
                            theme={theme} 
                            audioManager={audioManager} 
                        />
                        <EffectComposer disableNormalPass>
                            <Bloom luminanceThreshold={0.7} luminanceSmoothing={0.9} intensity={1.2} mipmapBlur />
                            <Vignette eskil={false} offset={0.15} darkness={0.6} />
                            <ChromaticAberration offset={[0.0015, 0.0015]} />
                            {isCrashed && <DepthOfField focusDistance={0.01} focalLength={0.05} bokehScale={8} />}
                        </EffectComposer>
                    </Suspense>
                </Canvas>
            </div>
            <LeaderBoard ranks={ranks} theme={theme} />
            <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet" />
            <style>{`
                @keyframes pulse { from { transform: scale(1); } to { transform: scale(1.05); } } 
                @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }
            `}</style>
        </div>
    );
}