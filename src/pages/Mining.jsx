

// import React, { useState, useEffect, useRef } from 'react';
// import { db, auth } from '../firebase';
// import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';
// import { useLanguage } from '../LanguageContext';
// import * as THREE from 'three';

// const styles = `
//   /* 결과 모달 */
//   .result-modal { 
//     position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
//     background: rgba(0,0,0,0.85); z-index: 2000; 
//     display: flex; justify-content: center; align-items: center; 
//     backdrop-filter: blur(8px); 
//     animation: modalFadeIn 0.3s ease;
//   }
  
//   @keyframes modalFadeIn {
//     from { opacity: 0; }
//     to { opacity: 1; }
//   }
  
//   .result-content { 
//     background: #2c3e50; 
//     padding: 40px; border-radius: 20px; text-align: center; 
//     border: 2px solid #f1c40f; 
//     box-shadow: 0 0 30px rgba(241, 196, 15, 0.3); 
//     width: 90%; max-width: 400px;
//     animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
//     position: relative;
//     color: white;
//   }
  
//   @keyframes popIn { 
//     from { transform: scale(0.8); opacity: 0; } 
//     to { transform: scale(1); opacity: 1; } 
//   }
  
//   /* 확률표 테이블 */
//   .prob-table-container {
//     margin-top: 30px;
//     background: #2c3e50;
//     padding: 20px;
//     border-radius: 10px;
//     border: 1px solid #444;
//     max-width: 500px;
//     margin-left: auto;
//     margin-right: auto;
//   }
//   .prob-row {
//     display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #444; color: #ddd; font-size: 14px;
//   }
//   .prob-row:last-child { border-bottom: none; }
// `;

// export default function Mining() {
//   const [point, setPoint] = useState(0); 
//   const [cooldown, setCooldown] = useState(0);
//   const [isLoading, setIsLoading] = useState(false);
//   const [showResult, setShowResult] = useState(false);
//   const [prizeData, setPrizeData] = useState(null); 

//   const navigate = useNavigate();
//   const user = auth.currentUser;
//   const timerRef = useRef(null);
//   const STORAGE_KEY = `gachaCooldown_v2_${user?.uid}`;
//   const { t } = useLanguage();

//   const containerRef = useRef(null);
//   const canvasRef = useRef(null);
//   const sceneRef = useRef(null);
//   const animationRef = useRef(null);
  
//   const cooldownRef = useRef(cooldown);

//   useEffect(() => {
//     cooldownRef.current = cooldown;
//   }, [cooldown]);

//   // --- 효과음 ---
//   const playSound = (tier) => {
//     let audioFile = '/sounds/common.mp3';
//     if (tier === 'GOD') audioFile = '/sounds/god.mp3';
//     else if (tier === 'MYTHIC') audioFile = '/sounds/mythic.mp3';
//     else if (tier === 'LEGEND') audioFile = '/sounds/legend.mp3';
//     else if (tier === 'EPIC') audioFile = '/sounds/epic.mp3';
//     const audio = new Audio(audioFile);
//     audio.volume = 0.5;
//     audio.play().catch(() => {});
//   };

//   useEffect(() => {
//     if (!user) { navigate('/login'); return; }
//     fetchPoint();
//     const savedEndTime = localStorage.getItem(STORAGE_KEY);
//     if (savedEndTime) {
//       const remaining = Math.ceil((parseInt(savedEndTime) - Date.now()) / 1000);
//       if (remaining > 0) { setCooldown(remaining); startTimer(remaining); } 
//       else { localStorage.removeItem(STORAGE_KEY); }
//     }
//     return () => clearInterval(timerRef.current);
//   }, [user, navigate]);

//   // --- 3D Scene Setup ---
//   useEffect(() => {
//     if (!canvasRef.current || !containerRef.current) return;

//     const width = containerRef.current.clientWidth;
//     const height = containerRef.current.clientHeight;

//     const scene = new THREE.Scene();
    
//     // 🎨 [수정됨] 배경색을 참고 이미지의 하늘색(밝은 청록색)으로 변경
//     const skyColor = 0x64dcf5; 
//     scene.background = new THREE.Color(skyColor);
    
//     // 안개도 같은 색으로 설정하여 자연스럽게 블렌딩
//     scene.fog = new THREE.Fog(skyColor, 15, 60);

//     const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
//     camera.position.set(0, 3, 16);
//     camera.lookAt(0, 2, 0);

//     const renderer = new THREE.WebGLRenderer({ 
//       canvas: canvasRef.current, 
//       antialias: true,
//       alpha: false 
//     });
//     renderer.setSize(width, height);
//     renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
//     renderer.shadowMap.enabled = true;
//     renderer.shadowMap.type = THREE.PCFSoftShadowMap;
//     // 화사한 느낌을 위해 톤매핑 조정
//     renderer.toneMapping = THREE.ACESFilmicToneMapping;
//     renderer.toneMappingExposure = 1.1;

//     sceneRef.current = { 
//       scene, 
//       camera, 
//       renderer, 
//       ball: null, 
//       clock: new THREE.Clock(), 
//       isAnimating: false,
//       particles: null,
//       spotlights: [],
//       originalCameraPos: { x: 0, y: 3, z: 16 },
//       targetCameraPos: { x: 0, y: 3, z: 16 },
//       cameraShake: 0
//     };

//     // 💡 조명 (햇살 느낌)
//     const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
//     scene.add(ambientLight);

//     const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
//     dirLight.position.set(10, 20, 10);
//     dirLight.castShadow = true;
//     dirLight.shadow.mapSize.width = 2048;
//     dirLight.shadow.mapSize.height = 2048;
//     scene.add(dirLight);

//     // 🏞️ 환경 생성 (여기가 핵심 변경 부분)
//     createEnvironment(scene);

//     // 🔴 몬스터볼 생성
//     const ball = createBall(0xdc3545); 
//     ball.position.set(0, -2, 0); 
//     scene.add(ball);
//     sceneRef.current.ball = ball;

//     const handleResize = () => {
//         if (!containerRef.current) return;
//         const w = containerRef.current.clientWidth;
//         const h = containerRef.current.clientHeight;
//         camera.aspect = w / h;
//         camera.updateProjectionMatrix();
//         renderer.setSize(w, h);
//     };
//     window.addEventListener('resize', handleResize);

//     // 🎬 메인 애니메이션 루프
//     const animate = () => {
//       animationRef.current = requestAnimationFrame(animate);
      
//       const { ball, clock, isAnimating, camera, targetCameraPos, cameraShake, particles } = sceneRef.current;
//       const isCooldown = cooldownRef.current > 0;
//       const time = clock.elapsedTime;

//       camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCameraPos.x, 0.05) + (Math.random() - 0.5) * cameraShake;
//       camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCameraPos.y, 0.05) + (Math.random() - 0.5) * cameraShake;
//       camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCameraPos.z, 0.05) + (Math.random() - 0.5) * cameraShake;
//       sceneRef.current.cameraShake *= 0.9; 

//       camera.lookAt(0, -1, 0);

//       if (ball && !isAnimating) {
//         if (!isCooldown) {
//           ball.position.y = -2 + Math.sin(time * 2.5) * 0.2; 
//           ball.rotation.y = time * 0.4;
//           ball.rotation.z = Math.sin(time * 1.5) * 0.05;
//           ball.rotation.x = Math.cos(time * 1.5) * 0.05;

//           const btn = ball.getObjectByName("centerButton");
//           if (btn) {
//             const pulse = Math.sin(time * 3) * 0.3 + 0.7;
//             btn.material.emissive.setHex(0xffffff);
//             btn.material.emissiveIntensity = pulse * 0.5;
//           }
//         } else {
//           ball.position.y = -2.2 + Math.sin(time * 1.5) * 0.08; 
//           ball.rotation.y += 0.005; 
//           ball.rotation.z = Math.sin(time * 1) * 0.03; 
//           ball.rotation.x = 0;
          
//           const btn = ball.getObjectByName("centerButton");
//           if (btn) {
//             btn.material.emissive.setHex(0x333333);
//             btn.material.emissiveIntensity = 0.1;
//           }
//         }
//       }
      
//       if (particles) {
//         particles.children.forEach((p, i) => {
//           if (p.userData.isFlash) {
//             p.scale.x += 0.5; p.scale.y += 0.5; p.scale.z += 0.5;
//             p.material.opacity -= 0.05;
//           } else {
//             p.position.add(new THREE.Vector3(p.userData.velocityX, p.userData.velocityY, p.userData.velocityZ));
//             p.userData.velocityY -= 0.015; 
//             p.userData.age += 0.02;
            
//             if (p.userData.age < 0.3) {
//               const scale = THREE.MathUtils.lerp(0.1, p.userData.scaleTarget, p.userData.age / 0.3);
//               p.scale.set(scale, scale, scale);
//             } else {
//               const shrink = 1 - ((p.userData.age - 0.3) / 0.7);
//               const scale = p.userData.scaleTarget * Math.max(0, shrink);
//               p.scale.set(scale, scale, scale);
//             }
//             if (p.userData.age > 0.5) p.material.opacity = 1 - ((p.userData.age - 0.5) / 0.5);
//             if (p.userData.rotationSpeed) {
//               p.rotation.x += p.userData.rotationSpeed.x;
//               p.rotation.y += p.userData.rotationSpeed.y;
//               p.rotation.z += p.userData.rotationSpeed.z;
//             }
//           }
//         });
//       }
      
//       const sun = scene.children.find(c => c.userData.glow);
//       if (sun && sun.userData.glow) {
//           const pulse = Math.sin(time * 0.5) * 0.5 + 1;
//           sun.userData.glow.scale.set(pulse, pulse, pulse);
//           sun.userData.glow.material.opacity = 0.2 + Math.sin(time * 0.5) * 0.1;
//       }

//       renderer.render(scene, camera);
//     };
//     animate();

//     return () => {
//       window.removeEventListener('resize', handleResize);
//       if (animationRef.current) cancelAnimationFrame(animationRef.current);
//       renderer.dispose();
//       scene.traverse((object) => {
//         if (object.isMesh) {
//             object.geometry.dispose();
//             if(object.material.map) object.material.map.dispose();
//             object.material.dispose();
//         }
//       });
//     };
//   }, []);

//   // 🏞️ 고퀄리티 배경 생성 (참고 이미지 스타일)
//   const createEnvironment = (scene) => {
//       // 1. 🌿 바닥 (밝은 연두색 잔디)
//       const floorGeo = new THREE.PlaneGeometry(100, 100, 30, 30);
//       const floorMat = new THREE.MeshStandardMaterial({ 
//           color: 0x81c784, // 이미지의 밝은 연두색
//           roughness: 1, 
//           metalness: 0 
//       });
      
//       // 잔디의 울퉁불퉁함 표현
//       const positions = floorGeo.attributes.position;
//       for (let i = 0; i < positions.count; i++) {
//           const z = positions.getZ(i);
//           // 약간의 노이즈 추가
//           positions.setZ(i, z + (Math.random() - 0.5) * 0.2);
//       }
//       floorGeo.computeVertexNormals();

//       const floor = new THREE.Mesh(floorGeo, floorMat);
//       floor.rotation.x = -Math.PI / 2;
//       floor.position.y = -4;
//       floor.receiveShadow = true;
//       scene.add(floor);

//       // 2. 🌳 왼쪽의 큰 나무 (참고 이미지 특징)
//       const createDeciduousTree = (x, z, scale) => {
//           const treeGroup = new THREE.Group();
          
//           // 굵은 나무 기둥
//           const trunkGeo = new THREE.CylinderGeometry(0.8 * scale, 1.2 * scale, 3.5 * scale, 8);
//           const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41, flatShading: true }); // 갈색
//           const trunk = new THREE.Mesh(trunkGeo, trunkMat);
//           trunk.position.y = (3.5 * scale) / 2;
//           trunk.castShadow = true;
//           treeGroup.add(trunk);

//           // 둥근 잎사귀 (이코스피어 사용)
//           const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, flatShading: true, roughness: 0.8 });
          
//           // 잎 덩어리들을 뭉쳐서 큰 나무 모양 만들기
//           const positions = [
//              { x: 0, y: 3, z: 0, s: 2.5 },
//              { x: 1.5, y: 2.5, z: 1, s: 1.8 },
//              { x: -1.5, y: 2.5, z: 0.5, s: 1.8 },
//              { x: 0, y: 2.5, z: -1.5, s: 1.8 },
//              { x: 0, y: 4, z: 0, s: 2 }
//           ];

//           positions.forEach(pos => {
//               const leafGeo = new THREE.IcosahedronGeometry(pos.s * scale, 0);
//               const leaf = new THREE.Mesh(leafGeo, leafMat);
//               leaf.position.set(pos.x * scale, pos.y * scale, pos.z * scale);
//               leaf.castShadow = true;
//               treeGroup.add(leaf);
//           });

//           treeGroup.position.set(x, -4, z);
//           scene.add(treeGroup);
//       };

//       // 이미지처럼 왼쪽에 큰 나무 배치
//       createDeciduousTree(-10, -15, 1.8);

//       // 3. 🌳 배경의 숲/덤불 벽 (Background Bush Wall)
//       const createBush = (x, z, scale) => {
//           const bushGeo = new THREE.DodecahedronGeometry(scale, 0);
//           const bushMat = new THREE.MeshStandardMaterial({ 
//               color: 0x1b5e20, // 짙은 녹색 (배경 숲)
//               flatShading: true 
//           });
//           const bush = new THREE.Mesh(bushGeo, bushMat);
//           bush.position.set(x, -4 + scale * 0.6, z);
//           bush.castShadow = true;
//           scene.add(bush);
//       };

//       // 뒤쪽에 덤불을 깔아서 숲 벽 만들기
//       for (let x = -40; x <= 40; x += 5) {
//           const z = -25 - Math.random() * 5;
//           const scale = 3 + Math.random() * 2;
//           createBush(x, z, scale);
//           // 겹치게 하나 더
//           createBush(x + 2.5, z - 2, scale * 0.8);
//       }
      
//       // 오른쪽 전경의 작은 덤불들 (이미지 오른쪽 풀숲 느낌)
//       createBush(12, -10, 1.5);
//       createBush(15, -12, 2.0);
//       createBush(10, -15, 1.8);

//       // 4. ☁️ 구름 (이미지 상단의 구름)
//       const createCloud = (x, y, z, scale) => {
//           const cloudGroup = new THREE.Group();
//           const cloudMat = new THREE.MeshStandardMaterial({ 
//               color: 0xffffff, transparent: true, opacity: 0.8, flatShading: true 
//           });
          
//           const p1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 0), cloudMat);
//           const p2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 0), cloudMat);
//           const p3 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.0, 0), cloudMat);
          
//           p1.position.set(0, 0, 0);
//           p2.position.set(1.5, -0.5, 0);
//           p3.position.set(-1.5, -0.2, 0.5);
          
//           cloudGroup.add(p1, p2, p3);
//           cloudGroup.position.set(x, y, z);
//           cloudGroup.scale.set(scale, scale * 0.6, scale);
//           cloudGroup.name = 'cloud';
//           cloudGroup.userData.speed = 0.002 + Math.random() * 0.002;
//           scene.add(cloudGroup);
//       };

//       createCloud(-15, 10, -30, 2);
//       createCloud(15, 12, -35, 2.5);
//       createCloud(0, 14, -40, 1.8);
//   };

//   // 🔴 몬스터볼 생성
//   const createBall = (topColor) => {
//       const group = new THREE.Group();
//       const matTop = new THREE.MeshStandardMaterial({ color: topColor, roughness: 0.2, metalness: 0.2 });
//       const matBot = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.2 });
//       const matBlack = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
//       const matBtn = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x222222 });

//       const top = new THREE.Mesh(new THREE.SphereGeometry(2, 32, 16, 0, Math.PI*2, 0, Math.PI/2), matTop); group.add(top);
//       const bot = new THREE.Mesh(new THREE.SphereGeometry(2, 32, 16, 0, Math.PI*2, Math.PI/2, Math.PI/2), matBot); group.add(bot);
//       const band = new THREE.Mesh(new THREE.TorusGeometry(2, 0.12, 16, 100), matBlack); band.rotation.x = Math.PI / 2; group.add(band);
//       group.add(new THREE.Mesh(new THREE.SphereGeometry(1.95, 32, 16), matBlack));
//       const btnRing = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.35, 32), matBlack); btnRing.rotation.x = Math.PI / 2; btnRing.position.z = 1.92; group.add(btnRing);
//       const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.4, 32), matBtn); btn.rotation.x = Math.PI / 2; btn.position.z = 1.98; btn.name = "centerButton"; group.add(btn);
//       group.castShadow = true; group.children.forEach(c => { c.castShadow = true; c.receiveShadow = true; });
//       return group;
//   };

//   // ✨ 고퀄리티 파티클 생성
//   const createParticles = (color, count = 100) => {
//       const particles = new THREE.Group();
//       for (let layer = 0; layer < 3; layer++) {
//           const layerCount = count / 3;
//           for (let i = 0; i < layerCount; i++) {
//               const geometry = new THREE.SphereGeometry(0.08 + Math.random() * 0.05, 8, 8);
//               const material = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 2, transparent: true, opacity: 1, metalness: 0.5, roughness: 0.2 });
//               const particle = new THREE.Mesh(geometry, material);
//               const angle = (Math.PI * 2 * i) / layerCount;
//               const elevation = (Math.random() - 0.5) * 0.6; 
//               const speed = 0.2 + Math.random() * 0.15 + (layer * 0.05);
//               particle.position.set(0, -2, 0);
//               particle.userData.velocityX = Math.cos(angle) * speed;
//               particle.userData.velocityY = 0.25 + Math.random() * 0.2 + elevation;
//               particle.userData.velocityZ = Math.sin(angle) * speed;
//               particle.userData.rotationSpeed = { x: (Math.random() - 0.5) * 0.2, y: (Math.random() - 0.5) * 0.2, z: (Math.random() - 0.5) * 0.2 };
//               particle.scale.set(0.1, 0.1, 0.1);
//               particle.userData.scaleTarget = 1 + Math.random() * 0.5;
//               particle.userData.age = 0;
//               particles.add(particle);
//           }
//       }
//       const flashGeo = new THREE.SphereGeometry(0.3, 16, 16);
//       const flashMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 1 });
//       const flash = new THREE.Mesh(flashGeo, flashMat); flash.position.set(0, -2, 0); flash.userData.isFlash = true; particles.add(flash);
//       return particles;
//   };

//   // 💥 애니메이션 시퀀스
//   const runCatchSequence = (tier, tierColor) => {
//       const { scene, ball, camera } = sceneRef.current;
//       sceneRef.current.isAnimating = true;

//       const topHalf = ball.children[0];
//       if (topHalf && topHalf.material) topHalf.material.color.setHex(tierColor);

//       const startTime = Date.now();
//       const floorY = -2;

//       ball.position.set(5, 12, 5); 
//       ball.rotation.set(0,0,0);
//       sceneRef.current.targetCameraPos = { x: 0, y: 2.5, z: 14 };

//       const loop = () => {
//           if (!sceneRef.current || !sceneRef.current.ball) return;
//           const now = Date.now();
//           const elapsed = (now - startTime) / 1000;

//           if (elapsed < 0.5) {
//               ball.position.x = 5 - (elapsed * 10);
//               ball.position.z = 5 - (elapsed * 10);
//               ball.position.y = 12 - (25 * elapsed * elapsed);
//               if (ball.position.y < floorY) ball.position.y = floorY;
//               ball.rotation.x -= 0.3; ball.rotation.z -= 0.15;
              
//               if (Math.random() > 0.7) {
//                   const trail = ball.clone(); trail.scale.multiplyScalar(0.8);
//                   trail.traverse(child => { if (child.material) { child.material = child.material.clone(); child.material.transparent = true; child.material.opacity = 0.3; } });
//                   scene.add(trail); setTimeout(() => scene.remove(trail), 100);
//               }
//           }
//           else if (elapsed < 0.8) {
//               const t = elapsed - 0.5;
//               ball.position.y = floorY + Math.sin(t * Math.PI * 3.3) * 3.5;
//               ball.rotation.x -= 0.2;
//               if (t < 0.1) sceneRef.current.cameraShake = 0.3;
//           }
//           else if (elapsed < 1.1) {
//               const t = elapsed - 0.8;
//               ball.position.y = floorY + Math.sin(t * Math.PI * 3.3) * 1.5;
//               ball.rotation.x -= 0.1;
//           }
//           else if (elapsed < 1.5) {
//               ball.position.set(0, floorY, 0);
//               ball.rotation.set(0, 0, 0);
//               sceneRef.current.targetCameraPos.z = 14.5;
//           }
//           else if (elapsed < 4.5) {
//               const wobbleTime = elapsed - 1.5;
//               const btn = ball.getObjectByName("centerButton");
//               const shakePhases = [{ start: 0.2, end: 1.0 }, { start: 1.2, end: 2.0 }, { start: 2.2, end: 3.0 }];
//               let isShaking = false;
//               shakePhases.forEach(phase => { if (wobbleTime > phase.start && wobbleTime < phase.end) isShaking = true; });
              
//               if (isShaking) {
//                   const intensity = 0.6 + (tier === 'GOD' ? 0.4 : tier === 'MYTHIC' ? 0.3 : 0); 
//                   const shake = Math.sin(wobbleTime * Math.PI * 10) * intensity;
//                   ball.rotation.z = shake;
//                   ball.rotation.x = Math.sin(wobbleTime * Math.PI * 7) * intensity * 0.5;
//                   if (btn) { btn.material.emissive.setHex(0xff0000); btn.material.emissiveIntensity = 1.5 + Math.sin(wobbleTime * 20) * 0.5; }
//                   sceneRef.current.cameraShake = intensity * 0.15;
//               } else {
//                   ball.rotation.z *= 0.9; ball.rotation.x *= 0.9;
//                   if (btn) { btn.material.emissive.setHex(0x555555); btn.material.emissiveIntensity = 0.2; }
//               }
//           }
//           else {
//               ball.rotation.z = 0; ball.rotation.x = 0;
//               const btn = ball.getObjectByName("centerButton");
//               if (btn) { btn.material.emissive.setHex(tierColor); btn.material.emissiveIntensity = 3; }
              
//               if (!sceneRef.current.particles) {
//                   const particleCount = tier === 'GOD' ? 150 : tier === 'MYTHIC' ? 120 : tier === 'LEGEND' ? 100 : 80;
//                   const particles = createParticles(tierColor, particleCount);
//                   scene.add(particles);
//                   sceneRef.current.particles = particles;
                  
//                   if (tier === 'GOD' || tier === 'MYTHIC') {
//                       const spotlight = new THREE.SpotLight(tierColor, 3);
//                       spotlight.position.set(0, 10, 0); spotlight.target.position.set(0, -2, 0);
//                       spotlight.angle = Math.PI / 6; spotlight.penumbra = 0.5;
//                       scene.add(spotlight); scene.add(spotlight.target);
//                       sceneRef.current.spotlights.push(spotlight);
//                       scene.fog.color.setHex(tierColor);
//                       scene.background.setHex(tierColor); 
//                   }
                  
//                   sceneRef.current.cameraShake = tier === 'GOD' ? 0.8 : tier === 'MYTHIC' ? 0.6 : 0.4;
                  
//                   setTimeout(() => {
//                       if (sceneRef.current.particles) { scene.remove(sceneRef.current.particles); sceneRef.current.particles = null; }
//                       scene.fog.color.setHex(0x64dcf5); // 원래 하늘색으로 복구
//                       scene.background.setHex(0x64dcf5); // 원래 하늘색으로 복구
//                       sceneRef.current.spotlights.forEach(light => scene.remove(light));
//                       sceneRef.current.spotlights = [];
//                   }, 5000);
//               }
//               return; 
//           }
//           requestAnimationFrame(loop);
//       };
//       loop();
//   };

//   const fetchPoint = async () => { try { const d = await getDoc(doc(db, "users", user.uid)); if (d.exists()) setPoint(d.data().point || 0); } catch (e) {} };

//   const startTimer = (seconds) => {
//     clearInterval(timerRef.current);
//     let timeLeft = seconds;
//     setCooldown(timeLeft);
//     timerRef.current = setInterval(() => {
//       timeLeft -= 1;
//       setCooldown(timeLeft);
//       if (timeLeft <= 0) { 
//         clearInterval(timerRef.current); 
//         localStorage.removeItem(STORAGE_KEY);
//         if(sceneRef.current) {
//           sceneRef.current.isAnimating = false;
//           sceneRef.current.targetCameraPos = { x: 0, y: 3, z: 16 };
//           const ball = sceneRef.current.ball;
//           if (ball) {
//             ball.position.set(0, -2, 0); ball.rotation.set(0, 0, 0);
//             const topHalf = ball.children[0]; if (topHalf && topHalf.material) topHalf.material.color.setHex(0xdc3545);
//             const btn = ball.getObjectByName("centerButton"); if (btn) { btn.material.emissive.setHex(0x222222); btn.material.emissiveIntensity = 0; }
//           }
//         }
//       }
//     }, 1000);
//   };

//   const playGacha = async () => {
//     if (cooldown > 0 || isLoading) return;

//     // 🔥 [추가된 부분] 가챠 밴 확인 로직 시작
//     try {
//         const userSnap = await getDoc(doc(db, "users", user.uid));
//         if (userSnap.exists()) {
//             const data = userSnap.data();
//             if (data.gachaBanDate) {
//                 const banDate = data.gachaBanDate.toDate();
//                 if (banDate > new Date()) {
//                     return alert(`🚫 가챠 이용이 제한되었습니다.\n해제 일시: ${banDate.toLocaleString()}`);
//                 }
//             }
//         }
//     } catch (e) {
//         console.error("Ban check error", e);
//         return;
//     }
//     // 🔥 [추가된 부분] 가챠 밴 확인 로직 끝

//     setIsLoading(true);
//     if (navigator.vibrate) navigator.vibrate(50);

//     const rand = Math.random() * 100;
//     let prize = 0; let tier = ""; let color = ""; let msg = ""; let tierColor = 0xdc3545;

//     if (rand < 0.1) { prize = 1000000000; tier = "GOD"; color = "#ff00ff"; msg = t.g_god; tierColor = 0xff00ff; } 
//     else if (rand < 1.1) { prize = 100000000; tier = "MYTHIC"; color = "#aaa"; msg = t.g_mythic; tierColor = 0xaaaaaa; } 
//     else if (rand < 6.1) { prize = 5000000; tier = "LEGEND"; color = "#00d2d3"; msg = t.g_legend; tierColor = 0x00d2d3; } 
//     else if (rand < 16.1) { prize = 1000000; tier = "EPIC"; color = "#f1c40f"; msg = t.g_epic; tierColor = 0xf1c40f; } 
//     else { prize = Math.floor(Math.random() * 50001) + 50000; tier = "COMMON"; color = "#ff4757"; msg = t.g_common; tierColor = 0xff4757; }

//     runCatchSequence(tier, tierColor);

//     setTimeout(async () => {
//       try {
//         await updateDoc(doc(db, "users", user.uid), { point: increment(prize) });
//         setPoint(prev => prev + prize); 
//         await addDoc(collection(db, "history"), { uid: user.uid, type: "가챠", msg: `${msg} 당첨`, amount: prize, createdAt: serverTimestamp() });
//         setPrizeData({ tier, msg, money: prize, color });
//         setShowResult(true);
//         playSound(tier);
//         const coolTime = 60;
//         const endTime = Date.now() + (coolTime * 1000);
//         localStorage.setItem(STORAGE_KEY, endTime);
//         startTimer(coolTime);
//       } catch (e) { alert(t.alertError); } 
//       finally { setIsLoading(false); }
//     }, 5000);
//   };

//   const progress = Math.min(100, (cooldown / 60) * 100);

//   return (
//     <div className="container" style={{ textAlign: 'center', paddingTop: 20, background: '#1e272e', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>
//       <style>{styles}</style>
//       <div style={{ display:'flex', justifyContent:'center', alignItems:'center', position:'relative', marginBottom: 10 }}>
//         <h1 style={{ color: '#f1c40f', fontSize: '32px', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}> {t.gachaTitle} </h1>
//       </div>
//       <div ref={containerRef} style={{ width: '100%', maxWidth: '500px', height: '400px', margin: '0 auto', position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '2px solid #ddd', boxShadow: prizeData?.tier === 'GOD' ? '0 0 40px rgba(255,0,255,0.6)' : prizeData?.tier === 'MYTHIC' ? '0 0 40px rgba(170,170,170,0.6)' : prizeData?.tier === 'LEGEND' ? '0 0 40px rgba(0,210,211,0.6)' : prizeData?.tier === 'EPIC' ? '0 0 40px rgba(241,196,15,0.6)' : '0 10px 30px rgba(0,0,0,0.3)', transition: 'box-shadow 0.5s ease' }}>
//         <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
//       </div>
//       <div style={{ maxWidth: '500px', margin: '25px auto', padding: '0 20px' }}>
//         <button onClick={playGacha} disabled={cooldown > 0 || isLoading} style={{ width: '100%', padding: '18px', borderRadius: '10px', border: 'none', background: cooldown > 0 ? '#bdc3c7' : '#f1c40f', color: cooldown > 0 ? '#7f8c8d' : '#1e272e', fontSize: '20px', fontWeight: 'bold', cursor: cooldown > 0 ? 'not-allowed' : 'pointer', boxShadow: cooldown > 0 ? 'none' : '0 5px 0 #d35400', transform: isLoading ? 'scale(0.98)' : 'scale(1)', transition: 'all 0.1s', position: 'relative' }} onMouseDown={(e) => !cooldown && (e.currentTarget.style.boxShadow = 'none')} onMouseUp={(e) => !cooldown && (e.currentTarget.style.boxShadow = '0 5px 0 #d35400')}> {isLoading ? "..." : cooldown > 0 ? `${t.g_wait} (${cooldown})` : t.g_pull} </button>
//         <div style={{ width: '100%', height: '6px', background: '#333', borderRadius: '3px', marginTop: '15px', overflow: 'hidden' }}>
//             <div style={{ width: `${100-progress}%`, height: '100%', background: '#f1c40f', transition: 'width 1s linear' }} />
//         </div>
//       </div>
//       <div className="prob-table-container">
//           <h3 style={{marginTop:0, borderBottom:'1px solid #555', paddingBottom:10, color:'#f1c40f'}}>{t.probTable}</h3>
//           <div className="prob-row"><span style={{color:'#ff00ff', fontWeight:'bold'}}>{t.g_god} (0.1%)</span> <span>10억</span></div>
//           <div className="prob-row"><span style={{color:'#aaa', fontWeight:'bold'}}>{t.g_mythic} (1%)</span> <span>1억</span></div>
//           <div className="prob-row"><span style={{color:'#00d2d3', fontWeight:'bold'}}>{t.g_legend} (5%)</span> <span>500만</span></div>
//           <div className="prob-row"><span style={{color:'#f1c40f', fontWeight:'bold'}}>{t.g_epic} (10%)</span> <span>100만</span></div>
//           <div className="prob-row"><span style={{color:'#ff4757', fontWeight:'bold'}}>{t.g_common} (83.9%)</span> <span>5~10만</span></div>
//       </div>
//       {showResult && prizeData && (
//         <div className="result-modal" onClick={() => setShowResult(false)}>
//           <div className="result-content" onClick={(e) => e.stopPropagation()}>
//             <div style={{ color: '#aaa', fontSize: '14px', marginBottom: '10px', letterSpacing: '1px' }}>CONGRATULATIONS</div>
//             <div style={{ fontSize: '28px', fontWeight: 'bold', color: prizeData.color, marginBottom: '20px', textShadow: `0 0 10px ${prizeData.color}` }}>{prizeData.msg}</div>
//             <div style={{ fontSize: '40px', marginBottom: '30px' }}> {prizeData.tier === 'GOD' && '⚡'} {prizeData.tier === 'MYTHIC' && '🌟'} {prizeData.tier === 'LEGEND' && '💎'} {prizeData.tier === 'EPIC' && '👑'} {prizeData.tier === 'COMMON' && '💊'} </div>
//             <div style={{ fontSize: '32px', fontWeight: '900', color: '#f1c40f', marginBottom: '30px' }}>+{prizeData.money.toLocaleString()}</div>
//             <button className="btn" onClick={() => setShowResult(false)} style={{ width: '100%', padding: '15px', borderRadius: '10px', background: '#f1c40f', color: '#1e272e', fontWeight: 'bold', fontSize:'16px', border:'none', cursor:'pointer' }}>{t.confirm}</button>
//           </div>
//         </div>
//       )}
//       <button className="btn" style={{ marginTop: 20, background: 'transparent', color: '#888', border: 'none', cursor: 'pointer', fontSize:'16px' }} onClick={() => navigate('/home')}> {t.back} </button>
//     </div>
//   );
// }


import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import * as THREE from 'three';

const styles = `
  /* 결과 모달 */
  .result-modal { 
    position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
    background: rgba(0,0,0,0.85); z-index: 2000; 
    display: flex; justify-content: center; align-items: center; 
    backdrop-filter: blur(8px); 
    animation: modalFadeIn 0.3s ease;
  }
  
  @keyframes modalFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .result-content { 
    background: #2c3e50; 
    padding: 40px; border-radius: 20px; text-align: center; 
    border: 2px solid #f1c40f; 
    box-shadow: 0 0 30px rgba(241, 196, 15, 0.3); 
    width: 90%; max-width: 400px;
    animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    position: relative;
    color: white;
  }
  
  @keyframes popIn { 
    from { transform: scale(0.8); opacity: 0; } 
    to { transform: scale(1); opacity: 1; } 
  }
  
  /* 확률표 테이블 */
  .prob-table-container {
    margin-top: 30px;
    background: #2c3e50;
    padding: 20px;
    border-radius: 10px;
    border: 1px solid #444;
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
  }
  .prob-row {
    display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #444; color: #ddd; font-size: 14px;
  }
  .prob-row:last-child { border-bottom: none; }
`;

export default function Mining() {
  const [point, setPoint] = useState(0); 
  const [cooldown, setCooldown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [prizeData, setPrizeData] = useState(null); 

  const navigate = useNavigate();
  const user = auth.currentUser;
  const timerRef = useRef(null);
  const STORAGE_KEY = `gachaCooldown_v2_${user?.uid}`;
  const { t } = useLanguage();

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const animationRef = useRef(null);
  
  const cooldownRef = useRef(cooldown);

  useEffect(() => {
    cooldownRef.current = cooldown;
  }, [cooldown]);

  // 🔥 [추가] 페이지 진입 시 스크롤 맨 위로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // --- 효과음 ---
  const playSound = (tier) => {
    let audioFile = '/sounds/common.mp3';
    if (tier === 'GOD') audioFile = '/sounds/god.mp3';
    else if (tier === 'MYTHIC') audioFile = '/sounds/mythic.mp3';
    else if (tier === 'LEGEND') audioFile = '/sounds/legend.mp3';
    else if (tier === 'EPIC') audioFile = '/sounds/epic.mp3';
    const audio = new Audio(audioFile);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  };

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchPoint();
    const savedEndTime = localStorage.getItem(STORAGE_KEY);
    if (savedEndTime) {
      const remaining = Math.ceil((parseInt(savedEndTime) - Date.now()) / 1000);
      if (remaining > 0) { setCooldown(remaining); startTimer(remaining); } 
      else { localStorage.removeItem(STORAGE_KEY); }
    }
    return () => clearInterval(timerRef.current);
  }, [user, navigate]);

  // --- 3D Scene Setup ---
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    
    // 🎨 [수정됨] 배경색을 참고 이미지의 하늘색(밝은 청록색)으로 변경
    const skyColor = 0x64dcf5; 
    scene.background = new THREE.Color(skyColor);
    
    // 안개도 같은 색으로 설정하여 자연스럽게 블렌딩
    scene.fog = new THREE.Fog(skyColor, 15, 60);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3, 16);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      antialias: true,
      alpha: false 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // 화사한 느낌을 위해 톤매핑 조정
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    sceneRef.current = { 
      scene, 
      camera, 
      renderer, 
      ball: null, 
      clock: new THREE.Clock(), 
      isAnimating: false,
      particles: null,
      spotlights: [],
      originalCameraPos: { x: 0, y: 3, z: 16 },
      targetCameraPos: { x: 0, y: 3, z: 16 },
      cameraShake: 0
    };

    // 💡 조명 (햇살 느낌)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // 🏞️ 환경 생성 (여기가 핵심 변경 부분)
    createEnvironment(scene);

    // 🔴 몬스터볼 생성 (기본은 COMMON)
    const ball = createBall('COMMON'); 
    ball.position.set(0, -2, 0); 
    scene.add(ball);
    sceneRef.current.ball = ball;

    const handleResize = () => {
        if (!containerRef.current) return;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 🎬 메인 애니메이션 루프
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      const { ball, clock, isAnimating, camera, targetCameraPos, cameraShake, particles } = sceneRef.current;
      const isCooldown = cooldownRef.current > 0;
      const time = clock.elapsedTime;

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCameraPos.x, 0.05) + (Math.random() - 0.5) * cameraShake;
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCameraPos.y, 0.05) + (Math.random() - 0.5) * cameraShake;
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCameraPos.z, 0.05) + (Math.random() - 0.5) * cameraShake;
      sceneRef.current.cameraShake *= 0.9; 

      camera.lookAt(0, -1, 0);

      if (ball && !isAnimating) {
        if (!isCooldown) {
          ball.position.y = -2 + Math.sin(time * 2.5) * 0.2; 
          ball.rotation.y = time * 0.4;
          ball.rotation.z = Math.sin(time * 1.5) * 0.05;
          ball.rotation.x = Math.cos(time * 1.5) * 0.05;

          const btn = ball.getObjectByName("centerButton");
          if (btn) {
            const pulse = Math.sin(time * 3) * 0.3 + 0.7;
            btn.material.emissive.setHex(0xffffff);
            btn.material.emissiveIntensity = pulse * 0.5;
          }
        } else {
          ball.position.y = -2.2 + Math.sin(time * 1.5) * 0.08; 
          ball.rotation.y += 0.005; 
          ball.rotation.z = Math.sin(time * 1) * 0.03; 
          ball.rotation.x = 0;
          
          const btn = ball.getObjectByName("centerButton");
          if (btn) {
            btn.material.emissive.setHex(0x333333);
            btn.material.emissiveIntensity = 0.1;
          }
        }
      }
      
      if (particles) {
        particles.children.forEach((p, i) => {
          if (p.userData.isFlash) {
            p.scale.x += 0.5; p.scale.y += 0.5; p.scale.z += 0.5;
            p.material.opacity -= 0.05;
          } else {
            p.position.add(new THREE.Vector3(p.userData.velocityX, p.userData.velocityY, p.userData.velocityZ));
            p.userData.velocityY -= 0.015; 
            p.userData.age += 0.02;
            
            if (p.userData.age < 0.3) {
              const scale = THREE.MathUtils.lerp(0.1, p.userData.scaleTarget, p.userData.age / 0.3);
              p.scale.set(scale, scale, scale);
            } else {
              const shrink = 1 - ((p.userData.age - 0.3) / 0.7);
              const scale = p.userData.scaleTarget * Math.max(0, shrink);
              p.scale.set(scale, scale, scale);
            }
            if (p.userData.age > 0.5) p.material.opacity = 1 - ((p.userData.age - 0.5) / 0.5);
            if (p.userData.rotationSpeed) {
              p.rotation.x += p.userData.rotationSpeed.x;
              p.rotation.y += p.userData.rotationSpeed.y;
              p.rotation.z += p.userData.rotationSpeed.z;
            }
          }
        });
      }
      
      const sun = scene.children.find(c => c.userData.glow);
      if (sun && sun.userData.glow) {
          const pulse = Math.sin(time * 0.5) * 0.5 + 1;
          sun.userData.glow.scale.set(pulse, pulse, pulse);
          sun.userData.glow.material.opacity = 0.2 + Math.sin(time * 0.5) * 0.1;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      scene.traverse((object) => {
        if (object.isMesh) {
            object.geometry.dispose();
            if(object.material.map) object.material.map.dispose();
            object.material.dispose();
        }
      });
    };
  }, []);

  // 🏞️ 고퀄리티 배경 생성 (참고 이미지 스타일)
  const createEnvironment = (scene) => {
      // 1. 🌿 바닥 (밝은 연두색 잔디)
      const floorGeo = new THREE.PlaneGeometry(100, 100, 30, 30);
      const floorMat = new THREE.MeshStandardMaterial({ 
          color: 0x81c784, // 이미지의 밝은 연두색
          roughness: 1, 
          metalness: 0 
      });
      
      // 잔디의 울퉁불퉁함 표현
      const positions = floorGeo.attributes.position;
      for (let i = 0; i < positions.count; i++) {
          const z = positions.getZ(i);
          // 약간의 노이즈 추가
          positions.setZ(i, z + (Math.random() - 0.5) * 0.2);
      }
      floorGeo.computeVertexNormals();

      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -4;
      floor.receiveShadow = true;
      scene.add(floor);

      // 2. 🌳 왼쪽의 큰 나무 (참고 이미지 특징)
      const createDeciduousTree = (x, z, scale) => {
          const treeGroup = new THREE.Group();
          
          // 굵은 나무 기둥
          const trunkGeo = new THREE.CylinderGeometry(0.8 * scale, 1.2 * scale, 3.5 * scale, 8);
          const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41, flatShading: true }); // 갈색
          const trunk = new THREE.Mesh(trunkGeo, trunkMat);
          trunk.position.y = (3.5 * scale) / 2;
          trunk.castShadow = true;
          treeGroup.add(trunk);

          // 둥근 잎사귀 (이코스피어 사용)
          const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, flatShading: true, roughness: 0.8 });
          
          // 잎 덩어리들을 뭉쳐서 큰 나무 모양 만들기
          const positions = [
             { x: 0, y: 3, z: 0, s: 2.5 },
             { x: 1.5, y: 2.5, z: 1, s: 1.8 },
             { x: -1.5, y: 2.5, z: 0.5, s: 1.8 },
             { x: 0, y: 2.5, z: -1.5, s: 1.8 },
             { x: 0, y: 4, z: 0, s: 2 }
          ];

          positions.forEach(pos => {
              const leafGeo = new THREE.IcosahedronGeometry(pos.s * scale, 0);
              const leaf = new THREE.Mesh(leafGeo, leafMat);
              leaf.position.set(pos.x * scale, pos.y * scale, pos.z * scale);
              leaf.castShadow = true;
              treeGroup.add(leaf);
          });

          treeGroup.position.set(x, -4, z);
          scene.add(treeGroup);
      };

      // 이미지처럼 왼쪽에 큰 나무 배치
      createDeciduousTree(-10, -15, 1.8);

      // 3. 🌳 배경의 숲/덤불 벽 (Background Bush Wall)
      const createBush = (x, z, scale) => {
          const bushGeo = new THREE.DodecahedronGeometry(scale, 0);
          const bushMat = new THREE.MeshStandardMaterial({ 
              color: 0x1b5e20, // 짙은 녹색 (배경 숲)
              flatShading: true 
          });
          const bush = new THREE.Mesh(bushGeo, bushMat);
          bush.position.set(x, -4 + scale * 0.6, z);
          bush.castShadow = true;
          scene.add(bush);
      };

      // 뒤쪽에 덤불을 깔아서 숲 벽 만들기
      for (let x = -40; x <= 40; x += 5) {
          const z = -25 - Math.random() * 5;
          const scale = 3 + Math.random() * 2;
          createBush(x, z, scale);
          // 겹치게 하나 더
          createBush(x + 2.5, z - 2, scale * 0.8);
      }
      
      // 오른쪽 전경의 작은 덤불들 (이미지 오른쪽 풀숲 느낌)
      createBush(12, -10, 1.5);
      createBush(15, -12, 2.0);
      createBush(10, -15, 1.8);

      // 4. ☁️ 구름 (이미지 상단의 구름)
      const createCloud = (x, y, z, scale) => {
          const cloudGroup = new THREE.Group();
          const cloudMat = new THREE.MeshStandardMaterial({ 
              color: 0xffffff, transparent: true, opacity: 0.8, flatShading: true 
          });
          
          const p1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 0), cloudMat);
          const p2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 0), cloudMat);
          const p3 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.0, 0), cloudMat);
          
          p1.position.set(0, 0, 0);
          p2.position.set(1.5, -0.5, 0);
          p3.position.set(-1.5, -0.2, 0.5);
          
          cloudGroup.add(p1, p2, p3);
          cloudGroup.position.set(x, y, z);
          cloudGroup.scale.set(scale, scale * 0.6, scale);
          cloudGroup.name = 'cloud';
          cloudGroup.userData.speed = 0.002 + Math.random() * 0.002;
          scene.add(cloudGroup);
      };

      createCloud(-15, 10, -30, 2);
      createCloud(15, 12, -35, 2.5);
      createCloud(0, 14, -40, 1.8);
  };

  // 🔴 몬스터볼 생성 (깔끔하고 고급스러운 버전)
  const createBall = (tier) => {
      const group = new THREE.Group();
      
      // 1. 기본 재질 설정 (플라스틱 + 메탈 혼합 느낌)
      const commonSettings = { 
          roughness: 0.2,  // 낮을수록 반짝거림
          metalness: 0.3,  // 금속성
      };

      // 2. 티어별 색상 테마 정의
      let topColor, botColor, bandColor, btnColor;
      
      switch (tier) {
          case 'GOD': // 마스터볼 (보라 + 핑크 포인트)
              topColor = 0x7E57C2; // 진한 보라
              botColor = 0xffffff;
              bandColor = 0x222222; // 검정 띠
              btnColor = 0xEC407A;  // 핑크색 버튼
              commonSettings.metalness = 0.6; // 마스터볼은 더 메탈릭하게
              break;
          case 'MYTHIC': // 프레셔스볼 (올 레드 + 파란 버튼)
              topColor = 0xB71C1C; // 진한 레드
              botColor = 0xB71C1C; // 아래도 레드
              bandColor = 0x212121;
              btnColor = 0x2962FF; // 파란색 버튼
              break;
          case 'LEGEND': // 하이퍼볼 (검정 + 노랑 띠)
              topColor = 0x212121; // 검정
              botColor = 0xffffff;
              bandColor = 0xFFD600; // 진한 노랑 띠
              btnColor = 0xffffff;
              break;
          case 'EPIC': // 수퍼볼 (파랑 + 빨강 띠로 특징 구현)
              topColor = 0x1976D2; // 파랑
              botColor = 0xffffff;
              bandColor = 0xD32F2F; // 빨강 띠
              btnColor = 0xffffff;
              break;
          default: // 몬스터볼 (빨강 + 검정 띠)
              topColor = 0xF44336; // 밝은 빨강
              botColor = 0xffffff;
              bandColor = 0x212121;
              btnColor = 0xffffff;
              break;
      }

      // 재질 생성
      const matTop = new THREE.MeshStandardMaterial({ color: topColor, ...commonSettings });
      const matBot = new THREE.MeshStandardMaterial({ color: botColor, ...commonSettings });
      const matBand = new THREE.MeshStandardMaterial({ color: bandColor, ...commonSettings });
      const matBlack = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
      const matBtn = new THREE.MeshStandardMaterial({ 
          color: btnColor, 
          roughness: 0.1, 
          metalness: 0.8, // 버튼은 보석처럼 반짝이게
          emissive: btnColor, // 자체 발광 효과
          emissiveIntensity: 0.3 
      });

      // 3. 지오메트리 조립
      
      // 위쪽 반구
      const top = new THREE.Mesh(new THREE.SphereGeometry(2, 64, 32, 0, Math.PI*2, 0, Math.PI/2), matTop);
      group.add(top);
      
      // 아래쪽 반구
      const bot = new THREE.Mesh(new THREE.SphereGeometry(2, 64, 32, 0, Math.PI*2, Math.PI/2, Math.PI/2), matBot);
      group.add(bot);
      
      // 중간 띠 (Torus) - 약간 두껍게 해서 입체감 살림
      const band = new THREE.Mesh(new THREE.TorusGeometry(2.02, 0.15, 64, 100), matBand);
      band.rotation.x = Math.PI / 2;
      group.add(band);
      
      // 버튼 받침 (검은색 링)
      const btnBase = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.25, 32), matBlack);
      btnBase.rotation.x = Math.PI / 2;
      btnBase.position.z = 1.95;
      group.add(btnBase);

      // 가운데 버튼 (누르는 부분)
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32), matBtn);
      btn.rotation.x = Math.PI / 2;
      btn.position.z = 2.05; // 띠보다 톡 튀어나오게
      btn.name = "centerButton";
      group.add(btn);

      // 4. (옵션) 마스터볼 전용 장식: 양옆의 핑크색 구슬 (M자 대신 깔끔하게)
      if (tier === 'GOD') {
          const gemMat = new THREE.MeshStandardMaterial({ 
              color: 0xEC407A, 
              emissive: 0xEC407A, 
              emissiveIntensity: 0.5,
              roughness: 0.1,
              metalness: 0.8
          });
          
          // 왼쪽 구슬
          const leftGem = new THREE.Mesh(new THREE.SphereGeometry(0.35, 32, 32), gemMat);
          leftGem.position.set(-1.4, 1.0, 1.0);
          group.add(leftGem);

          // 오른쪽 구슬
          const rightGem = new THREE.Mesh(new THREE.SphereGeometry(0.35, 32, 32), gemMat);
          rightGem.position.set(1.4, 1.0, 1.0);
          group.add(rightGem);
      }

      // 그림자 설정
      group.traverse((obj) => {
          if (obj.isMesh) {
              obj.castShadow = true;
              obj.receiveShadow = true;
          }
      });
      
      return group;
  };

  // ✨ 고퀄리티 파티클 생성
  const createParticles = (color, count = 100) => {
      const particles = new THREE.Group();
      for (let layer = 0; layer < 3; layer++) {
          const layerCount = count / 3;
          for (let i = 0; i < layerCount; i++) {
              const geometry = new THREE.SphereGeometry(0.08 + Math.random() * 0.05, 8, 8);
              const material = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 2, transparent: true, opacity: 1, metalness: 0.5, roughness: 0.2 });
              const particle = new THREE.Mesh(geometry, material);
              const angle = (Math.PI * 2 * i) / layerCount;
              const elevation = (Math.random() - 0.5) * 0.6; 
              const speed = 0.2 + Math.random() * 0.15 + (layer * 0.05);
              particle.position.set(0, -2, 0);
              particle.userData.velocityX = Math.cos(angle) * speed;
              particle.userData.velocityY = 0.25 + Math.random() * 0.2 + elevation;
              particle.userData.velocityZ = Math.sin(angle) * speed;
              particle.userData.rotationSpeed = { x: (Math.random() - 0.5) * 0.2, y: (Math.random() - 0.5) * 0.2, z: (Math.random() - 0.5) * 0.2 };
              particle.scale.set(0.1, 0.1, 0.1);
              particle.userData.scaleTarget = 1 + Math.random() * 0.5;
              particle.userData.age = 0;
              particles.add(particle);
          }
      }
      const flashGeo = new THREE.SphereGeometry(0.3, 16, 16);
      const flashMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 1 });
      const flash = new THREE.Mesh(flashGeo, flashMat); flash.position.set(0, -2, 0); flash.userData.isFlash = true; particles.add(flash);
      return particles;
  };

  // 💥 애니메이션 시퀀스
  const runCatchSequence = (tier, tierColor) => {
      const { scene, ball, camera } = sceneRef.current;
      sceneRef.current.isAnimating = true;

      // 🔥 기존 볼 제거하고 새로운 티어의 볼로 교체
      if (ball) {
          scene.remove(ball);
      }
      const newBall = createBall(tier);
      newBall.position.set(5, 12, 5);
      newBall.rotation.set(0, 0, 0);
      scene.add(newBall);
      sceneRef.current.ball = newBall;

      const startTime = Date.now();
      const floorY = -2;

      sceneRef.current.targetCameraPos = { x: 0, y: 2.5, z: 14 };

      const loop = () => {
          if (!sceneRef.current || !sceneRef.current.ball) return;
          const now = Date.now();
          const elapsed = (now - startTime) / 1000;
          const currentBall = sceneRef.current.ball;

          if (elapsed < 0.5) {
              currentBall.position.x = 5 - (elapsed * 10);
              currentBall.position.z = 5 - (elapsed * 10);
              currentBall.position.y = 12 - (25 * elapsed * elapsed);
              if (currentBall.position.y < floorY) currentBall.position.y = floorY;
              currentBall.rotation.x -= 0.3; currentBall.rotation.z -= 0.15;
              
              if (Math.random() > 0.7) {
                  const trail = currentBall.clone(); trail.scale.multiplyScalar(0.8);
                  trail.traverse(child => { if (child.material) { child.material = child.material.clone(); child.material.transparent = true; child.material.opacity = 0.3; } });
                  scene.add(trail); setTimeout(() => scene.remove(trail), 100);
              }
          }
          else if (elapsed < 0.8) {
              const t = elapsed - 0.5;
              currentBall.position.y = floorY + Math.sin(t * Math.PI * 3.3) * 3.5;
              currentBall.rotation.x -= 0.2;
              if (t < 0.1) sceneRef.current.cameraShake = 0.3;
          }
          else if (elapsed < 1.1) {
              const t = elapsed - 0.8;
              currentBall.position.y = floorY + Math.sin(t * Math.PI * 3.3) * 1.5;
              currentBall.rotation.x -= 0.1;
          }
          else if (elapsed < 1.5) {
              currentBall.position.set(0, floorY, 0);
              currentBall.rotation.set(0, 0, 0);
              sceneRef.current.targetCameraPos.z = 14.5;
          }
          else if (elapsed < 4.5) {
              const wobbleTime = elapsed - 1.5;
              const btn = currentBall.getObjectByName("centerButton");
              const shakePhases = [{ start: 0.2, end: 1.0 }, { start: 1.2, end: 2.0 }, { start: 2.2, end: 3.0 }];
              let isShaking = false;
              shakePhases.forEach(phase => { if (wobbleTime > phase.start && wobbleTime < phase.end) isShaking = true; });
              
              if (isShaking) {
                  const intensity = 0.6 + (tier === 'GOD' ? 0.4 : tier === 'MYTHIC' ? 0.3 : 0); 
                  const shake = Math.sin(wobbleTime * Math.PI * 10) * intensity;
                  currentBall.rotation.z = shake;
                  currentBall.rotation.x = Math.sin(wobbleTime * Math.PI * 7) * intensity * 0.5;
                  if (btn) { btn.material.emissive.setHex(0xff0000); btn.material.emissiveIntensity = 1.5 + Math.sin(wobbleTime * 20) * 0.5; }
                  sceneRef.current.cameraShake = intensity * 0.15;
              } else {
                  currentBall.rotation.z *= 0.9; currentBall.rotation.x *= 0.9;
                  if (btn) { btn.material.emissive.setHex(0x555555); btn.material.emissiveIntensity = 0.2; }
              }
          }
          else {
              currentBall.rotation.z = 0; currentBall.rotation.x = 0;
              const btn = currentBall.getObjectByName("centerButton");
              if (btn) { btn.material.emissive.setHex(tierColor); btn.material.emissiveIntensity = 3; }
              
              if (!sceneRef.current.particles) {
                  const particleCount = tier === 'GOD' ? 150 : tier === 'MYTHIC' ? 120 : tier === 'LEGEND' ? 100 : 80;
                  const particles = createParticles(tierColor, particleCount);
                  scene.add(particles);
                  sceneRef.current.particles = particles;
                  
                  if (tier === 'GOD' || tier === 'MYTHIC') {
                      const spotlight = new THREE.SpotLight(tierColor, 3);
                      spotlight.position.set(0, 10, 0); spotlight.target.position.set(0, -2, 0);
                      spotlight.angle = Math.PI / 6; spotlight.penumbra = 0.5;
                      scene.add(spotlight); scene.add(spotlight.target);
                      sceneRef.current.spotlights.push(spotlight);
                      scene.fog.color.setHex(tierColor);
                      scene.background.setHex(tierColor); 
                  }
                  
                  sceneRef.current.cameraShake = tier === 'GOD' ? 0.8 : tier === 'MYTHIC' ? 0.6 : 0.4;
                  
                  setTimeout(() => {
                      if (sceneRef.current.particles) { scene.remove(sceneRef.current.particles); sceneRef.current.particles = null; }
                      scene.fog.color.setHex(0x64dcf5); // 원래 하늘색으로 복구
                      scene.background.setHex(0x64dcf5); // 원래 하늘색으로 복구
                      sceneRef.current.spotlights.forEach(light => scene.remove(light));
                      sceneRef.current.spotlights = [];
                  }, 5000);
              }
              return; 
          }
          requestAnimationFrame(loop);
      };
      loop();
  };

  const fetchPoint = async () => { try { const d = await getDoc(doc(db, "users", user.uid)); if (d.exists()) setPoint(d.data().point || 0); } catch (e) {} };

  const startTimer = (seconds) => {
    clearInterval(timerRef.current);
    let timeLeft = seconds;
    setCooldown(timeLeft);
    timerRef.current = setInterval(() => {
      timeLeft -= 1;
      setCooldown(timeLeft);
      if (timeLeft <= 0) { 
        clearInterval(timerRef.current); 
        localStorage.removeItem(STORAGE_KEY);
        if(sceneRef.current) {
          sceneRef.current.isAnimating = false;
          sceneRef.current.targetCameraPos = { x: 0, y: 3, z: 16 };
          // 쿨다운 끝나도 마지막 상태 유지
        }
      }
    }, 1000);
  };

  const playGacha = async () => {
    if (cooldown > 0 || isLoading) return;

    // 🔥 가챠 밴 확인 로직
    try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.gachaBanDate) {
                const banDate = data.gachaBanDate.toDate();
                if (banDate > new Date()) {
                    return alert(`🚫 가챠 이용이 제한되었습니다.\n해제 일시: ${banDate.toLocaleString()}`);
                }
            }
        }
    } catch (e) {
        console.error("Ban check error", e);
        return;
    }

    setIsLoading(true);
    if (navigator.vibrate) navigator.vibrate(50);

    const rand = Math.random() * 100;
    let prize = 0; let tier = ""; let color = ""; let msg = ""; let tierColor = 0xdc3545;

    if (rand < 0.1) { prize = 1000000000; tier = "GOD"; color = "#ff00ff"; msg = t.g_god; tierColor = 0xff00ff; } 
    else if (rand < 1.1) { prize = 100000000; tier = "MYTHIC"; color = "#aaa"; msg = t.g_mythic; tierColor = 0xaaaaaa; } 
    else if (rand < 6.1) { prize = 5000000; tier = "LEGEND"; color = "#00d2d3"; msg = t.g_legend; tierColor = 0x00d2d3; } 
    else if (rand < 16.1) { prize = 1000000; tier = "EPIC"; color = "#f1c40f"; msg = t.g_epic; tierColor = 0xf1c40f; } 
    else { prize = Math.floor(Math.random() * 50001) + 50000; tier = "COMMON"; color = "#ff4757"; msg = t.g_common; tierColor = 0xff4757; }

    runCatchSequence(tier, tierColor);

    setTimeout(async () => {
      try {
        await updateDoc(doc(db, "users", user.uid), { point: increment(prize) });
        setPoint(prev => prev + prize); 
        await addDoc(collection(db, "history"), { uid: user.uid, type: "가챠", msg: `${msg} 당첨`, amount: prize, createdAt: serverTimestamp() });
        setPrizeData({ tier, msg, money: prize, color });
        setShowResult(true);
        playSound(tier);
        const coolTime = 60;
        const endTime = Date.now() + (coolTime * 1000);
        localStorage.setItem(STORAGE_KEY, endTime);
        startTimer(coolTime);
      } catch (e) { alert(t.alertError); } 
      finally { setIsLoading(false); }
    }, 5000);
  };

  const progress = Math.min(100, (cooldown / 60) * 100);

  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: 20, background: '#1e272e', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>
      <style>{styles}</style>
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', position:'relative', marginBottom: 10 }}>
        <h1 style={{ color: '#f1c40f', fontSize: '32px', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}> {t.gachaTitle} </h1>
      </div>
      <div ref={containerRef} style={{ width: '100%', maxWidth: '500px', height: '400px', margin: '0 auto', position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '2px solid #ddd', boxShadow: prizeData?.tier === 'GOD' ? '0 0 40px rgba(255,0,255,0.6)' : prizeData?.tier === 'MYTHIC' ? '0 0 40px rgba(170,170,170,0.6)' : prizeData?.tier === 'LEGEND' ? '0 0 40px rgba(0,210,211,0.6)' : prizeData?.tier === 'EPIC' ? '0 0 40px rgba(241,196,15,0.6)' : '0 10px 30px rgba(0,0,0,0.3)', transition: 'box-shadow 0.5s ease' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>
      <div style={{ maxWidth: '500px', margin: '25px auto', padding: '0 20px' }}>
        <button onClick={playGacha} disabled={cooldown > 0 || isLoading} style={{ width: '100%', padding: '18px', borderRadius: '10px', border: 'none', background: cooldown > 0 ? '#bdc3c7' : '#f1c40f', color: cooldown > 0 ? '#7f8c8d' : '#1e272e', fontSize: '20px', fontWeight: 'bold', cursor: cooldown > 0 ? 'not-allowed' : 'pointer', boxShadow: cooldown > 0 ? 'none' : '0 5px 0 #d35400', transform: isLoading ? 'scale(0.98)' : 'scale(1)', transition: 'all 0.1s', position: 'relative' }} onMouseDown={(e) => !cooldown && (e.currentTarget.style.boxShadow = 'none')} onMouseUp={(e) => !cooldown && (e.currentTarget.style.boxShadow = '0 5px 0 #d35400')}> {isLoading ? "..." : cooldown > 0 ? `${t.g_wait} (${cooldown})` : t.g_pull} </button>
        <div style={{ width: '100%', height: '6px', background: '#333', borderRadius: '3px', marginTop: '15px', overflow: 'hidden' }}>
            <div style={{ width: `${100-progress}%`, height: '100%', background: '#f1c40f', transition: 'width 1s linear' }} />
        </div>
      </div>
      <div className="prob-table-container">
          <h3 style={{marginTop:0, borderBottom:'1px solid #555', paddingBottom:10, color:'#f1c40f'}}>{t.probTable}</h3>
          <div className="prob-row"><span style={{color:'#ff00ff', fontWeight:'bold'}}>{t.g_god} (0.1%)</span> <span>10억</span></div>
          <div className="prob-row"><span style={{color:'#aaa', fontWeight:'bold'}}>{t.g_mythic} (1%)</span> <span>1억</span></div>
          <div className="prob-row"><span style={{color:'#00d2d3', fontWeight:'bold'}}>{t.g_legend} (5%)</span> <span>500만</span></div>
          <div className="prob-row"><span style={{color:'#f1c40f', fontWeight:'bold'}}>{t.g_epic} (10%)</span> <span>100만</span></div>
          <div className="prob-row"><span style={{color:'#ff4757', fontWeight:'bold'}}>{t.g_common} (83.9%)</span> <span>5~10만</span></div>
      </div>
      {showResult && prizeData && (
        <div className="result-modal" onClick={() => setShowResult(false)}>
          <div className="result-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ color: '#aaa', fontSize: '14px', marginBottom: '10px', letterSpacing: '1px' }}>CONGRATULATIONS</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: prizeData.color, marginBottom: '20px', textShadow: `0 0 10px ${prizeData.color}` }}>{prizeData.msg}</div>
            <div style={{ fontSize: '40px', marginBottom: '30px' }}> {prizeData.tier === 'GOD' && '⚡'} {prizeData.tier === 'MYTHIC' && '🌟'} {prizeData.tier === 'LEGEND' && '💎'} {prizeData.tier === 'EPIC' && '👑'} {prizeData.tier === 'COMMON' && '💊'} </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#f1c40f', marginBottom: '30px' }}>+{prizeData.money.toLocaleString()}</div>
            <button className="btn" onClick={() => setShowResult(false)} style={{ width: '100%', padding: '15px', borderRadius: '10px', background: '#f1c40f', color: '#1e272e', fontWeight: 'bold', fontSize:'16px', border:'none', cursor:'pointer' }}>{t.confirm}</button>
          </div>
        </div>
      )}
      <button className="btn" style={{ marginTop: 20, background: 'transparent', color: '#888', border: 'none', cursor: 'pointer', fontSize:'16px' }} onClick={() => navigate('/home')}> {t.back} </button>
    </div>
  );
}