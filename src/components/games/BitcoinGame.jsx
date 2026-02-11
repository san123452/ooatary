import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { db, auth } from '../../firebase';
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../LanguageContext';
// 👇 수정된 부분: Context import
import { usePositions } from '../PositionContext'; 

export default function BitcoinGame() {
  const [point, setPoint] = useState(0);
  const [myName, setMyName] = useState("익명");
  const [betAmount, setBetAmount] = useState('');
  const [currentPrice, setCurrentPrice] = useState(0); 
  const [entryPrice, setEntryPrice] = useState(0); 
  const [position, setPosition] = useState(null); 
  const [gameState, setGameState] = useState('idle'); 
  const [pnlRate, setPnlRate] = useState(0);
  const [betMoney, setBetMoney] = useState(0); 
  
  // ✅ Context에서 가져오기 (DB 자동갱신 없음, 여기서 관리됨)
  const { allPositions, lastFetch, refreshPositions } = usePositions();

  const navigate = useNavigate();
  const user = auth.currentUser;
  const { t } = useLanguage();
  const container = useRef(); 

  const LEVERAGE = 50;

  // 1. 초기화
  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    
    const fetchUserData = async () => {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            const data = snap.data();
            setPoint(data.point || 0);
            setMyName(data.name || "익명");
        }
    };
    fetchUserData();

    // 내 진행 중인 게임 복구
    const myGameRef = doc(db, "bitcoin_positions", user.uid);
    getDoc(myGameRef).then(snap => {
        if(snap.exists()) {
            const save = snap.data();
            setGameState('running');
            setEntryPrice(save.entryPrice);
            setPosition(save.position);
            setBetMoney(save.betAmount);
        }
    });

    // ✅ 가격 조회만 주기적으로 실행 (3초) - 무료 API
    const priceInterval = setInterval(fetchBtcPrice, 5000); 
    
    return () => {
        clearInterval(priceInterval);
    };
  }, [user, navigate]);

  // 2. TradingView 차트
  useEffect(() => {
    if (container.current && !container.current.firstChild) {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = `
        {
          "symbol": "UPBIT:BTCKRW",
          "width": "100%",
          "height": "220",
          "locale": "kr",
          "dateRange": "1D",
          "colorTheme": "dark",
          "isTransparent": false,
          "autosize": true,
          "largeChartUrl": ""
        }`;
      container.current.appendChild(script);
    }
  }, []);

  const fetchBtcPrice = async () => {
    try {
      // 1. 프록시 URL을 앞에 붙여서 우회합니다.
      const proxyUrl = "https://api.allorigins.win/raw?url=";
      const targetUrl = "https://api.upbit.com/v1/ticker?markets=KRW-BTC";
      
      const res = await axios.get(proxyUrl + encodeURIComponent(targetUrl));
      
      // 2. 데이터 구조에 맞게 가격을 가져옵니다.
      if (res.data && res.data[0]) {
        setCurrentPrice(res.data[0].trade_price);
      }
    } catch (e) {
      console.error("가격 조회 실패 (잠시 후 다시 시도):", e);
    }
  };

  const calcPnl = (entry, current, pos) => {
      let priceChangePercent = ((current - entry) / entry) * 100;
      if (pos === 'SHORT') priceChangePercent *= -1;
      let pnl = priceChangePercent * LEVERAGE;
      if (pnl <= -100) return -100;
      return pnl;
  };

  // 3. 내 수익률 계산 및 청산 체크
  useEffect(() => {
    if (gameState === 'running' && entryPrice > 0 && currentPrice > 0) {
      const rate = calcPnl(entryPrice, currentPrice, position);
      setPnlRate(rate);
      if (rate <= -100) {
        handleLiquidation();
      }
    }
  }, [currentPrice, gameState, entryPrice, position]);

  const handleBetPercent = (percent) => { 
    if (percent === 0) { setBetAmount(''); return; } 
    const amount = Math.floor(point * percent); 
    setBetAmount(String(amount)); 
  };

  // 🚀 게임 시작
  const startGame = async (side) => {
    const money = parseInt(betAmount);
    if (isNaN(money) || money <= 0) return alert(t.alertInputBet || "금액 입력!");
    if (money > Math.floor(point)) return alert(t.alertNoMoney || "포인트 부족!");
    if (!currentPrice) return alert("로딩중...");

    try {
      await updateDoc(doc(db, "users", user.uid), { point: increment(-money) });
      setPoint(prev => prev - money);

      await setDoc(doc(db, "bitcoin_positions", user.uid), {
          uid: user.uid,
          name: myName,
          entryPrice: currentPrice,
          position: side,
          betAmount: money,
          startTime: serverTimestamp()
      });

      setEntryPrice(currentPrice);
      setPosition(side);
      setBetMoney(money);
      setGameState('running');
      setPnlRate(0);

      await addDoc(collection(db, "history"), { 
        uid: user.uid, type: "게임", msg: `BTC ${LEVERAGE}배 ${side} 진입`, amount: -money, createdAt: serverTimestamp() 
      });

      // ✅ 게임 시작 시 목록 갱신 (Context 함수 호출)
      // refreshPositions(); (Context에 이 함수가 있다고 가정하거나, 없으면 아래처럼 수동 갱신 로직 필요.
      // 하지만 Context가 onSnapshot을 쓰고 있다면 자동으로 갱신됩니다!)

    } catch (e) { console.error(e); alert("Error"); }
  };

  // 💰 정산
  const claimProfit = async () => {
    if (gameState !== 'running') return;
    const profitRate = pnlRate;
    const finalMoney = Math.floor(betMoney + (betMoney * profitRate / 100));

    try {
      if (finalMoney > 0) {
        await updateDoc(doc(db, "users", user.uid), { point: increment(finalMoney) });
        setPoint(prev => prev + finalMoney);
        await addDoc(collection(db, "history"), { 
          uid: user.uid, type: "게임", msg: `BTC ${LEVERAGE}배 익절 (${profitRate.toFixed(2)}%)`, amount: finalMoney, createdAt: serverTimestamp() 
        });
        alert(`정산 완료! +${finalMoney.toLocaleString()}P`);
      } else {
        alert("손절... 잔액이 0원이 되었습니다.");
      }
      
      await deleteDoc(doc(db, "bitcoin_positions", user.uid));

    } catch (e) { console.error(e); }
    
    resetGame();
  };

  const handleLiquidation = async () => {
    setGameState('finished');
    try {
        await deleteDoc(doc(db, "bitcoin_positions", user.uid));
        await addDoc(collection(db, "history"), { 
            uid: user.uid, type: "게임", msg: `BTC ${LEVERAGE}배 청산`, amount: 0, createdAt: serverTimestamp() 
        });
    } catch(e) {}
    alert("💀 청산 당했습니다! (복구 불가)");
    resetGame();
  };

  const resetGame = () => {
    setGameState('idle');
    setEntryPrice(0);
    setPosition(null);
    setPnlRate(0);
    setBetAmount('');
    setBetMoney(0);
  };

  return (
    <div className="container" style={{ background: '#1e272e', minHeight: '100vh', color: 'white', display: 'flex', flexDirection: 'column', padding: '10px' }}>
      
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#2f3640', borderRadius: '10px', marginBottom: '10px' }}>
        <h1 style={{ margin: 0, fontSize: '20px', color: '#f39c12' }}>⚡ BTC {LEVERAGE}x</h1>
        <div style={{ fontWeight: 'bold' }}>💰 {Math.floor(point).toLocaleString()}</div>
      </div>

      {/* 📊 TradingView 차트 */}
      <div className="tradingview-widget-container" ref={container} style={{ marginBottom: '10px', borderRadius:'10px', overflow:'hidden' }}></div>

      {/* 내 상태 표시 */}
      <div style={{ marginBottom: '20px' }}>
        {gameState === 'running' && (
          <div style={{ textAlign: 'center', background:'rgba(0,0,0,0.3)', padding:'15px', borderRadius:'10px' }}>
            <div style={{ fontSize: '14px', color: '#ccc' }}>내 수익률 ({LEVERAGE}x)</div>
            <div style={{ fontSize: '40px', fontWeight: '900', color: pnlRate > 0 ? '#2ecc71' : '#e74c3c' }}>
              {pnlRate > 0 ? '+' : ''}{pnlRate.toFixed(2)}%
            </div>
            <div style={{ fontSize: '12px', color: '#aaa', marginTop:5 }}>
              진입: {entryPrice.toLocaleString()} | <span style={{color: position === 'LONG' ? '#2ecc71' : '#e74c3c', fontWeight:'bold'}}>{position}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#e74c3c', marginTop:5 }}>
              ⚠️ 청산가: {position === 'LONG' 
                ? Math.floor(entryPrice * 0.98).toLocaleString()
                : Math.floor(entryPrice * 1.02).toLocaleString()
              }
            </div>
          </div>
        )}
      </div>

      {/* 컨트롤 패널 */}
      <div className="card" style={{ background: '#2f3640', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
        {gameState === 'idle' ? (
          <>
            <input className="input" type="number" placeholder="배팅 포인트" value={betAmount} onChange={e => setBetAmount(e.target.value)} style={{ width: '100%', marginBottom: '10px', textAlign: 'center', background: '#1e272e', color: 'white', border:'none', fontSize: '18px', padding: '15px' }} />
            <div style={{display:'flex', gap:5, marginBottom:20}}>
                <button className="btn" style={{flex:1, padding:10, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.1)}>10%</button>
                <button className="btn" style={{flex:1, padding:10, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.5)}>50%</button>
                <button className="btn" style={{flex:1, padding:10, background:'#e74c3c', fontWeight:'bold'}} onClick={()=>handleBetPercent(1)}>MAX</button>
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
                <button onClick={() => startGame('LONG')} style={{ flex: 1, padding: '20px', borderRadius: '10px', border: 'none', background: '#27ae60', color: 'white', fontSize: '24px', fontWeight: 'bold', boxShadow: '0 5px 0 #219150' }}>🚀 LONG</button>
                <button onClick={() => startGame('SHORT')} style={{ flex: 1, padding: '20px', borderRadius: '10px', border: 'none', background: '#c0392b', color: 'white', fontSize: '24px', fontWeight: 'bold', boxShadow: '0 5px 0 #a93226' }}>📉 SHORT</button>
            </div>
          </>
        ) : (
          <button onClick={claimProfit} style={{ width: '100%', padding: '20px', borderRadius: '10px', border: 'none', background: '#f39c12', color: 'white', fontSize: '22px', fontWeight: 'bold', boxShadow: '0 5px 0 #d35400' }}>
             💰 포지션 종료 (정산)
          </button>
        )}
      </div>

      {/* 🔥 포지션 현황판 (Context 데이터 사용) */}
      <div className="card" style={{ background: '#222', padding: '15px', borderRadius: '10px', border:'1px solid #444' }}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px', borderBottom:'1px solid #444', paddingBottom:'5px'}}>
              <div style={{color:'#f1c40f', fontWeight:'bold'}}>
                  🔥 포지션 현황 ({allPositions.length}명) 
                  <span style={{fontSize:'10px', color:'#27ae60', marginLeft:'5px'}}>● 실시간</span>
              </div>
          </div>
          {allPositions.length === 0 ? (
              <div style={{textAlign:'center', color:'#555', padding:'20px'}}>진행 중인 유저가 없습니다.</div>
          ) : (
              <div style={{maxHeight:'300px', overflowY:'auto'}}>
                  {allPositions.map((p) => {
                      const livePnl = currentPrice ? calcPnl(p.entryPrice, currentPrice, p.position) : 0;
                      const isMe = p.uid === user?.uid;

                      return (
                          <div key={p.uid} style={{ 
                              display:'flex', justifyContent:'space-between', alignItems:'center', 
                              padding:'10px', marginBottom:'5px', borderRadius:'5px',
                              background: isMe ? 'rgba(241, 196, 15, 0.1)' : '#2c3e50',
                              border: isMe ? '1px solid #f1c40f' : 'none'
                          }}>
                              <div>
                                  <div style={{fontSize:'14px', fontWeight:'bold', color:'white'}}>
                                      {p.name} {isMe && <span style={{fontSize:'10px', color:'#f1c40f'}}>(나)</span>}
                                  </div>
                                  <div style={{fontSize:'11px', color:'#aaa'}}>
                                      {p.entryPrice.toLocaleString()}에 <span style={{color: p.position==='LONG'?'#2ecc71':'#e74c3c', fontWeight:'bold'}}>{p.position}</span>
                                  </div>
                              </div>
                              <div style={{textAlign:'right'}}>
                                  <div style={{fontSize:'16px', fontWeight:'bold', color: livePnl>0?'#2ecc71':(livePnl<0?'#e74c3c':'white')}}>
                                      {livePnl > 0 ? '+' : ''}{livePnl.toFixed(2)}%
                                  </div>
                                  <div style={{fontSize:'10px', color:'#777'}}>
                                      {p.betAmount.toLocaleString()}P
                                  </div>
                              </div>
                          </div>
                      );
                  })}
              </div>
          )}
          <div style={{textAlign:'center', fontSize:'10px', color:'#666', marginTop:'10px'}}>
              마지막 업데이트: {lastFetch ? new Date(lastFetch).toLocaleTimeString() : '-'}
          </div>
      </div>

      <button className="btn" style={{ marginTop: 20, background: '#444', width: '100%', padding: '15px' }} onClick={() => navigate('/home')}>
          {t.home || "홈으로"}
      </button>
    </div>
  );
}