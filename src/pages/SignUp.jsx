import React, { useState } from 'react';
import { auth, db } from '../firebase';
// 👇 signOut 추가됨
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSignUp = async () => {
    // 1️⃣ 빈칸 및 유효성 검사
    if (!name.trim()) return alert("이름을 입력해주세요!");
    if (!email.trim()) return alert("이메일을 입력해주세요!");
    if (!pw.trim()) return alert("비밀번호를 입력해주세요!");
    if (pw.length < 6) return alert("비밀번호는 최소 6자 이상이어야 합니다.");

    if (loading) return;
    setLoading(true);

    try {
      // 🕵️‍♂️ IP 주소 가져오기
      let userIp = "알수없음";
      try {
        const res = await fetch('https://api64.ipify.org?format=json');
        const data = await res.json();
        userIp = data.ip;
      } catch (err) {
        console.error("IP 조회 실패", err);
      }

      // 2️⃣ 회원가입 시도
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pw.trim());
      const user = userCredential.user;

      // 3️⃣ 추가 정보 저장 (승인 대기 상태로 저장)
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        name: name.trim(),
        point: 0,
        tierLevel: 1,
        tierName: "브론즈",
        isBanned: false,
        isApproved: false, // 🚫 기본값: 승인 대기
        ip: userIp,        // 🌐 IP 주소 저장
        createdAt: new Date() // 가입일 저장
      });

      // 🔐 [핵심] 가입 직후 자동 로그인을 막기 위해 강제 로그아웃
      await signOut(auth);

      alert(`🎉 가입 신청이 완료되었습니다!\n관리자의 승인 후 로그인이 가능합니다.`);
      navigate('/login'); 

    } catch (e) { 
      console.error("회원가입 실패:", e.code);
      if (e.code === 'auth/email-already-in-use') {
        alert("이미 사용 중인 이메일입니다.");
      } else if (e.code === 'auth/weak-password') {
        alert("비밀번호는 6자 이상이어야 합니다.");
      } else {
        alert("오류 발생: " + e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h1 className="title" style={{color:'#2ecc71'}}>📝 회원가입 신청</h1>
      
      <input className="input" placeholder="이름 (닉네임)" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="input" placeholder="이메일" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="input" type="password" placeholder="비밀번호 (6자 이상)" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleSignUp(); }} />
      
      <div style={{ marginTop: 20, display:'flex', flexDirection:'column', gap:10 }}>
        <button className="btn btn-success" onClick={handleSignUp} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? "처리 중..." : "가입 신청하기"}
        </button>
        <button className="btn" style={{background:'transparent', color:'#aaa'}} onClick={() => navigate('/login')}>
            취소 (로그인으로 돌아가기)
        </button>
      </div>
    </div>
  );
}