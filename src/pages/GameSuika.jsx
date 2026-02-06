
// import React, { useState, useEffect, useRef } from 'react';
// import { db, auth } from '../firebase.js'; 
// import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp, getDoc, doc, updateDoc, increment } from 'firebase/firestore'; 
// import { useNavigate } from 'react-router-dom';
// import { useLanguage } from '../LanguageContext';
// import Matter from 'matter-js';

// // 🍒 과일 데이터
// const FRUITS = [
//   { name: 'cherry', radius: 15, color: '#F44336', emoji: '🍒', score: 2 },        // 0
//   { name: 'strawberry', radius: 21, color: '#E91E63', emoji: '🍓', score: 4 },    // 1
//   { name: 'grape', radius: 29, color: '#9C27B0', emoji: '🍇', score: 6 },         // 2
//   { name: 'dekopon', radius: 36, color: '#FF9800', emoji: '🍊', score: 10 },      // 3
//   { name: 'orange', radius: 45, color: '#FF5722', emoji: '🎃', score: 15 },       // 4
//   { name: 'apple', radius: 58, color: '#F44336', emoji: '🍎', score: 25 },        // 5
//   { name: 'pear', radius: 69, color: '#CDDC39', emoji: '🍐', score: 40 },         // 6
//   { name: 'peach', radius: 81, color: '#F8BBD0', emoji: '🍑', score: 60 },        // 7
//   { name: 'pineapple', radius: 98, color: '#FFEB3B', emoji: '🍍', score: 85 },    // 8
//   { name: 'melon', radius: 113, color: '#8BC34A', emoji: '🍈', score: 110 },      // 9
//   { name: 'watermelon', radius: 138, color: '#4CAF50', emoji: '🍉', score: 300 }, // 10
// ];

// // 💰 배당률표
// const PAYOUT_TABLE = {
//     500: 0.01,
//     1000: 0.1,
//     1500: 0.5,
//     2000: 1.1,
//     2500: 1.3,
//     3000: 1.5,
//     4000: 2.0
// };

// const GAME_WIDTH = 360;
// const GAME_HEIGHT = 600;
// const WALL_THICKNESS = 100;
// const DEAD_LINE_Y = 120;
// const DROP_START_Y = 20; // 데드라인 훨씬 위에서 과일 시작 (y=0이 맨 위)

// export default function GameSuika() {
//   const navigate = useNavigate();
//   const user = auth.currentUser;
//   const { t } = useLanguage();

//   const [score, setScore] = useState(0);
//   const [gameState, setGameState] = useState('ready'); 
//   const [ranks, setRanks] = useState([]);
//   const [nextFruitIdx, setNextFruitIdx] = useState(0);
//   const [nextNextFruitIdx, setNextNextFruitIdx] = useState(0); // 다다음 과일
//   const [previewX, setPreviewX] = useState(GAME_WIDTH / 2);

//   const [myPoint, setMyPoint] = useState(0);
//   const [betAmount, setBetAmount] = useState(1000);
//   const [resultMessage, setResultMessage] = useState("");
//   const [showGameOverModal, setShowGameOverModal] = useState(false);

//   const canvasRef = useRef(null);
//   const sceneRef = useRef(null); 
//   const scoreRef = useRef(0);
//   const isDroppingRef = useRef(false);
//   const gameOverRef = useRef(false);
//   const betAmountRef = useRef(1000);

//   useEffect(() => {
//     return () => cleanupMatterJS();
//   }, []);

//   useEffect(() => {
//     if (!user) { navigate('/login'); return; }
//     window.scrollTo({ top: 0, behavior: 'auto' });
//     fetchUserData();
//     fetchRanks();
//     setNextFruitIdx(Math.floor(Math.random() * 4)); 
//     setNextNextFruitIdx(Math.floor(Math.random() * 4));
//   }, [user, navigate]);

//   const fetchUserData = async () => {
//       if (user) {
//           try {
//               const userSnap = await getDoc(doc(db, "users", user.uid));
//               if (userSnap.exists()) setMyPoint(userSnap.data().point || 0);
//           } catch (e) { console.error(e); }
//       }
//   };

//   const fetchRanks = async () => {
//     try {
//       const q = query(collection(db, "game_suika_ranks"), orderBy("score", "desc"), limit(50));
//       const snap = await getDocs(q);
//       const rawList = snap.docs.map(doc => doc.data());
//       const filteredList = [];
//       const userCounts = {};

//       for (const item of rawList) {
//           const uid = item.uid;
//           if (!userCounts[uid]) userCounts[uid] = 0;
//           if (userCounts[uid] < 3) {
//               filteredList.push(item);
//               userCounts[uid]++;
//           }
//           if (filteredList.length >= 10) break;
//       }
//       setRanks(filteredList);
//     } catch (e) { console.error(e); }
//   };

//   const startGame = async () => {
//     if (betAmount <= 0 || betAmount > myPoint) {
//       alert(t.alertNoMoney || "포인트 부족");
//       return;
//     }

//     try {
//         await updateDoc(doc(db, "users", user.uid), { point: increment(-betAmount) });
//         setMyPoint(prev => prev - betAmount);
//         betAmountRef.current = betAmount;

//         await addDoc(collection(db, "history"), {
//             uid: user.uid, 
//             type: "게임", 
//             msg: `🍉 수박게임 ${t.gameStart || '시작'}`, 
//             amount: -betAmount, 
//             createdAt: serverTimestamp()
//         });

//         setGameState('playing');
//         setScore(0);
//         scoreRef.current = 0;
//         gameOverRef.current = false;
//         isDroppingRef.current = false;
//         setResultMessage("");
//         setShowGameOverModal(false);
        
//         setNextFruitIdx(Math.floor(Math.random() * 4)); 
//         setNextNextFruitIdx(Math.floor(Math.random() * 4));
//         setPreviewX(GAME_WIDTH / 2);

//         initMatterJS(); 

//     } catch (e) { 
//       console.error(e);
//       alert("오류 발생"); 
//     }
//   };

//   const cleanupMatterJS = () => {
//     if (sceneRef.current) {
//       const { engine, render, runner, world } = sceneRef.current;
//       Matter.Events.off(engine);
//       Matter.Render.stop(render);
//       Matter.Runner.stop(runner);
//       if (render.canvas) render.canvas.remove();
//       Matter.World.clear(world, false);
//       Matter.Engine.clear(engine);
//       sceneRef.current = null;
//     }
//   };

//   const initMatterJS = () => {
//     cleanupMatterJS();

//     const { Engine, Render, Runner, World, Bodies, Events, Composite, Body } = Matter;

//     const engine = Engine.create({
//         enableSleeping: false
//     });
    
//     engine.gravity.y = 1.0;
//     engine.positionIterations = 30;
//     engine.velocityIterations = 20;
//     engine.constraintIterations = 10;
    
//     const world = engine.world;

//     const canvas = document.createElement('canvas');
//     canvasRef.current.innerHTML = '';
//     canvasRef.current.appendChild(canvas);

//     const render = Render.create({
//       element: canvasRef.current,
//       engine: engine,
//       options: {
//         width: GAME_WIDTH,
//         height: GAME_HEIGHT,
//         wireframes: false,
//         background: '#FFF3E0', 
//         pixelRatio: window.devicePixelRatio || 1, 
//         showSleeping: false
//       }
//     });

//     const ground = Bodies.rectangle(
//         GAME_WIDTH / 2, 
//         GAME_HEIGHT - 80,
//         GAME_WIDTH + 400,
//         WALL_THICKNESS * 2,
//         { 
//             isStatic: true, 
//             render: { fillStyle: '#8D6E63' }, 
//             friction: 1.0,
//             restitution: 0.0,
//             slop: 0
//         }
//     );
    
//     const leftWall = Bodies.rectangle(
//         -WALL_THICKNESS / 2, 
//         GAME_HEIGHT / 2, 
//         WALL_THICKNESS, 
//         GAME_HEIGHT * 3,
//         { 
//             isStatic: true, 
//             render: { fillStyle: '#8D6E63' }, 
//             friction: 0.5,
//             restitution: 0.0,
//             slop: 0
//         }
//     );
    
//     const rightWall = Bodies.rectangle(
//         GAME_WIDTH + WALL_THICKNESS / 2, 
//         GAME_HEIGHT / 2, 
//         WALL_THICKNESS, 
//         GAME_HEIGHT * 3,
//         { 
//             isStatic: true, 
//             render: { fillStyle: '#8D6E63' }, 
//             friction: 0.5,
//             restitution: 0.0,
//             slop: 0
//         }
//     );

//     World.add(world, [ground, leftWall, rightWall]);

//     // 💥 충돌 및 합치기 로직
//     Events.on(engine, 'collisionStart', (event) => {
//         if (gameOverRef.current) return;

//         event.pairs.forEach((pair) => {
//             const { bodyA, bodyB } = pair;
            
//             if (bodyA.fruitId === undefined || bodyB.fruitId === undefined) return;
//             if (bodyA.fruitId !== bodyB.fruitId) return;
//             if (bodyA.isMerging || bodyB.isMerging) return; 

//             const currentIdx = bodyA.fruitId;
//             if (currentIdx >= FRUITS.length - 1) return; 

//             bodyA.isMerging = true;
//             bodyB.isMerging = true;

//             const midX = (bodyA.position.x + bodyB.position.x) / 2;
//             const midY = (bodyA.position.y + bodyB.position.y) / 2;

//             World.remove(world, [bodyA, bodyB]);

//             const nextIdx = currentIdx + 1;
//             const newFruit = createFruit(midX, midY, nextIdx);
            
//             Body.setVelocity(newFruit, { x: 0, y: 0 });
//             Body.setAngularVelocity(newFruit, 0);
            
//             // 합쳐진 과일은 3초간 게임오버 체크 제외
//             newFruit.justMerged = true;
//             setTimeout(() => { if(newFruit) newFruit.justMerged = false; }, 3000);
            
//             World.add(world, newFruit);

//             scoreRef.current += FRUITS[nextIdx].score;
//             setScore(scoreRef.current);
//         });
//     });

//     let checkInterval = 0;
//     Events.on(engine, 'afterUpdate', () => {
//         if (gameOverRef.current) return;
//         checkInterval++;
        
//         if (checkInterval % 60 === 0) {  // 30 -> 60으로 변경 (더 느리게 체크)
//             const bodies = Composite.allBodies(world);
//             let fruitCountAboveLine = 0;
//             let staticFruitCount = 0;
            
//             // 데드라인 위에 있는 과일들 카운트
//             for (let b of bodies) {
//                 if (b.isStatic || b.isDropping || b.justMerged) continue;
                
//                 if (b.position.y < DEAD_LINE_Y - 10) {  // 10px 여유
//                     fruitCountAboveLine++;
                    
//                     // 거의 정지한 과일
//                     if (Math.abs(b.velocity.y) < 0.3 && Math.abs(b.velocity.x) < 0.3) {
//                         staticFruitCount++;
//                     }
//                 }
//             }
            
//             // 3개 이상의 과일이 데드라인 위에서 정지해있으면 게임오버
//             if (fruitCountAboveLine >= 3 && staticFruitCount >= 2) {
//                 gameOverRef.current = true;
//                 setTimeout(() => {
//                     endGame();
//                 }, 1500);
//             }
//         }
//     });

//     const runner = Runner.create();
//     Runner.run(runner, engine);
//     Render.run(render);

//     // 🎨 이모지 그리기
//     Events.on(render, 'afterRender', () => {
//       const context = render.context;
//       const bodies = Composite.allBodies(world);
//       bodies.forEach(body => {
//         if (body.fruitEmoji) {
//           const { x, y } = body.position;
//           const radius = body.circleRadius; 
//           const fontSize = radius * 1.65;
          
//           context.translate(x, y);
//           context.rotate(body.angle);
//           context.textAlign = 'center';
//           context.textBaseline = 'middle';
//           context.font = `${fontSize}px serif`; 
//           context.fillText(body.fruitEmoji, 0, 4); 
//           context.rotate(-body.angle);
//           context.translate(-x, -y);
//         }
//       });
//     });

//     sceneRef.current = { engine, render, runner, world };
//   };

//   const createFruit = (x, y, index) => {
//     const fruitInfo = FRUITS[index];
//     const body = Matter.Bodies.circle(x, y, fruitInfo.radius, {
//         restitution: 0.05,
//         friction: 0.8,
//         density: 0.0005,
//         slop: 0,
//         frictionAir: 0.01,
//         render: { 
//           fillStyle: fruitInfo.color,
//           strokeStyle: 'rgba(0,0,0,0.1)',
//           lineWidth: 1
//         }
//     });
//     body.fruitId = index;
//     body.fruitEmoji = fruitInfo.emoji;
//     body.circleRadius = fruitInfo.radius;
//     return body;
//   };

//   const handleMove = (e) => {
//     if (gameState !== 'playing' || gameOverRef.current) return;
//     const rect = canvasRef.current?.getBoundingClientRect();
//     if (!rect) return;
//     const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
//     let x = clientX - rect.left;
//     const r = FRUITS[nextFruitIdx].radius;
//     x = Math.max(r + 10, Math.min(x, GAME_WIDTH - r - 10));
//     setPreviewX(x);
//   };

//   const handleDrop = (e) => {
//     if (gameState !== 'playing' || isDroppingRef.current || gameOverRef.current) return;
//     e.preventDefault(); 
//     isDroppingRef.current = true;
//     const x = previewX; 
    
//     if (sceneRef.current) {
//       // 데드라인 위에서 과일 드롭
//       const fruit = createFruit(x, DROP_START_Y, nextFruitIdx); 
//       fruit.isDropping = true;
//       Matter.World.add(sceneRef.current.world, fruit);
//       setTimeout(() => { if(fruit) fruit.isDropping = false; }, 1000);  // 500ms -> 1000ms
//     }

//     // 다음 과일로 이동
//     setNextFruitIdx(nextNextFruitIdx);
//     setNextNextFruitIdx(Math.floor(Math.random() * 4));
//     setTimeout(() => { isDroppingRef.current = false; }, 300);
//   };

//   const endGame = async () => {
//     if (gameState === 'finished') return;
//     setGameState('finished');
    
//     // 모달만 표시하고 물리 엔진은 유지
//     setShowGameOverModal(true);

//     const finalScore = scoreRef.current;
    
//     let multiplier = 0;
//     const scores = Object.keys(PAYOUT_TABLE).map(Number).sort((a,b)=>b-a);
//     for (let s of scores) {
//         if (finalScore >= s) {
//             multiplier = PAYOUT_TABLE[s];
//             break;
//         }
//     }

//     const earned = Math.floor(betAmountRef.current * multiplier);
//     let msg = "";

//     if (earned > 0) {
//         msg = `🎉 Win! ${finalScore}점 x${multiplier} (+${earned.toLocaleString()}P)`;
//         try {
//             await updateDoc(doc(db, "users", user.uid), { point: increment(earned) });
//             setMyPoint(prev => prev + earned);
//             await addDoc(collection(db, "history"), {
//                 uid: user.uid, type: "게임", msg: `🍉 수박게임 [${finalScore}점] 획득`, amount: earned, createdAt: serverTimestamp()
//             });
//         } catch(e) {}
//     } else {
//         msg = `😭 실패... (Score: ${finalScore})`;
//     }
//     setResultMessage(msg);

//     if (finalScore >= 500) {
//         try {
//             const userSnap = await getDoc(doc(db, "users", user.uid));
//             await addDoc(collection(db, "game_suika_ranks"), {
//                 uid: user.uid, name: userSnap.data().name || "익명", score: finalScore, createdAt: serverTimestamp()
//             });
//             fetchRanks();
//         } catch(e) {}
//     }

//     // 3초 후 물리 엔진 정리
//     setTimeout(() => {
//         cleanupMatterJS();
//     }, 3000);
//   };

//   const restartGame = () => {
//     cleanupMatterJS();
//     setShowGameOverModal(false);
//     setGameState('ready');
//   };

//   return (
//     <div className="container" style={{ background: '#2c3e50', minHeight: '100vh', padding: '10px 5px', display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect:'none' }}>
      
//       {/* 헤더 */}
//       <div style={{width: '100%', maxWidth: '360px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10, background: 'rgba(0,0,0,0.3)', padding: '12px 15px', borderRadius: 10, border: '1px solid #444'}}>
//          <button className="btn" onClick={() => navigate('/home')} style={{background:'#e74c3c', fontSize:14, padding:'8px 15px', color:'white', border:'none', borderRadius:6, fontWeight:'bold'}}>{t.home || 'HOME'}</button>
//          <div style={{fontWeight:'bold', color:'#f1c40f', fontSize:22}}>🎯 {score}</div>
//          <div style={{fontWeight:'bold', color:'white', fontSize:14, background:'rgba(255,255,255,0.1)', padding:'5px 10px', borderRadius:15}}>💰 {myPoint.toLocaleString()}</div>
//       </div>

//       {/* 게임 영역 */}
//       <div style={{ position: 'relative', width: GAME_WIDTH, height: GAME_HEIGHT, background: '#FFF3E0', borderRadius: 10, overflow: 'hidden', border: '4px solid #8D6E63', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
//           {/* 데드라인 */}
//           <div style={{position:'absolute', top:0, left:0, width:'100%', height: DEAD_LINE_Y + 'px', pointerEvents:'none', zIndex:5, borderBottom:'2px dashed #e74c3c'}}>
//               <span style={{position:'absolute', right:5, bottom:2, fontSize:10, color:'#e74c3c', fontWeight:'bold'}}>DEADLINE</span>
//           </div>

//           {/* NEXT 과일 & 프리뷰 */}
//           {gameState === 'playing' && !gameOverRef.current && (
//               <>
//                 <div style={{position:'absolute', top:10, right:10, zIndex:10, background:'rgba(255,255,255,0.9)', padding:'8px 12px', borderRadius:15, border:'2px solid #8D6E63', textAlign:'center', width: '60px', height: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
//                     <div style={{fontSize:10, fontWeight:'bold', color: '#5D4037', marginBottom: '2px'}}>NEXT</div>
//                     <div style={{fontSize: 28, lineHeight: 1}}>{FRUITS[nextNextFruitIdx].emoji}</div>
//                 </div>
//                 <div style={{
//                     position:'absolute', left: previewX, top: DROP_START_Y, 
//                     fontSize: FRUITS[nextFruitIdx].radius * 1.65, 
//                     opacity: 0.7, transform: 'translate(-50%, -50%)', 
//                     pointerEvents:'none', zIndex: 8, transition: 'left 0.05s linear'
//                 }}>
//                     {FRUITS[nextFruitIdx].emoji}
//                 </div>
//               </>
//           )}

//           <div 
//             ref={canvasRef}
//             onMouseMove={handleMove}
//             onTouchMove={handleMove}
//             onMouseDown={handleDrop}
//             onTouchStart={handleDrop}
//             style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none', cursor: gameState === 'playing' && !gameOverRef.current ? 'pointer' : 'default' }}
//           />

//           {/* 시작 화면 */}
//           {gameState === 'ready' && (
//              <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', background:'rgba(44, 62, 80, 0.95)', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', zIndex:20, padding: '20px', boxSizing: 'border-box' }}>
//                  <h1 style={{color:'#4CAF50', fontSize:48, margin:'0 0 20px 0', textShadow:'3px 3px 0px rgba(0,0,0,0.3)', fontWeight: '900', letterSpacing: '2px'}}>🍉 SUIKA</h1>

//                  <div style={{background:'white', padding:15, borderRadius:10, marginBottom:15, width:'80%', maxWidth: '280px'}}>
//                      <div style={{fontSize:14, fontWeight:'bold', marginBottom:5, color:'#333'}}>💰 {t.betAmount || '배팅금액'}</div>
//                      <input type="number" value={betAmount} onChange={(e)=>setBetAmount(Math.max(0, parseInt(e.target.value)||0))} step="1000" style={{width:'100%', padding:10, fontSize:16, border:'1px solid #ddd', borderRadius:5, fontWeight:'bold', color:'#333', boxSizing:'border-box'}} />
//                  </div>

//                  {/* 배당표 */}
//                  <div style={{background:'#34495e', padding:15, borderRadius:10, width:'80%', maxWidth: '280px', marginBottom:20, fontSize:12, border: '1px solid #555'}}>
//                      <div style={{fontWeight:'bold', marginBottom:8, textAlign:'center', fontSize: 14, color: '#f1c40f'}}>📊 Payout</div>
//                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:5, color:'#ddd'}}>
//                          {Object.keys(PAYOUT_TABLE).sort((a,b)=>Number(a)-Number(b)).map((s) => (
//                              <div key={s} style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,0.1)', padding: '2px 0'}}>
//                                  <span>{s}+</span>
//                                  <span style={{fontWeight:'bold', color: PAYOUT_TABLE[s] >= 1 ? '#f1c40f' : '#aaa'}}>x{PAYOUT_TABLE[s]}</span>
//                              </div>
//                          ))}
//                      </div>
//                  </div>

//                  <button onClick={startGame} disabled={betAmount <= 0 || betAmount > myPoint} style={{background: (betAmount <= 0 || betAmount > myPoint) ? '#95a5a6' : '#2ecc71', color:'white', fontSize:20, fontWeight: 'bold', padding:'15px 50px', borderRadius:30, border:'none', cursor: (betAmount <= 0 || betAmount > myPoint) ? 'not-allowed' : 'pointer', boxShadow: '0 4px 0 rgba(0,0,0,0.2)'}}>
//                      GAME START
//                  </button>
//                  {betAmount > myPoint && <p style={{color:'#e74c3c', marginTop:10, fontWeight:'bold'}}>포인트가 부족합니다.</p>}
//              </div>
//           )}

//           {/* 게임 오버 모달 (반투명 오버레이) */}
//           {showGameOverModal && (
//              <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', background:'rgba(0, 0, 0, 0.85)', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', zIndex:30, padding: '20px', boxSizing: 'border-box' }}>
//                  <h2 style={{margin:'0 0 15px 0', fontSize: 32, color: resultMessage.includes("Win") ? '#f1c40f' : '#e74c3c', textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>
//                    {resultMessage.includes("Win") ? "🎉 WINNER!" : "💥 GAME OVER"}
//                  </h2>
//                  <div style={{fontSize:18, fontWeight:'bold', color:'white', marginBottom:25, background: 'rgba(255,255,255,0.1)', padding: '15px 25px', borderRadius: 15}}>{resultMessage}</div>
                 
//                  <button onClick={restartGame} style={{background:'#2ecc71', color:'white', fontSize:18, fontWeight: 'bold', padding:'12px 40px', borderRadius:25, border:'none', cursor:'pointer', boxShadow: '0 4px 0 rgba(0,0,0,0.3)'}}>
//                      다시 하기
//                  </button>
//              </div>
//           )}
//       </div>

//       {/* 랭킹 */}
//       <div style={{width: '100%', maxWidth: '360px', marginTop: 20, background: '#34495e', padding: 15, borderRadius: 10, border: '1px solid #444'}}>
//           <h3 style={{textAlign:'center', margin:'0 0 15px 0', borderBottom:'1px solid #f1c40f', paddingBottom:10, fontSize: 18, color: 'white'}}>🏆 Ranking TOP 10</h3>
//           <ul style={{listStyle:'none', padding:0, margin:0}}>
//               {ranks.map((r, i) => (
//                   <li key={i} style={{display:'flex', justifyContent:'space-between', alignItems: 'center', padding:'8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize:14, color: '#ddd'}}>
//                       <span style={{color: i < 3 ? '#f1c40f' : '#ddd'}}>{i+1}. {r.name}</span>
//                       <span style={{fontWeight:'bold', color:'white'}}>{r.score.toLocaleString()}</span>
//                   </li>
//               ))}
//           </ul>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase.js'; 
import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp, getDoc, doc, updateDoc, increment } from 'firebase/firestore'; 
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import Matter from 'matter-js';

// 🍒 과일 데이터
const FRUITS = [
  { name: 'cherry', radius: 15, color: '#F44336', emoji: '🍒', score: 2 },        // 0
  { name: 'strawberry', radius: 21, color: '#E91E63', emoji: '🍓', score: 4 },    // 1
  { name: 'grape', radius: 29, color: '#9C27B0', emoji: '🍇', score: 6 },         // 2
  { name: 'dekopon', radius: 36, color: '#FF9800', emoji: '🍊', score: 10 },      // 3
  { name: 'orange', radius: 45, color: '#FF5722', emoji: '🎃', score: 15 },       // 4
  { name: 'apple', radius: 58, color: '#F44336', emoji: '🍎', score: 25 },        // 5
  { name: 'pear', radius: 69, color: '#CDDC39', emoji: '🍐', score: 40 },         // 6
  { name: 'peach', radius: 81, color: '#F8BBD0', emoji: '🍑', score: 60 },        // 7
  { name: 'pineapple', radius: 98, color: '#FFEB3B', emoji: '🍍', score: 85 },    // 8
  { name: 'melon', radius: 113, color: '#8BC34A', emoji: '🍈', score: 110 },      // 9
  { name: 'watermelon', radius: 138, color: '#4CAF50', emoji: '🍉', score: 300 }, // 10
];

// 💰 배당률표
const PAYOUT_TABLE = {
    500: 0.01,
    1000: 0.1,
    1500: 0.5,
    2000: 1.1,
    2500: 1.3,
    3000: 1.5,
    4000: 2.0
};

const GAME_WIDTH = 360;
const GAME_HEIGHT = 600;
const WALL_THICKNESS = 100;
const DEAD_LINE_Y = 120;
const DROP_START_Y = 20; // 데드라인 훨씬 위에서 과일 시작 (y=0이 맨 위)

export default function GameSuika() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const { t } = useLanguage();

  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('ready'); 
  const [ranks, setRanks] = useState([]);
  const [nextFruitIdx, setNextFruitIdx] = useState(0);
  const [nextNextFruitIdx, setNextNextFruitIdx] = useState(0); // 다다음 과일
  const [previewX, setPreviewX] = useState(GAME_WIDTH / 2);

  const [myPoint, setMyPoint] = useState(0);
  const [betAmount, setBetAmount] = useState(1000);
  const [resultMessage, setResultMessage] = useState("");
  const [showGameOverModal, setShowGameOverModal] = useState(false);

  const canvasRef = useRef(null);
  const sceneRef = useRef(null); 
  const scoreRef = useRef(0);
  const isDroppingRef = useRef(false);
  const gameOverRef = useRef(false);
  const betAmountRef = useRef(1000);

  useEffect(() => {
    return () => cleanupMatterJS();
  }, []);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    window.scrollTo({ top: 0, behavior: 'auto' });
    fetchUserData();
    fetchRanks();
    setNextFruitIdx(Math.floor(Math.random() * 4)); 
    setNextNextFruitIdx(Math.floor(Math.random() * 4));
  }, [user, navigate]);

  const fetchUserData = async () => {
      if (user) {
          try {
              const userSnap = await getDoc(doc(db, "users", user.uid));
              if (userSnap.exists()) setMyPoint(userSnap.data().point || 0);
          } catch (e) { console.error(e); }
      }
  };

  const fetchRanks = async () => {
    try {
      const q = query(collection(db, "game_suika_ranks"), orderBy("score", "desc"), limit(50));
      const snap = await getDocs(q);
      const rawList = snap.docs.map(doc => doc.data());
      const filteredList = [];
      const userCounts = {};

      for (const item of rawList) {
          const uid = item.uid;
          if (!userCounts[uid]) userCounts[uid] = 0;
          if (userCounts[uid] < 3) {
              filteredList.push(item);
              userCounts[uid]++;
          }
          if (filteredList.length >= 10) break;
      }
      setRanks(filteredList);
    } catch (e) { console.error(e); }
  };

  const startGame = async () => {
    if (betAmount <= 0 || betAmount > myPoint) {
      alert(t.alertNoMoney || "포인트 부족");
      return;
    }

    try {
        await updateDoc(doc(db, "users", user.uid), { point: increment(-betAmount) });
        setMyPoint(prev => prev - betAmount);
        betAmountRef.current = betAmount;

        await addDoc(collection(db, "history"), {
            uid: user.uid, 
            type: "게임", 
            msg: `🍉 수박게임 ${t.gameStart || '시작'}`, 
            amount: -betAmount, 
            createdAt: serverTimestamp()
        });

        setGameState('playing');
        setScore(0);
        scoreRef.current = 0;
        gameOverRef.current = false;
        isDroppingRef.current = false;
        setResultMessage("");
        setShowGameOverModal(false);
        
        setNextFruitIdx(Math.floor(Math.random() * 4)); 
        setNextNextFruitIdx(Math.floor(Math.random() * 4));
        setPreviewX(GAME_WIDTH / 2);

        initMatterJS(); 

    } catch (e) { 
      console.error(e);
      alert("오류 발생"); 
    }
  };

  const cleanupMatterJS = () => {
    if (sceneRef.current) {
      const { engine, render, runner, world } = sceneRef.current;
      Matter.Events.off(engine);
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      if (render.canvas) render.canvas.remove();
      Matter.World.clear(world, false);
      Matter.Engine.clear(engine);
      sceneRef.current = null;
    }
  };

  const initMatterJS = () => {
    cleanupMatterJS();

    const { Engine, Render, Runner, World, Bodies, Events, Composite, Body } = Matter;

    const engine = Engine.create({
        enableSleeping: false
    });
    
    engine.gravity.y = 1.0;
    engine.positionIterations = 30;
    engine.velocityIterations = 20;
    engine.constraintIterations = 10;
    
    const world = engine.world;

    const canvas = document.createElement('canvas');
    canvasRef.current.innerHTML = '';
    canvasRef.current.appendChild(canvas);

    const render = Render.create({
      element: canvasRef.current,
      engine: engine,
      options: {
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        wireframes: false,
        background: '#FFF3E0', 
        pixelRatio: window.devicePixelRatio || 1, 
        showSleeping: false
      }
    });

    const ground = Bodies.rectangle(
        GAME_WIDTH / 2, 
        GAME_HEIGHT - 80,
        GAME_WIDTH + 400,
        WALL_THICKNESS * 2,
        { 
            isStatic: true, 
            render: { fillStyle: '#8D6E63' }, 
            friction: 1.0,
            restitution: 0.0,
            slop: 0
        }
    );
    
    const leftWall = Bodies.rectangle(
        -WALL_THICKNESS / 2, 
        GAME_HEIGHT / 2, 
        WALL_THICKNESS, 
        GAME_HEIGHT * 3,
        { 
            isStatic: true, 
            render: { fillStyle: '#8D6E63' }, 
            friction: 0.5,
            restitution: 0.0,
            slop: 0
        }
    );
    
    const rightWall = Bodies.rectangle(
        GAME_WIDTH + WALL_THICKNESS / 2, 
        GAME_HEIGHT / 2, 
        WALL_THICKNESS, 
        GAME_HEIGHT * 3,
        { 
            isStatic: true, 
            render: { fillStyle: '#8D6E63' }, 
            friction: 0.5,
            restitution: 0.0,
            slop: 0
        }
    );

    World.add(world, [ground, leftWall, rightWall]);

    // 💥 충돌 및 합치기 로직
    Events.on(engine, 'collisionStart', (event) => {
        if (gameOverRef.current) return;

        event.pairs.forEach((pair) => {
            const { bodyA, bodyB } = pair;
            
            if (bodyA.fruitId === undefined || bodyB.fruitId === undefined) return;
            if (bodyA.fruitId !== bodyB.fruitId) return;
            if (bodyA.isMerging || bodyB.isMerging) return; 

            const currentIdx = bodyA.fruitId;
            if (currentIdx >= FRUITS.length - 1) return; 

            bodyA.isMerging = true;
            bodyB.isMerging = true;

            const midX = (bodyA.position.x + bodyB.position.x) / 2;
            const midY = (bodyA.position.y + bodyB.position.y) / 2;

            World.remove(world, [bodyA, bodyB]);

            const nextIdx = currentIdx + 1;
            const newFruit = createFruit(midX, midY, nextIdx);
            
            Body.setVelocity(newFruit, { x: 0, y: 0 });
            Body.setAngularVelocity(newFruit, 0);
            
            // 합쳐진 과일은 3초간 게임오버 체크 제외
            newFruit.justMerged = true;
            setTimeout(() => { if(newFruit) newFruit.justMerged = false; }, 3000);
            
            World.add(world, newFruit);

            scoreRef.current += FRUITS[nextIdx].score;
            setScore(scoreRef.current);
        });
    });

    // 게임오버 체크 - 연속으로 위반해야 게임오버
    let checkInterval = 0;
    let violationCount = 0;
    const REQUIRED_VIOLATIONS = 5; // 5번 연속 위반해야 게임오버
    
    Events.on(engine, 'afterUpdate', () => {
        if (gameOverRef.current) return;
        checkInterval++;
        
        if (checkInterval % 60 === 0) {
            const bodies = Composite.allBodies(world);
            let staticFruitsAboveLine = 0;
            
            // 데드라인 위에서 완전히 정지한 과일만 카운트
            for (let b of bodies) {
                if (b.isStatic || b.isDropping || b.justMerged) continue;
                if (b.fruitId === undefined) continue;
                
                // 과일 중심이 데드라인보다 위에 있고
                const fruitTop = b.position.y - b.circleRadius;
                if (fruitTop < DEAD_LINE_Y - 20) {
                    // 완전히 정지한 상태인지 체크 (더 엄격하게)
                    if (Math.abs(b.velocity.y) < 0.1 && Math.abs(b.velocity.x) < 0.1) {
                        staticFruitsAboveLine++;
                    }
                }
            }
            
            // 2개 이상의 과일이 데드라인 위에서 정지
            if (staticFruitsAboveLine >= 2) {
                violationCount++;
                if (violationCount >= REQUIRED_VIOLATIONS) {
                    gameOverRef.current = true;
                    setTimeout(() => {
                        endGame();
                    }, 1000);
                }
            } else {
                // 위반이 해소되면 카운트 리셋
                violationCount = 0;
            }
        }
    });

    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    // 🎨 이모지 그리기
    Events.on(render, 'afterRender', () => {
      const context = render.context;
      const bodies = Composite.allBodies(world);
      bodies.forEach(body => {
        if (body.fruitEmoji) {
          const { x, y } = body.position;
          const radius = body.circleRadius; 
          const fontSize = radius * 1.65;
          
          context.translate(x, y);
          context.rotate(body.angle);
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.font = `${fontSize}px serif`; 
          context.fillText(body.fruitEmoji, 0, 4); 
          context.rotate(-body.angle);
          context.translate(-x, -y);
        }
      });
    });

    sceneRef.current = { engine, render, runner, world };
  };

  const createFruit = (x, y, index) => {
    const fruitInfo = FRUITS[index];
    const body = Matter.Bodies.circle(x, y, fruitInfo.radius, {
        restitution: 0.05,
        friction: 0.8,
        density: 0.0005,
        slop: 0,
        frictionAir: 0.01,
        render: { 
          fillStyle: fruitInfo.color,
          strokeStyle: 'rgba(0,0,0,0.1)',
          lineWidth: 1
        }
    });
    body.fruitId = index;
    body.fruitEmoji = fruitInfo.emoji;
    body.circleRadius = fruitInfo.radius;
    return body;
  };

  const handleMove = (e) => {
    if (gameState !== 'playing' || gameOverRef.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    let x = clientX - rect.left;
    const r = FRUITS[nextFruitIdx].radius;
    x = Math.max(r + 10, Math.min(x, GAME_WIDTH - r - 10));
    setPreviewX(x);
  };

  const handleDrop = (e) => {
    if (gameState !== 'playing' || isDroppingRef.current || gameOverRef.current) return;
    e.preventDefault(); 
    isDroppingRef.current = true;
    const x = previewX; 
    
    if (sceneRef.current) {
      // 데드라인 위에서 과일 드롭
      const fruit = createFruit(x, DROP_START_Y, nextFruitIdx); 
      fruit.isDropping = true;
      Matter.World.add(sceneRef.current.world, fruit);
      setTimeout(() => { if(fruit) fruit.isDropping = false; }, 1000);  // 500ms -> 1000ms
    }

    // 다음 과일로 이동
    setNextFruitIdx(nextNextFruitIdx);
    setNextNextFruitIdx(Math.floor(Math.random() * 4));
    setTimeout(() => { isDroppingRef.current = false; }, 300);
  };

  const endGame = async () => {
    if (gameState === 'finished') return;
    setGameState('finished');
    
    // 모달만 표시하고 물리 엔진은 유지
    setShowGameOverModal(true);

    const finalScore = scoreRef.current;
    
    let multiplier = 0;
    const scores = Object.keys(PAYOUT_TABLE).map(Number).sort((a,b)=>b-a);
    for (let s of scores) {
        if (finalScore >= s) {
            multiplier = PAYOUT_TABLE[s];
            break;
        }
    }

    const earned = Math.floor(betAmountRef.current * multiplier);
    let msg = "";

    if (earned > 0) {
        msg = `🎉 Win! ${finalScore}점 x${multiplier} (+${earned.toLocaleString()}P)`;
        try {
            await updateDoc(doc(db, "users", user.uid), { point: increment(earned) });
            setMyPoint(prev => prev + earned);
            await addDoc(collection(db, "history"), {
                uid: user.uid, type: "게임", msg: `🍉 수박게임 [${finalScore}점] 획득`, amount: earned, createdAt: serverTimestamp()
            });
        } catch(e) {}
    } else {
        msg = `😭 실패... (Score: ${finalScore})`;
    }
    setResultMessage(msg);

    if (finalScore >= 500) {
        try {
            const userSnap = await getDoc(doc(db, "users", user.uid));
            await addDoc(collection(db, "game_suika_ranks"), {
                uid: user.uid, name: userSnap.data().name || "익명", score: finalScore, createdAt: serverTimestamp()
            });
            fetchRanks();
        } catch(e) {}
    }

    // 3초 후 물리 엔진 정리
    setTimeout(() => {
        cleanupMatterJS();
    }, 3000);
  };

  const restartGame = () => {
    cleanupMatterJS();
    setShowGameOverModal(false);
    setGameState('ready');
  };

  return (
    <div className="container" style={{ background: '#2c3e50', minHeight: '100vh', padding: '10px 5px', display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect:'none' }}>
      
      {/* 헤더 */}
      <div style={{width: '100%', maxWidth: '360px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10, background: 'rgba(0,0,0,0.3)', padding: '12px 15px', borderRadius: 10, border: '1px solid #444'}}>
         <button className="btn" onClick={() => navigate('/home')} style={{background:'#e74c3c', fontSize:14, padding:'8px 15px', color:'white', border:'none', borderRadius:6, fontWeight:'bold'}}>{t.home || 'HOME'}</button>
         <div style={{fontWeight:'bold', color:'#f1c40f', fontSize:22}}>🎯 {score}</div>
         <div style={{fontWeight:'bold', color:'white', fontSize:14, background:'rgba(255,255,255,0.1)', padding:'5px 10px', borderRadius:15}}>💰 {myPoint.toLocaleString()}</div>
      </div>

      {/* 게임 영역 */}
      <div style={{ position: 'relative', width: GAME_WIDTH, height: GAME_HEIGHT, background: '#FFF3E0', borderRadius: 10, overflow: 'hidden', border: '4px solid #8D6E63', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          {/* 데드라인 */}
          <div style={{position:'absolute', top:0, left:0, width:'100%', height: DEAD_LINE_Y + 'px', pointerEvents:'none', zIndex:3, borderBottom:'2px dashed #e74c3c'}}>
              <span style={{position:'absolute', right:5, bottom:2, fontSize:10, color:'#e74c3c', fontWeight:'bold'}}>DEADLINE</span>
          </div>

          {/* NEXT 과일 & 프리뷰 */}
          {gameState === 'playing' && !gameOverRef.current && (
              <>
                <div style={{position:'absolute', top:10, right:10, zIndex:10, background:'rgba(255,255,255,0.9)', padding:'8px 12px', borderRadius:15, border:'2px solid #8D6E63', textAlign:'center', width: '60px', height: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                    <div style={{fontSize:10, fontWeight:'bold', color: '#5D4037', marginBottom: '2px'}}>NEXT</div>
                    <div style={{fontSize: 28, lineHeight: 1}}>{FRUITS[nextNextFruitIdx].emoji}</div>
                </div>
                <div style={{
                    position:'absolute', left: previewX, top: DROP_START_Y, 
                    fontSize: FRUITS[nextFruitIdx].radius * 1.65, 
                    opacity: 0.7, transform: 'translate(-50%, -50%)', 
                    pointerEvents:'none', zIndex: 8, transition: 'left 0.05s linear'
                }}>
                    {FRUITS[nextFruitIdx].emoji}
                </div>
              </>
          )}

          <div 
            ref={canvasRef}
            onMouseMove={handleMove}
            onTouchMove={handleMove}
            onMouseDown={handleDrop}
            onTouchStart={handleDrop}
            style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none', cursor: gameState === 'playing' && !gameOverRef.current ? 'pointer' : 'default' }}
          />

          {/* 시작 화면 */}
          {gameState === 'ready' && (
             <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', background:'rgba(44, 62, 80, 0.95)', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', zIndex:20, padding: '20px', boxSizing: 'border-box' }}>
                 <h1 style={{color:'#4CAF50', fontSize:48, margin:'0 0 20px 0', textShadow:'3px 3px 0px rgba(0,0,0,0.3)', fontWeight: '900', letterSpacing: '2px'}}>🍉 SUIKA</h1>

                 <div style={{background:'white', padding:15, borderRadius:10, marginBottom:15, width:'80%', maxWidth: '280px'}}>
                     <div style={{fontSize:14, fontWeight:'bold', marginBottom:5, color:'#333'}}>💰 {t.betAmount || '배팅금액'}</div>
                     <input type="number" value={betAmount} onChange={(e)=>setBetAmount(Math.max(0, parseInt(e.target.value)||0))} step="1000" style={{width:'100%', padding:10, fontSize:16, border:'1px solid #ddd', borderRadius:5, fontWeight:'bold', color:'#333', boxSizing:'border-box'}} />
                 </div>

                 {/* 배당표 */}
                 <div style={{background:'#34495e', padding:15, borderRadius:10, width:'80%', maxWidth: '280px', marginBottom:20, fontSize:12, border: '1px solid #555'}}>
                     <div style={{fontWeight:'bold', marginBottom:8, textAlign:'center', fontSize: 14, color: '#f1c40f'}}>📊 Payout</div>
                     <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:5, color:'#ddd'}}>
                         {Object.keys(PAYOUT_TABLE).sort((a,b)=>Number(a)-Number(b)).map((s) => (
                             <div key={s} style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,0.1)', padding: '2px 0'}}>
                                 <span>{s}+</span>
                                 <span style={{fontWeight:'bold', color: PAYOUT_TABLE[s] >= 1 ? '#f1c40f' : '#aaa'}}>x{PAYOUT_TABLE[s]}</span>
                             </div>
                         ))}
                     </div>
                 </div>

                 <button onClick={startGame} disabled={betAmount <= 0 || betAmount > myPoint} style={{background: (betAmount <= 0 || betAmount > myPoint) ? '#95a5a6' : '#2ecc71', color:'white', fontSize:20, fontWeight: 'bold', padding:'15px 50px', borderRadius:30, border:'none', cursor: (betAmount <= 0 || betAmount > myPoint) ? 'not-allowed' : 'pointer', boxShadow: '0 4px 0 rgba(0,0,0,0.2)'}}>
                     GAME START
                 </button>
                 {betAmount > myPoint && <p style={{color:'#e74c3c', marginTop:10, fontWeight:'bold'}}>포인트가 부족합니다.</p>}
             </div>
          )}

          {/* 게임 오버 모달 (반투명 오버레이) */}
          {showGameOverModal && (
             <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', background:'rgba(0, 0, 0, 0.85)', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', zIndex:30, padding: '20px', boxSizing: 'border-box' }}>
                 <h2 style={{margin:'0 0 15px 0', fontSize: 32, color: resultMessage.includes("Win") ? '#f1c40f' : '#e74c3c', textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>
                   {resultMessage.includes("Win") ? "🎉 WINNER!" : "💥 GAME OVER"}
                 </h2>
                 <div style={{fontSize:18, fontWeight:'bold', color:'white', marginBottom:25, background: 'rgba(255,255,255,0.1)', padding: '15px 25px', borderRadius: 15}}>{resultMessage}</div>
                 
                 <button onClick={restartGame} style={{background:'#2ecc71', color:'white', fontSize:18, fontWeight: 'bold', padding:'12px 40px', borderRadius:25, border:'none', cursor:'pointer', boxShadow: '0 4px 0 rgba(0,0,0,0.3)'}}>
                     다시 하기
                 </button>
             </div>
          )}
      </div>

      {/* 랭킹 */}
      <div style={{width: '100%', maxWidth: '360px', marginTop: 20, background: '#34495e', padding: 15, borderRadius: 10, border: '1px solid #444'}}>
          <h3 style={{textAlign:'center', margin:'0 0 15px 0', borderBottom:'1px solid #f1c40f', paddingBottom:10, fontSize: 18, color: 'white'}}>🏆 Ranking TOP 10</h3>
          <ul style={{listStyle:'none', padding:0, margin:0}}>
              {ranks.map((r, i) => (
                  <li key={i} style={{display:'flex', justifyContent:'space-between', alignItems: 'center', padding:'8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize:14, color: '#ddd'}}>
                      <span style={{color: i < 3 ? '#f1c40f' : '#ddd'}}>{i+1}. {r.name}</span>
                      <span style={{fontWeight:'bold', color:'white'}}>{r.score.toLocaleString()}</span>
                  </li>
              ))}
          </ul>
      </div>
    </div>
  );
}