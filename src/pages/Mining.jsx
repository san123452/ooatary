import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
// 👇 [수정] addDoc, collection, serverTimestamp 추가됨
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// ✨ 고급 애니메이션 및 스타일 정의
const styles = `
  @keyframes shake-hard {
    0% { transform: translate(0, 0) rotate(0deg); }
    10% { transform: translate(-5px, -5px) rotate(-5deg); }
    20% { transform: translate(5px, 5px) rotate(5deg); }
    30% { transform: translate(-5px, 5px) rotate(-5deg); }
    40% { transform: translate(5px, -5px) rotate(5deg); }
    50% { transform: translate(0, 0) rotate(0deg); }
    100% { transform: translate(0, 0) rotate(0deg); }
  }
  @keyframes glow {
    0% { box-shadow: 0 0 10px rgba(255,255,255,0.5); }
    50% { box-shadow: 0 0 30px rgba(255,255,255,1); }
    100% { box-shadow: 0 0 10px rgba(255,255,255,0.5); }
  }
  @keyframes rainbow-glow {
    0% { box-shadow: 0 0 20px rgba(255,0,0,0.8); filter: hue-rotate(0deg); }
    50% { box-shadow: 0 0 50px rgba(0,255,0,0.8); }
    100% { box-shadow: 0 0 20px rgba(0,0,255,0.8); filter: hue-rotate(360deg); }
  }
  @keyframes bounce-in {
    0% { transform: scale(0); opacity: 0; }
    60% { transform: scale(1.1); opacity: 1; }
    100% { transform: scale(1); }
  }
  .capsule-modal {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.85); z-index: 1000;
    display: flex; justify-content: center; align-items: center;
    backdrop-filter: blur(5px);
  }
  .capsule-content {
    background: #2f3640; padding: 40px; border-radius: 20px;
    text-align: center; border: 2px solid #555;
    animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    max-width: 90%; width: 400px; position: relative;
    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  }
  .machine-glass {
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
    border-top: 1px solid rgba(255,255,255,0.3);
    border-left: 1px solid rgba(255,255,255,0.3);
    box-shadow: inset 0 0 20px rgba(255,255,255,0.1);
  }
`;

export default function Gacha() {
  const [point, setPoint] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [prizeData, setPrizeData] = useState(null); 

  const navigate = useNavigate();
  const user = auth.currentUser;
  const timerRef = useRef(null);
  const STORAGE_KEY = `gachaCooldown_v2_${user?.uid}`;

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchPoint();
    
    const savedEndTime = localStorage.getItem(STORAGE_KEY);
    if (savedEndTime) {
      const remaining = Math.ceil((parseInt(savedEndTime) - Date.now()) / 1000);
      if (remaining > 0) {
        setCooldown(remaining);
        startTimer(remaining); 
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    return () => clearInterval(timerRef.current);
  }, [user, navigate]);

  const fetchPoint = async () => {
    try {
      const d = await getDoc(doc(db, "users", user.uid));
      if (d.exists()) setPoint(d.data().point || 0);
    } catch (e) { console.error(e); }
  };

  const startTimer = (seconds) => {
    clearInterval(timerRef.current);
    let timeLeft = seconds;
    setCooldown(timeLeft);

    timerRef.current = setInterval(() => {
      timeLeft -= 1;
      setCooldown(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(timerRef.current);
        localStorage.removeItem(STORAGE_KEY);
      }
    }, 1000);
  };

  const playGacha = async () => {
    if (cooldown > 0 || isLoading) return;
    if (navigator.vibrate) navigator.vibrate(50);
    setIsLoading(true);

    setTimeout(async () => {
      const rand = Math.random() * 100;
      let prize = 0;
      let tier = ""; 
      let color = "";
      let msg = "";

      // 🔥 확률 및 당첨금 로직
      if (rand < 0.1) {
        prize = 1000000000; // 10억
        tier = "GOD";
        color = "conic-gradient(#ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)"; 
        msg = "🌌 우주 창조의 캡슐";
      } else if (rand < 1.1) { // 1%
        prize = 100000000; // 1억
        tier = "MYTHIC"; 
        color = "linear-gradient(45deg, #000, #444, #000)"; 
        msg = "🏴‍☠️ 전설의 블랙 캡슐";
      } else if (rand < 6.1) { // 5%
        prize = 5000000; // 💎 500만
        tier = "LEGEND"; 
        color = "linear-gradient(45deg, #00d2d3, #54a0ff)"; 
        msg = "💎 다이아몬드 캡슐";
      } else if (rand < 16.1) { // 10%
        prize = 1000000; // 💰 100만
        tier = "EPIC"; 
        color = "linear-gradient(45deg, #f1c40f, #e67e22)"; 
        msg = "👑 황금 캡슐";
      } else { // 나머지
        prize = Math.floor(Math.random() * 50001) + 50000; // 💊 5~10만
        tier = "COMMON"; 
        color = "linear-gradient(45deg, #ff4757, #ff6b81)"; 
        msg = "💊 일반 캡슐";
      }

      try {
        // 1. 포인트 지급
        await updateDoc(doc(db, "users", user.uid), { point: increment(prize) });
        setPoint(prev => prev + prize); 

        // 2. 📜 [추가됨] 기록 저장 (History Log)
        await addDoc(collection(db, "history"), {
            uid: user.uid,
            type: "가챠",
            msg: `${msg} 당첨`,
            amount: prize,
            createdAt: serverTimestamp()
        });
        
        // 3. 모달 및 연출
        setPrizeData({ tier, msg, money: prize, color });
        setShowModal(true);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]); 

        const coolTime = 60;
        const endTime = Date.now() + (coolTime * 1000);
        localStorage.setItem(STORAGE_KEY, endTime);
        startTimer(coolTime);

      } catch (e) {
        alert("오류 발생: " + e.message);
      } finally {
        setIsLoading(false);
      }
    }, 1200);
  };

  const closeModal = () => {
    setShowModal(false);
    setPrizeData(null);
  };

  const progress = Math.min(100, (cooldown / 60) * 100);

  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: 30, background: '#131517', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>
      <style>{styles}</style>
      
      <h1 className="title" style={{ 
          background: 'linear-gradient(to right, #f1c40f, #e67e22)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent',
          fontSize: '28px', marginBottom: '10px' 
      }}>
        ガチャガチャ
      </h1>
      
      <div style={{ 
          background: 'rgba(255,255,255,0.05)', display: 'inline-block', 
          padding: '10px 25px', borderRadius: '50px', border: '1px solid #333',
          fontSize: '20px', fontWeight: 'bold', color: '#f1c40f', marginBottom: '30px'
      }}>
        💎 {point.toLocaleString()} P
      </div>

      <div style={{ position: 'relative', width: '280px', margin: '0 auto' }}>
        <div className="machine-glass" style={{
            width: '280px', height: '280px', borderRadius: '50%', 
            background: '#222', position: 'relative',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            border: '8px solid #333', boxShadow: '0 0 30px rgba(0,0,0,0.5)'
        }}>
            <div style={{ fontSize: '120px', filter: isLoading ? 'blur(2px)' : 'none', transition: '0.3s', animation: isLoading ? 'shake-hard 0.5s infinite' : 'none' }}>
                {cooldown > 0 ? '🔒' : '🌏'}
            </div>

            {cooldown > 0 && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.7)', borderRadius: '50%',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                    backdropFilter: 'blur(3px)'
                }}>
                    <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#e74c3c' }}>{cooldown}</div>
                    <div style={{ fontSize: '14px', color: '#aaa' }}>RECHARGING...</div>
                </div>
            )}
        </div>

        <button 
          onClick={playGacha}
          disabled={cooldown > 0 || isLoading}
          style={{
            marginTop: '-40px',
            position: 'relative', zIndex: 10,
            width: '220px', height: '70px',
            background: cooldown > 0 ? '#555' : 'linear-gradient(90deg, #e67e22, #f1c40f)',
            border: 'none', borderRadius: '15px',
            color: 'white', fontSize: '20px', fontWeight: 'bold',
            boxShadow: cooldown > 0 ? 'none' : '0 10px 0 #d35400, 0 10px 20px rgba(0,0,0,0.4)',
            cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
            transition: 'all 0.1s',
            transform: isLoading ? 'translateY(10px)' : 'translateY(0)',
          }}
        >
          {isLoading ? "GACHA..." : cooldown > 0 ? "WAIT" : "PULL !"}
        </button>

        <div style={{ width: '100%', height: '6px', background: '#333', marginTop: '40px', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#2ecc71', transition: 'width 1s linear' }} />
        </div>
      </div>

      {/* 📊 확률 및 당첨금 표 */}
      <div className="card" style={{ 
          background: '#1e2227', marginTop: 40, padding: '20px', 
          border: '1px solid #333', borderRadius: '15px', maxWidth: '400px', margin: '40px auto' 
      }}>
        <div style={{ color: '#777', fontSize: '12px', marginBottom: '15px', letterSpacing: '2px' }}>REWARD TABLE</div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #333' }}>
            <span style={{ color: '#ff00ff', fontWeight:'bold', textShadow:'0 0 5px #ff00ff' }}>🌌 신 (神) <span style={{fontSize:10, color:'#aaa'}}>(10억)</span></span>
            <span style={{ color: '#fff', fontWeight: 'bold' }}>0.1%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #333' }}>
            <span style={{ color: '#aaa' }}>⚫ 신화 (神話) <span style={{fontSize:10, color:'#aaa'}}>(1억)</span></span>
            <span style={{ color: '#fff', fontWeight: 'bold' }}>1%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #333' }}>
            <span style={{ color: '#00d2d3' }}>💎 초대박 (大当たり) <span style={{fontSize:10, color:'#aaa'}}>(500만)</span></span>
            <span style={{ color: '#fff', fontWeight: 'bold' }}>5%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #333' }}>
            <span style={{ color: '#f1c40f' }}>💰 대박 (当たり) <span style={{fontSize:10, color:'#aaa'}}>(100만)</span></span>
            <span style={{ color: '#fff', fontWeight: 'bold' }}>10%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ color: '#ff6b81' }}>💊 일반 (普通) <span style={{fontSize:10, color:'#aaa'}}>(5~10만)</span></span>
            <span style={{ color: '#fff', fontWeight: 'bold' }}>83.9%</span>
        </div>
      </div>
      
      <button className="btn" style={{ background: 'transparent', border: '1px solid #444', color: '#888', marginTop: 20 }} onClick={() => navigate('/home')}>
        &larr; 돌아가기
      </button>

      {/* ✨ 결과 모달 */}
      {showModal && prizeData && (
        <div className="capsule-modal" onClick={closeModal}>
          <div className="capsule-content" onClick={(e) => e.stopPropagation()}>
            
            <div style={{ 
                fontSize: '14px', color: '#aaa', letterSpacing: '2px', marginBottom: '10px' 
            }}>
                CONGRATULATIONS
            </div>

            <div style={{ 
                width: '120px', height: '120px', borderRadius: '50%', margin: '0 auto 20px',
                background: prizeData.color,
                boxShadow: `0 0 30px ${prizeData.tier === 'GOD' ? '#ff00ff' : (prizeData.tier === 'MYTHIC' ? '#fff' : prizeData.color)}`, 
                animation: prizeData.tier === 'GOD' ? 'rainbow-glow 1s infinite linear' : 'glow 1.5s infinite alternate',
                display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '50px'
            }}>
               {prizeData.tier === 'GOD' ? '🌌' : prizeData.tier === 'MYTHIC' ? '🏴‍☠️' : prizeData.tier === 'LEGEND' ? '💎' : prizeData.tier === 'EPIC' ? '👑' : '💊'}
            </div>

            <h2 style={{ 
                margin: '10px 0', fontSize: '24px', 
                color: prizeData.tier === 'GOD' ? '#ff00ff' : (prizeData.tier === 'MYTHIC' ? '#fff' : (prizeData.tier === 'LEGEND' ? '#00d2d3' : '#f1c40f')) 
            }}>
                {prizeData.msg}
            </h2>
            
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', margin: '15px 0' }}>
                +{prizeData.money.toLocaleString()} 원
            </div>

            <button 
                className="btn" 
                onClick={closeModal}
                style={{ 
                    width: '100%', background: '#fff', color: '#000', 
                    fontWeight: 'bold', padding: '15px', borderRadius: '10px' 
                }}
            >
                확인
            </button>
          </div>
        </div>
      )}

    </div>
  );
}