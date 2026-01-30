// import React, { useState, useEffect } from 'react';
// import { db, auth } from '../firebase';
// // 👇 addDoc, collection, serverTimestamp 추가됨
// import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';

// export default function Mines() {
//   const [point, setPoint] = useState(0);
//   const [bet, setBet] = useState('');
//   const [mineCount, setMineCount] = useState(3); 
//   const [gameState, setGameState] = useState('idle'); 
//   const [grid, setGrid] = useState(Array(25).fill(null)); 
//   const [mines, setMines] = useState([]); 
//   const [revealedCount, setRevealedCount] = useState(0); 
//   const [currentMulti, setCurrentMulti] = useState(1.0); 

//   const navigate = useNavigate();
//   const user = auth.currentUser;

//   useEffect(() => { if (!user) { navigate('/login'); return; } fetchPoint(); }, [user, navigate]);
//   const fetchPoint = async () => { try { const d = await getDoc(doc(db, "users", user.uid)); if (d.exists()) setPoint(d.data().point || 0); } catch (e) { console.error(e); } };
//   const handleBetPercent = (percent) => { if (percent === 0) { setBet(''); return; } const amount = Math.floor(point * percent); setBet(String(amount)); };

//   const startGame = async () => {
//     const betMoney = parseInt(bet);
//     if (isNaN(betMoney) || betMoney <= 0) return alert("배팅 금액을 입력하세요!");
//     if (betMoney > Math.floor(point)) return alert("돈이 부족합니다!");

//     try {
//       await updateDoc(doc(db, "users", user.uid), { point: increment(-betMoney) });
//       setPoint(prev => prev - betMoney);

//       // ✅ [기록 추가] 베팅 로그
//       await addDoc(collection(db, "history"), {
//           uid: user.uid,
//           type: "게임",
//           msg: `지뢰찾기 베팅 (${mineCount}개)`,
//           amount: -betMoney,
//           createdAt: serverTimestamp()
//       });

//     } catch (e) {
//       alert("⚠️ 서버 할당량 초과!"); return;
//     }

//     const newMines = [];
//     while (newMines.length < mineCount) { const r = Math.floor(Math.random() * 25); if (!newMines.includes(r)) newMines.push(r); }
//     setMines(newMines); setGrid(Array(25).fill(null)); setRevealedCount(0); setCurrentMulti(1.0); setGameState('playing');
//   };

//   const clickTile = (index) => {
//     if (gameState !== 'playing') return;
//     if (grid[index] !== null) return; 
//     const newGrid = [...grid];
//     if (mines.includes(index)) {
//       newGrid[index] = '💣'; setGrid(newGrid); setGameState('exploded');
//       const finalGrid = newGrid.map((val, idx) => mines.includes(idx) ? '💣' : val); setGrid(finalGrid);
//       if (navigator.vibrate) navigator.vibrate(500); 
//     } else {
//       newGrid[index] = '💎'; setGrid(newGrid);
//       const newCount = revealedCount + 1; setRevealedCount(newCount);
//       const nextMulti = currentMulti * ( (25 - newCount + 1) / (25 - newCount + 1 - mineCount) );
//       setCurrentMulti(nextMulti);
//     }
//   };

//   const cashOut = async () => {
//     if (gameState !== 'playing') return;
//     if (revealedCount === 0) return alert("최소 1개는 찾아야 합니다!");

//     const winMoney = Math.floor(parseInt(bet) * currentMulti);
//     setPoint(prev => prev + winMoney);
//     await updateDoc(doc(db, "users", user.uid), { point: increment(winMoney) });
    
//     // ✅ [기록 추가] 익절 로그
//     await addDoc(collection(db, "history"), {
//         uid: user.uid,
//         type: "게임",
//         msg: `지뢰찾기 익절 (${currentMulti.toFixed(2)}배)`,
//         amount: winMoney,
//         createdAt: serverTimestamp()
//     });

//     setGameState('cashed_out');
//     const finalGrid = grid.map((val, idx) => mines.includes(idx) ? '💣' : val || '💎');
//     setGrid(finalGrid);
//   };

//   return (
//     // ... (기존 UI 유지) ...
//     <div className="container" style={{ background: '#2c3e50', minHeight: '100vh', color: 'white', textAlign: 'center', padding: '15px' }}>
//       <h1 style={{ color: '#f1c40f', fontSize: '24px' }}>💣 MINES (지뢰 찾기)</h1>
//       <div className="card" style={{ background: '#34495e', padding: '10px', marginBottom: '15px' }}>💰 {Math.floor(point).toLocaleString()}원</div>
//       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', padding: '0 10px' }}> <div style={{ fontSize: '18px', color: '#2ecc71' }}>💎 {revealedCount}개 찾음</div> <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#f1c40f' }}>x{currentMulti.toFixed(2)}배</div> </div>
//       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', width: '300px', margin: '0 auto 20px', padding: '10px', background: '#222', borderRadius: '10px' }}> {grid.map((val, i) => ( <div key={i} onClick={() => clickTile(i)} style={{ height: '50px', borderRadius: '5px', background: val === null ? '#95a5a6' : (val === '💎' ? '#2ecc71' : '#e74c3c'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', cursor: 'pointer', transition: 'transform 0.1s', transform: val ? 'scale(0.9)' : 'scale(1)', boxShadow: val === null ? '0 4px #7f8c8d' : 'none' }} > {val} </div> ))} </div>
//       <div className="card" style={{ background: '#34495e', padding: '15px' }}>
//         {gameState === 'playing' ? (
//           <button className="btn" style={{ width: '100%', height: '60px', fontSize: '24px', background: '#27ae60', fontWeight: 'bold', boxShadow: '0 5px #219150' }} onClick={cashOut}> 💰 {Math.floor(parseInt(bet || 0) * currentMulti).toLocaleString()}원 챙기기 </button>
//         ) : (
//           <>
//             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '15px' }}> <span>💣 지뢰 수:</span> <select className="input" style={{ width: '80px', marginBottom: 0 }} value={mineCount} onChange={e => setMineCount(Number(e.target.value))}> <option value="1">1개</option> <option value="3">3개</option> <option value="5">5개</option> <option value="10">10개</option> <option value="20">20개</option> </select> </div>
//             <input className="input" type="number" placeholder="배팅 금액" value={bet} onChange={e => setBet(e.target.value)} style={{ textAlign: 'center' }} />
//             <div style={{display:'flex', gap:5, marginBottom:15}}> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.1)}>10%</button> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.25)}>25%</button> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.5)}>50%</button> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#e74c3c', color:'white', fontWeight:'bold'}} onClick={()=>handleBetPercent(1)}>ALL</button> <button className="btn" style={{width:40, padding:5, fontSize:12, background:'#95a5a6'}} onClick={()=>handleBetPercent(0)}>🔄</button> </div>
//             <button className="btn btn-primary" style={{ width: '100%', padding: '15px', fontSize: '20px' }} onClick={startGame}> {gameState === 'exploded' ? '💥 다시 도전!' : (gameState === 'cashed_out' ? '💎 한 번 더?' : '게임 시작')} </button>
//           </>
//         )}
//       </div>
//       <button className="btn" style={{ marginTop: 20, background: '#444', width: '100%' }} onClick={() => navigate('/home')}>🏠 홈으로</button>
//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

export default function Mines() {
  const [point, setPoint] = useState(0);
  const [bet, setBet] = useState('');
  const [mineCount, setMineCount] = useState(3); 
  const [gameState, setGameState] = useState('idle'); 
  const [grid, setGrid] = useState(Array(25).fill(null)); 
  const [mines, setMines] = useState([]); 
  const [revealedCount, setRevealedCount] = useState(0); 
  const [currentMulti, setCurrentMulti] = useState(1.0); 

  const navigate = useNavigate();
  const user = auth.currentUser;
  const { t } = useLanguage();

  useEffect(() => { if (!user) { navigate('/login'); return; } fetchPoint(); }, [user, navigate]);
  const fetchPoint = async () => { try { const d = await getDoc(doc(db, "users", user.uid)); if (d.exists()) setPoint(d.data().point || 0); } catch (e) { console.error(e); } };
  const handleBetPercent = (percent) => { if (percent === 0) { setBet(''); return; } const amount = Math.floor(point * percent); setBet(String(amount)); };

  const startGame = async () => {
    const betMoney = parseInt(bet);
    if (isNaN(betMoney) || betMoney <= 0) return alert(t.alertInputBet);
    if (betMoney > Math.floor(point)) return alert(t.alertNoMoney);

    try {
      await updateDoc(doc(db, "users", user.uid), { point: increment(-betMoney) });
      setPoint(prev => prev - betMoney);
      await addDoc(collection(db, "history"), { uid: user.uid, type: "게임", msg: `지뢰찾기 배팅`, amount: -betMoney, createdAt: serverTimestamp() });
    } catch (e) { return alert(t.alertError); }

    const newMines = [];
    while (newMines.length < mineCount) { const r = Math.floor(Math.random() * 25); if (!newMines.includes(r)) newMines.push(r); }
    setMines(newMines); setGrid(Array(25).fill(null)); setRevealedCount(0); setCurrentMulti(1.0); setGameState('playing');
  };

  const clickTile = (index) => {
    if (gameState !== 'playing') return;
    if (grid[index] !== null) return; 
    const newGrid = [...grid];
    if (mines.includes(index)) {
      newGrid[index] = '💣'; setGrid(newGrid); setGameState('exploded');
      const finalGrid = newGrid.map((val, idx) => mines.includes(idx) ? '💣' : val); setGrid(finalGrid);
      if (navigator.vibrate) navigator.vibrate(500); 
    } else {
      newGrid[index] = '💎'; setGrid(newGrid);
      const newCount = revealedCount + 1; setRevealedCount(newCount);
      const nextMulti = currentMulti * ( (25 - newCount + 1) / (25 - newCount + 1 - mineCount) );
      setCurrentMulti(nextMulti);
    }
  };

  const cashOut = async () => {
    if (gameState !== 'playing') return;
    if (revealedCount === 0) return alert("Min 1 jewel required!");

    const winMoney = Math.floor(parseInt(bet) * currentMulti);
    setPoint(prev => prev + winMoney);
    await updateDoc(doc(db, "users", user.uid), { point: increment(winMoney) });
    await addDoc(collection(db, "history"), { uid: user.uid, type: "게임", msg: `지뢰찾기 익절`, amount: winMoney, createdAt: serverTimestamp() });

    setGameState('cashed_out');
    const finalGrid = grid.map((val, idx) => mines.includes(idx) ? '💣' : val || '💎');
    setGrid(finalGrid);
  };

  return (
    <div className="container" style={{ background: '#2c3e50', minHeight: '100vh', color: 'white', textAlign: 'center', padding: '15px' }}>
      <h1 style={{ color: '#f1c40f', fontSize: '24px' }}>{t.mnTitle}</h1>
      <div className="card" style={{ background: '#34495e', padding: '10px', marginBottom: '15px' }}>{t.balance}: {Math.floor(point).toLocaleString()}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', padding: '0 10px' }}> <div style={{ fontSize: '18px', color: '#2ecc71' }}>💎 {revealedCount}{t.mn_found}</div> <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#f1c40f' }}>x{currentMulti.toFixed(2)}</div> </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', width: '300px', margin: '0 auto 20px', padding: '10px', background: '#222', borderRadius: '10px' }}> {grid.map((val, i) => ( <div key={i} onClick={() => clickTile(i)} style={{ height: '50px', borderRadius: '5px', background: val === null ? '#95a5a6' : (val === '💎' ? '#2ecc71' : '#e74c3c'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', cursor: 'pointer', transition: 'transform 0.1s', transform: val ? 'scale(0.9)' : 'scale(1)', boxShadow: val === null ? '0 4px #7f8c8d' : 'none' }} > {val} </div> ))} </div>
      <div className="card" style={{ background: '#34495e', padding: '15px' }}>
        {gameState === 'playing' ? (
          <button className="btn" style={{ width: '100%', height: '60px', fontSize: '24px', background: '#27ae60', fontWeight: 'bold', boxShadow: '0 5px #219150' }} onClick={cashOut}> 💰 {Math.floor(parseInt(bet || 0) * currentMulti).toLocaleString()}{t.mn_cashout} </button>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '15px' }}> <span>💣 {t.mn_mines}:</span> <select className="input" style={{ width: '80px', marginBottom: 0 }} value={mineCount} onChange={e => setMineCount(Number(e.target.value))}> <option value="1">1{t.mn_count}</option> <option value="3">3{t.mn_count}</option> <option value="5">5{t.mn_count}</option> <option value="10">10{t.mn_count}</option> <option value="20">20{t.mn_count}</option> </select> </div>
            <input className="input" type="number" placeholder={t.inputBet} value={bet} onChange={e => setBet(e.target.value)} style={{ textAlign: 'center' }} />
            <div style={{display:'flex', gap:5, marginBottom:15}}> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.1)}>10%</button> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.25)}>25%</button> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.5)}>50%</button> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#e74c3c', color:'white', fontWeight:'bold'}} onClick={()=>handleBetPercent(1)}>ALL</button> <button className="btn" style={{width:40, padding:5, fontSize:12, background:'#95a5a6'}} onClick={()=>handleBetPercent(0)}>🔄</button> </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '15px', fontSize: '20px' }} onClick={startGame}> {gameState === 'exploded' ? t.mn_retry : (gameState === 'cashed_out' ? t.mn_oneMore : t.gameStart)} </button>
          </>
        )}
      </div>
      <button className="btn" style={{ marginTop: 20, background: '#444', width: '100%' }} onClick={() => navigate('/home')}>{t.home}</button>
    </div>
  );
}