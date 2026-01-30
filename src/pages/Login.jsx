
// import React, { useState } from 'react';
// import { auth, db } from '../firebase';
// import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
// import { doc, getDoc } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';
// import { useLanguage } from '../LanguageContext';

// export default function Login() {
//   const [email, setEmail] = useState('');
//   const [pw, setPw] = useState('');
//   const navigate = useNavigate();
//   // 👇 언어 설정 가져오기
//   const { t, toggleLang, lang } = useLanguage();

//   const handleLogin = async () => {
//     try {
//       const userCredential = await signInWithEmailAndPassword(auth, email, pw);
//       const user = userCredential.user;

//       // 1. 관리자 프리패스
//       if (user.email === "kks3172@naver.com") {
//         navigate('/home');
//         return;
//       }

//       // 2. 일반 유저 체크 (DB 조회)
//       const userRef = doc(db, "users", user.uid);
//       const userSnap = await getDoc(userRef);

//       if (userSnap.exists()) {
//         const userData = userSnap.data();
        
//         // 승인 대기 중 체크
//         if (userData.isApproved === false) {
//             await signOut(auth);
//             alert(t.waitingApproval);
//             return;
//         }
        
//         // 밴 당한 계정 체크
//         if (userData.isBanned === true) {
//             await signOut(auth);
//             alert(t.banned);
//             return;
//         }
//       }
//       // 3. 통과 -> 홈으로 이동
//       navigate('/home'); 
//     } catch (e) { 
//         alert(t.alertError); 
//     }
//   };

//   return (
//     <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', position:'relative', minHeight: '100vh', background: '#2c3e50', padding: '20px' }}>
      
//       {/* 🇯🇵 언어 변경 버튼 */}
//       <button 
//         onClick={toggleLang} 
//         style={{
//             position:'absolute', top: 20, right: 20, 
//             background: 'rgba(255,255,255,0.1)', 
//             border: '1px solid #ccc', 
//             color: '#fff', 
//             padding: '0 12px', 
//             borderRadius: '20px', 
//             fontSize: '18px', 
//             height: '32px',
//             cursor: 'pointer',
//             display: 'flex', alignItems: 'center', justifyContent: 'center'
//         }}
//       >
//         {lang === 'ko' ? '🇯🇵' : '🇰🇷'}
//       </button>

//       <h1 className="title" style={{ color: '#f1c40f', fontSize: '40px', marginBottom: '30px', textAlign: 'center' }}>大当たり</h1>
      
//       <div style={{ background: '#34495e', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
//           <input 
//             className="input" 
//             placeholder={t.inputEmail} 
//             onChange={(e) => setEmail(e.target.value)} 
//             style={{ width: '100%', marginBottom: '15px', background: '#2c3e50', color: 'white', border: '1px solid #555' }}
//           />
//           <input 
//             className="input" 
//             type="password" 
//             placeholder={t.inputPw} 
//             onChange={(e) => setPw(e.target.value)} 
//             onKeyDown={(e) => { if(e.key === 'Enter') handleLogin(); }} 
//             style={{ width: '100%', marginBottom: '20px', background: '#2c3e50', color: 'white', border: '1px solid #555' }}
//           />
          
//           <button className="btn btn-primary" onClick={handleLogin} style={{ width: '100%', padding: '15px', fontSize: '18px', background: '#f1c40f', color: '#2c3e50', fontWeight: 'bold' }}>
//             {t.login}
//           </button>
          
//           {/* 👇 여기가 중요: t.findAccount 변수를 사용하여 언어 변경 시 텍스트도 변경됨 */}
//           <div style={{ display:'flex', justifyContent:'space-between', fontSize:'14px', marginTop:'20px', padding:'0 5px' }}>
//               <span style={{ color:'#bdc3c7', cursor:'pointer', textDecoration:'underline' }} onClick={() => navigate('/find')}>
//                   {t.findAccount}
//               </span>
              
//               <span style={{ color:'#3498db', cursor:'pointer', fontWeight:'bold' }} onClick={() => navigate('/signup')}>
//                   {t.signup}
//               </span>
//           </div>
//       </div>
//     </div>
//   );
// }

import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const navigate = useNavigate();
  const { t, toggleLang, lang } = useLanguage();

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pw);
      const user = userCredential.user;

      // 1. 관리자 프리패스
      if (user.email === "kks3172@naver.com") {
        navigate('/home');
        return;
      }

      // 2. 일반 유저 체크
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        
        // 승인 대기 체크
        if (userData.isApproved === false) {
            await signOut(auth);
            alert(t.waitingApproval);
            return;
        }
        
        // 차단 계정 체크
        if (userData.isBanned === true) {
            await signOut(auth);
            alert(t.banned);
            return;
        }
      }
      navigate('/home'); 
    } catch (e) { 
        alert(t.alertError); 
    }
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', position:'relative', minHeight: '100vh', background: '#2c3e50', padding: '20px' }}>
      
      <button 
        onClick={toggleLang} 
        style={{
            position:'absolute', top: 20, right: 20, 
            background: 'rgba(255,255,255,0.1)', 
            border: '1px solid #ccc', 
            color: '#fff', 
            padding: '0 12px', 
            borderRadius: '20px', 
            fontSize: '18px', 
            height: '32px',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        {lang === 'ko' ? '🇯🇵' : '🇰🇷'}
      </button>

      <h1 className="title" style={{ color: '#f1c40f', fontSize: '40px', marginBottom: '30px', textAlign: 'center' }}>大当たり</h1>
      
      <div style={{ background: '#34495e', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
          <input 
            className="input" 
            placeholder={t.inputEmail} 
            onChange={(e) => setEmail(e.target.value)} 
            style={{ width: '100%', marginBottom: '15px', background: '#2c3e50', color: 'white', border: '1px solid #555' }}
          />
          <input 
            className="input" 
            type="password" 
            placeholder={t.inputPw} 
            onChange={(e) => setPw(e.target.value)} 
            onKeyDown={(e) => { if(e.key === 'Enter') handleLogin(); }} 
            style={{ width: '100%', marginBottom: '20px', background: '#2c3e50', color: 'white', border: '1px solid #555' }}
          />
          
          <button className="btn btn-primary" onClick={handleLogin} style={{ width: '100%', padding: '15px', fontSize: '18px', background: '#f1c40f', color: '#2c3e50', fontWeight: 'bold' }}>
            {t.login}
          </button>
          
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'14px', marginTop:'20px', padding:'0 5px' }}>
              <span style={{ color:'#bdc3c7', cursor:'pointer', textDecoration:'underline' }} onClick={() => navigate('/find')}>
                  {t.findAccount || "아이디/비번 찾기"} 
              </span>
              
              <span style={{ color:'#3498db', cursor:'pointer', fontWeight:'bold' }} onClick={() => navigate('/signup')}>
                  {t.signup}
              </span>
          </div>
      </div>
    </div>
  );
}