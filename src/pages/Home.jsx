// import React, { useEffect, useState } from 'react';
// import { db, auth } from '../firebase';
// import { collection, doc, getDoc, setDoc, getDocs, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';
// import { onAuthStateChanged, signOut } from 'firebase/auth';
// import { useLanguage } from '../LanguageContext';

// export default function Home() {
//   const [myPoint, setMyPoint] = useState(0);
//   const [myTierLevel, setMyTierLevel] = useState(0);
//   const [myTierName, setMyTierName] = useState("언랭크");
//   const [myName, setMyName] = useState("익명");
  
//   const [myTitle, setMyTitle] = useState(""); 
//   const [myTitleColor, setMyTitleColor] = useState(""); 

//   const [isAdmin, setIsAdmin] = useState(false);
//   const [rankers, setRankers] = useState([]);
//   const [reportRankers, setReportRankers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [notice, setNotice] = useState("");

//   const navigate = useNavigate();
//   const { t } = useLanguage();

//   const renderName = (name, title, color) => {
//     return (
//         <span>
//             {title && (
//                 <span style={{ color: color || '#e74c3c', fontWeight: 'bold', marginRight: '4px' }}>
//                     [{title}]
//                 </span>
//             )}
//             {name || "익명"}
//         </span>
//     );
//   };

//   useEffect(() => {
//     const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
//       if (user) {
//         if (user.email === "kks3172@naver.com") setIsAdmin(true);
        
//         const userRef = doc(db, "users", user.uid);

//         const unsubUser = onSnapshot(userRef, (docSnap) => {
//             if (docSnap.exists()) {
//                 const data = docSnap.data();
//                 setMyPoint(data.point || 0);
//                 setMyTierLevel(data.tierLevel || 0);
//                 setMyTierName(data.tierName || "언랭크");
//                 setMyName(data.name || "익명");
//                 setMyTitle(data.userTitle || ""); 
//                 setMyTitleColor(data.userTitleColor || ""); 
//             } else {
//                 setDoc(userRef, { email: user.email, name: "익명", point: 30000, tierLevel: 0, tierName: "언랭크" }, { merge: true });
//             }
//             setLoading(false);
//         });

//         getDoc(doc(db, "system", "notice")).then(snap => {
//             if(snap.exists()) setNotice(snap.data().text || "");
//         });

//         try {
//             const rankQ = query(collection(db, "users"), orderBy("tierLevel", "desc"), limit(50));
//             const rankSnap = await getDocs(rankQ);
            
//             const fetchedUsers = rankSnap.docs.map(d => ({
//                 name: d.data().name,
//                 point: d.data().point || 0,
//                 tierLevel: d.data().tierLevel || 0,
//                 tierName: d.data().tierName || "언랭크",
//                 userTitle: d.data().userTitle || "",
//                 userTitleColor: d.data().userTitleColor || ""
//             }));

//             fetchedUsers.sort((a, b) => {
//                 if (b.tierLevel !== a.tierLevel) return b.tierLevel - a.tierLevel;
//                 return b.point - a.point;
//             });

//             setRankers(fetchedUsers.slice(0, 10));
//         } catch (e) { console.error("Ranking Error:", e); }

//         try {
//             const reportQ = query(collection(db, "users"), orderBy("reportCount", "desc"), limit(3));
//             const reportSnap = await getDocs(reportQ);
//             const reports = reportSnap.docs
//                 .map(d => ({ 
//                     name: d.data().name, 
//                     count: d.data().reportCount || 0,
//                     userTitle: d.data().userTitle || "",
//                     userTitleColor: d.data().userTitleColor || ""
//                 }))
//                 .filter(u => u.count > 0);
//             setReportRankers(reports);
//         } catch(e) {}

//         return () => unsubUser();

//       } else {
//         navigate('/login');
//       }
//     });
//     return () => unsubscribeAuth();
//   }, [navigate]);

//   if (loading) return <div style={{ background: '#2c3e50', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}><h2>Loading...</h2></div>;

//   return (
//     <div style={{ background: '#2c3e50', minHeight: '100vh', width: '100%', display: 'flex', justifyContent: 'center' }}>
//       <div className="container" style={{ width: '100%', maxWidth: '600px', padding: 20, color: 'white', position: 'relative' }}>

//         <div className="card" style={{
//           marginBottom: 15, background: '#34495e', padding: 15, borderRadius: 10,
//           display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//           border: '1px solid #7f8c8d', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', marginTop: 10
//         }}>
//           <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
//             <div style={{ width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '50%' }}>
//               <img
//                 src={`/tiers/${myTierLevel}.png`}
//                 alt={myTierName}
//                 style={{ width: '80%', height: '80%', objectFit: 'contain' }}
//                 onError={e => e.target.style.display = 'none'}
//               />
//             </div>
//             <div>
//               <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginBottom: 2 }}>
//                 {renderName(myName, myTitle, myTitleColor)} 
//                 <span style={{fontSize:'12px', color:'#bdc3c7', fontWeight:'normal', marginLeft: 5}}>({myTierName})</span>
//               </div>
//               <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#f1c40f' }}>{Math.floor(myPoint).toLocaleString()}원</span>
//             </div>
//           </div>
//           <button className="btn" style={{ background: '#e74c3c', fontSize: '12px', padding: '8px 12px', borderRadius: '6px', border:'none', color:'white', cursor:'pointer' }} onClick={() => signOut(auth)}>{t.logout}</button>
//         </div>

//         <button className="card" style={{
//           width: '100%',
//           background: 'linear-gradient(90deg, #8e44ad, #c0392b)',
//           border: '2px solid #f1c40f',
//           borderRadius: '10px',
//           marginBottom: 20, padding: 15, cursor: 'pointer',
//           boxShadow: '0 4px 10px rgba(241, 196, 15, 0.2)',
//           display: 'flex', alignItems:'center', justifyContent:'center'
//         }} onClick={() => navigate('/shop')}>
//           <div style={{ textAlign: 'center', color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
//             {t.shop}
//           </div>
//         </button>

//         {notice && (
//           <div style={{ background: '#f39c12', color: '#2c3e50', padding: '10px 15px', marginBottom: '20px', borderRadius: '8px', display: 'flex', alignItems: 'center', fontWeight: 'bold', border: '1px solid #e67e22' }}>
//             <span style={{ marginRight: '10px' }}>{t.notice}</span><marquee>{notice}</marquee>
//           </div>
//         )}

//         <div className="card" style={{ background: '#222', border: '2px solid #f1c40f', marginBottom: 10, borderRadius: '10px', overflow:'hidden' }}>
//           <div style={{ textAlign: 'center', background: '#2c3e50', padding: '10px', color: '#f1c40f', fontWeight: 'bold', fontSize: '16px', borderBottom: '1px solid #444' }}>{t.rank} TOP 10</div>

//           <div style={{ display: 'flex', flexDirection: 'column', padding: '5px' }}>
//             {rankers.map((user, idx) => (
//               <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', borderBottom: idx !== rankers.length - 1 ? '1px solid #333' : 'none', background: idx === 0 ? 'rgba(241, 196, 15, 0.1)' : 'transparent' }}>
//                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
//                   <span style={{ width: '20px', textAlign: 'center', color: idx < 3 ? '#f1c40f' : '#7f8c8d', fontWeight: 'bold', fontSize:'14px' }}>{idx + 1}</span>
//                   <img
//                     src={`/tiers/${user.tierLevel}.png`}
//                     alt={user.tierName}
//                     style={{ width: '25px', height: '25px', objectFit: 'contain' }}
//                     onError={e => e.target.style.display = 'none'}
//                   />
//                   <span style={{ fontSize: '14px', fontWeight: idx===0?'bold':'normal' }}>
//                       {renderName(user.name, user.userTitle, user.userTitleColor)}
//                   </span>
//                 </div>
//                 <span style={{ color: '#f1c40f', fontSize: '14px', fontWeight: 'bold' }}>{Math.floor(user.point).toLocaleString()}</span>
//               </div>
//             ))}
//           </div>
//           <div style={{ textAlign: 'center', padding: '10px', background:'#2c3e50', borderTop:'1px solid #444' }}>
//             <button onClick={() => window.location.reload()} style={{ fontSize: '12px', background: 'transparent', border: 'none', color: '#bdc3c7', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', width:'100%' }}>{t.updateRank}</button>
//           </div>
//         </div>

//         {reportRankers.length > 0 && (
//             <div className="card" style={{ background: '#c0392b', border: '1px solid #e74c3c', marginBottom: 20, borderRadius: '10px', overflow:'hidden' }}>
//                 <div style={{ textAlign: 'center', padding: '8px', color: 'white', fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
//                     🚨 {t.ad_report_rank || "불량 이용자 (신고 TOP 3)"}
//                 </div>
//                 <div style={{ padding: '5px 10px' }}>
//                     {reportRankers.map((u, i) => (
//                         <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0', borderBottom: i < reportRankers.length-1 ? '1px solid rgba(255,255,255,0.1)' : 'none', color: 'white' }}>
//                             <span>{i+1}. <strong>{renderName(u.name, u.userTitle, u.userTitleColor)}</strong></span>
//                             <span style={{fontWeight:'bold', color:'#f1c40f'}}>{u.count}</span>
//                         </div>
//                     ))}
//                 </div>
//             </div>
//         )}

//         {/* 🔥 [수정] 게임 버튼 디자인 통일 */}
//         <div className="card" style={{
//           background: '#34495e',
//           border: '2px solid #f1c40f',
//           marginBottom: 20, padding: '20px',
//           borderRadius: '10px',
//           position: 'relative',
//           marginTop: '30px'
//         }}>
//           <div style={{
//             position: 'absolute', top: -14, left: 20, background: '#2c3e50', padding: '0 15px',
//             color: '#f1c40f', fontWeight: 'bold', fontSize: '18px',
//             border: '2px solid #f1c40f', borderRadius: '20px'
//           }}>
//             {t.gameZone}
//           </div>

//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: 15 }}>
//             {/* 메인 대형 버튼 */}
//             <button className="btn" style={{ background: 'linear-gradient(45deg, #6a11cb 0%, #2575fc 100%)', padding: '20px', borderRadius: '10px', gridColumn: 'span 2', fontSize: '18px', fontWeight:'bold', border: '1px solid rgba(255,255,255,0.2)', color:'white', cursor:'pointer' }} onClick={() => navigate('/gamelobby')}>{t.pvp}</button>
//             <button className="btn" style={{ background: '#b6cf26', padding: '15px', borderRadius: '10px', fontSize: '16px', gridColumn: 'span 2', fontWeight:'bold', border:'none', color:'#2c3e50', cursor:'pointer' }} onClick={() => navigate('/board')}>{t.cafe}</button>
            
//             <div style={{ gridColumn: 'span 2', height: '1px', background: '#555', margin: '10px 0' }} />
            
//             {/* 아케이드 게임 */}
//             <GameBtn title={t.highway || "Highway"} color="linear-gradient(135deg, #f1c40f 0%, #f39c12 100%)" onClick={() => navigate('/coinpusher')} isNew={true} />
//             <GameBtn title={t.stack || "Stack"} color="linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)" onClick={() => navigate('/stack')} isNew={true} />
            
//             {/* 퍼즐 게임 */}
//             <GameBtn title={t.g_2048_title || "2048"} color="#bbada0" onClick={() => navigate('/game2048')} />
//             {/* <GameBtn title={t.g_suika_title || "수박게임"} color="#4CAF50" onClick={() => navigate('/suika')} /> */}
//             <GameBtn title={t.apple} color="#e74c3c" onClick={() => navigate('/apple-single')} />
//             <GameBtn title={t.ostrich} color="#ff6b6b" onClick={() => navigate('/ostrich')} />

//             {/* 베팅 게임 */}
//             <GameBtn title={t.oddEven} color="#e74c3c" onClick={() => navigate('/game')} />
//             <GameBtn title={t.slot} color="#8e44ad" onClick={() => navigate('/slot')} />
//             <GameBtn title={t.rps} color="#2980b9" onClick={() => navigate('/rps')} />
//             <GameBtn title={t.blackjack} color="#d35400" onClick={() => navigate('/blackjack')} />
//             <GameBtn title={t.angelDemon} color="#f39c12" onClick={() => navigate('/roulette')} />
//             <GameBtn title={t.mines} color="#16a085" onClick={() => navigate('/mines')} />
//             <GameBtn title={t.graph} color="#9b59b6" onClick={() => navigate('/crash')} />
//             <GameBtn title={t.highlow} color="#2c3e50" border="#7f8c8d" onClick={() => navigate('/highlow')} />
//           </div>
//         </div>

//         {isAdmin && (
//           <div className="card" style={{ background: '#2c3e50', border: '2px dashed #f1c40f', marginBottom: 20, padding: 15, borderRadius:'10px' }}>
//             <div style={{ marginBottom: 10, textAlign: 'center', color: '#f1c40f', fontWeight: 'bold' }}>{t.adminOnly}</div>
//             <div className="flex-row">
//               <button className="btn" style={{ width: '100%', background: '#333', border: '1px solid #555', padding:'10px', color:'white', cursor:'pointer', borderRadius:'6px' }} onClick={() => navigate('/admin')}>{t.adminPage}</button>
//             </div>
//           </div>
//         )}

//       </div>
//     </div>
//   );
// }

// // 버튼 컴포넌트 (통일성 유지)
// function GameBtn({ title, color, onClick, border, isNew }) {
//     return (
//         <button onClick={onClick} style={{ 
//             background: color, 
//             padding: '15px 5px', 
//             borderRadius: '8px', 
//             color: 'white', 
//             border: border ? `1px solid ${border}` : 'none', 
//             cursor: 'pointer', 
//             fontWeight: 'bold', 
//             fontSize: '14px', 
//             width: '100%', 
//             boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
//             position: 'relative'
//         }}>
//             {title}
//             {isNew && (
//                 <span style={{ position: 'absolute', top: -5, right: -5, fontSize: '10px', background: '#e74c3c', color: 'white', padding: '2px 6px', borderRadius: '10px', fontWeight:'bold', boxShadow:'0 2px 4px rgba(0,0,0,0.3)' }}>N</span>
//             )}
//         </button>
//     );
// }

import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, doc, getDoc, setDoc, getDocs, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useLanguage } from '../LanguageContext';

export default function Home() {
  const [myPoint, setMyPoint] = useState(0);
  const [myTierLevel, setMyTierLevel] = useState(0);
  const [myTierName, setMyTierName] = useState("언랭크");
  const [myName, setMyName] = useState("익명");
  
  const [myTitle, setMyTitle] = useState(""); 
  const [myTitleColor, setMyTitleColor] = useState(""); 

  const [isAdmin, setIsAdmin] = useState(false);
  const [rankers, setRankers] = useState([]);
  const [reportRankers, setReportRankers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const navigate = useNavigate();
  const { t } = useLanguage();

  const renderName = (name, title, color) => {
    return (
        <span>
            {title && (
                <span style={{ color: color || '#e74c3c', fontWeight: 'bold', marginRight: '4px' }}>
                    [{title}]
                </span>
            )}
            {name || "익명"}
        </span>
    );
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (user.email === "kks3172@naver.com") setIsAdmin(true);
        
        const userRef = doc(db, "users", user.uid);

        const unsubUser = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setMyPoint(data.point || 0);
                setMyTierLevel(data.tierLevel || 0);
                setMyTierName(data.tierName || "언랭크");
                setMyName(data.name || "익명");
                setMyTitle(data.userTitle || ""); 
                setMyTitleColor(data.userTitleColor || ""); 
            } else {
                setDoc(userRef, { email: user.email, name: "익명", point: 30000, tierLevel: 0, tierName: "언랭크" }, { merge: true });
            }
            setLoading(false);
        });

        getDoc(doc(db, "system", "notice")).then(snap => {
            if(snap.exists()) setNotice(snap.data().text || "");
        });

        try {
            const rankQ = query(collection(db, "users"), orderBy("tierLevel", "desc"), limit(50));
            const rankSnap = await getDocs(rankQ);
            
            const fetchedUsers = rankSnap.docs.map(d => ({
                name: d.data().name,
                point: d.data().point || 0,
                tierLevel: d.data().tierLevel || 0,
                tierName: d.data().tierName || "언랭크",
                userTitle: d.data().userTitle || "",
                userTitleColor: d.data().userTitleColor || ""
            }));

            fetchedUsers.sort((a, b) => {
                if (b.tierLevel !== a.tierLevel) return b.tierLevel - a.tierLevel;
                return b.point - a.point;
            });

            setRankers(fetchedUsers.slice(0, 10));
        } catch (e) { console.error("Ranking Error:", e); }

        try {
            const reportQ = query(collection(db, "users"), orderBy("reportCount", "desc"), limit(3));
            const reportSnap = await getDocs(reportQ);
            const reports = reportSnap.docs
                .map(d => ({ 
                    name: d.data().name, 
                    count: d.data().reportCount || 0,
                    userTitle: d.data().userTitle || "",
                    userTitleColor: d.data().userTitleColor || ""
                }))
                .filter(u => u.count > 0);
            setReportRankers(reports);
        } catch(e) {}

        return () => unsubUser();

      } else {
        navigate('/login');
      }
    });
    return () => unsubscribeAuth();
  }, [navigate]);

  if (loading) return <div style={{ background: '#2c3e50', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}><h2>Loading...</h2></div>;

  return (
    <div style={{ background: '#2c3e50', minHeight: '100vh', width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div className="container" style={{ width: '100%', maxWidth: '600px', padding: 20, color: 'white', position: 'relative' }}>

        <div className="card" style={{
          marginBottom: 15, background: '#34495e', padding: 15, borderRadius: 10,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          border: '1px solid #7f8c8d', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', marginTop: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '50%' }}>
              <img
                src={`/tiers/${myTierLevel}.png`}
                alt={myTierName}
                style={{ width: '80%', height: '80%', objectFit: 'contain' }}
                onError={e => e.target.style.display = 'none'}
              />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginBottom: 2 }}>
                {renderName(myName, myTitle, myTitleColor)} 
                <span style={{fontSize:'12px', color:'#bdc3c7', fontWeight:'normal', marginLeft: 5}}>({myTierName})</span>
              </div>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#f1c40f' }}>{Math.floor(myPoint).toLocaleString()}원</span>
            </div>
          </div>
          <button className="btn" style={{ background: '#e74c3c', fontSize: '12px', padding: '8px 12px', borderRadius: '6px', border:'none', color:'white', cursor:'pointer' }} onClick={() => signOut(auth)}>{t.logout}</button>
        </div>

        <button className="card" style={{
          width: '100%',
          background: 'linear-gradient(90deg, #8e44ad, #c0392b)',
          border: '2px solid #f1c40f',
          borderRadius: '10px',
          marginBottom: 20, padding: 15, cursor: 'pointer',
          boxShadow: '0 4px 10px rgba(241, 196, 15, 0.2)',
          display: 'flex', alignItems:'center', justifyContent:'center'
        }} onClick={() => navigate('/shop')}>
          <div style={{ textAlign: 'center', color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
            {t.shop}
          </div>
        </button>

        {notice && (
          <div style={{ background: '#f39c12', color: '#2c3e50', padding: '10px 15px', marginBottom: '20px', borderRadius: '8px', display: 'flex', alignItems: 'center', fontWeight: 'bold', border: '1px solid #e67e22' }}>
            <span style={{ marginRight: '10px' }}>{t.notice}</span><marquee>{notice}</marquee>
          </div>
        )}

        <div className="card" style={{ background: '#222', border: '2px solid #f1c40f', marginBottom: 10, borderRadius: '10px', overflow:'hidden' }}>
          <div style={{ textAlign: 'center', background: '#2c3e50', padding: '10px', color: '#f1c40f', fontWeight: 'bold', fontSize: '16px', borderBottom: '1px solid #444' }}>{t.rank} TOP 10</div>

          <div style={{ display: 'flex', flexDirection: 'column', padding: '5px' }}>
            {rankers.map((user, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', borderBottom: idx !== rankers.length - 1 ? '1px solid #333' : 'none', background: idx === 0 ? 'rgba(241, 196, 15, 0.1)' : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '20px', textAlign: 'center', color: idx < 3 ? '#f1c40f' : '#7f8c8d', fontWeight: 'bold', fontSize:'14px' }}>{idx + 1}</span>
                  <img
                    src={`/tiers/${user.tierLevel}.png`}
                    alt={user.tierName}
                    style={{ width: '25px', height: '25px', objectFit: 'contain' }}
                    onError={e => e.target.style.display = 'none'}
                  />
                  <span style={{ fontSize: '14px', fontWeight: idx===0?'bold':'normal' }}>
                      {renderName(user.name, user.userTitle, user.userTitleColor)}
                  </span>
                </div>
                <span style={{ color: '#f1c40f', fontSize: '14px', fontWeight: 'bold' }}>{Math.floor(user.point).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', padding: '10px', background:'#2c3e50', borderTop:'1px solid #444' }}>
            <button onClick={() => window.location.reload()} style={{ fontSize: '12px', background: 'transparent', border: 'none', color: '#bdc3c7', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', width:'100%' }}>{t.updateRank}</button>
          </div>
        </div>

        {reportRankers.length > 0 && (
            <div className="card" style={{ background: '#c0392b', border: '1px solid #e74c3c', marginBottom: 20, borderRadius: '10px', overflow:'hidden' }}>
                <div style={{ textAlign: 'center', padding: '8px', color: 'white', fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                    🚨 {t.ad_report_rank || "불량 이용자 (신고 TOP 3)"}
                </div>
                <div style={{ padding: '5px 10px' }}>
                    {reportRankers.map((u, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0', borderBottom: i < reportRankers.length-1 ? '1px solid rgba(255,255,255,0.1)' : 'none', color: 'white' }}>
                            <span>{i+1}. <strong>{renderName(u.name, u.userTitle, u.userTitleColor)}</strong></span>
                            <span style={{fontWeight:'bold', color:'#f1c40f'}}>{u.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* 🔥 GAME ZONE */}
        <div className="card" style={{
          background: '#34495e',
          border: '2px solid #f1c40f',
          marginBottom: 20, padding: '20px',
          borderRadius: '10px',
          position: 'relative',
          marginTop: '30px'
        }}>
          <div style={{
            position: 'absolute', top: -14, left: 20, background: '#2c3e50', padding: '0 15px',
            color: '#f1c40f', fontWeight: 'bold', fontSize: '18px',
            border: '2px solid #f1c40f', borderRadius: '20px'
          }}>
            {t.gameZone}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: 15 }}>
            <button className="btn" style={{ background: 'linear-gradient(45deg, #6a11cb 0%, #2575fc 100%)', padding: '20px', borderRadius: '10px', gridColumn: 'span 2', fontSize: '18px', fontWeight:'bold', border: '1px solid rgba(255,255,255,0.2)', color:'white', cursor:'pointer' }} onClick={() => navigate('/gamelobby')}>{t.pvp}</button>
            <button className="btn" style={{ background: '#b6cf26', padding: '15px', borderRadius: '10px', fontSize: '16px', gridColumn: 'span 2', fontWeight:'bold', border:'none', color:'#2c3e50', cursor:'pointer' }} onClick={() => navigate('/board')}>{t.cafe}</button>
            
            <div style={{ gridColumn: 'span 2', height: '1px', background: '#555', margin: '10px 0' }} />
            
            {/* 아케이드 게임 */}
            <GameBtn title={t.highway || "Highway"} color="linear-gradient(135deg, #f1c40f 0%, #f39c12 100%)" onClick={() => navigate('/coinpusher')} isNew={true} />
            <GameBtn title={t.stack || "Stack"} color="linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)" onClick={() => navigate('/stack')} isNew={true} />
            
            {/* 퍼즐 게임 */}
            <GameBtn title={t.g_2048_title || "2048"} color="#bbada0" onClick={() => navigate('/game2048')} />
            {/* 🔥 [추가] 수박게임 버튼 활성화 */}
            <GameBtn title={t.g_suika_title || "수박게임"} color="#4CAF50" onClick={() => navigate('/suika')} isNew={true} />
            
            <GameBtn title={t.apple} color="#e74c3c" onClick={() => navigate('/apple-single')} />
            <GameBtn title={t.ostrich} color="#ff6b6b" onClick={() => navigate('/ostrich')} />

            {/* 베팅 게임 */}
            <GameBtn title={t.oddEven} color="#e74c3c" onClick={() => navigate('/game')} />
            <GameBtn title={t.slot} color="#8e44ad" onClick={() => navigate('/slot')} />
            <GameBtn title={t.rps} color="#2980b9" onClick={() => navigate('/rps')} />
            <GameBtn title={t.blackjack} color="#d35400" onClick={() => navigate('/blackjack')} />
            <GameBtn title={t.angelDemon} color="#f39c12" onClick={() => navigate('/roulette')} />
            <GameBtn title={t.mines} color="#16a085" onClick={() => navigate('/mines')} />
            <GameBtn title={t.graph} color="#9b59b6" onClick={() => navigate('/crash')} />
            <GameBtn title={t.highlow} color="#2c3e50" border="#7f8c8d" onClick={() => navigate('/highlow')} />
              <GameBtn title={t.g_tetris_title || "🧱 테트리스"} color="#9b59b6" onClick={() => navigate('/tetris')} isNew={true} />
          </div>
        </div>

        {isAdmin && (
          <div className="card" style={{ background: '#2c3e50', border: '2px dashed #f1c40f', marginBottom: 20, padding: 15, borderRadius:'10px' }}>
            <div style={{ marginBottom: 10, textAlign: 'center', color: '#f1c40f', fontWeight: 'bold' }}>{t.adminOnly}</div>
            <div className="flex-row">
              <button className="btn" style={{ width: '100%', background: '#333', border: '1px solid #555', padding:'10px', color:'white', cursor:'pointer', borderRadius:'6px' }} onClick={() => navigate('/admin')}>{t.adminPage}</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// 버튼 컴포넌트
function GameBtn({ title, color, onClick, border, isNew }) {
    return (
        <button onClick={onClick} style={{ 
            background: color, 
            padding: '15px 5px', 
            borderRadius: '8px', 
            color: 'white', 
            border: border ? `1px solid ${border}` : 'none', 
            cursor: 'pointer', 
            fontWeight: 'bold', 
            fontSize: '14px', 
            width: '100%', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            position: 'relative'
        }}>
            {title}
            {isNew && (
                <span style={{ position: 'absolute', top: -5, right: -5, fontSize: '10px', background: '#e74c3c', color: 'white', padding: '2px 6px', borderRadius: '10px', fontWeight:'bold', boxShadow:'0 2px 4px rgba(0,0,0,0.3)' }}>N</span>
            )}
        </button>
    );
}