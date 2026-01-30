// import React, { useState, useEffect, useRef } from 'react';
// import { db, auth } from '../firebase';
// // 👇 addDoc, collection, serverTimestamp 추가됨
// import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';

// export default function Crash() {
//   // ... (기존 state들 그대로 유지) ...
//   const [point, setPoint] = useState(0);
//   const [bet, setBet] = useState('');
//   const [autoCashOut, setAutoCashOut] = useState('');
//   const [multiplier, setMultiplier] = useState(1.00);
//   const [gameState, setGameState] = useState('idle');
//   const [history, setHistory] = useState([1.23, 2.50, 1.10, 5.43, 1.05]); 
  
//   const navigate = useNavigate();
//   const user = auth.currentUser;
  
//   const canvasRef = useRef(null);
//   const reqRef = useRef(null);
//   const crashPointRef = useRef(0);
//   const startTimeRef = useRef(0);
//   const isAutoCashedOutRef = useRef(false);

//   const probTable = [ { target: '1.10x', prob: '90.0%', risk: '매우 안전', color: '#3498db' }, { target: '1.50x', prob: '66.0%', risk: '안전', color: '#2ecc71' }, { target: '2.00x', prob: '49.5%', risk: '반반', color: '#f1c40f' }, { target: '5.00x', prob: '19.8%', risk: '고수익', color: '#e67e22' }, { target: '10.0x', prob: '9.9%', risk: '초대박', color: '#e74c3c' }, { target: '100x', prob: '0.99%', risk: '전설', color: '#9b59b6' }, ];

//   // ... (useEffect, fetchPoint, handleBetPercent 그대로 유지) ...
//   useEffect(() => { if (!user) { navigate('/login'); return; } fetchPoint(); return () => cancelAnimationFrame(reqRef.current); }, [user, navigate]);
//   const fetchPoint = async () => { try { const d = await getDoc(doc(db, "users", user.uid)); if (d.exists()) setPoint(d.data().point || 0); } catch (e) { console.error(e); } };
//   const handleBetPercent = (percent) => { if (percent === 0) { setBet(''); return; } const amount = Math.floor(point * percent); setBet(String(amount)); };

//   const startGame = async () => {
//     // ... (기본 검증 로직 그대로) ...
//     if (reqRef.current) cancelAnimationFrame(reqRef.current);
//     const canvas = canvasRef.current;
//     if (canvas) { const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); }

//     const betMoney = parseInt(bet);
//     if (isNaN(betMoney) || betMoney <= 0) return alert("배팅 금액을 입력하세요!");
//     if (betMoney > Math.floor(point)) return alert("돈이 부족합니다!");

//     const autoTarget = parseFloat(autoCashOut);
//     if (autoCashOut && (isNaN(autoTarget) || autoTarget <= 1.0)) { return alert("자동 익절 배수는 1.01 이상이어야 합니다."); }

//     try {
//       await updateDoc(doc(db, "users", user.uid), { point: increment(-betMoney) });
//       setPoint(prev => prev - betMoney);

//       // ✅ [기록 추가] 베팅 로그 저장
//       await addDoc(collection(db, "history"), {
//           uid: user.uid,
//           type: "게임",
//           msg: "그래프 게임 베팅",
//           amount: -betMoney,
//           createdAt: serverTimestamp()
//       });

//     } catch (e) { alert("⚠️ 서버 오류"); return; }

//     setGameState('playing');
//     setMultiplier(1.00);
//     isAutoCashedOutRef.current = false;
    
//     // ... (게임 로직 그대로) ...
//     const random = Math.random();
//     const houseEdge = 1.00; 
//     const crash = Math.floor((houseEdge / (1 - random)) * 100) / 100;
//     crashPointRef.current = Math.max(1.00, crash);
//     startTimeRef.current = Date.now();
//     drawGraph();
//   };

//   // ... (drawGraph, cashOut, handleAutoWin 그대로 유지) ...
//   const drawGraph = () => { const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); const width = canvas.width; const height = canvas.height; const elapsed = (Date.now() - startTimeRef.current) / 1000; const currentMult = 1 + (elapsed * elapsed * 0.1) + (elapsed * 0.1); const autoTarget = parseFloat(autoCashOut); if (!isAutoCashedOutRef.current && !isNaN(autoTarget) && currentMult >= autoTarget) { if (crashPointRef.current >= autoTarget) { isAutoCashedOutRef.current = true; handleAutoWin(autoTarget); return; } } if (currentMult >= crashPointRef.current) { setMultiplier(crashPointRef.current); setGameState('crashed'); setHistory(prev => [crashPointRef.current, ...prev].slice(0, 10)); if (navigator.vibrate) navigator.vibrate(500); return; } setMultiplier(currentMult); ctx.clearRect(0, 0, width, height); ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.beginPath(); for(let i=0; i<width; i+=50) { ctx.moveTo(i,0); ctx.lineTo(i,height); } for(let i=0; i<height; i+=50) { ctx.moveTo(0,i); ctx.lineTo(width,i); } ctx.stroke(); ctx.beginPath(); ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 5; ctx.moveTo(0, height); const x = Math.min(width, elapsed * 40); const y = height - Math.min(height, (currentMult - 1) * 50); ctx.quadraticCurveTo(x/2, height, x, y); ctx.stroke(); ctx.font = "30px Arial"; ctx.fillText("🚀", x - 15, y - 10); reqRef.current = requestAnimationFrame(drawGraph); };
//   const cashOut = async () => { if (gameState !== 'playing') return; cancelAnimationFrame(reqRef.current); processWin(multiplier); };
//   const handleAutoWin = (targetVal) => { cancelAnimationFrame(reqRef.current); setMultiplier(targetVal); processWin(targetVal); };

//   const processWin = async (winMult) => {
//     setGameState('cashed_out');
//     const winMoney = Math.floor(parseInt(bet) * winMult);
//     setPoint(prev => prev + winMoney);
//     await updateDoc(doc(db, "users", user.uid), { point: increment(winMoney) });

//     // ✅ [기록 추가] 익절 로그 저장
//     await addDoc(collection(db, "history"), {
//         uid: user.uid,
//         type: "게임",
//         msg: `그래프 익절 (${winMult.toFixed(2)}배)`,
//         amount: winMoney,
//         createdAt: serverTimestamp()
//     });
//   };

//   return (
//     // ... (기존 UI 코드 유지) ...
//     <div className="container" style={{ background: '#1e272e', minHeight: '100vh', color: 'white', textAlign: 'center', padding: '15px' }}>
//       <h1 style={{ color: '#ffdd59', fontSize: '24px', letterSpacing: '2px', marginBottom: '10px' }}>🚀 CRASH GRAPH</h1>
//       <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', padding: '10px', background: '#2f3640', borderRadius: '8px', marginBottom: '15px' }}>
//         {history.map((h, i) => ( <div key={i} style={{ background: h >= 2.0 ? '#2ecc71' : '#e74c3c', padding: '5px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', minWidth: '50px' }}> {h.toFixed(2)}x </div> ))}
//       </div>
//       <div className="card" style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', marginBottom: '15px' }}>💰 {Math.floor(point).toLocaleString()}원</div>
//       <div style={{ position: 'relative', width: '100%', maxWidth: '400px', height: '320px', margin: '0 auto 20px', background: '#000', borderRadius: '10px', border: '2px solid #555', overflow: 'hidden' }}>
//         {gameState === 'idle' && ( <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', padding: '10px', background: 'rgba(0,0,0,0.9)', zIndex: 10 }}> <h3 style={{ margin: '10px 0', color: '#ffdd59' }}>📊 배당별 확률 분석</h3> <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}> {probTable.map((item, idx) => ( <div key={idx} style={{ background: '#333', padding: '8px', borderRadius: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid ${item.color}` }}> <span style={{ fontWeight: 'bold', color: 'white' }}>{item.target}</span> <div style={{ textAlign: 'right' }}> <div style={{ fontSize: '12px', color: '#ccc' }}>{item.prob}</div> <div style={{ fontSize: '10px', color: item.color }}>{item.risk}</div> </div> </div> ))} </div> <div style={{ marginTop: '15px', color: '#aaa', fontSize: '12px' }}>⚠️ 1.00배 즉시 폭발 확률 1%</div> </div> )}
//         {gameState !== 'idle' && ( <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '60px', fontWeight: 'bold', color: gameState === 'crashed' ? '#e74c3c' : (gameState === 'cashed_out' ? '#f1c40f' : 'white'), textShadow: '0 0 10px rgba(0,0,0,0.8)' }}> {multiplier.toFixed(2)}x </div> )}
//         <canvas ref={canvasRef} width={400} height={320} />
//       </div>
//       <div className="card" style={{ background: '#353b48', padding: '20px' }}>
//         {gameState === 'playing' ? (
//           <button className="btn" style={{ width: '100%', height: '70px', fontSize: '28px', background: '#fbc531', color: 'black', fontWeight: 'bold', boxShadow: '0 5px #e1b12c' }} onClick={cashOut}> ✋ STOP (익절) {autoCashOut && <div style={{fontSize:'14px', fontWeight:'normal'}}>(목표: {autoCashOut}x)</div>} </button>
//         ) : (
//           <>
//             <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
//                 <input className="input" type="number" placeholder="배팅 금액" value={bet} onChange={e => setBet(e.target.value)} style={{ flex: 1, textAlign: 'center', fontSize: '18px' }} />
//                 <input className="input" type="number" placeholder="자동 익절 (예: 2.0)" value={autoCashOut} onChange={e => setAutoCashOut(e.target.value)} style={{ flex: 1, textAlign: 'center', fontSize: '18px', border: '1px solid #f1c40f', color: '#f1c40f' }} />
//             </div>
//             <div style={{display:'flex', gap:5, marginBottom:15}}>
//                 <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.1)}>10%</button>
//                 <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.25)}>25%</button>
//                 <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.5)}>50%</button>
//                 <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#e74c3c', color:'white', fontWeight:'bold'}} onClick={()=>handleBetPercent(1)}>ALL</button>
//                 <button className="btn" style={{width:40, padding:5, fontSize:12, background:'#95a5a6'}} onClick={()=>handleBetPercent(0)}>🔄</button>
//             </div>
//             <button className="btn btn-primary" style={{ width: '100%', padding: '15px', fontSize: '22px', background: '#00a8ff' }} onClick={startGame}> {gameState === 'crashed' || gameState === 'cashed_out' ? '🚀 다시 발사' : '🚀 게임 시작'} </button>
//           </>
//         )}
//       </div>
//       <button className="btn" style={{ marginTop: 20, background: '#444', width: '100%' }} onClick={() => navigate('/home')}>🏠 홈으로</button>
//     </div>
//   );
// }

import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext'; // 👈

export default function Crash() {
  const [point, setPoint] = useState(0);
  const [bet, setBet] = useState('');
  const [autoCashOut, setAutoCashOut] = useState('');
  const [multiplier, setMultiplier] = useState(1.00);
  const [gameState, setGameState] = useState('idle');
  const [history, setHistory] = useState([1.23, 2.50, 1.10, 5.43, 1.05]); 
  
  const navigate = useNavigate();
  const user = auth.currentUser;
  const { t } = useLanguage(); // 👈
  
  const canvasRef = useRef(null);
  const reqRef = useRef(null);
  const crashPointRef = useRef(0);
  const startTimeRef = useRef(0);
  const isAutoCashedOutRef = useRef(false);

  const probTable = [ { target: '1.10x', prob: '90.0%', risk: 'Very Safe', color: '#3498db' }, { target: '1.50x', prob: '66.0%', risk: 'Safe', color: '#2ecc71' }, { target: '2.00x', prob: '49.5%', risk: 'Medium', color: '#f1c40f' }, { target: '5.00x', prob: '19.8%', risk: 'High', color: '#e67e22' }, { target: '10.0x', prob: '9.9%', risk: 'Ultra', color: '#e74c3c' }, { target: '100x', prob: '0.99%', risk: 'God', color: '#9b59b6' }, ];

  useEffect(() => { if (!user) { navigate('/login'); return; } fetchPoint(); return () => cancelAnimationFrame(reqRef.current); }, [user, navigate]);
  const fetchPoint = async () => { try { const d = await getDoc(doc(db, "users", user.uid)); if (d.exists()) setPoint(d.data().point || 0); } catch (e) { console.error(e); } };
  const handleBetPercent = (percent) => { if (percent === 0) { setBet(''); return; } const amount = Math.floor(point * percent); setBet(String(amount)); };

  const startGame = async () => {
    if (reqRef.current) cancelAnimationFrame(reqRef.current);
    const canvas = canvasRef.current;
    if (canvas) { const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); }

    const betMoney = parseInt(bet);
    if (isNaN(betMoney) || betMoney <= 0) return alert(t.alertInputBet);
    if (betMoney > Math.floor(point)) return alert(t.alertNoMoney);

    const autoTarget = parseFloat(autoCashOut);
    if (autoCashOut && (isNaN(autoTarget) || autoTarget <= 1.0)) { return alert("Auto cashout > 1.01"); }

    try {
      await updateDoc(doc(db, "users", user.uid), { point: increment(-betMoney) });
      setPoint(prev => prev - betMoney);
      await addDoc(collection(db, "history"), { uid: user.uid, type: "게임", msg: "그래프 배팅", amount: -betMoney, createdAt: serverTimestamp() });
    } catch (e) { alert(t.alertError); return; }

    setGameState('playing');
    setMultiplier(1.00);
    isAutoCashedOutRef.current = false;
    
    const random = Math.random();
    const houseEdge = 1.00; 
    const crash = Math.floor((houseEdge / (1 - random)) * 100) / 100;
    crashPointRef.current = Math.max(1.00, crash);
    startTimeRef.current = Date.now();
    drawGraph();
  };

  const drawGraph = () => { const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); const width = canvas.width; const height = canvas.height; const elapsed = (Date.now() - startTimeRef.current) / 1000; const currentMult = 1 + (elapsed * elapsed * 0.1) + (elapsed * 0.1); const autoTarget = parseFloat(autoCashOut); if (!isAutoCashedOutRef.current && !isNaN(autoTarget) && currentMult >= autoTarget) { if (crashPointRef.current >= autoTarget) { isAutoCashedOutRef.current = true; handleAutoWin(autoTarget); return; } } if (currentMult >= crashPointRef.current) { setMultiplier(crashPointRef.current); setGameState('crashed'); setHistory(prev => [crashPointRef.current, ...prev].slice(0, 10)); if (navigator.vibrate) navigator.vibrate(500); return; } setMultiplier(currentMult); ctx.clearRect(0, 0, width, height); ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.beginPath(); for(let i=0; i<width; i+=50) { ctx.moveTo(i,0); ctx.lineTo(i,height); } for(let i=0; i<height; i+=50) { ctx.moveTo(0,i); ctx.lineTo(width,i); } ctx.stroke(); ctx.beginPath(); ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 5; ctx.moveTo(0, height); const x = Math.min(width, elapsed * 40); const y = height - Math.min(height, (currentMult - 1) * 50); ctx.quadraticCurveTo(x/2, height, x, y); ctx.stroke(); ctx.font = "30px Arial"; ctx.fillText("🚀", x - 15, y - 10); reqRef.current = requestAnimationFrame(drawGraph); };
  const cashOut = async () => { if (gameState !== 'playing') return; cancelAnimationFrame(reqRef.current); processWin(multiplier); };
  const handleAutoWin = (targetVal) => { cancelAnimationFrame(reqRef.current); setMultiplier(targetVal); processWin(targetVal); };

  const processWin = async (winMult) => {
    setGameState('cashed_out');
    const winMoney = Math.floor(parseInt(bet) * winMult);
    setPoint(prev => prev + winMoney);
    await updateDoc(doc(db, "users", user.uid), { point: increment(winMoney) });
    await addDoc(collection(db, "history"), { uid: user.uid, type: "게임", msg: `그래프 익절 (${winMult.toFixed(2)}배)`, amount: winMoney, createdAt: serverTimestamp() });
  };

  return (
    <div className="container" style={{ background: '#1e272e', minHeight: '100vh', color: 'white', textAlign: 'center', padding: '15px' }}>
      <h1 style={{ color: '#ffdd59', fontSize: '24px', letterSpacing: '2px', marginBottom: '10px' }}>🚀 CRASH GRAPH</h1>
      <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', padding: '10px', background: '#2f3640', borderRadius: '8px', marginBottom: '15px' }}>
        {history.map((h, i) => ( <div key={i} style={{ background: h >= 2.0 ? '#2ecc71' : '#e74c3c', padding: '5px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', minWidth: '50px' }}> {h.toFixed(2)}x </div> ))}
      </div>
      <div className="card" style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', marginBottom: '15px' }}>{t.balance}: {Math.floor(point).toLocaleString()}</div>
      <div style={{ position: 'relative', width: '100%', maxWidth: '400px', height: '320px', margin: '0 auto 20px', background: '#000', borderRadius: '10px', border: '2px solid #555', overflow: 'hidden' }}>
        {gameState === 'idle' && ( <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', padding: '10px', background: 'rgba(0,0,0,0.9)', zIndex: 10 }}> <h3 style={{ margin: '10px 0', color: '#ffdd59' }}>📊 Odds</h3> <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}> {probTable.map((item, idx) => ( <div key={idx} style={{ background: '#333', padding: '8px', borderRadius: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid ${item.color}` }}> <span style={{ fontWeight: 'bold', color: 'white' }}>{item.target}</span> <div style={{ textAlign: 'right' }}> <div style={{ fontSize: '12px', color: '#ccc' }}>{item.prob}</div> <div style={{ fontSize: '10px', color: item.color }}>{item.risk}</div> </div> </div> ))} </div> </div> )}
        {gameState !== 'idle' && ( <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '60px', fontWeight: 'bold', color: gameState === 'crashed' ? '#e74c3c' : (gameState === 'cashed_out' ? '#f1c40f' : 'white'), textShadow: '0 0 10px rgba(0,0,0,0.8)' }}> {multiplier.toFixed(2)}x </div> )}
        <canvas ref={canvasRef} width={400} height={320} />
      </div>
      <div className="card" style={{ background: '#353b48', padding: '20px' }}>
        {gameState === 'playing' ? (
          <button className="btn" style={{ width: '100%', height: '70px', fontSize: '28px', background: '#fbc531', color: 'black', fontWeight: 'bold', boxShadow: '0 5px #e1b12c' }} onClick={cashOut}> ✋ STOP </button>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input className="input" type="number" placeholder={t.inputBet} value={bet} onChange={e => setBet(e.target.value)} style={{ flex: 1, textAlign: 'center', fontSize: '18px' }} />
                <input className="input" type="number" placeholder="Auto (ex 2.0)" value={autoCashOut} onChange={e => setAutoCashOut(e.target.value)} style={{ flex: 1, textAlign: 'center', fontSize: '18px', border: '1px solid #f1c40f', color: '#f1c40f' }} />
            </div>
            <div style={{display:'flex', gap:5, marginBottom:15}}>
                <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.1)}>10%</button>
                <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.25)}>25%</button>
                <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.5)}>50%</button>
                <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#e74c3c', color:'white', fontWeight:'bold'}} onClick={()=>handleBetPercent(1)}>ALL</button>
                <button className="btn" style={{width:40, padding:5, fontSize:12, background:'#95a5a6'}} onClick={()=>handleBetPercent(0)}>🔄</button>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '15px', fontSize: '22px', background: '#00a8ff' }} onClick={startGame}> {gameState === 'crashed' ? t.restart : t.gameStart} </button>
          </>
        )}
      </div>
      <button className="btn" style={{ marginTop: 20, background: '#444', width: '100%' }} onClick={() => navigate('/home')}>{t.home}</button>
    </div>
  );
}