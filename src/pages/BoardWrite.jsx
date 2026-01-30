
// import React, { useState, useEffect } from 'react';
// import { db, auth } from '../firebase'; 
// // ❌ storage 관련 import 삭제함 (더 이상 안 씀)
// import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { useLanguage } from '../LanguageContext';

// export default function BoardWrite() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const user = auth.currentUser;
//   const { t } = useLanguage();
  
//   const editData = location.state?.post; 
  
//   const [title, setTitle] = useState(editData ? editData.title : '');
//   const [content, setContent] = useState(editData ? editData.content : '');
  
//   // 🖼️ 변경됨: 파일 객체 대신 단순히 '주소 문자열'만 관리합니다.
//   const [imageUrl, setImageUrl] = useState(editData ? editData.imageUrl : ''); 
  
//   const [isNotice, setIsNotice] = useState(editData ? editData.isNotice : false);
//   const [isSubmitting, setIsSubmitting] = useState(false); // 업로드 대신 '등록 중' 상태

//   // 관리자 권한 확인
//   const isAdmin = user?.email === "kks3172@naver.com";

//   useEffect(() => {
//     if (!user) { alert("로그인이 필요합니다."); navigate('/login'); }
//   }, [user, navigate]);

//   // 취소 버튼
//   const handleCancel = () => {
//       if (editData) navigate(`/board/${editData.id}`);
//       else navigate('/board');
//   };

//   // 등록/수정 버튼
//   const handleSubmit = async () => {
//     if (!title.trim() || !content.trim()) return alert("제목과 내용을 입력하세요.");
//     if (isSubmitting) return; 

//     setIsSubmitting(true); 

//     try {
//       // 🚀 파일 업로드 과정 삭제! 입력한 URL 그대로 사용
//       const finalImageUrl = imageUrl.trim(); 

//       if (editData) {
//         // [수정]
//         const postRef = doc(db, "posts", editData.id);
//         await updateDoc(postRef, {
//           title, 
//           content,
//           imageUrl: finalImageUrl, // 입력한 URL 업데이트
//           isNotice: isAdmin ? isNotice : false,
//         });
//         alert(t.bd_edit_complete || "수정 완료");
//         navigate(`/board/${editData.id}`);
//       } else {
//         // [새 글]
//         const userDocRef = doc(db, "users", user.uid);
//         const userDocSnap = await getDoc(userDocRef);
        
//         let realName = "User";
//         if (userDocSnap.exists()) {
//             realName = userDocSnap.data().name;
//         }

//         await addDoc(collection(db, "posts"), {
//           title, 
//           content,
//           imageUrl: finalImageUrl, // 입력한 URL 저장
//           uid: user.uid,
//           authorName: realName,
//           likes: 0, 
//           likedBy: [], 
//           commentCount: 0,
//           isNotice: isAdmin ? isNotice : false,
//           createdAt: serverTimestamp()
//         });
//         alert(t.alertComplete || "등록 완료");
//         navigate('/board');
//       }

//     } catch (e) {
//       console.error("Error:", e);
//       alert(t.alertError || "오류가 발생했습니다.");
//     } finally {
//       setIsSubmitting(false); 
//     }
//   };

//   return (
//     <div className="container" style={{ paddingTop: 30, background: '#1e272e', minHeight: '100vh', color: 'white', padding: '20px' }}>
//       <h2 style={{ color: '#f1c40f', marginBottom: '20px' }}>{editData ? (t.bd_edit_title || "글 수정") : (t.bd_new_title || "새 글 쓰기")}</h2>
      
//       {isAdmin && (
//         <div style={{ marginBottom: 15, background:'#2c3e50', padding: 10, borderRadius: 5 }}>
//             <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 5, fontWeight: 'bold', color: '#e74c3c' }}>
//                 <input type="checkbox" checked={isNotice} onChange={(e) => setIsNotice(e.target.checked)} />
//                 {t.bd_admin_notice || "공지사항 등록"}
//             </label>
//         </div>
//       )}

//       {/* 제목 입력 */}
//       <input 
//         className="input" 
//         placeholder={t.bd_input_title || "제목"} 
//         value={title} 
//         onChange={(e) => setTitle(e.target.value)}
//         style={{ width: '100%', marginBottom: '15px', background: '#2c3e50', color: 'white', border: '1px solid #555', padding: '10px', borderRadius: '5px' }} 
//       />

//       {/* 🖼️ [변경됨] 이미지 URL 입력창 */}
//       <div style={{ marginBottom: 15 }}>
//           <label style={{ display:'block', marginBottom: 5, color:'#ccc', fontSize:'14px' }}>📸 이미지 주소 (URL)</label>
//           <input 
//             className="input"
//             type="text" 
//             placeholder="예: https://example.com/image.jpg (이미지,유튜브 url 붙여넣기)"
//             value={imageUrl}
//             onChange={(e) => setImageUrl(e.target.value)}
//             style={{ width: '100%', background: '#2c3e50', color: 'white', border: '1px solid #555', padding: '10px', borderRadius: '5px' }} 
//           />
//           <p style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
//             * 구글 등에서 '이미지 주소 복사' 후 붙여넣으세요.
//           </p>
//       </div>
      
//       {/* 이미지 미리보기 (URL이 있을 때만) */}
//       {imageUrl && (
//           <div style={{ marginBottom: 15, textAlign: 'center', background:'#000', padding:10, borderRadius:10 }}>
//             <img 
//                 src={imageUrl} 
//                 alt="미리보기" 
//                 style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: 5 }} 
//                 onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'; }} // 엑박 방지
//             />
//           </div>
//       )}
      
//       {/* 내용 입력 */}
//       <textarea 
//         className="input" 
//         placeholder={t.bd_input_content || "내용"} 
//         value={content} 
//         onChange={(e) => setContent(e.target.value)}
//         style={{ width: '100%', height: '300px', marginBottom: '20px', background: '#2c3e50', color: 'white', border: '1px solid #555', resize: 'none', padding: '10px', borderRadius: '5px' }} 
//       />

//       {/* 버튼 그룹 */}
//       <div style={{ display: 'flex', gap: '10px' }}>
//         <button className="btn" style={{ flex: 1, background: '#7f8c8d', padding: '12px', borderRadius: '5px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }} onClick={handleCancel} disabled={isSubmitting}>
//             {t.cancel || "취소"}
//         </button>
//         <button className="btn btn-primary" style={{ flex: 1, background: isSubmitting ? '#555' : '#3498db', padding: '12px', borderRadius: '5px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }} onClick={handleSubmit} disabled={isSubmitting}>
//           {isSubmitting ? "저장 중..." : (t.bd_submit || "등록하기")}
//         </button>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

export default function BoardWrite() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = auth.currentUser;
  const { t } = useLanguage();
  
  const editData = location.state?.post; 
  
  const [title, setTitle] = useState(editData ? editData.title : '');
  const [content, setContent] = useState(editData ? editData.content : '');
  const [imageUrl, setImageUrl] = useState(editData ? editData.imageUrl : ''); 
  
  const [isNotice, setIsNotice] = useState(editData ? editData.isNotice : false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user?.email === "kks3172@naver.com";

  useEffect(() => {
    // 🔥 [수정] 번역 적용 (alertLoginReq)
    if (!user) { alert(t.alertLoginReq || "로그인이 필요합니다."); navigate('/login'); }
  }, [user, navigate, t]);

  const handleCancel = () => {
      if (editData) navigate(`/board/${editData.id}`);
      else navigate('/board');
  };

  const handleSubmit = async () => {
    // 🔥 [수정] 번역 적용 (alertInputAll)
    if (!title.trim() || !content.trim()) return alert(t.alertInputAll || "제목과 내용을 입력하세요.");
    if (isSubmitting) return; 

    setIsSubmitting(true); 

    try {
      const finalImageUrl = imageUrl.trim(); 

      if (editData) {
        const postRef = doc(db, "posts", editData.id);
        await updateDoc(postRef, {
          title, 
          content,
          imageUrl: finalImageUrl, 
          isNotice: isAdmin ? isNotice : false,
        });
        alert(t.bd_edit_complete || "수정 완료");
        navigate(`/board/${editData.id}`);
      } else {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        let realName = "User";
        if (userDocSnap.exists()) {
            realName = userDocSnap.data().name;
        }

        await addDoc(collection(db, "posts"), {
          title, 
          content,
          imageUrl: finalImageUrl, 
          uid: user.uid,
          authorName: realName,
          likes: 0, 
          likedBy: [], 
          commentCount: 0,
          isNotice: isAdmin ? isNotice : false,
          createdAt: serverTimestamp()
        });
        alert(t.alertComplete || "등록 완료");
        navigate('/board');
      }

    } catch (e) {
      console.error("Error:", e);
      alert(t.alertError || "오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false); 
    }
  };

  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = getYoutubeId(imageUrl);

  return (
    <div className="container" style={{ paddingTop: 30, background: '#1e272e', minHeight: '100vh', color: 'white', padding: '20px' }}>
      <h2 style={{ color: '#f1c40f', marginBottom: '20px' }}>{editData ? (t.bd_edit_title || "글 수정") : (t.bd_new_title || "새 글 쓰기")}</h2>
      
      {isAdmin && (
        <div style={{ marginBottom: 15, background:'#2c3e50', padding: 10, borderRadius: 5 }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 5, fontWeight: 'bold', color: '#e74c3c' }}>
                <input type="checkbox" checked={isNotice} onChange={(e) => setIsNotice(e.target.checked)} />
                {t.bd_admin_notice || "공지사항 등록"}
            </label>
        </div>
      )}

      <input 
        className="input" 
        placeholder={t.bd_input_title || "제목"} 
        value={title} 
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: '100%', marginBottom: '15px', background: '#2c3e50', color: 'white', border: '1px solid #555', padding: '10px', borderRadius: '5px' }} 
      />

      <div style={{ marginBottom: 15 }}>
          {/* 🔥 [수정] 번역 적용 (bd_img_url) */}
          <label style={{ display:'block', marginBottom: 5, color:'#ccc', fontSize:'14px' }}>{t.bd_img_url || "📸 이미지 주소 (URL) 또는 유튜브 링크"}</label>
          <input 
            className="input"
            type="text" 
            placeholder={t.bd_url_ph || "예: https://youtu.be/... 또는 https://site.com/image.jpg"} // 🔥 [수정] 번역 적용
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            style={{ width: '100%', background: '#2c3e50', color: 'white', border: '1px solid #555', padding: '10px', borderRadius: '5px' }} 
          />
          {/* 🔥 [수정] 번역 적용 (bd_url_desc) */}
          <p style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
            {t.bd_url_desc || "* 구글 등에서 '이미지 주소 복사' 후 붙여넣으세요."}
          </p>
      </div>
      
      {imageUrl && (
          <div style={{ marginBottom: 15, textAlign: 'center', background:'#000', padding:10, borderRadius:10 }}>
            {youtubeId ? (
                <iframe 
                    width="100%" 
                    height="200" 
                    src={`https://www.youtube.com/embed/${youtubeId}`} 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen 
                    style={{ borderRadius: 5 }}
                ></iframe>
            ) : (
                <img 
                    src={imageUrl} 
                    alt="미리보기" 
                    style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: 5 }} 
                    onError={(e) => { e.target.src = 'https://placehold.co/300x200?text=Invalid+Image'; }} 
                />
            )}
          </div>
      )}
      
      <textarea 
        className="input" 
        placeholder={t.bd_input_content || "내용"} 
        value={content} 
        onChange={(e) => setContent(e.target.value)}
        style={{ width: '100%', height: '300px', marginBottom: '20px', background: '#2c3e50', color: 'white', border: '1px solid #555', resize: 'none', padding: '10px', borderRadius: '5px' }} 
      />

      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn" style={{ flex: 1, background: '#7f8c8d', padding: '12px', borderRadius: '5px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }} onClick={handleCancel} disabled={isSubmitting}>
            {t.cancel || "취소"}
        </button>
        <button className="btn btn-primary" style={{ flex: 1, background: isSubmitting ? '#555' : '#3498db', padding: '12px', borderRadius: '5px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }} onClick={handleSubmit} disabled={isSubmitting}>
            {/* 🔥 [수정] 번역 적용 (bd_saving) */}
            {isSubmitting ? (t.bd_saving || "저장 중...") : (t.bd_submit || "등록하기")}
        </button>
      </div>
    </div>
  );
}