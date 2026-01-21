import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
// 👇 addDoc, serverTimestamp 등 필수 import
import { collection, query, where, getDocs, doc, runTransaction, limit, addDoc, serverTimestamp } from 'firebase/firestore'; 
import { useNavigate } from 'react-router-dom';

export default function Transfer() {
  const [point, setPoint] = useState(0);
  const [targetName, setTargetName] = useState(""); // 받는 사람 닉네임
  const [amount, setAmount] = useState("");         // 보낼 금액
  const [loading, setLoading] = useState(false);
  
  // 🔍 검색 관련 상태
  const [searchResults, setSearchResults] = useState([]); 
  const [isSearching, setIsSearching] = useState(false);

  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchMyInfo();
  }, [user, navigate]);

  const fetchMyInfo = async () => {
    try {
        const userDoc = await getDocs(query(collection(db, "users"), where("email", "==", user.email)));
        if (!userDoc.empty) {
            setPoint(userDoc.docs[0].data().point || 0);
        }
    } catch (e) { console.error(e); }
  };

  // 🔍 유저 검색 함수
  const handleSearchUser = async () => {
    if (!targetName.trim()) return;
    setIsSearching(true);
    setSearchResults([]);

    try {
        const q = query(
            collection(db, "users"),
            where("name", ">=", targetName),
            where("name", "<=", targetName + "\uf8ff"),
            limit(5)
        );

        const querySnapshot = await getDocs(q);
        const users = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (doc.id !== user.uid) {
                users.push({ id: doc.id, name: data.name });
            }
        });

        if (users.length === 0) alert("검색된 유저가 없습니다.");
        setSearchResults(users);

    } catch (e) {
        console.error(e);
        alert("검색 중 오류 발생");
    } finally {
        setIsSearching(false);
    }
  };

  const selectUser = (name) => {
      setTargetName(name);
      setSearchResults([]); 
  };

  // 💸 송금 실행 함수 (수정됨: 양쪽 모두 기록 저장)
  const handleTransfer = async () => {
    const sendAmount = parseInt(amount);

    if (!targetName) return alert("받는 사람 닉네임을 입력하세요!");
    if (isNaN(sendAmount) || sendAmount <= 0) return alert("보낼 금액을 올바르게 입력하세요!");
    if (sendAmount > Math.floor(point)) return alert("잔액이 부족합니다!");

    if (!window.confirm(`[${targetName}] 님에게 ${sendAmount.toLocaleString()}원을 보내시겠습니까?`)) return;

    setLoading(true);

    try {
      // 1. 송금 트랜잭션 (돈 이동 + 정보 반환)
      const { receiverUid, senderName } = await runTransaction(db, async (transaction) => {
        // 받는 사람 검색
        const q = query(collection(db, "users"), where("name", "==", targetName));
        const targetSnapshot = await getDocs(q);

        if (targetSnapshot.empty) throw new Error("존재하지 않는 닉네임입니다.");
        
        const targetDoc = targetSnapshot.docs[0];
        const targetData = targetDoc.data();
        const targetUid = targetDoc.id;

        if (targetUid === user.uid) throw new Error("자신에게는 보낼 수 없습니다.");

        // 내 정보 가져오기 (잔액 확인 및 내 닉네임 가져오기)
        const myDocRef = doc(db, "users", user.uid);
        const myDocSnap = await transaction.get(myDocRef);
        if (!myDocSnap.exists()) throw new Error("내 정보를 찾을 수 없습니다.");
        
        const myData = myDocSnap.data();
        const myCurrentPoint = myData.point || 0;
        
        if (myCurrentPoint < sendAmount) throw new Error("잔액이 부족합니다.");

        // 돈 빼고 더하기
        transaction.update(myDocRef, { point: myCurrentPoint - sendAmount });
        transaction.update(doc(db, "users", targetUid), { point: (targetData.point || 0) + sendAmount });

        // ⭐ 중요: 받는 사람 UID와 보낸 사람(나)의 닉네임을 리턴
        return { receiverUid: targetUid, senderName: myData.name };
      });

      // 2. 📜 거래 기록 저장 (History) - 양쪽 모두에게 저장!
      
      // (1) 내 기록 (보냄 - 송금)
      await addDoc(collection(db, "history"), {
        uid: user.uid,
        type: "송금",
        msg: `${targetName}님에게 송금`,
        amount: -sendAmount, 
        createdAt: serverTimestamp()
      });

      // (2) 상대방 기록 (받음 - 입금)
      await addDoc(collection(db, "history"), {
        uid: receiverUid, 
        type: "입금", 
        msg: `${senderName}님으로부터 입금`,  // 내 닉네임이 상대방 기록에 뜸
        amount: sendAmount, 
        createdAt: serverTimestamp()
      });

      alert(`💸 송금 완료! [${targetName}]님에게 ${sendAmount.toLocaleString()}원을 보냈습니다.`);
      setPoint(prev => prev - sendAmount);
      setAmount("");
      setTargetName("");
      setSearchResults([]); 

    } catch (e) {
      alert("송금 실패: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ background: '#2c3e50', minHeight: '100vh', padding: '20px', color: 'white' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#f1c40f' }}>💸 포인트 송금</h1>
        <p style={{ color: '#bdc3c7' }}>친구에게 포인트를 선물하세요.</p>
        
        <div className="card" style={{ display:'inline-block', background:'#34495e', padding:'10px 25px', marginTop:'15px', borderRadius:'10px' }}>
           내 잔액: <span style={{ color:'#f1c40f', fontWeight:'bold', fontSize:'20px' }}>{Math.floor(point).toLocaleString()}원</span>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '500px', margin: '0 auto', background: '#34495e', padding: '30px', position:'relative' }}>
        
        {/* 받는 사람 검색 */}
        <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>받는 사람 검색</label>
            <div style={{ display: 'flex', gap: '5px' }}>
                <input 
                    className="input" 
                    style={{ flex: 1, textAlign: 'left' }} 
                    placeholder="닉네임 앞글자 입력"
                    value={targetName}
                    onChange={(e) => setTargetName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                />
                <button 
                    className="btn" 
                    style={{ background: '#3498db', padding: '10px 15px' }}
                    onClick={handleSearchUser}
                    disabled={isSearching}
                >
                    🔍 {isSearching ? "..." : "검색"}
                </button>
            </div>

            {/* 검색 결과 리스트 */}
            {searchResults.length > 0 && (
                <div style={{ 
                    marginTop: '5px', background: '#2c3e50', borderRadius: '5px', 
                    border: '1px solid #7f8c8d', overflow: 'hidden',
                    position: 'absolute', width: '88%', zIndex: 10
                }}>
                    {searchResults.map((u) => (
                        <div 
                            key={u.id}
                            onClick={() => selectUser(u.name)}
                            style={{ 
                                padding: '10px', borderBottom: '1px solid #444', 
                                cursor: 'pointer', display: 'flex', justifyContent: 'space-between'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#34495e'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <span style={{fontWeight:'bold', color:'#fff'}}>{u.name}</span>
                            <span style={{fontSize:'12px', color:'#2ecc71'}}>선택</span>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* 금액 입력 */}
        <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#cccccc' }}>보낼 금액</label>
            <input 
                className="input" 
                type="number"
                style={{ width: '100%', textAlign: 'left', fontSize: '24px', fontWeight: 'bold', color: '#f1c40f' }} 
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                <button className="btn" style={{flex:1, padding:'5px', fontSize:'12px'}} onClick={() => setAmount(curr => String((parseInt(curr)||0) + 10000))}>+1만</button>
                <button className="btn" style={{flex:1, padding:'5px', fontSize:'12px'}} onClick={() => setAmount(curr => String((parseInt(curr)||0) + 100000))}>+10만</button>
                <button className="btn" style={{flex:1, padding:'5px', fontSize:'12px'}} onClick={() => setAmount(curr => String((parseInt(curr)||0) + 1000000))}>+100만</button>
                <button className="btn" style={{flex:1, padding:'5px', fontSize:'12px', background:'#e67e22'}} onClick={() => setAmount(String(Math.floor(point)))}>전액</button>
            </div>
        </div>

        <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '15px', fontSize: '18px' }} 
            onClick={handleTransfer}
            disabled={loading}
        >
            {loading ? "송금 진행 중..." : "보내기 🚀"}
        </button>

      </div>

      <button className="btn" style={{ marginTop: 30, background: 'transparent', border:'1px solid #555', color:'#888', width: '100%' }} onClick={() => navigate('/home')}>
        &larr; 홈으로 돌아가기
      </button>

    </div>
  );
}