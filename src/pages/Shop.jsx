
//  import React, { useState, useEffect } from 'react';
// import { db, auth } from '../firebase';
// import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp, query, where, getDocs, limit, onSnapshot } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';
// import { useLanguage } from '../LanguageContext';

// const TIER_SYSTEM = [
//   { level: 0, name: '언랭크', cost: 0, color: '#7f8c8d' },
//   { level: 1, name: '아이언', cost: 500000, color: '#454545' },
//   { level: 2, name: '브론즈', cost: 1000000, color: '#cd7f32' },
//   { level: 3, name: '실버', cost: 3000000, color: '#c0c0c0' },
//   { level: 4, name: '골드', cost: 10000000, color: '#f1c40f' },
//   { level: 5, name: '플래티넘', cost: 30000000, color: '#2ecc71' },
//   { level: 6, name: '에메랄드', cost: 50000000, color: '#16a085' },
//   { level: 7, name: '다이아', cost: 100000000, color: '#3498db' },
//   { level: 8, name: '마스터', cost: 500000000, color: '#9b59b6' },
//   { level: 9, name: '그랜드마스터', cost: 1000000000, color: '#e74c3c' },
//   { level: 10, name: '챌린저', cost: 5000000000, color: '#f39c12' }
// ];

// const ADMIN_EMAIL = "kks3172@naver.com"; 

// export default function Shop() {
//   const [point, setPoint] = useState(0);
//   const [myTierLevel, setMyTierLevel] = useState(0); 
//   const [isShopOpen, setIsShopOpen] = useState(true);
//   const [features, setFeatures] = useState({ attack: true }); 

//   const [showSniperModal, setShowSniperModal] = useState(false);
//   const [showWishModal, setShowWishModal] = useState(false); 
  
//   const [targetName, setTargetName] = useState(""); 
//   const [wishContent, setWishContent] = useState(""); 
//   const [searchResults, setSearchResults] = useState([]); 
//   const [isProcessing, setIsProcessing] = useState(false);

//   const navigate = useNavigate();
//   const user = auth.currentUser;
//   const { t } = useLanguage();

//   useEffect(() => {
//     if (!user) { navigate('/login'); return; }
//     fetchUserData();

//     const unsub = onSnapshot(doc(db, "system", "features"), (docSnap) => {
//         if (docSnap.exists()) {
//             const data = docSnap.data();
//             setIsShopOpen(data.shop);
//             setFeatures(data); 
//         }
//     });
//     return () => unsub();
//   }, [user, navigate]);

//   const fetchUserData = async () => {
//     try {
//       const d = await getDoc(doc(db, "users", user.uid));
//       if (d.exists()) {
//         const data = d.data();
//         setPoint(data.point || 0);
//         setMyTierLevel(data.tierLevel || 0);
//       }
//     } catch (e) { console.error(e); }
//   };

//   const handleAttack = async () => {
//     if (!features.attack) return alert(t.h_locked);
//     if (!user) return;
//     const currentPoint = point || 0;
//     if (currentPoint < 100) return alert(t.h_nuke_min);
//     const cost = Math.floor(currentPoint / 2); 
//     if (!window.confirm(`${t.h_nuke_ask}\n\n${t.h_nuke_desc} (${cost.toLocaleString()})`)) return;

//     setIsProcessing(true);
//     try {
//         const myDoc = await getDoc(doc(db, "users", user.uid));
//         const myName = myDoc.exists() ? myDoc.data().name : "익명";
//         const usersRef = collection(db, "users");
//         const q = query(usersRef, where("point", ">", 1000000)); 
//         const querySnapshot = await getDocs(q);
//         const targets = [];
//         querySnapshot.forEach((doc) => { if (doc.id !== user.uid) targets.push({ id: doc.id, ...doc.data() }); });

//         if (targets.length === 0) { setIsProcessing(false); return alert(t.h_nuke_no_target); }
//         const randomIndex = Math.floor(Math.random() * targets.length);
//         const target = targets[randomIndex];
//         const targetName = target.name || "익명";
//         const targetCurrentPoint = target.point || 0;
//         let damage = cost;
//         if (targetCurrentPoint < damage) damage = targetCurrentPoint; 

//         await updateDoc(doc(db, "users", user.uid), { point: increment(-cost) });
//         if (damage > 0) await updateDoc(doc(db, "users", target.id), { point: increment(-damage) });

//         await addDoc(collection(db, "history"), { uid: user.uid, type: "공격", msg: `🚀 [${targetName}] Attack!`, amount: -cost, createdAt: serverTimestamp() });
//         await addDoc(collection(db, "history"), { uid: target.id, type: "피격", msg: `💣 Hit by [${myName}]`, amount: -damage, createdAt: serverTimestamp() });

//         setPoint(prev => prev - cost); 
//         alert(`${t.h_nuke_hit}\n${targetName} ${t.h_nuke_hit_msg}\n${t.h_nuke_damage}: ${damage.toLocaleString()}`);
//     } catch (e) { console.error(e); alert(t.alertError); }
//     finally { setIsProcessing(false); }
//   };

//   const promoteTier = async (targetTier) => {
//     if (isProcessing) return;
//     if (myTierLevel >= targetTier.level) return;
//     if (myTierLevel + 1 !== targetTier.level) return alert("이전 티어부터 승급하세요!");
    
//     if (point < targetTier.cost) return alert(t.alertNoMoney);
    
//     if (!window.confirm(`[${targetTier.name}] 티어로 승급하시겠습니까?\n${t.alertCost}: ${targetTier.cost.toLocaleString()}원`)) return;
//     setIsProcessing(true);
//     try {
//       const myDocSnap = await getDoc(doc(db, "users", user.uid));
//       const currentPoint = myDocSnap.data().point || 0;
      
//       if (currentPoint < targetTier.cost) { alert(t.alertNoMoney); setPoint(currentPoint); return; }
      
//       await updateDoc(doc(db, "users", user.uid), { point: increment(-targetTier.cost), tierLevel: targetTier.level, tierName: targetTier.name });
//       setPoint(prev => prev - targetTier.cost);
//       setMyTierLevel(targetTier.level);
//       alert(`🎉 승급 완료! [${targetTier.name}] 달성!`);
//     } catch (e) { alert(t.alertError); }
//     finally { setIsProcessing(false); }
//   };

//   const openWishModal = () => {
//     if (point < 1000000000) {
//         return alert(t.wish_min_asset || "최소 10억 이상의 자산이 있어야 구매할 수 있습니다.");
//     }
//     setWishContent("");
//     setShowWishModal(true);
//   };

//   const confirmWishPurchase = async () => {
//     if (!wishContent.trim()) return alert("소원 내용을 입력해주세요.");
//     if (isProcessing) return;

//     const currentPoint = point || 0;
//     const cost = Math.floor(currentPoint / 2);

//     if (!window.confirm(`${t.wish_confirm || "정말 소원을 비시겠습니까?"}\n(${t.alertCost}: -${cost.toLocaleString()}원)`)) return;

//     setIsProcessing(true);
//     try {
//         const q = query(collection(db, "users"), where("email", "==", ADMIN_EMAIL));
//         const adminSnap = await getDocs(q);
        
//         if (adminSnap.empty) {
//             setIsProcessing(false);
//             return alert("관리자 정보를 찾을 수 없어 소원을 보낼 수 없습니다.");
//         }
        
//         const adminUid = adminSnap.docs[0].id;
//         const myDocSnap = await getDoc(doc(db, "users", user.uid));
//         const myName = myDocSnap.data().name || "익명";
        
//         // 1. 비용 차감
//         await updateDoc(doc(db, "users", user.uid), { point: increment(-cost) });
//         setPoint(prev => prev - cost);

//         // 2. 관리자에게 쪽지 전송
//         await addDoc(collection(db, "messages"), {
//             senderUid: user.uid,
//             senderName: myName,
//             receiverUid: adminUid, 
//             receiverName: "관리자",
//             content: `🧞‍♂️ [소원권 사용]\n\n${wishContent}\n\n(지불 금액: ${cost.toLocaleString()}원)`,
//             isRead: false,
//             createdAt: serverTimestamp()
//         });

//         // 🔥 [추가] 3. 관리자에게 알림 전송 (이게 있어야 헤더 종이 울림!)
//         await addDoc(collection(db, "notifications"), {
//             receiverUid: adminUid,
//             senderUid: user.uid,
//             senderName: myName,
//             type: "wish", // 알림 타입
//             msg: `🧞‍♂️ ${myName}님이 소원권을 사용했습니다!`,
//             isRead: false,
//             createdAt: serverTimestamp()
//         });

//         // 4. 히스토리 저장
//         await addDoc(collection(db, "history"), { 
//             uid: user.uid, 
//             type: "상점", 
//             msg: `🧞‍♂️ 소원권 사용`, 
//             amount: -cost, 
//             createdAt: serverTimestamp() 
//         });

//         alert(t.wish_success || "소원이 관리자에게 전달되었습니다!");
//         setShowWishModal(false);

//     } catch (e) {
//         alert("오류: " + e.message);
//     } finally {
//         setIsProcessing(false);
//     }
//   };

//   const changeNickname = async () => {
//     if (isProcessing) return;
//     const cost = 1000000000;
    
//     if (point < cost) return alert(t.alertNoMoney);
    
//     const newName = prompt(t.alertNick);
//     if (!newName || !newName.trim()) return;
//     if (!window.confirm(`[${newName}]? (${t.alertCost}: ${cost.toLocaleString()})`)) return;
//     setIsProcessing(true);
//     try {
//         const myDocSnap = await getDoc(doc(db, "users", user.uid));
//         if ((myDocSnap.data().point || 0) < cost) throw new Error("잔액 부족");
//         await updateDoc(doc(db, "users", user.uid), { point: increment(-cost), name: newName });
//         setPoint(prev => prev - cost);
//         await addDoc(collection(db, "history"), { uid: user.uid, type: "상점", msg: `닉네임 변경 (${newName})`, amount: -cost, createdAt: serverTimestamp() });
//         alert(t.alertComplete);
//     } catch (e) { alert("오류: " + e.message); }
//     finally { setIsProcessing(false); }
//   };

//   const randomDemote = async (cost, levelDown, includeSelf) => {
//     if (!isShopOpen) return alert(t.shopClosed);
//     if (isProcessing) return;
    
//     if (point < cost) return alert(t.alertNoMoney);
    
//     const msg = includeSelf ? t.demoteSelf : t.demoteNoSelf;
//     if (!window.confirm(`${msg}?\n(${t.alertCost}: ${cost.toLocaleString()})`)) return;
//     setIsProcessing(true);
//     try {
//         const myDoc = await getDoc(doc(db, "users", user.uid));
//         if ((myDoc.data().point || 0) < cost) throw new Error("잔액 부족");
//         const myName = myDoc.data().name || "익명";
//         const q = query(collection(db, "users"), where("tierLevel", ">", 0));
//         const querySnapshot = await getDocs(q);
//         let targets = [];
//         querySnapshot.forEach((doc) => { if (includeSelf || doc.id !== user.uid) targets.push({ id: doc.id, ...doc.data() }); });
//         if (targets.length === 0) return alert(t.alertTargetNone);
//         const target = targets[Math.floor(Math.random() * targets.length)];
//         let newLevel = Math.max(0, target.tierLevel - levelDown);
//         const newTierName = TIER_SYSTEM[newLevel].name;
//         await updateDoc(doc(db, "users", user.uid), { point: increment(-cost) });
//         await updateDoc(doc(db, "users", target.id), { tierLevel: newLevel, tierName: newTierName });
//         setPoint(prev => prev - cost);
//         await addDoc(collection(db, "history"), { uid: user.uid, type: "공격", msg: `📉 [${target.name}]님을 랜덤 강등시켰습니다!`, amount: -cost, createdAt: serverTimestamp() });
//         await addDoc(collection(db, "history"), { uid: target.id, type: "피격", msg: `📉 [${myName}]님의 [랜덤 강등권]에 의해 ${newTierName}(으)로 강등당했습니다.`, amount: 0, createdAt: serverTimestamp() });
//         alert(`📉 성공! [${target.name}] -> ${newTierName}`);
//     } catch (e) { alert("오류: " + e.message); }
//     finally { setIsProcessing(false); }
//   };

//   const handleSearchUser = async () => {
//     if (!targetName.trim()) return;
//     try {
//         const q = query(collection(db, "users"), where("name", ">=", targetName), where("name", "<=", targetName + "\uf8ff"), limit(5));
//         const querySnapshot = await getDocs(q);
//         const users = [];
//         querySnapshot.forEach((doc) => { if (doc.id !== user.uid) users.push({ id: doc.id, ...doc.data() }); });
//         setSearchResults(users);
//     } catch (e) { console.error(e); }
//   };

//   const executeSniper = async (target) => {
//     const cost = 50000000000;
    
//     if (point < cost) return alert(t.alertNoMoney);
    
//     if (!window.confirm(`[${target.name}]${t.alertSniperConfirm}\n(${t.alertCost}: ${cost.toLocaleString()})`)) return;
//     setIsProcessing(true);
//     try {
//         const myDoc = await getDoc(doc(db, "users", user.uid));
//         if ((myDoc.data().point || 0) < cost) throw new Error("잔액 부족");
//         const myName = myDoc.data().name || "익명";
//         const targetRef = doc(db, "users", target.id);
//         const targetSnap = await getDoc(targetRef);
//         const targetData = targetSnap.data();
//         if ((targetData.tierLevel || 0) === 0) return alert("이미 언랭크라 강등시킬 수 없습니다.");
//         let newLevel = Math.max(0, (targetData.tierLevel || 0) - 2);
//         const newTierName = TIER_SYSTEM[newLevel].name;
//         await updateDoc(doc(db, "users", user.uid), { point: increment(-cost) });
//         await updateDoc(targetRef, { tierLevel: newLevel, tierName: newTierName });
//         setPoint(prev => prev - cost);
//         await addDoc(collection(db, "history"), { uid: user.uid, type: "저격", msg: `🎯 [${targetData.name}]님을 저격하여 2단계 강등시켰습니다!`, amount: -cost, createdAt: serverTimestamp() });
//         await addDoc(collection(db, "history"), { uid: target.id, type: "피격", msg: `🎯 [${myName}]님의 [저격 강등권]에 의해 ${newTierName}(으)로 강등당했습니다.`, amount: 0, createdAt: serverTimestamp() });
//         alert(`🎯 저격 성공! [${targetData.name}] -> ${newTierName}`);
//         setShowSniperModal(false);
//     } catch (e) { alert("오류: " + e.message); }
//     finally { setIsProcessing(false); }
//   };

//   return (
//     <div className="container" style={{ background: '#1e272e', minHeight: '100vh', padding: '20px', color: 'white' }}>
      
//       {/* 🏷️ 상점 타이틀 */}
//       <div style={{ textAlign: 'center', marginBottom: '30px' }}>
//         <h1 style={{ color: '#00d2d3', margin: 0, textShadow: '0 0 10px rgba(0, 210, 211, 0.5)' }}>{t.shopTitle}</h1>
//         <div style={{ display:'inline-block', background:'#2f3640', padding:'10px 25px', marginTop:'15px', borderRadius:'50px', border:'1px solid #00d2d3', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
//            {t.shopBalance}: <span style={{ color:'#f1c40f', fontWeight:'bold', fontSize:'18px' }}>{Math.max(0, point).toLocaleString()}</span>
//         </div>
//       </div>

//       {/* 🧞‍♂️ [수정] 소원권 (모달 열기 버튼) */}
//       <div className="card" style={{ 
//           background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)', 
//           padding: '20px', marginBottom: '20px', 
//           borderRadius: '15px',
//           display:'flex', justifyContent:'space-between', alignItems:'center', 
//           border:'2px solid rgba(255,255,255,0.2)', 
//           boxShadow:'0 0 20px rgba(37, 117, 252, 0.4)' 
//       }}>
//           <div>
//               <h3 style={{ margin:0, color:'white', fontSize: '20px', display:'flex', alignItems:'center', gap:'8px' }}>
//                   <span style={{fontSize:'24px'}}></span> {t.wishTicket || "소원권"}
//               </h3>
//               <div style={{ fontSize:'13px', color:'#eee', marginTop:'5px', opacity: 0.9 }}>{t.wishDesc || "관리자에게 소원을 빕니다. (전재산 50%)"}</div>
//           </div>
//           <button className="btn" disabled={isProcessing} onClick={openWishModal} style={{ 
//               background: '#fff', color: '#2575fc', fontWeight: 'bold', 
//               padding: '12px 20px', borderRadius: '10px', border: 'none', 
//               boxShadow: '0 4px 10px rgba(0,0,0,0.2)', cursor: 'pointer',
//               transition: 'transform 0.1s'
//           }}>
//               {t.buy}
//           </button>
//       </div>

//       {/* 🏷️ 닉네임 변경권 */}
//       <div className="card" style={{ background: '#34495e', padding: '20px', marginBottom: '20px', borderRadius: '15px', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
//           <div>
//               <h3 style={{ margin:0, fontSize: '18px' }}> {t.nickChange}</h3>
//               <span style={{ fontSize:'13px', color:'#bdc3c7' }}>{t.nickDesc}</span>
//           </div>
//           <button className="btn" disabled={isProcessing} onClick={changeNickname} style={{ 
//               background: '#3498db', color: 'white', fontWeight: 'bold',
//               padding: '10px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer'
//           }}>
//               {t.buy} (10억)
//           </button>
//       </div>

//       {/* 🏬 암시장 */}
//       <div className="card" style={{ 
//           background: isShopOpen ? '#2c3e50' : '#222', 
//           padding: '20px', marginBottom: '30px', 
//           borderRadius: '15px',
//           border: isShopOpen ? '2px solid #e74c3c' : '2px solid #555',
//           opacity: isShopOpen ? 1 : 0.6,
//           pointerEvents: isShopOpen ? 'auto' : 'none',
//           boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
//       }}>
//         <h2 style={{ marginTop: 0, color: isShopOpen ? '#e74c3c' : '#7f8c8d', textAlign: 'center', fontSize: '22px', marginBottom: '20px' }}>
//             {isShopOpen ? `😈 ${t.blackMarket}` : `🔒 ${t.shopClosed}`}
//         </h2>
        
//         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
//             {/* ⭐ 핵공격 버튼 */}
//             <button className="btn" disabled={!features.attack || isProcessing} onClick={handleAttack} style={{ 
//                 background: features.attack ? '#8e44ad' : '#3d3d3d', color: features.attack ? 'white' : '#777', 
//                 gridColumn: '1 / -1', marginBottom: 10, padding: '15px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer'
//             }}>
//                 🚀 {t.h_attack} (전재산 50%)<br/><span style={{fontSize:'11px', fontWeight:'normal'}}>랜덤 유저 1명 타격</span>
//             </button>

//             {/* 강등 버튼들 */}
//             {[
//                 { label: t.demoteR1, cost: "10억", sub: t.demoteSelf, color: '#e67e22', func: () => randomDemote(1000000000, 1, true) },
//                 { label: t.demoteR2, cost: "50억", sub: t.demoteSelf, color: '#d35400', func: () => randomDemote(5000000000, 2, true) },
//                 { label: t.demoteBomb1, cost: "100억", sub: t.demoteNoSelf, color: '#c0392b', func: () => randomDemote(10000000000, 1, false) },
//                 { label: t.demoteBomb2, cost: "300억", sub: t.demoteNoSelf, color: '#8e44ad', func: () => randomDemote(3000000000, 2, false) },
//             ].map((btn, idx) => (
//                 <button key={idx} className="btn" disabled={isProcessing} onClick={btn.func} style={{ 
//                     background: btn.color, color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px'
//                 }}>
//                     {btn.label} ({btn.cost})<br/><span style={{fontSize:'10px', fontWeight:'normal'}}>{btn.sub}</span>
//                 </button>
//             ))}
            
//             <button className="btn" disabled={isProcessing} onClick={() => { setSearchResults([]); setTargetName(""); setShowSniperModal(true); }} style={{ 
//                 background: '#34495e', border:'2px solid #f1c40f', color: '#f1c40f',
//                 gridColumn: '1 / -1', padding: '15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer'
//             }}>
//                 🎯 {t.sniper} (500억)<br/><span style={{fontSize:'11px', fontWeight:'normal', color: '#ccc'}}>{t.sniperDesc}</span>
//             </button>
//         </div>
//       </div>

//       {/* 🧞‍♂️ [추가] 소원권 입력 모달 */}
//       {showWishModal && (
//           <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.8)', zIndex:2000, display:'flex', justifyContent:'center', alignItems:'center', backdropFilter: 'blur(5px)' }}>
//               <div style={{ background:'#2c3e50', padding:'25px', borderRadius:'15px', width:'90%', maxWidth:'450px', border: '2px solid #2575fc', boxShadow: '0 0 30px rgba(37, 117, 252, 0.5)' }}>
//                   <div style={{textAlign:'center', marginBottom:'20px'}}>
//                       <div style={{fontSize:'40px', marginBottom:'10px'}}>🧞‍♂️</div>
//                       <h3 style={{ color:'#2575fc', margin:0, fontSize:'22px' }}>{t.wishTicket || "소원권"}</h3>
//                       <p style={{color:'#bdc3c7', fontSize:'13px', marginTop:'5px'}}>관리자에게 직접 소원을 전달합니다.</p>
//                   </div>
                  
//                   <textarea 
//                       style={{ 
//                           width: '100%', height: '120px', padding: '15px', 
//                           background: '#1e272e', border: '1px solid #444', borderRadius: '10px', 
//                           color: 'white', fontSize: '15px', resize: 'none', outline: 'none'
//                       }} 
//                       placeholder={t.wish_input_ph || "이루고 싶은 소원을 적어주세요..."}
//                       value={wishContent}
//                       onChange={(e) => setWishContent(e.target.value)}
//                   />
                  
//                   <div style={{marginTop:'15px', fontSize:'13px', color:'#f1c40f', textAlign:'center', fontWeight:'bold'}}>
//                       예상 비용: -{Math.floor(point / 2).toLocaleString()}원 (50%)
//                   </div>

//                   <div style={{ display:'flex', gap:'10px', marginTop:'20px' }}>
//                       <button className="btn" style={{ flex:1, background:'#7f8c8d', padding:'12px', borderRadius:'10px', border:'none', color:'white', fontWeight:'bold', cursor:'pointer' }} onClick={() => setShowWishModal(false)}>{t.cancel}</button>
//                       <button className="btn" style={{ flex:1, background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)', padding:'12px', borderRadius:'10px', border:'none', color:'white', fontWeight:'bold', cursor:'pointer' }} onClick={confirmWishPurchase}>{t.confirm}</button>
//                   </div>
//               </div>
//           </div>
//       )}

//       {/* 저격 모달 */}
//       {showSniperModal && (
//           <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.8)', zIndex:999, display:'flex', justifyContent:'center', alignItems:'center', backdropFilter: 'blur(5px)' }}>
//               <div style={{ background:'#2c3e50', padding:'25px', borderRadius:'15px', width:'90%', maxWidth:'400px', border: '1px solid #f1c40f', boxShadow: '0 0 20px rgba(241, 196, 15, 0.3)' }}>
//                   <h3 style={{ color:'#f1c40f', marginTop:0, textAlign:'center' }}>{t.sniperTitle}</h3>
//                   <div style={{ display:'flex', gap:'5px', marginBottom:'15px' }}>
//                       <input className="input" style={{ flex:1, margin:0, padding: '10px', borderRadius: '5px', border: '1px solid #555', background: '#222', color: 'white' }} placeholder={t.searchNick} value={targetName} onChange={(e)=>setTargetName(e.target.value)} />
//                       <button className="btn" style={{ background:'#3498db', width:'70px', borderRadius: '5px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }} onClick={handleSearchUser}>{t.search}</button>
//                   </div>
//                   <div style={{ maxHeight:'200px', overflowY:'auto', marginBottom:'15px', background: '#222', borderRadius: '5px' }}>
//                       {searchResults.map(u => (
//                           <div key={u.id} style={{ padding:'12px', borderBottom:'1px solid #333', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
//                               <span style={{ fontSize: '14px' }}>{u.name} <span style={{fontSize:'11px', color:'#aaa'}}>({u.tierName})</span></span>
//                               <button className="btn" style={{ padding:'5px 12px', fontSize:'12px', background:'#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => executeSniper(u)}>{t.doDemote}</button>
//                           </div>
//                       ))}
//                       {searchResults.length === 0 && targetName && <p style={{textAlign:'center', color:'#777', padding: '10px'}}>{t.noResult}</p>}
//                   </div>
//                   <button className="btn" style={{ width:'100%', background:'#7f8c8d', padding: '12px', borderRadius: '8px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setShowSniperModal(false)}>{t.close}</button>
//               </div>
//           </div>
//       )}

//       {/* 티어 리스트 */}
//       <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', paddingBottom: '70px' }}>
//         {TIER_SYSTEM.map((tier) => {
//             const isMyTier = myTierLevel === tier.level;
//             const isNext = myTierLevel + 1 === tier.level;
//             const isLocked = myTierLevel + 1 < tier.level;
//             return (
//                 <div key={tier.level} className="card" style={{ 
//                     background: isMyTier ? 'rgba(46, 204, 113, 0.15)' : '#2f3640', 
//                     border: isMyTier ? `2px solid ${tier.color}` : (isNext ? '2px solid #f1c40f' : '1px solid #444'), 
//                     padding: '15px', borderRadius: '12px',
//                     display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
//                     opacity: isLocked ? 0.5 : 1,
//                     boxShadow: isMyTier ? `0 0 15px ${tier.color}40` : 'none'
//                 }}>
//                     <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
//                         <div style={{ width: '50px', height: '50px', display:'flex', justifyContent:'center', alignItems:'center' }}>
//                             <img src={`/tiers/${tier.level}.png`} alt={tier.name} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.2))' }} onError={(e) => {e.target.style.display='none'}} />
//                         </div>
//                         <div>
//                             <div style={{ fontSize: '18px', fontWeight: 'bold', color: tier.color }}>{tier.name}</div>
//                             <div style={{ fontSize: '12px', color: '#bbb' }}>{tier.cost === 0 ? '기본' : `${tier.cost.toLocaleString()}`}</div>
//                         </div>
//                     </div>
//                     <div>
//                         {isMyTier ? <span style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: '14px' }}>✅ {t.currentTier}</span> : 
//                          isNext ? <button className="btn" disabled={isProcessing} onClick={() => promoteTier(tier)} style={{ background: isProcessing ? '#7f8c8d' : tier.color, color: 'white', fontWeight:'bold', padding: '8px 15px', borderRadius: '6px', border: 'none', cursor: isProcessing ? 'not-allowed' : 'pointer' }}>{t.upgrade}</button> 
//                                 : <span style={{ color: '#555', fontSize: '20px' }}>🔒</span>}
//                     </div>
//                 </div>
//             );
//         })}
//       </div>

//       <button className="btn" style={{ 
//           position:'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth:'400px', 
//           background: '#444', color: 'white', padding: '15px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
//       }} onClick={() => navigate('/home')}>
//           {t.home}
//       </button>
//     </div>
//   );
// }


import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp, query, where, getDocs, limit, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

const TIER_SYSTEM = [
  { level: 0, name: '언랭크', cost: 0, color: '#7f8c8d' },
  { level: 1, name: '아이언', cost: 5000000, color: '#454545' },
  { level: 2, name: '브론즈', cost: 10000000, color: '#cd7f32' },
  { level: 3, name: '실버', cost: 30000000, color: '#c0c0c0' },
  { level: 4, name: '골드', cost: 100000000, color: '#f1c40f' },
  { level: 5, name: '플래티넘', cost: 300000000, color: '#2ecc71' },
  { level: 6, name: '에메랄드', cost: 500000000, color: '#16a085' },
  { level: 7, name: '다이아', cost: 1000000000, color: '#3498db' },
  { level: 8, name: '마스터', cost: 5000000000, color: '#9b59b6' },
  { level: 9, name: '그랜드마스터', cost: 10000000000, color: '#e74c3c' },
  { level: 10, name: '챌린저', cost: 50000000000, color: '#f39c12' }
];

const ADMIN_EMAIL = "kks3172@naver.com"; 

export default function Shop() {
  const [point, setPoint] = useState(0);
  const [myTierLevel, setMyTierLevel] = useState(0); 
  const [isShopOpen, setIsShopOpen] = useState(true);
  const [features, setFeatures] = useState({ attack: true }); 

  const [showSniperModal, setShowSniperModal] = useState(false);
  const [showWishModal, setShowWishModal] = useState(false); 
  
  const [targetName, setTargetName] = useState(""); 
  const [wishContent, setWishContent] = useState(""); 
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
            setFeatures(data); 
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

        setPoint(prev => prev - cost); 
        alert(`${t.h_nuke_hit}\n${targetName} ${t.h_nuke_hit_msg}\n${t.h_nuke_damage}: ${damage.toLocaleString()}`);
    } catch (e) { console.error(e); alert(t.alertError); }
    finally { setIsProcessing(false); }
  };

  const promoteTier = async (targetTier) => {
    if (isProcessing) return;
    if (myTierLevel >= targetTier.level) return;
    if (myTierLevel + 1 !== targetTier.level) return alert("이전 티어부터 승급하세요!");
    
    if (point < targetTier.cost) return alert(t.alertNoMoney);
    
    if (!window.confirm(`[${targetTier.name}] 티어로 승급하시겠습니까?\n${t.alertCost}: ${targetTier.cost.toLocaleString()}원`)) return;
    setIsProcessing(true);
    try {
      const myDocSnap = await getDoc(doc(db, "users", user.uid));
      const currentPoint = myDocSnap.data().point || 0;
      
      if (currentPoint < targetTier.cost) { alert(t.alertNoMoney); setPoint(currentPoint); return; }
      
      await updateDoc(doc(db, "users", user.uid), { point: increment(-targetTier.cost), tierLevel: targetTier.level, tierName: targetTier.name });
      setPoint(prev => prev - targetTier.cost);
      setMyTierLevel(targetTier.level);
      alert(`🎉 승급 완료! [${targetTier.name}] 달성!`);
    } catch (e) { alert(t.alertError); }
    finally { setIsProcessing(false); }
  };

  const openWishModal = () => {
    if (point < 1000000000) {
        return alert(t.wish_min_asset || "최소 10억 이상의 자산이 있어야 구매할 수 있습니다.");
    }
    setWishContent("");
    setShowWishModal(true);
  };

  const confirmWishPurchase = async () => {
    if (!wishContent.trim()) return alert("소원 내용을 입력해주세요.");
    if (isProcessing) return;

    const currentPoint = point || 0;
    const cost = Math.floor(currentPoint / 2);

    if (!window.confirm(`${t.wish_confirm || "정말 소원을 비시겠습니까?"}\n(${t.alertCost}: -${cost.toLocaleString()}원)`)) return;

    setIsProcessing(true);
    try {
        const q = query(collection(db, "users"), where("email", "==", ADMIN_EMAIL));
        const adminSnap = await getDocs(q);
        
        if (adminSnap.empty) {
            setIsProcessing(false);
            return alert("관리자 정보를 찾을 수 없어 소원을 보낼 수 없습니다.");
        }
        
        const adminUid = adminSnap.docs[0].id;
        const myDocSnap = await getDoc(doc(db, "users", user.uid));
        const myName = myDocSnap.data().name || "익명";
        
        // 1. 비용 차감
        await updateDoc(doc(db, "users", user.uid), { point: increment(-cost) });
        setPoint(prev => prev - cost);

        // 2. 관리자에게 쪽지 전송
        await addDoc(collection(db, "messages"), {
            senderUid: user.uid,
            senderName: myName,
            receiverUid: adminUid, 
            receiverName: "관리자",
            content: `🧞‍♂️ [소원권 사용]\n\n${wishContent}\n\n(지불 금액: ${cost.toLocaleString()}원)`,
            isRead: false,
            createdAt: serverTimestamp()
        });

        // 🔥 [추가] 3. 관리자에게 알림 전송 (이게 있어야 헤더 종이 울림!)
        await addDoc(collection(db, "notifications"), {
            receiverUid: adminUid,
            senderUid: user.uid,
            senderName: myName,
            type: "wish", // 알림 타입
            msg: `🧞‍♂️ ${myName}님이 소원권을 사용했습니다!`,
            isRead: false,
            createdAt: serverTimestamp()
        });

        // 4. 히스토리 저장
        await addDoc(collection(db, "history"), { 
            uid: user.uid, 
            type: "상점", 
            msg: `🧞‍♂️ 소원권 사용`, 
            amount: -cost, 
            createdAt: serverTimestamp() 
        });

        alert(t.wish_success || "소원이 관리자에게 전달되었습니다!");
        setShowWishModal(false);

    } catch (e) {
        alert("오류: " + e.message);
    } finally {
        setIsProcessing(false);
    }
  };

  const changeNickname = async () => {
    if (isProcessing) return;
    const cost = 1000000000;
    
    if (point < cost) return alert(t.alertNoMoney);
    
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
    
    if (point < cost) return alert(t.alertNoMoney);
    
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
    
    if (point < cost) return alert(t.alertNoMoney);
    
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

  // 🔥 [추가] 서버 전체 유저 포인트 0원 초기화 (타노스 스냅)
  const executeThanosSnap = async () => {
    if (!isShopOpen) return alert(t.shopClosed);
    if (isProcessing) return;
    
    const cost = 10000000000000000000; // 1000경 (10,000,000,000,000,000)
    if (point < cost) return alert(`잔액이 부족합니다. (필요: 1,000경원)`);
    
    if (!window.confirm(`⚠️ [경고] 정말 전 서버 모든 유저의 자산을 0원으로 만드시겠습니까?\n(${t.alertCost}: 1,000경원)`)) return;
    if (!window.confirm(`돌이킬 수 없는 작업입니다. 확실합니까?`)) return;

    setIsProcessing(true);
    try {
        const myDoc = await getDoc(doc(db, "users", user.uid));
        if ((myDoc.data().point || 0) < cost) throw new Error("잔액 부족");
        const myName = myDoc.data().name || "익명";

        // 본인 돈 차감
        await updateDoc(doc(db, "users", user.uid), { point: increment(-cost) });
        setPoint(prev => prev - cost);

        const usersRef = collection(db, "users");
        const querySnapshot = await getDocs(usersRef);
        
        // 전 유저 point 0으로 업데이트 및 피격 히스토리 추가
        const updatePromises = [];
        querySnapshot.forEach((userDoc) => {
            const currentData = userDoc.data();
            const currentPoint = currentData.point || 0;
            // 돈이 0 이상인 사람만 0으로 만듦
            if (currentPoint > 0) {
                updatePromises.push(updateDoc(doc(db, "users", userDoc.id), { point: 0 }));
                // 각 유저에게 피격 알림 기록
                updatePromises.push(addDoc(collection(db, "history"), { 
                    uid: userDoc.id, 
                    type: "피격", 
                    msg: `💥 [${myName}]님의 핑거 스냅으로 모든 재산이 소멸되었습니다.`, 
                    amount: -currentPoint, 
                    createdAt: serverTimestamp() 
                }));
            }
        });

        await Promise.all(updatePromises);

        // 시전자 본인 공격 히스토리
        await addDoc(collection(db, "history"), { 
            uid: user.uid, 
            type: "공격", 
            msg: `💥 서버 내 모든 유저의 재산을 소멸시켰습니다. (타노스 스냅)`, 
            amount: -cost, 
            createdAt: serverTimestamp() 
        });

        alert("💥 타노스 스냅 완료... 전 서버 유저의 재산이 0원이 되었습니다.");
    } catch (e) {
        console.error(e);
        alert("오류: " + e.message);
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="container" style={{ background: '#1e272e', minHeight: '100vh', padding: '20px', color: 'white' }}>
      
      {/* 🏷️ 상점 타이틀 */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#00d2d3', margin: 0, textShadow: '0 0 10px rgba(0, 210, 211, 0.5)' }}>{t.shopTitle}</h1>
        <div style={{ display:'inline-block', background:'#2f3640', padding:'10px 25px', marginTop:'15px', borderRadius:'50px', border:'1px solid #00d2d3', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
           {t.shopBalance}: <span style={{ color:'#f1c40f', fontWeight:'bold', fontSize:'18px' }}>{Math.max(0, point).toLocaleString()}</span>
        </div>
      </div>

      {/* 🧞‍♂️ [수정] 소원권 (모달 열기 버튼) */}
      <div className="card" style={{ 
          background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)', 
          padding: '20px', marginBottom: '20px', 
          borderRadius: '15px',
          display:'flex', justifyContent:'space-between', alignItems:'center', 
          border:'2px solid rgba(255,255,255,0.2)', 
          boxShadow:'0 0 20px rgba(37, 117, 252, 0.4)' 
      }}>
          <div>
              <h3 style={{ margin:0, color:'white', fontSize: '20px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{fontSize:'24px'}}></span> {t.wishTicket || "소원권"}
              </h3>
              <div style={{ fontSize:'13px', color:'#eee', marginTop:'5px', opacity: 0.9 }}>{t.wishDesc || "관리자에게 소원을 빕니다. (전재산 50%)"}</div>
          </div>
          <button className="btn" disabled={isProcessing} onClick={openWishModal} style={{ 
              background: '#fff', color: '#2575fc', fontWeight: 'bold', 
              padding: '12px 20px', borderRadius: '10px', border: 'none', 
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)', cursor: 'pointer',
              transition: 'transform 0.1s'
          }}>
              {t.buy}
          </button>
      </div>

      {/* 🏷️ 닉네임 변경권 */}
      <div className="card" style={{ background: '#34495e', padding: '20px', marginBottom: '20px', borderRadius: '15px', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
          <div>
              <h3 style={{ margin:0, fontSize: '18px' }}> {t.nickChange}</h3>
              <span style={{ fontSize:'13px', color:'#bdc3c7' }}>{t.nickDesc}</span>
          </div>
          <button className="btn" disabled={isProcessing} onClick={changeNickname} style={{ 
              background: '#3498db', color: 'white', fontWeight: 'bold',
              padding: '10px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer'
          }}>
              {t.buy} (10억)
          </button>
      </div>

      {/* 🏬 암시장 */}
      <div className="card" style={{ 
          background: isShopOpen ? '#2c3e50' : '#222', 
          padding: '20px', marginBottom: '30px', 
          borderRadius: '15px',
          border: isShopOpen ? '2px solid #e74c3c' : '2px solid #555',
          opacity: isShopOpen ? 1 : 0.6,
          pointerEvents: isShopOpen ? 'auto' : 'none',
          boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{ marginTop: 0, color: isShopOpen ? '#e74c3c' : '#7f8c8d', textAlign: 'center', fontSize: '22px', marginBottom: '20px' }}>
            {isShopOpen ? `😈 ${t.blackMarket}` : `🔒 ${t.shopClosed}`}
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
            {/* ⭐ 핵공격 버튼 */}
            <button className="btn" disabled={!features.attack || isProcessing} onClick={handleAttack} style={{ 
                background: features.attack ? '#8e44ad' : '#3d3d3d', color: features.attack ? 'white' : '#777', 
                gridColumn: '1 / -1', marginBottom: 10, padding: '15px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer'
            }}>
                🚀 {t.h_attack} (전재산 50%)<br/><span style={{fontSize:'11px', fontWeight:'normal'}}>랜덤 유저 1명 타격</span>
            </button>

            {/* 강등 버튼들 */}
            {[
                { label: t.demoteR1, cost: "10억", sub: t.demoteSelf, color: '#e67e22', func: () => randomDemote(1000000000, 1, true) },
                { label: t.demoteR2, cost: "50억", sub: t.demoteSelf, color: '#d35400', func: () => randomDemote(5000000000, 2, true) },
                { label: t.demoteBomb1, cost: "100억", sub: t.demoteNoSelf, color: '#c0392b', func: () => randomDemote(10000000000, 1, false) },
                { label: t.demoteBomb2, cost: "300억", sub: t.demoteNoSelf, color: '#8e44ad', func: () => randomDemote(3000000000, 2, false) },
            ].map((btn, idx) => (
                <button key={idx} className="btn" disabled={isProcessing} onClick={btn.func} style={{ 
                    background: btn.color, color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px'
                }}>
                    {btn.label} ({btn.cost})<br/><span style={{fontSize:'10px', fontWeight:'normal'}}>{btn.sub}</span>
                </button>
            ))}
            
            <button className="btn" disabled={isProcessing} onClick={() => { setSearchResults([]); setTargetName(""); setShowSniperModal(true); }} style={{ 
                background: '#34495e', border:'2px solid #f1c40f', color: '#f1c40f',
                gridColumn: '1 / -1', padding: '15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer'
            }}>
                🎯 {t.sniper} (500억)<br/><span style={{fontSize:'11px', fontWeight:'normal', color: '#ccc'}}>{t.sniperDesc}</span>
            </button>

            {/* 🔥 [추가] 타노스 스냅 버튼 */}
            <button className="btn" disabled={isProcessing} onClick={executeThanosSnap} style={{ 
                background: '#000000', border:'2px solid #e74c3c', color: '#e74c3c',
                gridColumn: '1 / -1', padding: '15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px'
            }}>
                💥 타노스 스냅 (1,000경)<br/><span style={{fontSize:'11px', fontWeight:'normal', color: '#aaa'}}>전 서버 모든 유저 자산 0원 초기화</span>
            </button>
        </div>
      </div>

      {/* 🧞‍♂️ [추가] 소원권 입력 모달 */}
      {showWishModal && (
          <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.8)', zIndex:2000, display:'flex', justifyContent:'center', alignItems:'center', backdropFilter: 'blur(5px)' }}>
              <div style={{ background:'#2c3e50', padding:'25px', borderRadius:'15px', width:'90%', maxWidth:'450px', border: '2px solid #2575fc', boxShadow: '0 0 30px rgba(37, 117, 252, 0.5)' }}>
                  <div style={{textAlign:'center', marginBottom:'20px'}}>
                      <div style={{fontSize:'40px', marginBottom:'10px'}}>🧞‍♂️</div>
                      <h3 style={{ color:'#2575fc', margin:0, fontSize:'22px' }}>{t.wishTicket || "소원권"}</h3>
                      <p style={{color:'#bdc3c7', fontSize:'13px', marginTop:'5px'}}>관리자에게 직접 소원을 전달합니다.</p>
                  </div>
                  
                  <textarea 
                      style={{ 
                          width: '100%', height: '120px', padding: '15px', 
                          background: '#1e272e', border: '1px solid #444', borderRadius: '10px', 
                          color: 'white', fontSize: '15px', resize: 'none', outline: 'none'
                      }} 
                      placeholder={t.wish_input_ph || "이루고 싶은 소원을 적어주세요..."}
                      value={wishContent}
                      onChange={(e) => setWishContent(e.target.value)}
                  />
                  
                  <div style={{marginTop:'15px', fontSize:'13px', color:'#f1c40f', textAlign:'center', fontWeight:'bold'}}>
                      예상 비용: -{Math.floor(point / 2).toLocaleString()}원 (50%)
                  </div>

                  <div style={{ display:'flex', gap:'10px', marginTop:'20px' }}>
                      <button className="btn" style={{ flex:1, background:'#7f8c8d', padding:'12px', borderRadius:'10px', border:'none', color:'white', fontWeight:'bold', cursor:'pointer' }} onClick={() => setShowWishModal(false)}>{t.cancel}</button>
                      <button className="btn" style={{ flex:1, background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)', padding:'12px', borderRadius:'10px', border:'none', color:'white', fontWeight:'bold', cursor:'pointer' }} onClick={confirmWishPurchase}>{t.confirm}</button>
                  </div>
              </div>
          </div>
      )}

      {/* 저격 모달 */}
      {showSniperModal && (
          <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.8)', zIndex:999, display:'flex', justifyContent:'center', alignItems:'center', backdropFilter: 'blur(5px)' }}>
              <div style={{ background:'#2c3e50', padding:'25px', borderRadius:'15px', width:'90%', maxWidth:'400px', border: '1px solid #f1c40f', boxShadow: '0 0 20px rgba(241, 196, 15, 0.3)' }}>
                  <h3 style={{ color:'#f1c40f', marginTop:0, textAlign:'center' }}>{t.sniperTitle}</h3>
                  <div style={{ display:'flex', gap:'5px', marginBottom:'15px' }}>
                      <input className="input" style={{ flex:1, margin:0, padding: '10px', borderRadius: '5px', border: '1px solid #555', background: '#222', color: 'white' }} placeholder={t.searchNick} value={targetName} onChange={(e)=>setTargetName(e.target.value)} />
                      <button className="btn" style={{ background:'#3498db', width:'70px', borderRadius: '5px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }} onClick={handleSearchUser}>{t.search}</button>
                  </div>
                  <div style={{ maxHeight:'200px', overflowY:'auto', marginBottom:'15px', background: '#222', borderRadius: '5px' }}>
                      {searchResults.map(u => (
                          <div key={u.id} style={{ padding:'12px', borderBottom:'1px solid #333', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                              <span style={{ fontSize: '14px' }}>{u.name} <span style={{fontSize:'11px', color:'#aaa'}}>({u.tierName})</span></span>
                              <button className="btn" style={{ padding:'5px 12px', fontSize:'12px', background:'#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => executeSniper(u)}>{t.doDemote}</button>
                          </div>
                      ))}
                      {searchResults.length === 0 && targetName && <p style={{textAlign:'center', color:'#777', padding: '10px'}}>{t.noResult}</p>}
                  </div>
                  <button className="btn" style={{ width:'100%', background:'#7f8c8d', padding: '12px', borderRadius: '8px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setShowSniperModal(false)}>{t.close}</button>
              </div>
          </div>
      )}

      {/* 티어 리스트 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', paddingBottom: '70px' }}>
        {TIER_SYSTEM.map((tier) => {
            const isMyTier = myTierLevel === tier.level;
            const isNext = myTierLevel + 1 === tier.level;
            const isLocked = myTierLevel + 1 < tier.level;
            return (
                <div key={tier.level} className="card" style={{ 
                    background: isMyTier ? 'rgba(46, 204, 113, 0.15)' : '#2f3640', 
                    border: isMyTier ? `2px solid ${tier.color}` : (isNext ? '2px solid #f1c40f' : '1px solid #444'), 
                    padding: '15px', borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                    opacity: isLocked ? 0.5 : 1,
                    boxShadow: isMyTier ? `0 0 15px ${tier.color}40` : 'none'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ width: '50px', height: '50px', display:'flex', justifyContent:'center', alignItems:'center' }}>
                            <img src={`/tiers/${tier.level}.png`} alt={tier.name} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.2))' }} onError={(e) => {e.target.style.display='none'}} />
                        </div>
                        <div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: tier.color }}>{tier.name}</div>
                            <div style={{ fontSize: '12px', color: '#bbb' }}>{tier.cost === 0 ? '기본' : `${tier.cost.toLocaleString()}`}</div>
                        </div>
                    </div>
                    <div>
                        {isMyTier ? <span style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: '14px' }}>✅ {t.currentTier}</span> : 
                         isNext ? <button className="btn" disabled={isProcessing} onClick={() => promoteTier(tier)} style={{ background: isProcessing ? '#7f8c8d' : tier.color, color: 'white', fontWeight:'bold', padding: '8px 15px', borderRadius: '6px', border: 'none', cursor: isProcessing ? 'not-allowed' : 'pointer' }}>{t.upgrade}</button> 
                                : <span style={{ color: '#555', fontSize: '20px' }}>🔒</span>}
                    </div>
                </div>
            );
        })}
      </div>

      <button className="btn" style={{ 
          position:'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth:'400px', 
          background: '#444', color: 'white', padding: '15px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
      }} onClick={() => navigate('/home')}>
          {t.home}
      </button>
    </div>
  );
}