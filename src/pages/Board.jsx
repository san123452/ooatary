 
// import React, { useState, useEffect } from 'react';
// import { db } from '../firebase';
// import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';
// import { useLanguage } from '../LanguageContext';

// export default function Board() {
//   const [posts, setPosts] = useState([]);
//   const navigate = useNavigate();
//   const { t } = useLanguage();

//   // ⭐ [추가됨] 페이지 입장 시 스크롤을 맨 위로 올림
//   useEffect(() => {
//     window.scrollTo(0, 0);
//   }, []);

//   useEffect(() => {
//     // 게시글 목록 실시간 감지
//     const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    
//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const allPosts = snapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//       }));

//       // --- 정렬 로직 (공지 -> HOT -> 일반) ---
//       const notices = allPosts.filter(p => p.isNotice);
//       const normals = allPosts.filter(p => !p.isNotice);

//       // HOT 게시글 선정 (좋아요 많은 순 Top 2)
//       const hotCandidates = [...normals].sort((a, b) => (b.likes || 0) - (a.likes || 0));
//       const hots = hotCandidates.filter(p => (p.likes || 0) > 0).slice(0, 2);
//       const hotIds = hots.map(h => h.id);

//       const rest = normals.filter(p => !hotIds.includes(p.id));

//       const finalPosts = [
//           ...notices, 
//           ...hots.map(p => ({...p, isHot: true})), 
//           ...rest
//       ];

//       setPosts(finalPosts);
//     });
//     return () => unsubscribe();
//   }, []);

//   const formatDate = (timestamp) => {
//     if (!timestamp) return '';
//     const date = timestamp.toDate();
//     const now = new Date();
//     if (date.toDateString() === now.toDateString()) {
//         return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
//     }
//     return `${date.getMonth() + 1}/${date.getDate()}`;
//   };

//   return (
//     <div className="container" style={{ paddingTop: 30, background: '#1e272e', minHeight: '100vh', color: 'white', padding: '20px' }}>
      
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
//         <h1 style={{ color: '#f1c40f', margin: 0 }}>{t.bd_title}</h1>
//       </div>

//       <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
//         {posts.length === 0 ? <p style={{textAlign:'center', color:'#aaa', marginTop: 50}}>{t.bd_no_posts}</p> : 
//          posts.map((post) => (
//           <div 
//             key={post.id} 
//             onClick={() => navigate(`/board/${post.id}`)}
//             style={{ 
//               background: post.isNotice ? '#341f97' : (post.isHot ? '#30336b' : '#2c3e50'), 
//               padding: '15px', borderRadius: '10px', 
//               cursor: 'pointer', border: '1px solid #34495e', transition: '0.2s',
//               borderLeft: post.isNotice ? '5px solid #f1c40f' : (post.isHot ? '5px solid #e74c3c' : '1px solid #34495e'),
//               boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
//             }}
//           >
//             {/* 제목 라인 */}
//             <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', display:'flex', alignItems:'center', gap:'5px' }}>
//                 {post.isNotice && <span style={{fontSize:12, background:'#f1c40f', color:'black', padding:'2px 6px', borderRadius:4}}>{t.bd_notice}</span>}
//                 {post.isHot && <span style={{fontSize:12, background:'#e74c3c', color:'white', padding:'2px 6px', borderRadius:4}}>{t.bd_hot}</span>}
//                 {post.imageUrl && <span>🖼️</span>}
                
//                 <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{post.title}</span>
//             </div>

//             {/* 정보 라인 */}
//             <div style={{ fontSize: '13px', color: '#bdc3c7', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
//               <span> {post.authorName}</span>
              
//               <div style={{ display: 'flex', gap: '10px', alignItems:'center' }}>
//                   <span style={{color: (post.likes||0) > 0 ? '#ff6b6b' : '#bdc3c7'}}>
//                       ❤️ {post.likes || 0}
//                   </span>
//                   <span style={{color: (post.commentCount||0) > 0 ? '#54a0ff' : '#bdc3c7'}}>
//                       💬 {post.commentCount || 0}
//                   </span>
//                   <span style={{marginLeft: 5}}>
//                       {formatDate(post.createdAt)}
//                   </span>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* 글쓰기 버튼 */}
//       <button 
//         onClick={() => navigate('/board/write')}
//         style={{
//           position: 'fixed', bottom: '30px', right: '30px',
//           width: '60px', height: '60px', borderRadius: '50%',
//           background: '#f1c40f', color: '#1e272e', fontSize: '30px',
//           border: 'none', boxShadow: '0 4px 15px rgba(241, 196, 15, 0.4)', 
//           cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center'
//         }}
//       >
//         🖊️
//       </button>

//       <button className="btn" style={{marginTop: 30, background: '#444', width:'100%', padding:'15px'}} onClick={() => navigate('/home')}>{t.home}</button>
//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, limit, startAfter, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

const POSTS_PER_PAGE = 20; // 한 번에 보여줄 글 개수

export default function Board() {
  const [posts, setPosts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null); // 마지막 글 저장용 (더보기 위함)
  const [hasMore, setHasMore] = useState(true); // 더 불러올 글이 있는지
  const navigate = useNavigate();
  const { t } = useLanguage();

  // ⭐ [추가됨] 페이지 입장 시 스크롤을 맨 위로 올림
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 초기 로딩 (실시간 감지 유지)
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(POSTS_PER_PAGE));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 마지막 문서 저장 (더보기 기능을 위해)
      if (snapshot.docs.length > 0) {
          setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
      if (snapshot.docs.length < POSTS_PER_PAGE) {
          setHasMore(false);
      }

      // --- 정렬 로직 (공지 -> HOT -> 일반) ---
      const notices = allPosts.filter(p => p.isNotice);
      const normals = allPosts.filter(p => !p.isNotice);

      const hotCandidates = [...normals].sort((a, b) => (b.likes || 0) - (a.likes || 0));
      const hots = hotCandidates.filter(p => (p.likes || 0) > 0).slice(0, 2);
      const hotIds = hots.map(h => h.id);

      const rest = normals.filter(p => !hotIds.includes(p.id));

      const finalPosts = [
          ...notices, 
          ...hots.map(p => ({...p, isHot: true})), 
          ...rest
      ];

      setPosts(finalPosts);
    });
    return () => unsubscribe();
  }, []);

  // 🔥 [추가됨] 더 보기 기능 (다음 페이지 로드)
  const loadMore = async () => {
      if (!lastDoc) return;
      
      const q = query(
          collection(db, "posts"), 
          orderBy("createdAt", "desc"), 
          startAfter(lastDoc), 
          limit(POSTS_PER_PAGE)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
          setHasMore(false);
          return;
      }

      const newPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

      // 기존 글 + 새 글 합치기 (정렬 로직은 유지하되, 새로 불러온 건 뒤에 붙임)
      setPosts(prev => [...prev, ...newPosts]);
      
      if (snapshot.docs.length < POSTS_PER_PAGE) setHasMore(false);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
        return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 🔥 [신규] 유튜브 링크인지 확인하는 함수
  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="container" style={{ paddingTop: 30, background: '#1e272e', minHeight: '100vh', color: 'white', padding: '20px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ color: '#f1c40f', margin: 0 }}>{t.bd_title}</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {posts.length === 0 ? <p style={{textAlign:'center', color:'#aaa', marginTop: 50}}>{t.bd_no_posts}</p> : 
         posts.map((post) => {
          const youtubeId = getYoutubeId(post.imageUrl);
          
          return (
            <div 
              key={post.id} 
              onClick={() => navigate(`/board/${post.id}`)}
              style={{ 
                background: post.isNotice ? '#341f97' : (post.isHot ? '#30336b' : '#2c3e50'), 
                padding: '15px', borderRadius: '10px', 
                cursor: 'pointer', border: '1px solid #34495e', transition: '0.2s',
                borderLeft: post.isNotice ? '5px solid #f1c40f' : (post.isHot ? '5px solid #e74c3c' : '1px solid #34495e'),
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              {/* 제목 라인 */}
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', display:'flex', alignItems:'center', gap:'5px' }}>
                  {post.isNotice && <span style={{fontSize:12, background:'#f1c40f', color:'black', padding:'2px 6px', borderRadius:4}}>{t.bd_notice}</span>}
                  {post.isHot && <span style={{fontSize:12, background:'#e74c3c', color:'white', padding:'2px 6px', borderRadius:4}}>{t.bd_hot}</span>}
                  
                  {post.imageUrl && (
                    youtubeId ? <span title="동영상">🎥</span> : <span title="이미지">🖼️</span>
                  )}
                  
                  <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{post.title}</span>
              </div>

              {/* 정보 라인 */}
              <div style={{ fontSize: '13px', color: '#bdc3c7', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span> {post.authorName}</span>
                
                <div style={{ display: 'flex', gap: '10px', alignItems:'center' }}>
                    <span style={{color: (post.likes||0) > 0 ? '#ff6b6b' : '#bdc3c7'}}>
                        ❤️ {post.likes || 0}
                    </span>
                    <span style={{color: (post.commentCount||0) > 0 ? '#54a0ff' : '#bdc3c7'}}>
                        💬 {post.commentCount || 0}
                    </span>
                    <span style={{marginLeft: 5}}>
                        {formatDate(post.createdAt)}
                    </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🔥 [추가됨] 더 보기 버튼 */}
      {hasMore && (
          <button 
            onClick={loadMore} 
            style={{
                width: '100%', padding: '12px', marginTop: '20px', 
                background: '#34495e', border: '1px solid #7f8c8d', borderRadius: '8px',
                color: 'white', cursor: 'pointer', fontWeight: 'bold'
            }}
          >
            👇 더 보기 (More)
          </button>
      )}

      {/* 글쓰기 버튼 */}
      <button 
        onClick={() => navigate('/board/write')}
        style={{
          position: 'fixed', bottom: '30px', right: '30px',
          width: '60px', height: '60px', borderRadius: '50%',
          background: '#f1c40f', color: '#1e272e', fontSize: '30px',
          border: 'none', boxShadow: '0 4px 15px rgba(241, 196, 15, 0.4)', 
          cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}
      >
        🖊️
      </button>

      <button className="btn" style={{marginTop: 30, background: '#444', width:'100%', padding:'15px'}} onClick={() => navigate('/home')}>{t.home}</button>
    </div>
  );
}