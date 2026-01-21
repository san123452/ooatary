import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, deleteDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';

export default function BoardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    // 게시글 실시간 감지 (좋아요/댓글수 변화 반영을 위해 onSnapshot 권장)
    const unsub = onSnapshot(doc(db, "posts", id), (docSnap) => {
        if (docSnap.exists()) {
            setPost({ id: docSnap.id, ...docSnap.data() });
        } else {
            alert("삭제된 게시글입니다.");
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

  // ❤️ 좋아요 토글 함수
  const handleToggleLike = async () => {
      if (!user) return alert("로그인이 필요합니다.");
      if (!post) return;

      const postRef = doc(db, "posts", id);
      const isLiked = post.likedBy?.includes(user.uid);

      try {
          if (isLiked) {
              // 좋아요 취소
              await updateDoc(postRef, {
                  likes: increment(-1),
                  likedBy: arrayRemove(user.uid)
              });
          } else {
              // 좋아요 등록
              await updateDoc(postRef, {
                  likes: increment(1),
                  likedBy: arrayUnion(user.uid)
              });
          }
      } catch (e) {
          console.error("좋아요 오류:", e);
      }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    await deleteDoc(doc(db, "posts", id));
    navigate('/board');
  };

  // 💬 댓글 작성 (댓글 수 증가 추가됨)
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (!user) return alert("로그인이 필요합니다.");
    
    try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        let realName = "익명";
        if (userDocSnap.exists()) realName = userDocSnap.data().name; 

        // 1. 댓글 컬렉션에 추가
        await addDoc(collection(db, "posts", id, "comments"), {
            text: newComment,
            uid: user.uid,
            authorName: realName,
            createdAt: serverTimestamp()
        });

        // 2. 게시글 문서의 commentCount 증가
        await updateDoc(doc(db, "posts", id), {
            commentCount: increment(1)
        });

        setNewComment("");
    } catch (e) {
        console.error(e);
    }
  };

  // 💬 댓글 삭제 (댓글 수 감소 추가됨)
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("댓글을 삭제할까요?")) return;
    try {
        await deleteDoc(doc(db, "posts", id, "comments", commentId));
        await updateDoc(doc(db, "posts", id), {
            commentCount: increment(-1)
        });
    } catch (e) { console.error(e); }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
  };

  if (!post) return <div style={{color:'white', padding:20}}>로딩중...</div>;

  const isMyPost = user && user.uid === post.uid;
  const isLiked = user && post.likedBy?.includes(user.uid); // 내가 좋아요 눌렀는지 확인

  return (
    <div className="container" style={{ paddingTop: 30, background: '#1e272e', minHeight: '100vh', color: 'white', padding: '20px' }}>
      
      {/* 게시글 본문 */}
      <div style={{ background: '#2c3e50', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
        <h2 style={{ color: '#f1c40f', marginBottom: '10px' }}>
            {post.isNotice && <span style={{color:'#e74c3c', marginRight:5}}>[공지]</span>}
            {post.title}
        </h2>
        <div style={{ fontSize: '13px', color: '#bdc3c7', marginBottom: '20px', borderBottom: '1px solid #555', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems:'center' }}>
          <span>✍️ {post.authorName}</span>
          <div style={{display:'flex', gap: 10}}>
              <span>👀 조회수 ?</span>
              <span>📅 {formatDate(post.createdAt)}</span>
          </div>
        </div>

        {/* 🖼️ 이미지 출력 */}
        {post.imageUrl && (
            <div style={{ marginBottom: 20, textAlign: 'center' }}>
                <img src={post.imageUrl} alt="첨부 이미지" style={{ maxWidth: '100%', borderRadius: 10, boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }} />
            </div>
        )}

        <div style={{ minHeight: '100px', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize:'16px' }}>
          {post.content}
        </div>

        {/* ❤️ 좋아요 버튼 */}
        <div style={{ marginTop: 30, textAlign: 'center' }}>
            <button onClick={handleToggleLike} className="btn" style={{ 
                background: isLiked ? '#e74c3c' : '#34495e', 
                border: '1px solid #e74c3c',
                padding: '10px 30px', borderRadius: 30, fontSize: 18, 
                display: 'inline-flex', alignItems: 'center', gap: 5,
                transition: 'all 0.2s'
            }}>
                {isLiked ? '❤️' : '🤍'} 좋아요 {post.likes || 0}
            </button>
        </div>

        {isMyPost && (
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button className="btn" style={{ padding: '5px 15px', fontSize: '14px', background: '#3498db' }} 
              onClick={() => navigate('/board/write', { state: { post } })}>수정</button>
            <button className="btn" style={{ padding: '5px 15px', fontSize: '14px', background: '#e74c3c' }} 
              onClick={handleDeletePost}>삭제</button>
          </div>
        )}
      </div>

      {/* 댓글 섹션 */}
      <div style={{ background: '#222', padding: '15px', borderRadius: '10px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>💬 댓글 ({post.commentCount || comments.length})</h3>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input 
            value={newComment} 
            onChange={(e) => setNewComment(e.target.value)} 
            placeholder="댓글을 입력하세요..." 
            style={{ flex: 1, padding: '10px', borderRadius: '5px', border: 'none' }}
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
          />
          <button className="btn" style={{ background: '#f1c40f', color: 'black', fontWeight: 'bold' }} onClick={handleAddComment}>등록</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {comments.map(c => (
            <div key={c.id} style={{ background: '#333', padding: '10px', borderRadius: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#f1c40f', marginBottom: '3px' }}>
                  {c.authorName} <span style={{ color: '#777', marginLeft: '5px' }}>{formatDate(c.createdAt)}</span>
                </div>
                <div>{c.text}</div>
              </div>
              {user && user.uid === c.uid && (
                <button onClick={() => handleDeleteComment(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>❌</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <button className="btn" style={{marginTop: 20, background: '#444', width:'100%'}} onClick={() => navigate('/board')}>↩️ 목록으로</button>
    </div>
  );
}