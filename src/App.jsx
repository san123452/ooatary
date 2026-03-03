

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// 👇 언어팩 Provider
import { LanguageProvider } from './LanguageContext';

// ✅ 포지션 Provider 추가
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
import Game from './pages/Game';             // 홀짝
import AppleGameSingle from './pages/AppleGameSingle'; // 사과 (싱글)
import Slot from './pages/Slot';             // 슬롯
import RPS from './pages/RPS';               // 가위바위보
import Mining from './pages/Mining';         // 가챠 (광질)
import Blackjack from './pages/Blackjack';   // 블랙잭
import Fight from './pages/Fight';           // 격투기
import Roulette from './pages/Roulette';     // 천사악마 룰렛
import HorseRacing from "./pages/HorseRacing"; // 경마
import Ladder from "./pages/Ladder";         // 다리다리
// import Mines from "./pages/Mines";           // 지뢰찾기
import Crash from "./pages/Crash";           // 그래프
import HighLow from "./pages/HighLow";       // 하이로우
import Roulette2 from "./pages/Roulette2";   // 유러피언 룰렛
import Ostrich from "./pages/Ostrich";       // 타조
import Transfer from './pages/Transfer';     // 송금
import GameLobby from './pages/GameLobby';   // 멀티 로비
import GameRoom from './pages/GameRoom';     // 멀티 방
import History from './pages/History';       // 기록
import CoinPusherGame from './pages/CoinPusherGame'; // 3D 코인푸셔
import StackGame from './pages/StackGame'; // 👈 새로 추가
import Report from './pages/Report'; // 신고
import Game2048 from './pages/Game2048'; // 2048 게임
import GameSuika from './pages/GameSuika';
import GameTetris from './pages/GameTetris';
import TftSearch from './pages/TftSearch';// 롤체지지
import SanwaMoney from './pages/SanwaMoney';
import BitcoinGame from './components/games/BitcoinGame';
import ApiGame from './pages/ApiGame'; // 👈 [추가됨] 미니 오락실 컴포넌트 임포트
import { PositionProvider } from './components/PositionContext';


// 게시판
import Board from './pages/Board';           // 게시판 목록
import BoardWrite from './pages/BoardWrite'; // 게시판 글쓰기
import BoardDetail from './pages/BoardDetail'; // 게시판 상세
import Mailbox from './pages/Mailbox';

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
  const [isPending, setIsPending] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // 1. 중복 탭 방지
  useEffect(() => {
    const channel = new BroadcastChannel('tab_channel');
    channel.postMessage('new_tab_opened');
    channel.onmessage = (event) => {
      if (event.data === 'new_tab_opened') channel.postMessage('tab_exists');
      if (event.data === 'tab_exists') setIsDuplicate(true);
    };
    return () => channel.close();
  }, []);

  // 2. 유저 상태 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setIsBanned(false);
        setIsPending(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 3. DB 상태 감지 (밴, 승인대기, 점검)
  useEffect(() => {
    let unsubUser = () => { };
    if (currentUser) {
      unsubUser = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.isBanned === true) setIsBanned(true);
          else setIsBanned(false);

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

  // 4. 버전 체크
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

  // 차단 화면 렌더링
  if (isDuplicate) return <ErrorScreen title="🚫 경고" msg="사이트를 여러 창에 띄울 수 없습니다." />;
  if (isBanned) return <ErrorScreen title="🚫 접속 차단됨" msg="관리자에 의해 정지되었습니다." btn={true} />;
  if (isPending) {
    return (
      <div style={{ height: '100vh', background: '#2c3e50', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', textAlign: 'center', zIndex: 9999 }}>
        <h1 style={{ fontSize: '3rem' }}>⏳ 승인 대기 중</h1>
        <h3>회원가입이 완료되었으나,<br />관리자의 승인이 필요합니다.</h3>
        <p>승인 완료 후 이용 가능합니다.</p>
        <button onClick={() => { signOut(auth); window.location.reload(); }} style={{ padding: '10px 20px', marginTop: 20, cursor: 'pointer', fontSize: '16px', borderRadius: '5px' }}>로그아웃</button>
      </div>
    );
  }
  if (isMaintenance) {
    return (
      <div style={{ height: '100vh', background: '#f39c12', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem' }}>🚧</h1>
        <h1 style={{ fontSize: '3rem', margin: 0 }}>서버 점검 중</h1>
        <h3>현재 서비스 안정화를 위해 점검을 진행하고 있습니다.</h3>
        <p>잠시 후 다시 접속해주세요.</p>
        <button onClick={() => window.location.href = '/login'} style={{ marginTop: 50, background: 'transparent', border: 'none', color: '#f39c12' }}>admin login</button>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <PositionProvider> {/* ✅ 추가된 부분 */}
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/find" element={<FindAccount />} />

          {/* 👇 여기가 중요합니다! 경로와 컴포넌트가 정확히 맞는지 확인하세요 */}
          <Route element={<AuthGuard><Layout /></AuthGuard>}>
            <Route path="/home" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/history" element={<History />} />
            <Route path="/transfer" element={<Transfer />} />
            <Route path="/mailbox" element={<Mailbox />} />
            <Route path="/report" element={<Report />} />
            {/* 게시판 경로 */}
            <Route path="/board" element={<Board />} />           {/* 목록 */}
            <Route path="/board/write" element={<BoardWrite />} /> {/* 글쓰기 */}
            <Route path="/board/:id" element={<BoardDetail />} /> {/* 상세 */}

            {/* 게임 경로 */}
            <Route path="/game" element={<Game />} />             {/* 홀짝 */}
            <Route path="/slot" element={<Slot />} />             {/* 슬롯 */}
            <Route path="/apple-single" element={<AppleGameSingle />} /> {/* 사과 */}
            <Route path="/rps" element={<RPS />} />               {/* 가위바위보 */}
            <Route path="/mining" element={<Mining />} />         {/* 가챠 */}
            <Route path="/blackjack" element={<Blackjack />} />   {/* 블랙잭 */}
            <Route path="/fight" element={<Fight />} />           {/* 격투기 */}
            <Route path="/roulette" element={<Roulette />} />     {/* 천사악마 */}
            <Route path="/horseracing" element={<HorseRacing />} /> {/* 경마 */}
            <Route path="/ladder" element={<Ladder />} />         {/* 다리다리 */}
          {/*   <Route path="/mines" element={<Mines />} />           지뢰찾기 */}
            <Route path="/crash" element={<Crash />} />           {/* 그래프 */}
            <Route path="/highlow" element={<HighLow />} />       {/* 하이로우 */}
            <Route path="/roulette2" element={<Roulette2 />} />   {/* 유러피언 */}
            <Route path="/ostrich" element={<Ostrich />} />       {/* 타조 */}
            <Route path="/coinpusher" element={<CoinPusherGame />} />
            <Route path="/game2048" element={<Game2048 />} />
            <Route path="/stack" element={<StackGame />} />
            <Route path="/suika" element={<GameSuika />} />
            <Route path="/tetris" element={<GameTetris />} />
            <Route path="/tft" element={<TftSearch />} />
            <Route path="/loan" element={<SanwaMoney />} />
            <Route path="/bitcoin" element={<BitcoinGame />} />
            <Route path="/api-game" element={<ApiGame />} /> {/* 👈 [추가됨] 미니 오락실 게임 */}

            {/* 멀티플레이 */}
            <Route path="/gamelobby" element={<GameLobby />} />
            <Route path="/gameroom/:roomId" element={<GameRoom />} />
          </Route>

          <Route element={<AdminGuard><Layout /></AdminGuard>}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Routes>
      </PositionProvider> {/* ✅ 추가된 부분 */}
    </LanguageProvider>
  );
}

function ErrorScreen({ title, msg, btn }) {
  return (
    <div style={{ height: '100vh', background: '#2c3e50', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', textAlign: 'center' }}>
      <h1 style={{ fontSize: '3rem' }}>{title}</h1>
      <h3>{msg}</h3>
      {btn && <button onClick={() => { signOut(auth); window.location.reload(); }} style={{ padding: '10px 20px', marginTop: 20, color: 'black', cursor: 'pointer' }}>로그아웃</button>}
    </div>
  );
}

export default App;
