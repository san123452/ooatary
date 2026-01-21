import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
// query, where, getDocs, limit 등 추가
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// 🏆 티어 시스템
const TIER_SYSTEM = [
  { level: 0, name: '언랭크', cost: 0, color: '#7f8c8d' },
  { level: 1, name: '아이언', cost: 500000, color: '#454545' },
  { level: 2, name: '브론즈', cost: 1000000, color: '#cd7f32' },
  { level: 3, name: '실버', cost: 3000000, color: '#c0c0c0' },
  { level: 4, name: '골드', cost: 10000000, color: '#f1c40f' },
  { level: 5, name: '플래티넘', cost: 30000000, color: '#2ecc71' },
  { level: 6, name: '에메랄드', cost: 50000000, color: '#16a085' },
  { level: 7, name: '다이아', cost: 100000000, color: '#3498db' },
  { level: 8, name: '마스터', cost: 500000000, color: '#9b59b6' },
  { level: 9, name: '그랜드마스터', cost: 1000000000, color: '#e74c3c' },
  { level: 10, name: '챌린저', cost: 5000000000, color: '#f39c12' }
];

export default function Shop() {
  const [point, setPoint] = useState(0);
  const [myTierLevel, setMyTierLevel] = useState(0); 
  
  // 🔍 검색 관련 상태 (NEW)
  const [targetName, setTargetName] = useState(""); // 검색어
  const [selectedTarget, setSelectedTarget] = useState(null); // 선택된 유저 {id, name, tierLevel}
  const [searchResults, setSearchResults] = useState([]); 
  const [isSearching, setIsSearching] = useState(false);

  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchUserData();
  }, [user, navigate]);

  const fetchUserData = async () => {
    try {
      const d = await getDoc(doc(db, "users", user.uid));
      if (d.exists()) {
        const data = d.data();
        setPoint(data.point || 0);
        setMyTierLevel(data.tierLevel || 0);
      }
    } catch (e) { console.error(e); }
  };

  // 🔍 유저 검색 함수
  const handleSearchUser = async () => {
    if (!targetName.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    setSelectedTarget(null); // 재검색 시 선택 초기화

    try {
        const q = query(
            collection(db, "users"),
            where("name", ">=", targetName),
            where("name", "<=", targetName + "\uf8ff"),
            limit(5)
        );

        const querySnapshot = await getDocs(q);
        const users = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (doc.id !== user.uid) { // 나 자신 제외
                users.push({ id: doc.id, ...data });
            }
        });

        if (users.length === 0) alert("검색된 유저가 없습니다.");
        setSearchResults(users);

    } catch (e) {
        console.error(e);
        alert("검색 중 오류 발생");
    } finally {
        setIsSearching(false);
    }
  };

  // 유저 선택
  const selectUser = (u) => {
      setTargetName(u.name);
      setSelectedTarget(u);
      setSearchResults([]); 
  };

  // 1. 티어 승급
  const promoteTier = async (targetTier) => {
    if (myTierLevel >= targetTier.level) return;
    if (myTierLevel + 1 !== targetTier.level) return alert("이전 티어부터 승급하세요!");
    if (point < targetTier.cost) return alert("승급 비용이 부족합니다!");

    if (!window.confirm(`[${targetTier.name}] 티어로 승급하시겠습니까?\n비용: ${targetTier.cost.toLocaleString()}원`)) return;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        point: increment(-targetTier.cost),
        tierLevel: targetTier.level,
        tierName: targetTier.name
      });
      setPoint(prev => prev - targetTier.cost);
      setMyTierLevel(targetTier.level);
      alert(`🎉 승급 완료! [${targetTier.name}] 달성!`);
    } catch (e) { alert("오류 발생"); }
  };

  // 2. 닉네임 변경
  const changeNickname = async () => {
    const cost = 1000000000;
    if (point < cost) return alert("돈이 부족합니다!");
    
    const newName = prompt("변경할 닉네임을 입력하세요:");
    if (!newName || !newName.trim()) return;

    if (!window.confirm(`닉네임을 [${newName}]으로 변경하시겠습니까?\n(비용: ${cost.toLocaleString()}원)`)) return;

    try {
        await updateDoc(doc(db, "users", user.uid), { point: increment(-cost), name: newName });
        setPoint(prev => prev - cost);
        await addDoc(collection(db, "history"), { uid: user.uid, type: "상점", msg: `닉네임 변경 (${newName})`, amount: -cost, createdAt: serverTimestamp() });
        alert("닉네임 변경 완료!");
    } catch (e) { alert("오류 발생"); }
  };

  // 3. 랜덤 강등
  const randomDemote = async (cost, levelDown, includeSelf) => {
    if (point < cost) return alert("돈이 부족합니다!");
    if (!window.confirm(`랜덤 유저를 ${levelDown}단계 강등시키겠습니까?\n(비용: ${cost.toLocaleString()}원)`)) return;

    try {
        const q = query(collection(db, "users"), where("tierLevel", ">", 0));
        const querySnapshot = await getDocs(q);
        
        let targets = [];
        querySnapshot.forEach((doc) => {
            if (includeSelf || doc.id !== user.uid) targets.push({ id: doc.id, ...doc.data() });
        });

        if (targets.length === 0) return alert("강등시킬 대상이 없습니다.");

        const target = targets[Math.floor(Math.random() * targets.length)];
        let newLevel = Math.max(0, target.tierLevel - levelDown);
        const newTierName = TIER_SYSTEM[newLevel].name;

        await updateDoc(doc(db, "users", user.uid), { point: increment(-cost) });
        await updateDoc(doc(db, "users", target.id), { tierLevel: newLevel, tierName: newTierName });
        setPoint(prev => prev - cost);

        await addDoc(collection(db, "history"), { uid: user.uid, type: "공격", msg: `📉 [${target.name}]님을 랜덤 강등시켰습니다!`, amount: -cost, createdAt: serverTimestamp() });
        await addDoc(collection(db, "history"), { uid: target.id, type: "피격", msg: `📉 누군가의 [랜덤 강등권]에 의해 ${newTierName}(으)로 강등당했습니다.`, amount: 0, createdAt: serverTimestamp() });

        alert(`📉 성공! [${target.name}]님이 ${newTierName}(으)로 강등되었습니다.`);
    } catch (e) { alert("오류 발생"); }
  };

  // 4. 지명 강등 (검색된 유저 대상)
  const targetDemote = async () => {
    const cost = 10000000000; // 100억
    if (point < cost) return alert("돈이 부족합니다!");
    
    // 타겟 선택 여부 확인
    if (!selectedTarget) return alert("먼저 유저를 검색해서 선택해주세요!");

    if (!window.confirm(`[${selectedTarget.name}]님을 2단계 강등시키겠습니까?\n(비용: ${cost.toLocaleString()}원)`)) return;

    try {
        // 최신 상태 확인 (검색 시점과 다를 수 있으므로 다시 가져옴)
        const targetRef = doc(db, "users", selectedTarget.id);
        const targetSnap = await getDoc(targetRef);
        
        if (!targetSnap.exists()) return alert("유저가 존재하지 않습니다.");
        const targetData = targetSnap.data();

        if ((targetData.tierLevel || 0) === 0) return alert("이미 언랭크라 강등시킬 수 없습니다.");

        let newLevel = Math.max(0, (targetData.tierLevel || 0) - 2);
        const newTierName = TIER_SYSTEM[newLevel].name;

        await updateDoc(doc(db, "users", user.uid), { point: increment(-cost) });
        await updateDoc(targetRef, { tierLevel: newLevel, tierName: newTierName });
        setPoint(prev => prev - cost);

        await addDoc(collection(db, "history"), { uid: user.uid, type: "저격", msg: `🎯 [${targetData.name}]님을 저격하여 2단계 강등시켰습니다!`, amount: -cost, createdAt: serverTimestamp() });
        await addDoc(collection(db, "history"), { uid: selectedTarget.id, type: "피격", msg: `🎯 누군가의 [저격 강등권]에 의해 ${newTierName}(으)로 강등당했습니다.`, amount: 0, createdAt: serverTimestamp() });

        alert(`🎯 저격 성공! [${targetData.name}]님이 ${newTierName}(으)로 강등되었습니다.`);
        
        // 초기화
        setTargetName("");
        setSelectedTarget(null);

    } catch (e) { alert("오류 발생: " + e.message); }
  };

  return (
    <div className="container" style={{ background: '#1e272e', minHeight: '100vh', padding: '20px', color: 'white' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#00d2d3' }}>🏆 랭크 승급 & 암시장</h1>
        <div className="card" style={{ display:'inline-block', background:'#2f3640', padding:'10px 25px', marginTop:'15px', borderRadius:'50px', border:'1px solid #00d2d3' }}>
           💰 보유 자산: <span style={{ color:'#f1c40f', fontWeight:'bold', fontSize:'18px' }}>{point.toLocaleString()}원</span>
        </div>
      </div>

      {/* 🏬 암시장 (검색 기능 추가됨) */}
      <div className="card" style={{ background: '#34495e', padding: '20px', marginBottom: '30px', border: '2px solid #e74c3c' }}>
        <h2 style={{ marginTop: 0, color: '#e74c3c', textAlign: 'center' }}>😈 암시장 </h2>
        
        {/* 🔍 유저 검색창 */}
        <div style={{ marginBottom: '15px', position:'relative' }}>
            <div style={{ display: 'flex', gap: '5px' }}>
                <input 
                    className="input" 
                    style={{ flex: 1, textAlign: 'left', margin:0 }} 
                    placeholder="저격할 닉네임 검색..."
                    value={targetName}
                    onChange={(e) => setTargetName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                />
                <button className="btn" style={{ background: '#3498db', width:'60px', padding:0 }} onClick={handleSearchUser}>🔍</button>
            </div>

            {/* 검색 결과 리스트 */}
            {searchResults.length > 0 && (
                <div style={{ marginTop: '5px', background: '#2c3e50', borderRadius: '5px', border: '1px solid #7f8c8d', position: 'absolute', width: '100%', zIndex: 10 }}>
                    {searchResults.map((u) => (
                        <div key={u.id} onClick={() => selectUser(u)} style={{ padding: '10px', borderBottom: '1px solid #444', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{fontWeight:'bold'}}>{u.name}</span>
                            <span style={{fontSize:'12px', color:'#aaa'}}>{u.tierName}</span>
                        </div>
                    ))}
                </div>
            )}
            
            {/* 선택된 타겟 표시 */}
            {selectedTarget && (
                <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(231, 76, 60, 0.2)', borderRadius: '5px', border: '1px solid #e74c3c', textAlign: 'center' }}>
                    🎯 타겟 확인: <span style={{ fontWeight: 'bold', color: '#f1c40f' }}>{selectedTarget.name}</span> ({selectedTarget.tierName})
                </div>
            )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
            <button className="btn" style={{ background: '#95a5a6' }} onClick={changeNickname}>🏷️ 닉변 (10억)</button>
            <button className="btn" style={{ background: '#e67e22' }} onClick={() => randomDemote(100000000, 1, true)}>📉 랜덤유저 1단계 강등 (1억)</button>
            <button className="btn" style={{ background: '#d35400' }} onClick={() => randomDemote(1000000000, 2, true)}>📉 랜덤유저 2단계 강등 (10억)</button>
            <button className="btn" style={{ background: '#c0392b' }} onClick={() => randomDemote(5000000000, 2, false)}>💣 랜덤유저 2단계 강등 (50억)<br/><span style={{fontSize:'10px'}}>(나 제외)</span></button>
            
            {/* 저격 버튼 (타겟 선택되어야 활성화) */}
            <button 
                className="btn" 
                style={{ background: selectedTarget ? '#8e44ad' : '#555', border: selectedTarget ? '2px solid #f1c40f' : 'none', cursor: selectedTarget ? 'pointer' : 'not-allowed' }} 
                onClick={targetDemote}
                disabled={!selectedTarget}
            >
                🎯 저격 (100억)<br/><span style={{fontSize:'10px'}}>(타겟팅 2단계강등)</span>
            </button>
        </div>
      </div>

      {/* 🏆 티어 리스트 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', paddingBottom: '50px' }}>
        {TIER_SYSTEM.map((tier) => {
            const isMyTier = myTierLevel === tier.level;
            const isNext = myTierLevel + 1 === tier.level;
            const isLocked = myTierLevel + 1 < tier.level;

            return (
                <div key={tier.level} className="card" style={{ background: isMyTier ? 'rgba(46, 204, 113, 0.1)' : '#2f3640', border: isMyTier ? `2px solid ${tier.color}` : (isNext ? '2px solid #f1c40f' : '1px solid #444'), padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: isLocked ? 0.5 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ width: '60px', height: '60px', display:'flex', justifyContent:'center', alignItems:'center' }}>
                            <img src={`/tiers/${tier.level}.png`} alt={tier.name} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.2))' }} onError={(e) => {e.target.style.display='none'}} />
                        </div>
                        <div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: tier.color }}>{tier.name}</div>
                            <div style={{ fontSize: '12px', color: '#aaa' }}>{tier.cost === 0 ? '기본' : `${tier.cost.toLocaleString()}원`}</div>
                        </div>
                    </div>
                    <div>
                        {isMyTier ? <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>현재 티어</span> : isNext ? <button className="btn" onClick={() => promoteTier(tier)} style={{ background: tier.color, color: 'white', fontWeight:'bold' }}>승급 ▲</button> : <span style={{ color: '#555' }}>🔒</span>}
                    </div>
                </div>
            );
        })}
      </div>
      <button className="btn" style={{ position:'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth:'400px', background: '#333' }} onClick={() => navigate('/home')}>홈으로</button>
    </div>
  );
}