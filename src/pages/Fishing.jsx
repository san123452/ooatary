// import React, { useState, useEffect, useRef } from 'react';
// import { db, auth } from '../firebase';
// import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';

// export default function Fishing() {
//   const [point, setPoint] = useState(0);
//   const [bet, setBet] = useState('');
//   const [gameState, setGameState] = useState('idle'); // idle, waiting, fighting, result, fail
//   const [fish, setFish] = useState(null);
//   const [barPosition, setBarPosition] = useState(0); 
//   const [barDirection, setBarDirection] = useState(1); 
  
//   const navigate = useNavigate();
//   const user = auth.currentUser;
//   const animationRef = useRef(null);

//   const fishTable = [
//     { name: '낡은 장화', icon: '👢', multi: 0, chance: 20, displayProb: '20%' },   // 0~20 (20%)
//     { name: '미역', icon: '🌿', multi: 0.5, chance: 45, displayProb: '25%' },     // 21~45 (25%)
//     { name: '고등어', icon: '🐟', multi: 2, chance: 80, displayProb: '35%' },      // 46~80 (35%)
//     { name: '참돔', icon: '🐠', multi: 5, chance: 95, displayProb: '15%' },       // 81~95 (15%)
//     { name: '대왕 문어', icon: '🐙', multi: 20, chance: 99, displayProb: '4%' },    // 96~99 (4%)
//     { name: '전설의 백상아리', icon: '🦈', multi: 100, chance: 100, displayProb: '1%' } // 100 (1%)
//   ];

//   useEffect(() => {
//     if (!user) { navigate('/login'); return; }
//     fetchPoint();
//     return () => cancelAnimationFrame(animationRef.current);
//   }, [user, navigate]);

//   const fetchPoint = async () => {
//     try {
//       const d = await getDoc(doc(db, "users", user.uid));
//       if (d.exists()) setPoint(d.data().point || 0);
//     } catch (e) { console.error(e); }
//   };

//   // 👇 [추가됨] 퍼센트 배팅 계산 함수
//   const handleBetPercent = (percent) => {
//       if (percent === 0) {
//           setBet(''); // 초기화
//           return;
//       }
//       const amount = Math.floor(point * percent);
//       setBet(String(amount));
//   };

//   const castRod = async () => {
//     const betMoney = parseInt(bet);
//     if (isNaN(betMoney) || betMoney <= 0) return alert("미끼 값을 거세요!");
//     if (betMoney > Math.floor(point)) return alert("미끼 살 돈이 없습니다!");

//     try {
//       await updateDoc(doc(db, "users", user.uid), { point: increment(-betMoney) });
//       setPoint(prev => prev - betMoney);
//     } catch (e) {
//       alert("⚠️ 서버 할당량 초과! (오후 4시 이후 정상화)");
//       return;
//     }

//     setGameState('waiting');
//     setFish(null);

//     const waitTime = Math.random() * 2000 + 2000;
//     setTimeout(() => {
//       setGameState('fighting');
//       if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
//       startMiniGame();
//     }, waitTime);
//   };

//   const startMiniGame = () => {
//     let pos = 0;
//     let dir = 1;
//     const speed = 1.8 + Math.random(); 

//     const animate = () => {
//       pos += speed * dir;
//       if (pos >= 100 || pos <= 0) dir *= -1;
//       setBarPosition(pos);
//       setBarDirection(dir);
//       animationRef.current = requestAnimationFrame(animate);
//     };
//     animationRef.current = requestAnimationFrame(animate);
//   };

//   const pullRod = async () => {
//     cancelAnimationFrame(animationRef.current);
    
//     // 성공 범위 (70~90)
//     const success = barPosition >= 70 && barPosition <= 90;
    
//     if (success) {
//       const rand = Math.random() * 100;
//       const caught = fishTable.find(f => rand <= f.chance);
//       setFish(caught);
      
//       const prize = Math.floor(parseInt(bet) * caught.multi);
//       if (prize > 0) {
//         setPoint(prev => prev + prize);
//         await updateDoc(doc(db, "users", user.uid), { point: increment(prize) });
//       }
//       setGameState('result');
//     } else {
//       setGameState('fail'); 
//     }
//   };

//   return (
//     <div className="container" style={{ background: '#0984e3', minHeight: '100vh', color: 'white', textAlign: 'center', padding: '15px' }}>
//       <h1 style={{ color: '#fff', fontSize: '24px', textShadow: '2px 2px #000' }}>🎣 전설의 강태공</h1>
//       {/* 잔액 표시 (소수점 제거) */}
//       <div className="card" style={{ background: 'rgba(0,0,0,0.5)', padding: '10px', marginBottom: '15px' }}>💰 {Math.floor(point).toLocaleString()}원</div>

//       {/* 🌊 낚시 화면 */}
//       <div style={{ height: '320px', background: 'linear-gradient(to bottom, #74b9ff, #0984e3)', borderRadius: '15px', position: 'relative', overflow: 'hidden', border: '4px solid #fff', marginBottom: '20px' }}>
//         <div style={{ position: 'absolute', top: '20px', left: '10%', fontSize: '40px', opacity: 0.8, animation: 'cloud 10s infinite linear' }}>☁️</div>
        
//         {/* ✅ 대기 화면: 도감 표시 */}
//         {gameState === 'idle' && (
//           <div style={{ padding: '10px', height: '100%', overflowY: 'auto' }}>
//             <h3 style={{ margin: '5px 0', textShadow: '1px 1px 2px black' }}>🌊 획득 가능 어종 🌊</h3>
//             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px' }}>
//               {fishTable.map((f, i) => (
//                 <div key={i} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '5px', fontSize: '12px', border: f.multi >= 20 ? '2px solid gold' : '1px solid rgba(255,255,255,0.3)' }}>
//                   <div style={{ fontSize: '24px' }}>{f.icon}</div>
//                   <div style={{ fontWeight: 'bold' }}>{f.name}</div>
//                   <div style={{ color: '#f1c40f' }}>x{f.multi}배</div>
//                   <div style={{ fontSize: '10px', color: '#ddd' }}>({f.displayProb})</div>
//                 </div>
//               ))}
//             </div>
//             <p style={{ marginTop: '15px', fontSize: '14px', animation: 'blink 1s infinite' }}>👇 아래에서 미끼를 던지세요!</p>
//           </div>
//         )}
        
//         {gameState === 'waiting' && (
//           <div style={{ marginTop: '110px', fontSize: '20px', animation: 'bob 1s infinite alternate' }}>
//             🎣 찌를 보는 중... <br/>(두근두근)
//           </div>
//         )}

//         {/* 🎣 미니게임 (타이밍 맞추기) */}
//         {gameState === 'fighting' && (
//           <div style={{ marginTop: '70px' }}>
//             <div style={{ fontSize: '50px', fontWeight: 'bold', color: '#e74c3c', animation: 'shake 0.2s infinite' }}>!!! HIT !!!</div>
//             <div style={{ width: '80%', height: '30px', background: '#333', margin: '20px auto', borderRadius: '15px', position: 'relative', overflow: 'hidden', border: '2px solid white' }}>
//               <div style={{ position: 'absolute', left: '70%', width: '20%', height: '100%', background: '#2ecc71', opacity: 0.7 }} />
//               <div style={{ position: 'absolute', left: `${barPosition}%`, top: 0, width: '5px', height: '100%', background: 'red', boxShadow: '0 0 10px red' }} />
//             </div>
//             <p style={{ fontSize: '14px' }}>초록색 구간에 맞춰 당기세요!</p>
//           </div>
//         )}

//         {/* 결과 화면 */}
//         {(gameState === 'result' || gameState === 'fail') && (
//           <div style={{ marginTop: '80px', animation: 'pop 0.5s' }}>
//             {gameState === 'fail' ? (
//                <div style={{ fontSize: '60px' }}>💨<br/><span style={{fontSize:'20px'}}>타이밍을 놓쳤습니다...</span></div>
//             ) : (
//                <>
//                  <div style={{ fontSize: '80px' }}>{fish.icon}</div>
//                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{fish.name}</div>
//                  <div style={{ color: '#f1c40f', fontSize: '20px', marginTop: '10px' }}>
//                    {fish.multi > 0 ? `+${(parseInt(bet)*fish.multi).toLocaleString()}원` : '꽝! (낡은 장화)'}
//                  </div>
//                </>
//             )}
//           </div>
//         )}
//       </div>

//       {/* 컨트롤 패널 */}
//       <div className="card" style={{ background: '#2c3e50', padding: '15px' }}>
//         {gameState === 'fighting' ? (
//           <button className="btn" style={{ width: '100%', height: '80px', fontSize: '30px', background: '#e74c3c', fontWeight: 'bold', boxShadow: '0 5px 0 #c0392b' }} onClick={pullRod}>
//             🎣 당겨!!!
//           </button>
//         ) : (
//           <>
//             <input className="input" type="number" placeholder="미끼 값 (배팅)" value={bet} onChange={e => setBet(e.target.value)} style={{ textAlign: 'center' }} disabled={gameState !== 'idle' && gameState !== 'result' && gameState !== 'fail'} />
            
//             {/* 👇 [변경됨] 퍼센트 배팅 버튼들 */}
//             <div style={{display:'flex', gap:5, marginBottom:15}}>
//                 <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.1)} disabled={gameState === 'waiting'}>10%</button>
//                 <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.25)} disabled={gameState === 'waiting'}>25%</button>
//                 <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.5)} disabled={gameState === 'waiting'}>50%</button>
//                 <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#e74c3c', color:'white', fontWeight:'bold'}} onClick={()=>handleBetPercent(1)} disabled={gameState === 'waiting'}>ALL</button>
//                 <button className="btn" style={{width:40, padding:5, fontSize:12, background:'#95a5a6'}} onClick={()=>handleBetPercent(0)} disabled={gameState === 'waiting'}>🔄</button>
//             </div>

//             <button className="btn btn-primary" style={{ width: '100%', padding: '15px', fontSize: '20px' }} 
//               onClick={() => {
//                 if(gameState === 'result' || gameState === 'fail') setGameState('idle');
//                 else castRod();
//               }}>
//               {gameState === 'result' || gameState === 'fail' ? '다시 하기' : '🎣 낚싯대 던지기'}
//             </button>
//           </>
//         )}
//       </div>

//       {gameState !== 'waiting' && gameState !== 'fighting' && (
//         <button className="btn" style={{ marginTop: 15, background: '#444', width: '100%' }} onClick={() => navigate('/home')}>
//           🏠 홈으로
//         </button>
//       )}
      
//       <style>{`
//         @keyframes cloud { 0% { left: -20%; } 100% { left: 120%; } }
//         @keyframes bob { 0% { transform: translateY(0); } 100% { transform: translateY(-10px); } }
//         @keyframes shake { 0% { transform: rotate(0deg); } 25% { transform: rotate(5deg); } 75% { transform: rotate(-5deg); } 100% { transform: rotate(0deg); } }
//         @keyframes pop { 0% { transform: scale(0); } 70% { transform: scale(1.2); } 100% { transform: scale(1); } }
//         @keyframes blink { 50% { opacity: 0.5; } }
//       `}</style>
//     </div>
//   );
// }