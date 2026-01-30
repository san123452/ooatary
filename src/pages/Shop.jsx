 
import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp, query, where, getDocs, limit, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

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
  const [isShopOpen, setIsShopOpen] = useState(true);
  const [features, setFeatures] = useState({ attack: true }); // 핵공격 기능 상태

  const [showSniperModal, setShowSniperModal] = useState(false);
  const [targetName, setTargetName] = useState(""); 
  const [searchResults, setSearchResults] = useState([]); 
  const [isProcessing, setIsProcessing] = useState(false);

  const navigate = useNavigate();
  const user = auth.currentUser;
  const { t } = useLanguage();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchUserData();

    const unsub = onSnapshot(doc(db, "system", "features"), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setIsShopOpen(data.shop);
            setFeatures(data); // 기능 전체 상태 저장
        }
    });
    return () => unsub();
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

  // 🚀 [이식됨] 핵공격 로직 (Header.jsx에서 가져옴)
  const handleAttack = async () => {
    if (!features.attack) return alert(t.h_locked);
    if (!user) return;
    const currentPoint = point || 0;
    if (currentPoint < 100) return alert(t.h_nuke_min);
    const cost = Math.floor(currentPoint / 2); 
    if (!window.confirm(`${t.h_nuke_ask}\n\n${t.h_nuke_desc} (${cost.toLocaleString()})`)) return;

    setIsProcessing(true);
    try {
        const myDoc = await getDoc(doc(db, "users", user.uid));
        const myName = myDoc.exists() ? myDoc.data().name : "익명";
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("point", ">", 1000000)); 
        const querySnapshot = await getDocs(q);
        const targets = [];
        querySnapshot.forEach((doc) => { if (doc.id !== user.uid) targets.push({ id: doc.id, ...doc.data() }); });

        if (targets.length === 0) { setIsProcessing(false); return alert(t.h_nuke_no_target); }
        const randomIndex = Math.floor(Math.random() * targets.length);
        const target = targets[randomIndex];
        const targetName = target.name || "익명";
        const targetCurrentPoint = target.point || 0;
        let damage = cost;
        if (targetCurrentPoint < damage) damage = targetCurrentPoint; 

        await updateDoc(doc(db, "users", user.uid), { point: increment(-cost) });
        if (damage > 0) await updateDoc(doc(db, "users", target.id), { point: increment(-damage) });

        await addDoc(collection(db, "history"), { uid: user.uid, type: "공격", msg: `🚀 [${targetName}] Attack!`, amount: -cost, createdAt: serverTimestamp() });
        await addDoc(collection(db, "history"), { uid: target.id, type: "피격", msg: `💣 Hit by [${myName}]`, amount: -damage, createdAt: serverTimestamp() });

        setPoint(prev => prev - cost); // 화면 즉시 반영
        alert(`${t.h_nuke_hit}\n${targetName} ${t.h_nuke_hit_msg}\n${t.h_nuke_damage}: ${damage.toLocaleString()}`);
    } catch (e) { console.error(e); alert(t.alertError); }
    finally { setIsProcessing(false); }
  };

  const promoteTier = async (targetTier) => {
    if (isProcessing) return;
    if (myTierLevel >= targetTier.level) return;
    if (myTierLevel + 1 !== targetTier.level) return alert("이전 티어부터 승급하세요!");
    if (point < targetTier.cost) return alert(t.noMoney);
    if (!window.confirm(`[${targetTier.name}] 티어로 승급하시겠습니까?\n${t.alertCost}: ${targetTier.cost.toLocaleString()}원`)) return;
    setIsProcessing(true);
    try {
      const myDocSnap = await getDoc(doc(db, "users", user.uid));
      const currentPoint = myDocSnap.data().point || 0;
      if (currentPoint < targetTier.cost) { alert(t.noMoney); setPoint(currentPoint); return; }
      await updateDoc(doc(db, "users", user.uid), { point: increment(-targetTier.cost), tierLevel: targetTier.level, tierName: targetTier.name });
      setPoint(prev => prev - targetTier.cost);
      setMyTierLevel(targetTier.level);
      alert(`🎉 승급 완료! [${targetTier.name}] 달성!`);
    } catch (e) { alert(t.alertError); }
    finally { setIsProcessing(false); }
  };

  const changeNickname = async () => {
    if (isProcessing) return;
    const cost = 1000000000;
    if (point < cost) return alert(t.noMoney);
    const newName = prompt(t.alertNick);
    if (!newName || !newName.trim()) return;
    if (!window.confirm(`[${newName}]? (${t.alertCost}: ${cost.toLocaleString()})`)) return;
    setIsProcessing(true);
    try {
        const myDocSnap = await getDoc(doc(db, "users", user.uid));
        if ((myDocSnap.data().point || 0) < cost) throw new Error("잔액 부족");
        await updateDoc(doc(db, "users", user.uid), { point: increment(-cost), name: newName });
        setPoint(prev => prev - cost);
        await addDoc(collection(db, "history"), { uid: user.uid, type: "상점", msg: `닉네임 변경 (${newName})`, amount: -cost, createdAt: serverTimestamp() });
        alert(t.alertComplete);
    } catch (e) { alert("오류: " + e.message); }
    finally { setIsProcessing(false); }
  };

  const randomDemote = async (cost, levelDown, includeSelf) => {
    if (!isShopOpen) return alert(t.shopClosed);
    if (isProcessing) return;
    if (point < cost) return alert(t.noMoney);
    const msg = includeSelf ? t.demoteSelf : t.demoteNoSelf;
    if (!window.confirm(`${msg}?\n(${t.alertCost}: ${cost.toLocaleString()})`)) return;
    setIsProcessing(true);
    try {
        const myDoc = await getDoc(doc(db, "users", user.uid));
        if ((myDoc.data().point || 0) < cost) throw new Error("잔액 부족");
        const myName = myDoc.data().name || "익명";
        const q = query(collection(db, "users"), where("tierLevel", ">", 0));
        const querySnapshot = await getDocs(q);
        let targets = [];
        querySnapshot.forEach((doc) => { if (includeSelf || doc.id !== user.uid) targets.push({ id: doc.id, ...doc.data() }); });
        if (targets.length === 0) return alert(t.alertTargetNone);
        const target = targets[Math.floor(Math.random() * targets.length)];
        let newLevel = Math.max(0, target.tierLevel - levelDown);
        const newTierName = TIER_SYSTEM[newLevel].name;
        await updateDoc(doc(db, "users", user.uid), { point: increment(-cost) });
        await updateDoc(doc(db, "users", target.id), { tierLevel: newLevel, tierName: newTierName });
        setPoint(prev => prev - cost);
        await addDoc(collection(db, "history"), { uid: user.uid, type: "공격", msg: `📉 [${target.name}]님을 랜덤 강등시켰습니다!`, amount: -cost, createdAt: serverTimestamp() });
        await addDoc(collection(db, "history"), { uid: target.id, type: "피격", msg: `📉 [${myName}]님의 [랜덤 강등권]에 의해 ${newTierName}(으)로 강등당했습니다.`, amount: 0, createdAt: serverTimestamp() });
        alert(`📉 성공! [${target.name}] -> ${newTierName}`);
    } catch (e) { alert("오류: " + e.message); }
    finally { setIsProcessing(false); }
  };

  const handleSearchUser = async () => {
    if (!targetName.trim()) return;
    try {
        const q = query(collection(db, "users"), where("name", ">=", targetName), where("name", "<=", targetName + "\uf8ff"), limit(5));
        const querySnapshot = await getDocs(q);
        const users = [];
        querySnapshot.forEach((doc) => { if (doc.id !== user.uid) users.push({ id: doc.id, ...doc.data() }); });
        setSearchResults(users);
    } catch (e) { console.error(e); }
  };

  const executeSniper = async (target) => {
    const cost = 50000000000;
    if (point < cost) return alert(t.noMoney);
    if (!window.confirm(`[${target.name}]${t.alertSniperConfirm}\n(${t.alertCost}: ${cost.toLocaleString()})`)) return;
    setIsProcessing(true);
    try {
        const myDoc = await getDoc(doc(db, "users", user.uid));
        if ((myDoc.data().point || 0) < cost) throw new Error("잔액 부족");
        const myName = myDoc.data().name || "익명";
        const targetRef = doc(db, "users", target.id);
        const targetSnap = await getDoc(targetRef);
        const targetData = targetSnap.data();
        if ((targetData.tierLevel || 0) === 0) return alert("이미 언랭크라 강등시킬 수 없습니다.");
        let newLevel = Math.max(0, (targetData.tierLevel || 0) - 2);
        const newTierName = TIER_SYSTEM[newLevel].name;
        await updateDoc(doc(db, "users", user.uid), { point: increment(-cost) });
        await updateDoc(targetRef, { tierLevel: newLevel, tierName: newTierName });
        setPoint(prev => prev - cost);
        await addDoc(collection(db, "history"), { uid: user.uid, type: "저격", msg: `🎯 [${targetData.name}]님을 저격하여 2단계 강등시켰습니다!`, amount: -cost, createdAt: serverTimestamp() });
        await addDoc(collection(db, "history"), { uid: target.id, type: "피격", msg: `🎯 [${myName}]님의 [저격 강등권]에 의해 ${newTierName}(으)로 강등당했습니다.`, amount: 0, createdAt: serverTimestamp() });
        alert(`🎯 저격 성공! [${targetData.name}] -> ${newTierName}`);
        setShowSniperModal(false);
    } catch (e) { alert("오류: " + e.message); }
    finally { setIsProcessing(false); }
  };

  return (
    <div className="container" style={{ background: '#1e272e', minHeight: '100vh', padding: '20px', color: 'white' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#00d2d3' }}>{t.shopTitle}</h1>
        <div className="card" style={{ display:'inline-block', background:'#2f3640', padding:'10px 25px', marginTop:'15px', borderRadius:'50px', border:'1px solid #00d2d3' }}>
           {t.shopBalance}: <span style={{ color:'#f1c40f', fontWeight:'bold', fontSize:'18px' }}>{Math.max(0, point).toLocaleString()}</span>
        </div>
      </div>

      <div className="card" style={{ background: '#34495e', padding: '15px', marginBottom: '20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
              <h3 style={{ margin:0 }}>{t.nickChange}</h3>
              <span style={{ fontSize:'12px', color:'#ccc' }}>{t.nickDesc}</span>
          </div>
          <button className="btn" disabled={isProcessing} style={{ background: '#95a5a6' }} onClick={changeNickname}>{t.buy} (10억)</button>
      </div>

      {/* 🏬 암시장 */}
      <div className="card" style={{ 
          background: isShopOpen ? '#34495e' : '#2c3e50', 
          padding: '20px', marginBottom: '30px', 
          border: isShopOpen ? '2px solid #e74c3c' : '2px solid #555',
          opacity: isShopOpen ? 1 : 0.6,
          pointerEvents: isShopOpen ? 'auto' : 'none' 
      }}>
        <h2 style={{ marginTop: 0, color: isShopOpen ? '#e74c3c' : '#7f8c8d', textAlign: 'center' }}>
            {isShopOpen ? t.blackMarket : t.shopClosed}
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
            {/* ⭐ 핵공격 버튼 추가됨 */}
            <button className="btn" disabled={!features.attack || isProcessing} onClick={handleAttack} style={{ background: features.attack ? '#8e44ad' : '#3d3d3d', color: features.attack ? 'white' : '#777', gridColumn: '1 / -1', marginBottom: 10 }}>
                🚀 {t.h_attack} (전재산 50%)<br/><span style={{fontSize:'10px'}}>랜덤 유저 1명 타격</span>
            </button>

            <button className="btn" disabled={isProcessing} style={{ background: '#e67e22' }} onClick={() => randomDemote(1000000000, 1, true)}>{t.demoteR1} (10억)<br/><span style={{fontSize:'10px'}}>{t.demoteSelf}</span></button>
            <button className="btn" disabled={isProcessing} style={{ background: '#d35400' }} onClick={() => randomDemote(5000000000, 2, true)}>{t.demoteR2} (50억)<br/><span style={{fontSize:'10px'}}>{t.demoteSelf}</span></button>
            
            <button className="btn" disabled={isProcessing} style={{ background: '#c0392b' }} onClick={() => randomDemote(10000000000, 1, false)}>{t.demoteBomb1} (100억)<br/><span style={{fontSize:'10px'}}>{t.demoteNoSelf}</span></button>
            <button className="btn" disabled={isProcessing} style={{ background: '#8e44ad' }} onClick={() => randomDemote(3000000000, 2, false)}>{t.demoteBomb2} (300억)<br/><span style={{fontSize:'12px'}}>{t.demoteNoSelf}</span></button>
            
            <button className="btn" disabled={isProcessing} style={{ background: '#2c3e50', border:'2px solid #f1c40f', gridColumn: '1 / -1' }} onClick={() => { setSearchResults([]); setTargetName(""); setShowSniperModal(true); }}>
                {t.sniper} (500억)<br/><span style={{fontSize:'10px'}}>{t.sniperDesc}</span>
            </button>
        </div>
      </div>

      {showSniperModal && (
          <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.8)', zIndex:999, display:'flex', justifyContent:'center', alignItems:'center' }}>
              <div style={{ background:'#2c3e50', padding:'20px', borderRadius:'10px', width:'90%', maxWidth:'400px' }}>
                  <h3 style={{ color:'#f1c40f', marginTop:0 }}>{t.sniperTitle}</h3>
                  <div style={{ display:'flex', gap:'5px', marginBottom:'15px' }}>
                      <input className="input" style={{ flex:1, margin:0 }} placeholder={t.searchNick} value={targetName} onChange={(e)=>setTargetName(e.target.value)} />
                      <button className="btn" style={{ background:'#3498db', width:'60px' }} onClick={handleSearchUser}>{t.search}</button>
                  </div>
                  <div style={{ maxHeight:'200px', overflowY:'auto', marginBottom:'15px' }}>
                      {searchResults.map(u => (
                          <div key={u.id} style={{ padding:'10px', borderBottom:'1px solid #444', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                              <span>{u.name} <span style={{fontSize:'12px', color:'#aaa'}}>({u.tierName})</span></span>
                              <button className="btn" style={{ padding:'5px 10px', fontSize:'12px', background:'#e74c3c' }} onClick={() => executeSniper(u)}>{t.doDemote}</button>
                          </div>
                      ))}
                      {searchResults.length === 0 && targetName && <p style={{textAlign:'center', color:'#777'}}>{t.noResult}</p>}
                  </div>
                  <button className="btn" style={{ width:'100%', background:'#7f8c8d' }} onClick={() => setShowSniperModal(false)}>{t.close}</button>
              </div>
          </div>
      )}

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
                            <div style={{ fontSize: '12px', color: '#aaa' }}>{tier.cost === 0 ? '기본' : `${tier.cost.toLocaleString()}`}</div>
                        </div>
                    </div>
                    <div>
                        {isMyTier ? <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>{t.currentTier}</span> : 
                         isNext ? <button className="btn" disabled={isProcessing} onClick={() => promoteTier(tier)} style={{ background: isProcessing ? '#7f8c8d' : tier.color, color: 'white', fontWeight:'bold', cursor: isProcessing ? 'not-allowed' : 'pointer' }}>{t.upgrade}</button> 
                                : <span style={{ color: '#555' }}>🔒</span>}
                    </div>
                </div>
            );
        })}
      </div>
      <button className="btn" style={{ position:'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth:'400px', background: '#333' }} onClick={() => navigate('/home')}>{t.home}</button>
    </div>
  );
}