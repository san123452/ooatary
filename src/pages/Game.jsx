

// import React, { useState, useEffect } from 'react';
// import { db, auth } from '../firebase';
// import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';
// import { useLanguage } from '../LanguageContext'; // 👈

// const styles = { shake: { animation: 'shake 0.5s infinite', }, '@keyframes shake': { '0%': { transform: 'translate(1px, 1px) rotate(0deg)' }, '10%': { transform: 'translate(-1px, -2px) rotate(-1deg)' }, '20%': { transform: 'translate(-3px, 0px) rotate(1deg)' }, '30%': { transform: 'translate(3px, 2px) rotate(0deg)' }, '40%': { transform: 'translate(1px, -1px) rotate(1deg)' }, '50%': { transform: 'translate(-1px, 2px) rotate(-1deg)' }, '60%': { transform: 'translate(-3px, 1px) rotate(0deg)' }, '70%': { transform: 'translate(3px, 1px) rotate(-1deg)' }, '80%': { transform: 'translate(-1px, -1px) rotate(1deg)' }, '90%': { transform: 'translate(1px, 2px) rotate(0deg)' }, '100%': { transform: 'translate(1px, -2px) rotate(-1deg)' }, } };

// export default function Game() {
//   const [point, setPoint] = useState(0);
//   const [betAmount, setBetAmount] = useState('');
//   const [isRolling, setIsRolling] = useState(false);
//   const [diceFace, setDiceFace] = useState('🎲');
  
//   const navigate = useNavigate();
//   const user = auth.currentUser;
//   const { t } = useLanguage(); // 👈
//   const diceIcons = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']; 

//   useEffect(() => { if (!user) { navigate('/login'); return; } fetchPoint(); const styleSheet = document.createElement("style"); styleSheet.type = "text/css"; styleSheet.innerText = `@keyframes shake { ${styles['@keyframes shake']} }`; document.head.appendChild(styleSheet); return () => document.head.removeChild(styleSheet); }, [user, navigate]);
//   const fetchPoint = async () => { try { const userDoc = await getDoc(doc(db, "users", user.uid)); if (userDoc.exists()) setPoint(userDoc.data().point || 0); } catch (e) { console.log(e); } };
//   const handleBetPercent = (percent) => { if (percent === 0) { setBetAmount(''); return; } const amount = Math.floor(point * percent); setBetAmount(String(amount)); };

//   const handleGame = async (choice) => {
//     const bet = parseInt(betAmount);
//     if (isNaN(bet) || bet <= 0) return alert(t.alertInputBet);
//     if (bet > Math.floor(point)) return alert(t.alertNoMoney);
//     if (isRolling) return; 

//     setIsRolling(true);
//     let currentPoint = point - bet;
//     setPoint(currentPoint); 

//     await addDoc(collection(db, "history"), {
//         uid: user.uid, type: "게임", msg: `홀짝 배팅 (${choice})`, amount: -bet, createdAt: serverTimestamp()
//     });

//     const interval = setInterval(() => {
//       setDiceFace(diceIcons[Math.floor(Math.random() * 6)]);
//     }, 100);

//     setTimeout(async () => {
//         clearInterval(interval); 
//         const finalNumIndex = Math.floor(Math.random() * 6);
//         const finalDice = diceIcons[finalNumIndex];
//         setDiceFace(finalDice); 
        
//         const finalNum = finalNumIndex + 1; 
//         const result = finalNum % 2 !== 0 ? '홀' : '짝';
//         const isAllIn = bet === Math.floor(point);

//         let msg = "";
//         let winMoney = 0;

//         if (choice === result) {
//             winMoney = Math.floor(bet * 1.98);
//             currentPoint += winMoney;
//             msg = `${t.win} (+${winMoney.toLocaleString()})`;
//             await addDoc(collection(db, "history"), { uid: user.uid, type: "게임", msg: "홀짝 승리", amount: winMoney, createdAt: serverTimestamp() });
//         } else {
//             msg = t.lose;
//         }

//         setIsRolling(false);
//         setPoint(currentPoint);
//         setBetAmount('');
//         setTimeout(() => alert(msg), 100);

//         try { await updateDoc(doc(db, "users", user.uid), { point: currentPoint }); } catch (e) {}
//     }, 2000); 
//   };

//   return (
//     <div className="container" style={{ textAlign: 'center', paddingTop: 30, background: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
//       <h1 className="title" style={{ fontSize: 40, marginBottom: 10, color: '#e74c3c' }}>{t.oddEven}</h1>
//       <p style={{ color: '#888', marginBottom: 20 }}>Odd/Even (x1.98)</p>
//       <div className="card" style={{ background: '#2c3e50', color: '#f1c40f', padding: 15, marginBottom: 20 }}>
//         <div style={{ fontSize: 18 }}>{t.balance}</div>
//         <div style={{ fontSize: 30, fontWeight: 'bold' }}>{Math.floor(point).toLocaleString()}</div>
//       </div>
//       <div style={{ minHeight: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
//           <div style={{ fontSize: '80px', ...(isRolling ? styles.shake : {}) }}> {diceFace} </div>
//       </div>
//       <div className="card" style={{ background: 'rgba(255,255,255,0.05)', padding: '20px' }}>
//         <input className="input" type="number" placeholder={t.inputBet} value={betAmount} onChange={(e) => setBetAmount(e.target.value)} style={{ fontSize: 20, textAlign: 'center', width: '100%', marginBottom: '15px' }} disabled={isRolling} />
//         {!isRolling && (
//         <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
//             <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.1)}>10%</button>
//             <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.25)}>25%</button>
//             <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.5)}>50%</button>
//             <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#e74c3c', color:'white', fontWeight:'bold'}} onClick={()=>handleBetPercent(1)}>ALL</button>
//             <button className="btn" style={{width:40, padding:5, fontSize:12, background:'#95a5a6'}} onClick={()=>handleBetPercent(0)}>🔄</button>
//         </div>
//         )}
//         {!isRolling ? (
//         <div style={{ display: 'flex', gap: 20 }}>
//           <button className="btn" style={{ flex: 1, background: '#e74c3c', fontSize: 24, padding: 15 }} onClick={() => handleGame('홀')}>🔴 홀 (Odd)</button>
//           <button className="btn" style={{ flex: 1, background: '#3498db', fontSize: 24, padding: 15 }} onClick={() => handleGame('짝')}>🔵 짝 (Even)</button>
//         </div>
//         ) : (
//             <div style={{ padding: '20px', fontSize: '20px', fontWeight: 'bold', color: '#f1c40f' }}> {t.loading} </div>
//         )}
//       </div>
//       <button className="btn" style={{ marginTop: 30, background: '#444', width: '100%' }} onClick={() => navigate('/home')} disabled={isRolling}> {t.home} </button>
//     </div>
//   );
// }


import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

export default function Game() {
  const [point, setPoint] = useState(0);
  const [betAmount, setBetAmount] = useState('');
  const [isRolling, setIsRolling] = useState(false);
  const [resultDice, setResultDice] = useState(1);
  // 애니메이션용 각도 상태
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const navigate = useNavigate();
  const user = auth.currentUser;
  const { t } = useLanguage();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchPoint();
  }, [user, navigate]);

  const fetchPoint = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) setPoint(userDoc.data().point || 0);
    } catch (e) { console.log(e); }
  };

  const handleBetPercent = (percent) => {
    if (percent === 0) { setBetAmount(''); return; }
    const amount = Math.floor(point * percent);
    setBetAmount(String(amount));
  };

  // 🎲 결과에 따른 최종 각도 계산
  const getFinalRotation = (num) => {
    switch (num) {
        case 1: return { x: 0, y: 0 };
        case 2: return { x: 0, y: -90 }; // 2가 보이려면 Y축 -90도
        case 3: return { x: 0, y: 180 }; // 뒷면
        case 4: return { x: 0, y: 90 };
        case 5: return { x: -90, y: 0 };
        case 6: return { x: 90, y: 0 };
        default: return { x: 0, y: 0 };
    }
  };

  const handleGame = async (choice) => {
    const bet = parseInt(betAmount);
    if (isNaN(bet) || bet <= 0) return alert(t.alertInputBet);
    if (bet > Math.floor(point)) return alert(t.alertNoMoney);
    if (isRolling) return;

    setIsRolling(true);
    
    // 1. 선차감
    let currentPoint = point - bet;
    setPoint(currentPoint);

    await addDoc(collection(db, "history"), {
        uid: user.uid, type: "게임", msg: `홀짝 배팅 (${choice})`, amount: -bet, createdAt: serverTimestamp()
    });

    // 2. 결과 결정
    const finalNum = Math.floor(Math.random() * 6) + 1;
    const resultType = finalNum % 2 !== 0 ? '홀' : '짝';
    
    // 3. 굴리기 시작 (무작위 회전 애니메이션)
    // 약간의 딜레이 후 최종 각도로 안착
    setTimeout(async () => {
        // 최종 각도 설정
        const finalRot = getFinalRotation(finalNum);
        // 회전 효과를 극대화하기 위해 몇 바퀴 더 돌림 (720도 + 최종각도)
        setRotation({ 
            x: 720 + finalRot.x, 
            y: 720 + finalRot.y 
        });
        setResultDice(finalNum);

        // 4. 승패 정산 (애니메이션 끝난 후)
        setTimeout(async () => {
            let msg = "";
            let winMoney = 0;

            if (choice === resultType) {
                winMoney = Math.floor(bet * 1.98);
                currentPoint += winMoney;
                msg = `${t.win} (+${winMoney.toLocaleString()})`;
                
                await addDoc(collection(db, "history"), { 
                    uid: user.uid, type: "게임", msg: "홀짝 승리", amount: winMoney, createdAt: serverTimestamp() 
                });
            } else {
                msg = t.lose;
            }

            try { await updateDoc(doc(db, "users", user.uid), { point: currentPoint }); } catch (e) {}
            
            setIsRolling(false);
            setPoint(currentPoint);
            setBetAmount('');
            
            // 결과 알림은 조금 더 뒤에
            setTimeout(() => alert(msg), 100);

        }, 1200); // 1.2초 뒤 정산 (회전 종료 시점)

    }, 100);
  };

  // 주사위 눈(Pip) 렌더링 헬퍼
  const renderPips = (count) => {
      // 핍 위치 설정 (CSS Grid 활용 예정)
      // 각 숫자에 맞는 점의 위치를 반환
      // style={{ gridArea: ... }} 등을 활용하거나, 미리 정의된 클래스 사용
      return (
          <div className={`face face-${count}`}>
             {Array.from({ length: count }).map((_, i) => (
                 <span key={i} className="pip" />
             ))}
          </div>
      );
  };

  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: 30, background: '#121212', minHeight: '100vh', color: '#ecf0f1', overflow:'hidden', fontFamily: "'Noto Sans KR', sans-serif" }}>
      
      {/* ✨ 야추 다이스 스타일 (고퀄리티 CSS) */}
      <style>{`
        .game-area {
            perspective: 1000px;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 250px;
            margin-bottom: 20px;
        }
        .dice {
            position: relative;
            width: 100px;
            height: 100px;
            transform-style: preserve-3d;
            transition: transform 1.2s cubic-bezier(0.1, 0.9, 0.2, 1.0); /* 튕기는 듯한 효과 */
        }
        .rolling .dice {
            animation: shakeDice 0.5s infinite linear;
        }
        
        .face {
            position: absolute;
            width: 100%;
            height: 100%;
            background: linear-gradient(145deg, #ffffff, #e6e6e6); /* 고급스러운 흰색 그라데이션 */
            border-radius: 16px; /* 둥근 모서리 */
            box-shadow: inset 0 0 10px rgba(0,0,0,0.1), 0 0 5px rgba(0,0,0,0.2);
            display: flex;
            justify-content: center;
            align-items: center;
            /* 테두리 살짝 */
            border: 1px solid #ccc;
        }

        /* 각 면의 위치 */
        .face-1 { transform: rotateY(0deg) translateZ(50px); }
        .face-2 { transform: rotateY(90deg) translateZ(50px); }
        .face-3 { transform: rotateY(180deg) translateZ(50px); }
        .face-4 { transform: rotateY(-90deg) translateZ(50px); }
        .face-5 { transform: rotateX(90deg) translateZ(50px); }
        .face-6 { transform: rotateX(-90deg) translateZ(50px); }

        /* 점(Pip) 스타일 */
        .pip {
            display: block;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background-color: #333;
            box-shadow: inset 0 3px 5px rgba(0,0,0,0.8); /* 점이 파여있는 느낌 */
        }

        /* 점 배치 로직 (Flex/Grid 대체) */
        .face { display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr); padding: 12px; box-sizing: border-box; }
        
        /* 1: 중앙 */
        .face-1 .pip:nth-child(1) { grid-area: 2 / 2 / 3 / 3; }
        
        /* 2: 대각선 */
        .face-2 .pip:nth-child(1) { grid-area: 1 / 1 / 2 / 2; }
        .face-2 .pip:nth-child(2) { grid-area: 3 / 3 / 4 / 4; }

        /* 3: 대각선 + 중앙 */
        .face-3 .pip:nth-child(1) { grid-area: 1 / 1 / 2 / 2; }
        .face-3 .pip:nth-child(2) { grid-area: 2 / 2 / 3 / 3; }
        .face-3 .pip:nth-child(3) { grid-area: 3 / 3 / 4 / 4; }

        /* 4: 모서리 */
        .face-4 .pip:nth-child(1) { grid-area: 1 / 1 / 2 / 2; }
        .face-4 .pip:nth-child(2) { grid-area: 1 / 3 / 2 / 4; }
        .face-4 .pip:nth-child(3) { grid-area: 3 / 1 / 4 / 2; }
        .face-4 .pip:nth-child(4) { grid-area: 3 / 3 / 4 / 4; }

        /* 5: 모서리 + 중앙 */
        .face-5 .pip:nth-child(1) { grid-area: 1 / 1 / 2 / 2; }
        .face-5 .pip:nth-child(2) { grid-area: 1 / 3 / 2 / 4; }
        .face-5 .pip:nth-child(3) { grid-area: 2 / 2 / 3 / 3; }
        .face-5 .pip:nth-child(4) { grid-area: 3 / 1 / 4 / 2; }
        .face-5 .pip:nth-child(5) { grid-area: 3 / 3 / 4 / 4; }

        /* 6: 세로 2줄 */
        .face-6 .pip:nth-child(1) { grid-area: 1 / 1 / 2 / 2; }
        .face-6 .pip:nth-child(2) { grid-area: 1 / 3 / 2 / 4; }
        .face-6 .pip:nth-child(3) { grid-area: 2 / 1 / 3 / 2; }
        .face-6 .pip:nth-child(4) { grid-area: 2 / 3 / 3 / 4; }
        .face-6 .pip:nth-child(5) { grid-area: 3 / 1 / 4 / 2; }
        .face-6 .pip:nth-child(6) { grid-area: 3 / 3 / 4 / 4; }
        
        @keyframes shakeDice {
            0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
            25% { transform: rotateX(90deg) rotateY(45deg) rotateZ(10deg); }
            50% { transform: rotateX(180deg) rotateY(90deg) rotateZ(-10deg); }
            75% { transform: rotateX(270deg) rotateY(135deg) rotateZ(10deg); }
            100% { transform: rotateX(360deg) rotateY(180deg) rotateZ(0deg); }
        }
      `}</style>

      <h1 className="title" style={{ fontSize: '32px', marginBottom: '5px', color: '#bdc3c7', letterSpacing:'-1px' }}>🎲 YACHT ODD/EVEN</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '30px', fontSize:'14px' }}>Classic Dice Game (x1.98)</p>
      
      <div className="card" style={{ background: '#2c3e50', padding: '15px 25px', borderRadius: '15px', marginBottom: '20px', display:'inline-block', minWidth:'200px', boxShadow:'0 10px 20px rgba(0,0,0,0.3)' }}>
        <div style={{ fontSize: '14px', color:'#bdc3c7' }}>MY ASSET</div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color:'#f1c40f' }}>{Math.floor(point).toLocaleString()}</div>
      </div>

      {/* 🎲 3D 주사위 영역 */}
      <div className={`game-area ${isRolling ? 'rolling' : ''}`}>
        <div className="dice" style={{ 
            transform: isRolling 
                ? `rotateX(${rotation.x + 360}deg) rotateY(${rotation.y + 360}deg)` // 굴러갈 때 (CSS animation이 덮어씀)
                : `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` // 결과 고정
        }}>
          {renderPips(1)}
          {renderPips(2)}
          {renderPips(3)}
          {renderPips(4)}
          {renderPips(5)}
          {renderPips(6)}
        </div>
      </div>

      <div style={{ padding:'0 20px', maxWidth:'400px', margin:'0 auto' }}>
        <input 
            className="input" 
            type="number" 
            placeholder={t.inputBet || "배팅 금액"} 
            value={betAmount} 
            onChange={(e) => setBetAmount(e.target.value)} 
            style={{ 
                fontSize: '20px', textAlign: 'center', width: '100%', marginBottom: '15px', 
                background:'#333', border:'none', padding:'15px', borderRadius:'10px', color:'white', outline:'none'
            }} 
            disabled={isRolling} 
        />
        
        {!isRolling && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '25px' }}>
            <button className="btn" style={{flex:1, padding:'10px', fontSize:'13px', background:'#555', borderRadius:'8px', color:'#fff'}} onClick={()=>handleBetPercent(0.1)}>10%</button>
            <button className="btn" style={{flex:1, padding:'10px', fontSize:'13px', background:'#555', borderRadius:'8px', color:'#fff'}} onClick={()=>handleBetPercent(0.5)}>50%</button>
            <button className="btn" style={{flex:1, padding:'10px', fontSize:'13px', background:'#e74c3c', borderRadius:'8px', color:'white', fontWeight:'bold'}} onClick={()=>handleBetPercent(1)}>ALL</button>
        </div>
        )}

        {!isRolling ? (
        <div style={{ display: 'flex', gap: 15 }}>
          <button 
            style={{ 
                flex: 1, background: 'linear-gradient(145deg, #e74c3c, #c0392b)', border:'none',
                fontSize: '20px', padding: '20px', borderRadius:'15px', color:'white', fontWeight:'bold',
                boxShadow: '0 5px 0 #96281b', cursor:'pointer', transition:'transform 0.1s'
            }} 
            onClick={() => handleGame('홀')}
            onMouseDown={e => e.currentTarget.style.transform = 'translateY(4px)'}
            onMouseUp={e => e.currentTarget.style.transform = 'translateY(0)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            🔴 홀 (Odd)
          </button>
          
          <button 
            style={{ 
                flex: 1, background: 'linear-gradient(145deg, #3498db, #2980b9)', border:'none',
                fontSize: '20px', padding: '20px', borderRadius:'15px', color:'white', fontWeight:'bold',
                boxShadow: '0 5px 0 #1f618d', cursor:'pointer', transition:'transform 0.1s'
            }} 
            onClick={() => handleGame('짝')}
            onMouseDown={e => e.currentTarget.style.transform = 'translateY(4px)'}
            onMouseUp={e => e.currentTarget.style.transform = 'translateY(0)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            🔵 짝 (Even)
          </button>
        </div>
        ) : (
            <div style={{ 
                padding: '20px', fontSize: '18px', fontWeight: 'bold', color: '#f1c40f',
                background: 'rgba(241, 196, 15, 0.1)', borderRadius: '10px', border:'1px solid #f1c40f'
            }}> 
                🎲 Rolling the dice...
            </div>
        )}
      </div>

      <button className="btn" style={{ marginTop: 40, background: 'transparent', border:'1px solid #555', width: '80%', padding:'15px', color:'#888' }} onClick={() => navigate('/home')} disabled={isRolling}>
         ← {t.home || "나가기"} 
      </button>
    </div>
  );
}