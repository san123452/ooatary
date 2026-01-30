// import React, { useState, useEffect, useRef } from 'react';
// import { db, auth } from '../firebase';
// // 👇 addDoc, collection, serverTimestamp 추가됨
// import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';

// export default function RPS() {
//   const [point, setPoint] = useState(0);
//   const [bet, setBet] = useState('');
//   const [gameState, setGameState] = useState('idle'); 
//   const [myHand, setMyHand] = useState(null); 
//   const [comHand, setComHand] = useState(null);
//   const [resultMessage, setResultMessage] = useState('');
//   const [winAmount, setWinAmount] = useState(0);

//   const navigate = useNavigate();
//   const user = auth.currentUser;
//   const intervalRef = useRef(null);
//   const hands = ['✌️', '✊', '✋']; 

//   useEffect(() => { if (!user) { navigate('/login'); return; } fetchPoint(); return () => clearInterval(intervalRef.current); }, [user, navigate]);
//   const fetchPoint = async () => { try { const d = await getDoc(doc(db, "users", user.uid)); if (d.exists()) setPoint(d.data().point || 0); } catch (e) { console.error("포인트 로드 실패", e); } };
//   const handleBetPercent = (percent) => { if (percent === 0) { setBet(''); return; } const amount = Math.floor(point * percent); setBet(String(amount)); };

//   const startGame = async (choice) => {
//     const betMoney = parseInt(bet);
//     if (isNaN(betMoney) || betMoney <= 0) return alert("배팅 금액을 입력하세요!");
//     if (betMoney > Math.floor(point)) return alert("돈이 부족합니다!");

//     setGameState('shuffling');
//     setMyHand(choice);
//     setResultMessage('상대방이 고민 중입니다...');
//     setPoint(prev => prev - betMoney);

//     intervalRef.current = setInterval(() => { setComHand(Math.floor(Math.random() * 3)); }, 100);
//     setTimeout(() => { clearInterval(intervalRef.current); finalizeGame(choice, betMoney); }, 2000);
//   };

//   const finalizeGame = async (myChoice, betMoney) => {
//     const finalComChoice = Math.floor(Math.random() * 3);
//     setComHand(finalComChoice);
//     let finalPointChange = -betMoney; 
    
//     if (myChoice === finalComChoice) {
//       finalPointChange = 0; 
//       setPoint(prev => prev + betMoney); 
//       setResultMessage("😐 비겼습니다! (본전)");
//     } else if (
//       (myChoice === 0 && finalComChoice === 2) || (myChoice === 1 && finalComChoice === 0) || (myChoice === 2 && finalComChoice === 1)
//     ) {
//       const payout = Math.floor(betMoney * 1.97); 
//       finalPointChange = payout - betMoney; 
//       setPoint(prev => prev + payout); 
//       setWinAmount(payout);
//       setResultMessage(`🎉 승리! (+${payout.toLocaleString()}원)`);
//     } else {
//       setResultMessage("😭 졌습니다... (꽝)");
//     }

//     setGameState('result');

//     try {
//       if (finalPointChange !== 0) {
//         await updateDoc(doc(db, "users", user.uid), { point: increment(finalPointChange) });
//       }

//       // ✅ [기록 추가] 승패 로그 저장 (순수익이 0보다 크면 승리, 아니면 패배)
//       if (finalPointChange > 0) {
//           await addDoc(collection(db, "history"), {
//               uid: user.uid,
//               type: "게임",
//               msg: "가위바위보 승리",
//               amount: finalPointChange + betMoney, // 총 당첨금
//               createdAt: serverTimestamp()
//           });
//       } else if (finalPointChange < 0) {
//           await addDoc(collection(db, "history"), {
//               uid: user.uid,
//               type: "게임",
//               msg: "가위바위보 패배",
//               amount: -betMoney,
//               createdAt: serverTimestamp()
//           });
//       }

//     } catch (e) { console.error("저장 실패", e); }
//   };

//   const resetGame = () => { setGameState('idle'); setMyHand(null); setComHand(null); setBet(''); };

//   return (
//     // ... (UI 코드는 기존과 동일) ...
//     <div className="container" style={{ textAlign: 'center', paddingTop: 30, background: '#2c3e50', minHeight: '100vh', color: 'white', display:'flex', flexDirection:'column', alignItems:'center' }}>
//       <h1 className="title" style={{ color: '#f1c40f', marginBottom: 10 }}>✌️ 가위바위보 (x1.97)</h1>
//       <div className="card" style={{ background: '#34495e', padding: '15px', width: '90%', maxWidth: '400px', marginBottom: '20px' }}> <div style={{ fontSize: 16, color: '#bdc3c7' }}>내 보유 자산</div> <div style={{ fontSize: 28, fontWeight: 'bold', color: '#f1c40f' }}>{Math.floor(point).toLocaleString()}원</div> </div>
//       <div className="card" style={{ background: '#ecf0f1', color: '#2c3e50', width: '90%', maxWidth: '400px', height: '250px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
//         {gameState === 'idle' && ( <div style={{fontSize: '18px', color: '#7f8c8d'}}> 배팅 금액을 걸고<br/>가위/바위/보를 선택하세요! </div> )}
//         {(gameState === 'shuffling' || gameState === 'result') && ( <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', alignItems: 'center' }}> <div style={{ textAlign: 'center' }}> <div style={{ fontSize: '14px', marginBottom: 5, fontWeight: 'bold' }}>ME</div> <div style={{ fontSize: '60px', transition: '0.2s' }}>{hands[myHand]}</div> </div> <div style={{ fontSize: '30px', fontWeight: 'bold', color: '#e74c3c' }}>VS</div> <div style={{ textAlign: 'center' }}> <div style={{ fontSize: '14px', marginBottom: 5, fontWeight: 'bold' }}>COM</div> <div style={{ fontSize: '60px', transform: gameState === 'shuffling' ? 'scale(1.1)' : 'scale(1)' }}> {comHand !== null ? hands[comHand] : '❓'} </div> </div> </div> )}
//         {gameState === 'result' && ( <div style={{ marginTop: 20, padding: '10px', background: resultMessage.includes('승리') ? '#2ecc71' : (resultMessage.includes('비겼') ? '#f39c12' : '#e74c3c'), color: 'white', fontWeight: 'bold', borderRadius: 5, width: '80%' }}> {resultMessage} </div> )}
//       </div>
//       <div style={{ width: '90%', maxWidth: '400px', pointerEvents: gameState === 'shuffling' ? 'none' : 'auto', opacity: gameState === 'shuffling' ? 0.6 : 1 }}>
//         <input className="input" type="number" placeholder="배팅액" value={bet} onChange={e => setBet(e.target.value)} style={{ textAlign: 'center', fontSize: 20, width: '100%', marginBottom: '10px', padding: '15px' }} />
//         <div style={{display:'flex', gap:5, marginBottom:20}}> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.1)}>10%</button> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.25)}>25%</button> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.5)}>50%</button> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#e74c3c', color:'white', fontWeight:'bold'}} onClick={()=>handleBetPercent(1)}>ALL</button> <button className="btn" style={{width:40, padding:5, fontSize:12, background:'#95a5a6'}} onClick={()=>handleBetPercent(0)}>🔄</button> </div>
//         {gameState !== 'result' && ( <div className="flex-row" style={{ gap: 10 }}> <button className="btn" style={{ flex: 1, fontSize: 35, background: '#f1c40f', padding: '15px 0' }} onClick={() => startGame(0)}>✌️</button> <button className="btn" style={{ flex: 1, fontSize: 35, background: '#e74c3c', padding: '15px 0' }} onClick={() => startGame(1)}>✊</button> <button className="btn" style={{ flex: 1, fontSize: 35, background: '#3498db', padding: '15px 0' }} onClick={() => startGame(2)}>✋</button> </div> )}
//         {gameState === 'result' && ( <button className="btn" style={{ width: '100%', padding: '15px', fontSize: '18px', background: '#8e44ad' }} onClick={resetGame}> 🔄 다시 하기 </button> )}
//       </div>
//       <button className="btn" style={{ marginTop: 30, background: '#333', width: '90%', maxWidth: '400px', padding: '15px' }} onClick={() => navigate('/home')}> 🏠 홈으로 </button>
//     </div>
//   );
// }
import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext'; // 👈

export default function RPS() {
  const [point, setPoint] = useState(0);
  const [bet, setBet] = useState('');
  const [gameState, setGameState] = useState('idle'); 
  const [myHand, setMyHand] = useState(null); 
  const [comHand, setComHand] = useState(null);
  const [resultMessage, setResultMessage] = useState('');
  
  const navigate = useNavigate();
  const user = auth.currentUser;
  const intervalRef = useRef(null);
  const hands = ['✌️', '✊', '✋']; 
  const { t } = useLanguage(); // 👈

  useEffect(() => { if (!user) { navigate('/login'); return; } fetchPoint(); return () => clearInterval(intervalRef.current); }, [user, navigate]);
  const fetchPoint = async () => { try { const d = await getDoc(doc(db, "users", user.uid)); if (d.exists()) setPoint(d.data().point || 0); } catch (e) {} };
  const handleBetPercent = (percent) => { if (percent === 0) { setBet(''); return; } const amount = Math.floor(point * percent); setBet(String(amount)); };

  const startGame = async (choice) => {
    const betMoney = parseInt(bet);
    if (isNaN(betMoney) || betMoney <= 0) return alert(t.alertInputBet);
    if (betMoney > Math.floor(point)) return alert(t.alertNoMoney);

    setGameState('shuffling');
    setMyHand(choice);
    setResultMessage('...');
    setPoint(prev => prev - betMoney);

    intervalRef.current = setInterval(() => { setComHand(Math.floor(Math.random() * 3)); }, 100);
    setTimeout(() => { clearInterval(intervalRef.current); finalizeGame(choice, betMoney); }, 2000);
  };

  const finalizeGame = async (myChoice, betMoney) => {
    const finalComChoice = Math.floor(Math.random() * 3);
    setComHand(finalComChoice);
    let finalPointChange = -betMoney; 
    
    if (myChoice === finalComChoice) {
      finalPointChange = 0; 
      setPoint(prev => prev + betMoney); 
      setResultMessage(t.draw);
    } else if (
      (myChoice === 0 && finalComChoice === 2) || (myChoice === 1 && finalComChoice === 0) || (myChoice === 2 && finalComChoice === 1)
    ) {
      const payout = Math.floor(betMoney * 1.97); 
      finalPointChange = payout - betMoney; 
      setPoint(prev => prev + payout); 
      setResultMessage(`${t.win} (+${payout.toLocaleString()})`);
    } else {
      setResultMessage(t.lose);
    }

    setGameState('result');

    try {
      if (finalPointChange !== 0) {
        await updateDoc(doc(db, "users", user.uid), { point: increment(finalPointChange) });
      }
      if (finalPointChange > 0) {
          await addDoc(collection(db, "history"), { uid: user.uid, type: "게임", msg: "RPS WIN", amount: finalPointChange + betMoney, createdAt: serverTimestamp() });
      }
    } catch (e) {}
  };

  const resetGame = () => { setGameState('idle'); setMyHand(null); setComHand(null); setBet(''); };

  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: 30, background: '#2c3e50', minHeight: '100vh', color: 'white', display:'flex', flexDirection:'column', alignItems:'center' }}>
      <h1 className="title" style={{ color: '#f1c40f', marginBottom: 10 }}>{t.rps} (x1.97)</h1>
      <div className="card" style={{ background: '#34495e', padding: '15px', width: '90%', maxWidth: '400px', marginBottom: '20px' }}> <div style={{ fontSize: 16, color: '#bdc3c7' }}>{t.balance}</div> <div style={{ fontSize: 28, fontWeight: 'bold', color: '#f1c40f' }}>{Math.floor(point).toLocaleString()}</div> </div>
      <div className="card" style={{ background: '#ecf0f1', color: '#2c3e50', width: '90%', maxWidth: '400px', height: '250px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        {gameState === 'idle' && ( <div style={{fontSize: '18px', color: '#7f8c8d'}}>{t.inputBet}...</div> )}
        {(gameState === 'shuffling' || gameState === 'result') && ( <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', alignItems: 'center' }}> <div style={{ textAlign: 'center' }}> <div style={{ fontSize: '14px', marginBottom: 5, fontWeight: 'bold' }}>ME</div> <div style={{ fontSize: '60px', transition: '0.2s' }}>{hands[myHand]}</div> </div> <div style={{ fontSize: '30px', fontWeight: 'bold', color: '#e74c3c' }}>VS</div> <div style={{ textAlign: 'center' }}> <div style={{ fontSize: '14px', marginBottom: 5, fontWeight: 'bold' }}>COM</div> <div style={{ fontSize: '60px', transform: gameState === 'shuffling' ? 'scale(1.1)' : 'scale(1)' }}> {comHand !== null ? hands[comHand] : '❓'} </div> </div> </div> )}
        {gameState === 'result' && ( <div style={{ marginTop: 20, padding: '10px', background: '#333', color: 'white', fontWeight: 'bold', borderRadius: 5, width: '80%' }}> {resultMessage} </div> )}
      </div>
      <div style={{ width: '90%', maxWidth: '400px', pointerEvents: gameState === 'shuffling' ? 'none' : 'auto', opacity: gameState === 'shuffling' ? 0.6 : 1 }}>
        <input className="input" type="number" placeholder={t.inputBet} value={bet} onChange={e => setBet(e.target.value)} style={{ textAlign: 'center', fontSize: 20, width: '100%', marginBottom: '10px', padding: '15px' }} />
        <div style={{display:'flex', gap:5, marginBottom:20}}> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.1)}>10%</button> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.25)}>25%</button> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.5)}>50%</button> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#e74c3c', color:'white', fontWeight:'bold'}} onClick={()=>handleBetPercent(1)}>ALL</button> <button className="btn" style={{width:40, padding:5, fontSize:12, background:'#95a5a6'}} onClick={()=>handleBetPercent(0)}>🔄</button> </div>
        {gameState !== 'result' && ( <div className="flex-row" style={{ gap: 10 }}> <button className="btn" style={{ flex: 1, fontSize: 35, background: '#f1c40f', padding: '15px 0' }} onClick={() => startGame(0)}>✌️</button> <button className="btn" style={{ flex: 1, fontSize: 35, background: '#e74c3c', padding: '15px 0' }} onClick={() => startGame(1)}>✊</button> <button className="btn" style={{ flex: 1, fontSize: 35, background: '#3498db', padding: '15px 0' }} onClick={() => startGame(2)}>✋</button> </div> )}
        {gameState === 'result' && ( <button className="btn" style={{ width: '100%', padding: '15px', fontSize: '18px', background: '#8e44ad' }} onClick={resetGame}> {t.restart} </button> )}
      </div>
      <button className="btn" style={{ marginTop: 30, background: '#333', width: '90%', maxWidth: '400px', padding: '15px' }} onClick={() => navigate('/home')}> {t.home} </button>
    </div>
  );
}