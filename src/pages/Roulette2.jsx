import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

const WHEEL_NUMBERS = [ 0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26 ];
const REDS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export default function Roulette2() {
  const [point, setPoint] = useState(0);
  const [betAmount, setBetAmount] = useState('');
  const [selectedBet, setSelectedBet] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const navigate = useNavigate();
  const user = auth.currentUser;
  const { t } = useLanguage();

  useEffect(() => { if (!user) { navigate('/login'); return; } fetchPoint(); }, [user, navigate]);
  const fetchPoint = async () => { try { const d = await getDoc(doc(db, "users", user.uid)); if (d.exists()) setPoint(d.data().point || 0); } catch (e) {} };
  const handleBetPercent = (percent) => { if (percent === 0) { setBetAmount(''); return; } const amount = Math.floor(point * percent); setBetAmount(String(amount)); };
  const handleBetClick = (type) => { if (isSpinning) return; setSelectedBet(type); };

  const spinWheel = async () => {
    if (selectedBet === null) return alert(t.rouletteSelect);
    const money = parseInt(betAmount);
    if (isNaN(money) || money <= 0) return alert(t.enterBet);
    if (money > Math.floor(point)) return alert(t.noMoney);

    setIsSpinning(true);
    setLastResult(null);

    try {
      await updateDoc(doc(db, "users", user.uid), { point: increment(-money) });
      setPoint(prev => prev - money);
      await addDoc(collection(db, "history"), {
          uid: user.uid, type: "게임", msg: `룰렛 배팅 (${typeof selectedBet === 'number' ? selectedBet : selectedBet.toUpperCase()})`, amount: -money, createdAt: serverTimestamp()
      });
    } catch (e) { setIsSpinning(false); return alert(t.alertError); }

    const randomIndex = Math.floor(Math.random() * 37); 
    const winningNumber = WHEEL_NUMBERS[randomIndex]; 
    const sliceDeg = 360 / 37;
    const targetDeg = randomIndex * sliceDeg; 
    const finalRotation = 360 * 5 + (360 - targetDeg);
    const newRotation = rotation + finalRotation + (360 - (rotation % 360)); 
    setRotation(newRotation);

    setTimeout(() => {
      checkWin(winningNumber, money);
      setIsSpinning(false);
    }, 4000);
  };

  const checkWin = async (winNum, money) => {
    let win = false;
    let multiplier = 0;

    if (selectedBet === 'red' && REDS.includes(winNum)) { win = true; multiplier = 1.97; } 
    else if (selectedBet === 'black' && !REDS.includes(winNum) && winNum !== 0) { win = true; multiplier = 1.97; } 
    else if (selectedBet === 'green' && winNum === 0) { win = true; multiplier = 35; } 
    else if (typeof selectedBet === 'number' && selectedBet === winNum) { win = true; multiplier = 35; }

    setLastResult({ num: winNum, color: winNum === 0 ? 'green' : (REDS.includes(winNum) ? 'red' : 'black') });

    if (win) {
        const winMoney = Math.floor(money * multiplier);
        setPoint(prev => prev + winMoney);
        await updateDoc(doc(db, "users", user.uid), { point: increment(winMoney) });
        await addDoc(collection(db, "history"), { uid: user.uid, type: "게임", msg: `룰렛 당첨 (${winNum})`, amount: winMoney, createdAt: serverTimestamp() });
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
    } else {
        if (navigator.vibrate) navigator.vibrate(200);
    }
  };

  return (
    <div className="container" style={{ background: '#1e272e', minHeight: '100vh', color: 'white', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#2f3640', zIndex: 10 }}> <h1 style={{ margin: 0, fontSize: '20px', color: '#e74c3c' }}>{t.rouletteTitle}</h1> <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f1c40f' }}>💰 {Math.floor(point).toLocaleString()}</div> </div>
      <div style={{ position: 'relative', width: '320px', height: '320px', margin: '30px 0' }}>
        <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '15px solid transparent', borderRight: '15px solid transparent', borderTop: '25px solid #f1c40f', zIndex: 20, filter: 'drop-shadow(0 4px 2px rgba(0,0,0,0.5))' }}></div>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '8px solid #d35400', position: 'relative', overflow: 'hidden', transition: 'transform 4s cubic-bezier(0.1, 0, 0.2, 1)', transform: `rotate(${rotation}deg)`, background: '#333', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
            {WHEEL_NUMBERS.map((num, i) => {
                const deg = 360 / 37; const rotate = deg * i; const isRed = REDS.includes(num); const color = num === 0 ? '#27ae60' : (isRed ? '#c0392b' : '#2c3e50'); 
                return ( <div key={num} style={{ position: 'absolute', top: '0', left: '50%', width: '30px', height: '50%', transformOrigin: 'bottom center', transform: `translateX(-50%) rotate(${rotate}deg)`, clipPath: 'polygon(0 0, 100% 0, 50% 100%)', display: 'flex', justifyContent: 'center', paddingTop: '10px' }}> <div style={{ position: 'absolute', top: 0, left: '-50%', width: '200%', height: '100%', background: color, zIndex: -1 }}></div> <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px', transform: 'rotate(180deg)' }}>{num}</span> </div> )
            })}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '60px', height: '60px', background: 'radial-gradient(circle, #95a5a6, #2c3e50)', borderRadius: '50%', border: '2px solid #bdc3c7', boxShadow: '0 0 10px rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: '10px' }}>GEMINI</div>
        </div>
      </div>
      {lastResult && ( <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px', color: lastResult.color === 'red' ? '#e74c3c' : (lastResult.color === 'green' ? '#2ecc71' : '#bdc3c7') }}> {t.rouletteResult}: {lastResult.num} ({lastResult.color.toUpperCase()}) </div> )}
      <div className="card" style={{ width: '95%', background: '#2c3e50', padding: '15px', marginBottom: '20px' }}>
         <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', height: '50px' }}> <button onClick={() => handleBetClick('red')} disabled={isSpinning} style={{ flex: 1, background: '#c0392b', border: selectedBet === 'red' ? '3px solid #f1c40f' : 'none', borderRadius: '5px', color: 'white', fontWeight: 'bold' }}> 🔴 RED x1.97 </button> <button onClick={() => handleBetClick('green')} disabled={isSpinning} style={{ flex: 0.5, background: '#27ae60', border: selectedBet === 'green' ? '3px solid #f1c40f' : 'none', borderRadius: '5px', color: 'white', fontWeight: 'bold' }}> 0 (x35) </button> <button onClick={() => handleBetClick('black')} disabled={isSpinning} style={{ flex: 1, background: '#34495e', border: selectedBet === 'black' ? '3px solid #f1c40f' : 'none', borderRadius: '5px', color: 'white', fontWeight: 'bold' }}> ⚫ BLACK x1.97 </button> </div>
         <input className="input" type="number" placeholder={t.inputBet} value={betAmount} onChange={e => setBetAmount(e.target.value)} style={{ width: '100%', marginBottom: '10px', textAlign: 'center', background: '#1e272e', color: 'white' }} />
         <div style={{display:'flex', gap:5, marginBottom:15}}> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.1)} disabled={isSpinning}>10%</button> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.25)} disabled={isSpinning}>25%</button> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.5)} disabled={isSpinning}>50%</button> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#e74c3c', color:'white', fontWeight:'bold'}} onClick={()=>handleBetPercent(1)} disabled={isSpinning}>ALL</button> <button className="btn" style={{width:40, padding:5, fontSize:12, background:'#95a5a6'}} onClick={()=>handleBetPercent(0)} disabled={isSpinning}>🔄</button> </div>
         <button className="btn btn-primary" style={{ width: '100%', padding: '15px', fontSize: '20px', background: isSpinning ? '#555' : '#f1c40f', color: 'black', fontWeight: 'bold' }} onClick={spinWheel} disabled={isSpinning}> {isSpinning ? t.spinning : t.rouletteSpin} </button>
      </div>
      <button className="btn" style={{ width: '90%', background: '#444' }} onClick={() => navigate('/home')}>{t.home}</button>
    </div>
  );
}