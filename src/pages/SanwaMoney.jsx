

// import React, { useState, useEffect } from 'react';
// import { db, auth } from '../firebase';
// import { doc, runTransaction, addDoc, collection, serverTimestamp, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'; 
// import { useNavigate } from 'react-router-dom';
// import { useLanguage } from '../LanguageContext';

// export default function SanwaMoney() {
//   const [point, setPoint] = useState(0);
//   const [debt, setDebt] = useState(0); 
//   const [amount, setAmount] = useState('');
//   const [mode, setMode] = useState('borrow'); 
//   const [debtorList, setDebtorList] = useState([]);
//   const [isProcessing, setIsProcessing] = useState(false); 
  
//   const navigate = useNavigate();
//   const user = auth.currentUser;
//   const { t, lang } = useLanguage();

//   const isAdmin = user?.email === "kks3172@naver.com";

//   // ⭐️ 대출 한도를 1억으로 수정 완료
//   const MAX_LOAN_LIMIT = 100000000; 
//   const INTEREST_RATE = 0.1; 

//   useEffect(() => {
//     if (!user) { navigate('/login'); return; }
    
//     const unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
//         if (docSnap.exists()) {
//             const data = docSnap.data();
//             setPoint(data.point || 0);
//             setDebt(data.debt || 0);
//         }
//     });

//     const q = query(
//         collection(db, "users"),
//         where("debt", ">", 0),
//         orderBy("debt", "desc"),
//         limit(10)
//     );

//     const unsubList = onSnapshot(q, (snapshot) => {
//         const list = snapshot.docs.map(doc => ({
//             id: doc.id,
//             ...doc.data()
//         }));
//         setDebtorList(list);
//     });

//     return () => { unsubUser(); unsubList(); };
//   }, [user, navigate]);

//   const handleAmount = (val) => {
//     if (val === '' || /^[0-9]+$/.test(val)) {
//         setAmount(val);
//     }
//   };

//   const handlePercent = (pct) => {
//       if (mode === 'borrow') {
//           const available = MAX_LOAN_LIMIT - debt;
//           setAmount(String(Math.floor(available * pct)));
//       } else {
//           const maxRepay = Math.min(debt, point);
//           setAmount(String(Math.floor(maxRepay * pct)));
//       }
//   };

//   const handleForgive = async (targetUid, targetName, targetDebt) => {
//       if (!isAdmin) return;

//       const confirmMsg = lang === 'jp' 
//         ? `${targetName}様の借금 ${targetDebt.toLocaleString()}P를 전액 면제하시겠습니까?`
//         : `${targetName}님의 빚 ${targetDebt.toLocaleString()}P를 전액 탕감하시겠습니까?`;

//       if (window.confirm(confirmMsg)) {
//           try {
//               await runTransaction(db, async (transaction) => {
//                 transaction.update(doc(db, "users", targetUid), { debt: 0 });
//               });

//               const historyMsg = lang === 'jp' ? "管理者の慈悲 (借금全액免除)" : "관리자의 자비 (부채 전액 탕감)";
//               await addDoc(collection(db, "history"), {
//                   uid: targetUid,
//                   type: lang === 'jp' ? "免除" : "탕감",
//                   msg: historyMsg,
//                   amount: targetDebt,
//                   createdAt: serverTimestamp()
//               });
//               alert(t.loan_forgive_done || "탕감 처리 완료");
//           } catch (e) {
//               console.error(e);
//               alert("Error");
//           }
//       }
//   };

//   const executeTransaction = async () => {
//     if (isProcessing) return; 
//     const money = parseInt(amount);
//     if (!money || money <= 0) return alert(t.loan_alert_input || "금액을 정확히 입력해주세요.");

//     const userRef = doc(db, "users", user.uid);
//     setIsProcessing(true); 

//     try {
//         await runTransaction(db, async (transaction) => {
//             const userSnap = await transaction.get(userRef);
//             if (!userSnap.exists()) throw "User does not exist!";

//             const userData = userSnap.data();
//             const currentPoint = userData.point || 0;
//             const currentDebt = userData.debt || 0;

//             if (mode === 'borrow') {
//                 if (currentDebt + money > MAX_LOAN_LIMIT) {
//                     throw (t.loan_alert_limit || `🚫 대출 한도 초과!`);
//                 }

//                 const interest = Math.floor(money * INTEREST_RATE); 
//                 const receiveMoney = Math.floor(money - interest);

//                 transaction.update(userRef, {
//                     point: currentPoint + receiveMoney,
//                     debt: currentDebt + money,
//                     lastLoanDate: serverTimestamp()
//                 });
//             } else {
//                 if (money > currentPoint) throw (t.loan_alert_no_point || "상환할 포인트가 부족합니다.");
//                 if (money > currentDebt) throw (t.loan_alert_too_much || "갚을 빚보다 많은 금액입니다.");

//                 transaction.update(userRef, {
//                     point: currentPoint - money,
//                     debt: currentDebt - money
//                 });
//             }
//         });

//         const interest = Math.floor(money * INTEREST_RATE);
//         const receiveMoney = Math.floor(money - interest);

//         if (mode === 'borrow') {
//             let historyMsg = lang === 'jp' ? `サンワマネー融資 (先利子 ${interest.toLocaleString()}P)` : `산와머니 대출 (선이자 ${interest.toLocaleString()}P)`;
//             await addDoc(collection(db, "history"), { uid: user.uid, type: lang === 'jp' ? "融資" : "대출", msg: historyMsg, amount: receiveMoney, createdAt: serverTimestamp() });
//             alert(t.loan_success_borrow || `💰 입금 완료!`);
//         } else {
//             let historyMsg = lang === 'jp' ? "サンワマネー借금返済" : "산와머니 빚 상환";
//             await addDoc(collection(db, "history"), { uid: user.uid, type: lang === 'jp' ? "返済" : "상환", msg: historyMsg, amount: -money, createdAt: serverTimestamp() });
//             alert(t.loan_success_repay || `✅ 상환 완료!`);
//         }

//         setAmount('');
//     } catch (e) {
//         console.error(e);
//         alert(typeof e === 'string' ? e : (t.alertError || "오류가 발생했습니다."));
//     } finally {
//         setIsProcessing(false); 
//     }
//   };

//   return (
//     <div className="container" style={{ paddingTop: 30, background: '#1a1a1a', minHeight: '100vh', color: 'white', padding: '20px' }}>
      
//       <div style={{ textAlign: 'center', marginBottom: 30 }}>
//         <h1 style={{ fontSize: '36px', color: '#f1c40f', margin: 0, fontWeight:'900', fontStyle:'italic' }}>
//             {t.loan_title || "💸 SANWA MONEY"}
//         </h1>
//         <p style={{ color: '#7f8c8d', marginTop: 5, fontSize:'13px' }}>
//             {t.loan_subtitle || "무심사 대출 서비스"}
//         </p>
//         <div style={{background:'#c0392b', color:'white', display:'inline-block', padding:'5px 15px', borderRadius:'20px', fontSize:'12px', marginTop:'10px', fontWeight:'bold'}}>
//             🔥 {t.loan_warning || "선이자 10% • 기한 1일"}
//         </div>
//       </div>

//       <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
//         <div className="card" style={{ flex: 1, background: '#2c3e50', textAlign: 'center', padding: 15, borderRadius:'10px' }}>
//             <div style={{ fontSize: '12px', color: '#bdc3c7' }}>{t.my_point || "보유 자산"}</div>
//             <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2ecc71' }}>{Math.floor(point).toLocaleString()} P</div>
//         </div>
//         <div className="card" style={{ flex: 1, background: '#2c3e50', textAlign: 'center', padding: 15, border: '1px solid #e74c3c', borderRadius:'10px' }}>
//             <div style={{ fontSize: '12px', color: '#e74c3c' }}>{t.my_debt || "현재 빚"}</div>
//             <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e74c3c' }}>-{Math.floor(debt).toLocaleString()} P</div>
//         </div>
//       </div>

//       <div style={{ textAlign: 'right', fontSize: '12px', color: '#95a5a6', marginBottom: 10 }}>
//         {t.loan_limit || "한도"}: <span style={{ color: 'white' }}>{(MAX_LOAN_LIMIT - debt).toLocaleString()} P</span>
//       </div>

//       <div style={{ display: 'flex', marginBottom: 20 }}>
//           <button 
//             onClick={() => { setMode('borrow'); setAmount(''); }} 
//             style={{ flex: 1, padding: 15, background: mode === 'borrow' ? '#f39c12' : '#333', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '16px', borderTopLeftRadius: 10, borderBottomLeftRadius: 10, transition:'0.3s' }}
//           >
//             {t.btn_borrow || "빌리기"}
//           </button>
//           <button 
//             onClick={() => { setMode('repay'); setAmount(''); }} 
//             style={{ flex: 1, padding: 15, background: mode === 'repay' ? '#27ae60' : '#333', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '16px', borderTopRightRadius: 10, borderBottomRightRadius: 10, transition:'0.3s' }}
//           >
//             {t.btn_repay || "갚기"}
//           </button>
//       </div>

//       <div className="card" style={{ background: '#2c3e50', padding: 25, borderRadius: 10, boxShadow:'0 10px 20px rgba(0,0,0,0.3)' }}>
//           <h3 style={{ textAlign: 'center', marginTop: 0, marginBottom:20, color: mode === 'borrow' ? '#f39c12' : '#27ae60' }}>
//               {mode === 'borrow' 
//                 ? (t.loan_msg_borrow || "얼마나 필요하신가요?") 
//                 : (t.loan_msg_repay || "얼마를 갚으시겠어요?")}
//           </h3>

//           <input 
//             type="text" 
//             className="input" 
//             placeholder={t.placeholder_amount || "금액 입력"} 
//             value={amount} 
//             onChange={(e) => handleAmount(e.target.value)} 
//             style={{ width: '100%', fontSize: '24px', textAlign: 'center', padding: 15, borderRadius: 5, border: 'none', marginBottom: 15, background: '#1a1a1a', color: 'white', fontWeight:'bold' }} 
//           />

//           <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
//             <button className="btn" style={{ flex: 1, background: '#555', fontSize: '12px', padding: 10, borderRadius:5 }} onClick={() => handlePercent(0.1)}>10%</button>
//             <button className="btn" style={{ flex: 1, background: '#555', fontSize: '12px', padding: 10, borderRadius:5 }} onClick={() => handlePercent(0.5)}>50%</button>
//           </div>

//           <button 
//             onClick={executeTransaction} 
//             disabled={isProcessing} 
//             className="btn" 
//             style={{ 
//                 width: '100%', 
//                 padding: 15, 
//                 fontSize: '18px', 
//                 fontWeight: 'bold', 
//                 background: isProcessing ? '#555' : (mode === 'borrow' ? 'linear-gradient(45deg, #e67e22, #d35400)' : 'linear-gradient(45deg, #2ecc71, #27ae60)'),
//                 border:'none', borderRadius: 8,
//                 boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
//                 cursor: isProcessing ? 'not-allowed' : 'pointer'
//             }}
//           >
//             {isProcessing ? "처리 중..." : (mode === 'borrow' ? (t.btn_execute_borrow || "💰 대출 실행") : (t.btn_execute_repay || "💸 빚 청산"))}
//           </button>
          
//           {mode === 'borrow' && (
//              <div style={{marginTop:'15px', padding:'10px', background:'rgba(0,0,0,0.2)', borderRadius:'5px', fontSize:'12px', color:'#bdc3c7'}}>
//                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
//                      <span>{lang === 'jp' ? '申請金액' : '신청 금액'}:</span>
//                      <span>{amount ? parseInt(amount).toLocaleString() : 0} P</span>
//                  </div>
//                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px', color:'#e74c3c'}}>
//                      <span>{lang === 'jp' ? '先利子 (10%)' : '선이자 (10%)'}:</span>
//                      <span>-{amount ? Math.floor(parseInt(amount)*INTEREST_RATE).toLocaleString() : 0} P</span>
//                  </div>
//                  <div style={{borderTop:'1px solid #555', paddingTop:'5px', display:'flex', justifyContent:'space-between', fontWeight:'bold', color:'#2ecc71'}}>
//                      <span>{lang === 'jp' ? '受取金액' : '실수령액'}:</span>
//                      <span>{amount ? Math.floor(parseInt(amount)*(1-INTEREST_RATE)).toLocaleString() : 0} P</span>
//                  </div>
//              </div>
//           )}
//       </div>

//       <div style={{ marginTop: 40 }}>
//           <h3 style={{ borderLeft: '4px solid #e74c3c', paddingLeft: 10, color: '#e74c3c' }}>
//               😈 {t.loan_rank_title || "고액 체납자 명단"}
//           </h3>
//           <div style={{ background: '#2c3e50', borderRadius: 10, overflow: 'hidden' }}>
//               {debtorList.length === 0 ? (
//                   <div style={{ padding: 20, textAlign: 'center', color: '#7f8c8d' }}>
//                       {t.loan_no_debtors || "깨끗합니다."}
//                   </div>
//               ) : (
//                   debtorList.map((d, idx) => (
//                       <div key={d.id} style={{ 
//                           display: 'flex', justifyContent: 'space-between', padding: '12px 15px', 
//                           borderBottom: '1px solid #34495e', alignItems:'center',
//                           background: idx === 0 ? 'rgba(231, 76, 60, 0.1)' : 'transparent'
//                       }}>
//                           <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
//                               <span style={{ fontWeight: 'bold', color: idx < 3 ? '#f1c40f' : '#95a5a6', width:'20px' }}>{idx + 1}</span>
//                               <span style={{ color: 'white', fontWeight: idx === 0 ? 'bold' : 'normal' }}>
//                                   {d.name} {d.id === user.uid && <span style={{fontSize:'10px', color:'#2ecc71'}}>(나)</span>}
//                               </span>
//                           </div>
                          
//                           <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
//                               <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>
//                                   -{d.debt ? d.debt.toLocaleString() : 0} P
//                               </span>
                              
//                               {isAdmin && (
//                                   <button 
//                                     onClick={() => handleForgive(d.id, d.name, d.debt)}
//                                     style={{
//                                         background: '#27ae60', border: 'none', color: 'white', 
//                                         borderRadius: '4px', padding: '4px 8px', fontSize: '11px', 
//                                         cursor: 'pointer', fontWeight: 'bold'
//                                     }}
//                                   >
//                                       {t.loan_forgive || "탕감"}
//                                   </button>
//                               )}
//                           </div>
//                       </div>
//                   ))
//               )}
//           </div>
//       </div>

//       <button className="btn" style={{ marginTop: 30, background: 'transparent', border:'1px solid #555', width: '100%', padding: 15 }} onClick={() => navigate('/home')}>
//         {t.home || "홈으로"}
//       </button>

//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, runTransaction, addDoc, collection, serverTimestamp, query, where, orderBy, limit, onSnapshot, increment } from 'firebase/firestore'; 
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

export default function SanwaMoney() {
    const [point, setPoint] = useState(0);
    const [debt, setDebt] = useState(0); 
    const [amount, setAmount] = useState('');
    const [mode, setMode] = useState('borrow'); 
    const [debtorList, setDebtorList] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false); 
    
    const navigate = useNavigate();
    const user = auth.currentUser;
    const { t, lang } = useLanguage();

    const isAdmin = user?.email === "kks3172@naver.com";
    const MAX_LOAN_LIMIT = 100000000; 
    const INTEREST_RATE = 0.1; 

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        
        const unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setPoint(data.point || 0);
                setDebt(data.debt || 0);
            }
        });

        const q = query(
            collection(db, "users"),
            where("debt", ">", 0),
            orderBy("debt", "desc"),
            limit(10)
        );

        const unsubList = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDebtorList(list);
        });

        return () => { unsubUser(); unsubList(); };
    }, [user, navigate]);

    const handleAmount = (val) => {
        if (val === '' || /^[0-9]+$/.test(val)) { setAmount(val); }
    };

    const handlePercent = (pct) => {
        if (mode === 'borrow') {
            const available = MAX_LOAN_LIMIT - debt;
            setAmount(String(Math.floor(available * pct)));
        } else {
            const maxRepay = Math.min(debt, point);
            setAmount(String(Math.floor(maxRepay * pct)));
        }
    };

    const handleForgive = async (targetUid, targetName, targetDebt) => {
        if (!isAdmin) return;
        const confirmMsg = lang === 'jp' 
            ? `${targetName}様の借금 ${targetDebt.toLocaleString()}P를 전액 면제하시겠습니까?`
            : `${targetName}님의 빚 ${targetDebt.toLocaleString()}P를 전액 탕감하시겠습니까?`;

        if (window.confirm(confirmMsg)) {
            try {
                await runTransaction(db, async (transaction) => {
                    transaction.update(doc(db, "users", targetUid), { debt: 0 });
                });
                const historyMsg = lang === 'jp' ? "管理자의 慈悲 (借금全액免除)" : "관리자의 자비 (부채 전액 탕감)";
                await addDoc(collection(db, "history"), { uid: targetUid, type: lang === 'jp' ? "免除" : "탕감", msg: historyMsg, amount: targetDebt, createdAt: serverTimestamp() });
                alert(t.loan_forgive_done || "탕감 처리 완료");
            } catch (e) { alert("Error"); }
        }
    };

    const executeTransaction = async () => {
        if (isProcessing) return; 
        const money = parseInt(amount);
        if (!money || money <= 0) return alert(t.loan_alert_input || "금액을 정확히 입력해주세요.");

        const userRef = doc(db, "users", user.uid);
        setIsProcessing(true); 

        try {
            const interest = Math.floor(money * INTEREST_RATE); 
            const receiveMoney = Math.floor(money - interest);

            await runTransaction(db, async (transaction) => {
                const userSnap = await transaction.get(userRef);
                if (!userSnap.exists()) throw "User does not exist!";

                const userData = userSnap.data();
                const currentPoint = userData.point || 0;
                const currentDebt = userData.debt || 0;

                if (mode === 'borrow') {
                    if (currentDebt + money > MAX_LOAN_LIMIT) {
                        throw (t.loan_alert_limit || `🚫 대출 한도 초과!`);
                    }
                    // 🔥 [수정] 직접 더하기 대신 increment를 사용하여 정확한 계산 보장
                    transaction.update(userRef, {
                        point: increment(receiveMoney),
                        debt: increment(money),
                        lastLoanDate: serverTimestamp()
                    });
                } else {
                    if (money > currentPoint) throw (t.loan_alert_no_point || "상환할 포인트가 부족합니다.");
                    if (money > currentDebt) throw (t.loan_alert_too_much || "갚을 빚보다 많은 금액입니다.");

                    // 🔥 [수정] 직접 빼기 대신 increment(-값) 사용
                    transaction.update(userRef, {
                        point: increment(-money),
                        debt: increment(-money)
                    });
                }
            });

            if (mode === 'borrow') {
                let historyMsg = lang === 'jp' ? `サンワマネー融資 (先利子 ${interest.toLocaleString()}P)` : `산와머니 대출 (선이자 ${interest.toLocaleString()}P)`;
                await addDoc(collection(db, "history"), { uid: user.uid, type: lang === 'jp' ? "融資" : "대출", msg: historyMsg, amount: receiveMoney, createdAt: serverTimestamp() });
                alert(t.loan_success_borrow || `💰 입금 완료!`);
            } else {
                let historyMsg = lang === 'jp' ? "サンワマネー借금返済" : "산와머니 빚 상환";
                await addDoc(collection(db, "history"), { uid: user.uid, type: lang === 'jp' ? "返済" : "상환", msg: historyMsg, amount: -money, createdAt: serverTimestamp() });
                alert(t.loan_success_repay || `✅ 상환 완료!`);
            }
            setAmount('');
        } catch (e) {
            alert(typeof e === 'string' ? e : (t.alertError || "오류가 발생했습니다."));
        } finally {
            setIsProcessing(false); 
        }
    };

    return (
        <div className="container" style={{ paddingTop: 30, background: '#1a1a1a', minHeight: '100vh', color: 'white', padding: '20px' }}>
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
                <h1 style={{ fontSize: '36px', color: '#f1c40f', margin: 0, fontWeight:'900', fontStyle:'italic' }}> {t.loan_title || "💸 SANWA MONEY"} </h1>
                <p style={{ color: '#7f8c8d', marginTop: 5, fontSize:'13px' }}> {t.loan_subtitle || "무심사 대출 서비스"} </p>
                <div style={{background:'#c0392b', color:'white', display:'inline-block', padding:'5px 15px', borderRadius:'20px', fontSize:'12px', marginTop:'10px', fontWeight:'bold'}}> 🔥 {t.loan_warning || "선이자 10% • 기한 1일"} </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <div className="card" style={{ flex: 1, background: '#2c3e50', textAlign: 'center', padding: 15, borderRadius:'10px' }}>
                    <div style={{ fontSize: '12px', color: '#bdc3c7' }}>{t.my_point || "보유 자산"}</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2ecc71' }}>{Math.floor(point).toLocaleString()} P</div>
                </div>
                <div className="card" style={{ flex: 1, background: '#2c3e50', textAlign: 'center', padding: 15, border: '1px solid #e74c3c', borderRadius:'10px' }}>
                    <div style={{ fontSize: '12px', color: '#e74c3c' }}>{t.my_debt || "현재 빚"}</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e74c3c' }}>-{Math.floor(debt).toLocaleString()} P</div>
                </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '12px', color: '#95a5a6', marginBottom: 10 }}>
                {t.loan_limit || "한도"}: <span style={{ color: 'white' }}>{(MAX_LOAN_LIMIT - debt).toLocaleString()} P</span>
            </div>

            <div style={{ display: 'flex', marginBottom: 20 }}>
                <button onClick={() => { setMode('borrow'); setAmount(''); }} style={{ flex: 1, padding: 15, background: mode === 'borrow' ? '#f39c12' : '#333', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '16px', borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }}> {t.btn_borrow || "빌리기"} </button>
                <button onClick={() => { setMode('repay'); setAmount(''); }} style={{ flex: 1, padding: 15, background: mode === 'repay' ? '#27ae60' : '#333', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '16px', borderTopRightRadius: 10, borderBottomRightRadius: 10 }}> {t.btn_repay || "갚기"} </button>
            </div>

            <div className="card" style={{ background: '#2c3e50', padding: 25, borderRadius: 10, boxShadow:'0 10px 20px rgba(0,0,0,0.3)' }}>
                <h3 style={{ textAlign: 'center', marginTop: 0, marginBottom:20, color: mode === 'borrow' ? '#f39c12' : '#27ae60' }}> {mode === 'borrow' ? (t.loan_msg_borrow || "얼마나 필요하신가요?") : (t.loan_msg_repay || "얼마를 갚으시겠어요?")} </h3>
                <input type="text" className="input" placeholder={t.placeholder_amount || "금액 입력"} value={amount} onChange={(e) => handleAmount(e.target.value)} style={{ width: '100%', fontSize: '24px', textAlign: 'center', padding: 15, borderRadius: 5, border: 'none', marginBottom: 15, background: '#1a1a1a', color: 'white', fontWeight:'bold' }} />
                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                    <button className="btn" style={{ flex: 1, background: '#555', fontSize: '12px', padding: 10, borderRadius:5 }} onClick={() => handlePercent(0.1)}>10%</button>
                    <button className="btn" style={{ flex: 1, background: '#555', fontSize: '12px', padding: 10, borderRadius:5 }} onClick={() => handlePercent(0.5)}>50%</button>
                </div>

                <button onClick={executeTransaction} disabled={isProcessing} className="btn" style={{ width: '100%', padding: 15, fontSize: '18px', fontWeight: 'bold', background: isProcessing ? '#555' : (mode === 'borrow' ? 'linear-gradient(45deg, #e67e22, #d35400)' : 'linear-gradient(45deg, #2ecc71, #27ae60)'), border:'none', borderRadius: 8 }}>
                    {isProcessing ? "처리 중..." : (mode === 'borrow' ? (t.btn_execute_borrow || "💰 대출 실행") : (t.btn_execute_repay || "💸 빚 청산"))}
                </button>
                
                {mode === 'borrow' && (
                    <div style={{marginTop:'15px', padding:'10px', background:'rgba(0,0,0,0.2)', borderRadius:'5px', fontSize:'12px', color:'#bdc3c7'}}>
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}><span>{lang === 'jp' ? '申請金액' : '신청 금액'}:</span><span>{amount ? parseInt(amount).toLocaleString() : 0} P</span></div>
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px', color:'#e74c3c'}}><span>{lang === 'jp' ? '先利子 (10%)' : '선이자 (10%)'}:</span><span>-{amount ? Math.floor(parseInt(amount)*INTEREST_RATE).toLocaleString() : 0} P</span></div>
                        <div style={{borderTop:'1px solid #555', paddingTop:'5px', display:'flex', justifyContent:'space-between', fontWeight:'bold', color:'#2ecc71'}}><span>{lang === 'jp' ? '受取金액' : '실수령액'}:</span><span>{amount ? Math.floor(parseInt(amount)*(1-INTEREST_RATE)).toLocaleString() : 0} P</span></div>
                    </div>
                )}
            </div>

            <div style={{ marginTop: 40 }}>
                <h3 style={{ borderLeft: '4px solid #e74c3c', paddingLeft: 10, color: '#e74c3c' }}> 😈 {t.loan_rank_title || "고액 체납자 명단"} </h3>
                <div style={{ background: '#2c3e50', borderRadius: 10, overflow: 'hidden' }}>
                    {debtorList.length === 0 ? ( <div style={{ padding: 20, textAlign: 'center', color: '#7f8c8d' }}> {t.loan_no_debtors || "깨끗합니다."} </div> ) : (
                        debtorList.map((d, idx) => (
                            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 15px', borderBottom: '1px solid #34495e', alignItems:'center', background: idx === 0 ? 'rgba(231, 76, 60, 0.1)' : 'transparent' }}>
                                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                    <span style={{ fontWeight: 'bold', color: idx < 3 ? '#f1c40f' : '#95a5a6', width:'20px' }}>{idx + 1}</span>
                                    <span style={{ color: 'white', fontWeight: idx === 0 ? 'bold' : 'normal' }}> {d.name} {d.id === user.uid && <span style={{fontSize:'10px', color:'#2ecc71'}}>(나)</span>} </span>
                                </div>
                                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                    <span style={{ color: '#e74c3c', fontWeight: 'bold' }}> -{d.debt ? d.debt.toLocaleString() : 0} P </span>
                                    {isAdmin && ( <button onClick={() => handleForgive(d.id, d.name, d.debt)} style={{ background: '#27ae60', border: 'none', color: 'white', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}> {t.loan_forgive || "탕감"} </button> )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <button className="btn" style={{ marginTop: 30, background: 'transparent', border:'1px solid #555', width: '100%', padding: 15 }} onClick={() => navigate('/home')}> {t.home || "홈으로"} </button>
        </div>
    );
}