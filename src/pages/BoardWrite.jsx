
// import React, { useState, useEffect } from 'react';
// import { db, auth } from '../firebase'; 
// import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc, increment } from 'firebase/firestore'; // ⭐️ increment 추가
// import { useNavigate, useLocation } from 'react-router-dom';
// import { useLanguage } from '../LanguageContext';

// export default function BoardWrite() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const user = auth.currentUser;
//   const { t } = useLanguage();
  
//   const editData = location.state?.post; 
//   const initialCategory = location.state?.category || (editData ? editData.category : 'free');

//   const [title, setTitle] = useState(editData?.title || '');
//   const [content, setContent] = useState(editData?.content || '');
//   const [imageUrl, setImageUrl] = useState(editData?.imageUrl || ''); 
//   const [instagramUrl, setInstagramUrl] = useState(editData?.instagramUrl || '');
  
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

//   // 🕵️‍♂️ 기기 식별자 생성기 (지문 채취)
//   const getDeviceFingerprint = () => {
//     let fp = localStorage.getItem('oa_device_id');
//     if (!fp) {
//         const info = [
//             navigator.userAgent,
//             screen.width + 'x' + screen.height,
//             navigator.language,
//             navigator.hardwareConcurrency || 0,
//             new Date().getTimezoneOffset()
//         ].join('|');
        
//         fp = 'ID-' + btoa(info).substring(0, 12) + '-' + Math.random().toString(36).substring(2, 7);
//         localStorage.setItem('oa_device_id', fp);
//     }
//     return fp;
//   };

//   const handleSubmit = async () => {
//     const safeTitle = (title || "").trim();
//     const safeContent = (content || "").trim();

//     if (!safeTitle || !safeContent) return alert(t.alertInputAll || "제목과 내용을 입력하세요.");
//     if (isSubmitting) return; 

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
//     } catch (e) { console.error("Ban check error", e); return; }

//     setIsSubmitting(true); 

//     try {
//       const deviceFingerprint = getDeviceFingerprint();

//       const finalImageUrl = (imageUrl || "").trim();
//       const finalInstagramUrl = (instagramUrl || "").trim();

//       const postData = {
//         category, 
//         title: safeTitle, 
//         content: safeContent,
//         imageUrl: finalImageUrl, 
//         instagramUrl: finalInstagramUrl,
//         isNotice: isAdmin ? isNotice : false,
//         deviceId: deviceFingerprint 
//       };

//       if (editData) {
//         const postRef = doc(db, "posts", editData.id);
//         await updateDoc(postRef, postData);
//         alert(t.bd_edit_complete || "수정 완료");
//         navigate(`/board/${editData.id}`);
//       } else {
//         const userDocRef = doc(db, "users", user.uid);
//         const userDocSnap = await getDoc(userDocRef);
        
//         let realName = "User";
//         let userTitle = "";       
//         let userTitleColor = "";  

//         if (userDocSnap.exists()) {
//             const userData = userDocSnap.data();
//             realName = userData.name;
//             userTitle = userData.userTitle || "";          
//             userTitleColor = userData.userTitleColor || ""; 
//         }

//         // 1. 게시글 저장
//         await addDoc(collection(db, "posts"), {
//           ...postData,
//           uid: user.uid,
//           authorName: realName,
//           authorTitle: userTitle,          
//           authorTitleColor: userTitleColor, 
//           likes: 0, 
//           likedBy: [], 
//           commentCount: 0,
//           createdAt: serverTimestamp()
//         });

//         // ⭐️ 2. 추가된 보상 로직 (20자 이상, 하루 10회 제한)
//         const textOnly = safeContent.replace(/\s/g, ""); // 공백 제외
//         if (textOnly.length >= 20) {
//             const today = new Date();
//             const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`; // YYYY-MM-DD
            
//             const userRef = doc(db, "users", user.uid);
//             const uSnap = await getDoc(userRef);
//             const uData = uSnap.data();

//             const lastDate = uData?.lastRewardDate || "";
//             let currentCount = (lastDate === todayStr) ? (uData?.dailyPostCount || 0) : 0;

//             if (currentCount < 10) {
//                 // 보상 지급 및 카운트 증가
//                 await updateDoc(userRef, {
//                     point: increment(1000000),
//                     dailyPostCount: currentCount + 1,
//                     lastRewardDate: todayStr
//                 });
//                 // 히스토리 남기기
//                 await addDoc(collection(db, "history"), {
//                     uid: user.uid,
//                     type: "보상",
//                     msg: "게시글 작성 보상 (20자 이상)",
//                     amount: 1000000,
//                     createdAt: serverTimestamp()
//                 });
//             } else if (currentCount === 10) {
//                 // 딱 11번째 시도에만 알림 띄우기
//                 alert("하루 지급량을 초과해서 더이상 보상 없다");
//                 await updateDoc(userRef, { dailyPostCount: 11 }); // 알림 중복 방지용
//             }
//         }

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
//           <label style={{ display:'block', marginBottom: 5, color:'#ccc', fontSize:'14px' }}>📸 인스타그램 게시물 주소 (선택)</label>
//           <input 
//             className="input"
//             type="text" 
//             placeholder="예: https://www.instagram.com/p/..." 
//             value={instagramUrl}
//             onChange={(e) => setInstagramUrl(e.target.value)}
//             style={{ width: '100%', background: '#2c3e50', color: 'white', border: '1px solid #555', padding: '10px', borderRadius: '5px' }} 
//           />
//       </div>

//       <div style={{ marginBottom: 15 }}>
//           <label style={{ display:'block', marginBottom: 5, color:'#ccc', fontSize:'14px' }}>🖼️ 이미지/유튜브 주소 (URL)</label>
//           <input 
//             className="input"
//             type="text" 
//             placeholder={t.bd_url_ph || "예: https://site.com/image.jpg"} 
//             value={imageUrl}
//             onChange={(e) => setImageUrl(e.target.value)}
//             style={{ width: '100%', background: '#34495e', color: 'white', border: '1px solid #555', padding: '10px', borderRadius: '5px' }} 
//           />
//           <p style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
//             {t.bd_url_desc || "* 구글 등에서 '이미지 주소 복사' 후 붙여넣으세요."}
//           </p>
//       </div>
      
//       {(imageUrl) && (
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
import { db, auth } from '../firebase'; 
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc, increment } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

export default function BoardWrite() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = auth.currentUser;
  const { t } = useLanguage();
  
  const editData = location.state?.post; 
  const initialCategory = location.state?.category || (editData ? editData.category : 'free');

  const [title, setTitle] = useState(editData?.title || '');
  const [content, setContent] = useState(editData?.content || '');
  const [imageUrl, setImageUrl] = useState(editData?.imageUrl || ''); 
  const [instagramUrl, setInstagramUrl] = useState(editData?.instagramUrl || '');
  
  const [category, setCategory] = useState(initialCategory);
  const [isNotice, setIsNotice] = useState(editData ? editData.isNotice : false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🗳️ [추가] 투표 상태
  const [pollQuestion, setPollQuestion] = useState(editData?.poll?.question || "");
  const [pollOptions, setPollOptions] = useState(editData?.poll?.options?.map(o => o.text) || ["", ""]);

  const isAdmin = user?.email === "kks3172@naver.com";

  useEffect(() => {
    if (!user) { alert(t.alertLoginReq || "로그인이 필요합니다."); navigate('/login'); }
  }, [user, navigate, t]);

  const handleCancel = () => {
      if (editData) navigate(`/board/${editData.id}`);
      else navigate('/board');
  };

  const getDeviceFingerprint = () => {
    let fp = localStorage.getItem('oa_device_id');
    if (!fp) {
        const info = [navigator.userAgent, screen.width + 'x' + screen.height, navigator.language, navigator.hardwareConcurrency || 0, new Date().getTimezoneOffset()].join('|');
        fp = 'ID-' + btoa(info).substring(0, 12) + '-' + Math.random().toString(36).substring(2, 7);
        localStorage.setItem('oa_device_id', fp);
    }
    return fp;
  };

  // 🗳️ [추가] 투표 제어
  const addOption = () => { if (pollOptions.length < 5) setPollOptions([...pollOptions, ""]); };
  const removeOption = (idx) => { if (pollOptions.length > 2) setPollOptions(pollOptions.filter((_, i) => i !== idx)); };
  const updateOption = (val, idx) => { const newOptions = [...pollOptions]; newOptions[idx] = val; setPollOptions(newOptions); };

  const handleSubmit = async () => {
    const safeTitle = (title || "").trim();
    const safeContent = (content || "").trim();
    if (!safeTitle || !safeContent) return alert(t.alertInputAll || "제목과 내용을 입력하세요.");
    if (isSubmitting) return; 

    try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.boardBanDate && data.boardBanDate.toDate() > new Date()) {
                return alert(`🔇 게시판 이용이 제한되었습니다.`);
            }
        }
    } catch (e) { console.error(e); return; }

    setIsSubmitting(true); 

    try {
      const deviceFingerprint = getDeviceFingerprint();
      
      // 🗳️ [추가] 투표 데이터 정리
      let pollData = null;
      if (pollQuestion.trim()) {
        const validOptions = pollOptions.filter(o => o.trim() !== "");
        if (validOptions.length < 2) { setIsSubmitting(false); return alert("투표 항목을 2개 이상 입력하세요."); }
        pollData = {
          question: pollQuestion.trim(),
          options: validOptions.map(text => ({ text, voters: [], voterNames: [] }))
        };
      }

      const postData = {
        category, title: safeTitle, content: safeContent,
        imageUrl: (imageUrl || "").trim(), instagramUrl: (instagramUrl || "").trim(),
        isNotice: isAdmin ? isNotice : false, deviceId: deviceFingerprint,
        poll: pollData 
      };

      if (editData) {
        await updateDoc(doc(db, "posts", editData.id), postData);
        alert(t.bd_edit_complete || "수정 완료");
        navigate(`/board/${editData.id}`);
      } else {
        const userDocSnap = await getDoc(doc(db, "users", user.uid));
        const userData = userDocSnap.data();

        await addDoc(collection(db, "posts"), {
          ...postData, uid: user.uid, authorName: userData?.name || "User",
          authorTitle: userData?.userTitle || "", authorTitleColor: userData?.userTitleColor || "", 
          likes: 0, likedBy: [], commentCount: 0, createdAt: serverTimestamp()
        });

        // ⭐️ [유지] 기존 20자 보상 로직
        const textOnly = safeContent.replace(/\s/g, "");
        if (textOnly.length >= 20) {
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
            const userRef = doc(db, "users", user.uid);
            const uSnap = await getDoc(userRef);
            const uData = uSnap.data();
            let currentCount = (uData?.lastRewardDate === todayStr) ? (uData?.dailyPostCount || 0) : 0;
            if (currentCount < 10) {
                await updateDoc(userRef, { point: increment(1000000), dailyPostCount: currentCount + 1, lastRewardDate: todayStr });
                await addDoc(collection(db, "history"), { uid: user.uid, type: "보상", msg: "게시글 작성 보상", amount: 1000000, createdAt: serverTimestamp() });
            } else if (currentCount === 10) {
                alert("하루 지급량 초과");
                await updateDoc(userRef, { dailyPostCount: 11 });
            }
        }
        alert(t.alertComplete || "등록 완료");
        navigate('/board');
      }
    } catch (e) { console.error(e); } finally { setIsSubmitting(false); }
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
      <h2 style={{ color: '#f1c40f', marginBottom: '20px' }}>{editData ? t.bd_edit_title : t.bd_new_title}</h2>
      
      <div style={{ marginBottom: 15 }}>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: '10px', background: '#2c3e50', color: 'white', border: '1px solid #f1c40f', borderRadius: 5, fontWeight:'bold' }}>
              <option value="free">{t.bd_cat_free}</option>
              <option value="humor">{t.bd_cat_humor}</option>
              <option value="yoon">{t.bd_cat_yoon}</option>
          </select>
      </div>

      {isAdmin && (
        <div style={{ marginBottom: 15, background:'#2c3e50', padding: 10, borderRadius: 5 }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 5, fontWeight: 'bold', color: '#e74c3c' }}>
                <input type="checkbox" checked={isNotice} onChange={(e) => setIsNotice(e.target.checked)} /> {t.bd_admin_notice}
            </label>
        </div>
      )}

      <input className="input" placeholder={t.bd_input_title} value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', marginBottom: '15px', background: '#2c3e50', color: 'white', border: '1px solid #555', padding: '10px', borderRadius: '5px' }} />

      {/* 🗳️ [추가] 투표 작성 UI */}
      <div style={{ background: '#2c3e50', padding: '15px', borderRadius: '10px', marginBottom: '15px', border: '1px dashed #f1c40f' }}>
        <p style={{ color: '#f1c40f', fontWeight: 'bold', margin: '0 0 10px 0', fontSize: '14px' }}>📊 투표 추가 (선택사항)</p>
        <input placeholder="투표 질문 입력" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} style={{ width: '100%', background: '#1e272e', border: '1px solid #555', color: 'white', padding: '8px', borderRadius: '5px', marginBottom: '10px' }} />
        {pollQuestion && pollOptions.map((opt, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
            <input placeholder={`항목 ${idx + 1}`} value={opt} onChange={(e) => updateOption(e.target.value, idx)} style={{ flex: 1, background: '#333', border: 'none', color: 'white', padding: '8px', borderRadius: '5px', fontSize: '13px' }} />
            {pollOptions.length > 2 && <button onClick={() => removeOption(idx)} style={{ background: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', width: '30px' }}>-</button>}
          </div>
        ))}
        {pollQuestion && pollOptions.length < 5 && <button onClick={addOption} style={{ width: '100%', padding: '5px', background: '#3498db', border: 'none', color: 'white', borderRadius: '5px', fontSize: '12px', marginTop: '5px' }}>+ 항목 추가</button>}
      </div>

      <div style={{ marginBottom: 15 }}>
          <input className="input" placeholder="📸 인스타 URL" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} style={{ width: '100%', background: '#2c3e50', color: 'white', border: '1px solid #555', padding: '10px', borderRadius: '5px', marginBottom: 10 }} />
          <input className="input" placeholder="🖼️ 이미지/유튜브 URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={{ width: '100%', background: '#34495e', color: 'white', border: '1px solid #555', padding: '10px', borderRadius: '5px' }} />
      </div>

      {(imageUrl) && (
          <div style={{ marginBottom: 15, textAlign: 'center', background:'#000', padding:10, borderRadius:10 }}>
            {youtubeId ? <iframe width="100%" height="200" src={`https://www.youtube.com/embed/${youtubeId}`} frameBorder="0" allowFullScreen style={{ borderRadius: 5 }}></iframe> : <img src={imageUrl} alt="미리보기" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: 5 }} />}
          </div>
      )}
      
      <textarea className="input" placeholder={t.bd_input_content} value={content} onChange={(e) => setContent(e.target.value)} style={{ width: '100%', height: '300px', marginBottom: '20px', background: '#2c3e50', color: 'white', border: '1px solid #555', resize: 'none', padding: '10px', borderRadius: '5px' }} />

      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn" style={{ flex: 1, background: '#7f8c8d', padding: '12px', color: 'white', fontWeight: 'bold' }} onClick={handleCancel}>{t.cancel}</button>
        <button className="btn btn-primary" style={{ flex: 1, background: '#3498db', padding: '12px', color: 'white', fontWeight: 'bold' }} onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? t.bd_saving : t.bd_submit}</button>
      </div>
    </div>
  );
}