import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
// onSnapshot 추가 (실시간 감지)
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp, getDocs, query, where, getDoc, onSnapshot } from 'firebase/firestore';

export default function Header({ point }) {
  const navigate = useNavigate();
  
  // ⚙️ 기능 활성화 상태 (기본값 true)
  const [features, setFeatures] = useState({ transfer: true, attack: true });

  // 🔄 실시간 기능 상태 감지
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "system", "features"), (docSnap) => {
        if (docSnap.exists()) {
            setFeatures(docSnap.data());
        }
    });
    return () => unsub();
  }, []);

  // ⚔️ 2. 핵공격 핸들러
  const handleAttack = async () => {
    // 🔒 잠금 체크
    if (!features.attack) return alert("🔒 현재 관리자가 이 기능을 비활성화했습니다.");

    const user = auth.currentUser;
    if (!user) return;

    const currentPoint = point || 0;
    if (currentPoint < 100) return alert("핵폭탄을 발사하려면 최소 100원은 있어야 합니다.");

    const cost = Math.floor(currentPoint / 2); 

    if (!window.confirm(`⚔️ 핵폭탄을 발사하시겠습니까?\n\n내 전 재산의 절반(${cost.toLocaleString()}원)을 사용하여\n랜덤 유저 1명을 타격합니다.`)) return;

    try {
        const myDoc = await getDoc(doc(db, "users", user.uid));
        const myName = myDoc.exists() ? myDoc.data().name : "익명";

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("point", ">", 1000000)); 
        const querySnapshot = await getDocs(q);
        
        const targets = [];
        querySnapshot.forEach((doc) => {
            if (doc.id !== user.uid) targets.push({ id: doc.id, ...doc.data() });
        });

        if (targets.length === 0) return alert("공격할 대상이 없습니다.");

        const randomIndex = Math.floor(Math.random() * targets.length);
        const target = targets[randomIndex];
        const targetName = target.name || "익명";
        const targetCurrentPoint = target.point || 0;

        let damage = cost;
        if (targetCurrentPoint < damage) damage = targetCurrentPoint; 

        await updateDoc(doc(db, "users", user.uid), { point: increment(-cost) });
        if (damage > 0) await updateDoc(doc(db, "users", target.id), { point: increment(-damage) });

        await addDoc(collection(db, "history"), {
            uid: user.uid, type: "공격", msg: `🚀 [${targetName}]님에게 핵폭탄 투하!`, amount: -cost, createdAt: serverTimestamp()
        });
        await addDoc(collection(db, "history"), {
            uid: target.id, type: "피격", msg: `💣 [${myName}]님이 쏜 핵폭탄에 맞았습니다!`, amount: -damage, createdAt: serverTimestamp()
        });

        alert(`🎯 [명중]\n${targetName}님에게 핵폭탄이 떨어졌습니다!\n피해량: ${damage.toLocaleString()}원`);

    } catch (e) {
        console.error("공격 실패:", e);
        alert("오류 발생");
    }
  };

  // 💸 송금 핸들러 (잠금 체크 추가)
  const handleTransfer = () => {
      if (!features.transfer) return alert("🔒 현재 관리자가 송금 기능을 막아두었습니다.");
      navigate('/transfer');
  };

  return (
    <header style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      height: '60px', padding: '0 20px', background: '#2f3640', borderBottom: '2px solid #e1b12c', 
      color: 'white', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
    }}>
      
      <div onClick={() => navigate('/home')} style={{ cursor: 'pointer', fontSize: '22px', fontWeight: 'bold', color: '#e1b12c', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>🎰</span> 大当たり
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        
        {/* 🚀 핵버튼 (잠기면 회색 & 자물쇠) */}
        <button 
          onClick={handleAttack}
          style={{ 
            background: features.attack ? '#8e44ad' : '#7f8c8d', // 활성: 보라, 비활성: 회색
            border: features.attack ? '2px solid #9b59b6' : '2px solid #95a5a6', 
            borderRadius: '5px', padding: '8px 10px', color: features.attack ? 'white' : '#ccc', 
            cursor: features.attack ? 'pointer' : 'not-allowed', // 커서 변경
            fontWeight: 'bold', fontSize: '13px', 
            boxShadow: features.attack ? '0 0 5px #8e44ad' : 'none',
            display: 'flex', alignItems: 'center', gap: '5px'
          }}
        >
          {!features.attack && <span>🔒</span>} 
          🚀 핵버튼
        </button>

        {/* 💸 송금 버튼 (잠기면 회색 & 자물쇠) */}
        <button 
          onClick={handleTransfer}
          style={{ 
            background: features.transfer ? '#27ae60' : '#7f8c8d', 
            border: 'none', borderRadius: '5px', padding: '8px 10px', 
            color: features.transfer ? 'white' : '#ccc', 
            cursor: features.transfer ? 'pointer' : 'not-allowed',
            fontWeight: 'bold', fontSize: '13px',
            display: 'flex', alignItems: 'center', gap: '5px'
          }}
        >
          {!features.transfer && <span>🔒</span>}
          💸 송금
        </button>

        {/* 📜 기록 버튼 */}
        <button 
          onClick={() => navigate('/history')}
          style={{ background: '#3498db', border: 'none', borderRadius: '5px', padding: '8px 10px', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
        >
          📜 기록
        </button>

        {/* 💰 포인트 */}
        <div style={{ fontSize: '15px', fontWeight: 'bold', background: '#1e272e', padding: '6px 10px', borderRadius: '20px', border: '1px solid #555', marginLeft: '5px', whiteSpace: 'nowrap' }}>
          💰 {point ? Math.floor(point).toLocaleString() : 0}
        </div>
        
      </div>
    </header>
  );
}