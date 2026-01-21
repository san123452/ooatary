import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function Board() {
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. 모든 글을 날짜순(최신순)으로 가져옵니다.
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // --- 🧹 클라이언트 측 정렬 로직 시작 ---

      // 1) 공지글 분리 (isNotice가 true인 것)
      const notices = allPosts.filter(p => p.isNotice);
      
      // 2) 일반글 (공지 제외)
      const normals = allPosts.filter(p => !p.isNotice);

      // 3) HOT 게시글 선정 (일반글 중 좋아요 많은 순 Top 2, 좋아요 1개 이상일 때만)
      const hotCandidates = [...normals].sort((a, b) => (b.likes || 0) - (a.likes || 0));
      const hots = hotCandidates.filter(p => (p.likes || 0) > 0).slice(0, 2);
      const hotIds = hots.map(h => h.id);

      // 4) 나머지 일반글 (HOT 게시글 제외, 날짜순 유지)
      const rest = normals.filter(p => !hotIds.includes(p.id));

      // 5) 최종 합치기: 공지 -> HOT(태그추가) -> 나머지
      const finalPosts = [
          ...notices, 
          ...hots.map(p => ({...p, isHot: true})), 
          ...rest
      ];

      setPosts(finalPosts);
    });
    return () => unsubscribe();
  }, []);

  // 🕒 날짜 포맷 함수
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    // 오늘 날짜면 시간만, 아니면 월/일 표시
    if (date.toDateString() === now.toDateString()) {
        return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="container" style={{ paddingTop: 30, background: '#1e272e', minHeight: '100vh', color: 'white', padding: '20px' }}>
      
      {/* 헤더 영역 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ color: '#f1c40f', margin: 0 }}>📢 테토카페(시즌3)</h1>
      </div>

      {/* 게시글 리스트 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {posts.length === 0 ? <p style={{textAlign:'center', color:'#aaa', marginTop: 50}}>아직 작성된 글이 없습니다.</p> : 
         posts.map((post) => (
          <div 
            key={post.id} 
            onClick={() => navigate(`/board/${post.id}`)}
            style={{ 
              // 🎨 배경색: 공지는 보라, HOT은 남색, 일반은 기본색
              background: post.isNotice ? '#341f97' : (post.isHot ? '#30336b' : '#2c3e50'), 
              padding: '15px', borderRadius: '10px', 
              cursor: 'pointer', border: '1px solid #34495e', transition: '0.2s',
              // 공지와 HOT은 왼쪽에 색깔 띠 표시
              borderLeft: post.isNotice ? '5px solid #f1c40f' : (post.isHot ? '5px solid #e74c3c' : '1px solid #34495e'),
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {/* 제목 라인 */}
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', display:'flex', alignItems:'center', gap:'5px' }}>
                {/* [공지] 태그 */}
                {post.isNotice && <span style={{fontSize:12, background:'#f1c40f', color:'black', padding:'2px 6px', borderRadius:4}}>공지</span>}
                {/* [HOT] 태그 */}
                {post.isHot && <span style={{fontSize:12, background:'#e74c3c', color:'white', padding:'2px 6px', borderRadius:4}}>HOT</span>}
                {/* 🖼️ 이미지 아이콘 */}
                {post.imageUrl && <span>🖼️</span>}
                
                <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{post.title}</span>
            </div>

            {/* 정보 라인 (작성자 / 좋아요 / 댓글 / 시간) */}
            <div style={{ fontSize: '13px', color: '#bdc3c7', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span> {post.authorName}</span>
              
              <div style={{ display: 'flex', gap: '10px', alignItems:'center' }}>
                  {/* ❤️ 좋아요 수 */}
                  <span style={{color: (post.likes||0) > 0 ? '#ff6b6b' : '#bdc3c7'}}>
                      ❤️ {post.likes || 0}
                  </span>
                  {/* 💬 댓글 수 */}
                  <span style={{color: (post.commentCount||0) > 0 ? '#54a0ff' : '#bdc3c7'}}>
                      💬 {post.commentCount || 0}
                  </span>
                  {/* 🕒 시간 */}
                  <span style={{marginLeft: 5}}>
                      {formatDate(post.createdAt)}
                  </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ✏️ 글쓰기 버튼 (우측 하단 고정) */}
      <button 
        onClick={() => navigate('/board/write')}
        style={{
          position: 'fixed', bottom: '30px', right: '30px',
          width: '60px', height: '60px', borderRadius: '50%',
          background: '#f1c40f', color: '#1e272e', fontSize: '30px',
          border: 'none', boxShadow: '0 4px 15px rgba(241, 196, 15, 0.4)', 
          cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center',
          transition: 'transform 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        🖊️
      </button>

      <button className="btn" style={{marginTop: 30, background: '#444', width:'100%', padding:'15px'}} onClick={() => navigate('/home')}>🏠 홈으로</button>
    </div>
  );
}