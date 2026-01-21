import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function History() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchHistory();
  }, [user, navigate]);

  const fetchHistory = async () => {
    try {
      // 'history' 컬렉션에서 내 uid를 찾고, 최신순(createdAt desc)으로 50개만 가져옴
      const q = query(
        collection(db, "history"),
        where("uid", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(50)
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(data);
    } catch (e) {
      console.error("기록 불러오기 실패:", e);
      // 인덱스 에러가 날 경우 콘솔에 링크가 뜹니다. 그 링크를 클릭해서 인덱스를 만들어줘야 합니다.
    } finally {
      setLoading(false);
    }
  };

  // 날짜 포맷 함수
  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate();
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // 타입별 뱃지 색상
  const getTypeColor = (type) => {
    if (type === '가챠') return '#e1b12c';
    if (type === '송금') return '#00cec9';
    if (type === '게임') return '#6c5ce7';
    return '#b2bec3';
  };

  return (
    <div className="container" style={{ background: '#2c3e50', minHeight: '100vh', padding: '20px', color: 'white' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 30, color: '#f1c40f' }}>📜 자산 변동 기록</h2>

      {loading ? (
        <div style={{ textAlign: 'center' }}>로딩 중...</div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#aaa', marginTop: 50 }}>기록이 없습니다.</div>
      ) : (
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {logs.map((log) => (
            <div key={log.id} style={{ 
              background: '#34495e', padding: '15px', borderRadius: '10px', 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderLeft: `5px solid ${getTypeColor(log.type)}`
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <span style={{ 
                    background: getTypeColor(log.type), color: '#000', 
                    fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' 
                  }}>
                    {log.type}
                  </span>
                  <span style={{ fontSize: '12px', color: '#bbb' }}>{formatDate(log.createdAt)}</span>
                </div>
                <div style={{ fontSize: '15px' }}>{log.msg}</div>
              </div>

              <div style={{ 
                fontSize: '18px', fontWeight: 'bold', 
                color: log.amount > 0 ? '#e74c3c' : (log.amount < 0 ? '#3498db' : '#fff') 
              }}>
                {log.amount > 0 ? '+' : ''}{log.amount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="btn" style={{ marginTop: 30, width: '100%', background: '#444' }} onClick={() => navigate('/home')}>
        홈으로
      </button>
    </div>
  );
}