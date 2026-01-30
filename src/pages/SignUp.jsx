
// import React, { useState } from 'react';
// import { auth, db } from '../firebase';
// import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
// import { doc, setDoc } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';
// import { useLanguage } from '../LanguageContext';

// export default function SignUp() {
//   const [email, setEmail] = useState('');
//   const [pw, setPw] = useState('');
//   const [name, setName] = useState('');
//   const [loading, setLoading] = useState(false);
  
//   const navigate = useNavigate();
//   const { t } = useLanguage(); // 👈

//   const handleSignUp = async () => {
//     if (!name.trim() || !email.trim() || !pw.trim()) return alert("Error");
//     if (loading) return;
//     setLoading(true);

//     try {
//       let userIp = "Unknown";
//       try {
//         const res = await fetch('https://api64.ipify.org?format=json');
//         const data = await res.json();
//         userIp = data.ip;
//       } catch (err) {}

//       const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pw.trim());
//       const user = userCredential.user;

//       await setDoc(doc(db, "users", user.uid), {
//         email: user.email,
//         name: name.trim(),
//         point: 0,
//         tierLevel: 1,
//         tierName: "브론즈",
//         isBanned: false,
//         isApproved: false,
//         ip: userIp,
//         createdAt: new Date()
//       });

//       await signOut(auth);
//       alert(t.waitingApproval);
//       navigate('/login'); 

//     } catch (e) { 
//       alert(t.alertError + ": " + e.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
//       <h1 className="title" style={{color:'#2ecc71'}}>{t.signup}</h1>
      
//       <input className="input" placeholder={t.inputName} value={name} onChange={(e) => setName(e.target.value)} />
//       <input className="input" placeholder={t.inputEmail} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
//       <input className="input" type="password" placeholder={t.inputPw} value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleSignUp(); }} />
      
//       <div style={{ marginTop: 20, display:'flex', flexDirection:'column', gap:10 }}>
//         <button className="btn btn-success" onClick={handleSignUp} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
//             {loading ? t.loading : t.signup}
//         </button>
//         <button className="btn" style={{background:'transparent', color:'#aaa'}} onClick={() => navigate('/login')}>
//             {t.cancel}
//         </button>
//       </div>
//     </div>
//   );
// }

import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore'; // getDoc 추가
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !pw.trim()) return alert(t.alertError || "입력 정보를 확인하세요.");
    if (loading) return;
    setLoading(true);

    try {
      // 1. IP 가져오기
      let userIp = "Unknown";
      try {
        const res = await fetch('https://api64.ipify.org?format=json');
        const data = await res.json();
        userIp = data.ip;
      } catch (err) {}

      // 2. 시스템 설정(자동 승인 여부) 확인
      let isAutoApproved = false; // 기본은 수동 승인
      try {
          const sysDoc = await getDoc(doc(db, "system", "features"));
          if (sysDoc.exists()) {
              // autoApproval이 true면 자동 승인(true), 아니면 대기(false)
              isAutoApproved = sysDoc.data().autoApproval === true;
          }
      } catch(e) { console.error("설정 로드 실패", e); }

      // 3. 회원가입
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pw.trim());
      const user = userCredential.user;

      // 4. 유저 정보 저장 (설정에 따라 isApproved 값 결정)
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        name: name.trim(),
        point: 0,
        tierLevel: 1,
        tierName: "브론즈",
        isBanned: false,
        isApproved: isAutoApproved, // 🔥 여기가 핵심! 설정값 적용
        ip: userIp,
        createdAt: new Date()
      });

      // 5. 결과 처리
      if (isAutoApproved) {
          // 자동 승인이면 바로 로그인 상태 유지하고 홈으로
          alert("🎉 회원가입이 완료되었습니다! 환영합니다.");
          navigate('/home');
      } else {
          // 수동 승인이면 로그아웃 시키고 로그인 페이지로
          await signOut(auth);
          alert(t.waitingApproval || "관리자 승인 대기 중입니다.");
          navigate('/login');
      }

    } catch (e) { 
      alert((t.alertError || "오류") + ": " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h1 className="title" style={{color:'#2ecc71'}}>{t.signup}</h1>
      
      <input className="input" placeholder={t.inputName} value={name} onChange={(e) => setName(e.target.value)} />
      <input className="input" placeholder={t.inputEmail} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="input" type="password" placeholder={t.inputPw} value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleSignUp(); }} />
      
      <div style={{ marginTop: 20, display:'flex', flexDirection:'column', gap:10 }}>
        <button className="btn btn-success" onClick={handleSignUp} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? t.loading : t.signup}
        </button>
        <button className="btn" style={{background:'transparent', color:'#aaa'}} onClick={() => navigate('/login')}>
            {t.cancel}
        </button>
      </div>
    </div>
  );
}