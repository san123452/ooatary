// import React, { useState, useEffect } from 'react';
// import { db, auth } from '../firebase';
// import { collection, query, where, getDocs, doc, runTransaction, limit, addDoc, serverTimestamp } from 'firebase/firestore'; 
// import { useNavigate } from 'react-router-dom';
// import { useLanguage } from '../LanguageContext';

// export default function Transfer() {
//   const [point, setPoint] = useState(0);
//   const [targetName, setTargetName] = useState(""); 
//   const [amount, setAmount] = useState("");         
//   const [loading, setLoading] = useState(false);
  
//   const [searchResults, setSearchResults] = useState([]); 
//   const [isSearching, setIsSearching] = useState(false);

//   const navigate = useNavigate();
//   const user = auth.currentUser;
//   const { t } = useLanguage();

//   useEffect(() => {
//     if (!user) { navigate('/login'); return; }
//     fetchMyInfo();
//   }, [user, navigate]);

//   const fetchMyInfo = async () => {
//     try {
//         const userDoc = await getDocs(query(collection(db, "users"), where("email", "==", user.email)));
//         if (!userDoc.empty) {
//             setPoint(userDoc.docs[0].data().point || 0);
//         }
//     } catch (e) { console.error(e); }
//   };

//   const handleSearchUser = async () => {
//     if (!targetName.trim()) return;
//     setIsSearching(true);
//     setSearchResults([]);

//     try {
//         const q = query(
//             collection(db, "users"),
//             where("name", ">=", targetName),
//             where("name", "<=", targetName + "\uf8ff"),
//             limit(5)
//         );

//         const querySnapshot = await getDocs(q);
//         const users = [];
//         querySnapshot.forEach((doc) => {
//             const data = doc.data();
//             if (doc.id !== user.uid) {
//                 users.push({ id: doc.id, name: data.name });
//             }
//         });

//         if (users.length === 0) alert(t.noResult);
//         setSearchResults(users);

//     } catch (e) {
//         console.error(e);
//         alert(t.alertError);
//     } finally {
//         setIsSearching(false);
//     }
//   };

//   const selectUser = (name) => {
//       setTargetName(name);
//       setSearchResults([]); 
//   };

//   const handleTransfer = async () => {
//     const sendAmount = parseInt(amount);

//     if (!targetName) return alert(t.alertNoReceiver);
//     if (isNaN(sendAmount) || sendAmount <= 0) return alert(t.enterBet);
//     if (sendAmount > Math.floor(point)) return alert(t.noMoney);

//     if (!window.confirm(`[${targetName}] ${t.alertSendConfirm} ${sendAmount.toLocaleString()}${t.alertSendConfirm2}`)) return;

//     setLoading(true);

//     try {
//       const { receiverUid, senderName } = await runTransaction(db, async (transaction) => {
//         const q = query(collection(db, "users"), where("name", "==", targetName));
//         const targetSnapshot = await getDocs(q);

//         if (targetSnapshot.empty) throw new Error("User not found");
        
//         const targetDoc = targetSnapshot.docs[0];
//         const targetData = targetDoc.data();
//         const targetUid = targetDoc.id;

//         if (targetUid === user.uid) throw new Error(t.alertSelf);

//         const myDocRef = doc(db, "users", user.uid);
//         const myDocSnap = await transaction.get(myDocRef);
//         if (!myDocSnap.exists()) throw new Error("Error");
        
//         const myData = myDocSnap.data();
//         const myCurrentPoint = myData.point || 0;
        
//         if (myCurrentPoint < sendAmount) throw new Error("No money");

//         transaction.update(myDocRef, { point: myCurrentPoint - sendAmount });
//         transaction.update(doc(db, "users", targetUid), { point: (targetData.point || 0) + sendAmount });

//         return { receiverUid: targetUid, senderName: myData.name };
//       });

//       await addDoc(collection(db, "history"), {
//         uid: user.uid,
//         type: "송금",
//         msg: `${targetName}님에게 송금`,
//         amount: -sendAmount, 
//         createdAt: serverTimestamp()
//       });

//       await addDoc(collection(db, "history"), {
//         uid: receiverUid, 
//         type: "입금", 
//         msg: `${senderName}님으로부터 입금`, 
//         amount: sendAmount, 
//         createdAt: serverTimestamp()
//       });

//       alert(t.alertComplete);
//       setPoint(prev => prev - sendAmount);
//       setAmount("");
//       setTargetName("");
//       setSearchResults([]); 

//     } catch (e) {
//       alert("Error: " + e.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="container" style={{ background: '#2c3e50', minHeight: '100vh', padding: '20px', color: 'white' }}>
      
//       <div style={{ textAlign: 'center', marginBottom: '40px' }}>
//         <h1 style={{ color: '#f1c40f' }}>{t.transferTitle}</h1>
//         <p style={{ color: '#bdc3c7' }}>{t.transferDesc}</p>
        
//         <div className="card" style={{ display:'inline-block', background:'#34495e', padding:'10px 25px', marginTop:'15px', borderRadius:'10px' }}>
//            {t.myBalance}: <span style={{ color:'#f1c40f', fontWeight:'bold', fontSize:'20px' }}>{Math.floor(point).toLocaleString()}</span>
//         </div>
//       </div>

//       <div className="card" style={{ maxWidth: '500px', margin: '0 auto', background: '#34495e', padding: '30px', position:'relative' }}>
        
//         <div style={{ marginBottom: '20px' }}>
//             <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>{t.searchReceiver}</label>
//             <div style={{ display: 'flex', gap: '5px' }}>
//                 <input 
//                     className="input" 
//                     style={{ flex: 1, textAlign: 'left' }} 
//                     placeholder={t.searchPlaceholder}
//                     value={targetName}
//                     onChange={(e) => setTargetName(e.target.value)}
//                     onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
//                 />
//                 <button 
//                     className="btn" 
//                     style={{ background: '#3498db', padding: '10px 15px' }}
//                     onClick={handleSearchUser}
//                     disabled={isSearching}
//                 >
//                     🔍 {isSearching ? "..." : t.searchBtn}
//                 </button>
//             </div>

//             {searchResults.length > 0 && (
//                 <div style={{ 
//                     marginTop: '5px', background: '#2c3e50', borderRadius: '5px', 
//                     border: '1px solid #7f8c8d', overflow: 'hidden',
//                     position: 'absolute', width: '88%', zIndex: 10
//                 }}>
//                     {searchResults.map((u) => (
//                         <div 
//                             key={u.id}
//                             onClick={() => selectUser(u.name)}
//                             style={{ 
//                                 padding: '10px', borderBottom: '1px solid #444', 
//                                 cursor: 'pointer', display: 'flex', justifyContent: 'space-between'
//                             }}
//                             onMouseOver={(e) => e.currentTarget.style.background = '#34495e'}
//                             onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
//                         >
//                             <span style={{fontWeight:'bold', color:'#fff'}}>{u.name}</span>
//                             <span style={{fontSize:'12px', color:'#2ecc71'}}>{t.select}</span>
//                         </div>
//                     ))}
//                 </div>
//             )}
//         </div>

//         <div style={{ marginBottom: '30px' }}>
//             <label style={{ display: 'block', marginBottom: '5px', color: '#cccccc' }}>{t.sendAmount}</label>
//             <input 
//                 className="input" 
//                 type="number"
//                 style={{ width: '100%', textAlign: 'left', fontSize: '24px', fontWeight: 'bold', color: '#f1c40f' }} 
//                 placeholder="0"
//                 value={amount}
//                 onChange={(e) => setAmount(e.target.value)}
//             />
//             <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
//                 <button className="btn" style={{flex:1, padding:'5px', fontSize:'12px'}} onClick={() => setAmount(curr => String((parseInt(curr)||0) + 10000))}>+10000</button>
//                 <button className="btn" style={{flex:1, padding:'5px', fontSize:'12px'}} onClick={() => setAmount(curr => String((parseInt(curr)||0) + 100000))}>+100000</button>
//                 <button className="btn" style={{flex:1, padding:'5px', fontSize:'12px'}} onClick={() => setAmount(curr => String((parseInt(curr)||0) + 1000000))}>+1000000</button>
//                 <button className="btn" style={{flex:1, padding:'5px', fontSize:'12px', background:'#e67e22'}} onClick={() => setAmount(String(Math.floor(point)))}>ALL</button>
//             </div>
//         </div>

//         <button 
//             className="btn btn-primary" 
//             style={{ width: '100%', padding: '15px', fontSize: '18px' }} 
//             onClick={handleTransfer}
//             disabled={loading}
//         >
//             {loading ? t.sending : t.sendBtn}
//         </button>

//       </div>

//       <button className="btn" style={{ marginTop: 30, background: 'transparent', border:'1px solid #555', color:'#888', width: '100%' }} onClick={() => navigate('/home')}>
//         &larr; {t.home}
//       </button>

//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, runTransaction, limit, addDoc, serverTimestamp } from 'firebase/firestore'; // ⭐️ getDoc 추가
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

export default function Transfer() {
  const [point, setPoint] = useState(0);
  const [targetName, setTargetName] = useState(""); 
  const [amount, setAmount] = useState("");          
  const [loading, setLoading] = useState(false);
  
  const [searchResults, setSearchResults] = useState([]); 
  const [isSearching, setIsSearching] = useState(false);
  
  // 🛡️ [추가] 초기값을 false로 설정하여 새로고침 시 뚫리는 현상 방지
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const navigate = useNavigate();
  const user = auth.currentUser;
  const { t } = useLanguage();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchMyInfo();
    fetchTransferStatus(); // ⭐️ 송금 활성화 상태 확인 함수 호출
  }, [user, navigate]);

  // ⭐️ [추가] 서버의 송금 기능 활성화 여부를 가져오는 함수
  const fetchTransferStatus = async () => {
    try {
      const docSnap = await getDoc(doc(db, "system", "features"));
      if (docSnap.exists()) {
        setIsTransferOpen(docSnap.data().transfer);
      }
    } catch (e) {
      console.error("Feature check error:", e);
    }
  };

  const fetchMyInfo = async () => {
    try {
        const userDoc = await getDocs(query(collection(db, "users"), where("email", "==", user.email)));
        if (!userDoc.empty) {
            setPoint(userDoc.docs[0].data().point || 0);
        }
    } catch (e) { console.error(e); }
  };

  const handleSearchUser = async () => {
    if (!targetName.trim()) return;
    setIsSearching(true);
    setSearchResults([]);

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
            if (doc.id !== user.uid) {
                users.push({ id: doc.id, name: data.name });
            }
        });

        if (users.length === 0) alert(t.noResult);
        setSearchResults(users);

    } catch (e) {
        console.error(e);
        alert(t.alertError);
    } finally {
        setIsSearching(false);
    }
  };

  const selectUser = (name) => {
      setTargetName(name);
      setSearchResults([]); 
  };

  const handleTransfer = async () => {
    // 🛡️ [추가] 실제 데이터가 false라면 여기서 즉시 차단 (어뷰징 방지 핵심)
    if (!isTransferOpen) return alert("현재 송금 기능이 비활성화되어 있습니다.");

    const sendAmount = parseInt(amount);

    if (!targetName) return alert(t.alertNoReceiver);
    if (isNaN(sendAmount) || sendAmount <= 0) return alert(t.enterBet);
    if (sendAmount > Math.floor(point)) return alert(t.noMoney);

    if (!window.confirm(`[${targetName}] ${t.alertSendConfirm} ${sendAmount.toLocaleString()}${t.alertSendConfirm2}`)) return;

    setLoading(true);

    try {
      const { receiverUid, senderName } = await runTransaction(db, async (transaction) => {
        const q = query(collection(db, "users"), where("name", "==", targetName));
        const targetSnapshot = await getDocs(q);

        if (targetSnapshot.empty) throw new Error("User not found");
        
        const targetDoc = targetSnapshot.docs[0];
        const targetData = targetDoc.data();
        const targetUid = targetDoc.id;

        if (targetUid === user.uid) throw new Error(t.alertSelf);

        const myDocRef = doc(db, "users", user.uid);
        const myDocSnap = await transaction.get(myDocRef);
        if (!myDocSnap.exists()) throw new Error("Error");
        
        const myData = myDocSnap.data();
        const myCurrentPoint = myData.point || 0;
        
        if (myCurrentPoint < sendAmount) throw new Error("No money");

        transaction.update(myDocRef, { point: myCurrentPoint - sendAmount });
        transaction.update(doc(db, "users", targetUid), { point: (targetData.point || 0) + sendAmount });

        return { receiverUid: targetUid, senderName: myData.name };
      });

      await addDoc(collection(db, "history"), {
        uid: user.uid,
        type: "송금",
        msg: `${targetName}님에게 송금`,
        amount: -sendAmount, 
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, "history"), {
        uid: receiverUid, 
        type: "입금", 
        msg: `${senderName}님으로부터 입금`, 
        amount: sendAmount, 
        createdAt: serverTimestamp()
      });

      alert(t.alertComplete);
      setPoint(prev => prev - sendAmount);
      setAmount("");
      setTargetName("");
      setSearchResults([]); 

    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ background: '#2c3e50', minHeight: '100vh', padding: '20px', color: 'white' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#f1c40f' }}>{t.transferTitle}</h1>
        <p style={{ color: '#bdc3c7' }}>{t.transferDesc}</p>
        
        <div className="card" style={{ display:'inline-block', background:'#34495e', padding:'10px 25px', marginTop:'15px', borderRadius:'10px' }}>
           {t.myBalance}: <span style={{ color:'#f1c40f', fontWeight:'bold', fontSize:'20px' }}>{Math.floor(point).toLocaleString()}</span>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '500px', margin: '0 auto', background: '#34495e', padding: '30px', position:'relative' }}>
        
        <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>{t.searchReceiver}</label>
            <div style={{ display: 'flex', gap: '5px' }}>
                <input 
                    className="input" 
                    style={{ flex: 1, textAlign: 'left' }} 
                    placeholder={t.searchPlaceholder}
                    value={targetName}
                    onChange={(e) => setTargetName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                />
                <button 
                    className="btn" 
                    style={{ background: '#3498db', padding: '10px 15px' }}
                    onClick={handleSearchUser}
                    disabled={isSearching}
                >
                    🔍 {isSearching ? "..." : t.searchBtn}
                </button>
            </div>

            {searchResults.length > 0 && (
                <div style={{ 
                    marginTop: '5px', background: '#2c3e50', borderRadius: '5px', 
                    border: '1px solid #7f8c8d', overflow: 'hidden',
                    position: 'absolute', width: '88%', zIndex: 10
                }}>
                    {searchResults.map((u) => (
                        <div 
                            key={u.id}
                            onClick={() => selectUser(u.name)}
                            style={{ 
                                padding: '10px', borderBottom: '1px solid #444', 
                                cursor: 'pointer', display: 'flex', justifyContent: 'space-between'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#34495e'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <span style={{fontWeight:'bold', color:'#fff'}}>{u.name}</span>
                            <span style={{fontSize:'12px', color:'#2ecc71'}}>{t.select}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#cccccc' }}>{t.sendAmount}</label>
            <input 
                className="input" 
                type="number"
                style={{ width: '100%', textAlign: 'left', fontSize: '24px', fontWeight: 'bold', color: '#f1c40f' }} 
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                <button className="btn" style={{flex:1, padding:'5px', fontSize:'12px'}} onClick={() => setAmount(curr => String((parseInt(curr)||0) + 10000))}>+10000</button>
                <button className="btn" style={{flex:1, padding:'5px', fontSize:'12px'}} onClick={() => setAmount(curr => String((parseInt(curr)||0) + 100000))}>+100000</button>
                <button className="btn" style={{flex:1, padding:'5px', fontSize:'12px'}} onClick={() => setAmount(curr => String((parseInt(curr)||0) + 1000000))}>+1000000</button>
                <button className="btn" style={{flex:1, padding:'5px', fontSize:'12px', background:'#e67e22'}} onClick={() => setAmount(String(Math.floor(point)))}>ALL</button>
            </div>
        </div>

        {/* 🛡️ 로딩 중이거나 기능이 닫혀있으면 버튼 비활성화 처리 가능 (선택 사항) */}
        <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '15px', fontSize: '18px', background: !isTransferOpen ? '#7f8c8d' : '#3498db' }} 
            onClick={handleTransfer}
            disabled={loading}
        >
            {loading ? t.sending : (!isTransferOpen ? "기능 일시 중지" : t.sendBtn)}
        </button>

      </div>

      <button className="btn" style={{ marginTop: 30, background: 'transparent', border:'1px solid #555', color:'#888', width: '100%' }} onClick={() => navigate('/home')}>
        &larr; {t.home}
      </button>

    </div>
  );
}