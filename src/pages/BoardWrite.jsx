import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';

export default function BoardWrite() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = auth.currentUser;
  
  const editData = location.state?.post; 
  
  const [title, setTitle] = useState(editData ? editData.title : '');
  const [content, setContent] = useState(editData ? editData.content : '');
  const [imageUrl, setImageUrl] = useState(editData ? editData.imageUrl : ''); // 🖼️ 이미지 URL 상태
  const [isNotice, setIsNotice] = useState(editData ? editData.isNotice : false); // 📢 공지글 상태

  // 관리자 이메일 확인 (이전 규칙 참고)
  const isAdmin = user?.email === "kks3172@naver.com";

  useEffect(() => {
    if (!user) { alert("로그인이 필요합니다."); navigate('/login'); }
  }, [user, navigate]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return alert("제목과 내용을 입력하세요.");

    try {
      if (editData) {
        // 수정 로직
        const postRef = doc(db, "posts", editData.id);
        await updateDoc(postRef, {
          title,
          content,
          imageUrl, // 이미지 업데이트
          isNotice: isAdmin ? isNotice : false, // 관리자만 공지 설정 가능
        });
        alert("수정 완료!");
      } else {
        // 새 글 작성
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        let realName = "익명";
        if (userDocSnap.exists()) {
            realName = userDocSnap.data().name;
        }

        await addDoc(collection(db, "posts"), {
          title,
          content,
          imageUrl, // 이미지 저장
          uid: user.uid,
          authorName: realName,
          likes: 0, // ❤️ 좋아요 초기값
          likedBy: [], // ❤️ 좋아요 누른 사람 목록
          commentCount: 0, // 💬 댓글 수 초기값
          isNotice: isAdmin ? isNotice : false, // 📢 공지 여부
          createdAt: serverTimestamp()
        });
        alert("등록 완료!");
      }
      navigate('/board');
    } catch (e) {
      console.error(e);
      alert("오류 발생");
    }
  };

  return (
    <div className="container" style={{ paddingTop: 30, background: '#1e272e', minHeight: '100vh', color: 'white', padding: '20px' }}>
      <h2 style={{ color: '#f1c40f' }}>{editData ? "📝 글 수정하기" : "🖊️ 새 글 쓰기"}</h2>
      
      {/* 📢 관리자 전용 공지 체크박스 */}
      {isAdmin && (
        <div style={{ marginBottom: 10, background:'#2c3e50', padding: 10, borderRadius: 5 }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 5, fontWeight: 'bold', color: '#e74c3c' }}>
                <input type="checkbox" checked={isNotice} onChange={(e) => setIsNotice(e.target.checked)} />
                📢 이 글을 공지사항으로 등록 (상단 고정)
            </label>
        </div>
      )}

      <input 
        className="input" 
        placeholder="제목을 입력하세요" 
        value={title} 
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: '100%', marginBottom: '10px', background: '#2c3e50', color: 'white', border: '1px solid #555' }}
      />

      {/* 🖼️ 이미지 URL 입력 */}
      <input 
        className="input" 
        placeholder="이미지 주소(URL)를 입력하세요 (선택사항)" 
        value={imageUrl} 
        onChange={(e) => setImageUrl(e.target.value)}
        style={{ width: '100%', marginBottom: '10px', background: '#2c3e50', color: 'white', border: '1px solid #555' }}
      />
      
      {/* 이미지 미리보기 */}
      {imageUrl && (
          <div style={{ marginBottom: 10, textAlign: 'center' }}>
              <img src={imageUrl} alt="미리보기" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: 10 }} onError={(e) => e.target.style.display='none'} />
          </div>
      )}
      
      <textarea 
        className="input" 
        placeholder="내용을 자유롭게 적어주세요..." 
        value={content} 
        onChange={(e) => setContent(e.target.value)}
        style={{ width: '100%', height: '300px', marginBottom: '10px', background: '#2c3e50', color: 'white', border: '1px solid #555', resize: 'none' }}
      />

      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn" style={{ flex: 1, background: '#7f8c8d' }} onClick={() => navigate(-1)}>취소</button>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit}>
          {editData ? "수정 완료" : "등록하기"}
        </button>
      </div>
    </div>
  );
}