import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore'; 

// 레이아웃
import Layout from './pages/Layout';

// 페이지들
import Login from './pages/Login';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Shop from './pages/Shop';
import SignUp from './pages/SignUp';
import FindAccount from './pages/FindAccount';

// 게임들
import Game from './pages/Game';
import Slot from './pages/Slot';
import RPS from './pages/RPS';
import Mining from './pages/Mining';
import Blackjack from './pages/Blackjack';
import Fight from './pages/Fight';
import Roulette from './pages/Roulette';
import HorseRacing from "./pages/HorseRacing";
import Ladder from "./pages/Ladder";
// ❌ 낚시 제거됨
import Mines from "./pages/Mines";
import Crash from "./pages/Crash";
import HighLow from "./pages/HighLow";
import Roulette2 from "./pages/Roulette2";
import Ostrich from "./pages/Ostrich";
import Transfer from './pages/Transfer';
import GameLobby from './pages/GameLobby';
import GameRoom from './pages/GameRoom';
import History from './pages/History';

// 게시판
import Board from './pages/Board';
import BoardWrite from './pages/BoardWrite';
import BoardDetail from './pages/BoardDetail';

const ADMIN_EMAIL = "kks3172@naver.com"; 

// 🛡️ [일반 유저 문지기]
function AuthGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div style={{ background: 'black', height: '100vh', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><h1>로딩 중... ⏳</h1></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// 👑 [관리자 전용 문지기]
function AdminGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div style={{ background: 'black', height: '100vh', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><h1>보안 검사 중... 👮‍♂️</h1></div>;

  if (!user) return <Navigate to="/login" replace />;
  if (user.email !== ADMIN_EMAIL) {
    alert("🚫 접근 권한이 없습니다! (관리자 전용)");
    return <Navigate to="/home" replace />;
  }

  return children;
}

function App() {
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [isPending, setIsPending] = useState(false); // ⏳ [추가됨] 승인 대기 상태
  const [isMaintenance, setIsMaintenance] = useState(false); 
  const [currentUser, setCurrentUser] = useState(null);

  // 1. 다중 탭 방지
  useEffect(() => {
    const channel = new BroadcastChannel('tab_channel');
    channel.postMessage('new_tab_opened');
    channel.onmessage = (event) => {
      if (event.data === 'new_tab_opened') channel.postMessage('tab_exists');
      if (event.data === 'tab_exists') setIsDuplicate(true);
    };
    return () => channel.close();
  }, []);

  // 2. 로그인 상태 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
          setIsBanned(false);
          setIsPending(false); // 로그아웃 시 대기 상태 해제
      }
    });
    return () => unsubscribe();
  }, []);

  // 3. 🚨 실시간 감시 (밴, 승인대기, 점검)
  useEffect(() => {
    let unsubUser = () => {};
    if (currentUser) {
        unsubUser = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // A. 밴 확인
                if (data.isBanned === true) setIsBanned(true);
                else setIsBanned(false);

                // B. 승인 대기 확인 (관리자는 제외)
                if (data.isApproved === false && currentUser.email !== ADMIN_EMAIL) {
                    setIsPending(true);
                } else {
                    setIsPending(false);
                }
            }
        });
    }

    const unsubServer = onSnapshot(doc(db, "system", "server"), (docSnap) => {
        if (docSnap.exists() && docSnap.data().isOpen === false) {
            if (currentUser?.email !== ADMIN_EMAIL) setIsMaintenance(true);
            else setIsMaintenance(false); 
        } else {
            setIsMaintenance(false); 
        }
    });

    return () => { unsubUser(); unsubServer(); };
  }, [currentUser]);

  // 4. 🔄 강제 새로고침 감지기
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "system", "info"), (docSnap) => {
      if (docSnap.exists()) {
        const serverVersion = docSnap.data().version;
        const localVersion = localStorage.getItem('app_version');

        if (localVersion && String(serverVersion) !== String(localVersion)) {
          console.log("새 버전 감지! 새로고침합니다.");
          localStorage.setItem('app_version', serverVersion);
          if ('caches' in window) {
             caches.keys().then((names) => {
                 names.forEach(name => caches.delete(name));
             });
          }
          window.location.reload(true);
        } else if (!localVersion) {
          localStorage.setItem('app_version', serverVersion);
        }
      }
    });
    return () => unsub();
  }, []);


  // 🛑 [차단 화면 1] 중복 탭
  if (isDuplicate) return <ErrorScreen title="🚫 경고" msg="사이트를 여러 창에 띄울 수 없습니다." />;
  
  // 🛑 [차단 2] 밴 유저
  if (isBanned) return <ErrorScreen title="🚫 접속 차단됨" msg="관리자에 의해 정지되었습니다." btn={true} />;

  // 🛑 [차단 3] ⏳ 승인 대기 유저 (이게 추가됨!)
  if (isPending) {
      return (
        <div style={{ height: '100vh', background: '#2c3e50', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', textAlign: 'center', zIndex: 9999 }}>
            <h1 style={{fontSize: '3rem'}}>⏳ 승인 대기 중</h1>
            <h3>회원가입이 완료되었으나,<br/>관리자의 승인이 필요합니다.</h3>
            <p>승인 완료 후 이용 가능합니다.</p>
            <button 
                onClick={() => { signOut(auth); window.location.reload(); }} 
                style={{padding: '10px 20px', marginTop: 20, cursor:'pointer', fontSize: '16px', borderRadius: '5px'}}
            >
                로그아웃
            </button>
        </div>
      );
  }

  // 🛑 [차단 4] 서버 점검
  if (isMaintenance) {
      return (
        <div style={{ height: '100vh', background: '#f39c12', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', textAlign: 'center' }}>
            <h1 style={{fontSize: '4rem'}}>🚧</h1>
            <h1 style={{fontSize: '3rem', margin:0}}>서버 점검 중</h1>
            <h3>현재 서비스 안정화를 위해 점검을 진행하고 있습니다.</h3>
            <p>잠시 후 다시 접속해주세요.</p>
            <button onClick={() => window.location.href='/login'} style={{marginTop:50, background:'transparent', border:'none', color:'#f39c12'}}>admin login</button>
        </div>
      );
  }

  // ✅ 정상 앱
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/find" element={<FindAccount />} />

      <Route element={<AuthGuard><Layout /></AuthGuard>}>
        <Route path="/home" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/history" element={<History />} />
        <Route path="/board" element={<Board />} />
        <Route path="/board/write" element={<BoardWrite />} />
        <Route path="/board/:id" element={<BoardDetail />} />
        <Route path="/game" element={<Game />} />
        <Route path="/slot" element={<Slot />} />
        <Route path="/rps" element={<RPS />} />
        <Route path="/mining" element={<Mining />} />
        <Route path="/blackjack" element={<Blackjack />} />
        <Route path="/fight" element={<Fight />} />
        <Route path="/roulette" element={<Roulette />} />
        <Route path="/horseracing" element={<HorseRacing />} />
        <Route path="/ladder" element={<Ladder />} />
        {/* ❌ 낚시 라우트 제거됨 */}
        <Route path="/mines" element={<Mines />} />
        <Route path="/crash" element={<Crash />} />
        <Route path="/highlow" element={<HighLow />} />
        <Route path="/roulette2" element={<Roulette2 />} />
        <Route path="/ostrich" element={<Ostrich />} />
        <Route path="/transfer" element={<Transfer />} />
        <Route path="/gamelobby" element={<GameLobby />} />
        <Route path="/gameroom/:roomId" element={<GameRoom />} />
      </Route>

      <Route element={<AdminGuard><Layout /></AdminGuard>}>
        <Route path="/admin" element={<Admin />} />
      </Route>
    </Routes>
  );
}

function ErrorScreen({ title, msg, btn }) {
    return (
        <div style={{ height: '100vh', background: '#2c3e50', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', textAlign: 'center' }}>
            <h1 style={{fontSize: '3rem'}}>{title}</h1>
            <h3>{msg}</h3>
            {btn && <button onClick={() => { signOut(auth); window.location.reload(); }} style={{padding:'10px 20px', marginTop:20, color:'black', cursor:'pointer'}}>로그아웃</button>}
        </div>
    );
}

export default App;