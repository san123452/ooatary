 import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

export default function FindAccount() {
  const [tab, setTab] = useState('id'); 
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  
  const navigate = useNavigate();
  const { t, toggleLang, lang } = useLanguage(); 

  const findID = async () => {
    if (!name) return alert(t.inputName);
    setMessage(t.loading);

    try {
      const q = query(collection(db, "users"), where("name", "==", name));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setMessage(t.fa_notFound);
      } else {
        const userData = querySnapshot.docs[0].data();
        if (userData.email) {
            setMessage(`${t.fa_found} ${userData.email}`);
        } else {
            setMessage(t.alertError);
        }
      }
    } catch (e) { setMessage(t.alertError + ": " + e.message); }
  };

  const findPW = async () => {
    if (!email) return alert(t.inputEmail);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(t.fa_sent);
    } catch (e) {
      if (e.code === 'auth/user-not-found') setMessage(t.fa_notFound);
      else setMessage(t.alertError + ": " + e.message);
    }
  };

  return (
    <div className="container" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#2c3e50', color:'white', position: 'relative' }}>
      
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

      <div className="card" style={{ width:'100%', maxWidth:'400px', padding:30, background:'#34495e', borderRadius:15, boxShadow:'0 10px 25px rgba(0,0,0,0.5)', border: '2px solid #f1c40f' }}>
        <h2 style={{textAlign:'center', marginBottom:20, color:'#f1c40f'}}>{t.faTitle}</h2>

        <div style={{display:'flex', marginBottom:20, borderBottom:'1px solid #7f8c8d'}}>
          <button style={{ flex:1, padding:10, background:'none', border:'none', borderBottom: tab==='id'?'3px solid #f1c40f':'none', fontWeight:'bold', color: tab==='id'?'#f1c40f':'#95a5a6', cursor:'pointer', fontSize: '16px' }} onClick={()=>{setTab('id'); setMessage('');}}> {t.fa_findId} </button>
          <button style={{ flex:1, padding:10, background:'none', border:'none', borderBottom: tab==='pw'?'3px solid #f1c40f':'none', fontWeight:'bold', color: tab==='pw'?'#f1c40f':'#95a5a6', cursor:'pointer', fontSize: '16px' }} onClick={()=>{setTab('pw'); setMessage('');}}> {t.fa_findPw} </button>
        </div>

        {tab === 'id' ? (
          <div>
            <p style={{fontSize:14, color:'#ccc', marginBottom:5}}>{t.fa_name}</p>
            <input className="input" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} style={{width:'100%', height:45, fontSize:16}} />
            <button className="btn" style={{ width:'100%', marginTop:15, height:45, fontWeight:'bold', fontSize:16, background:'#f1c40f', color:'#2c3e50', border:'none', borderRadius:5, cursor:'pointer' }} onClick={findID}> {t.fa_findId} </button>
          </div>
        ) : (
          <div>
            <p style={{fontSize:14, color:'#ccc', marginBottom:5}}>{t.fa_email}</p>
            <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:'100%', height:45, fontSize:16}} />
            <button className="btn" style={{ width:'100%', marginTop:15, height:45, fontWeight:'bold', fontSize:16, background:'#f1c40f', color:'#2c3e50', border:'none', borderRadius:5, cursor:'pointer' }} onClick={findPW}> {t.fa_send} </button>
          </div>
        )}

        {message && (
          <div style={{ marginTop:20, padding:15, background:'#222', borderRadius:10, color:'#f1c40f', fontSize:14, textAlign:'center', border:'1px solid #f1c40f' }}>
            {message}
          </div>
        )}

        <button className="btn" style={{marginTop:20, width:'100%', background:'transparent', color:'#ccc', border:'1px solid #7f8c8d'}} onClick={()=>navigate('/login')}>
          {t.back}
        </button>
      </div>
    </div>
  );
}