import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
// 👇 addDoc, collection, serverTimestamp 추가됨
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function Slot() {
  const [point, setPoint] = useState(0);
  const [bet, setBet] = useState('');
  const [reels, setReels] = useState(['❓', '❓', '❓']);
  const [spinning, setSpinning] = useState(false);
  const navigate = useNavigate();
  const user = auth.currentUser;

  const symbols = ['🍒', '🍋', '🍉', '⭐', '7️⃣'];

  useEffect(() => { if (!user) { navigate('/login'); return; } fetchPoint(); }, [user, navigate]);
  const fetchPoint = async () => { try { const d = await getDoc(doc(db, "users", user.uid)); if (d.exists()) setPoint(d.data().point || 0); } catch (e) { console.error("포인트 로드 실패", e); } };
  const handleBetPercent = (percent) => { if (percent === 0) { setBet(''); return; } const amount = Math.floor(point * percent); setBet(String(amount)); };

  const spin = async () => {
    const betMoney = parseInt(bet);
    if (isNaN(betMoney) || betMoney <= 0) return alert("배팅 금액을 입력하세요!");
    if (betMoney > Math.floor(point)) return alert("돈이 부족합니다!");
    if (spinning) return;

    setSpinning(true);
    
    // 포인트 선차감 (DB 업데이트)
    try {
        await updateDoc(doc(db, "users", user.uid), { point: increment(-betMoney) });
        setPoint(prev => prev - betMoney);

        // ✅ [기록 추가] 베팅 로그
        await addDoc(collection(db, "history"), {
            uid: user.uid,
            type: "게임",
            msg: "슬롯머신 배팅",
            amount: -betMoney,
            createdAt: serverTimestamp()
        });

    } catch (e) { setSpinning(false); return alert("오류 발생"); }

    // 룰렛 연출
    let count = 0;
    const interval = setInterval(() => {
      setReels([ symbols[Math.floor(Math.random() * symbols.length)], symbols[Math.floor(Math.random() * symbols.length)], symbols[Math.floor(Math.random() * symbols.length)] ]);
      count++;
      if (count > 20) { clearInterval(interval); finalizeResult(betMoney); }
    }, 100);
  };

  const finalizeResult = async (betMoney) => {
    const r1 = symbols[Math.floor(Math.random() * symbols.length)];
    const r2 = symbols[Math.floor(Math.random() * symbols.length)];
    const r3 = symbols[Math.floor(Math.random() * symbols.length)];
    setReels([r1, r2, r3]);
    setSpinning(false);

    let winMoney = 0;
    let msg = "꽝... 다음 기회에 😭";

    if (r1 === r2 && r2 === r3) {
      if (r1 === '7️⃣') { winMoney = betMoney * 50; msg = `🔥 잭팟!! 777!! 🔥\n${winMoney.toLocaleString()}원을 벌었습니다!`; } 
      else { winMoney = betMoney * 10; msg = `🎉 축하합니다! 10배 당첨!\n${winMoney.toLocaleString()}원 획득!`; }
    } else if (r1 === '7️⃣' || r2 === '7️⃣' || r3 === '7️⃣') {
        winMoney = betMoney; // 본전
        msg = "럭키 세븐! 본전은 건졌네요.";
    }

    if (winMoney > 0) {
        setPoint(prev => prev + winMoney);
        await updateDoc(doc(db, "users", user.uid), { point: increment(winMoney) });
        
        // ✅ [기록 추가] 당첨 로그
        await addDoc(collection(db, "history"), {
            uid: user.uid,
            type: "게임",
            msg: "슬롯머신 당첨",
            amount: winMoney,
            createdAt: serverTimestamp()
        });

        alert(msg);
    }
  };

  return (
    // ... (UI 코드는 기존과 동일) ...
    <div className="container" style={{ textAlign: 'center', paddingTop: 30, background: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
      <h1 className="title" style={{ color: '#f1c40f' }}>🎰 대박 슬롯머신</h1>
      <div className="card" style={{ background: '#34495e', padding: '15px', marginBottom: '20px' }}> <div style={{ fontSize: 18 }}>현재 자산</div> <div style={{ fontSize: 30, fontWeight: 'bold', color: '#f1c40f' }}>{Math.floor(point).toLocaleString()}원</div> </div>
      <div className="card" style={{ padding: '30px 10px', background: '#000', border: '5px solid #f1c40f', borderRadius: '15px', marginBottom: '30px' }}> <div style={{ fontSize: 60, letterSpacing: 15 }}> {reels[0]}{reels[1]}{reels[2]} </div> </div>
      <div className="card" style={{ background: 'rgba(255,255,255,0.05)', padding: '20px' }}>
        <input className="input" type="number" placeholder="배팅액 입력" value={bet} onChange={e => setBet(e.target.value)} style={{ textAlign: 'center', fontSize: 22, width: '100%', marginBottom: '15px' }} disabled={spinning} />
        <div style={{display:'flex', gap:5, marginBottom:20}}> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.1)} disabled={spinning}>10%</button> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.25)} disabled={spinning}>25%</button> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.5)} disabled={spinning}>50%</button> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#e74c3c', color:'white', fontWeight:'bold'}} onClick={()=>handleBetPercent(1)} disabled={spinning}>ALL</button> <button className="btn" style={{width:40, padding:5, fontSize:12, background:'#95a5a6'}} onClick={()=>handleBetPercent(0)} disabled={spinning}>🔄</button> </div>
        <button className="btn btn-warn" style={{ width: '100%', fontSize: 24, padding: 15, fontWeight: 'bold' }} onClick={spin} disabled={spinning}> {spinning ? "🎰 돌아가는 중..." : "레버 당기기 (Spin)"} </button>
      </div>
      <button className="btn" style={{ marginTop: 30, background: '#444', width: '100%' }} onClick={() => navigate('/home')}> 🏠 홈으로 돌아가기 </button>
    </div>
  );
}