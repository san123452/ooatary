// src/pages/Layout.jsx (위치는 편한 곳에)
import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header'; // 아까 만드신 헤더 불러오기
import { auth, db } from '../firebase'; // 경로 맞춰주세요
import { doc, onSnapshot } from 'firebase/firestore';

const Layout = () => {
  const [point, setPoint] = useState(0);
  const user = auth.currentUser;

  // 헤더에 띄울 포인트 실시간 감지 (여기서 한 번만 하면 모든 페이지 적용!)
  useEffect(() => {
    if (user) {
      const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
        if (doc.exists()) setPoint(doc.data().point || 0);
      });
      return () => unsub();
    }
  }, [user]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* 1. 상단에 헤더 고정 */}
      <Header point={point} />

      {/* 2. 여기에 각 페이지 내용이 들어갑니다 (홈, 게임 등) */}
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;