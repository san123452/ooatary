
// import React, { useState, useEffect } from 'react';
// import { db, auth } from '../firebase'; 
// import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { useLanguage } from '../LanguageContext';

// export default function BoardWrite() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const user = auth.currentUser;
//   const { t } = useLanguage();
  
//   const editData = location.state?.post; 
  
//   const initialCategory = location.state?.category || (editData ? editData.category : 'free');

//   const [title, setTitle] = useState(editData ? editData.title : '');
//   const [content, setContent] = useState(editData ? editData.content : '');
//   const [imageUrl, setImageUrl] = useState(editData ? editData.imageUrl : ''); 
  
//   const [category, setCategory] = useState(initialCategory);

//   const [isNotice, setIsNotice] = useState(editData ? editData.isNotice : false);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const isAdmin = user?.email === "kks3172@naver.com";

//   useEffect(() => {
//     if (!user) { alert(t.alertLoginReq || "로그인이 필요합니다."); navigate('/login'); }
//   }, [user, navigate, t]);

//   const handleCancel = () => {
//       if (editData) navigate(`/board/${editData.id}`);
//       else navigate('/board');
//   };

//   const handleSubmit = async () => {
//     if (!title.trim() || !content.trim()) return alert(t.alertInputAll || "제목과 내용을 입력하세요.");
//     if (isSubmitting) return; 

//     // 🔥 글쓰기 밴 확인 로직
//     try {
//         const userSnap = await getDoc(doc(db, "users", user.uid));
//         if (userSnap.exists()) {
//             const data = userSnap.data();
//             if (data.boardBanDate) {
//                 const banDate = data.boardBanDate.toDate();
//                 if (banDate > new Date()) {
//                     return alert(`🔇 게시판 이용이 제한되었습니다.\n해제 일시: ${banDate.toLocaleString()}`);
//                 }
//             }
//         }
//     } catch (e) {
//         console.error("Ban check error", e);
//         return;
//     }

//     setIsSubmitting(true); 

//     try {
//       const finalImageUrl = imageUrl.trim(); 

//       if (editData) {
//         const postRef = doc(db, "posts", editData.id);
//         await updateDoc(postRef, {
//           category, 
//           title, 
//           content,
//           imageUrl: finalImageUrl, 
//           isNotice: isAdmin ? isNotice : false,
//         });
//         alert(t.bd_edit_complete || "수정 완료");
//         navigate(`/board/${editData.id}`);
//       } else {
//         // 🔥 [수정] 글 작성 시 칭호와 색상도 같이 가져와서 저장
//         const userDocRef = doc(db, "users", user.uid);
//         const userDocSnap = await getDoc(userDocRef);
        
//         let realName = "User";
//         let userTitle = "";       // 칭호
//         let userTitleColor = "";  // 칭호 색상

//         if (userDocSnap.exists()) {
//             const userData = userDocSnap.data();
//             realName = userData.name;
//             userTitle = userData.userTitle || "";           // DB에서 가져옴
//             userTitleColor = userData.userTitleColor || ""; // DB에서 가져옴
//         }

//         await addDoc(collection(db, "posts"), {
//           category, 
//           title, 
//           content,
//           imageUrl: finalImageUrl, 
//           uid: user.uid,
//           authorName: realName,
//           authorTitle: userTitle,           // 🔥 칭호 저장
//           authorTitleColor: userTitleColor, // 🔥 색상 저장
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

//   const getYoutubeId = (url) => {
//     if (!url) return null;
//     const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
//     const match = url.match(regExp);
//     return (match && match[2].length === 11) ? match[2] : null;
//   };

//   const youtubeId = getYoutubeId(imageUrl);

//   return (
//     <div className="container" style={{ paddingTop: 30, background: '#1e272e', minHeight: '100vh', color: 'white', padding: '20px' }}>
//       <h2 style={{ color: '#f1c40f', marginBottom: '20px' }}>{editData ? (t.bd_edit_title || "글 수정") : (t.bd_new_title || "새 글 쓰기")}</h2>
      
//       <div style={{ marginBottom: 15 }}>
//           <label style={{ color: '#bdc3c7', fontSize: '14px', marginBottom: 5, display: 'block' }}>
//               {t.bd_select_board || "게시판 선택"}
//           </label>
//           <select 
//             value={category} 
//             onChange={(e) => setCategory(e.target.value)}
//             style={{ width: '100%', padding: '10px', background: '#2c3e50', color: 'white', border: '1px solid #f1c40f', borderRadius: 5, fontWeight:'bold' }}
//           >
//               <option value="free">{t.bd_cat_free || "💬 자유 갤러리"}</option>
//               <option value="humor">{t.bd_cat_humor || "🤣 유머 갤러리"}</option>
//               <option value="yoon">{t.bd_cat_yoon || "👑 윤 갤러리"}</option>
//           </select>
//       </div>

//       {isAdmin && (
//         <div style={{ marginBottom: 15, background:'#2c3e50', padding: 10, borderRadius: 5 }}>
//             <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 5, fontWeight: 'bold', color: '#e74c3c' }}>
//                 <input type="checkbox" checked={isNotice} onChange={(e) => setIsNotice(e.target.checked)} />
//                 {t.bd_admin_notice || "공지사항 등록"}
//             </label>
//         </div>
//       )}

//       <input 
//         className="input" 
//         placeholder={t.bd_input_title || "제목"} 
//         value={title} 
//         onChange={(e) => setTitle(e.target.value)}
//         style={{ width: '100%', marginBottom: '15px', background: '#2c3e50', color: 'white', border: '1px solid #555', padding: '10px', borderRadius: '5px' }} 
//       />

//       <div style={{ marginBottom: 15 }}>
//           <label style={{ display:'block', marginBottom: 5, color:'#ccc', fontSize:'14px' }}>{t.bd_img_url || "📸 이미지 주소 (URL) 또는 유튜브 링크"}</label>
//           <input 
//             className="input"
//             type="text" 
//             placeholder={t.bd_url_ph || "예: https://youtu.be/... 또는 https://site.com/image.jpg"} 
//             value={imageUrl}
//             onChange={(e) => setImageUrl(e.target.value)}
//             style={{ width: '100%', background: '#2c3e50', color: 'white', border: '1px solid #555', padding: '10px', borderRadius: '5px' }} 
//           />
//           <p style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
//             {t.bd_url_desc || "* 구글 등에서 '이미지 주소 복사' 후 붙여넣으세요."}
//           </p>
//       </div>
      
//       {imageUrl && (
//           <div style={{ marginBottom: 15, textAlign: 'center', background:'#000', padding:10, borderRadius:10 }}>
//             {youtubeId ? (
//                 <iframe 
//                     width="100%" 
//                     height="200" 
//                     src={`https://www.youtube.com/embed/${youtubeId}`} 
//                     title="YouTube video player" 
//                     frameBorder="0" 
//                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
//                     allowFullScreen 
//                     style={{ borderRadius: 5 }}
//                 ></iframe>
//             ) : (
//                 <img 
//                     src={imageUrl} 
//                     alt="미리보기" 
//                     style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: 5 }} 
//                     onError={(e) => { e.target.src = 'https://placehold.co/300x200?text=Invalid+Image'; }} 
//                 />
//             )}
//           </div>
//       )}
      
//       <textarea 
//         className="input" 
//         placeholder={t.bd_input_content || "내용"} 
//         value={content} 
//         onChange={(e) => setContent(e.target.value)}
//         style={{ width: '100%', height: '300px', marginBottom: '20px', background: '#2c3e50', color: 'white', border: '1px solid #555', resize: 'none', padding: '10px', borderRadius: '5px' }} 
//       />

//       <div style={{ display: 'flex', gap: '10px' }}>
//         <button className="btn" style={{ flex: 1, background: '#7f8c8d', padding: '12px', borderRadius: '5px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }} onClick={handleCancel} disabled={isSubmitting}>
//             {t.cancel || "취소"}
//         </button>
//         <button className="btn btn-primary" style={{ flex: 1, background: isSubmitting ? '#555' : '#3498db', padding: '12px', borderRadius: '5px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }} onClick={handleSubmit} disabled={isSubmitting}>
//             {isSubmitting ? (t.bd_saving || "저장 중...") : (t.bd_submit || "등록하기")}
//         </button>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; // 🔥 storage 삭제됨
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
// 🔥 uploadBytes 등 스토리지 함수 삭제됨
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

export default function BoardWrite() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = auth.currentUser;
  const { t } = useLanguage();
  
  const editData = location.state?.post; 
  const initialCategory = location.state?.category || (editData ? editData.category : 'free');

  const [title, setTitle] = useState(editData ? editData.title : '');
  const [content, setContent] = useState(editData ? editData.content : '');
  
  // 🔥 [수정] 파일 관련 state 다 지우고 URL만 남김
  const [imageUrl, setImageUrl] = useState(editData ? editData.imageUrl : ''); 
  
  const [instagramUrl, setInstagramUrl] = useState(editData ? editData.instagramUrl : '');
  const [category, setCategory] = useState(initialCategory);
  const [isNotice, setIsNotice] = useState(editData ? editData.isNotice : false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user?.email === "kks3172@naver.com";

  useEffect(() => {
    if (!user) { alert(t.alertLoginReq || "로그인이 필요합니다."); navigate('/login'); }
  }, [user, navigate, t]);

  const handleCancel = () => {
      if (editData) navigate(`/board/${editData.id}`);
      else navigate('/board');
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return alert(t.alertInputAll || "제목과 내용을 입력하세요.");
    if (isSubmitting) return; 

    try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.boardBanDate) {
                const banDate = data.boardBanDate.toDate();
                if (banDate > new Date()) {
                    return alert(`🔇 게시판 이용이 제한되었습니다.\n해제 일시: ${banDate.toLocaleString()}`);
                }
            }
        }
    } catch (e) { console.error("Ban check error", e); return; }

    setIsSubmitting(true); 

    try {
      // 🔥 [수정] 파일 업로드 로직 삭제 -> 그냥 텍스트 URL만 사용
      const finalImageUrl = imageUrl.trim();

      const postData = {
        category, 
        title, 
        content,
        imageUrl: finalImageUrl, 
        instagramUrl: instagramUrl.trim(),
        isNotice: isAdmin ? isNotice : false,
      };

      if (editData) {
        const postRef = doc(db, "posts", editData.id);
        await updateDoc(postRef, postData);
        alert(t.bd_edit_complete || "수정 완료");
        navigate(`/board/${editData.id}`);
      } else {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        let realName = "User";
        let userTitle = "";       
        let userTitleColor = "";  

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            realName = userData.name;
            userTitle = userData.userTitle || "";           
            userTitleColor = userData.userTitleColor || ""; 
        }

        await addDoc(collection(db, "posts"), {
          ...postData,
          uid: user.uid,
          authorName: realName,
          authorTitle: userTitle,           
          authorTitleColor: userTitleColor, 
          likes: 0, 
          likedBy: [], 
          commentCount: 0,
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
      
      <div style={{ marginBottom: 15 }}>
          <label style={{ color: '#bdc3c7', fontSize: '14px', marginBottom: 5, display: 'block' }}>
              {t.bd_select_board || "게시판 선택"}
          </label>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            style={{ width: '100%', padding: '10px', background: '#2c3e50', color: 'white', border: '1px solid #f1c40f', borderRadius: 5, fontWeight:'bold' }}
          >
              <option value="free">{t.bd_cat_free || "💬 자유 갤러리"}</option>
              <option value="humor">{t.bd_cat_humor || "🤣 유머 갤러리"}</option>
              <option value="yoon">{t.bd_cat_yoon || "👑 윤 갤러리"}</option>
          </select>
      </div>

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
          <label style={{ display:'block', marginBottom: 5, color:'#ccc', fontSize:'14px' }}>📸 인스타그램 게시물 주소 (선택)</label>
          <input 
            className="input"
            type="text" 
            placeholder="예: https://www.instagram.com/p/..." 
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            style={{ width: '100%', background: '#2c3e50', color: 'white', border: '1px solid #555', padding: '10px', borderRadius: '5px' }} 
          />
      </div>

      {/* 🔥 [수정] 파일 선택기 제거, 단순 URL 입력만 남김 */}
      <div style={{ marginBottom: 15 }}>
          <label style={{ display:'block', marginBottom: 5, color:'#ccc', fontSize:'14px' }}>🖼️ 이미지/유튜브 주소 (URL)</label>
          <input 
            className="input"
            type="text" 
            placeholder={t.bd_url_ph || "예: https://site.com/image.jpg"} 
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            style={{ width: '100%', background: '#34495e', color: 'white', border: '1px solid #555', padding: '10px', borderRadius: '5px' }} 
          />
          <p style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
            {t.bd_url_desc || "* 구글 등에서 '이미지 주소 복사' 후 붙여넣으세요."}
          </p>
      </div>
      
      {/* 미리보기 영역 */}
      {(imageUrl) && (
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
            {isSubmitting ? (t.bd_saving || "저장 중...") : (t.bd_submit || "등록하기")}
        </button>
      </div>
    </div>
  );
}