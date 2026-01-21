import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
// 👇 addDoc, collection, serverTimestamp 추가됨
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const styles = ` @keyframes gallop { 0% { transform: translateY(0) rotate(0deg); } 25% { transform: translateY(-5px) rotate(-5deg); } 50% { transform: translateY(0) rotate(0deg); } 75% { transform: translateY(-5px) rotate(5deg); } 100% { transform: translateY(0) rotate(0deg); } } @keyframes dust { 0% { opacity: 0; transform: translateX(0) scale(0.5); } 50% { opacity: 1; transform: translateX(-20px) scale(1.2); } 100% { opacity: 0; transform: translateX(-40px) scale(1.5); } } .horse-running { animation: gallop 0.4s infinite linear; } .track-line { border-bottom: 2px dashed #555; height: 60px; position: relative; display: flex; alignItems: center; } .finish-line { position: absolute; right: 20px; top: 0; bottom: 0; width: 10px; background-image: repeating-linear-gradient(45deg, #000 0, #000 10px, #fff 10px, #fff 20px); z-index: 1; border: 2px solid #fff; } .odds-tag { font-size: 11px; padding: 2px 6px; border-radius: 4px; background: #000; color: #f1c40f; position: absolute; top: -15px; left: 0; font-weight: bold; border: 1px solid #444; } .dust-effect { position: absolute; bottom: 5px; left: -10px; width: 10px; height: 10px; background: #ccc; border-radius: 50%; animation: dust 0.6s infinite; } `;

export default function HorseRacing() {
  const [point, setPoint] = useState(0);
  const [betMoney, setBetMoney] = useState(0);
  const [selectedHorseId, setSelectedHorseId] = useState(null);
  const [gameState, setGameState] = useState('betting'); 
  const [commentary, setCommentary] = useState("배팅을 진행해주세요.");
  
  const initialHorses = [ { id: 1, name: '적토마', color: '#e74c3c', pos: 0, odds: 1.3, speedBonus: 1.05 }, { id: 2, name: '청룡',   color: '#3498db', pos: 0, odds: 2.5, speedBonus: 1.02 }, { id: 3, name: '황금마', color: '#f1c40f', pos: 0, odds: 3.8, speedBonus: 0.99 }, { id: 4, name: '흑표범', color: '#8e44ad', pos: 0, odds: 6.5, speedBonus: 0.96 }, { id: 5, name: '녹색광선', color: '#2ecc71', pos: 0, odds: 11.0, speedBonus: 0.92 }, ];
  const [horses, setHorses] = useState(initialHorses);
  const raceInterval = useRef(null);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => { if (!user) { navigate('/login'); return; } fetchPoint(); return () => clearInterval(raceInterval.current); }, [user, navigate]);
  const fetchPoint = async () => { try { const d = await getDoc(doc(db, "users", user.uid)); if (d.exists()) setPoint(d.data().point || 0); } catch (e) { console.error(e); } };
  const handleBetPercent = (percent) => { if (percent === 0) { setBetMoney(0); return; } const amount = Math.floor(point * percent); setBetMoney(amount); };

  const startRace = async () => {
    if (betMoney <= 0) return alert("배팅 금액을 설정하세요!");
    if (betMoney > Math.floor(point)) return alert("포인트가 부족합니다!");
    if (!selectedHorseId) return alert("우승 예상마를 선택하세요!");

    await updateDoc(doc(db, "users", user.uid), { point: increment(-betMoney) });
    setPoint(prev => prev - betMoney);
    
    // ✅ [기록 추가] 베팅 로그
    await addDoc(collection(db, "history"), {
        uid: user.uid,
        type: "게임",
        msg: `경마 베팅 (${selectedHorseId}번마)`,
        amount: -betMoney,
        createdAt: serverTimestamp()
    });

    setGameState('racing');
    setCommentary("🔫 탕! 출발했습니다! 과연 우승마는?!");

    let tick = 0;
    raceInterval.current = setInterval(() => {
      tick++;
      if (tick === 30) setCommentary("치열한 선두 싸움! 아직 모릅니다!");
      if (tick === 70) setCommentary("중반전 돌입! 엎치락뒤치락!");
      if (tick === 120) setCommentary("결승선이 코앞입니다! 막판 스퍼트!!");

      setHorses(prev => {
        const nextHorses = prev.map(h => {
          let move = (Math.random() * 0.7) + 0.1;
          move *= h.speedBonus;
          if (Math.random() < 0.05) move += 1.5;
          if (Math.random() < 0.05) move -= 0.5;
          let newPos = h.pos + move;
          if(newPos < 0) newPos = 0;
          return { ...h, pos: newPos };
        });
        const winner = nextHorses.find(h => h.pos >= 92);
        if (winner) { clearInterval(raceInterval.current); handleFinish(winner); }
        return nextHorses;
      });
    }, 50); 
  };

  const handleFinish = async (winner) => {
    setGameState('result');
    const isWin = selectedHorseId === winner.id;
    
    if (isWin) {
      const prize = Math.floor(betMoney * winner.odds);
      setCommentary(`🎉 [${winner.id}번 ${winner.name}] 우승! 적중!! (+${prize.toLocaleString()}원)`);
      await updateDoc(doc(db, "users", user.uid), { point: increment(prize) });
      setPoint(prev => prev + prize);
      
      // ✅ [기록 추가] 당첨 로그
      await addDoc(collection(db, "history"), {
          uid: user.uid,
          type: "게임",
          msg: `경마 적중 (${winner.id}번마)`,
          amount: prize,
          createdAt: serverTimestamp()
      });

      if(navigator.vibrate) navigator.vibrate([100,50,100]); 
    } else {
      setCommentary(`🏁 [${winner.id}번 ${winner.name}] 우승! 아쉽습니다.`);
    }
  };

  const resetGame = () => { setHorses(initialHorses.map(h => ({ ...h, pos: 0 }))); setGameState('betting'); setBetMoney(0); setSelectedHorseId(null); setCommentary("다음 경주 배팅을 진행해주세요."); };
  const currentLeaderId = horses.reduce((prev, curr) => (prev.pos > curr.pos ? prev : curr)).id;

  return (
    // ... (기존 UI 유지) ...
    <div className="container" style={{ background: '#1e272e', minHeight: '100vh', padding: '10px', color: 'white', fontFamily: 'sans-serif' }}>
      <style>{styles}</style>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#f1c40f', fontStyle: 'italic', letterSpacing: '2px', textShadow: '2px 2px 0 #000' }}>🏇 SUPER DERBY</h2>
        <div style={{ background: '#000', border: '4px solid #444', padding: '10px', borderRadius: '5px', marginTop: '10px' }}> <div style={{ color: '#e74c3c', fontSize: '12px', marginBottom: '5px' }}>LIVE COMMENTARY</div> <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2ecc71' }}>{commentary}</div> </div>
      </div>
      <div style={{ background: '#353b48', padding: '10px 0', borderRadius: '10px', border: '2px solid #555', overflow: 'hidden', marginBottom: '20px' }}>
        {horses.map(h => (
          <div key={h.id} className="track-line">
              <div style={{ position: 'absolute', left: `${Math.min(h.pos, 92)}%`, zIndex: 10, transition: 'left 0.05s linear' }}>
                 <div className="odds-tag">x{h.odds}</div>
                 <div className={gameState === 'racing' ? 'horse-running' : ''} style={{ fontSize: '40px', filter: currentLeaderId === h.id && gameState === 'racing' ? 'drop-shadow(0 0 5px yellow)' : 'none' }}> 🐎 </div>
                 <div style={{ position: 'absolute', top: '15px', left: '10px', fontSize: '12px', fontWeight: 'bold', color: 'white', background: h.color, width: '16px', height: '16px', borderRadius: '50%', textAlign: 'center', lineHeight: '16px' }}> {h.id} </div>
                 {gameState === 'racing' && <div className="dust-effect"></div>}
              </div>
              <div className="finish-line"></div>
          </div>
        ))}
      </div>
      <div className="card" style={{ background: '#2f3640', padding: '15px', borderTop: '4px solid #f1c40f' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
            <div> <div style={{ fontSize: '12px', color: '#aaa' }}>MY POINT</div> <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f1c40f' }}>{Math.floor(point).toLocaleString()}</div> </div>
            <div> <div style={{ fontSize: '12px', color: '#aaa' }}>BET AMOUNT</div> <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e74c3c' }}>{betMoney.toLocaleString()}</div> </div>
        </div>
        {gameState === 'betting' && ( <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px', marginBottom: '15px' }}> {horses.map(h => ( <button key={h.id} onClick={() => setSelectedHorseId(h.id)} style={{ background: selectedHorseId === h.id ? h.color : '#222', border: selectedHorseId === h.id ? '2px solid white' : '1px solid #444', borderRadius: '8px', padding: '10px 0', cursor: 'pointer', opacity: selectedHorseId && selectedHorseId !== h.id ? 0.5 : 1 }}> <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{h.id}번</div> <div style={{ fontSize: '11px', color: '#ccc' }}>x{h.odds}</div> </button> ))} </div> )}
        {gameState === 'betting' && ( <div style={{display:'flex', gap:5, marginBottom:15}}> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.1)}>10%</button> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.25)}>25%</button> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.5)}>50%</button> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#e74c3c', color:'white', fontWeight:'bold'}} onClick={()=>handleBetPercent(1)}>ALL</button> <button className="btn" style={{width:40, padding:5, fontSize:12, background:'#95a5a6'}} onClick={()=>handleBetPercent(0)}>🔄</button> </div> )}
        {gameState === 'betting' ? ( <button className="btn" onClick={startRace} style={{ width: '100%', padding: '15px', fontSize: '18px', fontWeight: 'bold', background: '#27ae60' }}> START RACE </button> ) : gameState === 'result' ? ( <button className="btn" onClick={resetGame} style={{ width: '100%', padding: '15px', fontSize: '18px', background: '#3498db' }}> 새 게임 시작 </button> ) : ( <button className="btn" disabled style={{ width: '100%', padding: '15px', fontSize: '18px', background: '#555', cursor: 'not-allowed' }}> RACING... </button> )}
      </div>
      {gameState !== 'racing' && ( <button className="btn" style={{ marginTop: 20, background: 'transparent', border:'1px solid #555', color:'#888', width: '100%' }} onClick={() => navigate('/home')}> &larr; 홈으로 돌아가기 </button> )}
    </div>
  );
}