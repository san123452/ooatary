

// import React, { useState, useEffect, useRef } from 'react';
// import axios from 'axios';
// import { db, auth } from '../../firebase';
// import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';
// import { useLanguage } from '../../LanguageContext';
// import { usePositions } from '../PositionContext'; 

// const ADMIN_EMAIL = "kks3172@naver.com"; // ⭐️ 관리자 이메일 설정

// export default function BitcoinGame() {
//   const [point, setPoint] = useState(0);
//   const [myName, setMyName] = useState("익명");
//   const [betAmount, setBetAmount] = useState('');
//   const [currentPrice, setCurrentPrice] = useState(0); 
//   const [entryPrice, setEntryPrice] = useState(0); 
//   const [position, setPosition] = useState(null); 
//   const [gameState, setGameState] = useState('idle'); 
//   const [pnlRate, setPnlRate] = useState(0);
//   const [betMoney, setBetMoney] = useState(0); 
  
//   // ⏱️ 쿨타임 관련 상태
//   const [cooldown, setCooldown] = useState(0);

//   const { allPositions, lastFetch } = usePositions();

//   const navigate = useNavigate();
//   const user = auth.currentUser;
//   const { t } = useLanguage();
//   const container = useRef(); 

//   const LEVERAGE = 100;

//   // 👑 관리자 여부 확인
//   const isAdmin = user?.email === ADMIN_EMAIL;

//   // 1. 초기화
//   useEffect(() => {
//     if (!user) { navigate('/login'); return; }
    
//     const fetchUserData = async () => {
//         const userRef = doc(db, "users", user.uid);
//         const snap = await getDoc(userRef);
//         if (snap.exists()) {
//             const data = snap.data();
//             setPoint(data.point || 0);
//             setMyName(data.name || "익명");
//         }
//     };
//     fetchUserData();

//     const myGameRef = doc(db, "bitcoin_positions", user.uid);
//     getDoc(myGameRef).then(snap => {
//         if(snap.exists()) {
//             const save = snap.data();
//             setEntryPrice(save.entryPrice);
//             setPosition(save.position);
//             setBetMoney(save.betAmount);
            
//             if (save.isLiquidated) {
//                 setGameState('liquidated');
//                 setPnlRate(-100);
//             } else {
//                 setGameState('running');
//             }
//         }
//     });

//     // ⏱️ 초기 로딩 시 기존 쿨타임 체크
//     const savedCooldown = localStorage.getItem(`btc_cooldown_${user.uid}`);
//     if (savedCooldown) {
//       const remaining = Math.ceil((parseInt(savedCooldown) - Date.now()) / 1000);
//       if (remaining > 0) setCooldown(remaining);
//     }

//     fetchBtcPrice();
//     const priceInterval = setInterval(fetchBtcPrice, 5000); 
    
//     return () => {
//         clearInterval(priceInterval);
//     };
//   }, [user, navigate]);

//   // ⏱️ 쿨타임 타이머 작동
//   useEffect(() => {
//     if (cooldown > 0) {
//       const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [cooldown]);

//   // 2. TradingView 차트
//   useEffect(() => {
//     if (container.current && !container.current.firstChild) {
//       const script = document.createElement("script");
//       script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
//       script.type = "text/javascript";
//       script.async = true;
//       script.innerHTML = `
//         {
//           "symbol": "UPBIT:BTCKRW",
//           "width": "100%",
//           "height": "220",
//           "locale": "kr",
//           "dateRange": "1D",
//           "colorTheme": "dark",
//           "isTransparent": false,
//           "autosize": true,
//           "largeChartUrl": ""
//         }`;
//       container.current.appendChild(script);
//     }
//   }, []);

//   const fetchBtcPrice = async () => {
//     try {
//       const targetUrl = "https://api.upbit.com/v1/ticker?markets=KRW-BTC";
//       const proxyUrl = "https://api.codetabs.com/v1/proxy?quest="; 
//       const res = await axios.get(proxyUrl + targetUrl);
//       if (res.data && res.data[0]) {
//         setCurrentPrice(res.data[0].trade_price);
//       }
//     } catch (e) {
//       try {
//           const geckoUrl = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=krw";
//           const res = await axios.get(geckoUrl);
//           if (res.data && res.data.bitcoin) {
//             setCurrentPrice(res.data.bitcoin.krw);
//           }
//       } catch (e2) {
//           console.error("가격 조회 완전 실패");
//       }
//     }
//   };

//   const calcPnl = (entry, current, pos) => {
//       let priceChangePercent = ((current - entry) / entry) * 100;
//       if (pos === 'SHORT') priceChangePercent *= -1;
//       let pnl = priceChangePercent * LEVERAGE;
//       if (pnl <= -100) return -100;
//       return pnl;
//   };

//   useEffect(() => {
//     if (gameState === 'liquidated') return;
//     if (gameState === 'running' && entryPrice > 0 && currentPrice > 0) {
//       const rate = calcPnl(entryPrice, currentPrice, position);
//       setPnlRate(rate);
//       if (rate <= -100) {
//         handleLiquidation();
//       }
//     }
//   }, [currentPrice, gameState, entryPrice, position]);

//   const handleBetPercent = (percent) => { 
//     if (percent === 0) { setBetAmount(''); return; } 
//     const amount = Math.floor(point * percent); 
//     setBetAmount(String(amount)); 
//   };

//   // ⏱️ 쿨타임 시작 함수
//   const triggerCooldown = () => {
//     const endTime = Date.now() + 30000; // 30초 뒤
//     localStorage.setItem(`btc_cooldown_${user.uid}`, endTime);
//     setCooldown(30);
//   };

//   const startGame = async (side) => {
//     if (cooldown > 0) return; // 쿨타임 중 배팅 불가
//     const money = parseInt(betAmount);
//     if (isNaN(money) || money <= 0) return alert(t.alertInputBet || "금액 입력!");
//     if (money > Math.floor(point)) return alert(t.alertNoMoney || "포인트 부족!");
//     if (!currentPrice) return alert("로딩중... 잠시만 기다려주세요.");

//     try {
//       await updateDoc(doc(db, "users", user.uid), { point: increment(-money) });
//       setPoint(prev => prev - money);

//       await setDoc(doc(db, "bitcoin_positions", user.uid), {
//           uid: user.uid,
//           name: myName,
//           entryPrice: currentPrice,
//           position: side,
//           betAmount: money,
//           startTime: serverTimestamp(),
//           isLiquidated: false 
//       });

//       setEntryPrice(currentPrice);
//       setPosition(side);
//       setBetMoney(money);
//       setGameState('running');
//       setPnlRate(0);

//       await addDoc(collection(db, "history"), { 
//         uid: user.uid, type: "게임", msg: `BTC ${LEVERAGE}배 ${side} 진입`, amount: -money, createdAt: serverTimestamp() 
//       });

//     } catch (e) { console.error(e); alert("Error"); }
//   };

//   const claimProfit = async () => {
//     if (gameState !== 'running') return;
//     const profitRate = pnlRate;
//     const finalMoney = Math.floor(betMoney + (betMoney * profitRate / 100));

//     try {
//       if (finalMoney > 0) {
//         await updateDoc(doc(db, "users", user.uid), { point: increment(finalMoney) });
//         setPoint(prev => prev + finalMoney);
//         await addDoc(collection(db, "history"), { 
//           uid: user.uid, type: "게임", msg: `BTC ${LEVERAGE}배 익절 (${profitRate.toFixed(2)}%)`, amount: finalMoney, createdAt: serverTimestamp() 
//         });
//         alert(`정산 완료! +${finalMoney.toLocaleString()}P`);
//       } else {
//         alert("손절... 잔액이 0원이 되었습니다.");
//       }
//       await deleteDoc(doc(db, "bitcoin_positions", user.uid));
//     } catch (e) { console.error(e); }
    
//     triggerCooldown(); // ⭐️ 정산 후 쿨타임 작동
//     resetGame();
//   };

//   const handleLiquidation = async () => {
//     setGameState('liquidated'); 
//     setPnlRate(-100);
//     try {
//         await updateDoc(doc(db, "bitcoin_positions", user.uid), {
//             isLiquidated: true,
//             pnlRate: -100
//         });
//         await addDoc(collection(db, "history"), { 
//             uid: user.uid, type: "게임", msg: `BTC ${LEVERAGE}배 청산`, amount: 0, createdAt: serverTimestamp() 
//         });
//     } catch(e) { console.error(e); }
//     alert("💀 청산 당했습니다! (복구 불가)");
//   };

//   const confirmLiquidation = async () => {
//       try { await deleteDoc(doc(db, "bitcoin_positions", user.uid)); } catch(e) {}
//       triggerCooldown(); // ⭐️ 청산 확인 후 쿨타임 작동
//       resetGame();
//   };

//   const resetGame = () => {
//     setGameState('idle');
//     setEntryPrice(0);
//     setPosition(null);
//     setPnlRate(0);
//     setBetAmount('');
//     setBetMoney(0);
//   };

//   const handleAdminForceLiquidation = async (targetUid, targetName) => {
//     if (!isAdmin) return;
//     if (!window.confirm(`[${targetName}]님을 정말 강제 청산시키겠습니까?`)) return;

//     try {
//         const targetRef = doc(db, "bitcoin_positions", targetUid);
//         await updateDoc(targetRef, {
//             isLiquidated: true,
//             pnlRate: -100
//         });

//         await addDoc(collection(db, "history"), { 
//             uid: targetUid, 
//             type: "게임", 
//             msg: `🚨 관리자에 의해 포지션 강제 청산`, 
//             amount: 0, 
//             createdAt: serverTimestamp() 
//         });

//         alert("강제 청산 완료");
//     } catch (e) {
//         console.error(e);
//         alert("청산 실패");
//     }
//   };

//   return (
//     <div className="container" style={{ background: '#1e272e', minHeight: '100vh', color: 'white', display: 'flex', flexDirection: 'column', padding: '10px' }}>
      
//       <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#2f3640', borderRadius: '10px', marginBottom: '10px' }}>
//         <h1 style={{ margin: 0, fontSize: '20px', color: '#f39c12' }}>⚡ BTC {LEVERAGE}x</h1>
//         <div style={{ fontWeight: 'bold' }}>💰 {Math.floor(point).toLocaleString()}</div>
//       </div>

//       <div className="tradingview-widget-container" ref={container} style={{ marginBottom: '10px', borderRadius:'10px', overflow:'hidden' }}></div>

//       <div style={{ marginBottom: '20px' }}>
//         {(gameState === 'running' || gameState === 'liquidated') && (
//           <div style={{ textAlign: 'center', background: gameState === 'liquidated' ? 'rgba(231, 76, 60, 0.2)' : 'rgba(0,0,0,0.3)', padding:'15px', borderRadius:'10px', border: gameState === 'liquidated' ? '1px solid #e74c3c' : 'none' }}>
//             <div style={{ fontSize: '14px', color: '#ccc' }}>내 수익률 ({LEVERAGE}x)</div>
//             <div style={{ fontSize: '40px', fontWeight: '900', color: pnlRate > 0 ? '#2ecc71' : '#e74c3c' }}>
//               {gameState === 'liquidated' ? '💀 -100%' : `${pnlRate > 0 ? '+' : ''}${pnlRate.toFixed(2)}%`}
//             </div>
//             <div style={{ fontSize: '12px', color: '#aaa', marginTop:5 }}>
//               진입: {entryPrice.toLocaleString()} | <span style={{color: position === 'LONG' ? '#2ecc71' : '#e74c3c', fontWeight:'bold'}}>{position}</span>
//             </div>
//             {gameState === 'running' && (
//                 <div style={{ fontSize: '11px', color: '#e74c3c', marginTop:5 }}>
//                 ⚠️ 청산가: {position === 'LONG' 
//                     ? Math.floor(entryPrice * 0.99).toLocaleString() 
//                     : Math.floor(entryPrice * 1.01).toLocaleString()
//                 }
//                 </div>
//             )}
//           </div>
//         )}
//       </div>

//       <div className="card" style={{ background: '#2f3640', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
//         {gameState === 'idle' ? (
//           <>
//             {cooldown > 0 ? (
//               /* ⏱️ 쿨타임 표시 UI */
//               <div style={{ textAlign: 'center', padding: '20px' }}>
//                 <div style={{ fontSize: '16px', color: '#f39c12', fontWeight: 'bold', marginBottom: '10px' }}>⚠️ 과도한 단타 방지 시스템 가동 중</div>
//                 <div style={{ fontSize: '30px', fontWeight: 'bold', color: 'white' }}>{cooldown}초 후 재입장 가능</div>
//                 <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '10px' }}>서버 안정성을 위해 잠시 대기해주세요.</div>
//               </div>
//             ) : (
//               /* 정상 배팅 UI */
//               <>
//                 <input className="input" type="number" placeholder="배팅 포인트" value={betAmount} onChange={e => setBetAmount(e.target.value)} style={{ width: '100%', marginBottom: '10px', textAlign: 'center', background: '#1e272e', color: 'white', border:'none', fontSize: '18px', padding: '15px' }} />
//                 <div style={{display:'flex', gap:5, marginBottom:20}}>
//                     <button className="btn" style={{flex:1, padding:10, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.1)}>10%</button>
//                     <button className="btn" style={{flex:1, padding:10, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.5)}>50%</button>
//                     <button className="btn" style={{flex:1, padding:10, background:'#e74c3c', fontWeight:'bold'}} onClick={()=>handleBetPercent(1)}>MAX</button>
//                 </div>
//                 <div style={{ display: 'flex', gap: '15px' }}>
//                     <button onClick={() => startGame('LONG')} style={{ flex: 1, padding: '20px', borderRadius: '10px', border: 'none', background: '#27ae60', color: 'white', fontSize: '24px', fontWeight: 'bold', boxShadow: '0 5px 0 #219150' }}>🚀 LONG</button>
//                     <button onClick={() => startGame('SHORT')} style={{ flex: 1, padding: '20px', borderRadius: '10px', border: 'none', background: '#c0392b', color: 'white', fontSize: '24px', fontWeight: 'bold', boxShadow: '0 5px 0 #a93226' }}>📉 SHORT</button>
//                 </div>
//               </>
//             )}
//           </>
//         ) : gameState === 'liquidated' ? (
//             <button onClick={confirmLiquidation} style={{ width: '100%', padding: '20px', borderRadius: '10px', border: 'none', background: '#c0392b', color: 'white', fontSize: '20px', fontWeight: 'bold', boxShadow: '0 5px 0 #922b21' }}>
//                 💀 청산 확인 (나가기)
//             </button>
//         ) : (
//           <button onClick={claimProfit} style={{ width: '100%', padding: '20px', borderRadius: '10px', border: 'none', background: '#f39c12', color: 'white', fontSize: '22px', fontWeight: 'bold', boxShadow: '0 5px 0 #d35400' }}>
//               💰 포지션 종료 (정산)
//           </button>
//         )}
//       </div>

//       <div className="card" style={{ background: '#222', padding: '15px', borderRadius: '10px', border:'1px solid #444' }}>
//           <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px', borderBottom:'1px solid #444', paddingBottom:'5px'}}>
//               <div style={{color:'#f1c40f', fontWeight:'bold'}}>
//                   🔥 포지션 현황 ({allPositions.length}명) 
//                   <span style={{fontSize:'10px', color:'#27ae60', marginLeft:'5px'}}>● 실시간</span>
//               </div>
//           </div>
//           {allPositions.length === 0 ? (
//               <div style={{textAlign:'center', color:'#555', padding:'20px'}}>진행 중인 유저가 없습니다.</div>
//           ) : (
//               <div style={{maxHeight:'300px', overflowY:'auto'}}>
//                   {allPositions.map((p) => {
//                       const isMe = p.uid === user?.uid;
//                       const isDead = p.isLiquidated;
//                       const livePnl = !isDead && currentPrice ? calcPnl(p.entryPrice, currentPrice, p.position) : -100;

//                       return (
//                           <div key={p.uid} style={{ 
//                               display:'flex', justifyContent:'space-between', alignItems:'center', 
//                               padding:'10px', marginBottom:'5px', borderRadius:'5px',
//                               background: isMe ? 'rgba(241, 196, 15, 0.1)' : '#2c3e50',
//                               border: isMe ? '1px solid #f1c40f' : 'none'
//                           }}>
//                               <div>
//                                   <div style={{fontSize:'14px', fontWeight:'bold', color:'white', display:'flex', alignItems:'center', gap: '5px'}}>
//                                       {p.name} {isMe && <span style={{fontSize:'10px', color:'#f1c40f'}}>(나)</span>}
//                                       {isAdmin && !isMe && !isDead && (
//                                         <button 
//                                           onClick={() => handleAdminForceLiquidation(p.uid, p.name)}
//                                           style={{ padding: '2px 5px', fontSize: '9px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
//                                         >
//                                           강제청산
//                                         </button>
//                                       )}
//                                   </div>
//                                   <div style={{fontSize:'11px', color:'#aaa'}}>
//                                       {p.entryPrice.toLocaleString()}에 <span style={{color: p.position==='LONG'?'#2ecc71':'#e74c3c', fontWeight:'bold'}}>{p.position}</span>
//                                   </div>
//                               </div>
//                               <div style={{textAlign:'right'}}>
//                                   {isDead ? (
//                                       <div style={{fontSize:'16px', fontWeight:'bold', color:'#e74c3c', animation:'blink 1s infinite'}}>
//                                           💀 청산
//                                       </div>
//                                   ) : (
//                                       <div style={{fontSize:'16px', fontWeight:'bold', color: livePnl>0?'#2ecc71':(livePnl<0?'#e74c3c':'white')}}>
//                                           {livePnl > 0 ? '+' : ''}{livePnl.toFixed(2)}%
//                                       </div>
//                                   )}
//                                   <div style={{fontSize:'10px', color:'#777'}}>
//                                       {p.betAmount.toLocaleString()}P
//                                   </div>
//                               </div>
//                           </div>
//                       );
//                   })}
//               </div>
//           )}
//           <div style={{textAlign:'center', fontSize:'10px', color:'#666', marginTop:'10px'}}>
//               마지막 업데이트: {lastFetch ? new Date(lastFetch).toLocaleTimeString() : '-'}
//           </div>
//           <style>{`
//             @keyframes blink { 
//                 0% { opacity: 1; } 
//                 50% { opacity: 0.3; } 
//                 100% { opacity: 1; } 
//             }
//           `}</style>
//       </div>

//       <button className="btn" style={{ marginTop: 20, background: '#444', width: '100%', padding: '15px' }} onClick={() => navigate('/home')}>
//           {t.home || "홈으로"}
//       </button>
//     </div>
//   );
// }
 

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { db, auth } from '../../firebase';
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp, setDoc, deleteDoc, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../LanguageContext';
import { usePositions } from '../PositionContext'; 

const ADMIN_EMAIL = "kks3172@naver.com"; // 👑 관리자 이메일

export default function BitcoinGame() {
  const [point, setPoint] = useState(0);
  const [myName, setMyName] = useState("익명");
  const [betAmount, setBetAmount] = useState('');
  
  const [btcPrice, setBtcPrice] = useState(0); 
  const [kospiPrice, setKospiPrice] = useState(0); 
  const [assetType, setAssetType] = useState('BTC'); // 현재 선택된 탭
  
  // 📈 BTC와 KOSPI 포지션을 독립적으로 관리
  const [positions, setPositions] = useState({ BTC: null, KOSPI: null });
  
  const [cooldown, setCooldown] = useState(0);
  const { allPositions, lastFetch } = usePositions();

  const navigate = useNavigate();
  const user = auth.currentUser;
  const { t } = useLanguage();
  const container = useRef(); 

  const LEVERAGE = 100;
  const isAdmin = user?.email === ADMIN_EMAIL;

  // 1. 초기 데이터 로드 및 내 포지션 쿼리
  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    
    // 유저 정보 로드
    const fetchUserData = async () => {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            setPoint(snap.data().point || 0);
            setMyName(snap.data().name || "익명");
        }
    };
    fetchUserData();

    // 🔄 내 포지션 실시간 감시 (BTC, KOSPI 모두 가져오기)
    const q = query(collection(db, "bitcoin_positions"), where("uid", "==", user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
        const newPositions = { BTC: null, KOSPI: null };
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const type = data.assetType || 'BTC'; // 구버전 데이터는 BTC로 간주
            newPositions[type] = { ...data, docId: docSnap.id };
        });
        setPositions(newPositions);
    });

    // 쿨타임 복구
    const savedCooldown = localStorage.getItem(`btc_cooldown_${user.uid}`);
    if (savedCooldown) {
      const remaining = Math.ceil((parseInt(savedCooldown) - Date.now()) / 1000);
      if (remaining > 0) setCooldown(remaining);
    }

    fetchAllPrices();
    const priceInterval = setInterval(fetchAllPrices, 5000); 
    
    return () => { unsub(); clearInterval(priceInterval); };
  }, [user, navigate]);

  // ⏱️ 쿨타임 타이머 작동
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // 📈 트레이딩뷰 위젯 (BTC 전용)
  useEffect(() => {
    if (assetType === 'BTC' && container.current) {
      container.current.innerHTML = ""; 
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify({
        "symbol": "UPBIT:BTCKRW",
        "width": "100%",
        "height": "220",
        "locale": "kr",
        "dateRange": "1D",
        "colorTheme": "dark",
        "isTransparent": false,
        "autosize": true
      });
      container.current.appendChild(script);
    }
  }, [assetType]);

  const fetchAllPrices = async () => {
    try {
      const btcRes = await axios.get("https://api.codetabs.com/v1/proxy?quest=https://api.upbit.com/v1/ticker?markets=KRW-BTC");
      if (btcRes.data && btcRes.data[0]) setBtcPrice(btcRes.data[0].trade_price);
      
      const kospiRes = await axios.get("https://api.codetabs.com/v1/proxy?quest=https://query1.finance.yahoo.com/v8/finance/chart/%5EKS11");
      if (kospiRes.data.chart.result) setKospiPrice(kospiRes.data.chart.result[0].meta.regularMarketPrice);
    } catch (e) { console.error("가격 로드 실패"); }
  };

  const calcPnl = (entry, current, pos) => {
      let priceChangePercent = ((current - entry) / entry) * 100;
      if (pos === 'SHORT') priceChangePercent *= -1;
      let pnl = priceChangePercent * LEVERAGE;
      return pnl <= -100 ? -100 : pnl;
  };

  // ⚠️ 실시간 청산 감시 (2종목 모두)
  useEffect(() => {
    ['BTC', 'KOSPI'].forEach(type => {
        const pos = positions[type];
        if (pos && !pos.isLiquidated) {
            const livePrice = type === 'BTC' ? btcPrice : kospiPrice;
            if (livePrice > 0) {
                const rate = calcPnl(pos.entryPrice, livePrice, pos.position);
                if (rate <= -100) handleLiquidation(type, pos.docId);
            }
        }
    });
  }, [btcPrice, kospiPrice, positions]);

  const handleBetPercent = (p) => { 
    if (p === 0) return setBetAmount(''); 
    setBetAmount(String(Math.floor(point * p))); 
  };

  const triggerCooldown = () => {
    const endTime = Date.now() + 30000;
    localStorage.setItem(`btc_cooldown_${user.uid}`, endTime);
    setCooldown(30);
  };

  // 🚀 게임 시작 (각 종목별)
  const startGame = async (side) => {
    if (cooldown > 0) return;
    if (positions[assetType]) return alert(`이미 ${assetType} 포지션이 존재합니다. 정산 후 다시 진입하세요!`);

    const money = parseInt(betAmount);
    const livePrice = assetType === 'BTC' ? btcPrice : kospiPrice;

    if (isNaN(money) || money <= 0) return alert("배팅 금액을 입력하세요.");
    if (money > Math.floor(point)) return alert("포인트가 부족합니다.");
    if (!livePrice) return alert("가격을 불러오는 중입니다. 잠시만 대기해주세요.");

    try {
      await updateDoc(doc(db, "users", user.uid), { point: increment(-money) });
      setPoint(prev => prev - money);

      // 문서 ID를 'uid_종목명'으로 생성하여 동시 배팅 가능하게 함
      await setDoc(doc(db, "bitcoin_positions", `${user.uid}_${assetType}`), {
          uid: user.uid,
          name: myName,
          entryPrice: livePrice,
          position: side,
          betAmount: money,
          assetType: assetType,
          startTime: serverTimestamp(),
          isLiquidated: false 
      });

      await addDoc(collection(db, "history"), { 
        uid: user.uid, type: "게임", msg: `${assetType} ${LEVERAGE}배 ${side} 진입`, amount: -money, createdAt: serverTimestamp() 
      });
    } catch (e) { alert("통신 에러가 발생했습니다."); }
  };

  // 💰 익절/정산 (각 종목별)
  const claimProfit = async (type) => {
    const targetPos = positions[type];
    if (!targetPos || targetPos.isLiquidated) return;
    
    const livePrice = type === 'BTC' ? btcPrice : kospiPrice;
    const pnl = calcPnl(targetPos.entryPrice, livePrice, targetPos.position);
    const finalMoney = Math.floor(targetPos.betAmount + (targetPos.betAmount * pnl / 100));

    try {
      if (finalMoney > 0) {
        await updateDoc(doc(db, "users", user.uid), { point: increment(finalMoney) });
        await addDoc(collection(db, "history"), { 
          uid: user.uid, type: "게임", msg: `${type} ${LEVERAGE}배 익절 (${pnl.toFixed(2)}%)`, amount: finalMoney, createdAt: serverTimestamp() 
        });
        alert(`정산 완료! +${finalMoney.toLocaleString()}P`);
      } else {
        alert("잔액이 0원이 되어 손절 처리되었습니다.");
      }
      await deleteDoc(doc(db, "bitcoin_positions", targetPos.docId));
      triggerCooldown();
    } catch (e) { console.error(e); }
  };

  // 💀 본인 청산 처리
  const handleLiquidation = async (type, docId) => {
    try {
        await updateDoc(doc(db, "bitcoin_positions", docId), { isLiquidated: true, pnlRate: -100 });
        await addDoc(collection(db, "history"), { uid: user.uid, type: "게임", msg: `${type} ${LEVERAGE}배 청산`, amount: 0, createdAt: serverTimestamp() });
    } catch(e) {}
  };

  // 💀 청산 확인 후 나가기
  const confirmLiquidation = async (type) => {
      const targetPos = positions[type];
      if (!targetPos) return;
      try { await deleteDoc(doc(db, "bitcoin_positions", targetPos.docId)); } catch(e) {}
      triggerCooldown();
  };

  // 👑 관리자 강제 청산 (되묻기 포함)
  const handleAdminForceLiquidation = async (targetUid, targetName, targetAsset) => {
    if (!isAdmin) return;
    
    // ⭐️ 한번 더 되묻기 (Confirm)
    const confirm = window.confirm(`[${targetName}]님의 [${targetAsset}] 포지션을 정말 강제 청산시키겠습니까?`);
    if (!confirm) return;

    try {
        const q = query(collection(db, "bitcoin_positions"), where("uid", "==", targetUid), where("assetType", "==", targetAsset));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
            const docId = snap.docs[0].id;
            await updateDoc(doc(db, "bitcoin_positions", docId), { isLiquidated: true, pnlRate: -100 });
            await addDoc(collection(db, "history"), { 
              uid: targetUid, type: "게임", msg: `🚨 관리자에 의한 [${targetAsset}] 강제 청산`, amount: 0, createdAt: serverTimestamp() 
            });
            alert("강제 청산이 완료되었습니다.");
        } else {
            // 구버전 데이터 호환
            await updateDoc(doc(db, "bitcoin_positions", targetUid), { isLiquidated: true, pnlRate: -100 });
            alert("강제 청산 완료 (구버전 호환)");
        }
    } catch (e) { alert("청산 처리에 실패했습니다."); }
  };

  // 현재 보고 있는 탭의 상태 계산
  const currentLivePrice = assetType === 'BTC' ? btcPrice : kospiPrice;
  const myCurrentPos = positions[assetType];
  const livePnlRate = myCurrentPos ? calcPnl(myCurrentPos.entryPrice, currentLivePrice, myCurrentPos.position) : 0;

  return (
    <div className="container" style={{ background: '#1e272e', minHeight: '100vh', color: 'white', display: 'flex', flexDirection: 'column', padding: '10px' }}>
      
      {/* 🏁 탭 선택 버튼 */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
        <button onClick={() => setAssetType('BTC')} style={{ flex: 1, padding: '12px', background: assetType === 'BTC' ? '#f39c12' : '#2c3e50', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold' }}>
          BITCOIN {positions['BTC'] && '🔴'}
        </button>
        <button onClick={() => setAssetType('KOSPI')} style={{ flex: 1, padding: '12px', background: assetType === 'KOSPI' ? '#3498db' : '#2c3e50', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold' }}>
          KOSPI {positions['KOSPI'] && '🔴'}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#2f3640', borderRadius: '10px', marginBottom: '10px' }}>
        <h1 style={{ margin: 0, fontSize: '20px', color: assetType === 'BTC' ? '#f39c12' : '#3498db' }}>⚡ {assetType} {LEVERAGE}x</h1>
        <div style={{ fontWeight: 'bold' }}>💰 {Math.floor(point).toLocaleString()}</div>
      </div>

      {/* 📈 차트 및 가격 표시 영역 */}
      {assetType === 'BTC' ? (
        <div className="tradingview-widget-container" ref={container} style={{ marginBottom: '10px', borderRadius:'10px', overflow:'hidden', minHeight: '220px' }}></div>
      ) : (
        <div style={{ background: '#111', padding: '30px', borderRadius: '10px', textAlign: 'center', marginBottom: '10px', border: '2px solid #3498db' }}>
            <div style={{ fontSize: '16px', color: '#ccc', marginBottom: '10px' }}>한국거래소 KOSPI 실시간 지수</div>
            <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#3498db' }}>{kospiPrice ? kospiPrice.toLocaleString() : '데이터 수신 중...'}</div>
            <div style={{ fontSize: '12px', color: '#e74c3c', marginTop: '10px' }}>야후 파이낸스 실시간 데이터 연동 중 🔴</div>
        </div>
      )}

      {/* 📊 내 포지션 현황 (현재 탭 기준) */}
      <div style={{ marginBottom: '20px' }}>
        {myCurrentPos ? (
          <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.3)', padding:'15px', borderRadius:'10px', border: myCurrentPos.isLiquidated ? '2px solid #e74c3c' : `1px solid ${assetType === 'BTC' ? '#f39c12' : '#3498db'}` }}>
            <div style={{ fontSize: '14px', color: '#ccc' }}>[{assetType}] 내 수익률 ({LEVERAGE}x)</div>
            <div style={{ fontSize: '40px', fontWeight: '900', color: livePnlRate > 0 ? '#2ecc71' : '#e74c3c', animation: livePnlRate <= -90 && !myCurrentPos.isLiquidated ? 'blink 1s infinite' : 'none' }}>
              {myCurrentPos.isLiquidated ? '💀 -100%' : `${livePnlRate > 0 ? '+' : ''}${livePnlRate.toFixed(2)}%`}
            </div>
            <div style={{ fontSize: '13px', color: '#aaa', marginTop:5 }}>
              진입가: {myCurrentPos.entryPrice.toLocaleString()} | <span style={{color: myCurrentPos.position === 'LONG' ? '#2ecc71' : '#e74c3c', fontWeight:'bold'}}>{myCurrentPos.position}</span>
            </div>
            
            {myCurrentPos.isLiquidated ? (
               <button onClick={() => confirmLiquidation(assetType)} style={{ width: '100%', marginTop: '15px', padding: '15px', borderRadius: '8px', border: 'none', background: '#c0392b', color: 'white', fontWeight: 'bold', fontSize: '18px' }}>💀 청산 확인 (나가기)</button>
            ) : (
               <button onClick={() => claimProfit(assetType)} style={{ width: '100%', marginTop: '15px', padding: '15px', borderRadius: '8px', border: 'none', background: '#f39c12', color: 'white', fontWeight: 'bold', fontSize: '18px' }}>💰 포지션 종료 (정산)</button>
            )}
          </div>
        ) : (
          <div className="card" style={{ background: '#2f3640', padding: '20px', borderRadius: '10px' }}>
            {cooldown > 0 ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ fontSize: '16px', color: '#f39c12', fontWeight: 'bold', marginBottom:'5px' }}>⚠️ 과도한 단타 방지 시스템</div>
                    <div style={{ fontSize: '30px', fontWeight: 'bold', color:'white' }}>{cooldown}초 대기</div>
                </div>
            ) : (
                <>
                    <input className="input" type="number" placeholder={`${assetType} 배팅 포인트`} value={betAmount} onChange={e => setBetAmount(e.target.value)} style={{ width: '100%', marginBottom: '10px', textAlign: 'center', background: '#1e272e', color: 'white', padding: '15px', border: 'none', fontSize: '18px' }} />
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                        <button onClick={() => handleBetPercent(0.1)} style={{ flex: 1, padding: '10px', background: '#7f8c8d', border: 'none', color: 'white' }}>10%</button>
                        <button onClick={() => handleBetPercent(0.5)} style={{ flex: 1, padding: '10px', background: '#7f8c8d', border: 'none', color: 'white' }}>50%</button>
                        <button onClick={() => handleBetPercent(1)} style={{ flex: 1, padding: '10px', background: '#e74c3c', border: 'none', color: 'white', fontWeight:'bold' }}>MAX</button>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => startGame('LONG')} style={{ flex: 1, padding: '20px', background: '#27ae60', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', fontSize: '20px', boxShadow: '0 5px 0 #219150' }}>🚀 LONG</button>
                        <button onClick={() => startGame('SHORT')} style={{ flex: 1, padding: '20px', background: '#c0392b', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', fontSize: '20px', boxShadow: '0 5px 0 #a93226' }}>📉 SHORT</button>
                    </div>
                </>
            )}
          </div>
        )}
      </div>

      {/* 📜 전역 포지션 리스트 (종목 표시, 관리자 강제청산 포함) */}
      <div className="card" style={{ background: '#222', padding: '15px', borderRadius: '10px', border:'1px solid #444' }}>
          <div style={{color:'#f1c40f', fontWeight:'bold', marginBottom:'10px'}}>🔥 실시간 포지션 상황 ({allPositions.length}명) <span style={{fontSize:'10px', color:'#27ae60'}}>● LIVE</span></div>
          <div style={{maxHeight:'250px', overflowY:'auto'}}>
              {allPositions.length === 0 && <div style={{textAlign:'center', color:'#777', padding:'10px'}}>진행 중인 포지션이 없습니다.</div>}
              {allPositions.map((p) => {
                  const isMe = p.uid === user?.uid;
                  const asset = p.assetType || 'BTC'; 
                  const targetLivePrice = asset === 'KOSPI' ? kospiPrice : btcPrice;
                  const pnl = targetLivePrice ? calcPnl(p.entryPrice, targetLivePrice, p.position) : 0;
                  
                  return (
                      <div key={`${p.uid}_${asset}`} style={{ display:'flex', justifyContent:'space-between', padding:'10px', marginBottom:'5px', background: isMe ? 'rgba(241, 196, 15, 0.1)' : '#2c3e50', border: isMe ? '1px solid #f1c40f' : 'none', borderRadius: '5px' }}>
                          <div style={{ fontSize: '14px' }}>
                              <b style={{color:'white'}}>{p.name}</b> <span style={{ color: asset === 'BTC' ? '#f39c12' : '#3498db', fontSize:'11px' }}>[{asset}]</span>
                              
                              {/* 👑 관리자 전용 강제 청산 버튼 */}
                              {isAdmin && !isMe && !p.isLiquidated && (
                                <button onClick={() => handleAdminForceLiquidation(p.uid, p.name, asset)} style={{ marginLeft: '10px', padding: '3px 6px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '3px', fontSize: '10px', cursor: 'pointer' }}>
                                  강제청산
                                </button>
                              )}

                              <div style={{ fontSize: '11px', color: '#aaa', marginTop:'2px' }}>{p.entryPrice.toLocaleString()} | <span style={{color: p.position === 'LONG' ? '#2ecc71' : '#e74c3c'}}>{p.position}</span></div>
                          </div>
                          <div style={{ textAlign: 'right', color: pnl > 0 ? '#2ecc71' : '#e74c3c', fontWeight: 'bold', fontSize: '16px', animation: pnl <= -90 && !p.isLiquidated ? 'blink 1s infinite' : 'none' }}>
                              {p.isLiquidated ? '💀 청산' : `${pnl > 0 ? '+' : ''}${pnl.toFixed(2)}%`}
                              <div style={{ fontSize: '10px', color: '#777', fontWeight:'normal' }}>{p.betAmount.toLocaleString()}P</div>
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>
      <style>{`@keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.2; } 100% { opacity: 1; } }`}</style>

      <button className="btn" style={{ marginTop: 20, background: '#444', width: '100%', padding: '15px' }} onClick={() => navigate('/home')}> {t.home || "홈으로"} </button>
    </div>
  );
}