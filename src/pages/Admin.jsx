import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
// writeBatch 등 필요한 모든 함수 import
import { collection, query, orderBy, limit, getDocs, updateDoc, doc, getDoc, setDoc, deleteDoc, writeBatch, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
    const navigate = useNavigate();
    const [tab, setTab] = useState('notice'); // 기본 탭: 공지 관리
    
    // 상태 변수들
    const [notice, setNotice] = useState("");
    const [users, setUsers] = useState([]);
    const [inputPoints, setInputPoints] = useState({});
    const [inputNames, setInputNames] = useState({});
    const [history, setHistory] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userHistory, setUserHistory] = useState([]);
    const [isServerOpen, setIsServerOpen] = useState(true);
    
    // ⚙️ [수정됨] 기능 활성화 상태 (shop 추가)
    const [features, setFeatures] = useState({ transfer: true, attack: true, shop: true });
    
    // 🔄 로딩 상태
    const [isProcessing, setIsProcessing] = useState(false);

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
        const list = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
        list.sort((a, b) => {
            if (a.isApproved !== b.isApproved) return a.isApproved ? 1 : -1; 
            return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });
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

    // --- 5. 기능 관리 함수 (수정됨: shop 추가) ---
    const fetchFeatures = async () => { 
        try { 
            const docSnap = await getDoc(doc(db, "system", "features")); 
            if (docSnap.exists()) { 
                // 기존 데이터에 shop이 없으면 true로 병합
                const data = docSnap.data();
                setFeatures({ transfer: true, attack: true, shop: true, ...data }); 
            } else { 
                const def = { transfer: true, attack: true, shop: true }; 
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
            alert(`${key === 'transfer' ? '송금' : key === 'attack' ? '핵버튼' : '암시장'} 기능이 ${newValue ? '활성화' : '비활성화'} 되었습니다.`); 
        } catch (e) { alert("실패"); } 
    };

    // --- 6. [업그레이드] 대규모 경제 개혁 함수 ---
    const processBatchUpdate = async (docs, updateLogic) => {
        const BATCH_SIZE = 450; 
        let batch = writeBatch(db);
        let count = 0;
        for (const doc of docs) {
            updateLogic(batch, doc);
            count++;
            if (count >= BATCH_SIZE) { await batch.commit(); batch = writeBatch(db); count = 0; }
        }
        if (count > 0) await batch.commit();
    };

    const handleCurrencyReform = async (ratio) => {
        if (!window.confirm(`🚨 [경고] 모든 유저의 자산이 ${ratio * 100}%로 줄어듭니다.\n정말 실행하시겠습니까?`)) return;
        setIsProcessing(true);
        try {
            const q = query(collection(db, "users"));
            const snap = await getDocs(q);
            await processBatchUpdate(snap.docs, (batch, doc) => {
                const currentPoint = doc.data().point || 0;
                batch.update(doc.ref, { point: Math.floor(currentPoint * ratio) });
            });
            alert("📉 화폐 개혁이 완료되었습니다.");
        } catch (e) { alert("오류: " + e.message); } finally { setIsProcessing(false); }
    };

    const handleCapRich = async (limitAmount) => {
        if (!window.confirm(`🚨 ${limitAmount.toLocaleString()}원 이상 보유자의 재산을 강제로 압수하시겠습니까?`)) return;
        setIsProcessing(true);
        try {
            const q = query(collection(db, "users"));
            const snap = await getDocs(q);
            let richCount = 0;
            await processBatchUpdate(snap.docs, (batch, doc) => {
                const currentPoint = doc.data().point || 0;
                if (currentPoint > limitAmount) {
                    batch.update(doc.ref, { point: limitAmount });
                    richCount++;
                }
            });
            alert(`📉 ${richCount}명의 고액 자산가에게 세금을 징수했습니다.`);
        } catch (e) { alert("오류: " + e.message); } finally { setIsProcessing(false); }
    };

    const handleResetAll = async () => {
        if (!window.confirm("🧨 [위험] 모든 유저의 돈을 0원으로 만드시겠습니까?\n이 작업은 절대 되돌릴 수 없습니다!")) return;
        const confirmStr = prompt("실행하려면 '초기화' 라고 입력하세요.");
        if (confirmStr !== "초기화") return;
        setIsProcessing(true);
        try {
            const q = query(collection(db, "users"));
            const snap = await getDocs(q);
            await processBatchUpdate(snap.docs, (batch, doc) => { batch.update(doc.ref, { point: 0 }); });
            alert("💣 시즌 초기화 완료.");
        } catch (e) { alert("오류: " + e.message); } finally { setIsProcessing(false); }
    };

    return (
        <div className="container" style={{ paddingTop: 30, background: '#2c3e50', minHeight: '100vh', color: 'white', padding: 20 }}>
            <h1 style={{ color: '#e74c3c', textAlign: 'center', marginBottom: 20 }}>👮 통합 관리자 페이지</h1>
            
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
                <button className="btn" style={{ background: tab === 'notice' ? '#f1c40f' : '#7f8c8d', color: 'black' }} onClick={() => setTab('notice')}>📢 공지 관리</button>
                <button className="btn" style={{ background: tab === 'users' ? '#f1c40f' : '#7f8c8d', color: 'black' }} onClick={() => setTab('users')}>👥 유저 관리</button>
                <button className="btn" style={{ background: tab === 'history' ? '#f1c40f' : '#7f8c8d', color: 'black' }} onClick={() => setTab('history')}>📜 전체 내역</button>
                <button className="btn" style={{ background: tab === 'server' ? '#e74c3c' : '#7f8c8d', color: 'white' }} onClick={() => setTab('server')}>🚧 서버 관리</button>
                <button className="btn" style={{ background: tab === 'economy' ? '#27ae60' : '#7f8c8d', color: 'white' }} onClick={() => setTab('economy')}>🏦 경제 관리</button>
                <button className="btn" style={{ background: tab === 'features' ? '#9b59b6' : '#7f8c8d', color: 'white' }} onClick={() => setTab('features')}>⚙️ 기능 관리</button>
                <button className="btn" style={{ background: '#34495e' }} onClick={() => navigate('/home')}>🏠 홈으로</button>
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
                    {users.map(u => (
                        <div key={u.uid} className="card" style={{ padding: 15, marginBottom: 10, background: u.isBanned ? '#c0392b' : (u.isApproved === false ? '#333' : '#34495e'), border: u.isApproved === false ? '2px solid #f1c40f' : 'none' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}> 
                                    {u.isApproved === false && <span style={{background:'#f1c40f', color:'black', fontWeight:'bold', padding:'2px 5px', borderRadius:4}}>⏳ 대기중</span>}
                                    <span style={{ fontSize: 18, fontWeight: 'bold', color: '#f1c40f' }}>{u.name || "익명"}</span> 
                                    <span style={{ fontSize: 12, color: '#ccc' }}>({u.email})</span> 
                                    <span style={{ fontSize: 12, color: '#00d2d3', border:'1px solid #00d2d3', padding:'2px 5px', borderRadius:4 }}>IP: {u.ip || "미수집"}</span>
                                    {u.isBanned && <span style={{ background: 'white', color: 'red', padding: '2px 5px', borderRadius: 4, fontWeight: 'bold' }}>⛔ 정지됨</span>} 
                                </div>
                                <div style={{ fontWeight: 'bold' }}>💰 {Math.floor(u.point || 0).toLocaleString()}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 5, flexWrap:'wrap' }}> 
                                <button className="btn" style={{ height: 35, padding: '0 10px', background: u.isApproved === false ? '#2ecc71' : '#7f8c8d' }} onClick={() => toggleApprove(u.uid, u.isApproved, u.name)}> {u.isApproved === false ? '✅ 가입 승인' : '🚫 승인 취소'} </button>
                                <input className="input" style={{ width: 100, height: 35, padding: 5, margin:0 }} placeholder="이름 변경" value={inputNames[u.uid] || ''} onChange={(e) => setInputNames({ ...inputNames, [u.uid]: e.target.value })} /> 
                                <button className="btn" style={{ height: 35, padding: '0 10px', background: '#2980b9' }} onClick={() => handleUpdateName(u.uid)}>개명</button> 
                                <input className="input" type="number" style={{ width: 100, height: 35, padding: 5, margin:0 }} placeholder="포인트 ±" value={inputPoints[u.uid] || ''} onChange={(e) => setInputPoints({ ...inputPoints, [u.uid]: e.target.value })} /> 
                                <button className="btn" style={{ height: 35, padding: '0 10px', background: '#27ae60' }} onClick={() => handleUpdatePoint(u.uid, u.point)}>지급</button> 
                                <button className="btn" style={{ height: 35, padding: '0 10px', background: '#8e44ad' }} onClick={() => fetchUserHistory(u)}>📜 내역</button> 
                                {u.email !== 'kks3172@naver.com' && ( <button className="btn" style={{ height: 35, padding: '0 10px', background: '#e74c3c' }} onClick={() => toggleBan(u.uid, u.isBanned, u.name)}> {u.isBanned ? '해제' : '밴'} </button> )} 
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

            {/* 🏦 경제 관리 */}
            {tab === 'economy' && (
                <div className="card" style={{ background: 'white', color: 'black', padding: 30, textAlign: 'center' }}>
                    <h2 style={{ marginBottom: 20, color: '#27ae60' }}>🏦 긴급 경제 대책</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                        <button className="btn" disabled={isProcessing} onClick={() => handleCurrencyReform(0.1)} style={{ background: '#e67e22', padding: 15, fontSize: 16 }}> 📉 화폐 개혁 (전 재산 1/10 토막) </button>
                        <button className="btn" disabled={isProcessing} onClick={() => handleCapRich(100000000)} style={{ background: '#f1c40f', color: 'black', padding: 15, fontSize: 16 }}> ⚖️ 부자세 (1억 이상 압수) </button>
                        <button className="btn" disabled={isProcessing} onClick={handleResetAll} style={{ background: '#c0392b', padding: 15, fontSize: 16 }}> 🧨 시즌 초기화 (전원 0원) </button>
                    </div>
                </div>
            )}

            {/* ⚙️ 기능 관리 (암시장 추가됨) */}
            {tab === 'features' && (
                <div className="card" style={{ background: 'white', color: 'black', padding: 30, textAlign: 'center' }}>
                    <h2 style={{ marginBottom: 30, color:'#9b59b6' }}>⚙️ 인게임 기능 ON/OFF</h2>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '10px', width: '200px' }}>
                            <h3>💸 송금 기능</h3>
                            <button onClick={() => toggleFeature('transfer')} style={{ padding: '10px 20px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', background: features.transfer ? '#27ae60' : '#95a5a6', color: 'white' }}> {features.transfer ? "✅ 활성화됨" : "🔒 잠김"} </button>
                        </div>
                        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '10px', width: '200px' }}>
                            <h3>🚀 핵공격 기능</h3>
                            <button onClick={() => toggleFeature('attack')} style={{ padding: '10px 20px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', background: features.attack ? '#8e44ad' : '#95a5a6', color: 'white' }}> {features.attack ? "✅ 활성화됨" : "🔒 잠김"} </button>
                        </div>
                        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '10px', width: '200px' }}>
                            <h3>😈 암시장 기능</h3>
                            <button onClick={() => toggleFeature('shop')} style={{ padding: '10px 20px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', background: features.shop ? '#e67e22' : '#95a5a6', color: 'white' }}> {features.shop ? "✅ 활성화됨" : "🔒 잠김"} </button>
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