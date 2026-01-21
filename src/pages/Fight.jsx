import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
// 👇 addDoc, collection, serverTimestamp 추가됨
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const styles = `
  @keyframes lunge-right { 0% { transform: translateX(0); } 50% { transform: translateX(80px) rotate(10deg); } 100% { transform: translateX(0); } }
  @keyframes lunge-left { 0% { transform: translateX(0); } 50% { transform: translateX(-80px) rotate(-10deg); } 100% { transform: translateX(0); } }
  @keyframes shake { 0% { transform: translate(0,0); } 25% { transform: translate(5px, 5px); } 50% { transform: translate(-5px, -5px); } 75% { transform: translate(5px, -5px); } 100% { transform: translate(0,0); } }
  @keyframes float-up { 0% { opacity: 1; transform: translateY(0) scale(1); } 100% { opacity: 0; transform: translateY(-50px) scale(1.5); } }
  .arena { position: relative; width: 100%; height: 350px; background: #222; border-radius: 15px; overflow: hidden; border: 4px solid #444; box-shadow: inset 0 0 50px rgba(0,0,0,0.8); }
  .fighter-container { position: absolute; bottom: 40px; width: 120px; text-align: center; transition: all 0.1s; }
  .fighter-img { width: 140px; height: 140px; object-fit: contain; filter: drop-shadow(0 10px 10px rgba(0,0,0,0.5)); transition: transform 0.1s; }
  .hp-bar-bg { width: 100%; height: 12px; background: #555; border-radius: 6px; overflow: hidden; margin-top: 10px; border: 1px solid #000; }
  .hp-fill { height: 100%; transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
  .damage-text { position: absolute; top: -50px; left: 50%; transform: translateX(-50%); font-weight: bold; font-size: 28px; color: #ff4757; text-shadow: 2px 2px 0 #000; animation: float-up 0.8s forwards; pointer-events: none; width: 200px; text-align: center; }
  .crit-text { color: #f1c40f !important; font-size: 35px !important; }
`;

export default function Fight() {
  // ... (기존 state들) ...
  const [point, setPoint] = useState(0);
  const [bet, setBet] = useState('');
  const [gameState, setGameState] = useState('betting'); 
  const [selectedSide, setSelectedSide] = useState(null);
  const [redCharId, setRedCharId] = useState(1);
  const [blueCharId, setBlueCharId] = useState(2);
  const [red, setRed] = useState({ hp: 100, action: '', effect: null });
  const [blue, setBlue] = useState({ hp: 100, action: '', effect: null });
  const [log, setLog] = useState("응원할 파이터를 선택하세요!");
  const timerRef = useRef(null);
  const navigate = useNavigate();
  const user = auth.currentUser;

  // ... (useEffect, fetchPoint, handleBetPercent 그대로) ...
  useEffect(() => { if (!user) { navigate('/login'); return; } fetchPoint(); return () => clearInterval(timerRef.current); }, [user, navigate]);
  const fetchPoint = async () => { try { const d = await getDoc(doc(db, "users", user.uid)); if (d.exists()) setPoint(d.data().point || 0); } catch (e) { console.error(e); } };
  const handleBetPercent = (percent) => { if (percent === 0) { setBet(''); return; } const amount = Math.floor(point * percent); setBet(String(amount)); };

  const startFight = async () => {
    const betMoney = parseInt(bet);
    if (!selectedSide) return alert("파이터를 선택해주세요!");
    if (isNaN(betMoney) || betMoney <= 0) return alert("배팅 금액을 확인하세요.");
    if (betMoney > Math.floor(point)) return alert("포인트가 부족합니다.");

    try {
      await updateDoc(doc(db, "users", user.uid), { point: increment(-betMoney) });
      setPoint(prev => prev - betMoney);
      
      // ✅ [기록 추가] 베팅 로그
      await addDoc(collection(db, "history"), {
          uid: user.uid,
          type: "게임",
          msg: `파이트 배팅 (${selectedSide === 'red' ? '레드팀' : '블루팀'})`,
          amount: -betMoney,
          createdAt: serverTimestamp()
      });

      // ... (캐릭터 설정 및 게임 초기화 로직) ...
      const rId = Math.floor(Math.random() * 10) + 1; 
      let bId = Math.floor(Math.random() * 10) + 1; 
      if (rId === bId) { bId = bId === 10 ? 1 : bId + 1; }
      setRedCharId(rId); setBlueCharId(bId);
      setGameState('fighting'); setRed({ hp: 100, action: '', effect: null }); setBlue({ hp: 100, action: '', effect: null }); setLog("🔔 ROUND 1 - FIGHT!");
      runGameLoop(betMoney);
    } catch (e) {
      alert("서버 오류: " + e.message);
    }
  };

  // ... (runGameLoop, getAnim 등 그대로 유지) ...
  const runGameLoop = (betMoney) => {
    let rHP = 100; let bHP = 100;
    timerRef.current = setInterval(() => {
      const isRedAttacking = Math.random() > 0.5;
      let damage = Math.floor(Math.random() * 16) + 10;
      let isCrit = Math.random() < 0.2; 
      let isDodge = Math.random() < 0.15; 
      if (isCrit) damage = Math.floor(damage * 1.8); if (isDodge) damage = 0;

      if (isRedAttacking) { setRed(prev => ({ ...prev, action: 'attack-right' })); setTimeout(() => setRed(prev => ({ ...prev, action: '' })), 200); if (isDodge) { setBlue(prev => ({ ...prev, effect: 'MISS 💨' })); setLog("블루팀 회피 성공!"); } else { bHP = Math.max(0, bHP - damage); setBlue(prev => ({ hp: bHP, action: 'hit', effect: isCrit ? `CRITICAL! -${damage}` : `-${damage}` })); setLog(isCrit ? `💥 레드팀 치명타!! (-${damage})` : `👊 레드팀 공격! (-${damage})`); } } 
      else { setBlue(prev => ({ ...prev, action: 'attack-left' })); setTimeout(() => setBlue(prev => ({ ...prev, action: '' })), 200); if (isDodge) { setRed(prev => ({ ...prev, effect: 'MISS 💨' })); setLog("레드팀 회피 성공!"); } else { rHP = Math.max(0, rHP - damage); setRed(prev => ({ hp: rHP, action: 'hit', effect: isCrit ? `CRITICAL! -${damage}` : `-${damage}` })); setLog(isCrit ? `💥 블루팀 치명타!! (-${damage})` : `👊 블루팀 공격! (-${damage})`); } }

      if (rHP <= 0 || bHP <= 0) { clearInterval(timerRef.current); const winner = rHP > 0 ? 'red' : 'blue'; setTimeout(() => finalizeGame(winner, betMoney), 1000); }
      setTimeout(() => { setRed(prev => ({ ...prev, effect: null, action: prev.action === 'hit' ? '' : prev.action })); setBlue(prev => ({ ...prev, effect: null, action: prev.action === 'hit' ? '' : prev.action })); }, 800);
    }, 1200); 
  };
  const getAnim = (side, state) => { if (state.action === 'attack-right') return { animation: 'lunge-right 0.2s' }; if (state.action === 'attack-left') return { animation: 'lunge-left 0.2s' }; if (state.action === 'hit') return { animation: 'shake 0.3s', filter: 'brightness(2) sepia(1) hue-rotate(-50deg)' }; return {}; };

  const finalizeGame = async (winner, betMoney) => {
    setGameState('result');
    const isWin = winner === selectedSide;
    
    if (isWin) {
      const prize = betMoney * 1.98;
      setLog(`🎉 경기 종료! ${winner === 'red' ? '레드팀' : '블루팀'} 승리! (+${prize.toLocaleString()}원)`);
      try {
        await updateDoc(doc(db, "users", user.uid), { point: increment(prize) });
        setPoint(prev => prev + prize);

        // ✅ [기록 추가] 승리 로그
        await addDoc(collection(db, "history"), {
            uid: user.uid,
            type: "게임",
            msg: "파이트 승리",
            amount: prize,
            createdAt: serverTimestamp()
        });

      } catch(e) {}
    } else {
      setLog(`💀 경기 종료... ${winner === 'red' ? '레드팀' : '블루팀'}의 승리입니다.`);
    }
  };

  return (
    // ... (기존 UI 그대로) ...
    <div className="container" style={{ background: '#131517', minHeight: '100vh', padding: '20px', color: 'white', textAlign: 'center' }}>
      <style>{styles}</style>
      <h1 className="title" style={{ color: '#e74c3c', fontStyle: 'italic' }}>🥊 UNDERGROUND FIGHT</h1>
      <div className="arena" style={{ marginBottom: 20 }}>
        <div style={{ position: 'absolute', top: 15, left: 15, right: 15, display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
            <div style={{ width: '45%' }}> <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}> <span style={{ fontWeight: 'bold', color: '#ff4757' }}>RED TEAM</span> <span>{red.hp}%</span> </div> <div className="hp-bar-bg"><div className="hp-fill" style={{ width: `${red.hp}%`, background: '#ff4757' }} /></div> </div>
            <div style={{ fontSize: 24, fontWeight: 'bold', paddingTop: 10, color: '#666' }}>VS</div>
            <div style={{ width: '45%' }}> <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}> <span>{blue.hp}%</span> <span style={{ fontWeight: 'bold', color: '#3742fa' }}>BLUE TEAM</span> </div> <div className="hp-bar-bg"><div className="hp-fill" style={{ width: `${blue.hp}%`, background: '#3742fa' }} /></div> </div>
        </div>
        <div className="fighter-container" style={{ left: '15%', ...getAnim('red', red) }}> {red.hp <= 0 ? ( <div style={{ fontSize: '80px' }}>😵</div> ) : ( <img src={`/fight/${redCharId}.png`} className="fighter-img" alt="Red Fighter" style={{ filter: 'drop-shadow(0 0 10px rgba(255,0,0,0.3))' }} onError={(e) => {e.target.style.display='none'}} /> )} {red.effect && ( <div className={`damage-text ${red.effect.includes('CRIT') ? 'crit-text' : ''}`}> {red.effect} </div> )} </div>
        <div className="fighter-container" style={{ right: '15%', ...getAnim('blue', blue) }}> {blue.hp <= 0 ? ( <div style={{ fontSize: '80px' }}>😵</div> ) : ( <img src={`/fight/${blueCharId}.png`} className="fighter-img" alt="Blue Fighter" style={{ transform: 'scaleX(-1)', filter: 'drop-shadow(0 0 10px rgba(0,0,255,0.3))' }} onError={(e) => {e.target.style.display='none'}} /> )} {blue.effect && ( <div className={`damage-text ${blue.effect.includes('CRIT') ? 'crit-text' : ''}`}> {blue.effect} </div> )} </div>
        <div style={{ position: 'absolute', bottom: 20, width: '100%', borderBottom: '4px solid #444' }}></div>
      </div>
      <div className="card" style={{ background: '#222', color: '#f1c40f', minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold', border: '1px solid #444', marginBottom: 20 }}> {log} </div>
      {gameState !== 'fighting' && (
        <div style={{ animation: 'bounce-in 0.5s' }}>
          <div className="card" style={{ background: '#1e272e', padding: '20px' }}>
            <div style={{ fontSize: 18, marginBottom: 15, color: '#ccc' }}> 보유: <span style={{ color: '#f1c40f', fontWeight: 'bold' }}>{Math.floor(point).toLocaleString()}원</span> </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <button className="btn" style={{ flex: 1, background: selectedSide === 'red' ? '#ff4757' : '#444', height: 60, fontSize: 18, border: selectedSide === 'red' ? '3px solid white' : 'none' }} onClick={() => setSelectedSide('red')}> 👹 레드팀 (x1.98) </button>
                <button className="btn" style={{ flex: 1, background: selectedSide === 'blue' ? '#3742fa' : '#444', height: 60, fontSize: 18, border: selectedSide === 'blue' ? '3px solid white' : 'none' }} onClick={() => setSelectedSide('blue')}> 🤖 블루팀 (x1.98) </button>
            </div>
            <input className="input" type="number" placeholder="배팅 금액" value={bet} onChange={e => setBet(e.target.value)} style={{ textAlign: 'center', fontSize: 20, width: '100%', marginBottom: 15 }} />
            <div style={{display:'flex', gap:5, marginBottom:20}}>
                <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.1)}>10%</button>
                <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.25)}>25%</button>
                <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.5)}>50%</button>
                <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#e74c3c', color:'white', fontWeight:'bold'}} onClick={()=>handleBetPercent(1)}>ALL</button>
                <button className="btn" style={{width:40, padding:5, fontSize:12, background:'#95a5a6'}} onClick={()=>handleBetPercent(0)}>🔄</button>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '15px', fontSize: '20px', fontWeight: 'bold' }} onClick={startFight}> 경기 시작 (START) </button>
          </div>
        </div>
      )}
      {gameState !== 'fighting' && ( <button className="btn" style={{ marginTop: 20, background: '#333', width: '100%', padding: '15px' }} onClick={() => navigate('/home')}> 🏠 홈으로 돌아가기 </button> )}
    </div>
  );
}