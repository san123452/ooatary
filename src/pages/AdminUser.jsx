// import React, { useEffect, useState } from 'react';
// import { db } from '../firebase';
// import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';

// export default function AdminUser() {
//   const [users, setUsers] = useState([]);
//   const [inputPoints, setInputPoints] = useState({}); 
//   const [inputNames, setInputNames] = useState({});   
//   const navigate = useNavigate();

//   useEffect(() => { fetchUsers(); }, []);

//   const fetchUsers = async () => {
//     const querySnapshot = await getDocs(collection(db, "users"));
//     const list = querySnapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
    
//     // 티어 -> 포인트 순 정렬
//     list.sort((a, b) => {
//         const tierA = a.tierLevel || 0;
//         const tierB = b.tierLevel || 0;
//         if (tierA !== tierB) return tierB - tierA;
//         return (b.point || 0) - (a.point || 0);
//     });
//     setUsers(list);
//   };

//   const handleUpdatePoint = async (uid, currentPoint) => {
//     /* 기존과 동일 */
//     const amount = parseInt(inputPoints[uid]);
//     if (isNaN(amount)) return alert("숫자 입력");
//     try {
//         await updateDoc(doc(db, "users", uid), { point: (currentPoint || 0) + amount });
//         alert("수정 완료"); fetchUsers(); setInputPoints({...inputPoints, [uid]:''});
//     } catch(e) { alert("에러"); }
//   };

//   const handleUpdateName = async (uid) => {
//     /* 기존과 동일 */
//     const newName = inputNames[uid];
//     if(!newName) return;
//     try {
//         await updateDoc(doc(db, "users", uid), { name: newName });
//         alert("개명 완료"); fetchUsers(); setInputNames({...inputNames, [uid]:''});
//     } catch(e) { alert("에러"); }
//   };

//   return (
//     <div className="container" style={{ paddingTop: 30 }}>
//       <h1 className="title">👥 회원 관리 (티어순)</h1>
//       {users.map(user => (
//         <div key={user.uid} className="card" style={{ padding: 20 }}>
//           <div style={{ marginBottom: 15, borderBottom: '1px solid #333', paddingBottom: 10 }}>
//             <div style={{ fontSize: 20, fontWeight: 'bold', color: '#f1c40f', display:'flex', alignItems:'center', gap:'10px' }}>
//               {/* 관리자 페이지에서도 티어 이미지 보임 */}
//               <img 
//                   src={`/tiers/${user.tierLevel || 0}.png`} 
//                   style={{width:'40px', height:'40px', objectFit:'contain'}} 
//                   alt="tier"
//                   onError={e => e.target.style.display='none'}
//               />
//               <div>
//                   {user.name ? user.name : "익명"} 
//                   <span style={{ fontSize: 14, color: '#888', fontWeight: 'normal' }}> ({user.tierName})</span>
//               </div>
//             </div>
//             <div style={{ marginTop: 5, fontWeight: 'bold', paddingLeft: '50px' }}>
//               💰 {user.point?.toLocaleString() || 0} 원
//             </div>
//           </div>
//           {/* 조작 버튼들은 그대로 유지 */}
//           <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
//             <div className="flex-row">
//               <input className="input" style={{ marginBottom: 0, flex: 1 }} placeholder="새 이름" value={inputNames[user.uid] || ''} onChange={(e) => setInputNames({ ...inputNames, [user.uid]: e.target.value })} />
//               <button className="btn" style={{ background: '#2980b9', width: '80px' }} onClick={() => handleUpdateName(user.uid)}>개명</button>
//             </div>
//             <div className="flex-row">
//               <input className="input" style={{ marginBottom: 0, flex: 1 }} placeholder="포인트 (+/-)" type="number" value={inputPoints[user.uid] || ''} onChange={(e) => setInputPoints({ ...inputPoints, [user.uid]: e.target.value })} />
//               <button className="btn btn-primary" style={{ width: '80px' }} onClick={() => handleUpdatePoint(user.uid, user.point)}>조작</button>
//             </div>
//           </div>
//         </div>
//       ))}
//       <button className="btn" style={{ background: '#333', width: '100%', marginTop: 20 }} onClick={() => navigate('/home')}>홈으로</button>
//     </div>
//   );
// }