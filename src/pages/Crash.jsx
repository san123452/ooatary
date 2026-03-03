
// import React, { useState, useEffect, useRef } from 'react';
// import { db, auth } from '../firebase';
// import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';
// import { useLanguage } from '../LanguageContext'; // 👈

// export default function Crash() {
//   const [point, setPoint] = useState(0);
//   const [bet, setBet] = useState('');
//   const [autoCashOut, setAutoCashOut] = useState('');
//   const [multiplier, setMultiplier] = useState(1.00);
//   const [gameState, setGameState] = useState('idle');
//   const [history, setHistory] = useState([1.23, 2.50, 1.10, 5.43, 1.05]); 
  
//   const navigate = useNavigate();
//   const user = auth.currentUser;
//   const { t } = useLanguage(); // 👈
  
//   const canvasRef = useRef(null);
//   const reqRef = useRef(null);
//   const crashPointRef = useRef(0);
//   const startTimeRef = useRef(0);
//   const isAutoCashedOutRef = useRef(false);

//   const probTable = [ { target: '1.10x', prob: '90.0%', risk: 'Very Safe', color: '#3498db' }, { target: '1.50x', prob: '66.0%', risk: 'Safe', color: '#2ecc71' }, { target: '2.00x', prob: '49.5%', risk: 'Medium', color: '#f1c40f' }, { target: '5.00x', prob: '19.8%', risk: 'High', color: '#e67e22' }, { target: '10.0x', prob: '9.9%', risk: 'Ultra', color: '#e74c3c' }, { target: '100x', prob: '0.99%', risk: 'God', color: '#9b59b6' }, ];

//   useEffect(() => { if (!user) { navigate('/login'); return; } fetchPoint(); return () => cancelAnimationFrame(reqRef.current); }, [user, navigate]);
//   const fetchPoint = async () => { try { const d = await getDoc(doc(db, "users", user.uid)); if (d.exists()) setPoint(d.data().point || 0); } catch (e) { console.error(e); } };
//   const handleBetPercent = (percent) => { if (percent === 0) { setBet(''); return; } const amount = Math.floor(point * percent); setBet(String(amount)); };

//   const startGame = async () => {
//     if (reqRef.current) cancelAnimationFrame(reqRef.current);
//     const canvas = canvasRef.current;
//     if (canvas) { const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); }

//     const betMoney = parseInt(bet);
//     if (isNaN(betMoney) || betMoney <= 0) return alert(t.alertInputBet);
//     if (betMoney > Math.floor(point)) return alert(t.alertNoMoney);

//     const autoTarget = parseFloat(autoCashOut);
//     if (autoCashOut && (isNaN(autoTarget) || autoTarget <= 1.0)) { return alert("Auto cashout > 1.01"); }

//     try {
//       await updateDoc(doc(db, "users", user.uid), { point: increment(-betMoney) });
//       setPoint(prev => prev - betMoney);
//       await addDoc(collection(db, "history"), { uid: user.uid, type: "게임", msg: "그래프 배팅", amount: -betMoney, createdAt: serverTimestamp() });
//     } catch (e) { alert(t.alertError); return; }

//     setGameState('playing');
//     setMultiplier(1.00);
//     isAutoCashedOutRef.current = false;
    
//     const random = Math.random();
//     const houseEdge = 1.00; 
//     const crash = Math.floor((houseEdge / (1 - random)) * 100) / 100;
//     crashPointRef.current = Math.max(1.00, crash);
//     startTimeRef.current = Date.now();
//     drawGraph();
//   };

//   const drawGraph = () => { const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); const width = canvas.width; const height = canvas.height; const elapsed = (Date.now() - startTimeRef.current) / 1000; const currentMult = 1 + (elapsed * elapsed * 0.1) + (elapsed * 0.1); const autoTarget = parseFloat(autoCashOut); if (!isAutoCashedOutRef.current && !isNaN(autoTarget) && currentMult >= autoTarget) { if (crashPointRef.current >= autoTarget) { isAutoCashedOutRef.current = true; handleAutoWin(autoTarget); return; } } if (currentMult >= crashPointRef.current) { setMultiplier(crashPointRef.current); setGameState('crashed'); setHistory(prev => [crashPointRef.current, ...prev].slice(0, 10)); if (navigator.vibrate) navigator.vibrate(500); return; } setMultiplier(currentMult); ctx.clearRect(0, 0, width, height); ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.beginPath(); for(let i=0; i<width; i+=50) { ctx.moveTo(i,0); ctx.lineTo(i,height); } for(let i=0; i<height; i+=50) { ctx.moveTo(0,i); ctx.lineTo(width,i); } ctx.stroke(); ctx.beginPath(); ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 5; ctx.moveTo(0, height); const x = Math.min(width, elapsed * 40); const y = height - Math.min(height, (currentMult - 1) * 50); ctx.quadraticCurveTo(x/2, height, x, y); ctx.stroke(); ctx.font = "30px Arial"; ctx.fillText("🚀", x - 15, y - 10); reqRef.current = requestAnimationFrame(drawGraph); };
//   const cashOut = async () => { if (gameState !== 'playing') return; cancelAnimationFrame(reqRef.current); processWin(multiplier); };
//   const handleAutoWin = (targetVal) => { cancelAnimationFrame(reqRef.current); setMultiplier(targetVal); processWin(targetVal); };

//   const processWin = async (winMult) => {
//     setGameState('cashed_out');
//     const winMoney = Math.floor(parseInt(bet) * winMult);
//     setPoint(prev => prev + winMoney);
//     await updateDoc(doc(db, "users", user.uid), { point: increment(winMoney) });
//     await addDoc(collection(db, "history"), { uid: user.uid, type: "게임", msg: `그래프 익절 (${winMult.toFixed(2)}배)`, amount: winMoney, createdAt: serverTimestamp() });
//   };

//   return (
//     <div className="container" style={{ background: '#1e272e', minHeight: '100vh', color: 'white', textAlign: 'center', padding: '15px' }}>
//       <h1 style={{ color: '#ffdd59', fontSize: '24px', letterSpacing: '2px', marginBottom: '10px' }}>🚀 CRASH GRAPH</h1>
//       <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', padding: '10px', background: '#2f3640', borderRadius: '8px', marginBottom: '15px' }}>
//         {history.map((h, i) => ( <div key={i} style={{ background: h >= 2.0 ? '#2ecc71' : '#e74c3c', padding: '5px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', minWidth: '50px' }}> {h.toFixed(2)}x </div> ))}
//       </div>
//       <div className="card" style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', marginBottom: '15px' }}>{t.balance}: {Math.floor(point).toLocaleString()}</div>
//       <div style={{ position: 'relative', width: '100%', maxWidth: '400px', height: '320px', margin: '0 auto 20px', background: '#000', borderRadius: '10px', border: '2px solid #555', overflow: 'hidden' }}>
//         {gameState === 'idle' && ( <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', padding: '10px', background: 'rgba(0,0,0,0.9)', zIndex: 10 }}> <h3 style={{ margin: '10px 0', color: '#ffdd59' }}>📊 Odds</h3> <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}> {probTable.map((item, idx) => ( <div key={idx} style={{ background: '#333', padding: '8px', borderRadius: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid ${item.color}` }}> <span style={{ fontWeight: 'bold', color: 'white' }}>{item.target}</span> <div style={{ textAlign: 'right' }}> <div style={{ fontSize: '12px', color: '#ccc' }}>{item.prob}</div> <div style={{ fontSize: '10px', color: item.color }}>{item.risk}</div> </div> </div> ))} </div> </div> )}
//         {gameState !== 'idle' && ( <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '60px', fontWeight: 'bold', color: gameState === 'crashed' ? '#e74c3c' : (gameState === 'cashed_out' ? '#f1c40f' : 'white'), textShadow: '0 0 10px rgba(0,0,0,0.8)' }}> {multiplier.toFixed(2)}x </div> )}
//         <canvas ref={canvasRef} width={400} height={320} />
//       </div>
//       <div className="card" style={{ background: '#353b48', padding: '20px' }}>
//         {gameState === 'playing' ? (
//           <button className="btn" style={{ width: '100%', height: '70px', fontSize: '28px', background: '#fbc531', color: 'black', fontWeight: 'bold', boxShadow: '0 5px #e1b12c' }} onClick={cashOut}> ✋ STOP </button>
//         ) : (
//           <>
//             <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
//                 <input className="input" type="number" placeholder={t.inputBet} value={bet} onChange={e => setBet(e.target.value)} style={{ flex: 1, textAlign: 'center', fontSize: '18px' }} />
//                 <input className="input" type="number" placeholder="Auto (ex 2.0)" value={autoCashOut} onChange={e => setAutoCashOut(e.target.value)} style={{ flex: 1, textAlign: 'center', fontSize: '18px', border: '1px solid #f1c40f', color: '#f1c40f' }} />
//             </div>
//             <div style={{display:'flex', gap:5, marginBottom:15}}>
//                 <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.1)}>10%</button>
//                 <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.25)}>25%</button>
//                 <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.5)}>50%</button>
//                 <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#e74c3c', color:'white', fontWeight:'bold'}} onClick={()=>handleBetPercent(1)}>ALL</button>
//                 <button className="btn" style={{width:40, padding:5, fontSize:12, background:'#95a5a6'}} onClick={()=>handleBetPercent(0)}>🔄</button>
//             </div>
//             <button className="btn btn-primary" style={{ width: '100%', padding: '15px', fontSize: '22px', background: '#00a8ff' }} onClick={startGame}> {gameState === 'crashed' ? t.restart : t.gameStart} </button>
//           </>
//         )}
//       </div>
//       <button className="btn" style={{ marginTop: 20, background: '#444', width: '100%' }} onClick={() => navigate('/home')}>{t.home}</button>
//     </div>
//   );
// }
 
import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp, onSnapshot, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

export default function Crash() {
  const [point, setPoint] = useState(0);
  const [bet, setBet] = useState('');
  const [multiplier, setMultiplier] = useState(1.00);
  const [gameState, setGameState] = useState('idle');
  const [history, setHistory] = useState([1.23, 2.50, 1.10, 5.43, 1.05]); 
  const [difficulty, setDifficulty] = useState('normal'); 
  const [cooldown, setCooldown] = useState(0); // ⏱️ 15초 대기 시간 상태

  const navigate = useNavigate();
  const user = auth.currentUser;
  const { t } = useLanguage(); 
  
  const canvasRef = useRef(null);
  const reqRef = useRef(null);
  const crashPointRef = useRef(0);
  const startTimeRef = useRef(0);

  const MAX_BET = 100000000;
  const isAdmin = user?.email === "kks3172@naver.com";

  // 📡 실시간 전역 난이도 감시 (모든 유저 공통 적용)
  useEffect(() => { 
    if (!user) { navigate('/login'); return; } 
    fetchPoint();

    const unsubDiff = onSnapshot(doc(db, "settings", "crash"), (docSnap) => {
      if (docSnap.exists()) {
        const globalLevel = docSnap.data().level || 'normal';
        setDifficulty(globalLevel);
      }
    });

    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
      unsubDiff();
    };
  }, [user, navigate]);

  // ⏱️ 15초 카운트다운 로직
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const fetchPoint = async () => { 
    try { const d = await getDoc(doc(db, "users", user.uid)); if (d.exists()) setPoint(d.data().point || 0); } 
    catch (e) { console.error(e); } 
  };

  const changeDifficulty = async (level) => {
    if (!isAdmin) return;
    try {
      const settingsRef = doc(db, "settings", "crash");
      await setDoc(settingsRef, { level }, { merge: true });
    } catch (e) { console.error(e); }
  };

  const handleBetPercent = (percent) => { 
    if (percent === 0) { setBet(''); return; } 
    const amount = Math.floor(point * percent); 
    setBet(String(amount)); 
  };

  const startGame = async () => {
    if (cooldown > 0) return; // 15초 대기 중에는 시작 불가
    if (reqRef.current) cancelAnimationFrame(reqRef.current);
    const betMoney = parseInt(bet);
    if (isNaN(betMoney) || betMoney <= 0) return alert(t.alertInputBet);
    if (betMoney > Math.floor(point)) return alert(t.alertNoMoney);
    if (betMoney > MAX_BET) return alert(`최대 배팅 금액은 ${MAX_BET.toLocaleString()}P 입니다!`);

    try {
      await updateDoc(doc(db, "users", user.uid), { point: increment(-betMoney) });
      setPoint(prev => prev - betMoney);
      await addDoc(collection(db, "history"), { uid: user.uid, type: "게임", msg: "그래프 배팅", amount: -betMoney, createdAt: serverTimestamp() });
    } catch (e) { alert(t.alertError); return; }

    setGameState('playing');
    setMultiplier(1.00);
    
    const random = Math.random();
    let crash;

    // 🎰 전역 난이도에 따른 확률 연산
    if (difficulty === 'paradise') {
      if (random < 0.02) crash = 1.0 + Math.random() * 0.1;
      else if (random < 0.2) crash = 1.1 + Math.random() * 2.0;
      else if (random < 0.8) crash = 3.0 + Math.random() * 30.0;
      else crash = 30 + Math.random() * 500;
    } else if (difficulty === 'hard') {
      if (random < 0.3) crash = 1.0 + Math.random() * 0.2;
      else if (random < 0.7) crash = 1.2 + Math.random() * 1.5;
      else crash = 2.0 + Math.random() * 10.0;
    } else if (difficulty === 'hell') {
      if (random < 0.8) crash = 1.0 + Math.random() * 0.1;
      else crash = 1.1 + Math.random() * 1.0;
    } else { 
      if (random < 0.05) crash = 1.0 + Math.random() * 0.1;
      else if (random < 0.45) crash = 1.1 + Math.random() * 1.4;
      else if (random < 0.95) crash = 2.5 + Math.random() * 17.5;
      else crash = 20 + Math.random() * 180;
    }

    crashPointRef.current = Math.floor(crash * 100) / 100;
    startTimeRef.current = Date.now();
    drawGraph();
  };

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const currentMult = 1 + (elapsed * elapsed * 0.12) + (elapsed * 0.05);

    if (currentMult >= crashPointRef.current) {
      setMultiplier(crashPointRef.current);
      setGameState('crashed');
      setHistory(prev => [crashPointRef.current, ...prev].slice(0, 10));
      setCooldown(15); // ⏱️ 게임 종료 후 15초 쿨다운 시작
      if (navigator.vibrate) navigator.vibrate(500);
      return;
    }

    setMultiplier(currentMult);
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i=0; i<width; i+=50) { ctx.moveTo(i,0); ctx.lineTo(i,height); }
    for(let i=0; i<height; i+=50) { ctx.moveTo(0,i); ctx.lineTo(width,i); }
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 6;
    ctx.moveTo(0, height);
    const x = Math.min(width, elapsed * 45);
    const y = height - Math.min(height - 20, (currentMult - 1) * 40);
    ctx.quadraticCurveTo(x/2, height, x, y);
    ctx.stroke();
    ctx.font = "35px Arial";
    ctx.fillText("🚀", x - 20, y - 10);
    reqRef.current = requestAnimationFrame(drawGraph);
  };

  const cashOut = async () => {
    if (gameState !== 'playing') return;
    cancelAnimationFrame(reqRef.current);
    setGameState('cashed_out');
    setCooldown(15); // ⏱️ 익절 후에도 15초 대기
    const winMoney = Math.floor(parseInt(bet) * multiplier);
    setPoint(prev => prev + winMoney);
    await updateDoc(doc(db, "users", user.uid), { point: increment(winMoney) });
    await addDoc(collection(db, "history"), { uid: user.uid, type: "게임", msg: `그래프 익절 (${multiplier.toFixed(2)}배)`, amount: winMoney, createdAt: serverTimestamp() });
  };

  const getDiffLabel = (lv) => {
    const names = { paradise: "혜자", normal: "보통", hard: "어려움", hell: "수금" };
    return names[lv] || lv;
  };

  return (
    <div className="container" style={{ background: '#1e272e', minHeight: '100vh', color: 'white', textAlign: 'center', padding: '15px' }}>
      
      {/* 👑 관리자 패널 상단 배치 */}
      {isAdmin && (
        <div style={{ background: '#c0392b', padding: '12px', borderRadius: '10px', marginBottom: '15px', border: '2px solid #f1c40f' }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '13px' }}>👑 서버 난이도 설정 (현재: {getDiffLabel(difficulty)})</p>
          <div style={{ display: 'flex', gap: '5px' }}>
            {['paradise', 'normal', 'hard', 'hell'].map((lv) => (
              <button key={lv} onClick={() => changeDifficulty(lv)} style={{ flex: 1, padding: '10px 0', background: difficulty === lv ? '#fff' : 'rgba(0,0,0,0.3)', color: difficulty === lv ? '#000' : '#fff', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                {getDiffLabel(lv)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <h1 style={{ color: '#ffdd59', fontSize: '24px', letterSpacing: '2px', margin: 0, fontWeight: '900', display: 'inline-block' }}>🚀 CRASH GRAPH</h1>
        {/* ⚙️ 현재 난이도 작게 표시 */}
        <div style={{ fontSize: '10px', color: '#7f8c8d', marginTop: '4px' }}>SERVER MODE: <span style={{ color: '#f1c40f' }}>{getDiffLabel(difficulty)}</span></div>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '10px', background: '#2f3640', borderRadius: '12px', marginBottom: '15px', scrollbarWidth: 'none' }}>
        {history.map((h, i) => ( 
          <div key={i} style={{ background: h >= 2.0 ? '#2ecc71' : '#e74c3c', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', minWidth: '60px' }}> {h.toFixed(2)}x </div> 
        ))}
      </div>

      <div className="card" style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', marginBottom: '15px', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold', color: '#2ecc71', border: '1px solid #333' }}>
        {Math.floor(point).toLocaleString()} P
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: '450px', height: '320px', margin: '0 auto 20px', background: '#000', borderRadius: '15px', border: '3px solid #333', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '65px', fontWeight: '900', color: gameState === 'crashed' ? '#e74c3c' : (gameState === 'cashed_out' ? '#f1c40f' : 'white'), textShadow: '0 0 20px rgba(0,0,0,1)', zIndex: 5 }}> 
          {multiplier.toFixed(2)}x 
        </div>
        <canvas ref={canvasRef} width={450} height={320} style={{ width: '100%', height: '100%' }} />
      </div>

      <div className="card" style={{ background: '#2f3640', padding: '20px', borderRadius: '15px' }}>
        {gameState === 'playing' ? (
          <button className="btn" style={{ width: '100%', height: '80px', fontSize: '32px', background: 'linear-gradient(#fbc531, #f39c12)', color: 'black', fontWeight: '900', borderRadius: '15px', border: 'none', cursor: 'pointer', boxShadow: '0 6px #d35400' }} onClick={cashOut}> ✋ STOP! </button>
        ) : (
          <>
            <div style={{ marginBottom: '15px' }}>
                <input className="input" type="number" placeholder="배팅 금액 입력" value={bet} onChange={e => setBet(e.target.value)} style={{ width: '100%', textAlign: 'center', fontSize: '22px', padding: '12px', background: '#1e272e', border: '2px solid #555', color: 'white', borderRadius: '10px' }} />
            </div>
            <div style={{display:'flex', gap:8, marginBottom:20}}>
                { [0.1, 0.25, 0.5, 1].map(p => (
                  <button key={p} className="btn" style={{flex:1, padding:10, fontSize:13, background:'#34495e', color: p === 1 ? '#e74c3c' : 'white', fontWeight:'bold', borderRadius: 8 }} onClick={()=>handleBetPercent(p)}>{p === 1 ? 'ALL' : `${p*100}%`}</button>
                ))}
            </div>
            {/* ⏱️ 15초 대기 중일 때 버튼 비활성화 */}
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '18px', fontSize: '24px', background: cooldown > 0 ? '#555' : '#00a8ff', borderRadius: '10px', border: 'none', fontWeight: '900', boxShadow: cooldown > 0 ? 'none' : '0 6px #0097e6', cursor: cooldown > 0 ? 'not-allowed' : 'pointer' }} 
              onClick={startGame}
              disabled={cooldown > 0}
            > 
              {cooldown > 0 ? `잠시 후 가능 (${cooldown}s)` : (gameState === 'crashed' ? '다시 시작' : '게임 시작')} 
            </button>
          </>
        )}
      </div>
      <button className="btn" style={{ marginTop: 20, background: 'transparent', border: '1px solid #555', color: '#7f8c8d', width: '100%', padding: 12, borderRadius: 10, cursor: 'pointer' }} onClick={() => navigate('/home')}>BACK TO HOME</button>
    </div>
  );
}