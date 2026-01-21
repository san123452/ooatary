import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
// 👇 addDoc, collection, serverTimestamp 추가됨
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function Ladder() {
  const [point, setPoint] = useState(0);
  const [bet, setBet] = useState('');
  const [betType, setBetType] = useState('single');
  const [selectedBet, setSelectedBet] = useState(null); 
  const [gameState, setGameState] = useState('betting');
  const [result, setResult] = useState({ start: '좌', lines: 3, end: '짝' });
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => { if (!user) { navigate('/login'); return; } fetchPoint(); }, [user, navigate]);
  const fetchPoint = async () => { try { const d = await getDoc(doc(db, "users", user.uid)); if (d.exists()) setPoint(d.data().point || 0); } catch (e) { console.error(e); } };
  const handleBetPercent = (percent) => { if (percent === 0) { setBet(''); return; } const amount = Math.floor(point * percent); setBet(String(amount)); };
  const getEndNode = (start, lines) => { if (start === '좌') return lines === 3 ? '짝' : '홀'; return lines === 3 ? '홀' : '짝'; };

  const startLadder = async () => {
    const betMoney = parseInt(bet);
    if (isNaN(betMoney) || betMoney <= 0) return alert("배팅 금액을 입력하세요!");
    if (betMoney > Math.floor(point)) return alert("돈이 부족합니다!");
    if (!selectedBet) return alert("배팅 항목을 선택하세요!");

    setGameState('racing');

    try {
      await updateDoc(doc(db, "users", user.uid), { point: increment(-betMoney) });
      setPoint(prev => prev - betMoney);

      // ✅ [기록 추가] 베팅 로그
      await addDoc(collection(db, "history"), {
          uid: user.uid,
          type: "게임",
          msg: `사다리 베팅 (${selectedBet})`,
          amount: -betMoney,
          createdAt: serverTimestamp()
      });

    } catch (e) {
      alert("⚠️ 서버 할당량 초과!");
      setGameState('betting'); return;
    }

    const resStart = Math.random() > 0.5 ? '좌' : '우';
    const resLines = Math.random() > 0.5 ? 3 : 4;
    const resEnd = getEndNode(resStart, resLines);
    setResult({ start: resStart, lines: resLines, end: resEnd });
    setTimeout(() => handleFinish(resStart, resLines, resEnd, betMoney), 4000);
  };

  const handleFinish = async (s, l, e, betMoney) => {
    setGameState('finished');
    let isWin = false;
    let multiplier = 1.95;

    if (betType === 'single') {
      if (selectedBet === e) isWin = true;
      multiplier = 1.95;
    } else {
      const comboName = `${s}${l}${e}`;
      if (selectedBet === comboName) isWin = true;
      multiplier = 3.80;
    }

    if (isWin) {
      const prize = Math.floor(betMoney * multiplier);
      setPoint(prev => prev + prize);
      await updateDoc(doc(db, "users", user.uid), { point: increment(prize) });
      
      // ✅ [기록 추가] 당첨 로그
      await addDoc(collection(db, "history"), {
          uid: user.uid,
          type: "게임",
          msg: `사다리 적중 (${selectedBet})`,
          amount: prize,
          createdAt: serverTimestamp()
      });

      alert(`🎉 적중! [${s}-${l}줄-${e}] (+${prize.toLocaleString()}원)`);
    } else {
      alert(`😭 미적중... 결과는 [${s}-${l}줄-${e}] 입니다.`);
    }
    setGameState('betting');
  };

  const getAnimClass = () => { if (gameState !== 'racing') return ""; const { start, lines } = result; if (start === '좌' && lines === 3) return "anim-l3"; if (start === '좌' && lines === 4) return "anim-l4"; if (start === '우' && lines === 3) return "anim-r3"; if (start === '우' && lines === 4) return "anim-r4"; return ""; };

  return (
    // ... (기존 UI 유지) ...
    <div className="container" style={{ background: '#222', minHeight: '100vh', color: 'white', textAlign: 'center', padding: '10px' }}>
      <h1 style={{ color: '#f1c40f', fontSize: '22px', margin: '15px 0' }}>🪜 네임드 사다리</h1>
      <div className="card" style={{ background: '#333', padding: '10px', marginBottom: '20px' }}>💰 {Math.floor(point).toLocaleString()}원</div>
      <div className="ladder-board">
        <div className="rail left-rail" /> <div className="rail right-rail" />
        {gameState !== 'betting' && Array.from({ length: result.lines }).map((_, i) => ( <div key={i} className="rung" style={{ top: `${20 + (i * (60 / (result.lines - 1)))}%` }} /> ))}
        <div className="label start-l">좌</div> <div className="label start-r">우</div> <div className="label end-l" style={{color: '#3498db'}}>홀</div> <div className="label end-r" style={{color: '#e74c3c'}}>짝</div>
        {gameState === 'racing' && <div className={`ball ${getAnimClass()}`} />}
      </div>
      <div className="card" style={{ background: '#2c3e50', padding: '15px' }}>
        <div style={{ display: 'flex', gap: '5px', marginBottom: '15px', borderBottom: '1px solid #555', paddingBottom: '10px' }}>
          <button className="btn" style={{ flex: 1, background: betType === 'single' ? '#f1c40f' : '#444', color: betType === 'single' ? 'black' : '#ccc' }} onClick={() => {setBetType('single'); setSelectedBet(null);}}> 홀/짝 (1.95) </button>
          <button className="btn" style={{ flex: 1, background: betType === 'combo' ? '#f1c40f' : '#444', color: betType === 'combo' ? 'black' : '#ccc' }} onClick={() => {setBetType('combo'); setSelectedBet(null);}}> 조합 (3.80) </button>
        </div>
        {betType === 'single' ? (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button className="btn" style={{ flex: 1, height: '50px', background: selectedBet === '홀' ? '#3498db' : '#333', border: selectedBet === '홀' ? '2px solid #fff' : '1px solid #555' }} onClick={() => setSelectedBet('홀')}> 🔵 홀 <span style={{fontSize:'12px', color:'#ccc'}}>(1.95)</span> </button>
            <button className="btn" style={{ flex: 1, height: '50px', background: selectedBet === '짝' ? '#e74c3c' : '#333', border: selectedBet === '짝' ? '2px solid #fff' : '1px solid #555' }} onClick={() => setSelectedBet('짝')}> 🔴 짝 <span style={{fontSize:'12px', color:'#ccc'}}>(1.95)</span> </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '15px' }}>
            <button className="btn" style={{ background: selectedBet === '좌3짝' ? '#f39c12' : '#444', fontSize: '13px' }} onClick={() => setSelectedBet('좌3짝')}>좌3짝 (3.80)</button>
            <button className="btn" style={{ background: selectedBet === '좌4홀' ? '#f39c12' : '#444', fontSize: '13px' }} onClick={() => setSelectedBet('좌4홀')}>좌4홀 (3.80)</button>
            <button className="btn" style={{ background: selectedBet === '우3홀' ? '#f39c12' : '#444', fontSize: '13px' }} onClick={() => setSelectedBet('우3홀')}>우3홀 (3.80)</button>
            <button className="btn" style={{ background: selectedBet === '우4짝' ? '#f39c12' : '#444', fontSize: '13px' }} onClick={() => setSelectedBet('우4짝')}>우4짝 (3.80)</button>
          </div>
        )}
        <input className="input" type="number" placeholder="배팅 금액" value={bet} onChange={e => setBet(e.target.value)} style={{ textAlign: 'center', marginBottom: '10px' }} />
        <div style={{display:'flex', gap:5, marginBottom:15}}>
            <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.1)}>10%</button>
            <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.25)}>25%</button>
            <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.5)}>50%</button>
            <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#e74c3c', color:'white', fontWeight:'bold'}} onClick={()=>handleBetPercent(1)}>ALL</button>
            <button className="btn" style={{width:40, padding:5, fontSize:12, background:'#95a5a6'}} onClick={()=>handleBetPercent(0)}>🔄</button>
        </div>
        <button className="btn btn-primary" style={{ width: '100%', padding: '15px', fontSize: '18px' }} onClick={startLadder} disabled={gameState === 'racing'}> {gameState === 'racing' ? '결과 확인 중...' : '배팅 완료'} </button>
      </div>
      <button className="btn" style={{ marginTop: 20, background: '#444', width: '100%' }} onClick={() => navigate('/home')}>🏠 홈으로</button>
      <style>{` .ladder-board { position: relative; width: 200px; height: 260px; margin: 0 auto 20px; background: #111; border: 3px solid #666; border-radius: 8px; } .rail { position: absolute; top: 20px; bottom: 20px; width: 4px; background: #888; } .left-rail { left: 40px; } .right-rail { right: 40px; } .rung { position: absolute; left: 44px; right: 44px; height: 4px; background: #888; } .label { position: absolute; font-weight: bold; font-size: 14px; } .start-l { top: 0; left: 35px; color: #fff; } .start-r { top: 0; right: 35px; color: #fff; } .end-l { bottom: 0; left: 35px; } .end-r { bottom: 0; right: 35px; } .ball { position: absolute; width: 12px; height: 12px; background: #f1c40f; border-radius: 50%; box-shadow: 0 0 8px #f1c40f; z-index: 10; } .anim-l3 { animation: path-l3 4s linear forwards; } @keyframes path-l3 { 0% { top: 20px; left: 36px; } 15% { top: 72px; left: 36px; } 25% { top: 72px; left: 152px; } 40% { top: 132px; left: 152px; } 50% { top: 132px; left: 36px; } 65% { top: 192px; left: 36px; } 75% { top: 192px; left: 152px; } 100% { top: 240px; left: 152px; } } .anim-l4 { animation: path-l4 4s linear forwards; } @keyframes path-l4 { 0% { top: 20px; left: 36px; } 10% { top: 60px; left: 36px; } 20% { top: 60px; left: 152px; } 30% { top: 100px; left: 152px; } 40% { top: 100px; left: 36px; } 50% { top: 140px; left: 36px; } 60% { top: 140px; left: 152px; } 70% { top: 180px; left: 152px; } 80% { top: 180px; left: 36px; } 100% { top: 240px; left: 36px; } } .anim-r3 { animation: path-r3 4s linear forwards; } @keyframes path-r3 { 0% { top: 20px; left: 152px; } 15% { top: 72px; left: 152px; } 25% { top: 72px; left: 36px; } 40% { top: 132px; left: 36px; } 50% { top: 132px; left: 152px; } 65% { top: 192px; left: 152px; } 75% { top: 192px; left: 36px; } 100% { top: 240px; left: 36px; } } .anim-r4 { animation: path-r4 4s linear forwards; } @keyframes path-r4 { 0% { top: 20px; left: 152px; } 10% { top: 60px; left: 152px; } 20% { top: 60px; left: 36px; } 30% { top: 100px; left: 36px; } 40% { top: 100px; left: 152px; } 50% { top: 140px; left: 152px; } 60% { top: 140px; left: 36px; } 70% { top: 180px; left: 36px; } 80% { top: 180px; left: 152px; } 100% { top: 240px; left: 152px; } } `}</style>
    </div>
  );
}