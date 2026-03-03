// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';

// const ApiGame = () => {
//   const navigate = useNavigate();
  
//   // 상태 관리: pokepath, pokerogue (쇼다운 제거)
//   const [selectedGame, setSelectedGame] = useState('pokepath');

//   // 외부 게임 실행 함수 (새 탭 열기)
//   const openExternalGame = (url) => {
//     window.open(url, '_blank', 'noopener,noreferrer');
//   };

//   const games = {
//     pokepath: {
//       title: "PokéPath",
//       emoji: "🐲",
//       desc: "포켓몬 길찾기 퍼즐 어드벤처! 최적의 경로를 찾아 포켓몬을 인도하세요.",
//       url: "https://khydra98.itch.io/pokepath",
//       color: "#FFCC00",
//       textColor: "#3B4CCA",
//       tags: ["Puzzle", "Indie", "Adventure"]
//     },
//     pokerogue: {
//       title: "Pokérogue",
//       emoji: "🌵",
//       desc: "끝없이 도전하는 로그라이크 배틀! 나만의 팀을 구성하고 정상을 향해 나아가세요.",
//       url: "https://pokerogue.net/",
//       color: "#ef5350",
//       textColor: "#ffffff",
//       tags: ["Roguelike", "Battle", "Hardcore"]
//     }
//   };

//   const currentGame = games[selectedGame];

//   return (
//     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100vw', height: '100vh', padding: '20px', boxSizing: 'border-box', backgroundColor: '#2c3e50' }}>
      
//       {/* 헤더 영역 */}
//       <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
//         <h2 style={{ margin: 0, color: 'white' }}>🕹️ 오오아타리 포켓몬 센터</h2>
//         <button 
//           onClick={() => navigate(-1)} 
//           style={{ padding: '8px 20px', cursor: 'pointer', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}
//         >
//           나가기
//         </button>
//       </div>

//       {/* 게임 선택 탭 */}
//       <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', width: '100%', maxWidth: '1000px', justifyContent: 'center' }}>
//         <button onClick={() => setSelectedGame('pokepath')} style={btnStyle(selectedGame === 'pokepath', games.pokepath.color, games.pokepath.textColor)}>🐾 PokéPath</button>
//         <button onClick={() => setSelectedGame('pokerogue')} style={btnStyle(selectedGame === 'pokerogue', games.pokerogue.color, games.pokerogue.textColor)}>🏹 Pokérogue</button>
//       </div>

//       {/* 런처 카드 영역 (내 사이트와 연결된 느낌의 UI) */}
//       <div style={{ 
//           width: '100%', 
//           maxWidth: '800px', 
//           background: '#34495e',
//           borderRadius: '20px', 
//           overflow: 'hidden', 
//           boxShadow: '0 15px 35px rgba(0,0,0,0.4)', 
//           border: `2px solid ${currentGame.color}`,
//           transition: 'all 0.3s ease'
//       }}>
//         <div style={{ padding: '40px', textAlign: 'center' }}>
//           <div style={{ fontSize: '80px', marginBottom: '20px', filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.3))' }}>
//             {currentGame.emoji}
//           </div>
          
//           <h1 style={{ fontSize: '36px', color: 'white', margin: '0 0 15px 0', fontWeight: '900' }}>{currentGame.title}</h1>
          
//           <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
//             {currentGame.tags.map(tag => (
//               <span key={tag} style={{ background: 'rgba(0,0,0,0.3)', color: currentGame.color, padding: '4px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' }}>#{tag}</span>
//             ))}
//           </div>

//           <p style={{ color: '#bdc3c7', fontSize: '16px', lineHeight: '1.6', marginBottom: '40px', maxWidth: '500px', margin: '0 auto 40px auto' }}>
//             {currentGame.desc}
//           </p>

//           <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', marginBottom: '40px' }}>
//             <p style={{ color: '#aaa', fontSize: '13px', margin: 0 }}>
//               🛡️ 안전한 플레이를 위해 공식 서버로 연결됩니다.<br/>
//               **세이브 데이터 보호를 위해 로그인을 권장합니다.**
//             </p>
//           </div>

//           <button 
//             onClick={() => openExternalGame(currentGame.url)}
//             style={{ 
//               padding: '20px 60px', 
//               fontSize: '20px', 
//               backgroundColor: currentGame.color, 
//               color: currentGame.textColor, 
//               border: 'none', 
//               borderRadius: '50px', 
//               fontWeight: '900', 
//               cursor: 'pointer',
//               boxShadow: `0 8px 25px ${currentGame.color}66`,
//               transition: 'transform 0.2s'
//             }}
//             onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
//             onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
//           >
//             게임 시작하기 →
//           </button>
//         </div>
        
//         {/* 하단 바 (내 사이트 소속임을 강조) */}
//         <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
//             <span style={{ color: '#7f8c8d', fontSize: '12px', fontWeight: 'bold' }}>POWERED BY OOATARI ARCADE SERVICE</span>
//         </div>
//       </div>

//     </div>
//   );
// };

// // --- 스타일 설정 ---
// const btnStyle = (active, bg, color) => ({
//   padding: '12px 25px', 
//   cursor: 'pointer', 
//   border: 'none', 
//   borderRadius: '12px',
//   backgroundColor: active ? bg : '#1e272e', 
//   color: active ? color : '#7f8c8d', 
//   fontWeight: 'bold',
//   boxShadow: active ? `0 0 20px ${bg}44` : 'none', 
//   transition: 'all 0.3s ease',
//   fontSize: '15px'
// });

// export default ApiGame;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ApiGame = () => {
  const navigate = useNavigate();
  
  // 기본 선택 게임: 포켓로그
  const [selectedGame, setSelectedGame] = useState('pokerogue');

  const openExternalGame = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const games = {
    pokerogue: {
      title: "Pokérogue",
      emoji: "🌵",
      desc: "요즘 대세! 포켓몬 로그라이크 배틀. 매번 바뀌는 전략으로 정상을 향해 도전하세요.",
      url: "https://pokerogue.net/",
      color: "#ef5350",
      textColor: "#ffffff",
      tags: ["Roguelike", "Pokemon", "Hardcore"]
    },
    lolbeans: {
      title: "Lolbeans.io",
      emoji: "🫘",
      desc: "웹판 폴가이즈! 귀여운 콩이 되어 장애물을 통과하고 최후의 1인이 되어보세요.",
      url: "https://lolbeans.io/",
      color: "#a55eea",
      textColor: "#ffffff",
      tags: ["Parkour", "Fall Guys", "Funny"]
    },
    bonk: {
      title: "Bonk.io",
      emoji: "🏐",
      desc: "공이 되어 친구들을 밀어내세요! 단순하지만 우정 파괴하기 딱 좋은 물리 엔진 게임.",
      url: "https://bonk.io/",
      color: "#2bcbba",
      textColor: "#ffffff",
      tags: ["Physics", "Survival", "Arena"]
    },
    gartic: {
      title: "Gartic Phone",
      emoji: "☎️",
      desc: "낙서로 소통하는 릴레이 대화 게임! 친구들과 디스코드하면서 하면 재미 200%.",
      url: "https://garticphone.com/ko",
      color: "#34ace0",
      textColor: "#ffffff",
      tags: ["Social", "Drawing", "Party"]
    },
    pokepath: {
      title: "PokéPath",
      emoji: "🐲",
      desc: "포켓몬 길찾기 퍼즐 어드벤처! 최적의 경로를 찾아 포켓몬을 안전하게 인도하세요.",
      url: "https://khydra98.itch.io/pokepath",
      color: "#FFCC00",
      textColor: "#3B4CCA",
      tags: ["Puzzle", "Indie", "Casual"]
    }
  };

  const currentGame = games[selectedGame];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100vw', height: '100vh', padding: '20px', boxSizing: 'border-box', backgroundColor: '#2c3e50', overflowY: 'auto' }}>
      
      {/* 헤더 영역 */}
      <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: 'white' }}>🕹️ 오오아타리 멀티 오락실</h2>
        <button onClick={() => navigate(-1)} style={{ padding: '8px 20px', cursor: 'pointer', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}>나가기</button>
      </div>

      {/* 게임 선택 탭 */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', width: '100%', maxWidth: '1000px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {Object.keys(games).map((key) => (
          <button 
            key={key} 
            onClick={() => setSelectedGame(key)} 
            style={btnStyle(selectedGame === key, games[key].color, games[key].textColor)}
          >
            {games[key].emoji} {games[key].title}
          </button>
        ))}
      </div>

      {/* 런처 카드 영역 */}
      <div style={{ 
          width: '100%', maxWidth: '800px', background: '#34495e',
          borderRadius: '20px', overflow: 'hidden', 
          boxShadow: '0 15px 45px rgba(0,0,0,0.5)', border: `2px solid ${currentGame.color}`,
          transition: 'all 0.3s ease', marginBottom: '40px'
      }}>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '80px', marginBottom: '20px', filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.3))' }}>{currentGame.emoji}</div>
          <h1 style={{ fontSize: '36px', color: 'white', margin: '0 0 15px 0', fontWeight: '900' }}>{currentGame.title}</h1>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {currentGame.tags.map(tag => (
              <span key={tag} style={{ background: 'rgba(0,0,0,0.3)', color: currentGame.color, padding: '4px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' }}>#{tag}</span>
            ))}
          </div>

          <p style={{ color: '#bdc3c7', fontSize: '16px', lineHeight: '1.6', marginBottom: '40px', maxWidth: '500px', margin: '0 auto 40px auto' }}>{currentGame.desc}</p>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', marginBottom: '40px' }}>
            <p style={{ color: '#aaa', fontSize: '13px', margin: 0 }}>
              🛡️ 본 게임은 외부 공식 서버로 연결됩니다.<br/>
              **세이브 데이터 보호를 위해 로그인을 권장합니다.**
            </p>
          </div>

          <button 
            onClick={() => openExternalGame(currentGame.url)}
            style={{ 
              padding: '20px 60px', fontSize: '22px', backgroundColor: currentGame.color, color: currentGame.textColor, 
              border: 'none', borderRadius: '50px', fontWeight: '900', cursor: 'pointer',
              boxShadow: `0 8px 25px ${currentGame.color}66`, transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            플레이 하기 →
          </button>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', textAlign: 'center' }}>
            <span style={{ color: '#7f8c8d', fontSize: '12px', fontWeight: 'bold' }}>OOATARI ARCADE HUB v2.1</span>
        </div>
      </div>
    </div>
  );
};

const btnStyle = (active, bg, color) => ({
  padding: '12px 20px', cursor: 'pointer', border: 'none', borderRadius: '12px',
  backgroundColor: active ? bg : '#1e272e', color: active ? color : '#7f8c8d', 
  fontWeight: 'bold', boxShadow: active ? `0 0 20px ${bg}44` : 'none', 
  transition: 'all 0.3s ease', fontSize: '14px', whiteSpace: 'nowrap'
});

export default ApiGame;