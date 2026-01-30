import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

export default function History() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = auth.currentUser;
  const { t, lang } = useLanguage();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchHistory();
  }, [user, navigate]);

  const fetchHistory = async () => {
    try {
      const q = query(
        collection(db, "history"),
        where("uid", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(30) // DB 절약을 위해 30개로 제한
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(data);
    } catch (e) {
      console.error("Load Error:", e);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 [핵심 로직] 게임 시작/보상 로그 합치기
  const processedLogs = useMemo(() => {
    const result = [];
    
    // 로그가 최신순(내림차순)으로 정렬되어 있다고 가정 [보상(최신), 시작(과거)]
    for (let i = 0; i < logs.length; i++) {
      const current = logs[i];
      const prevResult = result.length > 0 ? result[result.length - 1] : null;

      // 1. 현재 로그가 '게임 시작' 인지 확인
      const isGameStart = current.type === '게임' && current.msg.includes('시작');
      
      // 2. 방금 결과 리스트에 넣은게 '같은 게임의 보상' 인지 확인
      if (isGameStart && prevResult && prevResult.type === '게임' && prevResult.msg.includes('보상')) {
          // 게임 이름 추출 (이모지 제거 후 비교)
          const currName = current.msg.replace(/[^가-힣a-zA-Z0-9\s]/g, "").replace("시작", "").trim();
          const prevName = prevResult.msg.replace(/[^가-힣a-zA-Z0-9\s]/g, "").replace("보상", "").trim();

          // 이름이 같으면 합친다!
          if (currName === prevName) {
              prevResult.isMerged = true; 
              prevResult.betAmount = current.amount; // 베팅액 (음수)
              prevResult.winAmount = prevResult.amount; // 당첨금 (양수)
              prevResult.amount = prevResult.amount + current.amount; // 최종 순수익
              
              // ⭐ [수정] "결과" 텍스트 번역 적용
              prevResult.displayMsg = `${currName} ${t.h_result || "결과"}`; 
              continue; 
          }
      }

      result.push({ 
          ...current, 
          displayMsg: current.msg,
          isMerged: false 
      });
    }

    return result;
  }, [logs, t]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate();
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const getTypeColor = (type) => {
    if (type === '가챠') return '#e1b12c';
    if (type === '송금' || type === '입금') return '#00cec9';
    if (type === '게임') return '#6c5ce7';
    if (type === '공격' || type === '피격') return '#e74c3c';
    return '#b2bec3';
  };

  const translateType = (type) => {
      if (lang === 'ko') return type;
      if (type === '가챠') return t.log_gacha;
      if (type === '송금') return t.log_transfer;
      if (type === '입금') return t.log_deposit;
      if (type === '게임') return t.log_game;
      if (type === '공격') return t.log_attack;
      if (type === '피격') return t.log_hit;
      if (type === '저격') return t.log_sniper;
      return type;
  };

  const translateMsg = (msg) => {
      if (lang === 'ko') return msg;
      if (msg.includes("시작")) return msg.replace("시작", "Start");
      if (msg.includes("보상")) return msg.replace("보상", "Reward");
      if (msg.includes("결과")) return msg.replace("결과", "Result");
      if (msg.includes("승리")) return msg.replace("승리", "Win");
      if (msg.includes("패배")) return msg.replace("패배", "Lose");
      return msg; 
  };

  return (
    <div className="container" style={{ background: '#2c3e50', minHeight: '100vh', padding: '20px', color: 'white' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 30, color: '#f1c40f' }}>{t.history}</h2>

      {loading ? (
        <div style={{ textAlign: 'center' }}>{t.loading}</div>
      ) : processedLogs.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#aaa', marginTop: 50 }}>{t.log_no_data}</div>
      ) : (
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {processedLogs.map((log) => (
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
                    {translateType(log.type)}
                  </span>
                  <span style={{ fontSize: '12px', color: '#bbb' }}>{formatDate(log.createdAt)}</span>
                </div>
                
                <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{translateMsg(log.displayMsg)}</div>
                
                {/* ⭐ [수정] 합쳐진 로그 상세 내역 번역 적용 (Bet/Win -> t.h_bet/t.h_gain) */}
                {log.isMerged && (
                    <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>
                        ({t.h_bet}: <span style={{color:'#aaa'}}>{log.betAmount.toLocaleString()}</span> / 
                         {t.h_gain}: <span style={{color: log.winAmount > 0 ? '#e74c3c' : '#aaa'}}>+{log.winAmount.toLocaleString()}</span>)
                    </div>
                )}
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
        {t.home}
      </button>
    </div>
  );
}