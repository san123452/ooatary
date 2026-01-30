
// import React, { useState, useEffect } from 'react';
// import { db, auth } from '../firebase';
// import { doc, getDoc, deleteDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
// import { useNavigate, useParams } from 'react-router-dom';
// import { useLanguage } from '../LanguageContext';

// // 👑 관리자 이메일
// const ADMIN_EMAIL = "kks3172@naver.com";

// export default function BoardDetail() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const user = auth.currentUser;
//   const { t } = useLanguage();

//   const [post, setPost] = useState(null);
//   const [comments, setComments] = useState([]);
//   const [newComment, setNewComment] = useState("");
//   const [replyTo, setReplyTo] = useState(null);

//   useEffect(() => {
//     const unsub = onSnapshot(doc(db, "posts", id), (docSnap) => {
//         if (docSnap.exists()) {
//             setPost({ id: docSnap.id, ...docSnap.data() });
//         } else {
//             alert("Deleted post");
//             navigate('/board');
//         }
//     });
//     return () => unsub();
//   }, [id, navigate]);

//   useEffect(() => {
//     const q = query(collection(db, "posts", id, "comments"), orderBy("createdAt", "asc"));
//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
//     });
//     return () => unsubscribe();
//   }, [id]);

//   // ❤️ 좋아요 (알림 기능 제거됨)
//   const handleToggleLike = async () => {
//       if (!user) return alert("Login required");
//       if (!post) return;

//       const postRef = doc(db, "posts", id);
//       const isLiked = post.likedBy?.includes(user.uid);

//       try {
//           if (isLiked) {
//               await updateDoc(postRef, { likes: increment(-1), likedBy: arrayRemove(user.uid) });
//           } else {
//               await updateDoc(postRef, { likes: increment(1), likedBy: arrayUnion(user.uid) });
//               // ❌ 여기 있던 알림 전송 코드 삭제함 (좋아요 알림 X)
//           }
//       } catch (e) { console.error(e); }
//   };

//   const handleDeletePost = async () => {
//     if (!window.confirm(t.bd_delete_confirm)) return;
//     await deleteDoc(doc(db, "posts", id));
//     navigate('/board');
//   };

//   // 📝 댓글 작성 & 알림 전송 (번역 지원되게 수정)
//   const handleAddComment = async () => {
//     if (!newComment.trim()) return;
//     if (!user) return alert("Login required");
    
//     try {
//         const userDocRef = doc(db, "users", user.uid);
//         const userDocSnap = await getDoc(userDocRef);
//         let realName = "User";
//         if (userDocSnap.exists()) realName = userDocSnap.data().name; 

//         const commentData = {
//             text: newComment, 
//             uid: user.uid, 
//             authorName: realName, 
//             likes: [], 
//             createdAt: serverTimestamp(),
//             parentId: replyTo ? replyTo.id : null 
//         };

//         await addDoc(collection(db, "posts", id, "comments"), commentData);
//         await updateDoc(doc(db, "posts", id), { commentCount: increment(1) });

//         // 🔔 알림 전송 로직
//         let receiverUid = null;
        
//         if (replyTo) {
//             // 대댓글 -> 원댓글 작성자에게
//             receiverUid = replyTo.uid;
//         } else {
//             // 일반댓글 -> 글 작성자에게
//             receiverUid = post.uid;
//         }

//         // 자기 자신에게는 알림 X
//         if (receiverUid && receiverUid !== user.uid) {
//             await addDoc(collection(db, "notifications"), {
//                 receiverUid,
//                 senderUid: user.uid,
//                 senderName: realName, // ⭐ 이름만 저장 (메시지는 Header에서 언어에 맞춰 생성)
//                 type: replyTo ? "reply" : "comment", // 타입 저장
//                 postId: id,
//                 isRead: false,
//                 createdAt: serverTimestamp()
//             });
//         }

//         setNewComment("");
//         setReplyTo(null);
//     } catch (e) { console.error(e); }
//   };

//   const handleDeleteComment = async (commentId) => {
//     if (!window.confirm(t.bd_delete_confirm)) return;
//     try {
//         await deleteDoc(doc(db, "posts", id, "comments", commentId));
//         await updateDoc(doc(db, "posts", id), { commentCount: increment(-1) });
//     } catch (e) { console.error(e); }
//   };

//   const toggleCommentLike = async (comment) => {
//       if (!user) return alert("Login required");
//       const commentRef = doc(db, "posts", id, "comments", comment.id);
//       const isLiked = comment.likes?.includes(user.uid);

//       if (isLiked) await updateDoc(commentRef, { likes: arrayRemove(user.uid) });
//       else await updateDoc(commentRef, { likes: arrayUnion(user.uid) });
//   };

//   const formatDate = (timestamp) => {
//     if (!timestamp) return '';
//     const date = timestamp.toDate();
//     return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
//   };

//   if (!post) return <div style={{color:'white', padding:20}}>{t.loading}</div>;

//   const isMyPost = user && user.uid === post.uid;
//   const isAdmin = user && user.email === ADMIN_EMAIL;
//   const canManage = isMyPost || isAdmin;
//   const isLiked = user && post.likedBy?.includes(user.uid);
  
//   const rootComments = comments.filter(c => !c.parentId);
//   const getReplies = (parentId) => comments.filter(c => c.parentId === parentId);

//   return (
//     <div className="container" style={{ paddingTop: 30, background: '#1e272e', minHeight: '100vh', color: 'white', padding: '20px' }}>
      
//       <div style={{ background: '#2c3e50', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
//         <h2 style={{ color: '#f1c40f', marginBottom: '10px' }}>
//             {post.isNotice && <span style={{color:'#e74c3c', marginRight:5}}>[{t.bd_notice}]</span>}
//             {post.title}
//         </h2>
//         <div style={{ fontSize: '13px', color: '#bdc3c7', marginBottom: '20px', borderBottom: '1px solid #555', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems:'center' }}>
//           <span>✍️ {post.authorName}</span>
//           <div style={{display:'flex', gap: 10}}>
//               <span>📅 {formatDate(post.createdAt)}</span>
//           </div>
//         </div>

//         {post.imageUrl && (
//             <div style={{ marginBottom: 20, textAlign: 'center' }}>
//                 <img src={post.imageUrl} alt="img" style={{ maxWidth: '100%', borderRadius: 10, boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }} />
//             </div>
//         )}

//         <div style={{ minHeight: '100px', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize:'16px' }}>
//           {post.content}
//         </div>

//         <div style={{ marginTop: 30, textAlign: 'center' }}>
//             <button onClick={handleToggleLike} className="btn" style={{ 
//                 background: isLiked ? '#e74c3c' : '#34495e', 
//                 border: '1px solid #e74c3c',
//                 padding: '10px 30px', borderRadius: 30, fontSize: 18, 
//                 display: 'inline-flex', alignItems: 'center', gap: 5,
//                 transition: 'all 0.2s'
//             }}>
//                 {isLiked ? '❤️' : '🤍'} {t.bd_like} {post.likes || 0}
//             </button>
//         </div>

//         {canManage && (
//           <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
//             <button className="btn" style={{ padding: '5px 15px', fontSize: '14px', background: '#3498db' }} onClick={() => navigate('/board/write', { state: { post } })}>{t.bd_edit}</button>
//             <button className="btn" style={{ padding: '5px 15px', fontSize: '14px', background: '#e74c3c' }} onClick={handleDeletePost}>{t.bd_delete}</button>
//           </div>
//         )}
//       </div>

//       <div style={{ background: '#222', padding: '15px', borderRadius: '10px' }}>
//         <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>💬 {t.bd_comments} ({post.commentCount || 0})</h3>
        
//         <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexDirection:'column' }}>
//           {replyTo && (
//               <div style={{fontSize:'13px', color:'#3498db', marginBottom:'-5px'}}>
//                   @{replyTo.authorName} {t.bd_reply}
//                   <button onClick={() => setReplyTo(null)} style={{marginLeft:10, background:'none', border:'none', color:'#e74c3c', cursor:'pointer'}}>x {t.bd_cancel_reply}</button>
//               </div>
//           )}
//           <div style={{display:'flex', gap:10}}>
//               <input 
//                 value={newComment} 
//                 onChange={(e) => setNewComment(e.target.value)} 
//                 placeholder={replyTo ? t.bd_reply_input : t.bd_comment_input} 
//                 style={{ flex: 1, padding: '10px', borderRadius: '5px', border: 'none' }}
//                 onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
//               />
//               <button className="btn" style={{ background: '#f1c40f', color: 'black', fontWeight: 'bold' }} onClick={handleAddComment}>{t.bd_register}</button>
//           </div>
//         </div>

//         <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
//           {rootComments.map(c => (
//             <React.Fragment key={c.id}>
//                 <div style={{ background: '#333', padding: '10px', borderRadius: '5px' }}>
//                   <div style={{display:'flex', justifyContent:'space-between'}}>
//                       <div style={{ fontSize: '12px', color: '#f1c40f', marginBottom: '3px' }}>
//                         {c.authorName} <span style={{ color: '#777', marginLeft: '5px' }}>{formatDate(c.createdAt)}</span>
//                       </div>
//                       {(isAdmin || (user && user.uid === c.uid)) && (
//                         <button onClick={() => handleDeleteComment(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>❌</button>
//                       )}
//                   </div>
//                   <div style={{fontSize:'14px', marginBottom:5}}>{c.text}</div>
                  
//                   <div style={{display:'flex', gap:10, fontSize:'12px', color:'#aaa'}}>
//                       <span onClick={() => toggleCommentLike(c)} style={{cursor:'pointer', color: c.likes?.includes(user?.uid) ? '#e74c3c' : '#aaa'}}>
//                           ❤️ {c.likes?.length || 0}
//                       </span>
//                       <span onClick={() => setReplyTo(c)} style={{cursor:'pointer'}}>↪️ {t.bd_reply}</span>
//                   </div>
//                 </div>

//                 {getReplies(c.id).map(reply => (
//                     <div key={reply.id} style={{ background: '#2c2c2c', padding: '10px', borderRadius: '5px', marginLeft: '30px', borderLeft: '3px solid #555' }}>
//                         <div style={{display:'flex', justifyContent:'space-between'}}>
//                             <div style={{ fontSize: '12px', color: '#3498db', marginBottom: '3px' }}>
//                                 ↳ {reply.authorName} <span style={{ color: '#777', marginLeft: '5px' }}>{formatDate(reply.createdAt)}</span>
//                             </div>
//                             {(isAdmin || (user && user.uid === reply.uid)) && (
//                                 <button onClick={() => handleDeleteComment(reply.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>❌</button>
//                             )}
//                         </div>
//                         <div style={{fontSize:'14px', marginBottom:5}}>{reply.text}</div>
                        
//                         <div style={{display:'flex', gap:10, fontSize:'12px', color:'#aaa'}}>
//                             <span onClick={() => toggleCommentLike(reply)} style={{cursor:'pointer', color: reply.likes?.includes(user?.uid) ? '#e74c3c' : '#aaa'}}>
//                                 ❤️ {reply.likes?.length || 0}
//                             </span>
//                         </div>
//                     </div>
//                 ))}
//             </React.Fragment>
//           ))}
//         </div>
//       </div>

//       <button className="btn" style={{marginTop: 20, background: '#444', width:'100%'}} onClick={() => navigate('/board')}>↩️ {t.back}</button>
//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, deleteDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

const ADMIN_EMAIL = "kks3172@naver.com";

export default function BoardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = auth.currentUser;
  const { t } = useLanguage();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  // ⭐ [유지] 페이지 입장 시 스크롤 맨 위로
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "posts", id), (docSnap) => {
        if (docSnap.exists()) {
            setPost({ id: docSnap.id, ...docSnap.data() });
        } else {
            alert("Deleted post");
            navigate('/board');
        }
    });
    return () => unsub();
  }, [id, navigate]);

  useEffect(() => {
    const q = query(collection(db, "posts", id, "comments"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [id]);

  const handleToggleLike = async () => {
      if (!user) return alert("Login required");
      if (!post) return;

      const postRef = doc(db, "posts", id);
      const isLiked = post.likedBy?.includes(user.uid);

      try {
          if (isLiked) {
              await updateDoc(postRef, { likes: increment(-1), likedBy: arrayRemove(user.uid) });
          } else {
              await updateDoc(postRef, { likes: increment(1), likedBy: arrayUnion(user.uid) });
          }
      } catch (e) { console.error(e); }
  };

  const handleDeletePost = async () => {
    if (!window.confirm(t.bd_delete_confirm)) return;
    await deleteDoc(doc(db, "posts", id));
    navigate('/board');
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (!user) return alert("Login required");
    
    try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        let realName = "User";
        if (userDocSnap.exists()) realName = userDocSnap.data().name; 

        const commentData = {
            text: newComment, 
            uid: user.uid, 
            authorName: realName, 
            likes: [], 
            createdAt: serverTimestamp(),
            parentId: replyTo ? replyTo.id : null 
        };

        await addDoc(collection(db, "posts", id, "comments"), commentData);
        await updateDoc(doc(db, "posts", id), { commentCount: increment(1) });

        let receiverUid = null;
        if (replyTo) {
            receiverUid = replyTo.uid;
        } else {
            receiverUid = post.uid;
        }

        if (receiverUid && receiverUid !== user.uid) {
            await addDoc(collection(db, "notifications"), {
                receiverUid,
                senderUid: user.uid,
                senderName: realName,
                type: replyTo ? "reply" : "comment",
                postId: id,
                isRead: false,
                createdAt: serverTimestamp()
            });
        }

        setNewComment("");
        setReplyTo(null);
    } catch (e) { console.error(e); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm(t.bd_delete_confirm)) return;
    try {
        await deleteDoc(doc(db, "posts", id, "comments", commentId));
        await updateDoc(doc(db, "posts", id), { commentCount: increment(-1) });
    } catch (e) { console.error(e); }
  };

  const toggleCommentLike = async (comment) => {
      if (!user) return alert("Login required");
      const commentRef = doc(db, "posts", id, "comments", comment.id);
      const isLiked = comment.likes?.includes(user.uid);

      if (isLiked) await updateDoc(commentRef, { likes: arrayRemove(user.uid) });
      else await updateDoc(commentRef, { likes: arrayUnion(user.uid) });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
  };

  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // 🔥 [추가됨] 본문 내용 중 URL을 찾아 링크(a 태그)로 변환하는 함수
  const renderContentWithLinks = (text) => {
    if (!text) return "";
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    return text.split(urlRegex).map((part, index) => {
        if (part.match(urlRegex)) {
            return (
                <a 
                    key={index} 
                    href={part} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ color: '#3498db', textDecoration: 'underline', wordBreak: 'break-all' }}
                >
                    {part}
                </a>
            );
        }
        return part;
    });
  };

  if (!post) return <div style={{color:'white', padding:20}}>{t.loading}</div>;

  const isMyPost = user && user.uid === post.uid;
  const isAdm = user && user.email === ADMIN_EMAIL;
  const canManage = isMyPost || isAdm;
  const isLiked = user && post.likedBy?.includes(user.uid);
  
  const rootComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId) => comments.filter(c => c.parentId === parentId);
  const youtubeId = getYoutubeId(post.imageUrl);

  return (
    <div className="container" style={{ paddingTop: 30, background: '#1e272e', minHeight: '100vh', color: 'white', padding: '20px' }}>
      
      <div style={{ background: '#2c3e50', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
        <h2 style={{ color: '#f1c40f', marginBottom: '10px' }}>
            {post.isNotice && <span style={{color:'#e74c3c', marginRight:5}}>[{t.bd_notice}]</span>}
            {post.title}
        </h2>
        <div style={{ fontSize: '13px', color: '#bdc3c7', marginBottom: '20px', borderBottom: '1px solid #555', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems:'center' }}>
          <span>✍️ {post.authorName}</span>
          <div style={{display:'flex', gap: 10}}>
              <span>📅 {formatDate(post.createdAt)}</span>
          </div>
        </div>

        {youtubeId ? (
            <div style={{ marginBottom: 20, textAlign: 'center' }}>
                <iframe 
                    width="100%" 
                    height="315" 
                    src={`https://www.youtube.com/embed/${youtubeId}`} 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen 
                    style={{ borderRadius: 10, boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
                ></iframe>
            </div>
        ) : (
            post.imageUrl && (
                <div style={{ marginBottom: 20, textAlign: 'center' }}>
                    <img src={post.imageUrl} alt="img" style={{ maxWidth: '100%', borderRadius: 10, boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }} />
                </div>
            )
        )}

        {/* 🔥 [변경됨] 내용 렌더링 시 링크 변환 함수 적용 */}
        <div style={{ minHeight: '100px', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize:'16px' }}>
          {renderContentWithLinks(post.content)}
        </div>

        <div style={{ marginTop: 30, textAlign: 'center' }}>
            <button onClick={handleToggleLike} className="btn" style={{ 
                background: isLiked ? '#e74c3c' : '#34495e', 
                border: '1px solid #e74c3c',
                padding: '10px 30px', borderRadius: 30, fontSize: 18, 
                display: 'inline-flex', alignItems: 'center', gap: 5,
                transition: 'all 0.2s'
            }}>
                {isLiked ? '❤️' : '🤍'} {t.bd_like} {post.likes || 0}
            </button>
        </div>

        {canManage && (
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button className="btn" style={{ padding: '5px 15px', fontSize: '14px', background: '#3498db' }} onClick={() => navigate('/board/write', { state: { post } })}>{t.bd_edit}</button>
            <button className="btn" style={{ padding: '5px 15px', fontSize: '14px', background: '#e74c3c' }} onClick={handleDeletePost}>{t.bd_delete}</button>
          </div>
        )}
      </div>

      <div style={{ background: '#222', padding: '15px', borderRadius: '10px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>💬 {t.bd_comments} ({post.commentCount || 0})</h3>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexDirection:'column' }}>
          {replyTo && (
              <div style={{fontSize:'13px', color:'#3498db', marginBottom:'-5px'}}>
                  @{replyTo.authorName} {t.bd_reply}
                  <button onClick={() => setReplyTo(null)} style={{marginLeft:10, background:'none', border:'none', color:'#e74c3c', cursor:'pointer'}}>x {t.bd_cancel_reply}</button>
              </div>
          )}
          <div style={{display:'flex', gap:10}}>
              <input 
                value={newComment} 
                onChange={(e) => setNewComment(e.target.value)} 
                placeholder={replyTo ? t.bd_reply_input : t.bd_comment_input} 
                style={{ flex: 1, padding: '10px', borderRadius: '5px', border: 'none' }}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button className="btn" style={{ background: '#f1c40f', color: 'black', fontWeight: 'bold' }} onClick={handleAddComment}>{t.bd_register}</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {rootComments.map(c => (
            <React.Fragment key={c.id}>
                <div style={{ background: '#333', padding: '10px', borderRadius: '5px' }}>
                  <div style={{display:'flex', justifyContent:'space-between'}}>
                      <div style={{ fontSize: '12px', color: '#f1c40f', marginBottom: '3px' }}>
                        {c.authorName} <span style={{ color: '#777', marginLeft: '5px' }}>{formatDate(c.createdAt)}</span>
                      </div>
                      {(isAdm || (user && user.uid === c.uid)) && (
                        <button onClick={() => handleDeleteComment(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>❌</button>
                      )}
                  </div>
                  <div style={{fontSize:'14px', marginBottom:5}}>{c.text}</div>
                  
                  <div style={{display:'flex', gap:10, fontSize:'12px', color:'#aaa'}}>
                      <span onClick={() => toggleCommentLike(c)} style={{cursor:'pointer', color: c.likes?.includes(user?.uid) ? '#e74c3c' : '#aaa'}}>
                          ❤️ {c.likes?.length || 0}
                      </span>
                      <span onClick={() => setReplyTo(c)} style={{cursor:'pointer'}}>↪️ {t.bd_reply}</span>
                  </div>
                </div>

                {getReplies(c.id).map(reply => (
                    <div key={reply.id} style={{ background: '#2c2c2c', padding: '10px', borderRadius: '5px', marginLeft: '30px', borderLeft: '3px solid #555' }}>
                        <div style={{display:'flex', justifyContent:'space-between'}}>
                            <div style={{ fontSize: '12px', color: '#3498db', marginBottom: '3px' }}>
                                ↳ {reply.authorName} <span style={{ color: '#777', marginLeft: '5px' }}>{formatDate(reply.createdAt)}</span>
                            </div>
                            {(isAdm || (user && user.uid === reply.uid)) && (
                                <button onClick={() => handleDeleteComment(reply.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>❌</button>
                            )}
                        </div>
                        <div style={{fontSize:'14px', marginBottom:5}}>{reply.text}</div>
                        
                        <div style={{display:'flex', gap:10, fontSize:'12px', color:'#aaa'}}>
                            <span onClick={() => toggleCommentLike(reply)} style={{cursor:'pointer', color: reply.likes?.includes(user?.uid) ? '#e74c3c' : '#aaa'}}>
                                ❤️ {reply.likes?.length || 0}
                            </span>
                        </div>
                    </div>
                ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      <button className="btn" style={{marginTop: 20, background: '#444', width:'100%'}} onClick={() => navigate('/board')}>↩️ {t.back}</button>
    </div>
  );
}