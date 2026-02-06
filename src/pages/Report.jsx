// import React, { useState, useEffect } from 'react';
// import { db, auth } from '../firebase';
// import { collection, query, where, getDocs, addDoc, serverTimestamp, getDoc, doc, limit } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';
// import { useLanguage } from '../LanguageContext';

// const ADMIN_EMAIL = "kks3172@naver.com";

// export default function Report() {
//     const navigate = useNavigate();
//     const user = auth.currentUser;
//     const { t } = useLanguage(); // 👈 번역 훅 사용

//     const [step, setStep] = useState(1);
//     const [targetName, setTargetName] = useState("");
//     const [searchResults, setSearchResults] = useState([]);
//     const [selectedTarget, setSelectedTarget] = useState(null);
//     const [selectedReason, setSelectedReason] = useState(null);
//     const [customReason, setCustomReason] = useState("");

//     // 신고 사유 리스트 (번역 적용)
//     const REPORT_REASONS = [
//         { id: 1, label: t.r_reason_1 },
//         { id: 2, label: t.r_reason_2 },
//         { id: 3, label: t.r_reason_3 },
//         { id: 4, label: t.r_reason_4 },
//         { id: 5, label: t.r_reason_5 }
//     ];

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

//     const handleSubmit = async () => {
//         if (!selectedTarget) return;
//         const reasonText = selectedReason === 5 ? customReason : REPORT_REASONS.find(r => r.id === selectedReason).label;
//         if (!reasonText.trim()) return alert(t.r_reason_input); // "구체적인 사유..."

//         if (!window.confirm(`[${selectedTarget.name}] ${t.r_confirm_ask}`)) return;

//         try {
//             const adminQuery = query(collection(db, "users"), where("email", "==", ADMIN_EMAIL));
//             const adminSnap = await getDocs(adminQuery);
//             if (adminSnap.empty) return alert(t.r_admin_fail);
//             const adminUser = adminSnap.docs[0];

//             const myDoc = await getDoc(doc(db, "users", user.uid));
//             const myName = myDoc.exists() ? myDoc.data().name : "Unknown";

//             await addDoc(collection(db, "messages"), {
//                 senderUid: user.uid,
//                 senderName: myName,
//                 receiverUid: adminUser.id,
//                 receiverName: "ADMIN",
//                 content: `🚨 [REPORT]\n\n- From: ${myName} (${user.email})\n- Target: ${selectedTarget.name} (${selectedTarget.email || 'Hidden'})\n- Reason: ${reasonText}\n- Date: ${new Date().toLocaleString()}`,
//                 isRead: false,
//                 createdAt: serverTimestamp()
//             });

//             await addDoc(collection(db, "notifications"), {
//                 receiverUid: adminUser.id,
//                 senderUid: user.uid,
//                 type: "msg",
//                 msg: `🚨 [${myName}] -> REPORT`,
//                 isRead: false,
//                 createdAt: serverTimestamp()
//             });

//             alert(t.r_complete);
//             navigate('/home');

//         } catch (e) {
//             console.error(e);
//             alert(t.alertError);
//         }
//     };

//     return (
//         <div className="container" style={{ paddingTop: 30, background: '#1e272e', minHeight: '100vh', color: 'white', padding: '20px' }}>
//             <h1 style={{ color: '#e74c3c', marginBottom: 20 }}>{t.r_title}</h1>

//             {step === 1 && (
//                 <div style={{ background: '#2c3e50', padding: 20, borderRadius: 10 }}>
//                     <h3 style={{marginTop:0}}>{t.r_step1}</h3>
//                     <div style={{ display:'flex', gap:5, marginBottom:15 }}>
//                         <input className="input" style={{ flex:1, padding:10 }} placeholder={t.searchNick} value={targetName} onChange={(e) => setTargetName(e.target.value)} />
//                         <button className="btn" style={{ background: '#3498db' }} onClick={handleSearchUser}>{t.search}</button>
//                     </div>
//                     <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
//                         {searchResults.map(u => (
//                             <div key={u.id} style={{ padding: '10px', background: '#34495e', borderBottom: '1px solid #444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                                 <span>{u.name} <span style={{fontSize:12, color:'#aaa'}}>({u.tierName})</span></span>
//                                 <button className="btn" style={{ padding: '5px 10px', fontSize: 12, background: '#e74c3c' }} onClick={() => { setSelectedTarget(u); setStep(2); }}>{t.select}</button>
//                             </div>
//                         ))}
//                         {searchResults.length === 0 && targetName && <p style={{textAlign:'center', color:'#777'}}>{t.noResult}</p>}
//                     </div>
//                 </div>
//             )}

//             {step === 2 && selectedTarget && (
//                 <div style={{ background: '#2c3e50', padding: 20, borderRadius: 10 }}>
//                     <h3 style={{marginTop:0}}>{t.r_step2}</h3>
//                     <p style={{color:'#f1c40f', fontWeight:'bold'}}>{t.r_target} {selectedTarget.name}</p>
                    
//                     <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
//                         {REPORT_REASONS.map(r => (
//                             <button 
//                                 key={r.id} 
//                                 onClick={() => setSelectedReason(r.id)}
//                                 style={{
//                                     padding: '12px',
//                                     background: selectedReason === r.id ? '#e74c3c' : '#34495e',
//                                     color: 'white', border: 'none', borderRadius: 5, textAlign:'left', cursor:'pointer', fontWeight:'bold'
//                                 }}
//                             >
//                                 {r.label}
//                             </button>
//                         ))}
//                     </div>

//                     {selectedReason === 5 && (
//                         <textarea 
//                             style={{ width: '100%', height: '80px', padding: 10, borderRadius: 5, border: 'none', marginBottom: 15 }} 
//                             placeholder={t.r_reason_input}
//                             value={customReason}
//                             onChange={(e) => setCustomReason(e.target.value)}
//                         />
//                     )}

//                     <div style={{ display:'flex', gap:10 }}>
//                         <button className="btn" style={{ flex:1, background: '#7f8c8d' }} onClick={() => setStep(1)}>{t.r_prev}</button>
//                         <button className="btn" style={{ flex:1, background: '#e74c3c' }} onClick={handleSubmit}>{t.r_submit}</button>
//                     </div>
//                 </div>
//             )}

//             <button className="btn" style={{ marginTop: 30, background: '#444', width: '100%' }} onClick={() => navigate('/home')}>{t.home}</button>
//         </div>
//     );
// }

import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
// 🔥 increment 추가됨
import { collection, query, where, getDocs, addDoc, serverTimestamp, getDoc, doc, limit, updateDoc, increment } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

const ADMIN_EMAIL = "kks3172@naver.com";

const getToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export default function Report() {
    const navigate = useNavigate();
    const user = auth.currentUser;
    const { t } = useLanguage();

    const [step, setStep] = useState(1);
    const [targetName, setTargetName] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedTarget, setSelectedTarget] = useState(null);
    const [selectedReason, setSelectedReason] = useState(null);
    const [customReason, setCustomReason] = useState("");

    const MAX_DAILY_REPORT = 3;
    const [dailyCount, setDailyCount] = useState(0);

    const REPORT_REASONS = [
        { id: 1, label: t.r_reason_1 },
        { id: 2, label: t.r_reason_2 },
        { id: 3, label: t.r_reason_3 },
        { id: 4, label: t.r_reason_4 },
        { id: 5, label: t.r_reason_5 }
    ];

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        const fetchMyInfo = async () => {
            const userRef = doc(db, "users", user.uid);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
                const data = snap.data();
                const today = getToday();
                if (data.lastReportDate !== today) {
                    setDailyCount(0);
                    updateDoc(userRef, { dailyReportCount: 0, lastReportDate: today });
                } else {
                    setDailyCount(data.dailyReportCount || 0);
                }
            }
        };
        fetchMyInfo();
    }, [user, navigate]);

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

    const handleSubmit = async () => {
        if (!selectedTarget) return;
        if (dailyCount >= MAX_DAILY_REPORT) return alert(t.limit_reached);

        const reasonText = selectedReason === 5 ? customReason : REPORT_REASONS.find(r => r.id === selectedReason).label;
        if (!reasonText.trim()) return alert(t.r_reason_input); 

        if (!window.confirm(`[${selectedTarget.name}] ${t.r_confirm_ask}`)) return;

        try {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef); 
            const userData = userSnap.data();
            const today = getToday();

            let currentCount = userData.dailyReportCount || 0;
            if (userData.lastReportDate !== today) currentCount = 0;

            if (currentCount >= MAX_DAILY_REPORT) {
                setDailyCount(currentCount);
                return alert(t.limit_reached);
            }

            const adminQuery = query(collection(db, "users"), where("email", "==", ADMIN_EMAIL));
            const adminSnap = await getDocs(adminQuery);
            if (adminSnap.empty) return alert(t.r_admin_fail);
            const adminUser = adminSnap.docs[0];

            const myName = userData.name || "Unknown";

            // 1. 관리자에게 쪽지 전송 (기존 유지)
            await addDoc(collection(db, "messages"), {
                senderUid: user.uid,
                senderName: myName,
                receiverUid: adminUser.id,
                receiverName: "ADMIN",
                content: `🚨 [REPORT]\n\n- From: ${myName} (${user.email})\n- Target: ${selectedTarget.name} (${selectedTarget.email || 'Hidden'})\n- Reason: ${reasonText}\n- Date: ${new Date().toLocaleString()}`,
                isRead: false,
                createdAt: serverTimestamp()
            });

            // 2. 관리자에게 알림 전송 (기존 유지)
            await addDoc(collection(db, "notifications"), {
                receiverUid: adminUser.id,
                senderUid: user.uid,
                type: "msg",
                msg: `🚨 [${myName}] -> REPORT`,
                isRead: false,
                createdAt: serverTimestamp()
            });

            // 🔥 3. [추가됨] 대상 유저의 신고 횟수(reportCount) 1 증가
            const targetUserRef = doc(db, "users", selectedTarget.id);
            await updateDoc(targetUserRef, {
                reportCount: increment(1)
            });

            // 4. 내 일일 신고 횟수 증가 (기존 유지)
            const newCount = currentCount + 1;
            await updateDoc(userRef, {
                dailyReportCount: newCount,
                lastReportDate: today
            });
            setDailyCount(newCount);

            alert(t.r_complete);
            navigate('/home');

        } catch (e) {
            console.error(e);
            alert(t.alertError);
        }
    };

    const remainCount = Math.max(0, MAX_DAILY_REPORT - dailyCount);

    return (
        <div className="container" style={{ paddingTop: 30, background: '#1e272e', minHeight: '100vh', color: 'white', padding: '20px' }}>
            <h1 style={{ color: '#e74c3c', marginBottom: 20 }}>{t.r_title}</h1>

            <div style={{ textAlign: 'center', marginBottom: 20, fontSize: 14, color: remainCount > 0 ? '#2ecc71' : '#e74c3c' }}>
                {remainCount > 0 ? t.daily_limit_report.replace('{n}', remainCount) : t.limit_reached}
            </div>

            {step === 1 && (
                <div style={{ background: '#2c3e50', padding: 20, borderRadius: 10 }}>
                    <h3 style={{marginTop:0}}>{t.r_step1}</h3>
                    <div style={{ display:'flex', gap:5, marginBottom:15 }}>
                        <input className="input" style={{ flex:1, padding:10 }} placeholder={t.searchNick} value={targetName} onChange={(e) => setTargetName(e.target.value)} />
                        <button className="btn" style={{ background: '#3498db' }} onClick={handleSearchUser}>{t.search}</button>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        {searchResults.map(u => (
                            <div key={u.id} style={{ padding: '10px', background: '#34495e', borderBottom: '1px solid #444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{u.name} <span style={{fontSize:12, color:'#aaa'}}>({u.tierName})</span></span>
                                <button className="btn" style={{ padding: '5px 10px', fontSize: 12, background: '#e74c3c' }} onClick={() => { setSelectedTarget(u); setStep(2); }}>{t.select}</button>
                            </div>
                        ))}
                        {searchResults.length === 0 && targetName && <p style={{textAlign:'center', color:'#777'}}>{t.noResult}</p>}
                    </div>
                </div>
            )}

            {step === 2 && selectedTarget && (
                <div style={{ background: '#2c3e50', padding: 20, borderRadius: 10 }}>
                    <h3 style={{marginTop:0}}>{t.r_step2}</h3>
                    <p style={{color:'#f1c40f', fontWeight:'bold'}}>{t.r_target} {selectedTarget.name}</p>
                    
                    <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
                        {REPORT_REASONS.map(r => (
                            <button 
                                key={r.id} 
                                onClick={() => setSelectedReason(r.id)}
                                style={{
                                    padding: '12px',
                                    background: selectedReason === r.id ? '#e74c3c' : '#34495e',
                                    color: 'white', border: 'none', borderRadius: 5, textAlign:'left', cursor:'pointer', fontWeight:'bold'
                                }}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>

                    {selectedReason === 5 && (
                        <textarea 
                            style={{ width: '100%', height: '80px', padding: 10, borderRadius: 5, border: 'none', marginBottom: 15 }} 
                            placeholder={t.r_reason_input}
                            value={customReason}
                            onChange={(e) => setCustomReason(e.target.value)}
                        />
                    )}

                    <div style={{ display:'flex', gap:10 }}>
                        <button className="btn" style={{ flex:1, background: '#7f8c8d' }} onClick={() => setStep(1)}>{t.r_prev}</button>
                        <button 
                            className="btn" 
                            style={{ flex:1, background: remainCount > 0 ? '#e74c3c' : '#555', cursor: remainCount > 0 ? 'pointer' : 'not-allowed' }} 
                            onClick={handleSubmit}
                            disabled={remainCount <= 0}
                        >
                            {t.r_submit}
                        </button>
                    </div>
                </div>
            )}

            <button className="btn" style={{ marginTop: 30, background: '#444', width: '100%' }} onClick={() => navigate('/home')}>{t.home}</button>
        </div>
    );
}