import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const PositionContext = createContext();

export function PositionProvider({ children }) {
  // ✅ localStorage에서 초기값 로드
  const [allPositions, setAllPositions] = useState(() => {
    try {
      const cached = localStorage.getItem('btc_positions');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [lastFetch, setLastFetch] = useState(() => {
    try {
      const cached = localStorage.getItem('btc_positions_time');
      return cached ? parseInt(cached) : 0;
    } catch {
      return 0;
    }
  });

  // ✅ 앱 실행 시 단 1번만 리스너 연결 (평생 유지)
  useEffect(() => {
    const q = query(
      collection(db, "bitcoin_positions"),
      orderBy("startTime", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({
        uid: d.id,
        ...d.data()
      }));
      
      setAllPositions(list);
      const now = Date.now();
      setLastFetch(now);
      
      // ✅ localStorage에 저장 (껐다 켜도 유지)
      try {
        localStorage.setItem('btc_positions', JSON.stringify(list));
        localStorage.setItem('btc_positions_time', now.toString());
      } catch (e) {
        console.error('localStorage 저장 실패:', e);
      }
    }, (error) => {
      console.error("포지션 실시간 조회 실패:", error);
    });

    // ✅ 앱 종료 시에만 리스너 해제 (페이지 이동으론 해제 안 됨)
    return () => unsubscribe();
  }, []); // ← 빈 배열이므로 앱 실행 시 단 1번만

  return (
    <PositionContext.Provider value={{ allPositions, lastFetch }}>
      {children}
    </PositionContext.Provider>
  );
}

export const usePositions = () => {
  const context = useContext(PositionContext);
  if (!context) {
    throw new Error('usePositions must be used within PositionProvider');
  }
  return context;
};