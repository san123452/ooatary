// import React, { useState, useEffect } from 'react';
// import { db, auth } from '../firebase';
// import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';

// // 🎱 키노 배당표 (인덱스 = 맞춘 개수)
// // 예: 3개를 골랐을 때(picks:3) -> [0개맞춤:0배, 1개:0배, 2개:2.5배, 3개:25배]
// const PAYOUTS = {
//   1: [0, 3.8],
//   2: [0, 1.7, 5.2],
//   3: [0, 0, 2.5, 25],
//   4: [0, 0, 1.5, 5, 50],
//   5: [0, 0, 1.2, 3, 12, 150],
//   6: [0, 0, 0, 2, 8, 50, 500],
//   7: [0, 0, 0, 1.5, 5, 20, 100, 800],
//   8: [0, 0, 0, 1, 4, 15, 50, 300, 1000],
//   9: [0, 0, 0, 1, 3, 10, 30, 100, 500, 1500],
//   10:[0, 0, 0, 0, 2, 5, 15, 50, 150, 500, 1000] 
// };

// export default function Keno() {
//   const [point, setPoint] = useState(0);
//   const [bet, setBet] = useState('');
//   const [selected, setSelected] = useState([]); // 내가 고른 번호
//   const [drawn, setDrawn] = useState([]); // 추첨된 번호
//   const [gameState, setGameState] = useState('idle'); // idle, playing
//   const [showGuide, setShowGuide] = useState(false);
  
//   const navigate = useNavigate();
//   const user = auth.currentUser;

//   useEffect(() => {
//     if (!user) { navigate('/login'); return; }
//     fetchPoint();
//   }, [user, navigate]);

//   const fetchPoint = async () => {
//     try {
//       const d = await getDoc(doc(db, "users", user.uid));
//       if (d.exists()) setPoint(d.data().point || 0);
//     } catch (e) {}
//   };

//   // 번호 선택 토글
//   const toggleNumber = (num) => {
//     if (gameState === 'playing') return;
//     if (selected.includes(num)) {
//       setSelected(selected.filter(n => n !== num));
//     } else {
//       if (selected.length >= 10) return alert("최대 10개까지만 선택 가능합니다.");
//       setSelected([...selected, num]);
//     }
//   };

//   // 자동 선택 (랜덤 10개)
//   const autoPick = () => {
//     if (gameState === 'playing') return;
//     const newSet = new Set();
//     while(newSet.size < 10) {
//       newSet.add(Math.floor(Math.random() * 40) + 1);
//     }
//     setSelected(Array.from(newSet));
//   };

//   // 게임 시작
//   const playKeno = async () => {
//     if (selected.length === 0) return alert("번호를 최소 1개 선택하세요!");
//     const betMoney = parseInt(bet);
//     if (isNaN(betMoney) || betMoney <= 0) return alert("배팅금을 입력하세요!");
//     if (betMoney > point) return alert("돈이 부족합니다!");

//     setGameState('playing');
//     setDrawn([]); // 초기화

//     try {
//       await updateDoc(doc(db, "users", user.uid), { point: increment(-betMoney) });
//       setPoint(prev => prev - betMoney);
//     } catch (e) {
//       setGameState('idle');
//       return alert("오류 발생");
//     }

//     // 10개 번호 추첨 (1~40)
//     const newDrawn = [];
//     while(newDrawn.length < 10) {
//       const r = Math.floor(Math.random() * 40) + 1;
//       if (!newDrawn.includes(r)) newDrawn.push(r);
//     }

//     // 애니메이션 효과 (하나씩 공개)
//     let i = 0;
//     const interval = setInterval(() => {
//       setDrawn(prev => [...prev, newDrawn[i]]);
//       i++;
//       if (i >= 10) {
//         clearInterval(interval);
//         finishGame(newDrawn, betMoney);
//       }
//     }, 100); // 0.1초마다 하나씩
//   };

//   const finishGame = async (finalDrawn, betMoney) => {
//     // 맞춘 개수 계산
//     const matchCount = selected.filter(num => finalDrawn.includes(num)).length;
    
//     // 배당률 조회
//     const payoutList = PAYOUTS[selected.length] || [];
//     const multiplier = payoutList[matchCount] || 0;

//     if (multiplier > 0) {
//       const winMoney = Math.floor(betMoney * multiplier);
//       setPoint(prev => prev + winMoney);
//       await updateDoc(doc(db, "users", user.uid), { point: increment(winMoney) });
      
//       setTimeout(() => {
//           alert(`🎉 ${matchCount}개 적중! ${multiplier}배 당첨!\n(+${winMoney.toLocaleString()}원)`);
//           setGameState('idle');
//       }, 500);
//     } else {
//       setTimeout(() => setGameState('idle'), 500);
//     }
//   };

//   // 현재 내 선택 개수에 따른 배당표
//   const currentPayouts = PAYOUTS[selected.length] || [];

//   return (
//     <div className="container" style={{ background: '#120c1e', minHeight: '100vh', color: 'white', textAlign: 'center', padding: '10px' }}>
      
//       {/* 헤더 & 설명서 버튼 */}
//       <div style={{ position: 'relative', marginBottom: '15px' }}>
//         <h1 style={{ color: '#8e44ad', fontSize: '24px', letterSpacing: '2px', display: 'inline-block' }}>🎱 KENO</h1>
//         <button onClick={() => setShowGuide(true)} style={{ position: 'absolute', right: 0, top: 0, background: 'none', border: '1px solid #aaa', color: '#aaa', borderRadius: '50%', width: '25px', height: '25px' }}>?</button>
//       </div>

//       {showGuide && (
//         <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
//             <div style={{ background: '#2c3e50', padding: '20px', borderRadius: '10px', border: '1px solid #8e44ad' }}>
//                 <h3 style={{color:'#8e44ad'}}>🎱 키노 규칙</h3>
//                 <ul style={{textAlign:'left', fontSize:'14px', lineHeight:'1.5', paddingLeft:'20px', color:'#ccc'}}>
//                     <li>1~40번 중 원하는 번호를 <strong>1개~10개</strong> 선택하세요.</li>
//                     <li>컴퓨터가 무작위로 <strong>10개</strong>의 공을 뽑습니다.</li>
//                     <li>내가 고른 번호와 <strong>많이 겹칠수록</strong> 배당이 높아집니다.</li>
//                     <li>10개를 골라 다 맞추면 <strong>1,000배</strong> 대박!</li>
//                 </ul>
//                 <button className="btn" style={{width:'100%', marginTop:'10px', background:'#8e44ad'}} onClick={()=>setShowGuide(false)}>닫기</button>
//             </div>
//         </div>
//       )}

//       <div className="card" style={{ background: '#2d3436', marginBottom: '15px', padding: '10px' }}>💰 {point.toLocaleString()}원</div>

//       {/* 🟢 배당률 미리보기 */}
//       <div style={{ display: 'flex', gap: '2px', overflowX: 'auto', marginBottom: '15px', paddingBottom: '5px' }}>
//         {currentPayouts.map((multi, hits) => (
//             <div key={hits} style={{ minWidth: '40px', background: '#333', padding: '5px', borderRadius: '4px', textAlign: 'center', border: '1px solid #444' }}>
//                 <div style={{ fontSize: '10px', color: '#aaa' }}>{hits}개</div>
//                 <div style={{ fontSize: '14px', color: multi > 0 ? '#f1c40f' : '#555', fontWeight: 'bold' }}>x{multi}</div>
//             </div>
//         ))}
//         {selected.length === 0 && <div style={{width:'100%', color:'#666', fontSize:'12px'}}>번호를 선택하면 배당표가 보입니다.</div>}
//       </div>

//       {/* 🎱 40개 번호판 (8x5 그리드) */}
//       <div style={{ 
//           display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px', 
//           maxWidth: '400px', margin: '0 auto 20px', padding: '10px', background: '#1e272e', borderRadius: '10px' 
//       }}>
//         {Array.from({ length: 40 }, (_, i) => i + 1).map(num => {
//             const isSelected = selected.includes(num);
//             const isDrawn = drawn.includes(num);
//             const isMatch = isSelected && isDrawn;
            
//             let bg = '#2c3e50'; // 기본
//             if (isSelected) bg = '#8e44ad'; // 선택됨 (보라)
//             if (isDrawn) bg = '#e74c3c'; // 추첨됨 (빨강)
//             if (isMatch) bg = '#2ecc71'; // 적중 (초록) -> 이게 제일 중요!

//             return (
//                 <div key={num} onClick={() => toggleNumber(num)} style={{ 
//                     aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center',
//                     background: bg, borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
//                     transform: isMatch ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.2s',
//                     boxShadow: isMatch ? '0 0 10px #2ecc71' : 'none',
//                     border: isMatch ? '2px solid white' : 'none'
//                 }}>
//                     {num}
//                 </div>
//             )
//         })}
//       </div>

//       {/* 컨트롤 패널 */}
//       <div className="card" style={{ background: '#2c3e50', padding: '15px' }}>
//         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#bdc3c7', fontSize: '14px' }}>
//             <span>선택: <b style={{color:'white'}}>{selected.length}/10</b></span>
//             {selected.length > 0 && <span>최대배당: <b style={{color:'#f1c40f'}}>x{Math.max(...currentPayouts)}</b></span>}
//         </div>

//         <input className="input" type="number" placeholder="배팅 금액" value={bet} onChange={e => setBet(e.target.value)} style={{ textAlign: 'center', background: '#1e272e', color: 'white' }} />
        
//         <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
//            <button className="btn" style={{ flex: 1, background: '#34495e' }} onClick={autoPick} disabled={gameState === 'playing'}>🎲 자동 선택</button>
//            <button className="btn" style={{ flex: 1, background: '#e67e22', color: 'black' }} onClick={() => setBet(point.toString())}>올인</button>
//            <button className="btn" style={{ width: '50px', background: '#c0392b' }} onClick={() => setSelected([])} disabled={gameState === 'playing'}>C</button>
//         </div>

//         <button className="btn btn-primary" style={{ width: '100%', padding: '15px', fontSize: '20px', background: '#8e44ad' }} onClick={playKeno} disabled={gameState === 'playing'}>
//             {gameState === 'playing' ? '추첨 중...' : '🎱 게임 시작'}
//         </button>
//       </div>

//       <button className="btn" style={{ marginTop: 20, background: '#444', width: '100%' }} onClick={() => navigate('/home')}>🏠 홈으로</button>
//     </div>
//   );
// }