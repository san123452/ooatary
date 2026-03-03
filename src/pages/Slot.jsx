
// import React, { useState, useEffect } from 'react';
// import { db, auth } from '../firebase';
// import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';
// import { useLanguage } from '../LanguageContext'; // 👈

// export default function Slot() {
//   const [point, setPoint] = useState(0);
//   const [bet, setBet] = useState('');
//   const [reels, setReels] = useState(['❓', '❓', '❓']);
//   const [spinning, setSpinning] = useState(false);
//   const navigate = useNavigate();
//   const user = auth.currentUser;
//   const { t } = useLanguage(); // 👈

//   const symbols = ['🍒', '🍋', '🍉', '⭐', '7️⃣'];

//   useEffect(() => { if (!user) { navigate('/login'); return; } fetchPoint(); }, [user, navigate]);
//   const fetchPoint = async () => { try { const d = await getDoc(doc(db, "users", user.uid)); if (d.exists()) setPoint(d.data().point || 0); } catch (e) {} };
//   const handleBetPercent = (percent) => { if (percent === 0) { setBet(''); return; } const amount = Math.floor(point * percent); setBet(String(amount)); };

//   const spin = async () => {
//     const betMoney = parseInt(bet);
//     if (isNaN(betMoney) || betMoney <= 0) return alert(t.alertInputBet);
//     if (betMoney > Math.floor(point)) return alert(t.alertNoMoney);
//     if (spinning) return;

//     setSpinning(true);
//     try {
//         await updateDoc(doc(db, "users", user.uid), { point: increment(-betMoney) });
//         setPoint(prev => prev - betMoney);
//         await addDoc(collection(db, "history"), { uid: user.uid, type: "게임", msg: "슬롯머신 배팅", amount: -betMoney, createdAt: serverTimestamp() });
//     } catch (e) { setSpinning(false); return alert(t.alertError); }

//     let count = 0;
//     const interval = setInterval(() => {
//       setReels([ symbols[Math.floor(Math.random() * symbols.length)], symbols[Math.floor(Math.random() * symbols.length)], symbols[Math.floor(Math.random() * symbols.length)] ]);
//       count++;
//       if (count > 20) { clearInterval(interval); finalizeResult(betMoney); }
//     }, 100);
//   };

//   const finalizeResult = async (betMoney) => {
//     const r1 = symbols[Math.floor(Math.random() * symbols.length)];
//     const r2 = symbols[Math.floor(Math.random() * symbols.length)];
//     const r3 = symbols[Math.floor(Math.random() * symbols.length)];
//     setReels([r1, r2, r3]);
//     setSpinning(false);

//     let winMoney = 0;
//     let msg = t.lose;

//     if (r1 === r2 && r2 === r3) {
//       if (r1 === '7️⃣') { winMoney = betMoney * 50; msg = t.slotJackpot; } 
//       else { winMoney = betMoney * 10; msg = t.win; }
//     } else if (r1 === '7️⃣' || r2 === '7️⃣' || r3 === '7️⃣') {
//         winMoney = betMoney; 
//         msg = "Lucky Seven! (Draw)";
//     }

//     if (winMoney > 0) {
//         setPoint(prev => prev + winMoney);
//         await updateDoc(doc(db, "users", user.uid), { point: increment(winMoney) });
//         await addDoc(collection(db, "history"), { uid: user.uid, type: "게임", msg: "슬롯 당첨", amount: winMoney, createdAt: serverTimestamp() });
//         alert(`${msg} (+${winMoney.toLocaleString()})`);
//     }
//   };

//   return (
//     <div className="container" style={{ textAlign: 'center', paddingTop: 30, background: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
//       <h1 className="title" style={{ color: '#f1c40f' }}>{t.slot}</h1>
//       <div className="card" style={{ background: '#34495e', padding: '15px', marginBottom: '20px' }}> <div style={{ fontSize: 18 }}>{t.balance}</div> <div style={{ fontSize: 30, fontWeight: 'bold', color: '#f1c40f' }}>{Math.floor(point).toLocaleString()}</div> </div>
//       <div className="card" style={{ padding: '30px 10px', background: '#000', border: '5px solid #f1c40f', borderRadius: '15px', marginBottom: '30px' }}> <div style={{ fontSize: 60, letterSpacing: 15 }}> {reels[0]}{reels[1]}{reels[2]} </div> </div>
//       <div className="card" style={{ background: 'rgba(255,255,255,0.05)', padding: '20px' }}>
//         <input className="input" type="number" placeholder={t.inputBet} value={bet} onChange={e => setBet(e.target.value)} style={{ textAlign: 'center', fontSize: 22, width: '100%', marginBottom: '15px' }} disabled={spinning} />
//         <div style={{display:'flex', gap:5, marginBottom:20}}> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.1)} disabled={spinning}>10%</button> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.25)} disabled={spinning}>25%</button> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#7f8c8d'}} onClick={()=>handleBetPercent(0.5)} disabled={spinning}>50%</button> <button className="btn" style={{flex:1, padding:5, fontSize:12, background:'#e74c3c', color:'white', fontWeight:'bold'}} onClick={()=>handleBetPercent(1)} disabled={spinning}>ALL</button> <button className="btn" style={{width:40, padding:5, fontSize:12, background:'#95a5a6'}} onClick={()=>handleBetPercent(0)} disabled={spinning}>🔄</button> </div>
//         <button className="btn btn-warn" style={{ width: '100%', fontSize: 24, padding: 15, fontWeight: 'bold' }} onClick={spin} disabled={spinning}> {spinning ? t.loading : t.slotSpin} </button>
//       </div>
//       <button className="btn" style={{ marginTop: 30, background: '#444', width: '100%' }} onClick={() => navigate('/home')}> {t.home} </button>
//     </div>
//   );
// }


import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

const SYMBOLS = ['🍒', '🍋', '🍉', '⭐', '7️⃣'];

// 🎨 클래식 기계 외형 스타일
const styles = `
  .machine-container {
    width: 340px;
    margin: 0 auto;
    background: linear-gradient(180deg, #1a1a1a 0%, #333 30%, #222 100%);
    border: 4px solid #d4af37;
    border-radius: 20px 20px 10px 10px;
    box-shadow: 0 15px 35px rgba(0,0,0,0.9), inset 0 0 15px rgba(255,255,255,0.1);
    position: relative;
    padding: 20px 15px 30px 15px;
  }
  .machine-header {
    background: linear-gradient(to bottom, #e74c3c, #c0392b);
    border: 3px solid #f1c40f;
    border-radius: 10px;
    padding: 5px;
    text-align: center;
    margin-bottom: 20px;
    box-shadow: 0 0 15px rgba(231, 76, 60, 0.8);
    position: relative;
    overflow: hidden;
  }
  .machine-header::after {
    content: '';
    position: absolute;
    top: 0; left: -100%; width: 50%; height: 100%;
    background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%);
    animation: shine 3s infinite;
  }
  @keyframes shine { 100% { left: 200%; } }
  .machine-header-text {
    color: #f1c40f;
    font-size: 26px;
    font-weight: 900;
    letter-spacing: 4px;
    text-shadow: 2px 2px 0px #000, 0 0 10px #f1c40f;
  }
  /* 3D 캔버스가 들어갈 디스플레이 창 */
  .reels-display-3d {
    width: 100%;
    height: 140px;
    background: #000;
    border-radius: 10px;
    border: 5px solid #2c3e50;
    box-shadow: inset 0 10px 20px rgba(0,0,0,0.8), 0 0 10px #000;
    position: relative;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  /* 유리창 반사 효과 및 붉은색 당첨 라인 */
  .reels-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(255,255,255,0) 25%, rgba(255,255,255,0) 75%, rgba(0,0,0,0.6) 100%);
    pointer-events: none;
    z-index: 10;
  }
  .win-line-3d {
    position: absolute;
    top: 50%; left: 0; width: 100%; height: 4px;
    background: rgba(231, 76, 60, 0.7);
    transform: translateY(-50%);
    z-index: 15;
    box-shadow: 0 0 15px red;
    pointer-events: none;
  }
  /* 슬롯 손잡이 (레버) */
  .lever-container {
    position: absolute;
    right: -40px;
    top: 35%;
    width: 40px;
    height: 140px;
  }
  .lever-base {
    width: 20px;
    height: 50px;
    background: linear-gradient(90deg, #555, #222);
    border-radius: 5px;
    position: absolute;
    top: 45px;
    left: 0;
    box-shadow: inset 2px 2px 5px #777, 2px 2px 5px #000;
  }
  .lever-stick {
    width: 10px;
    height: 90px;
    background: linear-gradient(90deg, #d4af37, #997a00);
    position: absolute;
    bottom: 45px;
    left: 5px;
    transform-origin: bottom center;
    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    border-radius: 5px;
    z-index: -1;
  }
  .lever-stick.pulled {
    transform: rotateX(160deg);
  }
  .lever-ball {
    width: 36px;
    height: 36px;
    background: radial-gradient(circle at 12px 12px, #ff7675, #c0392b);
    border-radius: 50%;
    position: absolute;
    top: -18px;
    left: -13px;
    box-shadow: 3px 5px 8px rgba(0,0,0,0.6);
  }
  .paytable {
    margin-top: 20px;
    background: linear-gradient(#111, #000);
    border: 2px solid #d4af37;
    border-radius: 8px;
    padding: 8px;
    color: #fff;
    font-size: 12px;
    text-align: center;
    box-shadow: inset 0 0 10px rgba(0,0,0,0.8);
  }
`;

export default function Slot() {
  const [point, setPoint] = useState(0);
  const [bet, setBet] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [leverPulled, setLeverPulled] = useState(false);

  // 🔒 광클 방지 잠금장치
  const isProcessing = useRef(false);

  // 🚀 Three.js 렌더링 컨테이너 및 릴 참조
  const mountRef = useRef(null);
  const reelsRef = useRef([]); 

  const navigate = useNavigate();
  const user = auth.currentUser;
  const { t } = useLanguage();

  // 🎨 Three.js 씬(Scene) 초기화 (최초 1회)
  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchPoint();

    const width = 300;
    const height = 140;

    // 1. 씬 & 카메라
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 5.5;

    // 2. 렌더러 (투명 배경으로 캐비닛 색상과 융합)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    // 고해상도 지원
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // 3. 조명 (화려한 릴 반사 효과)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1.5, 100);
    pointLight.position.set(0, 5, 5);
    scene.add(pointLight);

    // 4. 깨지지 않는 심볼 텍스처(타일) 생성 함수
    const createTileTexture = (symbol) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 256;
      const ctx = canvas.getContext('2d');
      
      // 타일 배경 (살짝 입체감 있는 그라데이션)
      const grad = ctx.createLinearGradient(0,0,0,256);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, '#e0e0e0');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
      
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 10;
      ctx.strokeRect(0, 0, 256, 256);
      
      // 심볼 렌더링
      ctx.font = '140px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // 그림자 효과
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      ctx.fillText(symbol, 128, 140);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // 선명도 극대화
      return texture;
    };

    const symbolTextures = SYMBOLS.map(sym => createTileTexture(sym));

    // 5. 3D 릴 생성 (관람차 모양)
    const radius = 1.3; 
    for (let i = 0; i < 3; i++) {
      const reelGroup = new THREE.Group();
      reelGroup.position.x = (i - 1) * 1.6; // 간격 조정

      // 릴의 내부 드럼 (검은색 뼈대)
      const drumGeo = new THREE.CylinderGeometry(radius - 0.05, radius - 0.05, 1.4, 32);
      const drumMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 });
      const drum = new THREE.Mesh(drumGeo, drumMat);
      drum.rotation.z = Math.PI / 2;
      reelGroup.add(drum);

      // 릴 표면에 심볼 타일 부착
      for (let j = 0; j < SYMBOLS.length; j++) {
        const geo = new THREE.PlaneGeometry(1.4, 1.4); // 얇은 판
        const mat = new THREE.MeshStandardMaterial({
          map: symbolTextures[j],
          metalness: 0.1,
          roughness: 0.5,
        });
        const mesh = new THREE.Mesh(geo, mat);
        
        // 타일을 표면으로 밀어냄
        mesh.position.z = radius; 
        
        // 피봇을 기준으로 회전하여 원형 배치
        const pivot = new THREE.Group();
        pivot.rotation.x = (j / SYMBOLS.length) * Math.PI * 2;
        pivot.add(mesh);
        
        reelGroup.add(pivot);
      }
      
      scene.add(reelGroup);
      reelsRef.current[i] = { group: reelGroup };
    }

    // 6. 애니메이션 루프
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current) mountRef.current.innerHTML = '';
      renderer.dispose();
    };
  }, [user, navigate]);

  const fetchPoint = async () => { try { const d = await getDoc(doc(db, "users", user.uid)); if (d.exists()) setPoint(d.data().point || 0); } catch (e) {} };
  const handleBetPercent = (percent) => { if (percent === 0) { setBet(''); return; } const amount = Math.floor(point * percent); setBet(String(amount)); };

  // 🎰 3D 스핀 구동 및 결과 처리
  const spin = async () => {
    // 🛑 1. 광클 및 중복 방지 (가장 중요)
    if (spinning || isProcessing.current) return;
    
    const betMoney = parseInt(bet);
    if (isNaN(betMoney) || betMoney <= 0) return alert(t.alertInputBet);
    if (betMoney > Math.floor(point)) return alert(t.alertNoMoney);

    isProcessing.current = true;
    setSpinning(true);
    setLeverPulled(true); // 손잡이 당김 액션

    try {
        await updateDoc(doc(db, "users", user.uid), { point: increment(-betMoney) });
        setPoint(prev => prev - betMoney);
        await addDoc(collection(db, "history"), { uid: user.uid, type: "게임", msg: "슬롯머신 배팅", amount: -betMoney, createdAt: serverTimestamp() });
    } catch (e) { 
        setSpinning(false); 
        isProcessing.current = false;
        setLeverPulled(false);
        return alert(t.alertError); 
    }

    // 레버 복귀 애니메이션
    setTimeout(() => setLeverPulled(false), 400);

    // 🎲 결과 인덱스 랜덤 추첨 (0 ~ 4)
    const results = [
      Math.floor(Math.random() * SYMBOLS.length),
      Math.floor(Math.random() * SYMBOLS.length),
      Math.floor(Math.random() * SYMBOLS.length)
    ];

    const duration = 3200; // 3.2초간 회전
    const start = Date.now();

    // 부드러운 회전을 위한 애니메이션 루프
    const animateSpin = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      
      // 관성 효과 (Cubic Ease-out: 빠르게 돌다 천천히 멈춤)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      reelsRef.current.forEach((reelObj, i) => {
        // 왼쪽부터 순차적으로 더 많이 돎 (8바퀴, 10바퀴, 12바퀴)
        const fullSpins = (8 + i * 2) * Math.PI * 2;
        // 결과 위치에 맞게 최종 각도 설정 (음수로 돌려야 기계처럼 위에서 아래로 떨어짐)
        const targetAngle = -(results[i] / SYMBOLS.length) * Math.PI * 2;
        
        const targetRotation = fullSpins + targetAngle;
        reelObj.group.rotation.x = targetRotation * easeOut;
      });

      if (progress < 1) {
        requestAnimationFrame(animateSpin);
      } else {
        // 완전히 멈춘 후 소수점 오차 방지를 위해 각도 고정
        reelsRef.current.forEach((reelObj, i) => {
          reelObj.group.rotation.x = -(results[i] / SYMBOLS.length) * Math.PI * 2;
        });
        finalizeResult(betMoney, results);
      }
    };

    animateSpin();
  };

  const finalizeResult = async (betMoney, results) => {
    const [r1, r2, r3] = results.map(idx => SYMBOLS[idx]);

    let winMoney = 0;
    let msg = t.lose;

    if (r1 === r2 && r2 === r3) {
      if (r1 === '7️⃣') { winMoney = betMoney * 50; msg = t.slotJackpot; } 
      else { winMoney = betMoney * 10; msg = t.win; }
    } else if (r1 === '7️⃣' || r2 === '7️⃣' || r3 === '7️⃣') {
        winMoney = betMoney; 
        msg = "Lucky Seven! (Draw)";
    }

    if (winMoney > 0) {
        setPoint(prev => prev + winMoney);
        await updateDoc(doc(db, "users", user.uid), { point: increment(winMoney) });
        await addDoc(collection(db, "history"), { uid: user.uid, type: "게임", msg: "슬롯 당첨", amount: winMoney, createdAt: serverTimestamp() });
        alert(`${msg} (+${winMoney.toLocaleString()})`);
    }

    // 🔓 모든 처리가 완료된 후 잠금 해제
    setSpinning(false);
    isProcessing.current = false;
  };

  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: 30, background: '#0a0a0a', minHeight: '100vh', color: 'white', overflow: 'hidden' }}>
      <style>{styles}</style>
      
      {/* 🎰 카지노 슬롯머신 본체 */}
      <div className="machine-container">
        
        {/* 상단 잭팟 전광판 */}
        <div className="machine-header">
            <div className="machine-header-text">777 JACKPOT 777</div>
        </div>

        {/* 🚀 3D 릴 디스플레이 창 */}
        <div className="reels-display-3d">
            {/* 중앙 당첨 선 */}
            <div className="win-line-3d" />
            {/* 입체감용 유리창 필름 */}
            <div className="reels-overlay" />
            {/* Three.js 렌더링 박스 */}
            <div ref={mountRef} />
        </div>

        {/* 슬롯 레버 (오른쪽 금색 손잡이) */}
        <div className="lever-container" onClick={spin} style={{cursor: (spinning || isProcessing.current) ? 'not-allowed' : 'pointer'}}>
            <div className="lever-base" />
            <div className={`lever-stick ${leverPulled ? 'pulled' : ''}`}>
                <div className="lever-ball" />
            </div>
        </div>

        {/* 배당표 (Paytable) */}
        <div className="paytable">
            <div style={{color:'#f1c40f', marginBottom: 4, fontWeight:'bold'}}>💰 PAYTABLE 💰</div>
            <div style={{fontSize: 14}}>7️⃣7️⃣7️⃣ = x50 | 🍒🍒🍒 = x10</div>
            <div style={{color:'#bdc3c7', marginTop: 4}}>Any 7️⃣ = x1 (Draw)</div>
        </div>
      </div>

      {/* 컨트롤 패널 (배팅 및 버튼) */}
      <div className="card" style={{ background: '#1e272e', padding: '20px', borderRadius: '15px', marginTop: '30px', border: '2px solid #555' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: 18 }}> 
          <span style={{ color: '#bdc3c7' }}>{t.balance}:</span> 
          <span style={{ fontWeight: 'bold', color: '#f1c40f' }}>{Math.floor(point).toLocaleString()} P</span> 
        </div>

        <input 
          className="input" 
          type="number" 
          placeholder={t.inputBet} 
          value={bet} 
          onChange={e => setBet(e.target.value)} 
          style={{ textAlign: 'center', fontSize: 22, width: '100%', marginBottom: '15px', background: '#000', color: '#fff', border: '1px solid #444', borderRadius: '8px' }} 
          disabled={spinning || isProcessing.current} 
        />
        
        <div style={{display:'flex', gap:5, marginBottom:20}}> 
          {[0.1, 0.25, 0.5, 1].map(p => (
            <button key={p} className="btn" style={{flex:1, padding:10, fontSize:12, background:'#333', border:'1px solid #555'}} onClick={()=>handleBetPercent(p)} disabled={spinning || isProcessing.current}>
              {p === 1 ? 'ALL' : `${p*100}%`}
            </button>
          ))}
          <button className="btn" style={{width:40, padding:10, fontSize:12, background:'#555', border:'1px solid #777'}} onClick={()=>handleBetPercent(0)} disabled={spinning || isProcessing.current}>🔄</button> 
        </div>

        <button 
          className="btn btn-warn" 
          style={{ width: '100%', fontSize: 24, padding: 15, fontWeight: 'bold', background: (spinning || isProcessing.current) ? '#555' : 'linear-gradient(45deg, #e74c3c, #c0392b)', border: 'none', borderRadius: '10px', color: '#fff', boxShadow: (spinning || isProcessing.current) ? 'inset 0 4px 5px rgba(0,0,0,0.5)' : '0 6px 0 #922b21, 0 10px 10px rgba(0,0,0,0.5)' }} 
          onClick={spin} 
          disabled={spinning || isProcessing.current}
        > 
          {(spinning || isProcessing.current) ? "SPINNING..." : "PUSH LEVER / SPIN"} 
        </button>
      </div>
      
      <button className="btn" style={{ marginTop: 20, background: 'transparent', border: '1px solid #444', color: '#888', width: '100%' }} onClick={() => navigate('/home')}> {t.home} </button>
    </div>
  );
}