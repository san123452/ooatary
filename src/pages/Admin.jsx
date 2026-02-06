

// import React, { useState, useEffect, useMemo } from 'react';
// import { db } from '../firebase';
// import { collection, query, orderBy, limit, getDocs, updateDoc, doc, getDoc, setDoc, deleteDoc, where, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';
// import { useLanguage } from '../LanguageContext';

// const TIER_LIST = [
//     "언랭크", "아이언", "브론즈", "실버", "골드", "플래티넘", "에메랄드", "다이아", "마스터", "그랜드마스터", "챌린저"
// ];

// export default function Admin() {
//     const navigate = useNavigate();
//     const { t } = useLanguage();
//     const [tab, setTab] = useState('notice'); 
    
//     const [notice, setNotice] = useState("");
//     const [users, setUsers] = useState([]);
//     const [totalMoney, setTotalMoney] = useState(0); 
//     const [inputPoints, setInputPoints] = useState({});
//     const [inputNames, setInputNames] = useState({});
    
//     const [inputTitles, setInputTitles] = useState({});
//     const [inputColors, setInputColors] = useState({});

//     const [history, setHistory] = useState([]);
//     const [selectedUser, setSelectedUser] = useState(null);
//     const [userHistory, setUserHistory] = useState([]);
//     const [isServerOpen, setIsServerOpen] = useState(true);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [features, setFeatures] = useState({ 
//         transfer: true, shop: true, autoApproval: true, boardWrite: true, gameLock: false 
//     });
//     const [reportRank, setReportRank] = useState([]);
//     const [banDuration, setBanDuration] = useState(1);
//     const [boardBanDuration, setBoardBanDuration] = useState(1);

//     // 🔥 [추가] 동기화 진행 상태
//     const [isSyncing, setIsSyncing] = useState(false);

//     useEffect(() => {
//         if (tab === 'notice') fetchNotice();
//         if (tab === 'users') fetchUsers(); 
//         if (tab === 'server') fetchServerStatus();
//         if (tab === 'features') fetchFeatures();
//         if (tab === 'sanction') { fetchUsers(); fetchReportRank(); } 
//         if (tab === 'history') { fetchHistory(); fetchUsers(); }
//     }, [tab]);

//     const fetchServerStatus = async () => { try { const docSnap = await getDoc(doc(db, "system", "server")); if (docSnap.exists()) { setIsServerOpen(docSnap.data().isOpen); } else { await setDoc(doc(db, "system", "server"), { isOpen: true }); setIsServerOpen(true); } } catch (e) { console.error(e); } };
//     const toggleServer = async () => { const newState = !isServerOpen; if (!window.confirm(newState ? t.ad_open_confirm : t.ad_close_confirm)) return; try { await updateDoc(doc(db, "system", "server"), { isOpen: newState }); setIsServerOpen(newState); alert(newState ? "✅ OPEN" : "🚧 CLOSED"); } catch (e) { alert("Error: " + e.message); } };
//     const handleForceRefresh = async () => { if (!window.confirm(t.ad_refresh_confirm)) return; try { await setDoc(doc(db, "system", "info"), { version: Date.now() }, { merge: true }); alert("✅ OK"); } catch (e) { alert("Error"); } };
    
//     // 🔥 [추가] 모든 게시글의 작성자 칭호/이름을 최신 유저 정보로 업데이트
//     const handleSyncPosts = async () => {
//         if (!window.confirm("모든 게시글의 작성자 정보를 현재 유저 정보(칭호, 이름)로 덮어씌웁니다.\n시간이 조금 걸릴 수 있습니다. 진행할까요?")) return;
        
//         setIsSyncing(true);
//         try {
//             // 1. 모든 유저 정보 가져오기 (UID -> Data 매핑)
//             const usersSnap = await getDocs(collection(db, "users"));
//             const userMap = {};
//             usersSnap.forEach(doc => {
//                 userMap[doc.id] = doc.data();
//             });

//             // 2. 모든 게시글 가져오기
//             const postsSnap = await getDocs(collection(db, "posts"));
            
//             // 3. 배치 업데이트 (한 번에 여러 개 수정)
//             const batch = writeBatch(db);
//             let updateCount = 0;

//             postsSnap.forEach((postDoc) => {
//                 const post = postDoc.data();
//                 const writerUid = post.uid;
                
//                 // 작성자가 현재 유저 목록에 있다면 정보 갱신
//                 if (userMap[writerUid]) {
//                     const userData = userMap[writerUid];
                    
//                     // 현재 게시글의 정보와 유저 최신 정보가 다르면 업데이트 대상
//                     if (post.authorTitle !== (userData.userTitle || "") || 
//                         post.authorTitleColor !== (userData.userTitleColor || "") ||
//                         post.authorName !== userData.name) {
                        
//                         const postRef = doc(db, "posts", postDoc.id);
//                         batch.update(postRef, {
//                             authorName: userData.name,
//                             authorTitle: userData.userTitle || "",
//                             authorTitleColor: userData.userTitleColor || ""
//                         });
//                         updateCount++;
//                     }
//                 }
//             });

//             if (updateCount > 0) {
//                 await batch.commit();
//                 alert(`✅ 총 ${updateCount}개의 게시글 정보를 최신화했습니다!`);
//             } else {
//                 alert("✨ 이미 모든 게시글이 최신 상태입니다.");
//             }

//         } catch (e) {
//             console.error(e);
//             alert("동기화 중 오류 발생: " + e.message);
//         } finally {
//             setIsSyncing(false);
//         }
//     };

//     const fetchNotice = async () => { try { const docSnap = await getDoc(doc(db, "system", "notice")); if (docSnap.exists()) setNotice(docSnap.data().text || ""); } catch (e) { console.error(e); } };
//     const handleSaveNotice = async () => { if (!notice.trim()) return alert(t.alertInputAll); try { await setDoc(doc(db, "system", "notice"), { text: notice, updatedAt: new Date().toLocaleString() }); alert(t.alertComplete); } catch (e) { alert(e.message); } };
//     const handleDeleteNotice = async () => { if (!window.confirm(t.bd_delete_confirm)) return; try { await deleteDoc(doc(db, "system", "notice")); setNotice(""); alert(t.alertComplete); } catch (e) { alert(e.message); } };
    
//     const fetchUsers = async () => {
//         const usersRef = collection(db, "users");
//         try {
//             const snap = await getDocs(usersRef);
//             let sumMoney = 0; 
//             const list = snap.docs.map(d => {
//                 const data = d.data();
//                 sumMoney += data.point || 0; 
//                 return { uid: d.id, ...data };
//             });
//             list.sort((a, b) => {
//                 if (a.isApproved !== b.isApproved) return a.isApproved ? 1 : -1; 
//                 const dateA = a.createdAt?.seconds || 0;
//                 const dateB = b.createdAt?.seconds || 0;
//                 return dateB - dateA;
//             });
//             setTotalMoney(sumMoney); 
//             setUsers(list);
//         } catch (e) { console.error(e); alert("유저 목록 로딩 실패"); }
//     };

//     const handleAdminSearchUser = async () => {
//         if (!searchTerm.trim()) { fetchUsers(); return; }
//         try {
//             const q = query(
//                 collection(db, "users"), 
//                 where("name", ">=", searchTerm), 
//                 where("name", "<=", searchTerm + "\uf8ff"),
//                 limit(20) 
//             );
//             const querySnapshot = await getDocs(q);
//             const searchList = [];
//             querySnapshot.forEach((doc) => { searchList.push({ uid: doc.id, ...doc.data() }); });
//             if (searchList.length === 0) alert("검색 결과가 없습니다.");
//             else setUsers(searchList);
//         } catch (e) { console.error(e); alert("검색 실패"); }
//     };

//     const toggleApprove = async (uid, currentStatus) => {
//         if (!window.confirm(currentStatus ? t.ad_cancel_approve : t.ad_approve)) return;
//         try { await updateDoc(doc(db, "users", uid), { isApproved: !currentStatus }); alert("OK"); fetchUsers(); } catch (e) { alert("Error"); }
//     };
//     const handleUpdatePoint = async (uid, currentPoint) => { 
//         const amount = parseInt(inputPoints[uid]); 
//         if (isNaN(amount)) return alert(t.ad_input_num); 
//         if (!window.confirm(t.ad_point_confirm)) return; 
//         try { 
//             await updateDoc(doc(db, "users", uid), { point: (currentPoint || 0) + amount }); 
//             await addDoc(collection(db, "history"), {
//                 uid, type: "관리자", msg: `Admin ${amount > 0 ? "Give" : "Take"}`, amount, createdAt: serverTimestamp()
//             });
//             alert("OK"); fetchUsers(); setInputPoints({...inputPoints, [uid]:''}); 
//         } catch(e) { alert("Error"); } 
//     };
//     const handleUpdateName = async (uid) => { const newName = inputNames[uid]; if(!newName) return; try { await updateDoc(doc(db, "users", uid), { name: newName }); alert("OK"); fetchUsers(); setInputNames({...inputNames, [uid]:''}); } catch(e) { alert("Error"); } };
    
//     const handleUpdateTitle = async (uid) => {
//         const newTitle = inputTitles[uid];
//         const newColor = inputColors[uid] || '#e74c3c'; 
        
//         try {
//             await updateDoc(doc(db, "users", uid), { 
//                 userTitle: newTitle ? newTitle : "", 
//                 userTitleColor: newTitle ? newColor : "" 
//             });
//             alert("칭호 설정 완료!");
//             fetchUsers();
//             setInputTitles({ ...inputTitles, [uid]: '' });
//         } catch (e) {
//             alert("Error: " + e.message);
//         }
//     };

//     const toggleBan = async (uid, isBanned) => { if (!window.confirm(t.ad_ban_confirm)) return; try { await updateDoc(doc(db, "users", uid), { isBanned: !isBanned }); alert("OK"); fetchUsers(); } catch (e) { alert("Error"); } };
    
//     const fetchUserHistory = async (user) => { setSelectedUser(user); setUserHistory([]); try { const q = query(collection(db, "history"), where("uid", "==", user.uid), orderBy("createdAt", "desc"), limit(50)); const snap = await getDocs(q); setUserHistory(snap.docs.map(d => ({ id: d.id, ...d.data() }))); } catch (e) { console.error(e); alert("Index required"); } };
//     const fetchHistory = async () => { const q = query(collection(db, "history"), orderBy("createdAt", "desc"), limit(50)); const snap = await getDocs(q); setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() }))); };
//     const formatDate = (ts) => { if(!ts) return '-'; const date = ts.toDate(); return `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}`; };

//     const processLogs = (logs) => {
//         const result = [];
//         for (let i = 0; i < logs.length; i++) {
//             const current = logs[i];
//             const prevResult = result.length > 0 ? result[result.length - 1] : null;
//             const isGameStart = current.type === '게임' && current.msg.includes('시작');
//             if (isGameStart && prevResult && prevResult.type === '게임' && prevResult.msg.includes('보상')) {
//                 const currName = current.msg.replace(/[^가-힣a-zA-Z0-9\s]/g, "").replace("시작", "").trim();
//                 const prevName = prevResult.msg.replace(/[^가-힣a-zA-Z0-9\s]/g, "").replace("보상", "").trim();
//                 if (currName === prevName) {
//                     prevResult.isMerged = true; 
//                     prevResult.betAmount = current.amount; 
//                     prevResult.winAmount = prevResult.amount; 
//                     prevResult.amount = prevResult.amount + current.amount; 
//                     prevResult.displayMsg = `${currName} ${t.h_result || "Result"}`; 
//                     continue; 
//                 }
//             }
//             result.push({ ...current, displayMsg: current.msg, isMerged: false });
//         }
//         return result;
//     };

//     const processedUserHistory = useMemo(() => processLogs(userHistory), [userHistory]);
//     const processedAllHistory = useMemo(() => processLogs(history), [history]);

//     const fetchFeatures = async () => { try { const docSnap = await getDoc(doc(db, "system", "features")); if (docSnap.exists()) { setFeatures(docSnap.data()); } } catch (e) {} };
//     const toggleFeature = async (key) => { const newValue = !features[key]; try { await setDoc(doc(db, "system", "features"), { ...features, [key]: newValue }, { merge: true }); setFeatures({ ...features, [key]: newValue }); } catch (e) { alert("Fail"); } };

//     const featureList = [
//         { key: 'autoApproval', icon: '📝', label: t.waitingApproval || "가입 승인" }, 
//         { key: 'transfer', icon: '💸', label: t.h_transfer || "송금" },
//         { key: 'shop', icon: '😈', label: t.shop || "상점" },
//         { key: 'boardWrite', icon: '🖊️', label: t.bd_write_btn || "게시판" },
//         { key: 'gameLock', icon: '🎮', label: t.gameZone || "게임 이용" }
//     ];

//     const fetchReportRank = async () => {
//         const q = query(collection(db, "users"), orderBy("reportCount", "desc"), limit(3));
//         const snap = await getDocs(q);
//         setReportRank(snap.docs.map(d => ({id: d.id, ...d.data()})));
//     };

//     const resetReportCount = async () => {
//         if(!window.confirm(t.reset_report_confirm)) return;
//         const q = query(collection(db, "users"), where("reportCount", ">", 0));
//         const snap = await getDocs(q);
//         snap.forEach(async (d) => {
//             await updateDoc(doc(db, "users", d.id), { reportCount: 0 });
//         });
//         alert(t.alertComplete);
//         fetchReportRank();
//     };

//     const applySanction = async (user, type, value) => {
//         const confirmMsg = `${user.name} - ${type === 'lift' ? t.ad_lift_ban : type} : ${t.ad_confirm}?`;
//         if(!window.confirm(confirmMsg)) return;

//         try {
//             const userRef = doc(db, "users", user.uid);
//             let updateData = {};
//             let logMsg = "";
//             let notiMsg = "";

//             if (type === "gachaBan") {
//                 const endDate = new Date();
//                 endDate.setHours(endDate.getHours() + value);
//                 updateData = { gachaBanDate: endDate };
//                 logMsg = `Gacha Ban (${value}h)`;
//                 notiMsg = `${t.ban_gacha} (${value}h)`;
//             } 
//             else if (type === "boardBan") {
//                 const endDate = new Date();
//                 endDate.setHours(endDate.getHours() + value);
//                 updateData = { boardBanDate: endDate };
//                 logMsg = `Board Ban (${value}h)`;
//                 notiMsg = `게시판 이용 제한 (${value}시간)`;
//             }
//             else if (type === "lift") {
//                 updateData = { gachaBanDate: null, boardBanDate: null };
//                 logMsg = "All Ban Lifted";
//                 notiMsg = t.ad_lift_ban;
//             } else if (type === "tier") {
//                 let currentLevel = user.tierLevel !== undefined ? user.tierLevel : 0;
//                 let nextLevel = currentLevel + value;
//                 if (nextLevel < 0) nextLevel = 0;
//                 if (nextLevel >= TIER_LIST.length) nextLevel = TIER_LIST.length - 1;
//                 const nextTierName = TIER_LIST[nextLevel];
//                 updateData = { tierName: nextTierName, tierLevel: nextLevel };
//                 logMsg = `Tier ${value > 0 ? "Up" : "Down"} (${TIER_LIST[currentLevel]} -> ${nextTierName})`;
//                 notiMsg = `${t.ad_tier_change}: ${nextTierName}`;
//             } else if (type === "confiscate") {
//                 const amountStr = prompt(`${t.ad_confiscate_amount} (Current: ${Math.floor(user.point).toLocaleString()})`, "0");
//                 if (!amountStr) return;
//                 const amount = parseInt(amountStr);
//                 if (isNaN(amount) || amount <= 0) return alert(t.ad_input_num);
//                 const finalPoint = Math.max(0, (user.point || 0) - amount);
//                 updateData = { point: finalPoint };
//                 logMsg = `Confiscate ${amount}`;
//                 notiMsg = `${t.confiscate}: -${amount.toLocaleString()}`;
//             }

//             await updateDoc(userRef, updateData);
//             try {
//                 const historyRef = doc(collection(db, "history"));
//                 await setDoc(historyRef, { uid: user.uid, type: "관리자", msg: `👮 ${logMsg}`, amount: 0, createdAt: serverTimestamp() });
//                 const notiRef = doc(collection(db, "notifications"));
//                 await setDoc(notiRef, { receiverUid: user.uid, type: "admin", msg: `👮 [System] ${notiMsg}`, isRead: false, createdAt: serverTimestamp() });
//             } catch (err) { console.error("Log/Noti Error:", err); }

//             alert(t.alertComplete);
//             fetchUsers(); 
//         } catch(e) { console.error(e); alert(t.alertError); }
//     };

//     return (
//         <div className="container" style={{ paddingTop: 30, background: '#2c3e50', minHeight: '100vh', color: 'white', padding: 20 }}>
//             <h1 style={{ color: '#e74c3c', textAlign: 'center', marginBottom: 20, fontSize:'24px' }}>{t.ad_title || "👮 Admin Page"}</h1>
            
//             <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
//                 <button className="btn" style={{ background: tab === 'notice' ? '#f1c40f' : '#7f8c8d', color: 'black', padding:'8px 12px', fontSize:'14px' }} onClick={() => setTab('notice')}>{t.ad_tab_notice || "📢 공지"}</button>
//                 <button className="btn" style={{ background: tab === 'users' ? '#f1c40f' : '#7f8c8d', color: 'black', padding:'8px 12px', fontSize:'14px' }} onClick={() => setTab('users')}>{t.ad_tab_users || "👥 유저"}</button>
//                 <button className="btn" style={{ background: tab === 'sanction' ? '#c0392b' : '#7f8c8d', color: 'white', padding:'8px 12px', fontSize:'14px' }} onClick={() => setTab('sanction')}>{t.ad_tab_sanction || "🚨 제재"}</button>
//                 <button className="btn" style={{ background: tab === 'history' ? '#f1c40f' : '#7f8c8d', color: 'black', padding:'8px 12px', fontSize:'14px' }} onClick={() => setTab('history')}>{t.ad_tab_history || "📜 내역"}</button>
//                 <button className="btn" style={{ background: tab === 'server' ? '#e74c3c' : '#7f8c8d', color: 'white', padding:'8px 12px', fontSize:'14px' }} onClick={() => setTab('server')}>{t.ad_tab_server || "🚧 서버"}</button>
//                 <button className="btn" style={{ background: tab === 'features' ? '#9b59b6' : '#7f8c8d', color: 'white', padding:'8px 12px', fontSize:'14px' }} onClick={() => setTab('features')}>{t.ad_tab_features || "⚙️ 기능"}</button>
//                 <button className="btn" style={{ background: '#34495e', padding:'8px 12px', fontSize:'14px' }} onClick={() => navigate('/home')}>{t.home}</button>
//             </div>

//             {/* 📢 공지 관리 */}
//             {tab === 'notice' && (
//                 <div className="card" style={{ background: 'white', color: 'black', padding: 20 }}>
//                     <h3>{t.ad_notice_title || "메인 공지 설정"}</h3>
//                     <textarea style={{ width: '100%', height: 150, padding: 10, margin: '10px 0', border: '1px solid #ddd' }} placeholder={t.ad_notice_ph} value={notice} onChange={(e) => setNotice(e.target.value)} />
//                     <div style={{ display: 'flex', gap: 10 }}> <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveNotice}>{t.ad_save}</button> <button className="btn btn-danger" style={{ flex: 1, background: '#e74c3c' }} onClick={handleDeleteNotice}>{t.bd_delete}</button> </div>
//                 </div>
//             )}

//             {/* 🚨 제재 관리 */}
//             {tab === 'sanction' && (
//                 <div>
//                     <div className="card" style={{ background: '#c0392b', padding: 20, marginBottom: 20, color: 'white' }}>
//                         <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
//                             <h3>{t.report_rank}</h3>
//                             <button onClick={resetReportCount} style={{padding:'5px 10px', background:'white', color:'#c0392b', border:'none', borderRadius:5, fontWeight:'bold', cursor:'pointer'}}>{t.reset_report}</button>
//                         </div>
//                         {reportRank.length === 0 ? <p>{t.ad_no_report || "깨끗함"}</p> : (
//                             <ul style={{listStyle:'none', padding:0}}>
//                                 {reportRank.map((u, i) => (
//                                     <li key={u.id} style={{padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.3)'}}>
//                                         {i+1}. <strong>{u.name}</strong> ({t.ad_report_cnt}: {u.reportCount || 0})
//                                     </li>
//                                 ))}
//                             </ul>
//                         )}
//                     </div>

//                     <div className="card" style={{background:'#34495e', padding:20}}>
//                         <div style={{display:'flex', gap:5, marginBottom:10}}>
//                             <input className="input" placeholder={t.ad_search_user || "유저 검색"} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdminSearchUser()} style={{flex:1, margin:0}} />
//                             <button className="btn" style={{background:'#f1c40f', color:'black', width:60}} onClick={handleAdminSearchUser}>🔍</button>
//                         </div>
                        
//                         {users.map(u => {
//                             const isGachaBanned = u.gachaBanDate?.toDate() > new Date();
//                             const isBoardBanned = u.boardBanDate?.toDate() > new Date();
//                             return (
//                                 <div key={u.uid} style={{background:'#222', padding:10, marginBottom:8, borderRadius:5}}>
//                                     <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5}}>
//                                         <div>
//                                             <span style={{color:'#f1c40f', fontWeight:'bold'}}>{u.name}</span> 
//                                             <span style={{fontSize:12, color:'#aaa', marginLeft:5}}>({u.tierName || "Unranked"})</span>
//                                             {isGachaBanned && <span style={{color:'#e74c3c', fontSize:11, marginLeft:5, fontWeight:'bold'}}>🚫 Gacha</span>}
//                                             {isBoardBanned && <span style={{color:'#e74c3c', fontSize:11, marginLeft:5, fontWeight:'bold'}}>🔇 Muted</span>}
//                                         </div>
//                                     </div>
//                                     <div style={{display:'flex', flexDirection:'column', gap:8, borderTop:'1px solid #444', paddingTop:8}}>
//                                         {(isGachaBanned || isBoardBanned) && (
//                                             <button onClick={() => applySanction(u, 'lift', 0)} style={{width:'100%', padding:8, background:'#2ecc71', border:'none', color:'white', borderRadius:3, cursor:'pointer', fontWeight:'bold'}}>
//                                                 🔓 모든 제재 해제 (Unban All)
//                                             </button>
//                                         )}
//                                         <div style={{display:'flex', gap:5, alignItems:'center'}}>
//                                             <span style={{fontSize:12, width:70}}>🎰 {t.ban_gacha}:</span>
//                                             <select style={{flex:1, padding:5, background:'#333', color:'white', border:'1px solid #555', borderRadius:3}} value={banDuration} onChange={(e) => setBanDuration(Number(e.target.value))}>
//                                                 <option value={1}>1h</option><option value={3}>3h</option><option value={24}>1d</option><option value={72}>3d</option>
//                                             </select>
//                                             <button onClick={() => applySanction(u, 'gachaBan', banDuration)} style={{width:50, padding:5, background:'#e74c3c', border:'none', color:'white', borderRadius:3, cursor:'pointer'}}>🚫</button>
//                                         </div>
//                                         <div style={{display:'flex', gap:5, alignItems:'center'}}>
//                                             <span style={{fontSize:12, width:70}}>📝 Post Ban:</span>
//                                             <select style={{flex:1, padding:5, background:'#333', color:'white', border:'1px solid #555', borderRadius:3}} value={boardBanDuration} onChange={(e) => setBoardBanDuration(Number(e.target.value))}>
//                                                 <option value={1}>1h</option><option value={3}>3h</option><option value={24}>1d</option><option value={72}>3d</option>
//                                             </select>
//                                             <button onClick={() => applySanction(u, 'boardBan', boardBanDuration)} style={{width:50, padding:5, background:'#e67e22', border:'none', color:'white', borderRadius:3, cursor:'pointer'}}>🔇</button>
//                                         </div>
//                                         <div style={{display:'flex', gap:5, alignItems:'center'}}>
//                                             <span style={{fontSize:12, width:60}}>🏅 {t.ad_tier}:</span>
//                                             <button onClick={() => applySanction(u, 'tier', -1)} style={{flex:1, padding:5, background:'#7f8c8d', border:'none', color:'white', borderRadius:3, cursor:'pointer', fontSize:11}}>📉 강등 (Demote)</button>
//                                             <button onClick={() => applySanction(u, 'tier', 1)} style={{flex:1, padding:5, background:'#f1c40f', border:'none', color:'black', borderRadius:3, cursor:'pointer', fontSize:11, fontWeight:'bold'}}>📈 승격 (Promote)</button>
//                                         </div>
//                                         <div style={{display:'flex', gap:5, alignItems:'center'}}>
//                                             <span style={{fontSize:12, width:60}}>💸 {t.confiscate}:</span>
//                                             <button onClick={() => applySanction(u, 'confiscate', 0)} style={{flex:1, padding:5, background:'#c0392b', border:'none', color:'white', borderRadius:3, cursor:'pointer', fontSize:11}}>💰 Confiscate</button>
//                                         </div>
//                                     </div>
//                                 </div>
//                             );
//                         })}
//                     </div>
//                 </div>
//             )}

//             {/* 👥 유저 관리 */}
//             {tab === 'users' && (
//                 <div>
//                     <div className="card" style={{ background: 'linear-gradient(135deg, #2ecc71, #27ae60)', padding: '20px', marginBottom: '20px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
//                         <h2 style={{ margin: '0 0 10px 0', fontSize: '20px', color: 'white' }}>💰 {t.ad_total_asset}</h2>
//                         <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#f1c40f' }}> {totalMoney.toLocaleString()} </p>
//                         <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#ecf0f1' }}> {t.ad_user_cnt}: {users.length} </p>
//                     </div>

//                     <div style={{display:'flex', gap:5, marginBottom:10}}>
//                         <input className="input" placeholder={t.ad_search_user || "유저 검색"} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdminSearchUser()} style={{flex:1, margin:0}} />
//                         <button className="btn" style={{background:'#f1c40f', color:'black', width:60}} onClick={handleAdminSearchUser}>🔍</button>
//                     </div>

//                     {users.map(u => (
//                         <div key={u.uid} className="card" style={{ padding: 15, marginBottom: 10, background: u.isBanned ? '#c0392b' : (u.isApproved === false ? '#444' : '#34495e'), border: u.isApproved === false ? '2px solid #f1c40f' : 'none', borderRadius:'8px' }}>
//                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap:'wrap', gap:'10px' }}>
//                                 <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap:'wrap' }}> 
//                                     {u.isApproved === false && <span style={{background:'#f1c40f', color:'black', fontWeight:'bold', padding:'2px 6px', borderRadius:4, fontSize:'11px'}}>⏳ Wait</span>}
//                                     <span style={{ fontSize: 11, background: '#222', color: '#aaa', padding: '2px 6px', borderRadius: 4, border:'1px solid #555' }}>{u.tierName || "Unranked"}</span>
//                                     <span style={{ fontSize: 16, fontWeight: 'bold', color: 'white' }}>
//                                         {u.userTitle && <span style={{color: u.userTitleColor || '#e74c3c', marginRight: 5}}>[{u.userTitle}]</span>}
//                                         {u.name || "Unknown"}
//                                     </span> 
//                                     <span style={{ fontSize: 11, color: '#ccc' }}>({u.email})</span> 
//                                     {u.isBanned && <span style={{ background: 'white', color: 'red', padding: '2px 5px', borderRadius: 4, fontWeight: 'bold', fontSize:'11px' }}>⛔ BAN</span>} 
//                                 </div>
//                                 <div style={{ fontWeight: 'bold', color:'#f1c40f', fontSize:'16px' }}>{Math.floor(u.point || 0).toLocaleString()} P</div>
//                             </div>

//                             <div style={{ display: 'flex', gap: 5, flexWrap:'wrap', justifyContent:'flex-start' }}> 
//                                 <button className="btn" style={{ height: 35, fontSize:'12px', padding: '0 10px', background: u.isApproved === false ? '#2ecc71' : '#7f8c8d' }} onClick={() => toggleApprove(u.uid, u.isApproved)}> {u.isApproved === false ? t.ad_approve : t.cancel} </button>
//                                 <div style={{display:'flex', gap:2}}>
//                                     <input className="input" style={{ width: 80, height: 35, padding: 5, margin:0, fontSize:'12px' }} placeholder="Name" value={inputNames[u.uid] || ''} onChange={(e) => setInputNames({ ...inputNames, [u.uid]: e.target.value })} /> 
//                                     <button className="btn" style={{ height: 35, fontSize:'12px', padding: '0 10px', background: '#2980b9' }} onClick={() => handleUpdateName(u.uid)}>✏️</button> 
//                                 </div>
                                
//                                 <div style={{display:'flex', gap:2, alignItems:'center'}}>
//                                     <input className="input" style={{ width: 60, height: 35, padding: 5, margin:0, fontSize:'12px' }} placeholder="칭호" value={inputTitles[u.uid] || ''} onChange={(e) => setInputTitles({ ...inputTitles, [u.uid]: e.target.value })} /> 
//                                     <input type="color" style={{ width: 30, height: 35, padding: 0, margin:0, border:'none', cursor:'pointer' }} value={inputColors[u.uid] || '#e74c3c'} onChange={(e) => setInputColors({ ...inputColors, [u.uid]: e.target.value })} />
//                                     <button className="btn" style={{ height: 35, fontSize:'12px', padding: '0 10px', background: '#e67e22' }} onClick={() => handleUpdateTitle(u.uid)}>🏷️</button> 
//                                 </div>

//                                 <div style={{display:'flex', gap:2}}>
//                                     <input className="input" type="number" style={{ width: 80, height: 35, padding: 5, margin:0, fontSize:'12px' }} placeholder="±Point" value={inputPoints[u.uid] || ''} onChange={(e) => setInputPoints({ ...inputPoints, [u.uid]: e.target.value })} /> 
//                                     <button className="btn" style={{ height: 35, fontSize:'12px', padding: '0 10px', background: '#27ae60' }} onClick={() => handleUpdatePoint(u.uid, u.point)}>💰</button> 
//                                 </div>
//                                 <button className="btn" style={{ height: 35, fontSize:'12px', padding: '0 10px', background: '#8e44ad' }} onClick={() => fetchUserHistory(u)}>📜</button> 
//                                 {u.email !== 'kks3172@naver.com' && ( <button className="btn" style={{ height: 35, fontSize:'12px', padding: '0 10px', background: '#e74c3c' }} onClick={() => toggleBan(u.uid, u.isBanned)}> {u.isBanned ? 'Unban' : 'BAN'} </button> )} 
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             )}

//             {/* 📜 내역 탭 */}
//             {tab === 'history' && (
//                 <div style={{ background: '#34495e', padding: 20, borderRadius: 10 }}>
//                     <h3>{t.ad_history_title || "최근 거래 내역 (50건)"}</h3>
//                     <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}> 
//                         {processedAllHistory.map(h => {
//                             const writer = users.find(u => u.uid === h.uid);
//                             const writerName = writer ? writer.name : "Unknown";
//                             return (
//                                 <div key={h.id} style={{ background: '#222', padding: 10, borderRadius: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> 
//                                     <div> 
//                                         <div style={{ fontSize: 12, color: '#aaa' }}>{formatDate(h.createdAt)}</div> 
//                                         <div style={{ fontSize: 13, color: '#f1c40f', fontWeight: 'bold', marginBottom: '2px' }}> 👤 {writerName} </div>
//                                         <div style={{ fontSize: 14 }}>{h.displayMsg}</div> 
//                                         {h.isMerged && <div style={{ fontSize: 11, color: '#aaa' }}>({t.h_bet}: {h.betAmount?.toLocaleString()} / {t.h_gain}: +{h.winAmount?.toLocaleString()})</div>}
//                                     </div> 
//                                     <div style={{ fontSize: 16, fontWeight: 'bold', color: h.amount > 0 ? '#2ecc71' : '#e74c3c' }}> {h.amount > 0 ? '+' : ''}{h.amount.toLocaleString()} </div> 
//                                 </div> 
//                             );
//                         })} 
//                     </div>
//                 </div>
//             )}

//             {/* 🚧 서버 관리 */}
//             {tab === 'server' && (
//                 <div className="card" style={{ background: 'white', color: 'black', padding: 30, textAlign: 'center' }}>
//                     <h2 style={{ marginBottom: 20 }}>{t.ad_server_status}: {isServerOpen ? <span style={{color:'#2ecc71'}}>✅ OPEN</span> : <span style={{color:'#e74c3c'}}>🚧 CLOSED</span>}</h2>
//                     <button onClick={toggleServer} style={{ padding: '15px 40px', fontSize: '20px', fontWeight: 'bold', borderRadius: '10px', border: 'none', cursor: 'pointer', marginBottom: '30px', background: isServerOpen ? '#c0392b' : '#2ecc71', color: 'white' }}> {isServerOpen ? t.ad_close_server : t.ad_open_server} </button>
//                     <hr style={{margin: '20px 0'}} />
//                     <button onClick={handleForceRefresh} style={{ padding: '15px 40px', fontSize: '20px', fontWeight: 'bold', borderRadius: '10px', border: 'none', cursor: 'pointer', background: '#3498db', color: 'white' }}> 🔄 {t.ad_refresh_all} </button>
                    
//                     {/* 🔥 [추가] 게시글 칭호 동기화 버튼 */}
//                     <hr style={{margin: '20px 0'}} />
//                     <button onClick={handleSyncPosts} style={{ padding: '15px 40px', fontSize: '16px', fontWeight: 'bold', borderRadius: '10px', border: 'none', cursor: 'pointer', background: '#8e44ad', color: 'white' }} disabled={isSyncing}> 
//                         {isSyncing ? "⏳ 동기화 중..." : "🔄 모든 게시글 칭호/이름 동기화"} 
//                     </button>
//                     <p style={{fontSize:12, color:'#7f8c8d', marginTop:10}}>* 유저들의 최신 칭호와 이름을 과거 게시글 전체에 적용합니다.</p>
//                 </div>
//             )}

//             {/* ⚙️ 기능 관리 */}
//             {tab === 'features' && (
//                 <div className="card" style={{ background: 'white', color: 'black', padding: '20px', textAlign: 'center' }}>
//                     <h2 style={{ marginBottom: 20, color:'#9b59b6', fontSize:'22px' }}>⚙️ {t.ad_feature_control}</h2>
//                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
//                         {featureList.map(f => (
//                             <div key={f.key} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '10px', background:'#f9f9f9' }}>
//                                 <div style={{fontSize:'24px'}}>{f.icon}</div>
//                                 <h4 style={{margin:'10px 0'}}>{f.label}</h4>
//                                 <button onClick={() => toggleFeature(f.key)} style={{ width:'100%', padding: '8px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: features[f.key] ? '#2ecc71' : (f.key === 'gameLock' ? '#2ecc71' : '#95a5a6'), color: 'white' }}> 
//                                     {f.key === 'gameLock' ? (features[f.key] ? "⛔ Locked" : "✅ Normal") : (features[f.key] ? "✅ ON" : "❌ OFF")}
//                                 </button>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             )}

//             {/* 유저 내역 모달 */}
//             {selectedUser && (
//                 <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
//                     <div style={{ background: '#2c3e50', width: '90%', maxWidth: '500px', maxHeight: '80vh', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column' }}>
//                         <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:15}}> <h2 style={{margin:0, color:'#f1c40f'}}>{selectedUser.name} {t.history}</h2> <button className="btn" style={{background:'#e74c3c', padding:'5px 10px'}} onClick={() => setSelectedUser(null)}>{t.close || "X"}</button> </div>
//                         <div style={{ overflowY: 'auto', flex: 1, display:'flex', flexDirection:'column', gap: 10 }}> 
//                             {processedUserHistory.length === 0 ? <p style={{textAlign:'center', color:'#ccc'}}>{t.log_no_data}</p> : processedUserHistory.map(h => ( 
//                                 <div key={h.id} style={{ background: '#222', padding: 10, borderRadius: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> 
//                                     <div> 
//                                         <div style={{ fontSize: 12, color: '#aaa' }}>{formatDate(h.createdAt)}</div> 
//                                         <div style={{ fontSize: 14 }}>{h.displayMsg}</div> 
//                                     </div> 
//                                     <div style={{ fontSize: 16, fontWeight: 'bold', color: h.amount > 0 ? '#2ecc71' : '#e74c3c' }}> {h.amount > 0 ? '+' : ''}{h.amount.toLocaleString()} </div> 
//                                 </div> 
//                             ))} 
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs, updateDoc, doc, getDoc, setDoc, deleteDoc, where, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

const TIER_LIST = [
    "언랭크", "아이언", "브론즈", "실버", "골드", "플래티넘", "에메랄드", "다이아", "마스터", "그랜드마스터", "챌린저"
];

export default function Admin() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [tab, setTab] = useState('notice'); 
    
    const [notice, setNotice] = useState("");
    const [users, setUsers] = useState([]);
    const [totalMoney, setTotalMoney] = useState(0); 
    const [inputPoints, setInputPoints] = useState({});
    const [inputNames, setInputNames] = useState({});
    
    const [inputTitles, setInputTitles] = useState({});
    const [inputColors, setInputColors] = useState({});

    const [history, setHistory] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userHistory, setUserHistory] = useState([]);
    const [isServerOpen, setIsServerOpen] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [features, setFeatures] = useState({ 
        transfer: true, shop: true, autoApproval: true, boardWrite: true, gameLock: false 
    });
    const [reportRank, setReportRank] = useState([]);
    const [banDuration, setBanDuration] = useState(1);
    const [boardBanDuration, setBoardBanDuration] = useState(1);

    // 🔥 [추가] 동기화, 소원함, 장부검사 관련 상태
    const [isSyncing, setIsSyncing] = useState(false);
    const [wishes, setWishes] = useState([]); 
    const [auditResult, setAuditResult] = useState(null); 
    const [isAuditing, setIsAuditing] = useState(false); 

    useEffect(() => {
        if (tab === 'notice') fetchNotice();
        if (tab === 'users') fetchUsers(); 
        if (tab === 'server') fetchServerStatus();
        if (tab === 'features') fetchFeatures();
        if (tab === 'sanction') { fetchUsers(); fetchReportRank(); } 
        if (tab === 'history') { fetchHistory(); fetchUsers(); }
        if (tab === 'wishbox') fetchWishes();
    }, [tab]);

    // --- 기존 기능들 ---
    const fetchServerStatus = async () => { try { const docSnap = await getDoc(doc(db, "system", "server")); if (docSnap.exists()) { setIsServerOpen(docSnap.data().isOpen); } else { await setDoc(doc(db, "system", "server"), { isOpen: true }); setIsServerOpen(true); } } catch (e) { console.error(e); } };
    const toggleServer = async () => { const newState = !isServerOpen; if (!window.confirm(newState ? t.ad_open_confirm : t.ad_close_confirm)) return; try { await updateDoc(doc(db, "system", "server"), { isOpen: newState }); setIsServerOpen(newState); alert(newState ? "✅ OPEN" : "🚧 CLOSED"); } catch (e) { alert("Error: " + e.message); } };
    const handleForceRefresh = async () => { if (!window.confirm(t.ad_refresh_confirm)) return; try { await setDoc(doc(db, "system", "info"), { version: Date.now() }, { merge: true }); alert("✅ OK"); } catch (e) { alert("Error"); } };
    
    const fetchWishes = async () => {
        try {
            const q = query(collection(db, "messages"), orderBy("createdAt", "desc"), limit(50));
            const snap = await getDocs(q);
            const allMsgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const wishMsgs = allMsgs.filter(m => m.content && m.content.includes("소원권"));
            setWishes(wishMsgs);
        } catch (e) { console.error(e); }
    };

    const handleDeleteWish = async (id) => {
        if(!window.confirm("삭제하시겠습니까?")) return;
        try {
            await deleteDoc(doc(db, "messages", id));
            setWishes(prev => prev.filter(w => w.id !== id));
        } catch(e) { alert("Error"); }
    };

    const handleSyncPosts = async () => {
        if (!window.confirm("모든 게시글의 작성자 정보를 현재 유저 정보(칭호, 이름)로 덮어씌웁니다.\n시간이 조금 걸릴 수 있습니다. 진행할까요?")) return;
        setIsSyncing(true);
        try {
            const usersSnap = await getDocs(collection(db, "users"));
            const userMap = {};
            usersSnap.forEach(doc => { userMap[doc.id] = doc.data(); });

            const postsSnap = await getDocs(collection(db, "posts"));
            const batch = writeBatch(db);
            let updateCount = 0;

            postsSnap.forEach((postDoc) => {
                const post = postDoc.data();
                if (userMap[post.uid]) {
                    const userData = userMap[post.uid];
                    if (post.authorTitle !== (userData.userTitle || "") || 
                        post.authorTitleColor !== (userData.userTitleColor || "") ||
                        post.authorName !== userData.name) {
                        
                        const postRef = doc(db, "posts", postDoc.id);
                        batch.update(postRef, {
                            authorName: userData.name,
                            authorTitle: userData.userTitle || "",
                            authorTitleColor: userData.userTitleColor || ""
                        });
                        updateCount++;
                    }
                }
            });

            if (updateCount > 0) {
                await batch.commit();
                alert(`✅ 총 ${updateCount}개의 게시글 정보를 최신화했습니다!`);
            } else {
                alert("✨ 이미 모든 게시글이 최신 상태입니다.");
            }
        } catch (e) { alert("Error: " + e.message); } 
        finally { setIsSyncing(false); }
    };

    // 🔥 [추가] 1. 전 유저 장부 기준점 재설정 (지금부터 감시 시작)
    const handleResetAuditBase = async () => {
        if (!window.confirm("🚨 주의: 현재 모든 유저의 포인트를 '정상'으로 간주하고 기준점을 새로 잡습니다.\n\n이 작업 이후에는 '지금 이 순간'부터 발생한 내역만으로 장부 검사를 수행합니다.\n진행하시겠습니까?")) return;
        
        setIsSyncing(true);
        try {
            const usersSnap = await getDocs(collection(db, "users"));
            const batch = writeBatch(db);
            let count = 0;
            const now = new Date(); // 현재 시간

            usersSnap.forEach((userDoc) => {
                const userData = userDoc.data();
                const currentPoint = userData.point || 0;
                
                // 유저 문서에 '기준점(auditBasePoint)'과 '기준시간(auditBaseTime)'을 박제함
                batch.update(userDoc.ref, {
                    auditBasePoint: currentPoint,
                    auditBaseTime: now 
                });
                count++;
            });

            await batch.commit();
            alert(`✅ 총 ${count}명 유저의 장부 기준점을 '현재'로 재설정했습니다.\n이제부터 발생하는 조작만 감지합니다.`);
            fetchUsers(); 
        } catch (e) {
            console.error(e);
            alert("오류 발생: " + e.message);
        } finally {
            setIsSyncing(false);
        }
    };

    // 🔥 [수정] 2. 장부 검사 로직 (기준점 기반)
    const checkUserIntegrity = async (user) => {
        if (isAuditing) return;
        if (!window.confirm(`${user.name}님의 장부를 검사하시겠습니까?`)) return;
        
        setIsAuditing(true);
        setAuditResult(null);
        try {
            // 1. 유저의 기준점 확인
            const basePoint = user.auditBasePoint !== undefined ? user.auditBasePoint : 30000; // 기준점 없으면 초기지원금(3만)
            let baseTime = null;

            if (user.auditBaseTime) {
                // Firestore Timestamp를 JS Date로 변환
                baseTime = user.auditBaseTime.toDate ? user.auditBaseTime.toDate() : new Date(user.auditBaseTime);
            }

            // 2. 히스토리 가져오기 (기준 시간 이후의 것만)
            let q = query(collection(db, "history"), where("uid", "==", user.uid));
            
            // 기준 시간이 있으면 그 이후 내역만 가져오도록 필터링 (쿼리 최적화)
            if (baseTime) {
                q = query(collection(db, "history"), where("uid", "==", user.uid), where("createdAt", ">", baseTime));
            }

            const snap = await getDocs(q);
            
            let calculatedPoint = basePoint; // 기준점부터 시작
            let logsCount = 0;

            snap.forEach(doc => {
                const data = doc.data();
                if (data.amount) calculatedPoint += data.amount; // 더하기/빼기
                logsCount++;
            });

            // 오차 계산
            const currentDBPoint = user.point || 0;
            const diff = currentDBPoint - calculatedPoint;

            setAuditResult({
                userName: user.name,
                currentDBPoint,
                calculatedPoint,
                diff,
                logsCount,
                baseInfo: baseTime ? `기준일: ${baseTime.toLocaleString()} (${basePoint.toLocaleString()}P)` : "기준일: 가입 초기 (30,000P)",
                // 오차가 10,000원 이상이면 의심
                isSuspicious: Math.abs(diff) > 10000 
            });
        } catch (e) { 
            console.error(e);
            alert("검사 실패 (인덱스 필요할 수 있음): " + e.message); 
        } 
        finally { setIsAuditing(false); }
    };

    const fetchNotice = async () => { try { const docSnap = await getDoc(doc(db, "system", "notice")); if (docSnap.exists()) setNotice(docSnap.data().text || ""); } catch (e) { console.error(e); } };
    const handleSaveNotice = async () => { if (!notice.trim()) return alert(t.alertInputAll); try { await setDoc(doc(db, "system", "notice"), { text: notice, updatedAt: new Date().toLocaleString() }); alert(t.alertComplete); } catch (e) { alert(e.message); } };
    const handleDeleteNotice = async () => { if (!window.confirm(t.bd_delete_confirm)) return; try { await deleteDoc(doc(db, "system", "notice")); setNotice(""); alert(t.alertComplete); } catch (e) { alert(e.message); } };
    
    const fetchUsers = async () => {
        const usersRef = collection(db, "users");
        try {
            const snap = await getDocs(usersRef);
            let sumMoney = 0; 
            const list = snap.docs.map(d => {
                const data = d.data();
                sumMoney += data.point || 0; 
                return { uid: d.id, ...data };
            });
            list.sort((a, b) => {
                if (a.isApproved !== b.isApproved) return a.isApproved ? 1 : -1; 
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA;
            });
            setTotalMoney(sumMoney); 
            setUsers(list);
        } catch (e) { console.error(e); alert("유저 목록 로딩 실패"); }
    };

    const handleAdminSearchUser = async () => {
        if (!searchTerm.trim()) { fetchUsers(); return; }
        try {
            const q = query(
                collection(db, "users"), 
                where("name", ">=", searchTerm), 
                where("name", "<=", searchTerm + "\uf8ff"),
                limit(20) 
            );
            const querySnapshot = await getDocs(q);
            const searchList = [];
            querySnapshot.forEach((doc) => { searchList.push({ uid: doc.id, ...doc.data() }); });
            if (searchList.length === 0) alert("검색 결과가 없습니다.");
            else setUsers(searchList);
        } catch (e) { console.error(e); alert("검색 실패"); }
    };

    const toggleApprove = async (uid, currentStatus) => {
        if (!window.confirm(currentStatus ? t.ad_cancel_approve : t.ad_approve)) return;
        try { await updateDoc(doc(db, "users", uid), { isApproved: !currentStatus }); alert("OK"); fetchUsers(); } catch (e) { alert("Error"); }
    };
    const handleUpdatePoint = async (uid, currentPoint) => { 
        const amount = parseInt(inputPoints[uid]); 
        if (isNaN(amount)) return alert(t.ad_input_num); 
        if (!window.confirm(t.ad_point_confirm)) return; 
        try { 
            await updateDoc(doc(db, "users", uid), { point: (currentPoint || 0) + amount }); 
            await addDoc(collection(db, "history"), {
                uid, type: "관리자", msg: `Admin ${amount > 0 ? "Give" : "Take"}`, amount, createdAt: serverTimestamp()
            });
            alert("OK"); fetchUsers(); setInputPoints({...inputPoints, [uid]:''}); 
        } catch(e) { alert("Error"); } 
    };
    const handleUpdateName = async (uid) => { const newName = inputNames[uid]; if(!newName) return; try { await updateDoc(doc(db, "users", uid), { name: newName }); alert("OK"); fetchUsers(); setInputNames({...inputNames, [uid]:''}); } catch(e) { alert("Error"); } };
    
    const handleUpdateTitle = async (uid) => {
        const newTitle = inputTitles[uid];
        const newColor = inputColors[uid] || '#e74c3c'; 
        try {
            await updateDoc(doc(db, "users", uid), { userTitle: newTitle ? newTitle : "", userTitleColor: newTitle ? newColor : "" });
            alert("칭호 설정 완료!");
            fetchUsers();
            setInputTitles({ ...inputTitles, [uid]: '' });
        } catch (e) { alert("Error: " + e.message); }
    };

    const toggleBan = async (uid, isBanned) => { if (!window.confirm(t.ad_ban_confirm)) return; try { await updateDoc(doc(db, "users", uid), { isBanned: !isBanned }); alert("OK"); fetchUsers(); } catch (e) { alert("Error"); } };
    
    const fetchUserHistory = async (user) => { setSelectedUser(user); setUserHistory([]); try { const q = query(collection(db, "history"), where("uid", "==", user.uid), orderBy("createdAt", "desc"), limit(50)); const snap = await getDocs(q); setUserHistory(snap.docs.map(d => ({ id: d.id, ...d.data() }))); } catch (e) { console.error(e); alert("Index required"); } };
    const fetchHistory = async () => { const q = query(collection(db, "history"), orderBy("createdAt", "desc"), limit(50)); const snap = await getDocs(q); setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() }))); };
    const formatDate = (ts) => { if(!ts) return '-'; const date = ts.toDate(); return `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}`; };

    const processLogs = (logs) => {
        const result = [];
        for (let i = 0; i < logs.length; i++) {
            const current = logs[i];
            const prevResult = result.length > 0 ? result[result.length - 1] : null;
            const isGameStart = current.type === '게임' && current.msg.includes('시작');
            if (isGameStart && prevResult && prevResult.type === '게임' && prevResult.msg.includes('보상')) {
                const currName = current.msg.replace(/[^가-힣a-zA-Z0-9\s]/g, "").replace("시작", "").trim();
                const prevName = prevResult.msg.replace(/[^가-힣a-zA-Z0-9\s]/g, "").replace("보상", "").trim();
                if (currName === prevName) {
                    prevResult.isMerged = true; 
                    prevResult.betAmount = current.amount; 
                    prevResult.winAmount = prevResult.amount; 
                    prevResult.amount = prevResult.amount + current.amount; 
                    prevResult.displayMsg = `${currName} ${t.h_result || "Result"}`; 
                    continue; 
                }
            }
            result.push({ ...current, displayMsg: current.msg, isMerged: false });
        }
        return result;
    };

    const processedUserHistory = useMemo(() => processLogs(userHistory), [userHistory]);
    const processedAllHistory = useMemo(() => processLogs(history), [history]);

    const fetchFeatures = async () => { try { const docSnap = await getDoc(doc(db, "system", "features")); if (docSnap.exists()) { setFeatures(docSnap.data()); } } catch (e) {} };
    const toggleFeature = async (key) => { const newValue = !features[key]; try { await setDoc(doc(db, "system", "features"), { ...features, [key]: newValue }, { merge: true }); setFeatures({ ...features, [key]: newValue }); } catch (e) { alert("Fail"); } };

    const featureList = [
        { key: 'autoApproval', icon: '📝', label: t.waitingApproval || "가입 승인" }, 
        { key: 'transfer', icon: '💸', label: t.h_transfer || "송금" },
        { key: 'shop', icon: '😈', label: t.shop || "상점" },
        { key: 'boardWrite', icon: '🖊️', label: t.bd_write_btn || "게시판" },
        { key: 'gameLock', icon: '🎮', label: t.gameZone || "게임 이용" }
    ];

    const fetchReportRank = async () => {
        const q = query(collection(db, "users"), orderBy("reportCount", "desc"), limit(3));
        const snap = await getDocs(q);
        setReportRank(snap.docs.map(d => ({id: d.id, ...d.data()})));
    };

    const resetReportCount = async () => {
        if(!window.confirm(t.reset_report_confirm)) return;
        const q = query(collection(db, "users"), where("reportCount", ">", 0));
        const snap = await getDocs(q);
        snap.forEach(async (d) => {
            await updateDoc(doc(db, "users", d.id), { reportCount: 0 });
        });
        alert(t.alertComplete);
        fetchReportRank();
    };

    const applySanction = async (user, type, value) => {
        const confirmMsg = `${user.name} - ${type === 'lift' ? t.ad_lift_ban : type} : ${t.ad_confirm}?`;
        if(!window.confirm(confirmMsg)) return;

        try {
            const userRef = doc(db, "users", user.uid);
            let updateData = {};
            let logMsg = "";
            let notiMsg = "";

            if (type === "gachaBan") {
                const endDate = new Date();
                endDate.setHours(endDate.getHours() + value);
                updateData = { gachaBanDate: endDate };
                logMsg = `Gacha Ban (${value}h)`;
                notiMsg = `${t.ban_gacha} (${value}h)`;
            } 
            else if (type === "boardBan") {
                const endDate = new Date();
                endDate.setHours(endDate.getHours() + value);
                updateData = { boardBanDate: endDate };
                logMsg = `Board Ban (${value}h)`;
                notiMsg = `게시판 이용 제한 (${value}시간)`;
            }
            else if (type === "lift") {
                updateData = { gachaBanDate: null, boardBanDate: null };
                logMsg = "All Ban Lifted";
                notiMsg = t.ad_lift_ban;
            } else if (type === "tier") {
                let currentLevel = user.tierLevel !== undefined ? user.tierLevel : 0;
                let nextLevel = currentLevel + value;
                if (nextLevel < 0) nextLevel = 0;
                if (nextLevel >= TIER_LIST.length) nextLevel = TIER_LIST.length - 1;
                const nextTierName = TIER_LIST[nextLevel];
                updateData = { tierName: nextTierName, tierLevel: nextLevel };
                logMsg = `Tier ${value > 0 ? "Up" : "Down"} (${TIER_LIST[currentLevel]} -> ${nextTierName})`;
                notiMsg = `${t.ad_tier_change}: ${nextTierName}`;
            } else if (type === "confiscate") {
                const amountStr = prompt(`${t.ad_confiscate_amount} (Current: ${Math.floor(user.point).toLocaleString()})`, "0");
                if (!amountStr) return;
                const amount = parseInt(amountStr);
                if (isNaN(amount) || amount <= 0) return alert(t.ad_input_num);
                const finalPoint = Math.max(0, (user.point || 0) - amount);
                updateData = { point: finalPoint };
                logMsg = `Confiscate ${amount}`;
                notiMsg = `${t.confiscate}: -${amount.toLocaleString()}`;
            }

            await updateDoc(userRef, updateData);
            try {
                const historyRef = doc(collection(db, "history"));
                await setDoc(historyRef, { uid: user.uid, type: "관리자", msg: `👮 ${logMsg}`, amount: 0, createdAt: serverTimestamp() });
                const notiRef = doc(collection(db, "notifications"));
                await setDoc(notiRef, { receiverUid: user.uid, type: "admin", msg: `👮 [System] ${notiMsg}`, isRead: false, createdAt: serverTimestamp() });
            } catch (err) { console.error("Log/Noti Error:", err); }

            alert(t.alertComplete);
            fetchUsers(); 
        } catch(e) { console.error(e); alert(t.alertError); }
    };

    return (
        <div className="container" style={{ paddingTop: 30, background: '#2c3e50', minHeight: '100vh', color: 'white', padding: 20 }}>
            <h1 style={{ color: '#e74c3c', textAlign: 'center', marginBottom: 20, fontSize:'24px' }}>{t.ad_title || "👮 Admin Page"}</h1>
            
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
                <button className="btn" style={{ background: tab === 'notice' ? '#f1c40f' : '#7f8c8d', color: 'black', padding:'8px 12px', fontSize:'14px' }} onClick={() => setTab('notice')}>{t.ad_tab_notice || "📢 공지"}</button>
                <button className="btn" style={{ background: tab === 'users' ? '#f1c40f' : '#7f8c8d', color: 'black', padding:'8px 12px', fontSize:'14px' }} onClick={() => setTab('users')}>{t.ad_tab_users || "👥 유저"}</button>
                <button className="btn" style={{ background: tab === 'wishbox' ? '#6a11cb' : '#7f8c8d', color: 'white', padding:'8px 12px', fontSize:'14px' }} onClick={() => setTab('wishbox')}>🧞‍♂️ 소원함</button>
                <button className="btn" style={{ background: tab === 'sanction' ? '#c0392b' : '#7f8c8d', color: 'white', padding:'8px 12px', fontSize:'14px' }} onClick={() => setTab('sanction')}>{t.ad_tab_sanction || "🚨 제재"}</button>
                <button className="btn" style={{ background: tab === 'history' ? '#f1c40f' : '#7f8c8d', color: 'black', padding:'8px 12px', fontSize:'14px' }} onClick={() => setTab('history')}>{t.ad_tab_history || "📜 내역"}</button>
                <button className="btn" style={{ background: tab === 'server' ? '#e74c3c' : '#7f8c8d', color: 'white', padding:'8px 12px', fontSize:'14px' }} onClick={() => setTab('server')}>{t.ad_tab_server || "🚧 서버"}</button>
                <button className="btn" style={{ background: tab === 'features' ? '#9b59b6' : '#7f8c8d', color: 'white', padding:'8px 12px', fontSize:'14px' }} onClick={() => setTab('features')}>{t.ad_tab_features || "⚙️ 기능"}</button>
                <button className="btn" style={{ background: '#34495e', padding:'8px 12px', fontSize:'14px' }} onClick={() => navigate('/home')}>{t.home}</button>
            </div>

            {/* 📢 공지 관리 */}
            {tab === 'notice' && (
                <div className="card" style={{ background: 'white', color: 'black', padding: 20 }}>
                    <h3>{t.ad_notice_title || "메인 공지 설정"}</h3>
                    <textarea style={{ width: '100%', height: 150, padding: 10, margin: '10px 0', border: '1px solid #ddd' }} placeholder={t.ad_notice_ph} value={notice} onChange={(e) => setNotice(e.target.value)} />
                    <div style={{ display: 'flex', gap: 10 }}> <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveNotice}>{t.ad_save}</button> <button className="btn btn-danger" style={{ flex: 1, background: '#e74c3c' }} onClick={handleDeleteNotice}>{t.bd_delete}</button> </div>
                </div>
            )}

            {/* 🧞‍♂️ 소원함 (New Tab) */}
            {tab === 'wishbox' && (
                <div className="card" style={{ background: '#34495e', padding: 20 }}>
                    <h3>🧞‍♂️ 도착한 소원들 (최근 50개)</h3>
                    {wishes.length === 0 ? <p style={{color:'#ccc'}}>도착한 소원이 없습니다.</p> : (
                        <div style={{display:'flex', flexDirection:'column', gap:10}}>
                            {wishes.map(w => (
                                <div key={w.id} style={{background:'#222', padding:15, borderRadius:8, border:'1px solid #6a11cb'}}>
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5}}>
                                        <span style={{color:'#f1c40f', fontWeight:'bold'}}>✨ {w.senderName}</span>
                                        <span style={{fontSize:12, color:'#aaa'}}>{formatDate(w.createdAt)}</span>
                                    </div>
                                    <div style={{whiteSpace:'pre-wrap', color:'white', marginBottom:10}}>{w.content}</div>
                                    <button onClick={() => handleDeleteWish(w.id)} style={{background:'#e74c3c', border:'none', color:'white', padding:'5px 10px', borderRadius:4, cursor:'pointer', fontSize:12}}>삭제</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 🚨 제재 관리 */}
            {tab === 'sanction' && (
                <div>
                    <div className="card" style={{ background: '#c0392b', padding: 20, marginBottom: 20, color: 'white' }}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <h3>{t.report_rank}</h3>
                            <button onClick={resetReportCount} style={{padding:'5px 10px', background:'white', color:'#c0392b', border:'none', borderRadius:5, fontWeight:'bold', cursor:'pointer'}}>{t.reset_report}</button>
                        </div>
                        {reportRank.length === 0 ? <p>{t.ad_no_report || "깨끗함"}</p> : (
                            <ul style={{listStyle:'none', padding:0}}>
                                {reportRank.map((u, i) => (
                                    <li key={u.id} style={{padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.3)'}}>
                                        {i+1}. <strong>{u.name}</strong> ({t.ad_report_cnt}: {u.reportCount || 0})
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="card" style={{background:'#34495e', padding:20}}>
                        <div style={{display:'flex', gap:5, marginBottom:10}}>
                            <input className="input" placeholder={t.ad_search_user || "유저 검색"} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdminSearchUser()} style={{flex:1, margin:0}} />
                            <button className="btn" style={{background:'#f1c40f', color:'black', width:60}} onClick={handleAdminSearchUser}>🔍</button>
                        </div>
                        
                        {users.map(u => {
                            const isGachaBanned = u.gachaBanDate?.toDate() > new Date();
                            const isBoardBanned = u.boardBanDate?.toDate() > new Date();
                            return (
                                <div key={u.uid} style={{background:'#222', padding:10, marginBottom:8, borderRadius:5}}>
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5}}>
                                        <div>
                                            <span style={{color:'#f1c40f', fontWeight:'bold'}}>{u.name}</span> 
                                            <span style={{fontSize:12, color:'#aaa', marginLeft:5}}>({u.tierName || "Unranked"})</span>
                                            {isGachaBanned && <span style={{color:'#e74c3c', fontSize:11, marginLeft:5, fontWeight:'bold'}}>🚫 Gacha</span>}
                                            {isBoardBanned && <span style={{color:'#e74c3c', fontSize:11, marginLeft:5, fontWeight:'bold'}}>🔇 Muted</span>}
                                        </div>
                                    </div>
                                    <div style={{display:'flex', flexDirection:'column', gap:8, borderTop:'1px solid #444', paddingTop:8}}>
                                        {(isGachaBanned || isBoardBanned) && (
                                            <button onClick={() => applySanction(u, 'lift', 0)} style={{width:'100%', padding:8, background:'#2ecc71', border:'none', color:'white', borderRadius:3, cursor:'pointer', fontWeight:'bold'}}>
                                                🔓 모든 제재 해제 (Unban All)
                                            </button>
                                        )}
                                        <div style={{display:'flex', gap:5, alignItems:'center'}}>
                                            <span style={{fontSize:12, width:70}}>🎰 {t.ban_gacha}:</span>
                                            <select style={{flex:1, padding:5, background:'#333', color:'white', border:'1px solid #555', borderRadius:3}} value={banDuration} onChange={(e) => setBanDuration(Number(e.target.value))}>
                                                <option value={1}>1h</option><option value={3}>3h</option><option value={24}>1d</option><option value={72}>3d</option>
                                            </select>
                                            <button onClick={() => applySanction(u, 'gachaBan', banDuration)} style={{width:50, padding:5, background:'#e74c3c', border:'none', color:'white', borderRadius:3, cursor:'pointer'}}>🚫</button>
                                        </div>
                                        <div style={{display:'flex', gap:5, alignItems:'center'}}>
                                            <span style={{fontSize:12, width:70}}>📝 Post Ban:</span>
                                            <select style={{flex:1, padding:5, background:'#333', color:'white', border:'1px solid #555', borderRadius:3}} value={boardBanDuration} onChange={(e) => setBoardBanDuration(Number(e.target.value))}>
                                                <option value={1}>1h</option><option value={3}>3h</option><option value={24}>1d</option><option value={72}>3d</option>
                                            </select>
                                            <button onClick={() => applySanction(u, 'boardBan', boardBanDuration)} style={{width:50, padding:5, background:'#e67e22', border:'none', color:'white', borderRadius:3, cursor:'pointer'}}>🔇</button>
                                        </div>
                                        <div style={{display:'flex', gap:5, alignItems:'center'}}>
                                            <span style={{fontSize:12, width:60}}>🏅 {t.ad_tier}:</span>
                                            <button onClick={() => applySanction(u, 'tier', -1)} style={{flex:1, padding:5, background:'#7f8c8d', border:'none', color:'white', borderRadius:3, cursor:'pointer', fontSize:11}}>📉 강등 (Demote)</button>
                                            <button onClick={() => applySanction(u, 'tier', 1)} style={{flex:1, padding:5, background:'#f1c40f', border:'none', color:'black', borderRadius:3, cursor:'pointer', fontSize:11, fontWeight:'bold'}}>📈 승격 (Promote)</button>
                                        </div>
                                        <div style={{display:'flex', gap:5, alignItems:'center'}}>
                                            <span style={{fontSize:12, width:60}}>💸 {t.confiscate}:</span>
                                            <button onClick={() => applySanction(u, 'confiscate', 0)} style={{flex:1, padding:5, background:'#c0392b', border:'none', color:'white', borderRadius:3, cursor:'pointer', fontSize:11}}>💰 Confiscate</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 👥 유저 관리 */}
            {tab === 'users' && (
                <div>
                    <div className="card" style={{ background: 'linear-gradient(135deg, #2ecc71, #27ae60)', padding: '20px', marginBottom: '20px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                        <h2 style={{ margin: '0 0 10px 0', fontSize: '20px', color: 'white' }}>💰 {t.ad_total_asset}</h2>
                        <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#f1c40f' }}> {totalMoney.toLocaleString()} </p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#ecf0f1' }}> {t.ad_user_cnt}: {users.length} </p>
                    </div>

                    <div style={{display:'flex', gap:5, marginBottom:10}}>
                        <input className="input" placeholder={t.ad_search_user || "유저 검색"} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdminSearchUser()} style={{flex:1, margin:0}} />
                        <button className="btn" style={{background:'#f1c40f', color:'black', width:60}} onClick={handleAdminSearchUser}>🔍</button>
                    </div>

                    {users.map(u => (
                        <div key={u.uid} className="card" style={{ padding: 15, marginBottom: 10, background: u.isBanned ? '#c0392b' : (u.isApproved === false ? '#444' : '#34495e'), border: u.isApproved === false ? '2px solid #f1c40f' : 'none', borderRadius:'8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap:'wrap', gap:'10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap:'wrap' }}> 
                                    {u.isApproved === false && <span style={{background:'#f1c40f', color:'black', fontWeight:'bold', padding:'2px 6px', borderRadius:4, fontSize:'11px'}}>⏳ Wait</span>}
                                    <span style={{ fontSize: 11, background: '#222', color: '#aaa', padding: '2px 6px', borderRadius: 4, border:'1px solid #555' }}>{u.tierName || "Unranked"}</span>
                                    <span style={{ fontSize: 16, fontWeight: 'bold', color: 'white' }}>
                                        {u.userTitle && <span style={{color: u.userTitleColor || '#e74c3c', marginRight: 5}}>[{u.userTitle}]</span>}
                                        {u.name || "Unknown"}
                                    </span> 
                                    <span style={{ fontSize: 11, color: '#ccc' }}>({u.email})</span> 
                                    {u.isBanned && <span style={{ background: 'white', color: 'red', padding: '2px 5px', borderRadius: 4, fontWeight: 'bold', fontSize:'11px' }}>⛔ BAN</span>} 
                                </div>
                                <div style={{ fontWeight: 'bold', color:'#f1c40f', fontSize:'16px' }}>{Math.floor(u.point || 0).toLocaleString()} P</div>
                            </div>

                            <div style={{ display: 'flex', gap: 5, flexWrap:'wrap', justifyContent:'flex-start' }}> 
                                <button className="btn" style={{ height: 35, fontSize:'12px', padding: '0 10px', background: u.isApproved === false ? '#2ecc71' : '#7f8c8d' }} onClick={() => toggleApprove(u.uid, u.isApproved)}> {u.isApproved === false ? t.ad_approve : t.cancel} </button>
                                <div style={{display:'flex', gap:2}}>
                                    <input className="input" style={{ width: 80, height: 35, padding: 5, margin:0, fontSize:'12px' }} placeholder="Name" value={inputNames[u.uid] || ''} onChange={(e) => setInputNames({ ...inputNames, [u.uid]: e.target.value })} /> 
                                    <button className="btn" style={{ height: 35, fontSize:'12px', padding: '0 10px', background: '#2980b9' }} onClick={() => handleUpdateName(u.uid)}>✏️</button> 
                                </div>
                                
                                <div style={{display:'flex', gap:2, alignItems:'center'}}>
                                    <input className="input" style={{ width: 60, height: 35, padding: 5, margin:0, fontSize:'12px' }} placeholder="칭호" value={inputTitles[u.uid] || ''} onChange={(e) => setInputTitles({ ...inputTitles, [u.uid]: e.target.value })} /> 
                                    <input type="color" style={{ width: 30, height: 35, padding: 0, margin:0, border:'none', cursor:'pointer' }} value={inputColors[u.uid] || '#e74c3c'} onChange={(e) => setInputColors({ ...inputColors, [u.uid]: e.target.value })} />
                                    <button className="btn" style={{ height: 35, fontSize:'12px', padding: '0 10px', background: '#e67e22' }} onClick={() => handleUpdateTitle(u.uid)}>🏷️</button> 
                                </div>

                                <div style={{display:'flex', gap:2}}>
                                    <input className="input" type="number" style={{ width: 80, height: 35, padding: 5, margin:0, fontSize:'12px' }} placeholder="±Point" value={inputPoints[u.uid] || ''} onChange={(e) => setInputPoints({ ...inputPoints, [u.uid]: e.target.value })} /> 
                                    <button className="btn" style={{ height: 35, fontSize:'12px', padding: '0 10px', background: '#27ae60' }} onClick={() => handleUpdatePoint(u.uid, u.point)}>💰</button> 
                                </div>
                                {/* 🔥 [추가] 장부 검사 버튼 */}
                                <button className="btn" style={{ height: 35, fontSize:'12px', padding: '0 10px', background: '#e17055' }} onClick={() => checkUserIntegrity(u)}>🔍 장부</button> 
                                
                                <button className="btn" style={{ height: 35, fontSize:'12px', padding: '0 10px', background: '#8e44ad' }} onClick={() => fetchUserHistory(u)}>📜</button> 
                                {u.email !== 'kks3172@naver.com' && ( <button className="btn" style={{ height: 35, fontSize:'12px', padding: '0 10px', background: '#e74c3c' }} onClick={() => toggleBan(u.uid, u.isBanned)}> {u.isBanned ? 'Unban' : 'BAN'} </button> )} 
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 📜 내역 탭 */}
            {tab === 'history' && (
                <div style={{ background: '#34495e', padding: 20, borderRadius: 10 }}>
                    <h3>{t.ad_history_title || "최근 거래 내역 (50건)"}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}> 
                        {processedAllHistory.map(h => {
                            const writer = users.find(u => u.uid === h.uid);
                            const writerName = writer ? writer.name : "Unknown";
                            return (
                                <div key={h.id} style={{ background: '#222', padding: 10, borderRadius: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> 
                                    <div> 
                                        <div style={{ fontSize: 12, color: '#aaa' }}>{formatDate(h.createdAt)}</div> 
                                        <div style={{ fontSize: 13, color: '#f1c40f', fontWeight: 'bold', marginBottom: '2px' }}> 👤 {writerName} </div>
                                        <div style={{ fontSize: 14 }}>{h.displayMsg}</div> 
                                    </div> 
                                    <div style={{ fontSize: 16, fontWeight: 'bold', color: h.amount > 0 ? '#2ecc71' : '#e74c3c' }}> {h.amount > 0 ? '+' : ''}{h.amount.toLocaleString()} </div> 
                                </div> 
                            );
                        })} 
                    </div>
                </div>
            )}

            {/* 🚧 서버 관리 */}
            {tab === 'server' && (
                <div className="card" style={{ background: 'white', color: 'black', padding: 30, textAlign: 'center' }}>
                    <h2 style={{ marginBottom: 20 }}>{t.ad_server_status}: {isServerOpen ? <span style={{color:'#2ecc71'}}>✅ OPEN</span> : <span style={{color:'#e74c3c'}}>🚧 CLOSED</span>}</h2>
                    <button onClick={toggleServer} style={{ padding: '15px 40px', fontSize: '20px', fontWeight: 'bold', borderRadius: '10px', border: 'none', cursor: 'pointer', marginBottom: '30px', background: isServerOpen ? '#c0392b' : '#2ecc71', color: 'white' }}> {isServerOpen ? t.ad_close_server : t.ad_open_server} </button>
                    <hr style={{margin: '20px 0'}} />
                    <button onClick={handleForceRefresh} style={{ padding: '15px 40px', fontSize: '20px', fontWeight: 'bold', borderRadius: '10px', border: 'none', cursor: 'pointer', background: '#3498db', color: 'white' }}> 🔄 {t.ad_refresh_all} </button>
                    
                    <hr style={{margin: '20px 0'}} />
                    {/* 🔥 [추가] 장부 초기화 버튼 */}
                    <button onClick={handleResetAuditBase} style={{ padding: '15px 40px', fontSize: '16px', fontWeight: 'bold', borderRadius: '10px', border: 'none', cursor: 'pointer', background: '#e67e22', color: 'white', marginBottom: 10 }}> 
                        📉 전 유저 장부 기준점 재설정 (Reset Ledger)
                    </button>
                    <p style={{fontSize:12, color:'#e74c3c', fontWeight:'bold'}}>* 현재 포인트를 '정상'으로 확정하고, 지금부터 발생하는 조작만 감시합니다.</p>

                    <hr style={{margin: '20px 0'}} />
                    <button onClick={handleSyncPosts} style={{ padding: '15px 40px', fontSize: '16px', fontWeight: 'bold', borderRadius: '10px', border: 'none', cursor: 'pointer', background: '#8e44ad', color: 'white' }} disabled={isSyncing}> 
                        {isSyncing ? "⏳ 동기화 중..." : "🔄 모든 게시글 칭호/이름 동기화"} 
                    </button>
                </div>
            )}

            {/* ⚙️ 기능 관리 */}
            {tab === 'features' && (
                <div className="card" style={{ background: 'white', color: 'black', padding: '20px', textAlign: 'center' }}>
                    <h2 style={{ marginBottom: 20, color:'#9b59b6', fontSize:'22px' }}>⚙️ {t.ad_feature_control}</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
                        {featureList.map(f => (
                            <div key={f.key} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '10px', background:'#f9f9f9' }}>
                                <div style={{fontSize:'24px'}}>{f.icon}</div>
                                <h4 style={{margin:'10px 0'}}>{f.label}</h4>
                                <button onClick={() => toggleFeature(f.key)} style={{ width:'100%', padding: '8px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: features[f.key] ? '#2ecc71' : (f.key === 'gameLock' ? '#2ecc71' : '#95a5a6'), color: 'white' }}> 
                                    {f.key === 'gameLock' ? (features[f.key] ? "⛔ Locked" : "✅ Normal") : (features[f.key] ? "✅ ON" : "❌ OFF")}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 🔥 [수정] 장부 검사 결과 모달 (기준일 표시 추가) */}
            {auditResult && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div style={{ background: '#2c3e50', width: '90%', maxWidth: '400px', padding: 20, borderRadius: 10, color:'white', textAlign:'center', border: auditResult.isSuspicious ? '3px solid #e74c3c' : '3px solid #2ecc71' }}>
                        <h2 style={{color: auditResult.isSuspicious ? '#e74c3c' : '#2ecc71'}}>{auditResult.isSuspicious ? "🚨 조작 의심!!" : "✅ 정상 계정"}</h2>
                        <div style={{textAlign:'left', background:'#222', padding:15, borderRadius:5, margin:'20px 0'}}>
                            <p style={{fontSize:13, color:'#aaa', marginBottom:10}}>{auditResult.baseInfo}</p> {/* 기준일 표시 */}
                            <p>👤 유저: <strong>{auditResult.userName}</strong></p>
                            <p>📊 현재 DB 포인트: <strong style={{color:'#f1c40f'}}>{auditResult.currentDBPoint.toLocaleString()}</strong></p>
                            <p>🧮 기록상 계산된 포인트: <strong style={{color:'#3498db'}}>{auditResult.calculatedPoint.toLocaleString()}</strong></p>
                            <hr style={{borderColor:'#555'}}/>
                            <p>📉 오차: <strong style={{color: auditResult.isSuspicious ? '#e74c3c' : '#2ecc71'}}>{auditResult.diff.toLocaleString()}</strong></p>
                            <p style={{fontSize:12, color:'#aaa'}}>(검사된 로그 수: {auditResult.logsCount}개)</p>
                        </div>
                        {auditResult.isSuspicious && <p style={{color:'#e74c3c', fontSize:14}}>* 해킹으로 포인트를 조작했을 가능성이 높습니다.</p>}
                        <button className="btn" onClick={() => setAuditResult(null)} style={{background:'#7f8c8d', width:'100%', marginTop:10}}>닫기</button>
                    </div>
                </div>
            )}

            {/* 유저 내역 모달 */}
            {selectedUser && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div style={{ background: '#2c3e50', width: '90%', maxWidth: '500px', maxHeight: '80vh', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column' }}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:15}}> <h2 style={{margin:0, color:'#f1c40f'}}>{selectedUser.name} {t.history}</h2> <button className="btn" style={{background:'#e74c3c', padding:'5px 10px'}} onClick={() => setSelectedUser(null)}>{t.close || "X"}</button> </div>
                        <div style={{ overflowY: 'auto', flex: 1, display:'flex', flexDirection:'column', gap: 10 }}> 
                            {processedUserHistory.length === 0 ? <p style={{textAlign:'center', color:'#ccc'}}>{t.log_no_data}</p> : processedUserHistory.map(h => ( 
                                <div key={h.id} style={{ background: '#222', padding: 10, borderRadius: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> 
                                    <div> 
                                        <div style={{ fontSize: 12, color: '#aaa' }}>{formatDate(h.createdAt)}</div> 
                                        <div style={{ fontSize: 14 }}>{h.displayMsg}</div> 
                                    </div> 
                                    <div style={{ fontSize: 16, fontWeight: 'bold', color: h.amount > 0 ? '#2ecc71' : '#e74c3c' }}> {h.amount > 0 ? '+' : ''}{h.amount.toLocaleString()} </div> 
                                </div> 
                            ))} 
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}