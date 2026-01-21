import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
// 👇 addDoc, collection, serverTimestamp 추가됨
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// ... (styles 상수는 그대로 유지) ...
const styles = ` @keyframes spin-glow { 0% { box-shadow: 0 0 10px #3498db; } 50% { box-shadow: 0 0 30px #e74c3c; } 100% { box-shadow: 0 0 10px #3498db; } } .wheel-container { position: relative; width: 320px; height: 320px; border-radius: 50%; border: 10px solid #2c3e50; box-shadow: 0 0 20px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.8); overflow: hidden; transition: transform 3.5s cubic-bezier(0.15, 0, 0.15, 1); } .wheel-label { position: absolute; top: 50%; left: 50%; transform-origin: center; display: flex; flex-direction: column; align-items: center; justify-content: center; text-shadow: 1px 1px 2px rgba(0,0,0,0.8); width: 60px; height: 60px; margin-left: -30px; margin-top: -30px; z-index: 10; font-weight: bold; } .hexagon { width: 80px; height: 90px; background: linear-gradient(135deg, #f1c40f, #e67e22); clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); display: flex; justify-content: center; align-items: center; font-size: 24px; font-weight: bold; color: white; box-shadow: 0 0 15px #f1c40f; z-index: 20; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); } .history-item { width: 100%; padding: 8px 0; margin-bottom: 5px; background: #2c3e50; border-radius: 4px; font-size: 20px; display: flex; justify-content: center; align-items: center; border-left: 4px solid transparent; } .choice-btn { flex: 1; padding: 15px; border-radius: 10px; font-size: 18px; font-weight: bold; border: 3px solid transparent; transition: all 0.2s; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 5px; } .chip-btn { flex: 1; height: 50px; border-radius: 8px; font-weight: bold; font-size: 16px; border: none; cursor: pointer; color: white; } `;

export default function Roulette() {
  const [point, setPoint] = useState(0);
  const [betMoney, setBetMoney] = useState(0); 
  const [selectedSide, setSelectedSide] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [history, setHistory] = useState([]); 
  const [centerText, setCenterText] = useState("READY");

  const navigate = useNavigate();
  const user = auth.currentUser;

  const segments = Array.from({ length: 12 }).map((_, i) => ({ type: i % 2 === 0 ? 'angel' : 'demon', label: i % 2 === 0 ? '👼' : '👿', text: i % 2 === 0 ? 'ANGEL' : 'DEMON', color: i % 2 === 0 ? '#3498db' : '#e74c3c', bgColor: i % 2 === 0 ? '#1a252f' : '#2c3e50' }));
  const sliceAngle = 360 / 12;
  const wheelBackground = `conic-gradient( ${segments.map((s, i) => `${s.bgColor} ${i * 30}deg ${(i + 1) * 30}deg`).join(', ')} )`;

  useEffect(() => { if (!user) { navigate('/login'); return; } fetchPoint(); }, [user, navigate]);
  const fetchPoint = async () => { try { const d = await getDoc(doc(db, "users", user.uid)); if (d.exists()) setPoint(d.data().point || 0); } catch (e) { console.error(e); } };
  const handleBetPercent = (percent) => { if (percent === 0) { setBetMoney(0); return; } const amount = Math.floor(point * percent); setBetMoney(amount); };

  const spinWheel = async () => {
    if (betMoney <= 0) return alert("배팅 금액을 설정하세요!");
    if (betMoney > Math.floor(point)) return alert("포인트가 부족합니다!"); 
    if (!selectedSide) return alert("천사(Angel) 또는 악마(Demon)를 선택하세요!");
    if (isSpinning) return;

    const startPoint = point - betMoney;
    setPoint(startPoint);
    
    // 포인트 차감 저장
    await updateDoc(doc(db, "users", user.uid), { point: startPoint });

    // ✅ [기록 추가] 베팅 로그
    await addDoc(collection(db, "history"), {
        uid: user.uid,
        type: "게임",
        msg: `천사악마 배팅 (${selectedSide === 'angel' ? '천사' : '악마'})`,
        amount: -betMoney,
        createdAt: serverTimestamp()
    });

    setIsSpinning(true);
    setCenterText("GO!");

    const randomDegree = Math.floor(Math.random() * 360);
    const totalRotation = rotation + (360 * 5) + randomDegree;
    setRotation(totalRotation);

    setTimeout(async () => {
      setIsSpinning(false);
      
      const actualDegree = (360 - (totalRotation % 360)) % 360;
      const index = Math.floor(actualDegree / sliceAngle);
      const result = segments[index];

      const isWin = result.type === selectedSide;
      let winAmount = 0;

      setHistory(prev => [result, ...prev].slice(0, 8));
      setCenterText(result.type === 'angel' ? "👼" : "👿");

      if (isWin) {
        winAmount = Math.floor(betMoney * 1.97); 
        const finalPoint = startPoint + winAmount;
        setPoint(finalPoint);
        await updateDoc(doc(db, "users", user.uid), { point: increment(winAmount) });
        
        // ✅ [기록 추가] 승리 로그
        await addDoc(collection(db, "history"), {
            uid: user.uid,
            type: "게임",
            msg: "천사악마 승리",
            amount: winAmount,
            createdAt: serverTimestamp()
        });

        alert(`🎉 적중!! [${result.label}] 승리 (+${winAmount.toLocaleString()}원)`);
      } else {
        alert(`💀 실패... [${result.label}] 가 나왔습니다.`);
      }

      setBetMoney(0);
      setSelectedSide(null);
    }, 3500);
  };

  return (
    // ... (UI 코드는 기존과 동일) ...
    <div className="container" style={{ background: '#0e1116', minHeight: '100vh', padding: '10px', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <style>{styles}</style>
      <h2 style={{ fontFamily: 'fantasy', letterSpacing: '2px', color: '#ecf0f1', marginBottom: '10px' }}> ANGELS <span style={{color:'#7f8c8d'}}>&</span> DEMONS </h2>
      <div style={{ display: 'flex', width: '100%', maxWidth: '800px', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '340px', height: '340px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ position: 'absolute', top: '-15px', zIndex: 30, width: 0, height: 0, borderLeft: '15px solid transparent', borderRight: '15px solid transparent', borderTop: '25px solid #f1c40f', filter: 'drop-shadow(0 4px 2px rgba(0,0,0,0.5))' }} />
          <div className="wheel-container" style={{ transform: `rotate(${rotation}deg)`, background: wheelBackground }}> {segments.map((seg, i) => ( <div key={i} className="wheel-label" style={{ transform: `rotate(${i * 30 + 15}deg) translate(0, -110px) rotate(${-i * 30 - 15}deg)` }}> <div style={{ fontSize: '30px' }}>{seg.label}</div> <div style={{ fontSize: '10px', color: seg.color }}>{seg.text}</div> </div> ))} </div>
          <div className="hexagon"> {centerText} </div>
        </div>
        <div style={{ flex: 1, minWidth: '300px', maxWidth: '350px' }}>
          <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', marginBottom: '15px', background: '#1e272e', padding: '10px', borderRadius: '8px' }}> {history.length === 0 ? <span style={{color:'#7f8c8d', fontSize:'12px', width:'100%', textAlign:'center'}}>기록 없음</span> : history.map((h, i) => ( <div key={i} style={{ fontSize: '20px', filter: i===0 ? 'brightness(1.5)' : 'grayscale(0.5)' }}> {h.label} </div> ))} </div>
          <div className="card" style={{ background: '#2c3e50', padding: '15px', border: '2px solid #34495e', marginBottom: '15px' }}> <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}> <span style={{color:'#bdc3c7'}}>MY POINT</span> <span style={{color:'#f1c40f', fontWeight:'bold'}}>{Math.floor(point).toLocaleString()}</span> </div> <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px' }}> <span style={{color:'#bdc3c7'}}>BET POINT</span> <span style={{color:'#2ecc71', fontWeight:'bold'}}>{betMoney.toLocaleString()}</span> </div> </div>
          <div style={{display:'flex', gap:5, marginBottom:15}}> <button className="chip-btn" style={{background:'#7f8c8d', fontSize:'14px'}} onClick={()=>handleBetPercent(0.1)} disabled={isSpinning}>10%</button> <button className="chip-btn" style={{background:'#7f8c8d', fontSize:'14px'}} onClick={()=>handleBetPercent(0.25)} disabled={isSpinning}>25%</button> <button className="chip-btn" style={{background:'#7f8c8d', fontSize:'14px'}} onClick={()=>handleBetPercent(0.5)} disabled={isSpinning}>50%</button> <button className="chip-btn" style={{background:'#e74c3c', color:'white', fontWeight:'bold', fontSize:'14px'}} onClick={()=>handleBetPercent(1)} disabled={isSpinning}>ALL</button> <button className="chip-btn" style={{width:50, background:'#95a5a6', fontSize:'14px'}} onClick={()=>handleBetPercent(0)} disabled={isSpinning}>🔄</button> </div>
          <div style={{ display: 'flex', gap: '10px' }}> <div className="choice-btn" onClick={() => setSelectedSide('angel')} style={{ background: selectedSide === 'angel' ? 'linear-gradient(135deg, #3498db, #2980b9)' : '#222', borderColor: selectedSide === 'angel' ? '#fff' : '#3498db', opacity: selectedSide === 'demon' ? 0.4 : 1 }} > <span style={{fontSize:'30px'}}>👼</span> <span style={{color: selectedSide === 'angel' ? '#fff' : '#3498db'}}>ANGEL</span> </div> <div className="choice-btn" onClick={() => setSelectedSide('demon')} style={{ background: selectedSide === 'demon' ? 'linear-gradient(135deg, #e74c3c, #c0392b)' : '#222', borderColor: selectedSide === 'demon' ? '#fff' : '#e74c3c', opacity: selectedSide === 'angel' ? 0.4 : 1 }} > <span style={{fontSize:'30px'}}>👿</span> <span style={{color: selectedSide === 'demon' ? '#fff' : '#e74c3c'}}>DEMON</span> </div> </div>
          <button className="btn" onClick={spinWheel} disabled={isSpinning} style={{ width: '100%', marginTop: '15px', padding: '15px', background: isSpinning ? '#7f8c8d' : '#f1c40f', color: '#000', fontSize: '20px', fontWeight: 'bold' }} > {isSpinning ? "SPINNING..." : "GAME START (x1.97)"} </button>
        </div>
      </div>
      <button className="btn" style={{ marginTop: 20, background: 'transparent', border:'1px solid #555', color:'#888' }} onClick={() => navigate('/home')}> &larr; 돌아가기 </button>
    </div>
  );
}