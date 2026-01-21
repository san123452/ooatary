// import React, { useState, useEffect, useRef } from 'react';
// import { db, auth } from '../firebase';
// import { collection, addDoc, query, orderBy, onSnapshot, getDoc, doc } from 'firebase/firestore';

// export default function Chat() {
//   const [messages, setMessages] = useState([]);
//   const [text, setText] = useState('');
//   const [myName, setMyName] = useState('익명');
//   const user = auth.currentUser;
  
//   // 스크롤 박스를 잡기 위한 ref (이전에는 화면 전체를 내리는 ref였음)
//   const chatBoxRef = useRef(null);

//   useEffect(() => {
//     if (!user) return;

//     const fetchMyName = async () => {
//       const docSnap = await getDoc(doc(db, "users", user.uid));
//       if (docSnap.exists()) setMyName(docSnap.data().name || user.email.split('@')[0]);
//     };
//     fetchMyName();

//     const q = query(collection(db, "chats"), orderBy("createdAt", "asc"));
//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
//     });
//     return () => unsubscribe();
//   }, []);

//   // 메시지가 갱신될 때마다 '채팅 박스 내부만' 스크롤 내리기
//   useEffect(() => {
//     if (chatBoxRef.current) {
//       chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
//     }
//   }, [messages]);

//   const sendMessage = async () => {
//     if (!text.trim()) return;
//     try {
//       await addDoc(collection(db, "chats"), {
//         text: text, uid: user.uid, name: myName, createdAt: new Date()
//       });
//       setText('');
//     } catch (e) { console.log(e); }
//   };

//   return (
//     <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '2px solid #333' }}>
      
//       <div style={{ padding: '10px', background: '#222', borderBottom: '1px solid #333', fontWeight: 'bold' }}>
//         💬 실시간 수다방
//       </div>

//       {/* 여기가 핵심! ref를 이 박스에 연결해서 여기만 스크롤되게 함 */}
//       <div 
//         ref={chatBoxRef}
//         style={{ flex: 1, overflowY: 'auto', padding: '15px', background: '#111' }}
//       >
//         {messages.map((msg) => {
//           const isMe = msg.uid === user.uid;
//           return (
//             <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
//               {!isMe && <span style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{msg.name}</span>}
//               <div style={{ 
//                 padding: '8px 12px', borderRadius: 12, fontSize: 14,
//                 background: isMe ? '#f1c40f' : '#444', 
//                 color: isMe ? '#000' : '#fff' 
//               }}>
//                 {msg.text}
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       <div style={{ display: 'flex', padding: 10, background: '#222', borderTop: '1px solid #333' }}>
//         <input 
//           style={{ flex: 1, padding: '10px', borderRadius: '20px', border: 'none', marginRight: 10, background: '#333', color: 'white' }} 
//           value={text}
//           onChange={(e) => setText(e.target.value)}
//           placeholder="메시지..."
//           onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
//         />
//         <button style={{ padding: '0 20px', borderRadius: '20px', background: '#6200ea', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }} onClick={sendMessage}>
//           전송
//         </button>
//       </div>
//     </div>
//   );
// }