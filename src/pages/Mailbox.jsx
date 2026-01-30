// import React, { useState, useEffect } from 'react';
// import { db, auth } from '../firebase';
// import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, getDoc, limit } from 'firebase/firestore';
// import { useNavigate, useLocation } from 'react-router-dom'; // useLocation 추가
// import { useLanguage } from '../LanguageContext';

// export default function Mailbox() {
//     const navigate = useNavigate();
//     const location = useLocation(); // 추가됨
//     const user = auth.currentUser;
//     const { t } = useLanguage();
    
//     const [tab, setTab] = useState('inbox');
//     const [messages, setMessages] = useState([]);
    
//     // 쪽지 쓰기 관련
//     const [targetName, setTargetName] = useState("");
//     const [searchResults, setSearchResults] = useState([]);
//     const [selectedUser, setSelectedUser] = useState(null);
//     const [msgContent, setMsgContent] = useState("");

//     // ⭐ [추가됨] 게시판에서 '쪽지 보내기'로 들어왔을 때 처리
//     useEffect(() => {
//         if (location.state?.target) {
//             setTab('write');
//             setSelectedUser(location.state.target);
//             // state 초기화 (새로고침 시 유지 안되게)
//             window.history.replaceState({}, document.title);
//         }
//     }, [location]);

//     useEffect(() => {
//         if (!user) { navigate('/login'); return; }
//         fetchMessages();
//     }, [user, tab]);

//     // ... (이하 로직은 아까와 동일, 그대로 쓰시면 됩니다!)
//     // 📩 쪽지 목록 불러오기
//     const fetchMessages = async () => {
//         if (tab === 'write') return;
//         try {
//             const q = query(
//                 collection(db, "messages"),
//                 where(tab === 'inbox' ? "receiverUid" : "senderUid", "==", user.uid),
//                 orderBy("createdAt", "desc")
//             );
//             const snapshot = await getDocs(q);
//             setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
//         } catch (e) {
//             console.error(e);
//             if(e.code === 'failed-precondition') alert("DB 인덱스 생성 중입니다. 잠시 후 다시 시도해주세요.");
//         }
//     };

//     const handleSearchUser = async () => {
//         if (!targetName.trim()) return;
//         try {
//             const q = query(collection(db, "users"), where("name", ">=", targetName), where("name", "<=", targetName + "\uf8ff"), limit(5));
//             const querySnapshot = await getDocs(q);
//             const users = [];
//             querySnapshot.forEach((doc) => {
//                 if (doc.id !== user.uid) users.push({ id: doc.id, ...doc.data() });
//             });
//             setSearchResults(users);
//         } catch (e) { console.error(e); }
//     };

//     const handleSendMsg = async () => {
//         if (!selectedUser || !msgContent.trim()) return;
        
//         try {
//             const myDoc = await getDoc(doc(db, "users", user.uid));
//             const myName = myDoc.exists() ? myDoc.data().name : "Unknown";

//             await addDoc(collection(db, "messages"), {
//                 senderUid: user.uid,
//                 senderName: myName,
//                 receiverUid: selectedUser.id,
//                 receiverName: selectedUser.name,
//                 content: msgContent,
//                 isRead: false,
//                 createdAt: serverTimestamp()
//             });

//             // 🔔 알림 전송 (쪽지 받았다는 알림) - [추가됨]
//             await addDoc(collection(db, "notifications"), {
//                 receiverUid: selectedUser.id,
//                 senderUid: user.uid,
//                 senderName: myName,
//                 type: "msg", // 쪽지 타입
//                 msg: `📩 [${myName}]님이 쪽지를 보냈습니다.`,
//                 isRead: false,
//                 createdAt: serverTimestamp()
//             });

//             alert(t.mb_send_success);
//             setMsgContent("");
//             setSelectedUser(null);
//             setSearchResults([]);
//             setTargetName("");
//             setTab('sent');
//         } catch (e) {
//             console.error(e);
//             alert(t.alertError);
//         }
//     };

//     const handleReadMsg = async (msg) => {
//         if (tab === 'inbox' && !msg.isRead) {
//             const newMsgs = messages.map(m => m.id === msg.id ? { ...m, isRead: true } : m);
//             setMessages(newMsgs);
//             await updateDoc(doc(db, "messages", msg.id), { isRead: true });
//         }
//     };

//     const handleDeleteMsg = async (id) => {
//         if (!window.confirm(t.mb_delete_confirm)) return;
//         try {
//             await deleteDoc(doc(db, "messages", id));
//             setMessages(messages.filter(m => m.id !== id));
//         } catch (e) { console.error(e); }
//     };

//     const handleReply = (msg) => {
//         setTab('write');
//         setSelectedUser({ id: msg.senderUid, name: msg.senderName });
//     };

//     return (
//         <div className="container" style={{ paddingTop: 30, background: '#1e272e', minHeight: '100vh', color: 'white', padding: '20px' }}>
//             <h1 style={{ color: '#f1c40f', marginBottom: 20 }}>{t.mb_title}</h1>

//             <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
//                 <button onClick={() => setTab('inbox')} style={tabStyle(tab === 'inbox')}>{t.mb_inbox}</button>
//                 <button onClick={() => setTab('sent')} style={tabStyle(tab === 'sent')}>{t.mb_sent}</button>
//                 <button onClick={() => setTab('write')} style={tabStyle(tab === 'write', true)}>✏️ {t.mb_write}</button>
//             </div>

//             {tab === 'write' ? (
//                 <div style={{ background: '#2c3e50', padding: 20, borderRadius: 10 }}>
//                     {selectedUser ? (
//                         <div style={{ marginBottom: 15 }}>
//                             <span style={{ fontSize: 18, fontWeight: 'bold', color: '#2ecc71' }}>To. {selectedUser.name}</span>
//                             <button onClick={() => setSelectedUser(null)} style={{ marginLeft: 10, background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}>x {t.cancel}</button>
//                         </div>
//                     ) : (
//                         <div style={{ marginBottom: 20 }}>
//                             <div style={{ display:'flex', gap:5 }}>
//                                 <input 
//                                     className="input" 
//                                     style={{ flex:1, padding: 10 }} 
//                                     placeholder={t.mb_search_user} 
//                                     value={targetName} 
//                                     onChange={(e) => setTargetName(e.target.value)} 
//                                 />
//                                 <button className="btn" style={{ background: '#3498db' }} onClick={handleSearchUser}>{t.search}</button>
//                             </div>
//                             <div style={{ marginTop: 10 }}>
//                                 {searchResults.map(u => (
//                                     <div key={u.id} style={{ padding: '10px', background: '#34495e', borderBottom: '1px solid #444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                                         <span>{u.name}</span>
//                                         <button className="btn" style={{ padding: '5px 10px', fontSize: 12, background: '#2ecc71' }} onClick={() => setSelectedUser(u)}>{t.select}</button>
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>
//                     )}

//                     <textarea 
//                         style={{ width: '100%', height: '150px', padding: 10, borderRadius: 5, border: 'none', background: '#ecf0f1', color: '#000', marginBottom: 15 }} 
//                         placeholder={t.mb_content}
//                         value={msgContent}
//                         onChange={(e) => setMsgContent(e.target.value)}
//                     />
//                     <button className="btn" style={{ width: '100%', background: '#f1c40f', color: 'black', fontWeight: 'bold' }} onClick={handleSendMsg}>{t.mb_send_btn}</button>
//                 </div>
//             ) : (
//                 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
//                     {messages.length === 0 ? <p style={{ textAlign: 'center', color: '#777', padding: 30 }}>{t.mb_no_msg}</p> : 
//                      messages.map(msg => (
//                         <div key={msg.id} onClick={() => handleReadMsg(msg)} style={{ background: msg.isRead || tab === 'sent' ? '#34495e' : '#e67e22', padding: 15, borderRadius: 10, cursor: 'pointer', borderLeft: `5px solid ${msg.isRead || tab === 'sent' ? '#95a5a6' : '#f1c40f'}` }}>
//                             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
//                                 <span style={{ fontWeight: 'bold', color: '#fff' }}>
//                                     {tab === 'inbox' ? `${t.mb_sender}: ${msg.senderName}` : `${t.mb_receiver}: ${msg.receiverName}`}
//                                 </span>
//                                 <span style={{ fontSize: 12, color: '#ccc' }}>{msg.createdAt ? new Date(msg.createdAt.toDate()).toLocaleString() : ''}</span>
//                             </div>
//                             <div style={{ fontSize: 14, color: '#ecf0f1', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
//                                 {msg.content}
//                             </div>
//                             <div style={{ marginTop: 10, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
//                                 {tab === 'inbox' && <button onClick={(e) => { e.stopPropagation(); handleReply(msg); }} style={miniBtnStyle('#3498db')}>{t.mb_reply}</button>}
//                                 <button onClick={(e) => { e.stopPropagation(); handleDeleteMsg(msg.id); }} style={miniBtnStyle('#e74c3c')}>{t.bd_delete}</button>
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             )}

//             <button className="btn" style={{ marginTop: 30, background: '#444', width: '100%' }} onClick={() => navigate('/home')}>{t.home}</button>
//         </div>
//     );
// }

// const tabStyle = (active, isWrite = false) => ({
//     flex: 1,
//     padding: '10px',
//     background: active ? (isWrite ? '#27ae60' : '#f1c40f') : '#34495e',
//     color: active && !isWrite ? '#000' : '#fff',
//     border: 'none',
//     borderRadius: '5px',
//     fontWeight: 'bold',
//     cursor: 'pointer'
// });

// const miniBtnStyle = (color) => ({
//     background: color,
//     border: 'none',
//     borderRadius: 3,
//     padding: '3px 8px',
//     color: 'white',
//     cursor: 'pointer',
//     fontSize: 12
// });

import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, getDoc, limit } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

// 📅 오늘 날짜 구하는 함수
const getToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export default function Mailbox() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = auth.currentUser;
    const { t } = useLanguage();
    
    const [tab, setTab] = useState('inbox');
    const [messages, setMessages] = useState([]);
    
    // 쪽지 쓰기 관련
    const [targetName, setTargetName] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [msgContent, setMsgContent] = useState("");

    // 📝 [추가] 일일 제한 관련 상태
    const MAX_DAILY_MSG = 10; // 하루 10회
    const [dailyCount, setDailyCount] = useState(0); // 오늘 보낸 횟수

    // 내 정보(횟수) 가져오기
    const fetchMyInfo = async () => {
        if (!user) return;
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            const data = snap.data();
            const today = getToday();
            // 날짜가 다르면 0, 같으면 저장된 값 사용
            if (data.lastMsgDate !== today) {
                setDailyCount(0);
                // DB도 초기화 업데이트 (선택사항, 안해도 보낼때 체크함)
                updateDoc(userRef, { dailyMsgCount: 0, lastMsgDate: today });
            } else {
                setDailyCount(data.dailyMsgCount || 0);
            }
        }
    };

    useEffect(() => {
        if (location.state?.target) {
            setTab('write');
            setSelectedUser(location.state.target);
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        fetchMessages();
        fetchMyInfo(); // 내 정보(횟수) 확인
    }, [user, tab]);

    const fetchMessages = async () => {
        if (tab === 'write') return;
        try {
            const q = query(
                collection(db, "messages"),
                where(tab === 'inbox' ? "receiverUid" : "senderUid", "==", user.uid),
                orderBy("createdAt", "desc")
            );
            const snapshot = await getDocs(q);
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (e) {
            console.error(e);
            if(e.code === 'failed-precondition') alert("DB 인덱스 생성 중입니다. 잠시 후 다시 시도해주세요.");
        }
    };

    const handleSearchUser = async () => {
        if (!targetName.trim()) return;
        try {
            const q = query(collection(db, "users"), where("name", ">=", targetName), where("name", "<=", targetName + "\uf8ff"), limit(5));
            const querySnapshot = await getDocs(q);
            const users = [];
            querySnapshot.forEach((doc) => {
                if (doc.id !== user.uid) users.push({ id: doc.id, ...doc.data() });
            });
            setSearchResults(users);
        } catch (e) { console.error(e); }
    };

    const handleSendMsg = async () => {
        if (!selectedUser || !msgContent.trim()) return;
        
        // 🔒 [추가] 제한 체크 (클라이언트 단)
        if (dailyCount >= MAX_DAILY_MSG) return alert(t.limit_reached);

        try {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef); // 최신 데이터 다시 확인 (안전장치)
            const userData = userSnap.data();
            const today = getToday();
            
            // 날짜 확인 및 카운트 계산
            let currentCount = userData.dailyMsgCount || 0;
            if (userData.lastMsgDate !== today) currentCount = 0;

            if (currentCount >= MAX_DAILY_MSG) {
                setDailyCount(currentCount); // 상태 동기화
                return alert(t.limit_reached);
            }

            const myName = userData.name || "Unknown";

            await addDoc(collection(db, "messages"), {
                senderUid: user.uid,
                senderName: myName,
                receiverUid: selectedUser.id,
                receiverName: selectedUser.name,
                content: msgContent,
                isRead: false,
                createdAt: serverTimestamp()
            });

            await addDoc(collection(db, "notifications"), {
                receiverUid: selectedUser.id,
                senderUid: user.uid,
                senderName: myName,
                type: "msg", 
                msg: `📩 [${myName}]님이 쪽지를 보냈습니다.`,
                isRead: false,
                createdAt: serverTimestamp()
            });

            // 📝 [추가] 횟수 증가 업데이트
            const newCount = currentCount + 1;
            await updateDoc(userRef, {
                dailyMsgCount: newCount,
                lastMsgDate: today
            });
            setDailyCount(newCount); // 상태 업데이트

            alert(t.mb_send_success);
            setMsgContent("");
            setSelectedUser(null);
            setSearchResults([]);
            setTargetName("");
            setTab('sent');
        } catch (e) {
            console.error(e);
            alert(t.alertError);
        }
    };

    const handleReadMsg = async (msg) => {
        if (tab === 'inbox' && !msg.isRead) {
            const newMsgs = messages.map(m => m.id === msg.id ? { ...m, isRead: true } : m);
            setMessages(newMsgs);
            await updateDoc(doc(db, "messages", msg.id), { isRead: true });
        }
    };

    const handleDeleteMsg = async (id) => {
        if (!window.confirm(t.mb_delete_confirm)) return;
        try {
            await deleteDoc(doc(db, "messages", id));
            setMessages(messages.filter(m => m.id !== id));
        } catch (e) { console.error(e); }
    };

    const handleReply = (msg) => {
        setTab('write');
        setSelectedUser({ id: msg.senderUid, name: msg.senderName });
    };

    const tabStyle = (active, isWrite = false) => ({
        flex: 1,
        padding: '10px',
        background: active ? (isWrite ? '#27ae60' : '#f1c40f') : '#34495e',
        color: active && !isWrite ? '#000' : '#fff',
        border: 'none',
        borderRadius: '5px',
        fontWeight: 'bold',
        cursor: 'pointer'
    });

    const miniBtnStyle = (color) => ({
        background: color,
        border: 'none',
        borderRadius: 3,
        padding: '3px 8px',
        color: 'white',
        cursor: 'pointer',
        fontSize: 12
    });

    // 남은 횟수 계산
    const remainCount = Math.max(0, MAX_DAILY_MSG - dailyCount);

    return (
        <div className="container" style={{ paddingTop: 30, background: '#1e272e', minHeight: '100vh', color: 'white', padding: '20px' }}>
            <h1 style={{ color: '#f1c40f', marginBottom: 20 }}>{t.mb_title}</h1>

            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <button onClick={() => setTab('inbox')} style={tabStyle(tab === 'inbox')}>{t.mb_inbox}</button>
                <button onClick={() => setTab('sent')} style={tabStyle(tab === 'sent')}>{t.mb_sent}</button>
                <button onClick={() => setTab('write')} style={tabStyle(tab === 'write', true)}>✏️ {t.mb_write}</button>
            </div>

            {tab === 'write' ? (
                <div style={{ background: '#2c3e50', padding: 20, borderRadius: 10 }}>
                    
                    {/* 🟢 [추가] 남은 횟수 표시 */}
                    <div style={{textAlign:'right', marginBottom:10, fontSize:13, color: remainCount > 0 ? '#2ecc71' : '#e74c3c'}}>
                        {remainCount > 0 ? t.daily_limit_msg.replace('{n}', remainCount) : t.limit_reached}
                    </div>

                    {selectedUser ? (
                        <div style={{ marginBottom: 15 }}>
                            <span style={{ fontSize: 18, fontWeight: 'bold', color: '#2ecc71' }}>To. {selectedUser.name}</span>
                            <button onClick={() => setSelectedUser(null)} style={{ marginLeft: 10, background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}>x {t.cancel}</button>
                        </div>
                    ) : (
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ display:'flex', gap:5 }}>
                                <input 
                                    className="input" 
                                    style={{ flex:1, padding: 10 }} 
                                    placeholder={t.mb_search_user} 
                                    value={targetName} 
                                    onChange={(e) => setTargetName(e.target.value)} 
                                />
                                <button className="btn" style={{ background: '#3498db' }} onClick={handleSearchUser}>{t.search}</button>
                            </div>
                            <div style={{ marginTop: 10 }}>
                                {searchResults.map(u => (
                                    <div key={u.id} style={{ padding: '10px', background: '#34495e', borderBottom: '1px solid #444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>{u.name}</span>
                                        <button className="btn" style={{ padding: '5px 10px', fontSize: 12, background: '#2ecc71' }} onClick={() => setSelectedUser(u)}>{t.select}</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <textarea 
                        style={{ width: '100%', height: '150px', padding: 10, borderRadius: 5, border: 'none', background: '#ecf0f1', color: '#000', marginBottom: 15 }} 
                        placeholder={t.mb_content}
                        value={msgContent}
                        onChange={(e) => setMsgContent(e.target.value)}
                    />
                    
                    {/* 🔒 [수정] 횟수 다 쓰면 버튼 비활성화 */}
                    <button 
                        className="btn" 
                        style={{ width: '100%', background: remainCount > 0 ? '#f1c40f' : '#555', color: remainCount > 0 ? 'black' : '#ccc', fontWeight: 'bold', cursor: remainCount > 0 ? 'pointer' : 'not-allowed' }} 
                        onClick={handleSendMsg}
                        disabled={remainCount <= 0}
                    >
                        {remainCount > 0 ? t.mb_send_btn : t.limit_reached}
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {messages.length === 0 ? <p style={{ textAlign: 'center', color: '#777', padding: 30 }}>{t.mb_no_msg}</p> : 
                     messages.map(msg => (
                        <div key={msg.id} onClick={() => handleReadMsg(msg)} style={{ background: msg.isRead || tab === 'sent' ? '#34495e' : '#e67e22', padding: 15, borderRadius: 10, cursor: 'pointer', borderLeft: `5px solid ${msg.isRead || tab === 'sent' ? '#95a5a6' : '#f1c40f'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                <span style={{ fontWeight: 'bold', color: '#fff' }}>
                                    {tab === 'inbox' ? `${t.mb_sender}: ${msg.senderName}` : `${t.mb_receiver}: ${msg.receiverName}`}
                                </span>
                                <span style={{ fontSize: 12, color: '#ccc' }}>{msg.createdAt ? new Date(msg.createdAt.toDate()).toLocaleString() : ''}</span>
                            </div>
                            <div style={{ fontSize: 14, color: '#ecf0f1', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                {msg.content}
                            </div>
                            <div style={{ marginTop: 10, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                {tab === 'inbox' && <button onClick={(e) => { e.stopPropagation(); handleReply(msg); }} style={miniBtnStyle('#3498db')}>{t.mb_reply}</button>}
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteMsg(msg.id); }} style={miniBtnStyle('#e74c3c')}>{t.bd_delete}</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button className="btn" style={{ marginTop: 30, background: '#444', width: '100%' }} onClick={() => navigate('/home')}>{t.home}</button>
        </div>
    );
}