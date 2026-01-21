import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
// 👇 addDoc, collection, serverTimestamp 추가됨
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// ... (styles 객체 그대로) ...
const styles = { shake: { animation: 'shake 0.5s infinite', }, '@keyframes shake': { '0%': { transform: 'translate(1px, 1px) rotate(0deg)' }, '10%': { transform: 'translate(-1px, -2px) rotate(-1deg)' }, '20%': { transform: 'translate(-3px, 0px) rotate(1deg)' }, '30%': { transform: 'translate(3px, 2px) rotate(0deg)' }, '40%': { transform: 'translate(1px, -1px) rotate(1deg)' }, '50%': { transform: 'translate(-1px, 2px) rotate(-1deg)' }, '60%': { transform: 'translate(-3px, 1px) rotate(0deg)' }, '70%': { transform: 'translate(3px, 1px) rotate(-1deg)' }, '80%': { transform: 'translate(-1px, -1px) rotate(1deg)' }, '90%': { transform: 'translate(1px, 2px) rotate(0deg)' }, '100%': { transform: 'translate(1px, -2px) rotate(-1deg)' }, } };

export default function Game() {
  const [point, setPoint] = useState(0);
  const [betAmount, setBetAmount] = useState('');
  const [isRolling, setIsRolling] = useState(false);
  const [diceFace, setDiceFace] = useState('🎲');
  
  const navigate = useNavigate();
  const user = auth.currentUser;
  const diceIcons = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']; 

  useEffect(() => { if (!user) { navigate('/login'); return; } fetchPoint(); const styleSheet = document.createElement("style"); styleSheet.type = "text/css"; styleSheet.innerText = `@keyframes shake { ${styles['@keyframes shake']} }`; document.head.appendChild(styleSheet); return () => document.head.removeChild(styleSheet); }, [user, navigate]);
  const fetchPoint = async () => { try { const userDoc = await getDoc(doc(db, "users", user.uid)); if (userDoc.exists()) setPoint(userDoc.data().point || 0); } catch (e) { console.log(e); } };
  const handleBetPercent = (percent) => { if (percent === 0) { setBetAmount(''); return; } const amount = Math.floor(point * percent); setBetAmount(String(amount)); };

  const handleGame = async (choice) => {
    const bet = parseInt(betAmount);
    if (isNaN(bet) || bet <= 0) return alert("금액을 정확히 적으세요!");
    if (bet > Math.floor(point)) return alert("포인트가 부족합니다!");
    if (isRolling) return; 

    setIsRolling(true);
    let currentPoint = point - bet;
    setPoint(currentPoint); 

    // ✅ [기록 추가] 베팅 로그 (시작할 때 기록)
    addDoc(collection(db, "history"), {
        uid: user.uid,
        type: "게임",
        msg: `홀짝 베팅 (${choice})`,
        amount: -bet,
        createdAt: serverTimestamp()
    });

    const interval = setInterval(() => {
      setDiceFace(diceIcons[Math.floor(Math.random() * 6)]);
    }, 100);

    setTimeout(async () => {
        clearInterval(interval); 

        const finalNumIndex = Math.floor(Math.random() * 6);
        const finalDice = diceIcons[finalNumIndex];
        setDiceFace(finalDice); 
        
        const finalNum = finalNumIndex + 1; 
        const result = finalNum % 2 !== 0 ? '홀' : '짝';
        const isAllIn = bet === Math.floor(point);

        let msg = "";
        let winMoney = 0;

        if (choice === result) {
            winMoney = Math.floor(bet * 1.98);
            currentPoint += winMoney;
            msg = isAllIn 
                ? `🔥 [올인 성공!] 🔥\n주사위: ${finalDice}(${result})! ${winMoney.toLocaleString()}원을 땄습니다!`
                : `🎉 승리! 주사위: ${finalDice}(${result})\n${winMoney.toLocaleString()}원을 획득했습니다.`;
            
            // ✅ [기록 추가] 당첨 로그
            addDoc(collection(db, "history"), {
                uid: user.uid,
                type: "게임",
                msg: "홀짝 승리",
                amount: winMoney,
                createdAt: serverTimestamp()
            });
        } else {
            msg = isAllIn 
                ? `☠️ [올인 실패...] ☠️\n주사위: ${finalDice}(${result})... 전 재산을 날렸습니다.`
                : `😭 패배... 주사위: ${finalDice}(${result})\n돈을 잃었습니다.`;
        }

        setIsRolling(false);
        setPoint(currentPoint);
        setBetAmount('');
        
        setTimeout(() => alert(msg), 100);

        try {
            await updateDoc(doc(db, "users", user.uid), { point: currentPoint });
        } catch (e) { 
            console.log("저장 에러:", e);
            alert("⚠️ 서버 한도 초과! 결과가 저장되지 않을 수 있습니다.");
        }
    }, 2000); 
  };

  return (
    // ... (기존 UI 유지) ...
    <div className="container" style={{ textAlign: 'center', paddingTop: 30, background: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
      <h1 className="title" style={{ fontSize: 40, marginBottom: 10, color: '#e74c3c' }}>🎲 주사위 홀짝</h1>
      <p style={{ color: '#888', marginBottom: 20 }}>주사위를 굴려 홀/짝을 맞추세요 (1.98배)</p>
      <div className="card" style={{ background: '#2c3e50', color: '#f1c40f', padding: 15, marginBottom: 20 }}>
        <div style={{ fontSize: 18 }}>내 지갑</div>
        <div style={{ fontSize: 30, fontWeight: 'bold' }}>{Math.floor(point).toLocaleString()}원</div>
      </div>
      <div style={{ minHeight: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '80px', ...(isRolling ? styles.shake : {}) }}> {diceFace} </div>
      </div>
      <div className="card" style={{ background: 'rgba(255,255,255,0.05)', padding: '20px' }}>
        <input className="input" type="number" placeholder="배팅 금액 입력" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} style={{ fontSize: 20, textAlign: 'center', width: '100%', marginBottom: '15px' }} disabled={isRolling} />
        {!isRolling && (
        <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
            <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.1)}>10%</button>
            <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.25)}>25%</button>
            <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.5)}>50%</button>
            <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#e74c3c', color:'white', fontWeight:'bold'}} onClick={()=>handleBetPercent(1)}>ALL</button>
            <button className="btn" style={{width:40, padding:5, fontSize:12, background:'#95a5a6'}} onClick={()=>handleBetPercent(0)}>🔄</button>
        </div>
        )}
        {!isRolling ? (
        <div style={{ display: 'flex', gap: 20 }}>
          <button className="btn" style={{ flex: 1, background: '#e74c3c', fontSize: 24, padding: 15 }} onClick={() => handleGame('홀')}>🔴 홀 </button>
          <button className="btn" style={{ flex: 1, background: '#3498db', fontSize: 24, padding: 15 }} onClick={() => handleGame('짝')}>🔵 짝 </button>
        </div>
        ) : (
            <div style={{ padding: '20px', fontSize: '20px', fontWeight: 'bold', color: '#f1c40f' }}> 주사위 굴러가는 중... 두근두근! </div>
        )}
      </div>
      <button className="btn" style={{ marginTop: 30, background: '#444', width: '100%' }} onClick={() => navigate('/home')} disabled={isRolling}> 🏠 홈으로 </button>
    </div>
  );
}