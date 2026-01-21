import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, doc, getDoc, setDoc, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function Home() {
  const [myPoint, setMyPoint] = useState(0);
  const [myTierLevel, setMyTierLevel] = useState(0);
  const [myTierName, setMyTierName] = useState("언랭크");
  const [isAdmin, setIsAdmin] = useState(false);
  const [rankers, setRankers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          if (user.email === "kks3172@naver.com") setIsAdmin(true);
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            await setDoc(userRef, { email: user.email, name: "익명", point: 30000, tierLevel: 0, tierName: "언랭크" }, { merge: true });
          } else {
            const data = userSnap.data();
            setMyPoint(data.point || 0);
            setMyTierLevel(data.tierLevel || 0);
            setMyTierName(data.tierName || "언랭크");
          }

          try {
            const noticeSnap = await getDoc(doc(db, "system", "notice"));
            if (noticeSnap.exists()) setNotice(noticeSnap.data().text || "");
          } catch (e) { }

          const querySnapshot = await getDocs(collection(db, "users"));
          const allUsers = querySnapshot.docs.map(d => {
            const data = d.data();
            return {
              name: data.name,
              point: data.point || 0,
              tierLevel: data.tierLevel || 0,
              tierName: data.tierName || "언랭크"
            };
          });

          allUsers.sort((a, b) => {
            if (b.tierLevel !== a.tierLevel) return b.tierLevel - a.tierLevel;
            return b.point - a.point;
          });

          setRankers(allUsers.slice(0, 10));
          setLoading(false);
        } else {
          navigate('/login');
        }
      } catch (err) { setLoading(false); }
    });
    return () => unsubscribeAuth();
  }, [navigate]);

  if (loading) return <div style={{ background: '#2c3e50', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}><h2>로딩 중...</h2></div>;

  return (
    <div className="container" style={{ background: '#2c3e50', minHeight: '100vh', padding: 20, color: 'white' }}>

      {/* 1. 상단 내 정보 카드 */}
      <div className="card" style={{
        marginBottom: 15, background: '#34495e', padding: 15, borderRadius: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        border: '1px solid #7f8c8d', boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* 티어 이미지 */}
          <div style={{ width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={`/tiers/${myTierLevel}.png`}
              alt={myTierName}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={e => e.target.style.display = 'none'}
            />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#bdc3c7' }}>{myTierName}</div>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#f1c40f' }}>{Math.floor(myPoint).toLocaleString()}원</span>
          </div>
        </div>
        <button className="btn" style={{ background: '#e74c3c', fontSize: '12px', padding: '5px 10px' }} onClick={() => signOut(auth)}>로그아웃</button>
      </div>

      {/* 2. 승급 심사 (상점) 버튼 */}
      <button className="card" style={{
        width: '100%',
        background: 'linear-gradient(90deg, #8e44ad, #c0392b)',
        border: '2px solid #f1c40f', // 노란색 테두리 통일
        marginBottom: 20, padding: 15, cursor: 'pointer',
        boxShadow: '0 0 10px rgba(241, 196, 15, 0.3)' // 노란색 광채 효과
      }} onClick={() => navigate('/shop')}>
        <div style={{ textAlign: 'center', color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
          🏆 상점
        </div>
      </button>

      {/* 3. 공지사항 */}
      {notice && (
        <div style={{ background: '#f39c12', color: '#2c3e50', padding: '10px 15px', marginBottom: '20px', borderRadius: '8px', display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
          <span style={{ marginRight: '10px' }}>📢</span><marquee>{notice}</marquee>
        </div>
      )}

      {/* 4. 랭킹 리스트 */}
      <div className="card" style={{ background: '#222', border: '2px solid #f1c40f', marginBottom: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 15, color: '#f1c40f', fontWeight: 'bold', fontSize: '16px', paddingBottom: 10, borderBottom: '1px solid #444' }}>🏆 전체 티어 랭킹 TOP 10</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {rankers.map((user, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: idx === 0 ? 'rgba(241, 196, 15, 0.1)' : 'transparent', borderRadius: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '20px', textAlign: 'center', color: idx < 3 ? '#f1c40f' : '#7f8c8d', fontWeight: 'bold' }}>{idx + 1}</span>
                <img
                  src={`/tiers/${user.tierLevel}.png`}
                  alt={user.tierName}
                  style={{ width: '30px', height: '30px', objectFit: 'contain' }}
                  onError={e => e.target.style.display = 'none'}
                />
                <span style={{ fontSize: '14px' }}>{user.name || "익명"}</span>
              </div>
              <span style={{ color: '#f1c40f', fontSize: '14px' }}>{Math.floor(user.point).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 15 }}><button onClick={() => window.location.reload()} style={{ fontSize: '12px', background: 'transparent', border: 'none', color: '#777', cursor: 'pointer' }}>🔄 랭킹 업데이트</button></div>
      </div>

      {/* 5. 게임 존 (GAME ZONE) */}
      <div className="card" style={{
        background: '#34495e',
        border: '2px solid #f1c40f', // ✨ 요청하신 노란색 테두리 적용!
        marginBottom: 20, padding: '20px',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute', top: -12, left: 20, background: '#2c3e50', padding: '0 10px',
          color: '#f1c40f', fontWeight: 'bold', fontSize: '16px'
        }}>
          🎮 GAME ZONE
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: 10 }}>
          {/* 가챠 & 무료충전 */}
          <button className="btn" style={{ background: '#27ae60', padding: '15px', borderRadius: '8px', fontSize: '16px' }} onClick={() => navigate('/mining')}>💎 가챠가챠</button>
          <button className="btn" style={{ background: '#b6cf26', padding: '15px', borderRadius: '8px', fontSize: '16px' }} onClick={() => navigate('/board')}>👑테토카페(시즌3)</button>


          {/* 배틀 아레나 (강조) */}
          <button className="btn" style={{ background: 'linear-gradient(45deg, #6a11cb 0%, #2575fc 100%)', padding: '15px', borderRadius: '8px', gridColumn: 'span 2', fontSize: '16px', border: '1px solid #aab7b8' }} onClick={() => navigate('/gamelobby')}>
            ⚔️ 1:1  (PvP)
          </button>

          {/* 일반 게임들 */}
          <button className="btn" style={{ background: '#e74c3c', padding: '15px', borderRadius: '8px' }} onClick={() => navigate('/game')}>🎲 홀짝</button>
          <button className="btn" style={{ background: '#8e44ad', padding: '15px', borderRadius: '8px' }} onClick={() => navigate('/slot')}>🎰 슬롯</button>
          <button className="btn" style={{ background: '#2980b9', padding: '15px', borderRadius: '8px' }} onClick={() => navigate('/rps')}>✌️ 가위바위보</button>
          <button className="btn" style={{ background: '#d35400', padding: '15px', borderRadius: '8px' }} onClick={() => navigate('/blackjack')}>🃏 블랙잭</button>
          <button className="btn" style={{ background: '#c0392b', padding: '15px', borderRadius: '8px' }} onClick={() => navigate('/fight')}>🥊 격투기</button>
          <button className="btn" style={{ background: '#f39c12', padding: '15px', borderRadius: '8px' }} onClick={() => navigate('/roulette')}>🎡 천사악마</button>
          <button className="btn" style={{ background: '#1abc9c', padding: '15px', borderRadius: '8px' }} onClick={() => navigate('/horseracing')}>🏇 경마장</button>
          <button className="btn" style={{ background: '#34495e', padding: '15px', borderRadius: '8px', border: '1px solid #7f8c8d' }} onClick={() => navigate('/ladder')}>🎢 다리다리</button>
          {/* <button className="btn" style={{ background: '#0984e3', padding: '15px', borderRadius: '8px' }} onClick={() => navigate('/fishing')}>🎣 낚시게임</button> */}
          <button className="btn" style={{ background: '#16a085', padding: '15px', borderRadius: '8px' }} onClick={() => navigate('/mines')}>💣 지뢰찾기</button>
          <button className="btn" style={{ background: '#9b59b6', padding: '15px', borderRadius: '8px' }} onClick={() => navigate('/crash')}>🚀 그래프</button>
          <button className="btn" style={{ background: '#2c3e50', padding: '15px', borderRadius: '8px', border: '1px solid #7f8c8d' }} onClick={() => navigate('/highlow')}>🃏 하이로우</button>
          {/* <button className="btn" style={{ background: '#8e44ad', padding: '15px', borderRadius: '8px' }} onClick={() => navigate('/keno')}>🎱 키노</button> */}
          <button className="btn" style={{ background: '#d35400', padding: '15px', borderRadius: '8px' }} onClick={() => navigate('/roulette2')}>🎡 유러피언</button>
          <button className="btn" style={{ background: '#ff6b6b', padding: '15px', borderRadius: '8px' }} onClick={() => navigate('/ostrich')}>🦩 타조 게임</button>

          {/* 송금하기 (하단 강조) */}
        
        </div>
      </div>

      {/* 6. 관리자 전용 메뉴 */}
      {isAdmin && (
        <div className="card" style={{ background: '#2c3e50', border: '1px dashed #f1c40f', marginBottom: 20, padding: 15 }}>
          <div style={{ marginBottom: 10, textAlign: 'center', color: '#f1c40f', fontWeight: 'bold' }}>👑 관리자 전용</div>
          <div className="flex-row">
            <button className="btn" style={{ flex: 1, background: '#f1c40f', color: '#2c3e50', fontWeight: 'bold' }} onClick={() => navigate('/admin')}>📢 공지 관리</button>
            <button className="btn" style={{ flex: 1, background: '#333', border: '1px solid #555' }} onClick={() => navigate('/admin')}>👥 회원 관리</button>
          </div>
        </div>
      )}

    </div>
  );
}