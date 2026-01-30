// import React, { useState, useEffect } from 'react';
// import { db, auth } from '../firebase';
// // 👇 addDoc, collection, serverTimestamp 추가됨
// import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';

// export default function Blackjack() {
//   // ... (기존 state들 그대로 유지) ...
//   const [point, setPoint] = useState(0);
//   const [bet, setBet] = useState('');
//   const [deck, setDeck] = useState([]);
//   const [playerHand, setPlayerHand] = useState([]);
//   const [dealerHand, setDealerHand] = useState([]);
//   const [gameState, setGameState] = useState('betting');
//   const [message, setMessage] = useState("배팅 금액을 정해주세요.");
//   const navigate = useNavigate();
//   const user = auth.currentUser;

//   // ... (useEffect, fetchPoint, handleBetPercent, createDeck, calculateScore 함수들 그대로 유지) ...
//   useEffect(() => { if (!user) { navigate('/login'); return; } fetchPoint(); }, [user, navigate]);
//   const fetchPoint = async () => { const d = await getDoc(doc(db, "users", user.uid)); if (d.exists()) setPoint(d.data().point || 0); };
//   const handleBetPercent = (percent) => { if (percent === 0) { setBet(''); return; } const amount = Math.floor(point * percent); setBet(String(amount)); };
//   const createDeck = () => { const suits = ['H', 'D', 'C', 'S']; const values = ['2', '3', '4', '5', '6', '7', '8', '9', '0', 'J', 'Q', 'K', 'A']; let newDeck = []; for (let s of suits) { for (let v of values) { newDeck.push({ suit: s, value: v, img: `https://deckofcardsapi.com/static/img/${v}${s}.png` }); } } return newDeck.sort(() => Math.random() - 0.5); };
//   const calculateScore = (hand) => { let score = 0; let aces = 0; hand.forEach(card => { if (['J', 'Q', 'K', '0'].includes(card.value)) score += 10; else if (card.value === 'A') { score += 11; aces += 1; } else score += parseInt(card.value); }); while (score > 21 && aces > 0) { score -= 10; aces -= 1; } return score; };

//   const startGame = async () => {
//     const betMoney = parseInt(bet);
//     if (isNaN(betMoney) || betMoney <= 0) return alert("배팅 금액을 입력하세요!");
//     if (betMoney > Math.floor(point)) return alert("돈이 부족합니다!");

//     try {
//       await updateDoc(doc(db, "users", user.uid), { point: increment(-betMoney) });
//       setPoint(prev => prev - betMoney);

//       // ✅ [기록 추가] 베팅 로그 저장
//       await addDoc(collection(db, "history"), {
//           uid: user.uid,
//           type: "게임",
//           msg: "블랙잭 베팅",
//           amount: -betMoney,
//           createdAt: serverTimestamp()
//       });

//       const newDeck = createDeck();
//       const pHand = [newDeck.pop(), newDeck.pop()];
//       const dHand = [newDeck.pop(), newDeck.pop()];

//       setDeck(newDeck);
//       setPlayerHand(pHand);
//       setDealerHand(dHand);
//       setGameState('playing');
//       setMessage("카드를 더 받으시겠습니까?");
//     } catch (e) {
//       alert("오류 발생: " + e.message);
//     }
//   };

//   // ... (hit 함수 그대로 유지) ...
//   const hit = () => { const currentDeck = [...deck]; const card = currentDeck.pop(); const newHand = [...playerHand, card]; setDeck(currentDeck); setPlayerHand(newHand); if (calculateScore(newHand) > 21) { setGameState('finished'); setMessage("💥 버스트! 패배했습니다."); } };

//   const stand = async () => {
//     let dHand = [...dealerHand];
//     let currentDeck = [...deck];
//     while (calculateScore(dHand) < 17) { dHand.push(currentDeck.pop()); }
//     setDealerHand(dHand);
//     const pScore = calculateScore(playerHand);
//     const dScore = calculateScore(dHand);
//     let winMoney = 0;
//     const betMoney = parseInt(bet);

//     if (dScore > 21 || pScore > dScore) { winMoney = betMoney * 2; setMessage("🎉 승리했습니다!"); }
//     else if (pScore === dScore) { winMoney = betMoney; setMessage("😐 무승부입니다."); }
//     else { setMessage("😭 패배했습니다..."); }

//     if (winMoney > 0) {
//       try {
//         await updateDoc(doc(db, "users", user.uid), { point: increment(winMoney) });
//         setPoint(prev => prev + winMoney);

//         // ✅ [기록 추가] 당첨 로그 저장
//         await addDoc(collection(db, "history"), {
//             uid: user.uid,
//             type: "게임",
//             msg: winMoney === betMoney ? "블랙잭 무승부(환불)" : "블랙잭 승리",
//             amount: winMoney,
//             createdAt: serverTimestamp()
//         });

//       } catch (e) { console.error("포인트 저장 실패", e); }
//     }
//     setGameState('finished');
//   };

//   return (
//     // ... (기존 UI 코드 그대로 유지) ...
//     <div className="container" style={{ background: '#1a472a', minHeight: '100vh', color: 'white', textAlign: 'center' }}>
//       <div style={{ padding: 20, display: 'flex', justifyContent: 'space-between' }}>
//         <button className="btn" style={{ background: '#333' }} onClick={() => navigate('/home')}>🏠 홈</button>
//         <div style={{ fontSize: 20, color: '#f1c40f' }}>💰 {Math.floor(point).toLocaleString()}원</div>
//       </div>
//       <div style={{ minHeight: '150px', marginBottom: 20 }}>
//         <p>🤵 딜러 ({gameState === 'playing' ? '?' : calculateScore(dealerHand)})</p>
//         <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
//           {dealerHand.map((card, i) => (
//             <img key={i} src={gameState === 'playing' && i === 1 ? 'https://deckofcardsapi.com/static/img/back.png' : card.img} style={{ width: 70 }} alt="card" />
//           ))}
//         </div>
//       </div>
//       <h2 style={{ color: '#f1c40f', margin: '20px 0' }}>{message}</h2>
//       <div style={{ minHeight: '150px' }}>
//         <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
//           {playerHand.map((card, i) => (
//             <img key={i} src={card.img} style={{ width: 70 }} alt="card" />
//           ))}
//         </div>
//         <p>😎 나 ({calculateScore(playerHand)})</p>
//       </div>
//       <div className="card" style={{ background: 'rgba(0,0,0,0.7)', marginTop: 20, padding: '20px' }}>
//         {gameState === 'betting' ? (
//           <div>
//             <input className="input" type="number" placeholder="배팅액" value={bet} onChange={e => setBet(e.target.value)} style={{ textAlign: 'center', fontSize: '18px', marginBottom: '10px' }} />
//             <div style={{display:'flex', gap:5, marginBottom:15}}>
//                 <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.1)}>10%</button>
//                 <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.25)}>25%</button>
//                 <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.5)}>50%</button>
//                 <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#e74c3c', color:'white', fontWeight:'bold'}} onClick={()=>handleBetPercent(1)}>ALL</button>
//                 <button className="btn" style={{width:40, padding:5, fontSize:12, background:'#95a5a6'}} onClick={()=>handleBetPercent(0)}>🔄</button>
//             </div>
//             <button className="btn btn-primary" style={{ width: '100%', fontSize: '18px' }} onClick={startGame}>게임 시작</button>
//           </div>
//         ) : gameState === 'playing' ? (
//           <div style={{ display: 'flex', gap: '10px' }}>
//             <button className="btn btn-success" style={{ flex: 1, padding: '15px' }} onClick={hit}>히트 (카드 받기)</button>
//             <button className="btn btn-danger" style={{ flex: 1, padding: '15px' }} onClick={stand}>스탠드 (멈추기)</button>
//           </div>
//         ) : (
//           <button className="btn btn-warn" style={{ width: '100%', padding: '15px' }} onClick={() => { setGameState('betting'); setPlayerHand([]); setDealerHand([]); setMessage("다시 배팅해주세요."); }}>한 판 더 하기</button>
//         )}
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

export default function Blackjack() {
  const [point, setPoint] = useState(0);
  const [bet, setBet] = useState('');
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [gameState, setGameState] = useState('betting');
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const user = auth.currentUser;
  const { t } = useLanguage();

  useEffect(() => { 
      if (!user) { navigate('/login'); return; } 
      fetchPoint(); 
      setMessage(t.bj_ask);
  }, [user, navigate]);

  const fetchPoint = async () => { const d = await getDoc(doc(db, "users", user.uid)); if (d.exists()) setPoint(d.data().point || 0); };
  const handleBetPercent = (percent) => { if (percent === 0) { setBet(''); return; } const amount = Math.floor(point * percent); setBet(String(amount)); };
  const createDeck = () => { const suits = ['H', 'D', 'C', 'S']; const values = ['2', '3', '4', '5', '6', '7', '8', '9', '0', 'J', 'Q', 'K', 'A']; let newDeck = []; for (let s of suits) { for (let v of values) { newDeck.push({ suit: s, value: v, img: `https://deckofcardsapi.com/static/img/${v}${s}.png` }); } } return newDeck.sort(() => Math.random() - 0.5); };
  const calculateScore = (hand) => { let score = 0; let aces = 0; hand.forEach(card => { if (['J', 'Q', 'K', '0'].includes(card.value)) score += 10; else if (card.value === 'A') { score += 11; aces += 1; } else score += parseInt(card.value); }); while (score > 21 && aces > 0) { score -= 10; aces -= 1; } return score; };

  const startGame = async () => {
    const betMoney = parseInt(bet);
    if (isNaN(betMoney) || betMoney <= 0) return alert(t.alertInputBet);
    if (betMoney > Math.floor(point)) return alert(t.alertNoMoney);

    try {
      await updateDoc(doc(db, "users", user.uid), { point: increment(-betMoney) });
      setPoint(prev => prev - betMoney);
      await addDoc(collection(db, "history"), { uid: user.uid, type: "게임", msg: "블랙잭 배팅", amount: -betMoney, createdAt: serverTimestamp() });

      const newDeck = createDeck();
      const pHand = [newDeck.pop(), newDeck.pop()];
      const dHand = [newDeck.pop(), newDeck.pop()];

      setDeck(newDeck);
      setPlayerHand(pHand);
      setDealerHand(dHand);
      setGameState('playing');
      setMessage(t.bj_ask);
    } catch (e) {
      alert(t.alertError);
    }
  };

  const hit = () => { const currentDeck = [...deck]; const card = currentDeck.pop(); const newHand = [...playerHand, card]; setDeck(currentDeck); setPlayerHand(newHand); if (calculateScore(newHand) > 21) { setGameState('finished'); setMessage(t.bj_bust); } };

  const stand = async () => {
    let dHand = [...dealerHand];
    let currentDeck = [...deck];
    while (calculateScore(dHand) < 17) { dHand.push(currentDeck.pop()); }
    setDealerHand(dHand);
    const pScore = calculateScore(playerHand);
    const dScore = calculateScore(dHand);
    let winMoney = 0;
    const betMoney = parseInt(bet);

    if (dScore > 21 || pScore > dScore) { winMoney = betMoney * 2; setMessage(t.win); }
    else if (pScore === dScore) { winMoney = betMoney; setMessage(t.draw); }
    else { setMessage(t.lose); }

    if (winMoney > 0) {
      try {
        await updateDoc(doc(db, "users", user.uid), { point: increment(winMoney) });
        setPoint(prev => prev + winMoney);
        await addDoc(collection(db, "history"), { uid: user.uid, type: "게임", msg: "블랙잭 승리", amount: winMoney, createdAt: serverTimestamp() });
      } catch (e) {}
    }
    setGameState('finished');
  };

  return (
    <div className="container" style={{ background: '#1a472a', minHeight: '100vh', color: 'white', textAlign: 'center' }}>
      <div style={{ padding: 20, display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn" style={{ background: '#333' }} onClick={() => navigate('/home')}>{t.home}</button>
        <div style={{ fontSize: 20, color: '#f1c40f' }}>{t.balance}: {Math.floor(point).toLocaleString()}</div>
      </div>
      <div style={{ minHeight: '150px', marginBottom: 20 }}>
        <p>🤵 {t.bj_dealer} ({gameState === 'playing' ? '?' : calculateScore(dealerHand)})</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          {dealerHand.map((card, i) => (
            <img key={i} src={gameState === 'playing' && i === 1 ? 'https://deckofcardsapi.com/static/img/back.png' : card.img} style={{ width: 70 }} alt="card" />
          ))}
        </div>
      </div>
      <h2 style={{ color: '#f1c40f', margin: '20px 0' }}>{message}</h2>
      <div style={{ minHeight: '150px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          {playerHand.map((card, i) => (
            <img key={i} src={card.img} style={{ width: 70 }} alt="card" />
          ))}
        </div>
        <p>😎 {t.bj_player} ({calculateScore(playerHand)})</p>
      </div>
      <div className="card" style={{ background: 'rgba(0,0,0,0.7)', marginTop: 20, padding: '20px' }}>
        {gameState === 'betting' ? (
          <div>
            <input className="input" type="number" placeholder={t.inputBet} value={bet} onChange={e => setBet(e.target.value)} style={{ textAlign: 'center', fontSize: '18px', marginBottom: '10px' }} />
            <div style={{display:'flex', gap:5, marginBottom:15}}>
                <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.1)}>10%</button>
                <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.25)}>25%</button>
                <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.5)}>50%</button>
                <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#e74c3c', color:'white', fontWeight:'bold'}} onClick={()=>handleBetPercent(1)}>ALL</button>
                <button className="btn" style={{width:40, padding:5, fontSize:12, background:'#95a5a6'}} onClick={()=>handleBetPercent(0)}>🔄</button>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', fontSize: '18px' }} onClick={startGame}>{t.gameStart}</button>
          </div>
        ) : gameState === 'playing' ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-success" style={{ flex: 1, padding: '15px' }} onClick={hit}>{t.bj_hit}</button>
            <button className="btn btn-danger" style={{ flex: 1, padding: '15px' }} onClick={stand}>{t.bj_stand}</button>
          </div>
        ) : (
          <button className="btn btn-warn" style={{ width: '100%', padding: '15px' }} onClick={() => { setGameState('betting'); setPlayerHand([]); setDealerHand([]); setMessage(""); }}>{t.restart}</button>
        )}
      </div>
    </div>
  );
}