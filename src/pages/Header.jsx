// import React, { useEffect, useState, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { auth, db } from '../firebase';
// import { doc, updateDoc, increment, addDoc, collection, serverTimestamp, getDocs, query, where, getDoc, onSnapshot, orderBy, limit, writeBatch } from 'firebase/firestore';
// import { useLanguage } from '../LanguageContext';

// export default function Header({ point }) {
//   const navigate = useNavigate();
//   const [features, setFeatures] = useState({ transfer: true, attack: true });
//   const { t, toggleLang, lang } = useLanguage();
//   const user = auth.currentUser;

//   const [notifications, setNotifications] = useState([]);
//   const [showNoti, setShowNoti] = useState(false);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const notiRef = useRef(null);

//   useEffect(() => {
//     const unsub = onSnapshot(doc(db, "system", "features"), (docSnap) => {
//         if (docSnap.exists()) setFeatures(docSnap.data());
//     });
//     return () => unsub();
//   }, []);

//   useEffect(() => {
//     if (!user) return;
//     const q = query(collection(db, "notifications"), where("receiverUid", "==", user.uid), orderBy("createdAt", "desc"), limit(20));
//     const unsub = onSnapshot(q, (snapshot) => {
//         const notis = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//         setNotifications(notis);
//         setUnreadCount(notis.filter(n => !n.isRead).length);
//     });
//     return () => unsub();
//   }, [user]);

//   useEffect(() => {
//     if (user && unreadCount > 0) {
//         const hasShown = sessionStorage.getItem(`noti_alert_${user.uid}`);
//         if (!hasShown) {
//             setTimeout(() => {
//                 alert(t.alert_unread.replace('{n}', unreadCount));
//                 sessionStorage.setItem(`noti_alert_${user.uid}`, 'true');
//             }, 500);
//         }
//     }
//   }, [user, unreadCount, t]);

//   // ⭐ [수정] 알림 클릭 시 이동 로직 (쪽지 vs 게시글)
//   const handleNotiClick = async (noti) => {
//       if (!noti.isRead) { try { await updateDoc(doc(db, "notifications", noti.id), { isRead: true }); } catch(e) { console.error(e); } }
//       setShowNoti(false);
      
//       // 쪽지 알림이면 쪽지함으로, 아니면 게시글로
//       if (noti.type === 'msg') {
//           navigate('/mailbox');
//       } else if (noti.postId) {
//           navigate(`/board/${noti.postId}`);
//       }
//   };

//   const handleClearAll = async () => {
//       if (notifications.length === 0) return;
//       if (!window.confirm(t.noti_clear_confirm)) return;
//       try {
//           const batch = writeBatch(db);
//           notifications.forEach(n => {
//               const ref = doc(db, "notifications", n.id);
//               batch.delete(ref);
//           });
//           await batch.commit();
//       } catch (e) { console.error("Clear All Failed:", e); }
//   };

//   useEffect(() => {
//       const handleClickOutside = (event) => { if (notiRef.current && !notiRef.current.contains(event.target)) setShowNoti(false); };
//       document.addEventListener("mousedown", handleClickOutside);
//       return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const getNotiMessage = (n) => {
//       if (n.type === 'comment') return `💬 [${n.senderName}]${t.noti_comment}`;
//       if (n.type === 'reply') return `💬 [${n.senderName}]${t.noti_reply}`;
//       return n.msg;
//   };

//   const handleAttack = async () => {
//     // (기존 핵공격 로직 - 여기서는 안 쓰지만 코드 보존)
//     if (!features.attack) return alert(t.h_locked);
//     if (!user) return;
//     // ... (생략)
//   };

//   const handleTransfer = () => { if (!features.transfer) return alert(t.h_locked); navigate('/transfer'); };

//   return (
//     <header style={{ position: 'sticky', top: 0, zIndex: 100, background: '#2d3436', borderBottom: '1px solid #444', boxShadow: '0 4px 10px rgba(0,0,0,0.5)', paddingBottom: '5px', width: '100%' }}>
//       <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
//         {/* 1층: 로고 및 상단 아이콘 */}
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px 5px 15px', height: '55px' }}>
//             {/* ⭐ [수정] 이미지 로고 적용 (public/logo.png 필요) */}
//             <div onClick={() => navigate('/home')} style={{ cursor: 'pointer', display:'flex', alignItems:'center', marginRight: 'auto' }}>
//                 <img 
//                     src="/logo.png" 
//                     alt="Logo" 
//                     style={{ height: '40px', objectFit: 'contain' }} 
//                     onError={(e) => { e.target.style.display='none'; }} // 이미지 없으면 숨김
//                 />
//                 {/* 이미지가 없을 때를 대비한 백업 텍스트 (이미지가 로드되면 겹칠 수 있으니 필요시 제거 가능) */}
//                 <span style={{ fontSize: '20px', fontWeight: '900', color: '#f1c40f', marginLeft: '5px' }}>大当たり</span>
//             </div>

//             <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
//                 {/* ⭐ [신규] 신고 버튼 (사이렌 아이콘) */}
//                 <button 
//                     onClick={() => navigate('/report')} 
//                     style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', padding: 0 }}
//                     aria-label="신고"
//                 >
//                     🚨
//                 </button>

//                 {/* 알림 버튼 */}
//                 <div ref={notiRef} style={{ position: 'relative' }}>
//                     <button onClick={() => setShowNoti(!showNoti)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', position: 'relative', padding:0 }}>
//                         🔔{unreadCount > 0 && <span style={{ position: 'absolute', top: -2, right: -2, background: '#e74c3c', color: 'white', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{unreadCount}</span>}
//                     </button>
//                     {showNoti && (
//                         <div style={{ position: 'absolute', top: '40px', right: '-60px', width: '300px', background: '#222', border: '1px solid #444', borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.5)', zIndex: 999, overflow: 'hidden' }}>
//                             <div style={{ padding: '10px', borderBottom: '1px solid #444', fontWeight: 'bold', color: '#fff', fontSize:'14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
//                                 <span>{t.h_noti}</span>
//                                 {notifications.length > 0 && (
//                                     <span onClick={handleClearAll} style={{ fontSize:'11px', color:'#e74c3c', cursor:'pointer', textDecoration:'underline' }}>
//                                         {t.noti_clear}
//                                     </span>
//                                 )}
//                             </div>
//                             <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
//                                 {notifications.length === 0 ? <div style={{ padding: '20px', textAlign: 'center', color: '#777', fontSize: '13px' }}>{t.h_no_noti}</div> : notifications.map(n => <div key={n.id} onClick={() => handleNotiClick(n)} style={{ padding: '10px', borderBottom: '1px solid #333', cursor: 'pointer', background: n.isRead ? 'transparent' : 'rgba(241, 196, 15, 0.1)', fontSize: '13px', color: '#ddd' }}><div style={{fontWeight:'bold', color: n.isRead ? '#aaa' : '#f1c40f', marginBottom:4}}>{getNotiMessage(n)}</div><div style={{fontSize:'11px', color:'#666'}}>{n.createdAt ? new Date(n.createdAt.toDate()).toLocaleString() : ''}</div></div>)}
//                             </div>
//                         </div>
//                     )}
//                 </div>

//                 {/* 언어 버튼 */}
//                 <button onClick={toggleLang} style={{ background: 'rgba(0,0,0,0.3)', padding: '0 10px', borderRadius: '20px', border: '1px solid #f1c40f', color: '#f1c40f', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '30px' }}>{lang === 'ko' ? 'JP' : 'KR'}</button>
                
//                 {/* 돈 표시 */}
//                 <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0 12px', borderRadius: '20px', border: '1px solid #f1c40f', color: '#f1c40f', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', height: '30px', whiteSpace: 'nowrap' }}>💰 {point ? Math.floor(point).toLocaleString() : 0}</div>
//             </div>
//         </div>

//         {/* 2층: 메뉴 버튼들 */}
//         <div style={{ display: 'flex', padding: '0 10px 8px 10px', gap: '6px' }}>
//           {/* 💎 가챠 */}
//           <button onClick={() => navigate('/mining')} style={{ flex: 1, background: '#e056fd', border: 'none', borderRadius: '6px', padding: '6px 0', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px', display: 'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1px' }}>
//               <span style={{fontSize:'14px'}}>💎</span><span>{t.h_gacha}</span>
//           </button>
          
//           {/* ✉️ 쪽지함 */}
//           <button onClick={() => navigate('/mailbox')} style={{ flex: 1, background: '#16a085', border: 'none', borderRadius: '6px', padding: '6px 0', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px', display: 'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1px' }}>
//             <span style={{fontSize:'14px'}}>✉️</span><span>{t.h_mailbox}</span>
//           </button>

//           {/* 💸 송금 */}
//           <button onClick={handleTransfer} style={{ flex: 1, background: features.transfer ? '#27ae60' : '#3d3d3d', border: 'none', borderRadius: '6px', padding: '6px 0', color: features.transfer ? 'white' : '#777', cursor: features.transfer ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '11px', display: 'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1px' }}>
//             <span style={{fontSize:'14px'}}>{!features.transfer ? '🔒' : '💸'}</span><span>{t.h_transfer}</span>
//           </button>

//           {/* 📜 기록 (베팅 내역) - 부활! */}
//           <button onClick={() => navigate('/history')} style={{ flex: 1, background: '#3498db', border: 'none', borderRadius: '6px', padding: '6px 0', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px', display: 'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1px' }}>
//             <span style={{fontSize:'14px'}}>📜</span><span>{t.h_history}</span>
//           </button>
//         </div>
//       </div>
//     </header>
//   );
// }

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp, getDocs, query, where, getDoc, onSnapshot, orderBy, limit, writeBatch } from 'firebase/firestore';
import { useLanguage } from '../LanguageContext';

export default function Header({ point }) {
  const navigate = useNavigate();
  const [features, setFeatures] = useState({ transfer: true, attack: true });
  const { t, toggleLang, lang } = useLanguage();
  const user = auth.currentUser;

  const [notifications, setNotifications] = useState([]);
  const [showNoti, setShowNoti] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notiRef = useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "system", "features"), (docSnap) => {
        if (docSnap.exists()) setFeatures(docSnap.data());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "notifications"), where("receiverUid", "==", user.uid), orderBy("createdAt", "desc"), limit(20));
    const unsub = onSnapshot(q, (snapshot) => {
        const notis = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotifications(notis);
        setUnreadCount(notis.filter(n => !n.isRead).length);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (user && unreadCount > 0) {
        const hasShown = sessionStorage.getItem(`noti_alert_${user.uid}`);
        if (!hasShown) {
            setTimeout(() => {
                alert(t.alert_unread.replace('{n}', unreadCount));
                sessionStorage.setItem(`noti_alert_${user.uid}`, 'true');
            }, 500);
        }
    }
  }, [user, unreadCount, t]);

  // ⭐ [수정] 알림 클릭 로직 (소원권 포함 시 쪽지함 이동)
  const handleNotiClick = async (noti) => {
      if (!noti.isRead) { try { await updateDoc(doc(db, "notifications", noti.id), { isRead: true }); } catch(e) { console.error(e); } }
      setShowNoti(false);
      
      const msgContent = noti.msg || "";

      // 1. 쪽지 타입이거나, 내용에 '소원'이 있으면 쪽지함으로 이동
      if (noti.type === 'msg' || msgContent.includes('소원')) {
          navigate('/mailbox');
      } 
      // 2. 게시글 관련이면 게시판으로 이동
      else if (noti.postId) {
          navigate(`/board/${noti.postId}`);
      }
  };

  const handleClearAll = async () => {
      if (notifications.length === 0) return;
      if (!window.confirm(t.noti_clear_confirm)) return;
      try {
          const batch = writeBatch(db);
          notifications.forEach(n => {
              const ref = doc(db, "notifications", n.id);
              batch.delete(ref);
          });
          await batch.commit();
      } catch (e) { console.error("Clear All Failed:", e); }
  };

  useEffect(() => {
      const handleClickOutside = (event) => { if (notiRef.current && !notiRef.current.contains(event.target)) setShowNoti(false); };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getNotiMessage = (n) => {
      if (n.type === 'comment') return `💬 [${n.senderName}]${t.noti_comment}`;
      if (n.type === 'reply') return `💬 [${n.senderName}]${t.noti_reply}`;
      return n.msg;
  };

  const handleTransfer = () => { if (!features.transfer) return alert(t.h_locked); navigate('/transfer'); };

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, background: '#2d3436', borderBottom: '1px solid #444', boxShadow: '0 4px 10px rgba(0,0,0,0.5)', paddingBottom: '5px', width: '100%' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* 1층: 로고 및 상단 아이콘 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px 5px 15px', height: '55px' }}>
            <div onClick={() => navigate('/home')} style={{ cursor: 'pointer', display:'flex', alignItems:'center', marginRight: 'auto' }}>
                <img 
                    src="/logo.png" 
                    alt="Logo" 
                    style={{ height: '40px', objectFit: 'contain' }} 
                    onError={(e) => { e.target.style.display='none'; }} 
                />
                <span style={{ fontSize: '20px', fontWeight: '900', color: '#f1c40f', marginLeft: '5px' }}>大当たり</span>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {/* 신고 버튼 */}
                <button onClick={() => navigate('/report')} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', padding: 0 }}>🚨</button>

                {/* 알림 버튼 */}
                <div ref={notiRef} style={{ position: 'relative' }}>
                    <button onClick={() => setShowNoti(!showNoti)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', position: 'relative', padding:0 }}>
                        🔔{unreadCount > 0 && <span style={{ position: 'absolute', top: -2, right: -2, background: '#e74c3c', color: 'white', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{unreadCount}</span>}
                    </button>
                    
                    {/* ⭐ [수정] 알림창 UI (모바일 대응) */}
                    {showNoti && (
                        <div style={{ 
                            position: 'absolute', 
                            top: '45px', 
                            right: '-80px',  // 화면 오른쪽으로 치우치지 않게 왼쪽으로 당김
                            width: '300px', 
                            maxWidth: '92vw', // 모바일에서 화면 너비를 넘지 않도록 제한
                            background: '#222', 
                            border: '1px solid #444', 
                            borderRadius: '10px', 
                            boxShadow: '0 10px 25px rgba(0,0,0,0.7)', 
                            zIndex: 999, 
                            overflow: 'hidden' 
                        }}>
                            <div style={{ padding: '12px', borderBottom: '1px solid #444', fontWeight: 'bold', color: '#fff', fontSize:'14px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#2d3436' }}>
                                <span>{t.h_noti}</span>
                                {notifications.length > 0 && (
                                    <span onClick={handleClearAll} style={{ fontSize:'11px', color:'#e74c3c', cursor:'pointer', textDecoration:'underline' }}>
                                        {t.noti_clear}
                                    </span>
                                )}
                            </div>
                            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                                {notifications.length === 0 ? 
                                    <div style={{ padding: '30px', textAlign: 'center', color: '#777', fontSize: '13px' }}>{t.h_no_noti}</div> 
                                : notifications.map(n => (
                                    <div key={n.id} onClick={() => handleNotiClick(n)} style={{ padding: '12px', borderBottom: '1px solid #333', cursor: 'pointer', background: n.isRead ? 'transparent' : 'rgba(241, 196, 15, 0.08)', fontSize: '13px', color: '#ddd' }}>
                                        <div style={{fontWeight:'bold', color: n.isRead ? '#aaa' : '#f1c40f', marginBottom:4, lineHeight:'1.4'}}>{getNotiMessage(n)}</div>
                                        <div style={{fontSize:'11px', color:'#666'}}>{n.createdAt ? new Date(n.createdAt.toDate()).toLocaleString() : ''}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 언어 버튼 */}
                <button onClick={toggleLang} style={{ background: 'rgba(0,0,0,0.3)', padding: '0 10px', borderRadius: '20px', border: '1px solid #f1c40f', color: '#f1c40f', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '30px' }}>{lang === 'ko' ? 'JP' : 'KR'}</button>
                
                {/* 돈 표시 */}
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0 12px', borderRadius: '20px', border: '1px solid #f1c40f', color: '#f1c40f', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', height: '30px', whiteSpace: 'nowrap' }}>💰 {point ? Math.floor(point).toLocaleString() : 0}</div>
            </div>
        </div>

        {/* 2층: 메뉴 버튼들 */}
        <div style={{ display: 'flex', padding: '0 10px 8px 10px', gap: '6px' }}>
          <button onClick={() => navigate('/mining')} style={{ flex: 1, background: '#e056fd', border: 'none', borderRadius: '6px', padding: '6px 0', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px', display: 'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1px' }}>
              <span style={{fontSize:'14px'}}>💎</span><span>{t.h_gacha}</span>
          </button>
          
          <button onClick={() => navigate('/mailbox')} style={{ flex: 1, background: '#16a085', border: 'none', borderRadius: '6px', padding: '6px 0', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px', display: 'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1px' }}>
            <span style={{fontSize:'14px'}}>✉️</span><span>{t.h_mailbox}</span>
          </button>

          <button onClick={handleTransfer} style={{ flex: 1, background: features.transfer ? '#27ae60' : '#3d3d3d', border: 'none', borderRadius: '6px', padding: '6px 0', color: features.transfer ? 'white' : '#777', cursor: features.transfer ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '11px', display: 'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1px' }}>
            <span style={{fontSize:'14px'}}>{!features.transfer ? '🔒' : '💸'}</span><span>{t.h_transfer}</span>
          </button>

          <button onClick={() => navigate('/history')} style={{ flex: 1, background: '#3498db', border: 'none', borderRadius: '6px', padding: '6px 0', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px', display: 'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1px' }}>
            <span style={{fontSize:'14px'}}>📜</span><span>{t.h_history}</span>
          </button>
        </div>
      </div>
    </header>
  );
}