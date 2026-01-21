import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function FindAccount() {
  const [tab, setTab] = useState('id'); 
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  
  const navigate = useNavigate();

  // 🕵️‍♂️ 아이디(이메일) 찾기 함수
  const findID = async () => {
    if (!name) return alert("가입한 이름을 입력해주세요.");
    setMessage("🔍 검색 중...");

    try {
      const q = query(collection(db, "users"), where("name", "==", name));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setMessage("❌ 해당 이름으로 가입된 계정이 없습니다.");
      } else {
        const userData = querySnapshot.docs[0].data();
        if (userData.email) {
            setMessage(`✅ 찾은 아이디: ${userData.email}`);
        } else {
            setMessage("⚠️ 유저는 찾았으나 이메일 정보가 비어있습니다.");
        }
      }
    } catch (e) {
      setMessage("오류 발생: " + e.message);
    }
  };

  // 🔑 비밀번호 재설정 이메일 보내기
  const findPW = async () => {
    if (!email) return alert("이메일을 입력해주세요.");

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(`📧 ${email}로 재설정 메일을 보냈습니다! 메일함을 확인해주세요.`);
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        setMessage("❌ 가입되지 않은 이메일입니다.");
      } else {
        setMessage("오류: " + e.message);
      }
    }
  };

  return (
    <div className="container" style={{
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', 
        minHeight:'100vh', 
        background:'#2c3e50', // 전체 배경 (다크 네이비)
        color:'white'
    }}>
      <div className="card" style={{
          width:'100%', maxWidth:'400px', padding:30, 
          background:'#34495e', // 카드 배경 (연한 다크)
          borderRadius:15, 
          boxShadow:'0 10px 25px rgba(0,0,0,0.5)',
          border: '2px solid #f1c40f' // ✨ 요청하신 노란색 테두리
      }}>
        <h2 style={{textAlign:'center', marginBottom:20, color:'#f1c40f'}}>🕵️ 계정 찾기</h2>

        {/* 탭 버튼 */}
        <div style={{display:'flex', marginBottom:20, borderBottom:'1px solid #7f8c8d'}}>
          <button 
            style={{
                flex:1, padding:10, background:'none', border:'none', 
                borderBottom: tab==='id'?'3px solid #f1c40f':'none', // 활성 탭 노란색 밑줄
                fontWeight:'bold', 
                color: tab==='id'?'#f1c40f':'#95a5a6', // 활성 텍스트 노란색
                cursor:'pointer', fontSize: '16px'
            }}
            onClick={()=>{setTab('id'); setMessage('');}}
          >
            아이디 찾기
          </button>
          <button 
            style={{
                flex:1, padding:10, background:'none', border:'none', 
                borderBottom: tab==='pw'?'3px solid #f1c40f':'none', 
                fontWeight:'bold', 
                color: tab==='pw'?'#f1c40f':'#95a5a6', 
                cursor:'pointer', fontSize: '16px'
            }}
            onClick={()=>{setTab('pw'); setMessage('');}}
          >
            비밀번호 찾기
          </button>
        </div>

        {/* 입력 폼 */}
        {tab === 'id' ? (
          <div>
            <p style={{fontSize:14, color:'#ccc', marginBottom:5}}>가입시 입력한 이름</p>
            <input 
                className="input" 
                placeholder="홍길동" 
                value={name} 
                onChange={e=>setName(e.target.value)} 
                style={{width:'100%', height:45, fontSize:16}} 
            />
            <button 
                className="btn" 
                style={{
                    width:'100%', marginTop:15, height:45, fontWeight:'bold', fontSize:16,
                    background:'#f1c40f', color:'#2c3e50', border:'none', borderRadius:5, cursor:'pointer'
                }} 
                onClick={findID}
            >
                아이디 찾기
            </button>
          </div>
        ) : (
          <div>
            <p style={{fontSize:14, color:'#ccc', marginBottom:5}}>가입한 이메일 주소</p>
            <input 
                className="input" 
                placeholder="example@email.com" 
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
                style={{width:'100%', height:45, fontSize:16}} 
            />
            <button 
                className="btn" 
                style={{
                    width:'100%', marginTop:15, height:45, fontWeight:'bold', fontSize:16,
                    background:'#f1c40f', color:'#2c3e50', border:'none', borderRadius:5, cursor:'pointer'
                }} 
                onClick={findPW}
            >
                비밀번호 재설정 메일 발송
            </button>
          </div>
        )}

        {/* 결과 메시지 */}
        {message && (
          <div style={{
              marginTop:20, padding:15, 
              background:'#222', borderRadius:10, 
              color:'#f1c40f', fontSize:14, textAlign:'center', // 검은 배경에 노란 글씨
              border:'1px solid #f1c40f'
          }}>
            {message}
          </div>
        )}

       

        <button 
            className="btn" 
            style={{marginTop:20, width:'100%', background:'transparent', color:'#ccc', border:'1px solid #7f8c8d'}} 
            onClick={()=>navigate('/login')}
        >
          로그인으로 돌아가기
        </button>
      </div>
    </div>
  );
}