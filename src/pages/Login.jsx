import React, { useState } from 'react';
import { auth, db } from '../firebase'; // db 추가
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'; // signOut 추가
import { doc, getDoc } from 'firebase/firestore'; // DB 조회 함수 추가
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      // 1. 로그인 시도
      const userCredential = await signInWithEmailAndPassword(auth, email, pw);
      const user = userCredential.user;

      // 2. 관리자 계정은 프리패스
      if (user.email === "kks3172@naver.com") {
        navigate('/home');
        return;
      }

      // 3. 일반 유저 승인 여부 확인
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        // 🚫 승인 대기 중일 때
        if (userData.isApproved === false) {
            await signOut(auth); // 강제 로그아웃
            alert("⏳ 관리자의 승인 대기 중입니다.\n승인 후 이용 가능합니다.");
            return;
        }

        // 🚫 밴 당했을 때 (이중 체크)
        if (userData.isBanned === true) {
            await signOut(auth);
            alert("🚫 차단된 계정입니다.");
            return;
        }
      }

      // 4. 통과
      navigate('/home'); 
    } catch (e) { 
        alert("로그인 실패: 이메일이나 비밀번호를 확인하세요."); 
    }
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h1 className="title">大当たり</h1>
      
      <input className="input" placeholder="이메일을 입력하세요" onChange={(e) => setEmail(e.target.value)} />
      <input className="input" type="password" placeholder="비밀번호" onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleLogin(); }} />
      
      <div style={{ marginTop: 20, display:'flex', flexDirection:'column', gap:10 }}>
        <button className="btn btn-primary" onClick={handleLogin}>로그인</button>
        
        <div style={{display:'flex', justifyContent:'space-between', fontSize:'14px', marginTop:'10px', padding:'0 5px'}}>
            <span style={{color:'#666', cursor:'pointer', textDecoration:'underline'}} onClick={() => navigate('/find')}>
                🔑 아이디/비밀번호 찾기
            </span>
            <span style={{color:'#3498db', cursor:'pointer', fontWeight:'bold'}} onClick={() => navigate('/signup')}>
                회원가입
            </span>
        </div>
      </div>
    </div>
  );
}