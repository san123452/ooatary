// import React, { useState, useEffect, useRef } from 'react';
// import { db, auth } from '../firebase';
// // 👇 addDoc, collection, serverTimestamp 추가됨
// import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';

// export default function CrazyOstrich() {
//   const [point, setPoint] = useState(0);
//   const [betAmount, setBetAmount] = useState('');
//   const [selectedSide, setSelectedSide] = useState(null); 
//   const [gameState, setGameState] = useState('idle'); 
//   const [ostrichX, setOstrichX] = useState(0); 
//   const [direction, setDirection] = useState('right'); 
//   const MOVE_DURATION = 1.2; 

//   const navigate = useNavigate();
//   const user = auth.currentUser;
//   const timerRef = useRef(null);

//   useEffect(() => { if (!user) { navigate('/login'); return; } fetchPoint(); return () => clearInterval(timerRef.current); }, [user, navigate]);
//   const fetchPoint = async () => { try { const d = await getDoc(doc(db, "users", user.uid)); if (d.exists()) setPoint(d.data().point || 0); } catch (e) {} };
//   const handleBetPercent = (percent) => { if (percent === 0) { setBetAmount(''); return; } const amount = Math.floor(point * percent); setBetAmount(String(amount)); };

//   const startGame = async () => {
//     if (!selectedSide) return alert("⬅️ 왼쪽 vs 오른쪽 ➡️ 선택하세요!");
//     const money = parseInt(betAmount);
//     if (isNaN(money) || money <= 0) return alert("배팅금을 입력하세요!");
//     if (money > Math.floor(point)) return alert("포인트 부족!");

//     try {
//       await updateDoc(doc(db, "users", user.uid), { point: increment(-money) });
//       setPoint(prev => prev - money);

//       // ✅ [기록 추가] 베팅 로그
//       await addDoc(collection(db, "history"), {
//           uid: user.uid,
//           type: "게임",
//           msg: `타조게임 베팅 (${selectedSide === 'left' ? '왼쪽' : '오른쪽'})`,
//           amount: -money,
//           createdAt: serverTimestamp()
//       });

//     } catch (e) { return alert("오류 발생"); }

//     setGameState('running');
//     setOstrichX(0); setDirection('right');

//     const finalResult = Math.random() > 0.5 ? 'left' : 'right';
//     const fakeCount = Math.floor(Math.random() * 5) ; 
//     let moves = [];
//     moves.push({ x: 0, dir: 'right' }); 
//     for(let i=0; i<fakeCount; i++) { const isLeft = Math.random() > 0.5; const dir = isLeft ? 'left' : 'right'; const deepX = isLeft ? -220 : 220; moves.push({ x: deepX, dir: dir }); moves.push({ x: 0, dir: dir === 'left' ? 'right' : 'left' }); }
//     const endX = finalResult === 'left' ? -1500 : 1500;
//     moves.push({ x: endX, dir: finalResult });

//     let step = 0;
//     const runMove = () => {
//         if (step >= moves.length) { clearInterval(timerRef.current); finishGame(finalResult, money); return; }
//         const move = moves[step]; setOstrichX(move.x); if (move.dir) setDirection(move.dir); step++;
//     };
//     runMove(); 
//     timerRef.current = setInterval(runMove, MOVE_DURATION * 1000);
//   };

//   const finishGame = async (result, money) => {
//     setGameState('finished');
//     const isWin = selectedSide === result;
    
//     setTimeout(async () => {
//         if (isWin) {
//             const winAmount = Math.floor(money * 1.97);
//             setPoint(prev => prev + winAmount);
//             await updateDoc(doc(db, "users", user.uid), { point: increment(winAmount) });
            
//             // ✅ [기록 추가] 당첨 로그
//             await addDoc(collection(db, "history"), {
//                 uid: user.uid,
//                 type: "게임",
//                 msg: "타조게임 적중",
//                 amount: winAmount,
//                 createdAt: serverTimestamp()
//             });

//             alert(`🎉 적중! (+${winAmount.toLocaleString()}원)`);
//         } else {
//             alert(`😭 땡!`);
//         }
//     }, 500);
//   };

//   return (
//     // ... (기존 UI 유지) ...
//     <div className="container" style={{ background: '#353b48', minHeight: '100vh', color: 'white', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
//       <div style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#2f3640', borderBottom: '2px solid #1e272e', zIndex: 20 }}> <h1 style={{ margin: 0, fontSize: '20px', color: '#ff7675' }}>🦩 CRAZY OSTRICH</h1> <div style={{ fontWeight: 'bold' }}>💰 {Math.floor(point).toLocaleString()}</div> </div>
//       <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#5c94fc' }}>
//         <div style={{ position: 'absolute', top: '20%', left: '10%', fontSize: '50px', opacity: 0.8 }}>☁️</div> <div style={{ position: 'absolute', top: '10%', right: '20%', fontSize: '40px', opacity: 0.6 }}>☁️</div>
//         <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '80px', background: 'repeating-linear-gradient(45deg, #e17055 0px, #e17055 20px, #d63031 20px, #d63031 40px)', borderTop: '10px solid #6ab04c' }}></div>
//         <div style={{ position: 'absolute', bottom: '80px', left: '10px', fontSize: '30px' }}>🚩 LEFT</div> <div style={{ position: 'absolute', bottom: '80px', right: '10px', fontSize: '30px' }}>RIGHT 🚩</div>
//         <div style={{ position: 'absolute', bottom: '90px', left: '50%', fontSize: '80px', transform: `translateX(calc(-50% + ${ostrichX}px)) scaleX(${direction === 'left' ? -1 : 1})`, transition: `transform ${MOVE_DURATION}s linear`, zIndex: 10, textShadow: '0 5px 10px rgba(0,0,0,0.3)' }}> 🦩 </div>
//       </div>
//       <div className="card" style={{ background: '#2f3640', padding: '20px', borderRadius: '20px 20px 0 0', position: 'relative', zIndex: 10 }}>
//         <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
//             <button onClick={() => setSelectedSide('left')} disabled={gameState !== 'idle' && gameState !== 'finished'} style={{ flex: 1, padding: '20px', borderRadius: '10px', border: 'none', background: selectedSide === 'left' ? '#ff6b6b' : '#7f8c8d', color: 'white', fontSize: '20px', fontWeight: 'bold', boxShadow: selectedSide === 'left' ? '0 5px 0 #c23616' : '0 5px 0 #2d3436', transform: selectedSide === 'left' ? 'translateY(2px)' : 'none', transition: 'all 0.1s' }}> ⬅️ LEFT </button>
//             <button onClick={() => setSelectedSide('right')} disabled={gameState !== 'idle' && gameState !== 'finished'} style={{ flex: 1, padding: '20px', borderRadius: '10px', border: 'none', background: selectedSide === 'right' ? '#48dbfb' : '#7f8c8d', color: 'white', fontSize: '20px', fontWeight: 'bold', boxShadow: selectedSide === 'right' ? '0 5px 0 #0abde3' : '0 5px 0 #2d3436', transform: selectedSide === 'right' ? 'translateY(2px)' : 'none', transition: 'all 0.1s' }}> RIGHT ➡️ </button>
//         </div>
//         <input className="input" type="number" placeholder="배팅 금액" value={betAmount} onChange={e => setBetAmount(e.target.value)} style={{ width: '100%', marginBottom: '10px', textAlign: 'center', background: '#1e272e', color: 'white', border:'none', fontSize: '18px', padding: '10px' }} />
//         <div style={{display:'flex', gap:5, marginBottom:15}}>
//             <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.1)} disabled={gameState === 'running'}>10%</button>
//             <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.25)} disabled={gameState === 'running'}>25%</button>
//             <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.5)} disabled={gameState === 'running'}>50%</button>
//             <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#e74c3c', color:'white', fontWeight:'bold'}} onClick={()=>handleBetPercent(1)} disabled={gameState === 'running'}>ALL</button>
//             <button className="btn" style={{width:40, padding:5, fontSize:12, background:'#95a5a6'}} onClick={()=>handleBetPercent(0)} disabled={gameState === 'running'}>🔄</button>
//         </div>
//         <button className="btn btn-primary" style={{ width: '100%', padding: '15px', fontSize: '20px', fontWeight: 'bold', background: gameState !== 'idle' && gameState !== 'finished' ? '#555' : '#1dd1a1', boxShadow: '0 5px 0 #10ac84' }} onClick={startGame} disabled={gameState !== 'idle' && gameState !== 'finished'}> {gameState === 'running' ? '👀 타조 눈치 보는 중...' : '🏁 게임 시작 (x1.97)'} </button>
//         <button className="btn" style={{ marginTop: 15, background: '#444', width: '100%' }} onClick={() => navigate('/home')}>🏠 홈으로</button>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext'; // 👈

export default function CrazyOstrich() {
  const [point, setPoint] = useState(0);
  const [betAmount, setBetAmount] = useState('');
  const [selectedSide, setSelectedSide] = useState(null); 
  const [gameState, setGameState] = useState('idle'); 
  const [ostrichX, setOstrichX] = useState(0); 
  const [direction, setDirection] = useState('right'); 
  const MOVE_DURATION = 1.2; 

  const navigate = useNavigate();
  const user = auth.currentUser;
  const timerRef = useRef(null);
  const { t } = useLanguage(); // 👈

  useEffect(() => { if (!user) { navigate('/login'); return; } fetchPoint(); return () => clearInterval(timerRef.current); }, [user, navigate]);
  const fetchPoint = async () => { try { const d = await getDoc(doc(db, "users", user.uid)); if (d.exists()) setPoint(d.data().point || 0); } catch (e) {} };
  const handleBetPercent = (percent) => { if (percent === 0) { setBetAmount(''); return; } const amount = Math.floor(point * percent); setBetAmount(String(amount)); };

  const startGame = async () => {
    if (!selectedSide) return alert("Select LEFT or RIGHT");
    const money = parseInt(betAmount);
    if (isNaN(money) || money <= 0) return alert(t.alertInputBet);
    if (money > Math.floor(point)) return alert(t.alertNoMoney);

    try {
      await updateDoc(doc(db, "users", user.uid), { point: increment(-money) });
      setPoint(prev => prev - money);
      
      await addDoc(collection(db, "history"), { uid: user.uid, type: "게임", msg: `타조 배팅 (${selectedSide})`, amount: -money, createdAt: serverTimestamp() });
    } catch (e) { return alert(t.alertError); }

    setGameState('running');
    setOstrichX(0); setDirection('right');

    const finalResult = Math.random() > 0.5 ? 'left' : 'right';
    const fakeCount = Math.floor(Math.random() * 5) ; 
    let moves = [];
    moves.push({ x: 0, dir: 'right' }); 
    for(let i=0; i<fakeCount; i++) { const isLeft = Math.random() > 0.5; const dir = isLeft ? 'left' : 'right'; const deepX = isLeft ? -220 : 220; moves.push({ x: deepX, dir: dir }); moves.push({ x: 0, dir: dir === 'left' ? 'right' : 'left' }); }
    const endX = finalResult === 'left' ? -1500 : 1500;
    moves.push({ x: endX, dir: finalResult });

    let step = 0;
    const runMove = () => {
        if (step >= moves.length) { clearInterval(timerRef.current); finishGame(finalResult, money); return; }
        const move = moves[step]; setOstrichX(move.x); if (move.dir) setDirection(move.dir); step++;
    };
    runMove(); 
    timerRef.current = setInterval(runMove, MOVE_DURATION * 1000);
  };

  const finishGame = async (result, money) => {
    setGameState('finished');
    const isWin = selectedSide === result;
    
    setTimeout(async () => {
        if (isWin) {
            const winAmount = Math.floor(money * 1.97);
            setPoint(prev => prev + winAmount);
            await updateDoc(doc(db, "users", user.uid), { point: increment(winAmount) });
            await addDoc(collection(db, "history"), { uid: user.uid, type: "게임", msg: "타조 적중", amount: winAmount, createdAt: serverTimestamp() });
            alert(`${t.win} (+${winAmount.toLocaleString()})`);
        } else {
            alert(t.lose);
        }
    }, 500);
  };

  return (
    <div className="container" style={{ background: '#353b48', minHeight: '100vh', color: 'white', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#2f3640', borderBottom: '2px solid #1e272e', zIndex: 20 }}> <h1 style={{ margin: 0, fontSize: '20px', color: '#ff7675' }}>🦩 CRAZY OSTRICH</h1> <div style={{ fontWeight: 'bold' }}>💰 {Math.floor(point).toLocaleString()}</div> </div>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#5c94fc' }}>
        <div style={{ position: 'absolute', top: '20%', left: '10%', fontSize: '50px', opacity: 0.8 }}>☁️</div> <div style={{ position: 'absolute', top: '10%', right: '20%', fontSize: '40px', opacity: 0.6 }}>☁️</div>
        <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '80px', background: 'repeating-linear-gradient(45deg, #e17055 0px, #e17055 20px, #d63031 20px, #d63031 40px)', borderTop: '10px solid #6ab04c' }}></div>
        <div style={{ position: 'absolute', bottom: '80px', left: '10px', fontSize: '30px' }}>🚩 LEFT</div> <div style={{ position: 'absolute', bottom: '80px', right: '10px', fontSize: '30px' }}>RIGHT 🚩</div>
        <div style={{ position: 'absolute', bottom: '90px', left: '50%', fontSize: '80px', transform: `translateX(calc(-50% + ${ostrichX}px)) scaleX(${direction === 'left' ? -1 : 1})`, transition: `transform ${MOVE_DURATION}s linear`, zIndex: 10, textShadow: '0 5px 10px rgba(0,0,0,0.3)' }}> 🦩 </div>
      </div>
      <div className="card" style={{ background: '#2f3640', padding: '20px', borderRadius: '20px 20px 0 0', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <button onClick={() => setSelectedSide('left')} disabled={gameState !== 'idle' && gameState !== 'finished'} style={{ flex: 1, padding: '20px', borderRadius: '10px', border: 'none', background: selectedSide === 'left' ? '#ff6b6b' : '#7f8c8d', color: 'white', fontSize: '20px', fontWeight: 'bold', boxShadow: selectedSide === 'left' ? '0 5px 0 #c23616' : '0 5px 0 #2d3436', transform: selectedSide === 'left' ? 'translateY(2px)' : 'none', transition: 'all 0.1s' }}> ⬅️ LEFT </button>
            <button onClick={() => setSelectedSide('right')} disabled={gameState !== 'idle' && gameState !== 'finished'} style={{ flex: 1, padding: '20px', borderRadius: '10px', border: 'none', background: selectedSide === 'right' ? '#48dbfb' : '#7f8c8d', color: 'white', fontSize: '20px', fontWeight: 'bold', boxShadow: selectedSide === 'right' ? '0 5px 0 #0abde3' : '0 5px 0 #2d3436', transform: selectedSide === 'right' ? 'translateY(2px)' : 'none', transition: 'all 0.1s' }}> RIGHT ➡️ </button>
        </div>
        <input className="input" type="number" placeholder={t.inputBet} value={betAmount} onChange={e => setBetAmount(e.target.value)} style={{ width: '100%', marginBottom: '10px', textAlign: 'center', background: '#1e272e', color: 'white', border:'none', fontSize: '18px', padding: '10px' }} />
        <div style={{display:'flex', gap:5, marginBottom:15}}>
            <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.1)} disabled={gameState === 'running'}>10%</button>
            <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.25)} disabled={gameState === 'running'}>25%</button>
            <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.5)} disabled={gameState === 'running'}>50%</button>
            <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#e74c3c', color:'white', fontWeight:'bold'}} onClick={()=>handleBetPercent(1)} disabled={gameState === 'running'}>ALL</button>
            <button className="btn" style={{width:40, padding:5, fontSize:12, background:'#95a5a6'}} onClick={()=>handleBetPercent(0)} disabled={gameState === 'running'}>🔄</button>
        </div>
        <button className="btn btn-primary" style={{ width: '100%', padding: '15px', fontSize: '20px', fontWeight: 'bold', background: gameState !== 'idle' && gameState !== 'finished' ? '#555' : '#1dd1a1', boxShadow: '0 5px 0 #10ac84' }} onClick={startGame} disabled={gameState !== 'idle' && gameState !== 'finished'}> {gameState === 'running' ? 'Running...' : 'START (x1.97)'} </button>
        <button className="btn" style={{ marginTop: 15, background: '#444', width: '100%' }} onClick={() => navigate('/home')}>{t.home}</button>
      </div>
    </div>
  );
}