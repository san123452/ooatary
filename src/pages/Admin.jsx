// import React, { useState, useEffect } from 'react';
// import { db } from '../firebase';
// // writeBatch 등 필요한 모든 함수 import
// import { collection, query, orderBy, limit, getDocs, updateDoc, doc, getDoc, setDoc, deleteDoc, writeBatch, where } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';

// export default function Admin() {
//     const navigate = useNavigate();
//     const [tab, setTab] = useState('notice'); // 기본 탭: 공지 관리
    
//     // 상태 변수들
//     const [notice, setNotice] = useState("");
//     const [users, setUsers] = useState([]);
//     const [totalMoney, setTotalMoney] = useState(0); // 💰 서버 총 자산 상태 추가
//     const [inputPoints, setInputPoints] = useState({});
//     const [inputNames, setInputNames] = useState({});
//     const [history, setHistory] = useState([]);
//     const [selectedUser, setSelectedUser] = useState(null);
//     const [userHistory, setUserHistory] = useState([]);
//     const [isServerOpen, setIsServerOpen] = useState(true);
//     const [features, setFeatures] = useState({ transfer: true, attack: true, shop: true });
    
//     // 🔄 로딩 상태
//     const [isProcessing, setIsProcessing] = useState(false);

//     useEffect(() => {
//         if (tab === 'notice') fetchNotice();
//         if (tab === 'users') fetchUsers();
//         if (tab === 'server') fetchServerStatus();
//         if (tab === 'features') fetchFeatures();
        
//         if (tab === 'history') {
//             fetchHistory();
//             fetchUsers(); 
//         }
//     }, [tab]);

//     // --- 1. 시스템/서버 함수 ---
//     const fetchServerStatus = async () => { try { const docSnap = await getDoc(doc(db, "system", "server")); if (docSnap.exists()) { setIsServerOpen(docSnap.data().isOpen); } else { await setDoc(doc(db, "system", "server"), { isOpen: true }); setIsServerOpen(true); } } catch (e) { console.error(e); } };
//     const toggleServer = async () => { const newState = !isServerOpen; if (!window.confirm(newState ? "서버를 여시겠습니까?" : "서버를 닫으시겠습니까?")) return; try { await updateDoc(doc(db, "system", "server"), { isOpen: newState }); setIsServerOpen(newState); alert(newState ? "✅ 서버 열림" : "🚧 서버 닫힘"); } catch (e) { alert("에러: " + e.message); } };
//     const handleForceRefresh = async () => { if (!window.confirm("전체 새로고침 하시겠습니까?")) return; try { await setDoc(doc(db, "system", "info"), { version: Date.now() }, { merge: true }); alert("✅ 신호 전송 완료"); } catch (e) { alert("에러"); } };
    
//     // --- 2. 공지사항 함수 ---
//     const fetchNotice = async () => { try { const docSnap = await getDoc(doc(db, "system", "notice")); if (docSnap.exists()) setNotice(docSnap.data().text || ""); } catch (e) { console.error(e); } };
//     const handleSaveNotice = async () => { if (!notice.trim()) return alert("입력하세요"); try { await setDoc(doc(db, "system", "notice"), { text: notice, updatedAt: new Date().toLocaleString() }); alert("완료"); } catch (e) { alert(e.message); } };
//     const handleDeleteNotice = async () => { if (!window.confirm("삭제하시겠습니까?")) return; try { await deleteDoc(doc(db, "system", "notice")); setNotice(""); alert("삭제 완료"); } catch (e) { alert(e.message); } };
    
//     // --- 3. 유저 관리 함수 (수정됨: 시총 계산) ---
//     const fetchUsers = async () => {
//         const q = query(collection(db, "users"));
//         const snap = await getDocs(q);
        
//         let sumMoney = 0; // 💰 총 자산 누적용 변수

//         const list = snap.docs.map(d => {
//             const data = d.data();
//             const point = data.point || 0;
//             sumMoney += point; // 돈 합산
//             return { uid: d.id, ...data };
//         });

//         // 정렬: 승인대기 -> 가입일순
//         list.sort((a, b) => {
//             if (a.isApproved !== b.isApproved) return a.isApproved ? 1 : -1; 
//             return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
//         });
        
//         setTotalMoney(sumMoney); // 💰 상태 업데이트
//         setUsers(list);
//     };

//     const toggleApprove = async (uid, currentStatus, name) => {
//         if (!window.confirm(currentStatus ? "승인 취소?" : "가입 승인?")) return;
//         try { await updateDoc(doc(db, "users", uid), { isApproved: !currentStatus }); alert("처리됨"); fetchUsers(); } catch (e) { alert("에러"); }
//     };
//     const handleUpdatePoint = async (uid, currentPoint) => { const amount = parseInt(inputPoints[uid]); if (isNaN(amount)) return alert("숫자 입력"); if (!window.confirm("지급?")) return; try { await updateDoc(doc(db, "users", uid), { point: (currentPoint || 0) + amount }); alert("완료"); fetchUsers(); setInputPoints({...inputPoints, [uid]:''}); } catch(e) { alert("에러"); } };
//     const handleUpdateName = async (uid) => { const newName = inputNames[uid]; if(!newName) return; try { await updateDoc(doc(db, "users", uid), { name: newName }); alert("완료"); fetchUsers(); setInputNames({...inputNames, [uid]:''}); } catch(e) { alert("에러"); } };
//     const toggleBan = async (uid, isBanned, name) => { if (!window.confirm("밴/해제?")) return; try { await updateDoc(doc(db, "users", uid), { isBanned: !isBanned }); alert("완료"); fetchUsers(); } catch (e) { alert("에러"); } };
    
//     // --- 4. 내역 함수 ---
//     const fetchUserHistory = async (user) => { setSelectedUser(user); setUserHistory([]); try { const q = query(collection(db, "history"), where("uid", "==", user.uid), orderBy("createdAt", "desc"), limit(50)); const snap = await getDocs(q); setUserHistory(snap.docs.map(d => ({ id: d.id, ...d.data() }))); } catch (e) { console.error(e); alert("색인 필요"); } };
//     const fetchHistory = async () => { const q = query(collection(db, "history"), orderBy("createdAt", "desc"), limit(50)); const snap = await getDocs(q); setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() }))); };
//     const formatDate = (ts) => { if(!ts) return '-'; const date = ts.toDate(); return `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}`; };

//     // --- 5. 기능 관리 함수 ---
//     const fetchFeatures = async () => { try { const docSnap = await getDoc(doc(db, "system", "features")); if (docSnap.exists()) { setFeatures(docSnap.data()); } else { const def = { transfer: true, attack: true, shop: true }; await setDoc(doc(db, "system", "features"), def); setFeatures(def); } } catch (e) {} };
//     const toggleFeature = async (key) => { const newValue = !features[key]; const newFeatures = { ...features, [key]: newValue }; try { await setDoc(doc(db, "system", "features"), newFeatures, { merge: true }); setFeatures(newFeatures); alert("변경됨"); } catch (e) { alert("실패"); } };

//     return (
//         <div className="container" style={{ paddingTop: 30, background: '#2c3e50', minHeight: '100vh', color: 'white', padding: 20 }}>
//             <h1 style={{ color: '#e74c3c', textAlign: 'center', marginBottom: 20 }}>👮 통합 관리자 페이지</h1>
            
//             {/* 탭 버튼 (경제 탭 삭제됨) */}
//             <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
//                 <button className="btn" style={{ background: tab === 'notice' ? '#f1c40f' : '#7f8c8d', color: 'black' }} onClick={() => setTab('notice')}>📢 공지 관리</button>
//                 <button className="btn" style={{ background: tab === 'users' ? '#f1c40f' : '#7f8c8d', color: 'black' }} onClick={() => setTab('users')}>👥 유저 관리</button>
//                 <button className="btn" style={{ background: tab === 'history' ? '#f1c40f' : '#7f8c8d', color: 'black' }} onClick={() => setTab('history')}>📜 전체 내역</button>
//                 <button className="btn" style={{ background: tab === 'server' ? '#e74c3c' : '#7f8c8d', color: 'white' }} onClick={() => setTab('server')}>🚧 서버 관리</button>
//                 {/* 🏦 경제 탭 삭제됨 */}
//                 <button className="btn" style={{ background: tab === 'features' ? '#9b59b6' : '#7f8c8d', color: 'white' }} onClick={() => setTab('features')}>⚙️ 기능 관리</button>
//                 <button className="btn" style={{ background: '#34495e' }} onClick={() => navigate('/home')}>🏠 홈으로</button>
//             </div>

//             {/* 📢 공지 관리 */}
//             {tab === 'notice' && (
//                 <div className="card" style={{ background: 'white', color: 'black', padding: 20 }}>
//                     <h3>메인 공지 설정</h3>
//                     <textarea style={{ width: '100%', height: 150, padding: 10, margin: '10px 0', border: '1px solid #ddd' }} placeholder="내용 입력..." value={notice} onChange={(e) => setNotice(e.target.value)} />
//                     <div style={{ display: 'flex', gap: 10 }}> <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveNotice}>💾 저장</button> <button className="btn btn-danger" style={{ flex: 1, background: '#e74c3c' }} onClick={handleDeleteNotice}>🗑️ 삭제</button> </div>
//                 </div>
//             )}

//             {/* 👥 유저 관리 (수정됨: 시총 표시 & 티어 표시) */}
//             {tab === 'users' && (
//                 <div>
//                     {/* 💰 시가총액 (서버 전체 자산) 카드 */}
//                     <div className="card" style={{ 
//                         background: 'linear-gradient(135deg, #2ecc71, #27ae60)', 
//                         padding: '20px', marginBottom: '20px', 
//                         textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' 
//                     }}>
//                         <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', color: 'white' }}>💰 서버 총 자산 (시총)</h2>
//                         <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#f1c40f' }}>
//                             {totalMoney.toLocaleString()}원
//                         </p>
//                         <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#ecf0f1' }}>
//                             현재 가입 유저: {users.length}명
//                         </p>
//                     </div>

//                     {users.map(u => (
//                         <div key={u.uid} className="card" style={{ padding: 15, marginBottom: 10, background: u.isBanned ? '#c0392b' : (u.isApproved === false ? '#333' : '#34495e'), border: u.isApproved === false ? '2px solid #f1c40f' : 'none' }}>
//                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
//                                 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}> 
//                                     {u.isApproved === false && <span style={{background:'#f1c40f', color:'black', fontWeight:'bold', padding:'2px 5px', borderRadius:4}}>⏳ 대기중</span>}
                                    
//                                     {/* 🏅 티어 표시 (추가됨) */}
//                                     <span style={{ 
//                                         fontSize: 12, background: '#555', color: 'white', 
//                                         padding: '2px 6px', borderRadius: 4, border:'1px solid #777' 
//                                     }}>
//                                         {u.tierName || "언랭크"}
//                                     </span>

//                                     <span style={{ fontSize: 18, fontWeight: 'bold', color: '#f1c40f' }}>{u.name || "익명"}</span> 
//                                     <span style={{ fontSize: 12, color: '#ccc' }}>({u.email})</span> 
//                                     <span style={{ fontSize: 12, color: '#00d2d3', border:'1px solid #00d2d3', padding:'2px 5px', borderRadius:4 }}>IP: {u.ip || "미수집"}</span>
//                                     {u.isBanned && <span style={{ background: 'white', color: 'red', padding: '2px 5px', borderRadius: 4, fontWeight: 'bold' }}>⛔ 정지됨</span>} 
//                                 </div>
//                                 <div style={{ fontWeight: 'bold' }}>💰 {Math.floor(u.point || 0).toLocaleString()}</div>
//                             </div>
//                             <div style={{ display: 'flex', gap: 5, flexWrap:'wrap' }}> 
//                                 <button className="btn" style={{ height: 35, padding: '0 10px', background: u.isApproved === false ? '#2ecc71' : '#7f8c8d' }} onClick={() => toggleApprove(u.uid, u.isApproved, u.name)}> {u.isApproved === false ? '✅ 가입 승인' : '🚫 승인 취소'} </button>
//                                 <input className="input" style={{ width: 100, height: 35, padding: 5, margin:0 }} placeholder="이름 변경" value={inputNames[u.uid] || ''} onChange={(e) => setInputNames({ ...inputNames, [u.uid]: e.target.value })} /> 
//                                 <button className="btn" style={{ height: 35, padding: '0 10px', background: '#2980b9' }} onClick={() => handleUpdateName(u.uid)}>개명</button> 
//                                 <input className="input" type="number" style={{ width: 100, height: 35, padding: 5, margin:0 }} placeholder="포인트 ±" value={inputPoints[u.uid] || ''} onChange={(e) => setInputPoints({ ...inputPoints, [u.uid]: e.target.value })} /> 
//                                 <button className="btn" style={{ height: 35, padding: '0 10px', background: '#27ae60' }} onClick={() => handleUpdatePoint(u.uid, u.point)}>지급</button> 
//                                 <button className="btn" style={{ height: 35, padding: '0 10px', background: '#8e44ad' }} onClick={() => fetchUserHistory(u)}>📜 내역</button> 
//                                 {u.email !== 'kks3172@naver.com' && ( <button className="btn" style={{ height: 35, padding: '0 10px', background: '#e74c3c' }} onClick={() => toggleBan(u.uid, u.isBanned, u.name)}> {u.isBanned ? '해제' : '밴'} </button> )} 
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             )}

//             {/* 📜 내역 탭 */}
//             {tab === 'history' && (
//                 <div style={{ background: '#34495e', padding: 20, borderRadius: 10 }}>
//                     <h3>최근 거래 내역 (50건)</h3>
//                     <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}> 
//                         {history.map(h => {
//                             const writer = users.find(u => u.uid === h.uid);
//                             const writerName = writer ? writer.name : "탈퇴/알수없음";
//                             return (
//                                 <div key={h.id} style={{ background: '#222', padding: 10, borderRadius: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> 
//                                     <div> 
//                                         <div style={{ fontSize: 12, color: '#aaa' }}>{formatDate(h.createdAt)}</div> 
//                                         <div style={{ fontSize: 13, color: '#f1c40f', fontWeight: 'bold', marginBottom: '2px' }}> 👤 {writerName} </div>
//                                         <div style={{ fontSize: 14 }}>{h.msg}</div> 
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
//                     <h2 style={{ marginBottom: 20 }}>현재 서버 상태: {isServerOpen ? <span style={{color:'#2ecc71'}}>✅ 정상 운영 중</span> : <span style={{color:'#e74c3c'}}>🚧 점검 중 (닫힘)</span>}</h2>
//                     <button onClick={toggleServer} style={{ padding: '15px 40px', fontSize: '20px', fontWeight: 'bold', borderRadius: '10px', border: 'none', cursor: 'pointer', marginBottom: '30px', background: isServerOpen ? '#c0392b' : '#2ecc71', color: 'white' }}> {isServerOpen ? "🛑 서버 닫기" : "✅ 서버 열기"} </button>
//                     <hr style={{margin: '20px 0'}} />
//                     <button onClick={handleForceRefresh} style={{ padding: '15px 40px', fontSize: '20px', fontWeight: 'bold', borderRadius: '10px', border: 'none', cursor: 'pointer', background: '#3498db', color: 'white' }}> 🔄 전체 유저 새로고침 </button>
//                 </div>
//             )}

//             {/* ⚙️ 기능 관리 */}
//             {tab === 'features' && (
//                 <div className="card" style={{ background: 'white', color: 'black', padding: 30, textAlign: 'center' }}>
//                     <h2 style={{ marginBottom: 30, color:'#9b59b6' }}>⚙️ 인게임 기능 ON/OFF</h2>
//                     <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
//                         <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '10px', width: '200px' }}>
//                             <h3>💸 송금 기능</h3>
//                             <button onClick={() => toggleFeature('transfer')} style={{ padding: '10px 20px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', background: features.transfer ? '#27ae60' : '#95a5a6', color: 'white' }}> {features.transfer ? "✅ 활성화됨" : "🔒 잠김"} </button>
//                         </div>
//                         <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '10px', width: '200px' }}>
//                             <h3>🚀 핵공격 기능</h3>
//                             <button onClick={() => toggleFeature('attack')} style={{ padding: '10px 20px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', background: features.attack ? '#8e44ad' : '#95a5a6', color: 'white' }}> {features.attack ? "✅ 활성화됨" : "🔒 잠김"} </button>
//                         </div>
//                         <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '10px', width: '200px' }}>
//                             <h3>😈 암시장 기능</h3>
//                             <button onClick={() => toggleFeature('shop')} style={{ padding: '10px 20px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', background: features.shop ? '#e67e22' : '#95a5a6', color: 'white' }}> {features.shop ? "✅ 활성화됨" : "🔒 잠김"} </button>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {/* 유저 내역 모달 */}
//             {selectedUser && (
//                 <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
//                     <div style={{ background: '#2c3e50', width: '90%', maxWidth: '500px', maxHeight: '80vh', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column' }}>
//                         <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:15}}> <h2 style={{margin:0, color:'#f1c40f'}}>{selectedUser.name}님의 내역</h2> <button className="btn" style={{background:'#e74c3c', padding:'5px 10px'}} onClick={() => setSelectedUser(null)}>닫기</button> </div>
//                         <div style={{ overflowY: 'auto', flex: 1, display:'flex', flexDirection:'column', gap: 10 }}> {userHistory.length === 0 ? <p style={{textAlign:'center', color:'#ccc'}}>기록이 없습니다.</p> : userHistory.map(h => ( <div key={h.id} style={{ background: '#222', padding: 10, borderRadius: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> <div> <div style={{ fontSize: 12, color: '#aaa' }}>{formatDate(h.createdAt)}</div> <div style={{ fontSize: 14 }}>{h.msg}</div> </div> <div style={{ fontSize: 16, fontWeight: 'bold', color: h.amount > 0 ? '#2ecc71' : '#e74c3c' }}> {h.amount > 0 ? '+' : ''}{h.amount.toLocaleString()} </div> </div> ))} </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs, updateDoc, doc, getDoc, setDoc, deleteDoc, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
    const navigate = useNavigate();
    const [tab, setTab] = useState('notice'); 
    
    // 상태 변수들
    const [notice, setNotice] = useState("");
    const [users, setUsers] = useState([]);
    const [totalMoney, setTotalMoney] = useState(0); 
    const [inputPoints, setInputPoints] = useState({});
    const [inputNames, setInputNames] = useState({});
    const [history, setHistory] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userHistory, setUserHistory] = useState([]);
    const [isServerOpen, setIsServerOpen] = useState(true);
    // ⭐ [수정] 기능 관리 항목 추가 (핵공격 삭제, 자동가입/게시판/게임잠금 추가)
    const [features, setFeatures] = useState({ 
        transfer: true, 
        shop: true, 
        autoApproval: true, // 자동 가입 승인
        boardWrite: true,   // 게시판 글쓰기
        gameLock: false     // 게임 전체 잠금
    });
    
    useEffect(() => {
        if (tab === 'notice') fetchNotice();
        if (tab === 'users') fetchUsers();
        if (tab === 'server') fetchServerStatus();
        if (tab === 'features') fetchFeatures();
        
        if (tab === 'history') {
            fetchHistory();
            fetchUsers(); 
        }
    }, [tab]);

    // --- 1. 시스템/서버 함수 ---
    const fetchServerStatus = async () => { try { const docSnap = await getDoc(doc(db, "system", "server")); if (docSnap.exists()) { setIsServerOpen(docSnap.data().isOpen); } else { await setDoc(doc(db, "system", "server"), { isOpen: true }); setIsServerOpen(true); } } catch (e) { console.error(e); } };
    const toggleServer = async () => { const newState = !isServerOpen; if (!window.confirm(newState ? "서버를 여시겠습니까?" : "서버를 닫으시겠습니까?")) return; try { await updateDoc(doc(db, "system", "server"), { isOpen: newState }); setIsServerOpen(newState); alert(newState ? "✅ 서버 열림" : "🚧 서버 닫힘"); } catch (e) { alert("에러: " + e.message); } };
    const handleForceRefresh = async () => { if (!window.confirm("전체 새로고침 하시겠습니까?")) return; try { await setDoc(doc(db, "system", "info"), { version: Date.now() }, { merge: true }); alert("✅ 신호 전송 완료"); } catch (e) { alert("에러"); } };
    
    // --- 2. 공지사항 함수 ---
    const fetchNotice = async () => { try { const docSnap = await getDoc(doc(db, "system", "notice")); if (docSnap.exists()) setNotice(docSnap.data().text || ""); } catch (e) { console.error(e); } };
    const handleSaveNotice = async () => { if (!notice.trim()) return alert("입력하세요"); try { await setDoc(doc(db, "system", "notice"), { text: notice, updatedAt: new Date().toLocaleString() }); alert("완료"); } catch (e) { alert(e.message); } };
    const handleDeleteNotice = async () => { if (!window.confirm("삭제하시겠습니까?")) return; try { await deleteDoc(doc(db, "system", "notice")); setNotice(""); alert("삭제 완료"); } catch (e) { alert(e.message); } };
    
    // --- 3. 유저 관리 함수 ---
    const fetchUsers = async () => {
        const q = query(collection(db, "users"));
        const snap = await getDocs(q);
        
        let sumMoney = 0; 

        const list = snap.docs.map(d => {
            const data = d.data();
            const point = data.point || 0;
            sumMoney += point; 
            return { uid: d.id, ...data };
        });

        list.sort((a, b) => {
            if (a.isApproved !== b.isApproved) return a.isApproved ? 1 : -1; 
            return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });
        
        setTotalMoney(sumMoney); 
        setUsers(list);
    };

    const toggleApprove = async (uid, currentStatus, name) => {
        if (!window.confirm(currentStatus ? "승인 취소?" : "가입 승인?")) return;
        try { await updateDoc(doc(db, "users", uid), { isApproved: !currentStatus }); alert("처리됨"); fetchUsers(); } catch (e) { alert("에러"); }
    };
    const handleUpdatePoint = async (uid, currentPoint) => { const amount = parseInt(inputPoints[uid]); if (isNaN(amount)) return alert("숫자 입력"); if (!window.confirm("지급?")) return; try { await updateDoc(doc(db, "users", uid), { point: (currentPoint || 0) + amount }); alert("완료"); fetchUsers(); setInputPoints({...inputPoints, [uid]:''}); } catch(e) { alert("에러"); } };
    const handleUpdateName = async (uid) => { const newName = inputNames[uid]; if(!newName) return; try { await updateDoc(doc(db, "users", uid), { name: newName }); alert("완료"); fetchUsers(); setInputNames({...inputNames, [uid]:''}); } catch(e) { alert("에러"); } };
    const toggleBan = async (uid, isBanned, name) => { if (!window.confirm("밴/해제?")) return; try { await updateDoc(doc(db, "users", uid), { isBanned: !isBanned }); alert("완료"); fetchUsers(); } catch (e) { alert("에러"); } };
    
    // --- 4. 내역 함수 ---
    const fetchUserHistory = async (user) => { setSelectedUser(user); setUserHistory([]); try { const q = query(collection(db, "history"), where("uid", "==", user.uid), orderBy("createdAt", "desc"), limit(50)); const snap = await getDocs(q); setUserHistory(snap.docs.map(d => ({ id: d.id, ...d.data() }))); } catch (e) { console.error(e); alert("색인 필요"); } };
    const fetchHistory = async () => { const q = query(collection(db, "history"), orderBy("createdAt", "desc"), limit(50)); const snap = await getDocs(q); setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() }))); };
    const formatDate = (ts) => { if(!ts) return '-'; const date = ts.toDate(); return `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}`; };

    // --- 5. 기능 관리 함수 ---
    const fetchFeatures = async () => { 
        try { 
            const docSnap = await getDoc(doc(db, "system", "features")); 
            if (docSnap.exists()) { 
                setFeatures(docSnap.data()); 
            } else { 
                // 문서 없으면 기본값 생성
                const def = { transfer: true, shop: true, autoApproval: true, boardWrite: true, gameLock: false }; 
                await setDoc(doc(db, "system", "features"), def); 
                setFeatures(def); 
            } 
        } catch (e) {} 
    };
    const toggleFeature = async (key) => { 
        const newValue = !features[key]; 
        const newFeatures = { ...features, [key]: newValue }; 
        try { 
            await setDoc(doc(db, "system", "features"), newFeatures, { merge: true }); 
            setFeatures(newFeatures); 
        } catch (e) { alert("실패"); } 
    };

    return (
        <div className="container" style={{ paddingTop: 30, background: '#2c3e50', minHeight: '100vh', color: 'white', padding: 20 }}>
            <h1 style={{ color: '#e74c3c', textAlign: 'center', marginBottom: 20, fontSize:'24px' }}>👮 통합 관리자 페이지</h1>
            
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
                <button className="btn" style={{ background: tab === 'notice' ? '#f1c40f' : '#7f8c8d', color: 'black', padding:'8px 12px', fontSize:'14px' }} onClick={() => setTab('notice')}>📢 공지</button>
                <button className="btn" style={{ background: tab === 'users' ? '#f1c40f' : '#7f8c8d', color: 'black', padding:'8px 12px', fontSize:'14px' }} onClick={() => setTab('users')}>👥 유저</button>
                <button className="btn" style={{ background: tab === 'history' ? '#f1c40f' : '#7f8c8d', color: 'black', padding:'8px 12px', fontSize:'14px' }} onClick={() => setTab('history')}>📜 내역</button>
                <button className="btn" style={{ background: tab === 'server' ? '#e74c3c' : '#7f8c8d', color: 'white', padding:'8px 12px', fontSize:'14px' }} onClick={() => setTab('server')}>🚧 서버</button>
                <button className="btn" style={{ background: tab === 'features' ? '#9b59b6' : '#7f8c8d', color: 'white', padding:'8px 12px', fontSize:'14px' }} onClick={() => setTab('features')}>⚙️ 기능</button>
                <button className="btn" style={{ background: '#34495e', padding:'8px 12px', fontSize:'14px' }} onClick={() => navigate('/home')}>🏠 홈</button>
            </div>

            {/* 📢 공지 관리 */}
            {tab === 'notice' && (
                <div className="card" style={{ background: 'white', color: 'black', padding: 20 }}>
                    <h3>메인 공지 설정</h3>
                    <textarea style={{ width: '100%', height: 150, padding: 10, margin: '10px 0', border: '1px solid #ddd' }} placeholder="내용 입력..." value={notice} onChange={(e) => setNotice(e.target.value)} />
                    <div style={{ display: 'flex', gap: 10 }}> <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveNotice}>💾 저장</button> <button className="btn btn-danger" style={{ flex: 1, background: '#e74c3c' }} onClick={handleDeleteNotice}>🗑️ 삭제</button> </div>
                </div>
            )}

            {/* 👥 유저 관리 */}
            {tab === 'users' && (
                <div>
                    <div className="card" style={{ background: 'linear-gradient(135deg, #2ecc71, #27ae60)', padding: '20px', marginBottom: '20px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                        <h2 style={{ margin: '0 0 10px 0', fontSize: '20px', color: 'white' }}>💰 서버 총 자산</h2>
                        <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#f1c40f' }}> {totalMoney.toLocaleString()}원 </p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#ecf0f1' }}> 현재 가입 유저: {users.length}명 </p>
                    </div>

                    {users.map(u => (
                        <div key={u.uid} className="card" style={{ padding: 15, marginBottom: 10, background: u.isBanned ? '#c0392b' : (u.isApproved === false ? '#444' : '#34495e'), border: u.isApproved === false ? '2px solid #f1c40f' : 'none', borderRadius:'8px' }}>
                            
                            {/* 유저 정보 헤더 */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap:'wrap', gap:'10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap:'wrap' }}> 
                                    {u.isApproved === false && <span style={{background:'#f1c40f', color:'black', fontWeight:'bold', padding:'2px 6px', borderRadius:4, fontSize:'11px'}}>⏳ 대기</span>}
                                    
                                    <span style={{ fontSize: 11, background: '#222', color: '#aaa', padding: '2px 6px', borderRadius: 4, border:'1px solid #555' }}>
                                        {u.tierName || "언랭크"}
                                    </span>

                                    <span style={{ fontSize: 16, fontWeight: 'bold', color: 'white' }}>{u.name || "익명"}</span> 
                                    <span style={{ fontSize: 11, color: '#ccc' }}>({u.email})</span> 
                                    {u.isBanned && <span style={{ background: 'white', color: 'red', padding: '2px 5px', borderRadius: 4, fontWeight: 'bold', fontSize:'11px' }}>⛔ 정지됨</span>} 
                                </div>
                                <div style={{ fontWeight: 'bold', color:'#f1c40f', fontSize:'16px' }}>{Math.floor(u.point || 0).toLocaleString()} P</div>
                            </div>

                            {/* 관리 버튼들 (모바일 최적화) */}
                            <div style={{ display: 'flex', gap: 5, flexWrap:'wrap', justifyContent:'flex-start' }}> 
                                <button className="btn" style={{ height: 35, fontSize:'12px', padding: '0 10px', background: u.isApproved === false ? '#2ecc71' : '#7f8c8d' }} onClick={() => toggleApprove(u.uid, u.isApproved, u.name)}> {u.isApproved === false ? '승인' : '취소'} </button>
                                
                                <div style={{display:'flex', gap:2}}>
                                    <input className="input" style={{ width: 80, height: 35, padding: 5, margin:0, fontSize:'12px' }} placeholder="이름" value={inputNames[u.uid] || ''} onChange={(e) => setInputNames({ ...inputNames, [u.uid]: e.target.value })} /> 
                                    <button className="btn" style={{ height: 35, fontSize:'12px', padding: '0 10px', background: '#2980b9' }} onClick={() => handleUpdateName(u.uid)}>변경</button> 
                                </div>

                                <div style={{display:'flex', gap:2}}>
                                    <input className="input" type="number" style={{ width: 80, height: 35, padding: 5, margin:0, fontSize:'12px' }} placeholder="±포인트" value={inputPoints[u.uid] || ''} onChange={(e) => setInputPoints({ ...inputPoints, [u.uid]: e.target.value })} /> 
                                    <button className="btn" style={{ height: 35, fontSize:'12px', padding: '0 10px', background: '#27ae60' }} onClick={() => handleUpdatePoint(u.uid, u.point)}>지급</button> 
                                </div>

                                <button className="btn" style={{ height: 35, fontSize:'12px', padding: '0 10px', background: '#8e44ad' }} onClick={() => fetchUserHistory(u)}>내역</button> 
                                {u.email !== 'kks3172@naver.com' && ( <button className="btn" style={{ height: 35, fontSize:'12px', padding: '0 10px', background: '#e74c3c' }} onClick={() => toggleBan(u.uid, u.isBanned, u.name)}> {u.isBanned ? '해제' : '밴'} </button> )} 
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 📜 내역 탭 */}
            {tab === 'history' && (
                <div style={{ background: '#34495e', padding: 20, borderRadius: 10 }}>
                    <h3>최근 거래 내역 (50건)</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}> 
                        {history.map(h => {
                            const writer = users.find(u => u.uid === h.uid);
                            const writerName = writer ? writer.name : "탈퇴/알수없음";
                            return (
                                <div key={h.id} style={{ background: '#222', padding: 10, borderRadius: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> 
                                    <div> 
                                        <div style={{ fontSize: 12, color: '#aaa' }}>{formatDate(h.createdAt)}</div> 
                                        <div style={{ fontSize: 13, color: '#f1c40f', fontWeight: 'bold', marginBottom: '2px' }}> 👤 {writerName} </div>
                                        <div style={{ fontSize: 14 }}>{h.msg}</div> 
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
                    <h2 style={{ marginBottom: 20 }}>현재 서버 상태: {isServerOpen ? <span style={{color:'#2ecc71'}}>✅ 정상 운영 중</span> : <span style={{color:'#e74c3c'}}>🚧 점검 중 (닫힘)</span>}</h2>
                    <button onClick={toggleServer} style={{ padding: '15px 40px', fontSize: '20px', fontWeight: 'bold', borderRadius: '10px', border: 'none', cursor: 'pointer', marginBottom: '30px', background: isServerOpen ? '#c0392b' : '#2ecc71', color: 'white' }}> {isServerOpen ? "🛑 서버 닫기" : "✅ 서버 열기"} </button>
                    <hr style={{margin: '20px 0'}} />
                    <button onClick={handleForceRefresh} style={{ padding: '15px 40px', fontSize: '20px', fontWeight: 'bold', borderRadius: '10px', border: 'none', cursor: 'pointer', background: '#3498db', color: 'white' }}> 🔄 전체 유저 새로고침 </button>
                </div>
            )}

            {/* ⚙️ 기능 관리 (업데이트됨) */}
            {tab === 'features' && (
                <div className="card" style={{ background: 'white', color: 'black', padding: '20px', textAlign: 'center' }}>
                    <h2 style={{ marginBottom: 20, color:'#9b59b6', fontSize:'22px' }}>⚙️ 시스템 기능 제어</h2>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
                        
                        {/* 1. 자동 가입 승인 */}
                        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '10px', background:'#f9f9f9' }}>
                            <div style={{fontSize:'24px'}}>📝</div>
                            <h4 style={{margin:'10px 0'}}>자동 가입 승인</h4>
                            <button onClick={() => toggleFeature('autoApproval')} style={{ width:'100%', padding: '8px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: features.autoApproval ? '#2ecc71' : '#95a5a6', color: 'white' }}> 
                                {features.autoApproval ? "ON (자동)" : "OFF (수동)"} 
                            </button>
                        </div>

                        {/* 2. 송금 기능 */}
                        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '10px', background:'#f9f9f9' }}>
                            <div style={{fontSize:'24px'}}>💸</div>
                            <h4 style={{margin:'10px 0'}}>송금 기능</h4>
                            <button onClick={() => toggleFeature('transfer')} style={{ width:'100%', padding: '8px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: features.transfer ? '#3498db' : '#95a5a6', color: 'white' }}> 
                                {features.transfer ? "ON" : "OFF"} 
                            </button>
                        </div>

                        {/* 3. 암시장 기능 */}
                        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '10px', background:'#f9f9f9' }}>
                            <div style={{fontSize:'24px'}}>😈</div>
                            <h4 style={{margin:'10px 0'}}>암시장</h4>
                            <button onClick={() => toggleFeature('shop')} style={{ width:'100%', padding: '8px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: features.shop ? '#8e44ad' : '#95a5a6', color: 'white' }}> 
                                {features.shop ? "ON" : "OFF"} 
                            </button>
                        </div>

                        {/* 4. 게시판 글쓰기 */}
                        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '10px', background:'#f9f9f9' }}>
                            <div style={{fontSize:'24px'}}>🖊️</div>
                            <h4 style={{margin:'10px 0'}}>게시판 글쓰기</h4>
                            <button onClick={() => toggleFeature('boardWrite')} style={{ width:'100%', padding: '8px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: features.boardWrite ? '#2ecc71' : '#95a5a6', color: 'white' }}> 
                                {features.boardWrite ? "허용" : "차단"} 
                            </button>
                        </div>

                        {/* 5. 게임 전체 잠금 */}
                        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '10px', background:'#f9f9f9' }}>
                            <div style={{fontSize:'24px'}}>🎮</div>
                            <h4 style={{margin:'10px 0'}}>게임 이용</h4>
                            <button onClick={() => toggleFeature('gameLock')} style={{ width:'100%', padding: '8px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: !features.gameLock ? '#2ecc71' : '#e74c3c', color: 'white' }}> 
                                {!features.gameLock ? "정상" : "⛔ 잠김"} 
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* 유저 내역 모달 */}
            {selectedUser && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div style={{ background: '#2c3e50', width: '90%', maxWidth: '500px', maxHeight: '80vh', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column' }}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:15}}> <h2 style={{margin:0, color:'#f1c40f'}}>{selectedUser.name}님의 내역</h2> <button className="btn" style={{background:'#e74c3c', padding:'5px 10px'}} onClick={() => setSelectedUser(null)}>닫기</button> </div>
                        <div style={{ overflowY: 'auto', flex: 1, display:'flex', flexDirection:'column', gap: 10 }}> {userHistory.length === 0 ? <p style={{textAlign:'center', color:'#ccc'}}>기록이 없습니다.</p> : userHistory.map(h => ( <div key={h.id} style={{ background: '#222', padding: 10, borderRadius: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> <div> <div style={{ fontSize: 12, color: '#aaa' }}>{formatDate(h.createdAt)}</div> <div style={{ fontSize: 14 }}>{h.msg}</div> </div> <div style={{ fontSize: 16, fontWeight: 'bold', color: h.amount > 0 ? '#2ecc71' : '#e74c3c' }}> {h.amount > 0 ? '+' : ''}{h.amount.toLocaleString()} </div> </div> ))} </div>
                    </div>
                </div>
            )}
        </div>
    );
}