
// import React, { useState, useEffect } from 'react';
// import { db } from '../firebase';
// import { collection, query, orderBy, onSnapshot, limit, startAfter, getDocs, where } from 'firebase/firestore';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { useLanguage } from '../LanguageContext';

// const POSTS_PER_PAGE = 20;

// export default function Board() {
//   const navigate = useNavigate();
//   const location = useLocation(); 
//   const { t } = useLanguage();

//   const [category, setCategory] = useState(() => {
//     if (location.state?.category) return location.state.category;
//     return sessionStorage.getItem('selectedCategory') || 'free';
//   });

//   const [posts, setPosts] = useState([]);
//   const [lastDoc, setLastDoc] = useState(null);
//   const [hasMore, setHasMore] = useState(true);
  
//   useEffect(() => {
//     sessionStorage.setItem('selectedCategory', category);
//   }, [category]);

//   // 🔥 [추가] 페이지 진입 시 스크롤 맨 위로 이동
//   useEffect(() => {
//     window.scrollTo(0, 0);
//   }, []);

//   // 🔄 게시글 불러오기
//   useEffect(() => {
//     setPosts([]);
//     setHasMore(true);
//     setLastDoc(null);

//     const fetchPosts = () => {
//         const noticeQuery = query(
//             collection(db, "posts"),
//             where("isNotice", "==", true),
//             orderBy("createdAt", "desc")
//         );

//         const normalQuery = query(
//             collection(db, "posts"),
//             where("category", "==", category),
//             where("isNotice", "==", false),
//             orderBy("createdAt", "desc"),
//             limit(POSTS_PER_PAGE)
//         );

//         const unsubNotice = onSnapshot(noticeQuery, (noticeSnap) => {
//             const notices = noticeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

//             const unsubNormal = onSnapshot(normalQuery, (normalSnap) => {
//                 const normals = normalSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

//                 if (normalSnap.docs.length > 0) {
//                     setLastDoc(normalSnap.docs[normalSnap.docs.length - 1]);
//                 }
//                 if (normalSnap.docs.length < POSTS_PER_PAGE) {
//                     setHasMore(false);
//                 }

//                 const hotCandidates = [...normals].sort((a, b) => (b.likes || 0) - (a.likes || 0));
//                 const hots = hotCandidates.filter(p => (p.likes || 0) > 0).slice(0, 2);
//                 const hotIds = hots.map(h => h.id);

//                 const rest = normals.filter(p => !hotIds.includes(p.id));

//                 const finalPosts = [
//                     ...notices, 
//                     ...hots.map(p => ({...p, isHot: true})), 
//                     ...rest
//                 ];

//                 setPosts(finalPosts);
//             });

//             return () => unsubNormal(); 
//         });

//         return () => unsubNotice(); 
//     };

//     const unsubscribe = fetchPosts();
//     return () => { if(unsubscribe) unsubscribe(); };

//   }, [category]);

//   const loadMore = async () => {
//       if (!lastDoc) return;
      
//       const q = query(
//           collection(db, "posts"),
//           where("category", "==", category),
//           where("isNotice", "==", false),
//           orderBy("createdAt", "desc"), 
//           startAfter(lastDoc), 
//           limit(POSTS_PER_PAGE)
//       );

//       const snapshot = await getDocs(q);
      
//       if (snapshot.empty) {
//           setHasMore(false);
//           return;
//       }

//       const newPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//       setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      
//       setPosts(prev => [...prev, ...newPosts]);
      
//       if (snapshot.docs.length < POSTS_PER_PAGE) setHasMore(false);
//   };

//   const formatDate = (timestamp) => {
//     if (!timestamp) return '';
//     const date = timestamp.toDate();
//     const now = new Date();
//     if (date.toDateString() === now.toDateString()) {
//         return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
//     }
//     return `${date.getMonth() + 1}/${date.getDate()}`;
//   };

//   const getYoutubeId = (url) => {
//     if (!url) return null;
//     const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
//     const match = url.match(regExp);
//     return (match && match[2].length === 11) ? match[2] : null;
//   };

//   const tabStyle = (isActive) => ({
//       flex: 1, padding: '12px', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold', fontSize: '16px',
//       background: isActive ? '#f1c40f' : '#34495e',
//       color: isActive ? '#000' : '#bdc3c7',
//       borderBottom: isActive ? '4px solid #e67e22' : '4px solid #2c3e50',
//       transition: 'all 0.2s'
//   });

//   return (
//     <div className="container" style={{ paddingTop: 30, background: '#1e272e', minHeight: '100vh', color: 'white', padding: '20px' }}>
      
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
//         <h1 style={{ color: '#f1c40f', margin: 0 }}>{t.bd_title}</h1>
//       </div>

//       <div style={{ display: 'flex', marginBottom: 20, borderRadius: 10, overflow: 'hidden' }}>
//           <div onClick={() => setCategory('free')} style={tabStyle(category === 'free')}>
//               {t.bd_tab_free || "💬 자유"}
//           </div>
//           <div onClick={() => setCategory('humor')} style={tabStyle(category === 'humor')}>
//               {t.bd_tab_humor || "🤣 유머"}
//           </div>
//           <div onClick={() => setCategory('yoon')} style={tabStyle(category === 'yoon')}>
//               {t.bd_tab_yoon || "👑 윤갤"}
//           </div>
//       </div>

//       <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
//         {posts.length === 0 ? <p style={{textAlign:'center', color:'#aaa', marginTop: 50}}>{t.bd_no_posts}</p> : 
//          posts.map((post) => {
//           const youtubeId = getYoutubeId(post.imageUrl);
          
//           return (
//             <div 
//               key={post.id} 
//               onClick={() => navigate(`/board/${post.id}`, { state: { category } })}
//               style={{ 
//                 background: post.isNotice ? '#341f97' : (post.isHot ? '#30336b' : '#2c3e50'), 
//                 padding: '15px', borderRadius: '10px', 
//                 cursor: 'pointer', border: '1px solid #34495e', transition: '0.2s',
//                 borderLeft: post.isNotice ? '5px solid #f1c40f' : (post.isHot ? '5px solid #e74c3c' : '1px solid #34495e'),
//                 boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
//               }}
//             >
//               <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', display:'flex', alignItems:'center', gap:'5px' }}>
//                   {post.isNotice && <span style={{fontSize:12, background:'#f1c40f', color:'black', padding:'2px 6px', borderRadius:4}}>{t.bd_notice}</span>}
//                   {post.isHot && <span style={{fontSize:12, background:'#e74c3c', color:'white', padding:'2px 6px', borderRadius:4}}>{t.bd_hot}</span>}
                  
//                   {post.imageUrl && (
//                     youtubeId ? <span title="동영상">🎥</span> : <span title="이미지">🖼️</span>
//                   )}
                  
//                   <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{post.title}</span>
//               </div>

//               <div style={{ fontSize: '13px', color: '#bdc3c7', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
//                 <span> {post.authorName}</span>
                
//                 <div style={{ display: 'flex', gap: '10px', alignItems:'center' }}>
//                     <span style={{color: (post.likes||0) > 0 ? '#ff6b6b' : '#bdc3c7'}}>
//                         ❤️ {post.likes || 0}
//                     </span>
//                     <span style={{color: (post.commentCount||0) > 0 ? '#54a0ff' : '#bdc3c7'}}>
//                         💬 {post.commentCount || 0}
//                     </span>
//                     <span style={{marginLeft: 5}}>
//                         {formatDate(post.createdAt)}
//                     </span>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {hasMore && (
//           <button 
//             onClick={loadMore} 
//             style={{
//                 width: '100%', padding: '12px', marginTop: '20px', 
//                 background: '#34495e', border: '1px solid #7f8c8d', borderRadius: '8px',
//                 color: 'white', cursor: 'pointer', fontWeight: 'bold'
//             }}
//           >
//             👇 {t.bd_more || "더 보기 (More)"}
//           </button>
//       )}

//       <button 
//         onClick={() => navigate('/board/write', { state: { category } })} 
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
import { collection, query, orderBy, onSnapshot, limit, startAfter, getDocs, where } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

const POSTS_PER_PAGE = 20;

export default function Board() {
  const navigate = useNavigate();
  const location = useLocation(); 
  const { t } = useLanguage();

  const [category, setCategory] = useState(() => {
    if (location.state?.category) return location.state.category;
    return sessionStorage.getItem('selectedCategory') || 'free';
  });

  const [posts, setPosts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  
  useEffect(() => {
    sessionStorage.setItem('selectedCategory', category);
  }, [category]);

  // 🔥 페이지 진입 시 스크롤 맨 위로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 🔄 게시글 불러오기
  useEffect(() => {
    setPosts([]);
    setHasMore(true);
    setLastDoc(null);

    const fetchPosts = () => {
        const noticeQuery = query(
            collection(db, "posts"),
            where("isNotice", "==", true),
            orderBy("createdAt", "desc")
        );

        const normalQuery = query(
            collection(db, "posts"),
            where("category", "==", category),
            where("isNotice", "==", false),
            orderBy("createdAt", "desc"),
            limit(POSTS_PER_PAGE)
        );

        const unsubNotice = onSnapshot(noticeQuery, (noticeSnap) => {
            const notices = noticeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const unsubNormal = onSnapshot(normalQuery, (normalSnap) => {
                const normals = normalSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                if (normalSnap.docs.length > 0) {
                    setLastDoc(normalSnap.docs[normalSnap.docs.length - 1]);
                }
                if (normalSnap.docs.length < POSTS_PER_PAGE) {
                    setHasMore(false);
                }

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

            return () => unsubNormal(); 
        });

        return () => unsubNotice(); 
    };

    const unsubscribe = fetchPosts();
    return () => { if(unsubscribe) unsubscribe(); };

  }, [category]);

  const loadMore = async () => {
      if (!lastDoc) return;
      
      const q = query(
          collection(db, "posts"),
          where("category", "==", category),
          where("isNotice", "==", false),
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

  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const tabStyle = (isActive) => ({
      flex: 1, padding: '12px', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold', fontSize: '16px',
      background: isActive ? '#f1c40f' : '#34495e',
      color: isActive ? '#000' : '#bdc3c7',
      borderBottom: isActive ? '4px solid #e67e22' : '4px solid #2c3e50',
      transition: 'all 0.2s'
  });

  return (
    <div className="container" style={{ paddingTop: 30, background: '#1e272e', minHeight: '100vh', color: 'white', padding: '20px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ color: '#f1c40f', margin: 0 }}>{t.bd_title}</h1>
      </div>

      <div style={{ display: 'flex', marginBottom: 20, borderRadius: 10, overflow: 'hidden' }}>
          <div onClick={() => setCategory('free')} style={tabStyle(category === 'free')}>
              {t.bd_tab_free || "💬 자유"}
          </div>
          <div onClick={() => setCategory('humor')} style={tabStyle(category === 'humor')}>
              {t.bd_tab_humor || "🤣 유머"}
          </div>
          <div onClick={() => setCategory('yoon')} style={tabStyle(category === 'yoon')}>
              {t.bd_tab_yoon || "👑 윤갤"}
          </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {posts.length === 0 ? <p style={{textAlign:'center', color:'#aaa', marginTop: 50}}>{t.bd_no_posts}</p> : 
         posts.map((post) => {
          const youtubeId = getYoutubeId(post.imageUrl);
          
          return (
            <div 
              key={post.id} 
              onClick={() => navigate(`/board/${post.id}`, { state: { category } })}
              style={{ 
                background: post.isNotice ? '#341f97' : (post.isHot ? '#30336b' : '#2c3e50'), 
                padding: '15px', borderRadius: '10px', 
                cursor: 'pointer', border: '1px solid #34495e', transition: '0.2s',
                borderLeft: post.isNotice ? '5px solid #f1c40f' : (post.isHot ? '5px solid #e74c3c' : '1px solid #34495e'),
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', display:'flex', alignItems:'center', gap:'5px' }}>
                  {post.isNotice && <span style={{fontSize:12, background:'#f1c40f', color:'black', padding:'2px 6px', borderRadius:4}}>{t.bd_notice}</span>}
                  {post.isHot && <span style={{fontSize:12, background:'#e74c3c', color:'white', padding:'2px 6px', borderRadius:4}}>{t.bd_hot}</span>}
                  
                  {post.imageUrl && (
                    youtubeId ? <span title="동영상">🎥</span> : <span title="이미지">🖼️</span>
                  )}
                  
                  <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{post.title}</span>
              </div>

              <div style={{ fontSize: '13px', color: '#bdc3c7', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                {/* 🔥 [수정] 칭호가 있으면 색상 적용해서 보여주기 */}
                <span> 
                    {post.authorTitle && (
                        <span style={{ 
                            color: post.authorTitleColor || '#e74c3c', // 색상 없으면 기본 빨강
                            fontWeight: 'bold', 
                            marginRight: '4px' 
                        }}>
                            [{post.authorTitle}]
                        </span>
                    )}
                    {post.authorName}
                </span>
                
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

      {hasMore && (
          <button 
            onClick={loadMore} 
            style={{
                width: '100%', padding: '12px', marginTop: '20px', 
                background: '#34495e', border: '1px solid #7f8c8d', borderRadius: '8px',
                color: 'white', cursor: 'pointer', fontWeight: 'bold'
            }}
          >
            👇 {t.bd_more || "더 보기 (More)"}
          </button>
      )}

      <button 
        onClick={() => navigate('/board/write', { state: { category } })} 
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