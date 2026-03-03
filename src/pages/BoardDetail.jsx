

// import React, { useState, useEffect } from 'react';
// import { db, auth } from '../firebase';
// import { doc, getDoc, deleteDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
// import { useNavigate, useParams } from 'react-router-dom';
// import { useLanguage } from '../LanguageContext';
// import { InstagramEmbed } from 'react-social-media-embed';

// const ADMIN_EMAIL = "kks3172@naver.com";

// export default function BoardDetail() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const user = auth.currentUser;
//   const { t } = useLanguage();

//   const [post, setPost] = useState(null);
//   const [comments, setComments] = useState([]);
//   const [newComment, setNewComment] = useState("");
//   const [newCommentImage, setNewCommentImage] = useState(""); 
//   const [replyTo, setReplyTo] = useState(null);

//   useEffect(() => { window.scrollTo(0, 0); }, []);

//   useEffect(() => {
//     const unsub = onSnapshot(doc(db, "posts", id), (docSnap) => {
//         if (docSnap.exists()) setPost({ id: docSnap.id, ...docSnap.data() });
//         else { alert("Deleted post"); navigate('/board'); }
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

//   const handleToggleLike = async () => {
//       if (!user) return alert("Login required");
//       const postRef = doc(db, "posts", id);
//       const isLiked = post.likedBy?.includes(user.uid);
//       if (isLiked) await updateDoc(postRef, { likes: increment(-1), likedBy: arrayRemove(user.uid) });
//       else await updateDoc(postRef, { likes: increment(1), likedBy: arrayUnion(user.uid) });
//   };

//   // 🗳️ 투표 로직
//   const handleVote = async (optionIdx) => {
//     if (!user) return alert("Login required");
//     if (post.poll.options.some(o => o.voters.includes(user.uid))) return alert("이미 투표하셨습니다.");
//     const uSnap = await getDoc(doc(db, "users", user.uid));
//     const newOptions = [...post.poll.options];
//     newOptions[optionIdx].voters.push(user.uid);
//     newOptions[optionIdx].voterNames.push(uSnap.data()?.name || "익명");
//     await updateDoc(doc(db, "posts", id), { "poll.options": newOptions });
//   };

//   const handleAddComment = async () => {
//     if (!newComment.trim() && !newCommentImage.trim()) return; 
//     if (!user) return alert("Login required");
//     const deviceFingerprint = localStorage.getItem('oa_device_id') || "Unknown";

//     try {
//         const userDocSnap = await getDoc(doc(db, "users", user.uid));
//         const userData = userDocSnap.data();
//         const commentData = {
//             text: newComment, imageUrl: newCommentImage.trim(), uid: user.uid, 
//             authorName: userData.name, authorTitle: userData.userTitle || "", 
//             authorTitleColor: userData.userTitleColor || "", likes: [], 
//             createdAt: serverTimestamp(), parentId: replyTo ? replyTo.id : null,
//             deviceId: deviceFingerprint 
//         };
//         await addDoc(collection(db, "posts", id, "comments"), commentData);
//         await updateDoc(doc(db, "posts", id), { commentCount: increment(1) });
        
//         const receiverUid = replyTo ? replyTo.uid : post.uid;
//         if (receiverUid && receiverUid !== user.uid) {
//             await addDoc(collection(db, "notifications"), {
//                 receiverUid, senderUid: user.uid, senderName: userData.name, 
//                 type: replyTo ? "reply" : "comment", postId: id, isRead: false, createdAt: serverTimestamp()
//             });
//         }
//         setNewComment(""); setNewCommentImage(""); setReplyTo(null);
//     } catch (e) { console.error(e); }
//   };

//   const handleDeletePost = async () => { if (!window.confirm(t.bd_delete_confirm)) return; await deleteDoc(doc(db, "posts", id)); navigate('/board'); };
//   const handleDeleteComment = async (cid) => { if (!window.confirm(t.bd_delete_confirm)) return; await deleteDoc(doc(db, "posts", id, "comments", cid)); await updateDoc(doc(db, "posts", id), { commentCount: increment(-1) }); };
//   const toggleCommentLike = async (c) => { const ref = doc(db, "posts", id, "comments", c.id); if (c.likes?.includes(user?.uid)) await updateDoc(ref, { likes: arrayRemove(user.uid) }); else await updateDoc(ref, { likes: arrayUnion(user.uid) }); };

//   const getYoutubeId = (url) => {
//     const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
//     const match = (url || "").match(regExp);
//     return (match && match[2].length === 11) ? match[2] : null;
//   };

//   const renderContentWithLinks = (text) => {
//     if (!text) return "";
//     const urlRegex = /(https?:\/\/[^\s]+)/g;
//     return text.split(urlRegex).map((part, i) => part.match(urlRegex) ? <a key={i} href={part} target="_blank" rel="noreferrer" style={{ color: '#3498db', textDecoration: 'underline' }}>{part}</a> : part);
//   };

//   if (!post) return <div style={{color:'white', padding:20}}>{t.loading}</div>;

//   // ⭐️ [수정] 누락되었던 변수 선언 추가
//   const isMyPost = user && user.uid === post.uid;
//   const isAdm = user && user.email === ADMIN_EMAIL;
//   const rootComments = comments.filter(c => !c.parentId);
//   const getReplies = (pid) => comments.filter(c => c.parentId === pid);
//   const yid = getYoutubeId(post.imageUrl);

//   return (
//     <div className="container" style={{ paddingTop: 30, background: '#1e272e', minHeight: '100vh', color: 'white', padding: '20px' }}>
//       <div style={{ background: '#2c3e50', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
//         <h2 style={{ color: '#f1c40f', marginBottom: '10px' }}>{post.isNotice && <span style={{color:'#e74c3c'}}>[{t.bd_notice}]</span>} {post.title}</h2>
//         <div style={{ fontSize: '13px', color: '#bdc3c7', marginBottom: '20px', borderBottom: '1px solid #555', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems:'center' }}>
//           <span>✍️ {post.authorTitle && <span style={{ color: post.authorTitleColor, fontWeight:'bold' }}>[{post.authorTitle}]</span>} {post.authorName}</span>
//           <div>
//             {isAdm && post.deviceId && <span style={{ background: '#e67e22', color: 'white', padding: '2px 6px', borderRadius: 4, fontSize: 11, marginRight: 10, fontWeight:'bold' }}>기기: {post.deviceId}</span>}
//             <span>📅 {post.createdAt?.toDate().toLocaleString()}</span>
//           </div>
//         </div>

//         {post.instagramUrl && <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}><InstagramEmbed url={post.instagramUrl} width={328} /></div>}
//         {yid ? <div style={{ marginBottom: 20 }}><iframe width="100%" height="315" src={`https://www.youtube.com/embed/${yid}`} frameBorder="0" allowFullScreen style={{ borderRadius: 10 }}></iframe></div> : post.imageUrl && <div style={{ marginBottom: 20, textAlign: 'center' }}><img src={post.imageUrl} alt="img" style={{ maxWidth: '100%', borderRadius: 10 }} /></div>}

//         {/* 🗳️ 투표 영역 */}
//         {post.poll && (
//           <div style={{ background: '#1e272e', padding: '20px', borderRadius: '10px', marginBottom: '25px', border: '1px solid #f1c40f' }}>
//             <h3 style={{ color: '#f1c40f', marginTop: 0, fontSize: '18px' }}>📊 {post.poll.question}</h3>
//             {post.poll.options.map((opt, idx) => {
//               const total = post.poll.options.reduce((a, b) => a + b.voters.length, 0);
//               const per = total === 0 ? 0 : Math.round((opt.voters.length / total) * 100);
//               const voted = post.poll.options.some(o => o.voters.includes(user?.uid));
//               return (
//                 <div key={idx} style={{ marginBottom: 15 }}>
//                   <button onClick={() => !voted && handleVote(idx)} style={{ width: '100%', padding: '12px', background: '#34495e', border: 'none', borderRadius: '5px', color: 'white', textAlign: 'left', position: 'relative', overflow: 'hidden', cursor: voted ? 'default' : 'pointer' }}>
//                     <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${per}%`, background: 'rgba(241, 196, 15, 0.2)', transition: 'width 0.5s' }} />
//                     <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>{opt.text}</span><span>{per}% ({opt.voters.length})</span></div>
//                   </button>
//                   <div style={{ fontSize: '11px', color: '#888', marginTop: '4px', paddingLeft: 5 }}>👥 투표자: {opt.voterNames?.join(", ") || "없음"}</div>
//                 </div>
//               );
//             })}
//           </div>
//         )}

//         <div style={{ minHeight: '100px', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: 16 }}>{renderContentWithLinks(post.content)}</div>
//         <div style={{ marginTop: 30, textAlign: 'center' }}><button onClick={handleToggleLike} style={{ background: post.likedBy?.includes(user?.uid) ? '#e74c3c' : '#34495e', border: '1px solid #e74c3c', padding: '10px 30px', borderRadius: 30, color: 'white', fontSize: 18 }}>{post.likedBy?.includes(user?.uid) ? '❤️' : '🤍'} {t.bd_like} {post.likes || 0}</button></div>
        
//         {/* ⭐️ 수정된 부분: isMyPost 오류 해결 */}
//         {(isMyPost || isAdm) && (
//           <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
//             <button className="btn" style={{background:'#3498db', fontSize:14}} onClick={() => navigate('/board/write', { state: { post } })}>{t.bd_edit}</button>
//             <button className="btn" style={{background:'#e74c3c', fontSize:14}} onClick={handleDeletePost}>{t.bd_delete}</button>
//           </div>
//         )}
//       </div>

//       <div style={{ background: '#222', padding: '15px', borderRadius: '10px' }}>
//         <h3>💬 {t.bd_comments} ({post.commentCount || 0})</h3>
//         <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:20 }}>
//             {replyTo && <div style={{fontSize:12, color:'#3498db'}}>@{replyTo.authorName}님에게 답글 작성 중 <button onClick={()=>setReplyTo(null)} style={{color:'#e74c3c', background:'none', border:'none'}}>취소</button></div>}
//             <input value={newCommentImage} onChange={(e)=>setNewCommentImage(e.target.value)} placeholder="🖼️ 이미지 URL (선택)" style={{ padding:8, background:'#333', color:'white', border:'1px solid #555', borderRadius:5 }} />
//             <div style={{display:'flex', gap:10}}><input value={newComment} onChange={(e)=>setNewComment(e.target.value)} placeholder={t.bd_comment_input} style={{ flex:1, padding:10, borderRadius:5 }} /><button onClick={handleAddComment} style={{ background:'#f1c40f', color:'black', padding:'0 20px', borderRadius:5, fontWeight:'bold' }}>{t.bd_register}</button></div>
//         </div>

//         {rootComments.map(c => (
//           <React.Fragment key={c.id}>
//             <div style={{ background: '#333', padding: '12px', borderRadius: '8px', marginBottom: 8 }}>
//               <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 5}}>
//                 <span style={{ fontSize: '12px', color: '#f1c40f', fontWeight:'bold' }}>{c.authorTitle && `[${c.authorTitle}] `}{c.authorName}</span>
//                 <div style={{display:'flex', alignItems:'center', gap: 8}}>
//                     {isAdm && c.deviceId && <span style={{ background: '#d35400', color: 'white', padding: '1px 5px', borderRadius: 3, fontSize: 10, fontWeight:'bold' }}>기기: {c.deviceId}</span>}
//                     {(isAdm || user?.uid === c.uid) && <button onClick={() => handleDeleteComment(c.id)} style={{background:'none', border:'none', cursor:'pointer'}}>❌</button>}
//                 </div>
//               </div>
//               {c.imageUrl && <img src={c.imageUrl} style={{ maxWidth: 200, display:'block', margin:'10px 0', borderRadius: 5 }} />}
//               <div style={{fontSize: 14, marginBottom: 8}}>{c.text}</div>
//               <div style={{fontSize: 12, color:'#aaa', display:'flex', gap: 15}}><span onClick={()=>toggleCommentLike(c)} style={{cursor:'pointer', color: c.likes?.includes(user?.uid) ? '#e74c3c' : '#aaa'}}>❤️ {c.likes?.length || 0}</span> <span onClick={()=>setReplyTo(c)} style={{cursor:'pointer'}}>↪️ 답글</span> <span>{c.createdAt?.toDate().toLocaleString()}</span></div>
//             </div>
//             {getReplies(c.id).map(r => (
//               <div key={r.id} style={{ background: '#2c2c2c', padding: '10px', borderRadius: '8px', marginLeft: '30px', marginBottom: 8, borderLeft: '3px solid #555' }}>
//                 <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
//                     <span style={{ fontSize: '12px', color: '#3498db', fontWeight:'bold' }}>↳ {r.authorName}</span>
//                     {isAdm && r.deviceId && <span style={{ background: '#d35400', color: 'white', padding: '1px 5px', borderRadius: 3, fontSize: 10, fontWeight:'bold' }}>기기: {r.deviceId}</span>}
//                 </div>
//                 {r.imageUrl && <img src={r.imageUrl} style={{ maxWidth: 150, display:'block', margin:'5px 0', borderRadius: 5 }} />}
//                 <div style={{fontSize: 14}}>{r.text}</div>
//               </div>
//             ))}
//           </React.Fragment>
//         ))}
//       </div>
//       <button style={{marginTop: 20, background: '#444', width:'100%', padding:15, border:'none', color:'white', borderRadius:8}} onClick={() => navigate('/board')}>↩️ {t.back}</button>
//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, deleteDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { InstagramEmbed } from 'react-social-media-embed';

const ADMIN_EMAIL = "kks3172@naver.com";

export default function BoardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = auth.currentUser;
  const { t } = useLanguage();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [newCommentImage, setNewCommentImage] = useState(""); 
  const [replyTo, setReplyTo] = useState(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "posts", id), (docSnap) => {
        if (docSnap.exists()) setPost({ id: docSnap.id, ...docSnap.data() });
        else { alert("Deleted post"); navigate('/board'); }
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

  // 💰 좋아요 보상 및 취소 불가 로직 적용
  const handleToggleLike = async () => {
      if (!user) return alert("Login required");
      if (!post) return;

      const postRef = doc(db, "posts", id);
      const isLiked = post.likedBy?.includes(user.uid);

      // 🚫 이미 좋아요를 눌렀다면 취소 불가
      if (isLiked) {
          return alert("이미 좋아요를 누르셨습니다. (취소 불가)");
      }

      try {
          // 1. 게시글 좋아요 정보 업데이트
          await updateDoc(postRef, { 
              likes: increment(1), 
              likedBy: arrayUnion(user.uid) 
          });

          // 2. 글쓴이에게 100만 포인트 보상 (본인 글 제외)
          if (post.uid && post.uid !== user.uid) {
              const authorRef = doc(db, "users", post.uid);
              await updateDoc(authorRef, {
                  point: increment(1000000)
              });

              // 3. 히스토리 기록
              await addDoc(collection(db, "history"), {
                  uid: post.uid,
                  type: "보상",
                  msg: `게시글 좋아요 보상 (${post.title})`,
                  amount: 1000000,
                  createdAt: serverTimestamp()
              });
          }
      } catch (e) { 
          console.error(e); 
      }
  };

  const handleVote = async (optionIdx) => {
    if (!user) return alert("Login required");
    if (post.poll.options.some(o => o.voters.includes(user.uid))) return alert("이미 투표하셨습니다.");
    const uSnap = await getDoc(doc(db, "users", user.uid));
    const newOptions = [...post.poll.options];
    newOptions[optionIdx].voters.push(user.uid);
    newOptions[optionIdx].voterNames.push(uSnap.data()?.name || "익명");
    await updateDoc(doc(db, "posts", id), { "poll.options": newOptions });
  };

  const handleAddComment = async () => {
    if (!newComment.trim() && !newCommentImage.trim()) return; 
    if (!user) return alert("Login required");
    const deviceFingerprint = localStorage.getItem('oa_device_id') || "Unknown";

    try {
        const userDocSnap = await getDoc(doc(db, "users", user.uid));
        const userData = userDocSnap.data();
        const commentData = {
            text: newComment, imageUrl: newCommentImage.trim(), uid: user.uid, 
            authorName: userData.name, authorTitle: userData.userTitle || "", 
            authorTitleColor: userData.userTitleColor || "", likes: [], 
            createdAt: serverTimestamp(), parentId: replyTo ? replyTo.id : null,
            deviceId: deviceFingerprint 
        };
        await addDoc(collection(db, "posts", id, "comments"), commentData);
        await updateDoc(doc(db, "posts", id), { commentCount: increment(1) });
        
        const receiverUid = replyTo ? replyTo.uid : post.uid;
        if (receiverUid && receiverUid !== user.uid) {
            await addDoc(collection(db, "notifications"), {
                receiverUid, senderUid: user.uid, senderName: userData.name, 
                type: replyTo ? "reply" : "comment", postId: id, isRead: false, createdAt: serverTimestamp()
            });
        }
        setNewComment(""); setNewCommentImage(""); setReplyTo(null);
    } catch (e) { console.error(e); }
  };

  const handleDeletePost = async () => { if (!window.confirm(t.bd_delete_confirm)) return; await deleteDoc(doc(db, "posts", id)); navigate('/board'); };
  const handleDeleteComment = async (cid) => { if (!window.confirm(t.bd_delete_confirm)) return; await deleteDoc(doc(db, "posts", id, "comments", cid)); await updateDoc(doc(db, "posts", id), { commentCount: increment(-1) }); };
  const toggleCommentLike = async (c) => { 
    const ref = doc(db, "posts", id, "comments", c.id); 
    if (c.likes?.includes(user?.uid)) await updateDoc(ref, { likes: arrayRemove(user.uid) }); 
    else await updateDoc(ref, { likes: arrayUnion(user.uid) }); 
  };

  const getYoutubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = (url || "").match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const renderContentWithLinks = (text) => {
    if (!text) return "";
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => part.match(urlRegex) ? <a key={i} href={part} target="_blank" rel="noreferrer" style={{ color: '#3498db', textDecoration: 'underline' }}>{part}</a> : part);
  };

  if (!post) return <div style={{color:'white', padding:20}}>{t.loading}</div>;

  const isMyPost = user && user.uid === post.uid;
  const isAdm = user && user.email === ADMIN_EMAIL;
  const rootComments = comments.filter(c => !c.parentId);
  const getReplies = (pid) => comments.filter(c => c.parentId === pid);
  const yid = getYoutubeId(post.imageUrl);

  return (
    <div className="container" style={{ paddingTop: 30, background: '#1e272e', minHeight: '100vh', color: 'white', padding: '20px' }}>
      <div style={{ background: '#2c3e50', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
        <h2 style={{ color: '#f1c40f', marginBottom: '10px' }}>{post.isNotice && <span style={{color:'#e74c3c'}}>[{t.bd_notice}]</span>} {post.title}</h2>
        <div style={{ fontSize: '13px', color: '#bdc3c7', marginBottom: '20px', borderBottom: '1px solid #555', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems:'center' }}>
          <span>✍️ {post.authorTitle && <span style={{ color: post.authorTitleColor, fontWeight:'bold' }}>[{post.authorTitle}]</span>} {post.authorName}</span>
          <div>
            {isAdm && post.deviceId && <span style={{ background: '#e67e22', color: 'white', padding: '2px 6px', borderRadius: 4, fontSize: 11, marginRight: 10, fontWeight:'bold' }}>기기: {post.deviceId}</span>}
            <span>📅 {post.createdAt?.toDate().toLocaleString()}</span>
          </div>
        </div>

        {post.instagramUrl && <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}><InstagramEmbed url={post.instagramUrl} width={328} /></div>}
        {yid ? <div style={{ marginBottom: 20 }}><iframe width="100%" height="315" src={`https://www.youtube.com/embed/${yid}`} frameBorder="0" allowFullScreen style={{ borderRadius: 10 }}></iframe></div> : post.imageUrl && <div style={{ marginBottom: 20, textAlign: 'center' }}><img src={post.imageUrl} alt="img" style={{ maxWidth: '100%', borderRadius: 10 }} /></div>}

        {/* 🗳️ 투표 영역 */}
        {post.poll && (
          <div style={{ background: '#1e272e', padding: '20px', borderRadius: '10px', marginBottom: '25px', border: '1px solid #f1c40f' }}>
            <h3 style={{ color: '#f1c40f', marginTop: 0, fontSize: '18px' }}>📊 {post.poll.question}</h3>
            {post.poll.options.map((opt, idx) => {
              const total = post.poll.options.reduce((a, b) => a + b.voters.length, 0);
              const per = total === 0 ? 0 : Math.round((opt.voters.length / total) * 100);
              const voted = post.poll.options.some(o => o.voters.includes(user?.uid));
              return (
                <div key={idx} style={{ marginBottom: 15 }}>
                  <button onClick={() => !voted && handleVote(idx)} style={{ width: '100%', padding: '12px', background: '#34495e', border: 'none', borderRadius: '5px', color: 'white', textAlign: 'left', position: 'relative', overflow: 'hidden', cursor: voted ? 'default' : 'pointer' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${per}%`, background: 'rgba(241, 196, 15, 0.2)', transition: 'width 0.5s' }} />
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>{opt.text}</span><span>{per}% ({opt.voters.length})</span></div>
                  </button>
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '4px', paddingLeft: 5 }}>👥 투표자: {opt.voterNames?.join(", ") || "없음"}</div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ minHeight: '100px', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: 16 }}>{renderContentWithLinks(post.content)}</div>
        
        {/* ❤️ 좋아요 버튼 (누른 상태면 색깔 다르게 표시) */}
        <div style={{ marginTop: 30, textAlign: 'center' }}>
          <button 
            onClick={handleToggleLike} 
            style={{ 
              background: post.likedBy?.includes(user?.uid) ? '#e74c3c' : '#34495e', 
              border: '1px solid #e74c3c', 
              padding: '10px 30px', 
              borderRadius: 30, 
              color: 'white', 
              fontSize: 18,
              cursor: post.likedBy?.includes(user?.uid) ? 'default' : 'pointer'
            }}
          >
            {post.likedBy?.includes(user?.uid) ? '❤️' : '🤍'} {t.bd_like} {post.likes || 0}
          </button>
        </div>
        
        {(isMyPost || isAdm) && (
          <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn" style={{background:'#3498db', fontSize:14}} onClick={() => navigate('/board/write', { state: { post } })}>{t.bd_edit}</button>
            <button className="btn" style={{background:'#e74c3c', fontSize:14}} onClick={handleDeletePost}>{t.bd_delete}</button>
          </div>
        )}
      </div>

      <div style={{ background: '#222', padding: '15px', borderRadius: '10px' }}>
        <h3>💬 {t.bd_comments} ({post.commentCount || 0})</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:20 }}>
            {replyTo && <div style={{fontSize:12, color:'#3498db'}}>@{replyTo.authorName}님에게 답글 작성 중 <button onClick={()=>setReplyTo(null)} style={{color:'#e74c3c', background:'none', border:'none'}}>취소</button></div>}
            <input value={newCommentImage} onChange={(e)=>setNewCommentImage(e.target.value)} placeholder="🖼️ 이미지 URL (선택)" style={{ padding:8, background:'#333', color:'white', border:'1px solid #555', borderRadius:5 }} />
            <div style={{display:'flex', gap:10}}><input value={newComment} onChange={(e)=>setNewComment(e.target.value)} placeholder={t.bd_comment_input} style={{ flex:1, padding:10, borderRadius:5 }} /><button onClick={handleAddComment} style={{ background:'#f1c40f', color:'black', padding:'0 20px', borderRadius:5, fontWeight:'bold' }}>{t.bd_register}</button></div>
        </div>

        {rootComments.map(c => (
          <React.Fragment key={c.id}>
            <div style={{ background: '#333', padding: '12px', borderRadius: '8px', marginBottom: 8 }}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 5}}>
                <span style={{ fontSize: '12px', color: '#f1c40f', fontWeight:'bold' }}>{c.authorTitle && `[${c.authorTitle}] `}{c.authorName}</span>
                <div style={{display:'flex', alignItems:'center', gap: 8}}>
                    {isAdm && c.deviceId && <span style={{ background: '#d35400', color: 'white', padding: '1px 5px', borderRadius: 3, fontSize: 10, fontWeight:'bold' }}>기기: {c.deviceId}</span>}
                    {(isAdm || user?.uid === c.uid) && <button onClick={() => handleDeleteComment(c.id)} style={{background:'none', border:'none', cursor:'pointer'}}>❌</button>}
                </div>
              </div>
              {c.imageUrl && <img src={c.imageUrl} style={{ maxWidth: 200, display:'block', margin:'10px 0', borderRadius: 5 }} />}
              <div style={{fontSize: 14, marginBottom: 8}}>{c.text}</div>
              <div style={{fontSize: 12, color:'#aaa', display:'flex', gap: 15}}><span onClick={()=>toggleCommentLike(c)} style={{cursor:'pointer', color: c.likes?.includes(user?.uid) ? '#e74c3c' : '#aaa'}}>❤️ {c.likes?.length || 0}</span> <span onClick={()=>setReplyTo(c)} style={{cursor:'pointer'}}>↪️ 답글</span> <span>{c.createdAt?.toDate().toLocaleString()}</span></div>
            </div>
            {getReplies(c.id).map(r => (
              <div key={r.id} style={{ background: '#2c2c2c', padding: '10px', borderRadius: '8px', marginLeft: '30px', marginBottom: 8, borderLeft: '3px solid #555' }}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <span style={{ fontSize: '12px', color: '#3498db', fontWeight:'bold' }}>↳ {r.authorName}</span>
                    {isAdm && r.deviceId && <span style={{ background: '#d35400', color: 'white', padding: '1px 5px', borderRadius: 3, fontSize: 10, fontWeight:'bold' }}>기기: {r.deviceId}</span>}
                </div>
                {r.imageUrl && <img src={r.imageUrl} style={{ maxWidth: 150, display:'block', margin:'5px 0', borderRadius: 5 }} />}
                <div style={{fontSize: 14}}>{r.text}</div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
      <button style={{marginTop: 20, background: '#444', width:'100%', padding:15, border:'none', color:'white', borderRadius:8}} onClick={() => navigate('/board')}>↩️ {t.back}</button>
    </div>
  );
}