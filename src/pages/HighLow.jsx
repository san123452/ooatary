// import React, { useState, useEffect } from 'react';
// import { db, auth } from '../firebase';
// // 👇 addDoc, collection, serverTimestamp 추가됨
// import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';

// const styles = ` .card-flip { transition: transform 0.6s; transform-style: preserve-3d; } .card-flip.flipped { transform: rotateY(180deg); } .card-face { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 10px; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: 0 4px 8px rgba(0,0,0,0.3); border: 1px solid #ccc; } .card-back { background: linear-gradient(45deg, #2c3e50, #000); color: white; transform: rotateY(180deg); font-size: 24px; } .card-front { background: white; } `;

// export default function HighLow() {
//   const [point, setPoint] = useState(0);
//   const [bet, setBet] = useState('');
//   const [gameState, setGameState] = useState('idle');
//   const [currentCard, setCurrentCard] = useState(null);
//   const [nextCard, setNextCard] = useState(null);
//   const [history, setHistory] = useState([]);
//   const [streak, setStreak] = useState(0);
//   const [currentMultiplier, setCurrentMultiplier] = useState(1.00);
//   const [showGuide, setShowGuide] = useState(false);
//   const [isFlipping, setIsFlipping] = useState(false);
//   const [message, setMessage] = useState("예측을 시작하세요!");
//   const navigate = useNavigate();
//   const user = auth.currentUser;
//   const suits = ['♠', '♥', '♣', '♦'];
//   const values = [ { v: 1, l: 'A' }, { v: 2, l: '2' }, { v: 3, l: '3' }, { v: 4, l: '4' }, { v: 5, l: '5' }, { v: 6, l: '6' }, { v: 7, l: '7' }, { v: 8, l: '8' }, { v: 9, l: '9' }, { v: 10, l: '10' }, { v: 11, l: 'J' }, { v: 12, l: 'Q' }, { v: 13, l: 'K' } ];

//   useEffect(() => { if (!user) { navigate('/login'); return; } fetchPoint(); }, [user, navigate]);
//   const fetchPoint = async () => { try { const d = await getDoc(doc(db, "users", user.uid)); if (d.exists()) setPoint(d.data().point || 0); } catch (e) {} };
//   const handleBetPercent = (percent) => { if (percent === 0) { setBet(''); return; } const amount = Math.floor(point * percent); setBet(String(amount)); };
//   const drawCard = () => { const suit = suits[Math.floor(Math.random() * 4)]; const valueObj = values[Math.floor(Math.random() * 13)]; return { ...valueObj, suit }; };

//   const startGame = async () => {
//     const betMoney = parseInt(bet);
//     if (isNaN(betMoney) || betMoney <= 0) return alert("배팅금을 입력하세요!");
//     if (betMoney > Math.floor(point)) return alert("돈이 부족합니다!");

//     try {
//       await updateDoc(doc(db, "users", user.uid), { point: increment(-betMoney) });
//       setPoint(prev => prev - betMoney);

//       // ✅ [기록 추가] 베팅 로그
//       await addDoc(collection(db, "history"), {
//           uid: user.uid,
//           type: "게임",
//           msg: "하이로우 베팅",
//           amount: -betMoney,
//           createdAt: serverTimestamp()
//       });

//     } catch (e) { return alert("오류 발생"); }

//     const firstCard = drawCard();
//     setCurrentCard(firstCard); setNextCard(null); setHistory([]); setStreak(0); setCurrentMultiplier(1.00); setGameState('playing'); setMessage("다음 카드는? (High / Low)"); setIsFlipping(false);
//   };

//   // ... (getOdds, guess 함수들 그대로 유지) ...
//   const getOdds = (direction) => { if (!currentCard) return { multi: 0, prob: 0 }; const v = currentCard.v; let chance = 0; if (direction === 'high') chance = (13 - v) / 13; else chance = (v - 1) / 13; if (chance <= 0) return { multi: 0, prob: 0 }; const prob = (chance * 100).toFixed(1); const multi = (0.98 / chance).toFixed(2); return { multi, prob }; };
//   const guess = async (direction) => { if (gameState !== 'playing' || isFlipping) return; setIsFlipping(true); setMessage("과연...?"); const newCard = drawCard(); setNextCard(newCard); setTimeout(() => { const prevVal = currentCard.v; const nextVal = newCard.v; let isWin = false; if (direction === 'high' && nextVal > prevVal) isWin = true; if (direction === 'low' && nextVal < prevVal) isWin = true; if (isWin) { const odds = getOdds(direction); const newMulti = (currentMultiplier * parseFloat(odds.multi)); setCurrentMultiplier(newMulti); setStreak(prev => prev + 1); setMessage(`🎉 성공! [${newCard.l}${newCard.suit}]가 나왔습니다!`); setHistory(prev => [currentCard, ...prev].slice(0, 5)); setCurrentCard(newCard); setNextCard(null); setIsFlipping(false); } else { setMessage(`💀 땡! [${newCard.l}${newCard.suit}]... 패배했습니다.`); setGameState('gameover'); setCurrentCard(newCard); setNextCard(null); if (navigator.vibrate) navigator.vibrate(200); setIsFlipping(false); } }, 800); };

//   const cashOut = async () => {
//     if (gameState !== 'playing') return;
    
//     const winMoney = Math.floor(parseInt(bet) * currentMultiplier);
//     setPoint(prev => prev + winMoney);
//     await updateDoc(doc(db, "users", user.uid), { point: increment(winMoney) });
    
//     // ✅ [기록 추가] 익절 로그
//     await addDoc(collection(db, "history"), {
//         uid: user.uid,
//         type: "게임",
//         msg: `하이로우 익절 (${currentMultiplier.toFixed(2)}배)`,
//         amount: winMoney,
//         createdAt: serverTimestamp()
//     });

//     setGameState('idle');
//     alert(`💰 익절 성공! ${currentMultiplier.toFixed(2)}배\n(+${winMoney.toLocaleString()}원)`);
//   };

//   const CardView = ({ card, big = false, flipped = false }) => { const isRed = card && (card.suit === '♥' || card.suit === '♦'); return ( <div style={{ width: big ? 100 : 50, height: big ? 150 : 75, position: 'relative', perspective: '1000px' }}> <div className={`card-flip ${flipped ? 'flipped' : ''}`} style={{ width: '100%', height: '100%', position: 'relative' }}> <div className="card-face card-front" style={{ color: isRed ? '#e74c3c' : '#2c3e50', fontWeight: 'bold', fontSize: big ? 30 : 18 }}> {card && ( <> <div style={{ position: 'absolute', top: 5, left: 5, fontSize: big ? 16 : 12 }}>{card.l}</div> <div>{card.suit}</div> <div style={{ position: 'absolute', bottom: 5, right: 5, fontSize: big ? 16 : 12, transform: 'rotate(180deg)' }}>{card.l}</div> </> )} </div> <div className="card-face card-back"> 지예아~ </div> </div> </div> ); };
//   const highOdds = currentCard ? getOdds('high') : { multi: 0, prob: 0 };
//   const lowOdds = currentCard ? getOdds('low') : { multi: 0, prob: 0 };

//   return (
//     // ... (기존 UI 유지) ...
//     <div className="container" style={{ background: '#0f1923', minHeight: '100vh', color: 'white', textAlign: 'center', padding: '15px' }}>
//       <style>{styles}</style>
//       <div style={{ position: 'relative', marginBottom: '10px' }}>
//         <h1 style={{ color: '#ecf0f1', fontSize: '24px', letterSpacing: '2px', display: 'inline-block' }}>🃏 HIGH-LOW</h1>
//         <button onClick={() => setShowGuide(true)} style={{ position: 'absolute', right: 0, top: 0, background: 'none', border: '2px solid #7f8c8d', color: '#7f8c8d', borderRadius: '50%', width: '30px', height: '30px', fontWeight: 'bold', cursor: 'pointer' }}> ? </button>
//       </div>
//       {showGuide && ( <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}> <div style={{ background: '#2c3e50', padding: '20px', borderRadius: '15px', maxWidth: '350px', border: '1px solid #00d2d3' }}> <h2 style={{ color: '#00d2d3', marginTop: 0 }}>📜 게임 규칙</h2> <ul style={{ textAlign: 'left', lineHeight: '1.6', fontSize: '14px', color: '#ddd', paddingLeft: '20px' }}> <li>다음 카드가 <strong>High(높음) / Low(낮음)</strong> 인지 예측하세요.</li> <li><strong>순서:</strong> A(1) &lt; 2 ... &lt; K(13)</li> <li>맞출수록 배당이 <strong>곱하기(x)</strong> 됩니다.</li> <li><strong>[돈 챙기기]</strong>를 해야 내 돈이 됩니다.</li> </ul> <button className="btn" style={{ width: '100%', background: '#00d2d3', color: 'black', marginTop: '15px' }} onClick={() => setShowGuide(false)}>닫기</button> </div> </div> )}
//       <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#1e272e', borderRadius: '8px', marginBottom: '20px' }}>
//         <div> <div style={{ fontSize: '12px', color: '#95a5a6' }}>현재 배당</div> <div style={{ fontSize: '20px', color: '#2ecc71', fontWeight: 'bold' }}>x{currentMultiplier.toFixed(2)}</div> </div>
//         <div> <div style={{ fontSize: '12px', color: '#95a5a6' }}>현재 수익</div> <div style={{ fontSize: '20px', color: '#f1c40f', fontWeight: 'bold' }}> {gameState === 'playing' ? Math.floor(parseInt(bet) * currentMultiplier).toLocaleString() : 0} </div> </div>
//       </div>
//       <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
//         <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', opacity: 0.6 }}> {history.map((c, i) => <CardView key={i} card={c} />)} </div>
//         <div style={{ position: 'relative', width: 100, height: 150 }}>
//             <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 10, transition: 'all 0.5s', transform: isFlipping ? 'translateX(-60px) scale(0.9)' : 'translateX(0) scale(1.2)' }}> {gameState === 'idle' ? <div style={{width:100, height:150, border:'2px dashed #555', borderRadius:10}}></div> : <CardView card={currentCard} big />} </div>
//             {isFlipping && ( <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 20, animation: 'slideIn 0.5s forwards' }}> <CardView card={nextCard} big flipped={true} /> </div> )}
//         </div>
//         <div style={{ marginTop: '30px', fontSize: '18px', fontWeight: 'bold', color: '#f1c40f', minHeight: '30px' }}> {message} </div>
//       </div>
//       <div className="card" style={{ background: '#2c3e50', padding: '15px' }}>
//         {gameState === 'playing' ? (
//           <div style={{ display: 'flex', gap: '10px' }}>
//             <button className="btn" onClick={() => guess('low')} disabled={lowOdds.prob <= 0 || isFlipping} style={{ flex: 1, background: '#34495e', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px', opacity: lowOdds.prob <= 0 ? 0.3 : 1 }}> <span style={{ fontSize: '20px' }}>⬇️ LOW</span> <span style={{ fontSize: '12px', color: '#bdc3c7' }}>{lowOdds.prob}%</span> <span style={{ fontSize: '16px', color: '#2ecc71' }}>x{lowOdds.multi}</span> </button>
//             <button className="btn" onClick={() => guess('high')} disabled={highOdds.prob <= 0 || isFlipping} style={{ flex: 1, background: '#34495e', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px', opacity: highOdds.prob <= 0 ? 0.3 : 1 }}> <span style={{ fontSize: '20px' }}>⬆️ HIGH</span> <span style={{ fontSize: '12px', color: '#bdc3c7' }}>{highOdds.prob}%</span> <span style={{ fontSize: '16px', color: '#2ecc71' }}>x{highOdds.multi}</span> </button>
//           </div>
//         ) : (
//           <>
//             <input className="input" type="number" placeholder="배팅 금액" value={bet} onChange={e => setBet(e.target.value)} style={{ textAlign: 'center', fontSize: '18px', background: '#1e272e', color: 'white' }} />
//             <div style={{display:'flex', gap:5, marginBottom:15}}>
//                 <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.1)}>10%</button>
//                 <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.25)}>25%</button>
//                 <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.5)}>50%</button>
//                 <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#e74c3c', color:'white', fontWeight:'bold'}} onClick={()=>handleBetPercent(1)}>ALL</button>
//                 <button className="btn" style={{width:40, padding:5, fontSize:12, background:'#95a5a6'}} onClick={()=>handleBetPercent(0)}>🔄</button>
//             </div>
//             <button className="btn btn-primary" style={{ width: '100%', padding: '15px', fontSize: '20px' }} onClick={startGame}> {gameState === 'gameover' ? '다시 시작' : '게임 시작'} </button>
//           </>
//         )}
//         {gameState === 'playing' && streak > 0 && (
//             <button className="btn" disabled={isFlipping} style={{ width: '100%', marginTop: '15px', background: '#f1c40f', color: 'black', fontWeight: 'bold', padding: '15px' }} onClick={cashOut}> 💰 {Math.floor(parseInt(bet) * currentMultiplier).toLocaleString()}원 챙기기 </button>
//         )}
//       </div>
//       <button className="btn" style={{ marginTop: 20, background: '#444', width: '100%' }} onClick={() => navigate('/home')}>🏠 홈으로</button>
//       <style>{` @keyframes slideIn { 0% { transform: translateX(50px) scale(0.8); opacity: 0; } 100% { transform: translateX(0) scale(1.2); opacity: 1; } } `}</style>
//     </div>
//   );
// }



import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

const styles = ` .card-flip { transition: transform 0.6s; transform-style: preserve-3d; } .card-flip.flipped { transform: rotateY(180deg); } .card-face { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 10px; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: 0 4px 8px rgba(0,0,0,0.3); border: 1px solid #ccc; } .card-back { background: linear-gradient(45deg, #2c3e50, #000); color: white; transform: rotateY(180deg); font-size: 24px; } .card-front { background: white; } `;

export default function HighLow() {
  const [point, setPoint] = useState(0);
  const [bet, setBet] = useState('');
  const [gameState, setGameState] = useState('idle');
  const [currentCard, setCurrentCard] = useState(null);
  const [nextCard, setNextCard] = useState(null);
  const [history, setHistory] = useState([]);
  const [streak, setStreak] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.00);
  const [showGuide, setShowGuide] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [message, setMessage] = useState("");
  
  const navigate = useNavigate();
  const user = auth.currentUser;
  const { t } = useLanguage();
  const suits = ['♠', '♥', '♣', '♦'];
  const values = [ { v: 1, l: 'A' }, { v: 2, l: '2' }, { v: 3, l: '3' }, { v: 4, l: '4' }, { v: 5, l: '5' }, { v: 6, l: '6' }, { v: 7, l: '7' }, { v: 8, l: '8' }, { v: 9, l: '9' }, { v: 10, l: '10' }, { v: 11, l: 'J' }, { v: 12, l: 'Q' }, { v: 13, l: 'K' } ];

  useEffect(() => { if (!user) { navigate('/login'); return; } fetchPoint(); setMessage(t.inputBet); }, [user, navigate]);
  const fetchPoint = async () => { try { const d = await getDoc(doc(db, "users", user.uid)); if (d.exists()) setPoint(d.data().point || 0); } catch (e) {} };
  const handleBetPercent = (percent) => { if (percent === 0) { setBet(''); return; } const amount = Math.floor(point * percent); setBet(String(amount)); };
  const drawCard = () => { const suit = suits[Math.floor(Math.random() * 4)]; const valueObj = values[Math.floor(Math.random() * 13)]; return { ...valueObj, suit }; };

  const startGame = async () => {
    const betMoney = parseInt(bet);
    if (isNaN(betMoney) || betMoney <= 0) return alert(t.alertInputBet);
    if (betMoney > Math.floor(point)) return alert(t.alertNoMoney);

    try {
      await updateDoc(doc(db, "users", user.uid), { point: increment(-betMoney) });
      setPoint(prev => prev - betMoney);
      await addDoc(collection(db, "history"), { uid: user.uid, type: "게임", msg: "하이로우 배팅", amount: -betMoney, createdAt: serverTimestamp() });
    } catch (e) { return alert(t.alertError); }

    const firstCard = drawCard();
    setCurrentCard(firstCard); setNextCard(null); setHistory([]); setStreak(0); setCurrentMultiplier(1.00); setGameState('playing'); setMessage("High or Low?"); setIsFlipping(false);
  };

  const getOdds = (direction) => { if (!currentCard) return { multi: 0, prob: 0 }; const v = currentCard.v; let chance = 0; if (direction === 'high') chance = (13 - v) / 13; else chance = (v - 1) / 13; if (chance <= 0) return { multi: 0, prob: 0 }; const prob = (chance * 100).toFixed(1); const multi = (0.98 / chance).toFixed(2); return { multi, prob }; };
  const guess = async (direction) => { if (gameState !== 'playing' || isFlipping) return; setIsFlipping(true); setMessage("..."); const newCard = drawCard(); setNextCard(newCard); setTimeout(() => { const prevVal = currentCard.v; const nextVal = newCard.v; let isWin = false; if (direction === 'high' && nextVal > prevVal) isWin = true; if (direction === 'low' && nextVal < prevVal) isWin = true; if (isWin) { const odds = getOdds(direction); const newMulti = (currentMultiplier * parseFloat(odds.multi)); setCurrentMultiplier(newMulti); setStreak(prev => prev + 1); setMessage(`${t.hl_success} [${newCard.l}${newCard.suit}]`); setHistory(prev => [currentCard, ...prev].slice(0, 5)); setCurrentCard(newCard); setNextCard(null); setIsFlipping(false); } else { setMessage(`${t.hl_fail} [${newCard.l}${newCard.suit}]`); setGameState('gameover'); setCurrentCard(newCard); setNextCard(null); if (navigator.vibrate) navigator.vibrate(200); setIsFlipping(false); } }, 800); };

  const cashOut = async () => {
    if (gameState !== 'playing') return;
    const winMoney = Math.floor(parseInt(bet) * currentMultiplier);
    setPoint(prev => prev + winMoney);
    await updateDoc(doc(db, "users", user.uid), { point: increment(winMoney) });
    await addDoc(collection(db, "history"), { uid: user.uid, type: "게임", msg: `하이로우 익절 (${currentMultiplier.toFixed(2)}배)`, amount: winMoney, createdAt: serverTimestamp() });
    setGameState('idle');
    alert(`${t.hl_success} (+${winMoney.toLocaleString()})`);
  };

  const CardView = ({ card, big = false, flipped = false }) => { const isRed = card && (card.suit === '♥' || card.suit === '♦'); return ( <div style={{ width: big ? 100 : 50, height: big ? 150 : 75, position: 'relative', perspective: '1000px' }}> <div className={`card-flip ${flipped ? 'flipped' : ''}`} style={{ width: '100%', height: '100%', position: 'relative' }}> <div className="card-face card-front" style={{ color: isRed ? '#e74c3c' : '#2c3e50', fontWeight: 'bold', fontSize: big ? 30 : 18 }}> {card && ( <> <div style={{ position: 'absolute', top: 5, left: 5, fontSize: big ? 16 : 12 }}>{card.l}</div> <div>{card.suit}</div> <div style={{ position: 'absolute', bottom: 5, right: 5, fontSize: big ? 16 : 12, transform: 'rotate(180deg)' }}>{card.l}</div> </> )} </div> <div className="card-face card-back"> 🃏 </div> </div> </div> ); };
  const highOdds = currentCard ? getOdds('high') : { multi: 0, prob: 0 };
  const lowOdds = currentCard ? getOdds('low') : { multi: 0, prob: 0 };

  return (
    <div className="container" style={{ background: '#0f1923', minHeight: '100vh', color: 'white', textAlign: 'center', padding: '15px' }}>
      <style>{styles}</style>
      <div style={{ position: 'relative', marginBottom: '10px' }}>
        <h1 style={{ color: '#ecf0f1', fontSize: '24px', letterSpacing: '2px', display: 'inline-block' }}>{t.hlTitle}</h1>
        <button onClick={() => setShowGuide(true)} style={{ position: 'absolute', right: 0, top: 0, background: 'none', border: '2px solid #7f8c8d', color: '#7f8c8d', borderRadius: '50%', width: '30px', height: '30px', fontWeight: 'bold', cursor: 'pointer' }}> ? </button>
      </div>
      {showGuide && ( <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}> <div style={{ background: '#2c3e50', padding: '20px', borderRadius: '15px', maxWidth: '350px', border: '1px solid #00d2d3' }}> <h2 style={{ color: '#00d2d3', marginTop: 0 }}>{t.hl_rule}</h2> <ul style={{ textAlign: 'left', lineHeight: '1.6', fontSize: '14px', color: '#ddd', paddingLeft: '20px' }}> <li>Next Card High or Low?</li> <li>A(1) &lt; 2 ... &lt; K(13)</li> </ul> <button className="btn" style={{ width: '100%', background: '#00d2d3', color: 'black', marginTop: '15px' }} onClick={() => setShowGuide(false)}>{t.close}</button> </div> </div> )}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#1e272e', borderRadius: '8px', marginBottom: '20px' }}>
        <div> <div style={{ fontSize: '12px', color: '#95a5a6' }}>{t.hl_current}</div> <div style={{ fontSize: '20px', color: '#2ecc71', fontWeight: 'bold' }}>x{currentMultiplier.toFixed(2)}</div> </div>
        <div> <div style={{ fontSize: '12px', color: '#95a5a6' }}>{t.hl_profit}</div> <div style={{ fontSize: '20px', color: '#f1c40f', fontWeight: 'bold' }}> {gameState === 'playing' ? Math.floor(parseInt(bet) * currentMultiplier).toLocaleString() : 0} </div> </div>
      </div>
      <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', opacity: 0.6 }}> {history.map((c, i) => <CardView key={i} card={c} />)} </div>
        <div style={{ position: 'relative', width: 100, height: 150 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 10, transition: 'all 0.5s', transform: isFlipping ? 'translateX(-60px) scale(0.9)' : 'translateX(0) scale(1.2)' }}> {gameState === 'idle' ? <div style={{width:100, height:150, border:'2px dashed #555', borderRadius:10}}></div> : <CardView card={currentCard} big />} </div>
            {isFlipping && ( <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 20, animation: 'slideIn 0.5s forwards' }}> <CardView card={nextCard} big flipped={true} /> </div> )}
        </div>
        <div style={{ marginTop: '30px', fontSize: '18px', fontWeight: 'bold', color: '#f1c40f', minHeight: '30px' }}> {message} </div>
      </div>
      <div className="card" style={{ background: '#2c3e50', padding: '15px' }}>
        {gameState === 'playing' ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn" onClick={() => guess('low')} disabled={lowOdds.prob <= 0 || isFlipping} style={{ flex: 1, background: '#34495e', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px', opacity: lowOdds.prob <= 0 ? 0.3 : 1 }}> <span style={{ fontSize: '20px' }}>{t.hl_low}</span> <span style={{ fontSize: '12px', color: '#bdc3c7' }}>{lowOdds.prob}%</span> <span style={{ fontSize: '16px', color: '#2ecc71' }}>x{lowOdds.multi}</span> </button>
            <button className="btn" onClick={() => guess('high')} disabled={highOdds.prob <= 0 || isFlipping} style={{ flex: 1, background: '#34495e', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px', opacity: highOdds.prob <= 0 ? 0.3 : 1 }}> <span style={{ fontSize: '20px' }}>{t.hl_high}</span> <span style={{ fontSize: '12px', color: '#bdc3c7' }}>{highOdds.prob}%</span> <span style={{ fontSize: '16px', color: '#2ecc71' }}>x{highOdds.multi}</span> </button>
          </div>
        ) : (
          <>
            <input className="input" type="number" placeholder={t.inputBet} value={bet} onChange={e => setBet(e.target.value)} style={{ textAlign: 'center', fontSize: '18px', background: '#1e272e', color: 'white' }} />
            <div style={{display:'flex', gap:5, marginBottom:15}}>
                <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.1)}>10%</button>
                <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.25)}>25%</button>
                <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.5)}>50%</button>
                <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#e74c3c', color:'white', fontWeight:'bold'}} onClick={()=>handleBetPercent(1)}>ALL</button>
                <button className="btn" style={{width:40, padding:5, fontSize:12, background:'#95a5a6'}} onClick={()=>handleBetPercent(0)}>🔄</button>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '15px', fontSize: '20px' }} onClick={startGame}> {gameState === 'gameover' ? t.restart : t.gameStart} </button>
          </>
        )}
        {gameState === 'playing' && streak > 0 && (
            <button className="btn" disabled={isFlipping} style={{ width: '100%', marginTop: '15px', background: '#f1c40f', color: 'black', fontWeight: 'bold', padding: '15px' }} onClick={cashOut}> 💰 {t.hl_cashout} ({Math.floor(parseInt(bet) * currentMultiplier).toLocaleString()}) </button>
        )}
      </div>
      <button className="btn" style={{ marginTop: 20, background: '#444', width: '100%' }} onClick={() => navigate('/home')}>{t.home}</button>
      <style>{` @keyframes slideIn { 0% { transform: translateX(50px) scale(0.8); opacity: 0; } 100% { transform: translateX(0) scale(1.2); opacity: 1; } } `}</style>
    </div>
  );
}