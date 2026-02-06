
// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { db, auth } from '../firebase.js'; 
// import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp, getDoc, doc, updateDoc, increment } from 'firebase/firestore'; 
// import { useNavigate } from 'react-router-dom';
// import { useLanguage } from '../LanguageContext';

// // 🎨 타일 디자인 (폰트 크기 조정 및 그림자 추가)
// const TILE_COLORS = {
//   0: { bg: 'rgba(238, 228, 218, 0.35)', color: 'transparent', size: '0px' }, // 빈칸
//   2: { bg: '#eee4da', color: '#776e65', size: '35px' },
//   4: { bg: '#ede0c8', color: '#776e65', size: '35px' },
//   8: { bg: '#f2b179', color: '#f9f6f2', size: '35px' },
//   16: { bg: '#f59563', color: '#f9f6f2', size: '30px' },
//   32: { bg: '#f67c5f', color: '#f9f6f2', size: '30px' },
//   64: { bg: '#f65e3b', color: '#f9f6f2', size: '30px' },
//   128: { bg: '#edcf72', color: '#f9f6f2', size: '26px' }, 
//   256: { bg: '#edcc61', color: '#f9f6f2', size: '26px' }, 
//   512: { bg: '#edc850', color: '#f9f6f2', size: '26px' }, 
//   1024: { bg: '#edc53f', color: '#f9f6f2', size: '22px' }, 
//   2048: { bg: '#edc22e', color: '#f9f6f2', size: '22px' }, 
//   4096: { bg: '#3c3a32', color: '#f9f6f2', size: '22px' }, 
// };

// // 💰 배당률표 (수정됨)
// const PAYOUT_TABLE = {
//     128: 0.01,
//     256: 0.05,
//     512: 1.1,
//     1024: 1.5,
//     2048: 2.0,
//     4096: 5.0
// };

// const GRID_SIZE = 4;
// const BOARD_SIZE = 340; // PC 기준 기본 크기
// const GAP = 10;
// const CELL_SIZE = (BOARD_SIZE - (GAP * (GRID_SIZE + 1))) / GRID_SIZE; // 72.5px

// export default function Game2048() {
//   const navigate = useNavigate();
//   const user = auth.currentUser;
//   const { t } = useLanguage();

//   const [board, setBoard] = useState(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0)));
//   const [score, setScore] = useState(0);
//   const [maxTile, setMaxTile] = useState(0); 
//   const [gameState, setGameState] = useState('ready'); 
//   const [ranks, setRanks] = useState([]);

//   const [myPoint, setMyPoint] = useState(0);
//   const [betAmount, setBetAmount] = useState(1000); 
//   const [resultMessage, setResultMessage] = useState("");

//   const startX = useRef(null);
//   const startY = useRef(null);
//   const gameDataRef = useRef(null); 

//   useEffect(() => {
//     if (!user) { navigate('/login'); return; }
//     window.scrollTo({ top: 0, behavior: 'auto' });
//     fetchUserData();
//     fetchRanks();
//   }, [user, navigate]);

//   const fetchUserData = async () => {
//       if (user) {
//           try {
//               const userSnap = await getDoc(doc(db, "users", user.uid));
//               if (userSnap.exists()) {
//                   setMyPoint(userSnap.data().point || 0);
//               }
//           } catch (e) { console.error(e); }
//       }
//   };

//   // 🔥 랭킹 로직: 인당 최대 3개, 총 10개 표시
//   const fetchRanks = async () => {
//     try {
//       const q = query(collection(db, "game_2048_ranks"), orderBy("score", "desc"), limit(50));
//       const querySnapshot = await getDocs(q);
//       const rawList = querySnapshot.docs.map(doc => doc.data());

//       const filteredList = [];
//       const userCounts = {}; 

//       for (const item of rawList) {
//           const uid = item.uid;
//           if (!userCounts[uid]) userCounts[uid] = 0;
//           if (userCounts[uid] < 3) {
//               filteredList.push(item);
//               userCounts[uid]++;
//           }
//           if (filteredList.length >= 10) break;
//       }

//       setRanks(filteredList);
//     } catch (e) { console.error(e); }
//   };

//   const startGame = async () => {
//     if (betAmount <= 0 || betAmount > myPoint) return alert(t.alertNoMoney || "포인트 부족");
    
//     try {
//         gameDataRef.current = { betAmount, startTime: Date.now() };
        
//         await updateDoc(doc(db, "users", user.uid), { point: increment(-betAmount) });
//         setMyPoint(prev => prev - betAmount);

//         await addDoc(collection(db, "history"), {
//             uid: user.uid,
//             type: "게임",
//             msg: `🧩 2048 ${t.gameStart}`,
//             amount: -betAmount,
//             createdAt: serverTimestamp()
//         });

//         initGame();
//         setGameState('playing');
//         setResultMessage("");
//     } catch (e) {
//         alert("오류가 발생했습니다.");
//     }
//   };

//   const initGame = () => {
//     let newBoard = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
//     newBoard = addRandomTile(addRandomTile(newBoard));
//     setBoard(newBoard);
//     setScore(0);
//     setMaxTile(0);
//   };

//   const addRandomTile = (currentBoard) => {
//     let emptyCells = [];
//     for(let r=0; r<GRID_SIZE; r++){
//         for(let c=0; c<GRID_SIZE; c++){
//             if(currentBoard[r][c] === 0) emptyCells.push({r, c});
//         }
//     }
//     if (emptyCells.length === 0) return currentBoard;

//     const {r, c} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
//     const newBoard = currentBoard.map(row => [...row]);
//     newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
//     return newBoard;
//   };

//   const endGame = async (finalBoard) => {
//     if (gameState !== 'playing') return;
//     setGameState('finished');

//     let currentMax = 0;
//     for(let r=0; r<GRID_SIZE; r++) {
//         for(let c=0; c<GRID_SIZE; c++) {
//             if(finalBoard[r][c] > currentMax) currentMax = finalBoard[r][c];
//         }
//     }

//     let multiplier = 0;
//     const milestones = Object.keys(PAYOUT_TABLE).map(Number).sort((a,b)=>b-a);
//     for (let milestone of milestones) {
//         if (currentMax >= milestone) {
//             multiplier = PAYOUT_TABLE[milestone];
//             break;
//         }
//     }

//     const earned = Math.floor(betAmount * multiplier);
//     let msg = "";

//     if (earned > 0) {
//         msg = `${t.g_2048_win} [${currentMax}] x${multiplier} (+${earned.toLocaleString()}P)`;
//         try {
//             await updateDoc(doc(db, "users", user.uid), { point: increment(earned) });
//             setMyPoint(prev => prev + earned);
//             await addDoc(collection(db, "history"), {
//                 uid: user.uid,
//                 type: "게임",
//                 msg: `🧩 2048 [${currentMax}] ${t.h_gain}`,
//                 amount: earned,
//                 createdAt: serverTimestamp()
//             });
//         } catch(e) { console.error(e); }
//     } else {
//         msg = `${t.g_2048_fail} (Max: ${currentMax})`;
//     }

//     setResultMessage(msg);

//     if (score > 0) {
//         try {
//             const userSnap = await getDoc(doc(db, "users", user.uid));
//             const userName = userSnap.data().name || "익명";
//             await addDoc(collection(db, "game_2048_ranks"), {
//                 uid: user.uid,
//                 name: userName,
//                 score: score,
//                 maxTile: currentMax,
//                 createdAt: serverTimestamp()
//             });
//             fetchRanks();
//         } catch(e) {}
//     }
//   };

//   const move = useCallback((direction) => {
//     if (gameState !== 'playing') return;

//     let newBoard = board.map(row => [...row]);
//     let moved = false;
//     let addedScore = 0;
//     let currentMax = maxTile;

//     const slideRow = (row) => {
//         let arr = row.filter(val => val);
//         let missing = GRID_SIZE - arr.length;
//         let zeros = Array(missing).fill(0);
//         return arr.concat(zeros);
//     };

//     const combineRow = (row) => {
//         for (let i = 0; i < GRID_SIZE - 1; i++) {
//             if (row[i] !== 0 && row[i] === row[i + 1]) {
//                 row[i] *= 2;
//                 row[i + 1] = 0;
//                 addedScore += row[i];
//                 if(row[i] > currentMax) currentMax = row[i];
//                 moved = true;
//             }
//         }
//         return row;
//     };

//     const rotateBoard = (b) => {
//         let rotated = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
//         for(let r=0; r<GRID_SIZE; r++){
//             for(let c=0; c<GRID_SIZE; c++){
//                 rotated[c][GRID_SIZE-1-r] = b[r][c];
//             }
//         }
//         return rotated;
//     };

//     let processBoard = [...newBoard];
//     if (direction === 'right') processBoard = rotateBoard(rotateBoard(processBoard));
//     else if (direction === 'up') processBoard = rotateBoard(rotateBoard(rotateBoard(processBoard)));
//     else if (direction === 'down') processBoard = rotateBoard(processBoard);

//     for(let i=0; i<GRID_SIZE; i++){
//         let originalRow = [...processBoard[i]];
//         let slid = slideRow(processBoard[i]);
//         let combined = combineRow(slid);
//         let final = slideRow(combined);
//         processBoard[i] = final;
//         if(JSON.stringify(originalRow) !== JSON.stringify(final)) moved = true;
//     }

//     if (direction === 'right') processBoard = rotateBoard(rotateBoard(processBoard));
//     else if (direction === 'up') processBoard = rotateBoard(processBoard);
//     else if (direction === 'down') processBoard = rotateBoard(rotateBoard(rotateBoard(processBoard)));

//     if (moved) {
//         const boardWithTile = addRandomTile(processBoard);
//         setBoard(boardWithTile);
//         setScore(prev => prev + addedScore);
//         setMaxTile(currentMax);

//         if (checkGameOver(boardWithTile)) {
//             endGame(boardWithTile);
//         }
//     }
//   }, [board, gameState, maxTile]);

//   const checkGameOver = (currentBoard) => {
//     for(let r=0; r<GRID_SIZE; r++) {
//         for(let c=0; c<GRID_SIZE; c++) {
//             if(currentBoard[r][c] === 0) return false;
//         }
//     }
//     for(let r=0; r<GRID_SIZE; r++) {
//         for(let c=0; c<GRID_SIZE; c++) {
//             if (c < GRID_SIZE - 1 && currentBoard[r][c] === currentBoard[r][c+1]) return false;
//             if (r < GRID_SIZE - 1 && currentBoard[r][c] === currentBoard[r+1][c]) return false;
//         }
//     }
//     return true;
//   };

//   useEffect(() => {
//     const handleKeyDown = (e) => {
//         if(gameState !== 'playing') return;
//         if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
//         if(e.key === 'ArrowUp') move('up');
//         else if(e.key === 'ArrowDown') move('down');
//         else if(e.key === 'ArrowLeft') move('left');
//         else if(e.key === 'ArrowRight') move('right');
//     };
//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [move, gameState]);

//   const handleTouchStart = (e) => {
//     startX.current = e.touches[0].clientX;
//     startY.current = e.touches[0].clientY;
//   };

//   const handleTouchEnd = (e) => {
//     if (!startX.current || !startY.current || gameState !== 'playing') return;
//     const endX = e.changedTouches[0].clientX;
//     const endY = e.changedTouches[0].clientY;
//     const diffX = startX.current - endX;
//     const diffY = startY.current - endY;

//     if (Math.abs(diffX) > Math.abs(diffY)) {
//         if (Math.abs(diffX) > 30) move(diffX > 0 ? 'left' : 'right');
//     } else {
//         if (Math.abs(diffY) > 30) move(diffY > 0 ? 'up' : 'down');
//     }
//     startX.current = null;
//     startY.current = null;
//   };

//   return (
//     <div className="container" style={{ background: '#faf8ef', minHeight: '100vh', padding: '10px 5px', display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect:'none' }}>
      
//       {/* 헤더 */}
//       <div style={{width: '100%', maxWidth: '340px', display: 'flex', justifyContent: 'space-between', marginBottom: 15, marginTop: 10}}>
//          <div style={{display:'flex', flexDirection:'column', justifyContent:'center'}}>
//              <h1 style={{color:'#776e65', fontSize: 30, margin:0, fontWeight:'bold', lineHeight:1}}>2048</h1>
//              <button className="btn" onClick={() => navigate('/home')} style={{background:'#8f7a66', color:'white', padding:'8px 15px', border:'none', borderRadius:4, fontWeight:'bold', marginTop:8, fontSize:13}}>{t.home}</button>
//          </div>
         
//          <div style={{display:'flex', gap:5}}>
//              <div style={{background:'#bbada0', padding:'5px 15px', borderRadius:6, textAlign:'center', minWidth:70}}>
//                  <div style={{fontSize:11, fontWeight:'bold', color:'#eee4da', marginBottom:2}}>{t.g_2048_max || "MAX"}</div>
//                  <div style={{fontWeight:'bold', color:'white', fontSize:20}}>{maxTile}</div>
//              </div>
//              <div style={{background:'#bbada0', padding:'5px 15px', borderRadius:6, textAlign:'center', minWidth:70}}>
//                  <div style={{fontSize:11, fontWeight:'bold', color:'#eee4da', marginBottom:2}}>{t.g_2048_score || "SCORE"}</div>
//                  <div style={{fontWeight:'bold', color:'white', fontSize:20}}>{score}</div>
//              </div>
//          </div>
//       </div>

//       {/* 게임 보드 (반응형 적용) */}
//       <div className="game-board-container" style={{
//           position: 'relative',
//           width: `${BOARD_SIZE}px`, 
//           height: `${BOARD_SIZE}px`, 
//           background: '#bbada0', 
//           borderRadius: '6px', 
//           padding: `${GAP}px`,
//           touchAction: 'none',
//           boxSizing: 'border-box'
//       }}>
//         {/* 배경 그리드 */}
//         {Array(GRID_SIZE * GRID_SIZE).fill(0).map((_, i) => {
//             const r = Math.floor(i / GRID_SIZE);
//             const c = i % GRID_SIZE;
//             const top = GAP + r * (CELL_SIZE + GAP);
//             const left = GAP + c * (CELL_SIZE + GAP);
//             return (
//                 <div key={`bg-${i}`} style={{
//                     position: 'absolute',
//                     width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`,
//                     top: `${top}px`, left: `${left}px`,
//                     background: 'rgba(238, 228, 218, 0.35)', borderRadius: '3px'
//                 }}></div>
//             );
//         })}

//         {/* 실제 타일 */}
//         {board.map((row, r) => (
//             row.map((val, c) => {
//                 if(val === 0) return null;
//                 const conf = TILE_COLORS[val] || TILE_COLORS[4096];
//                 const top = GAP + r * (CELL_SIZE + GAP);
//                 const left = GAP + c * (CELL_SIZE + GAP);
//                 return (
//                     <div key={`tile-${r}-${c}-${val}`} style={{
//                         position: 'absolute',
//                         width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`,
//                         top: `${top}px`, left: `${left}px`,
//                         background: conf.bg,
//                         color: conf.color,
//                         borderRadius: '3px',
//                         display: 'flex', justifyContent: 'center', alignItems: 'center',
//                         fontWeight: 'bold', fontSize: conf.size,
//                         transition: 'all 0.1s ease-in-out', 
//                         boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
//                         zIndex: 10,
//                         animation: 'pop 0.2s ease-in-out' 
//                     }}>
//                         {val}
//                     </div>
//                 );
//             })
//         ))}
//       </div>

//       {/* 게임 메뉴 / 결과 모달 (사이즈 축소 및 내용 간소화) */}
//       {gameState !== 'playing' && (
//          <div style={{ position:'absolute', top:'45%', left:'50%', transform:'translate(-50%, -50%)', background:'rgba(255,255,255,0.98)', padding:20, borderRadius:15, boxShadow:'0 20px 50px rgba(0,0,0,0.3)', textAlign:'center', zIndex:100, width: '90%', maxWidth: '320px' }}>
             
//              {gameState === 'finished' && (
//                  <div style={{marginBottom: 15}}>
//                     <h2 style={{color: resultMessage.includes("x") ? '#f1c40f' : '#776e65', margin:0, fontSize:24, fontWeight:'800'}}>
//                         {resultMessage.includes("x") ? t.g_2048_win : "GAME OVER"}
//                     </h2>
//                     <p style={{color:'#555', fontSize:14, fontWeight:'bold', marginTop:5, lineHeight:1.3}}>{resultMessage}</p>
//                  </div>
//              )}

//              {gameState === 'ready' && (
//                  <>
//                     <h1 style={{color:'#776e65', fontSize: 36, margin: '0 0 5px 0', fontWeight:'800'}}>2048</h1>
//                     <p style={{fontSize:13, color:'#888', marginBottom:15}}>{t.g_2048_rule}</p>
//                  </>
//              )}

//              {/* 배당률 표 (수정됨) */}
//              <div style={{background:'#eee4da', padding:10, borderRadius:8, marginBottom:15, fontSize:12, color:'#776e65'}}>
//                  <div style={{fontWeight:'bold', marginBottom:5, borderBottom:'1px solid rgba(0,0,0,0.1)', paddingBottom:3}}>{t.g_2048_payout || "📊 배당률표"}</div>
//                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:5, textAlign:'left'}}>
//                      <div>🧱 128 : x0.01</div>
//                      <div>🧱 256 : x0.05</div>
//                      <div style={{color:'#e67e22', fontWeight:'bold'}}>🧱 512 : x1.1</div>
//                      <div style={{color:'#e74c3c', fontWeight:'bold'}}>🧱 1024 : x1.5</div>
//                      <div style={{color:'#f1c40f', fontWeight:'bold'}}>🧱 2048 : x2.0</div>
//                      <div style={{color:'#8e44ad', fontWeight:'bold'}}>🧱 4096 : x5.0</div>
//                  </div>
//              </div>

//              <div style={{textAlign:'left', marginBottom:15}}>
//                  <label style={{display:'block', marginBottom:5, fontSize:13, fontWeight:'bold', color:'#776e65'}}>{t.betAmount || "베팅 금액"}</label>
//                  <input 
//                    type="number" 
//                    value={betAmount} 
//                    onChange={(e) => setBetAmount(Math.max(0, parseInt(e.target.value) || 0))}
//                    step="1000"
//                    style={{ width:'100%', padding:'10px', borderRadius:8, border:'2px solid #ccc', fontSize:16, fontWeight:'bold', color:'#333' }}
//                  />
//              </div>

//              <button 
//                onClick={startGame} 
//                disabled={betAmount > myPoint}
//                style={{
//                  fontSize:16, padding:'12px 0', 
//                  background: '#8f7a66', width:'100%', 
//                  borderRadius: 8, border:'none', 
//                  color:'white', fontWeight:'bold', 
//                  cursor: 'pointer',
//                  opacity: betAmount > myPoint ? 0.5 : 1,
//                  boxShadow: '0 4px 0 #7f6a56'
//                }}
//              >
//                  {t.gameStart}
//              </button>
//              {betAmount > myPoint && <p style={{color:'red', fontSize:12, marginTop:5, fontWeight:'bold'}}>{t.alertNoMoney}</p>}
//          </div>
//       )}

//       {/* 랭킹 */}
//       <div style={{width: '98%', maxWidth: '340px', marginTop: 30, background: '#bbada0', padding: 15, borderRadius: 6, color: '#f9f6f2'}}>
//           <h3 style={{textAlign:'center', borderBottom:'1px solid #d6cdc4', paddingBottom:10, margin: 0, fontSize: 16}}>🏆 2048 Ranking Top 10</h3>
//           <ul style={{listStyle:'none', padding:0, margin:0}}>
//               {ranks.map((r, i) => (
//                   <li key={i} style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.1)', fontSize:14}}>
//                       <span>{i+1}. {r.name} <span style={{fontSize:11, color:'#eee4da'}}>({r.maxTile})</span></span>
//                       <span style={{fontWeight:'bold'}}>{r.score}</span>
//                   </li>
//               ))}
//           </ul>
//       </div>

//       {/* 스타일 및 모바일 반응형 처리 */}
//       <style>{`
//         @keyframes pop {
//             0% { transform: scale(0); }
//             50% { transform: scale(1.2); }
//             100% { transform: scale(1); }
//         }
        
//         @media (max-width: 370px) {
//             .game-board-container {
//                 transform: scale(0.85);
//             }
//         }
//       `}</style>
//     </div>
//   );
// }

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db, auth } from '../firebase.js'; 
import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp, getDoc, doc, updateDoc, increment } from 'firebase/firestore'; 
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

// 🎨 타일 디자인 (8192 추가됨)
const TILE_COLORS = {
  0: { bg: 'rgba(238, 228, 218, 0.35)', color: 'transparent', size: '0px' }, // 빈칸
  2: { bg: '#eee4da', color: '#776e65', size: '35px' },
  4: { bg: '#ede0c8', color: '#776e65', size: '35px' },
  8: { bg: '#f2b179', color: '#f9f6f2', size: '35px' },
  16: { bg: '#f59563', color: '#f9f6f2', size: '30px' },
  32: { bg: '#f67c5f', color: '#f9f6f2', size: '30px' },
  64: { bg: '#f65e3b', color: '#f9f6f2', size: '30px' },
  128: { bg: '#edcf72', color: '#f9f6f2', size: '26px' }, 
  256: { bg: '#edcc61', color: '#f9f6f2', size: '26px' }, 
  512: { bg: '#edc850', color: '#f9f6f2', size: '26px' }, 
  1024: { bg: '#edc53f', color: '#f9f6f2', size: '22px' }, 
  2048: { bg: '#edc22e', color: '#f9f6f2', size: '22px' }, 
  4096: { bg: '#3c3a32', color: '#f9f6f2', size: '22px' },
  8192: { bg: '#000000', color: '#f1c40f', size: '20px' }, // 🔥 8192 추가 (검은색 배경 + 금색 글씨)
};

// 💰 배당률표 (8192 추가됨)
const PAYOUT_TABLE = {
    128: 0.01,
    256: 0.05,
    512: 1.1,
    1024: 1.5,
    2048: 2.0,
    4096: 5.0,
    8192: 10.0 // 🔥 8192 배당 (x10.0)
};

const GRID_SIZE = 4;
const BOARD_SIZE = 340; // PC 기준 기본 크기
const GAP = 10;
const CELL_SIZE = (BOARD_SIZE - (GAP * (GRID_SIZE + 1))) / GRID_SIZE; // 72.5px

export default function Game2048() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const { t } = useLanguage();

  const [board, setBoard] = useState(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0)));
  const [score, setScore] = useState(0);
  const [maxTile, setMaxTile] = useState(0); 
  const [gameState, setGameState] = useState('ready'); 
  const [ranks, setRanks] = useState([]);

  const [myPoint, setMyPoint] = useState(0);
  const [betAmount, setBetAmount] = useState(1000); 
  const [resultMessage, setResultMessage] = useState("");

  const startX = useRef(null);
  const startY = useRef(null);
  const gameDataRef = useRef(null); 

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    window.scrollTo({ top: 0, behavior: 'auto' });
    fetchUserData();
    fetchRanks();
  }, [user, navigate]);

  const fetchUserData = async () => {
      if (user) {
          try {
              const userSnap = await getDoc(doc(db, "users", user.uid));
              if (userSnap.exists()) {
                  setMyPoint(userSnap.data().point || 0);
              }
          } catch (e) { console.error(e); }
      }
  };

  // 🔥 랭킹 로직: 인당 최대 3개, 총 10개 표시
  const fetchRanks = async () => {
    try {
      const q = query(collection(db, "game_2048_ranks"), orderBy("score", "desc"), limit(50));
      const querySnapshot = await getDocs(q);
      const rawList = querySnapshot.docs.map(doc => doc.data());

      const filteredList = [];
      const userCounts = {}; 

      for (const item of rawList) {
          const uid = item.uid;
          if (!userCounts[uid]) userCounts[uid] = 0;
          if (userCounts[uid] < 3) {
              filteredList.push(item);
              userCounts[uid]++;
          }
          if (filteredList.length >= 10) break;
      }

      setRanks(filteredList);
    } catch (e) { console.error(e); }
  };

  const startGame = async () => {
    if (betAmount <= 0 || betAmount > myPoint) return alert(t.alertNoMoney || "포인트 부족");
    
    try {
        gameDataRef.current = { betAmount, startTime: Date.now() };
        
        await updateDoc(doc(db, "users", user.uid), { point: increment(-betAmount) });
        setMyPoint(prev => prev - betAmount);

        await addDoc(collection(db, "history"), {
            uid: user.uid,
            type: "게임",
            msg: `🧩 2048 ${t.gameStart}`,
            amount: -betAmount,
            createdAt: serverTimestamp()
        });

        initGame();
        setGameState('playing');
        setResultMessage("");
    } catch (e) {
        alert("오류가 발생했습니다.");
    }
  };

  const initGame = () => {
    let newBoard = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
    newBoard = addRandomTile(addRandomTile(newBoard));
    setBoard(newBoard);
    setScore(0);
    setMaxTile(0);
  };

  const addRandomTile = (currentBoard) => {
    let emptyCells = [];
    for(let r=0; r<GRID_SIZE; r++){
        for(let c=0; c<GRID_SIZE; c++){
            if(currentBoard[r][c] === 0) emptyCells.push({r, c});
        }
    }
    if (emptyCells.length === 0) return currentBoard;

    const {r, c} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newBoard = currentBoard.map(row => [...row]);
    newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
  };

  const endGame = async (finalBoard) => {
    if (gameState !== 'playing') return;
    setGameState('finished');

    let currentMax = 0;
    for(let r=0; r<GRID_SIZE; r++) {
        for(let c=0; c<GRID_SIZE; c++) {
            if(finalBoard[r][c] > currentMax) currentMax = finalBoard[r][c];
        }
    }

    let multiplier = 0;
    const milestones = Object.keys(PAYOUT_TABLE).map(Number).sort((a,b)=>b-a);
    for (let milestone of milestones) {
        if (currentMax >= milestone) {
            multiplier = PAYOUT_TABLE[milestone];
            break;
        }
    }

    const earned = Math.floor(betAmount * multiplier);
    let msg = "";

    if (earned > 0) {
        msg = `${t.g_2048_win} [${currentMax}] x${multiplier} (+${earned.toLocaleString()}P)`;
        try {
            await updateDoc(doc(db, "users", user.uid), { point: increment(earned) });
            setMyPoint(prev => prev + earned);
            await addDoc(collection(db, "history"), {
                uid: user.uid,
                type: "게임",
                msg: `🧩 2048 [${currentMax}] ${t.h_gain}`,
                amount: earned,
                createdAt: serverTimestamp()
            });
        } catch(e) { console.error(e); }
    } else {
        msg = `${t.g_2048_fail} (Max: ${currentMax})`;
    }

    setResultMessage(msg);

    if (score > 0) {
        try {
            const userSnap = await getDoc(doc(db, "users", user.uid));
            const userName = userSnap.data().name || "익명";
            await addDoc(collection(db, "game_2048_ranks"), {
                uid: user.uid,
                name: userName,
                score: score,
                maxTile: currentMax,
                createdAt: serverTimestamp()
            });
            fetchRanks();
        } catch(e) {}
    }
  };

  const move = useCallback((direction) => {
    if (gameState !== 'playing') return;

    let newBoard = board.map(row => [...row]);
    let moved = false;
    let addedScore = 0;
    let currentMax = maxTile;

    const slideRow = (row) => {
        let arr = row.filter(val => val);
        let missing = GRID_SIZE - arr.length;
        let zeros = Array(missing).fill(0);
        return arr.concat(zeros);
    };

    const combineRow = (row) => {
        for (let i = 0; i < GRID_SIZE - 1; i++) {
            if (row[i] !== 0 && row[i] === row[i + 1]) {
                row[i] *= 2;
                row[i + 1] = 0;
                addedScore += row[i];
                if(row[i] > currentMax) currentMax = row[i];
                moved = true;
            }
        }
        return row;
    };

    const rotateBoard = (b) => {
        let rotated = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
        for(let r=0; r<GRID_SIZE; r++){
            for(let c=0; c<GRID_SIZE; c++){
                rotated[c][GRID_SIZE-1-r] = b[r][c];
            }
        }
        return rotated;
    };

    let processBoard = [...newBoard];
    if (direction === 'right') processBoard = rotateBoard(rotateBoard(processBoard));
    else if (direction === 'up') processBoard = rotateBoard(rotateBoard(rotateBoard(processBoard)));
    else if (direction === 'down') processBoard = rotateBoard(processBoard);

    for(let i=0; i<GRID_SIZE; i++){
        let originalRow = [...processBoard[i]];
        let slid = slideRow(processBoard[i]);
        let combined = combineRow(slid);
        let final = slideRow(combined);
        processBoard[i] = final;
        if(JSON.stringify(originalRow) !== JSON.stringify(final)) moved = true;
    }

    if (direction === 'right') processBoard = rotateBoard(rotateBoard(processBoard));
    else if (direction === 'up') processBoard = rotateBoard(processBoard);
    else if (direction === 'down') processBoard = rotateBoard(rotateBoard(rotateBoard(processBoard)));

    if (moved) {
        const boardWithTile = addRandomTile(processBoard);
        setBoard(boardWithTile);
        setScore(prev => prev + addedScore);
        setMaxTile(currentMax);

        if (checkGameOver(boardWithTile)) {
            endGame(boardWithTile);
        }
    }
  }, [board, gameState, maxTile]);

  const checkGameOver = (currentBoard) => {
    for(let r=0; r<GRID_SIZE; r++) {
        for(let c=0; c<GRID_SIZE; c++) {
            if(currentBoard[r][c] === 0) return false;
        }
    }
    for(let r=0; r<GRID_SIZE; r++) {
        for(let c=0; c<GRID_SIZE; c++) {
            if (c < GRID_SIZE - 1 && currentBoard[r][c] === currentBoard[r][c+1]) return false;
            if (r < GRID_SIZE - 1 && currentBoard[r][c] === currentBoard[r+1][c]) return false;
        }
    }
    return true;
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
        if(gameState !== 'playing') return;
        if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
        if(e.key === 'ArrowUp') move('up');
        else if(e.key === 'ArrowDown') move('down');
        else if(e.key === 'ArrowLeft') move('left');
        else if(e.key === 'ArrowRight') move('right');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move, gameState]);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (!startX.current || !startY.current || gameState !== 'playing') return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = startX.current - endX;
    const diffY = startY.current - endY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > 30) move(diffX > 0 ? 'left' : 'right');
    } else {
        if (Math.abs(diffY) > 30) move(diffY > 0 ? 'up' : 'down');
    }
    startX.current = null;
    startY.current = null;
  };

  return (
    <div className="container" style={{ background: '#faf8ef', minHeight: '100vh', padding: '10px 5px', display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect:'none' }}>
      
      {/* 헤더 */}
      <div style={{width: '100%', maxWidth: '340px', display: 'flex', justifyContent: 'space-between', marginBottom: 15, marginTop: 10}}>
         <div style={{display:'flex', flexDirection:'column', justifyContent:'center'}}>
             <h1 style={{color:'#776e65', fontSize: 30, margin:0, fontWeight:'bold', lineHeight:1}}>2048</h1>
             <button className="btn" onClick={() => navigate('/home')} style={{background:'#8f7a66', color:'white', padding:'8px 15px', border:'none', borderRadius:4, fontWeight:'bold', marginTop:8, fontSize:13}}>{t.home}</button>
         </div>
         
         <div style={{display:'flex', gap:5}}>
             <div style={{background:'#bbada0', padding:'5px 15px', borderRadius:6, textAlign:'center', minWidth:70}}>
                 <div style={{fontSize:11, fontWeight:'bold', color:'#eee4da', marginBottom:2}}>{t.g_2048_max || "MAX"}</div>
                 <div style={{fontWeight:'bold', color:'white', fontSize:20}}>{maxTile}</div>
             </div>
             <div style={{background:'#bbada0', padding:'5px 15px', borderRadius:6, textAlign:'center', minWidth:70}}>
                 <div style={{fontSize:11, fontWeight:'bold', color:'#eee4da', marginBottom:2}}>{t.g_2048_score || "SCORE"}</div>
                 <div style={{fontWeight:'bold', color:'white', fontSize:20}}>{score}</div>
             </div>
         </div>
      </div>

      {/* 게임 보드 (반응형 적용) */}
      <div className="game-board-container" style={{
          position: 'relative',
          width: `${BOARD_SIZE}px`, 
          height: `${BOARD_SIZE}px`, 
          background: '#bbada0', 
          borderRadius: '6px', 
          padding: `${GAP}px`,
          touchAction: 'none',
          boxSizing: 'border-box'
      }}>
        {/* 배경 그리드 */}
        {Array(GRID_SIZE * GRID_SIZE).fill(0).map((_, i) => {
            const r = Math.floor(i / GRID_SIZE);
            const c = i % GRID_SIZE;
            const top = GAP + r * (CELL_SIZE + GAP);
            const left = GAP + c * (CELL_SIZE + GAP);
            return (
                <div key={`bg-${i}`} style={{
                    position: 'absolute',
                    width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`,
                    top: `${top}px`, left: `${left}px`,
                    background: 'rgba(238, 228, 218, 0.35)', borderRadius: '3px'
                }}></div>
            );
        })}

        {/* 실제 타일 */}
        {board.map((row, r) => (
            row.map((val, c) => {
                if(val === 0) return null;
                const conf = TILE_COLORS[val] || TILE_COLORS[8192]; // Fallback to 8192
                const top = GAP + r * (CELL_SIZE + GAP);
                const left = GAP + c * (CELL_SIZE + GAP);
                return (
                    <div key={`tile-${r}-${c}-${val}`} style={{
                        position: 'absolute',
                        width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`,
                        top: `${top}px`, left: `${left}px`,
                        background: conf.bg,
                        color: conf.color,
                        borderRadius: '3px',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        fontWeight: 'bold', fontSize: conf.size,
                        transition: 'all 0.1s ease-in-out', 
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        zIndex: 10,
                        animation: 'pop 0.2s ease-in-out' 
                    }}>
                        {val}
                    </div>
                );
            })
        ))}
      </div>

      {/* 게임 메뉴 / 결과 모달 */}
      {gameState !== 'playing' && (
         <div style={{ position:'absolute', top:'45%', left:'50%', transform:'translate(-50%, -50%)', background:'rgba(255,255,255,0.98)', padding:20, borderRadius:15, boxShadow:'0 20px 50px rgba(0,0,0,0.3)', textAlign:'center', zIndex:100, width: '90%', maxWidth: '320px' }}>
             
             {gameState === 'finished' && (
                 <div style={{marginBottom: 15}}>
                    <h2 style={{color: resultMessage.includes("x") ? '#f1c40f' : '#776e65', margin:0, fontSize:24, fontWeight:'800'}}>
                        {resultMessage.includes("x") ? t.g_2048_win : "GAME OVER"}
                    </h2>
                    <p style={{color:'#555', fontSize:14, fontWeight:'bold', marginTop:5, lineHeight:1.3}}>{resultMessage}</p>
                 </div>
             )}

             {gameState === 'ready' && (
                 <>
                    <h1 style={{color:'#776e65', fontSize: 36, margin: '0 0 5px 0', fontWeight:'800'}}>2048</h1>
                    <p style={{fontSize:13, color:'#888', marginBottom:15}}>{t.g_2048_rule}</p>
                 </>
             )}

             {/* 배당률 표 (수정됨) */}
             <div style={{background:'#eee4da', padding:10, borderRadius:8, marginBottom:15, fontSize:12, color:'#776e65'}}>
                 <div style={{fontWeight:'bold', marginBottom:5, borderBottom:'1px solid rgba(0,0,0,0.1)', paddingBottom:3}}>{t.g_2048_payout || "📊 배당률표"}</div>
                 <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:5, textAlign:'left'}}>
                     <div>🧱 128 : x0.01</div>
                     <div>🧱 256 : x0.05</div>
                     <div style={{color:'#e67e22', fontWeight:'bold'}}>🧱 512 : x1.1</div>
                     <div style={{color:'#e74c3c', fontWeight:'bold'}}>🧱 1024 : x1.5</div>
                     <div style={{color:'#f1c40f', fontWeight:'bold'}}>🧱 2048 : x2.0</div>
                     <div style={{color:'#8e44ad', fontWeight:'bold'}}>🧱 4096 : x5.0</div>
                     <div style={{color:'#000', fontWeight:'bold'}}>🏆 8192 : x10.0</div>
                 </div>
             </div>

             <div style={{textAlign:'left', marginBottom:15}}>
                 <label style={{display:'block', marginBottom:5, fontSize:13, fontWeight:'bold', color:'#776e65'}}>{t.betAmount || "베팅 금액"}</label>
                 <input 
                   type="number" 
                   value={betAmount} 
                   onChange={(e) => setBetAmount(Math.max(0, parseInt(e.target.value) || 0))}
                   step="1000"
                   style={{ width:'100%', padding:'10px', borderRadius:8, border:'2px solid #ccc', fontSize:16, fontWeight:'bold', color:'#333' }}
                 />
             </div>

             <button 
               onClick={startGame} 
               disabled={betAmount > myPoint}
               style={{
                 fontSize:16, padding:'12px 0', 
                 background: '#8f7a66', width:'100%', 
                 borderRadius: 8, border:'none', 
                 color:'white', fontWeight:'bold', 
                 cursor: 'pointer',
                 opacity: betAmount > myPoint ? 0.5 : 1,
                 boxShadow: '0 4px 0 #7f6a56'
               }}
             >
                 {t.gameStart}
             </button>
             {betAmount > myPoint && <p style={{color:'red', fontSize:12, marginTop:5, fontWeight:'bold'}}>{t.alertNoMoney}</p>}
         </div>
      )}

      {/* 랭킹 */}
      <div style={{width: '98%', maxWidth: '340px', marginTop: 30, background: '#bbada0', padding: 15, borderRadius: 6, color: '#f9f6f2'}}>
          <h3 style={{textAlign:'center', borderBottom:'1px solid #d6cdc4', paddingBottom:10, margin: 0, fontSize: 16}}>🏆 2048 Ranking Top 10</h3>
          <ul style={{listStyle:'none', padding:0, margin:0}}>
              {ranks.map((r, i) => (
                  <li key={i} style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.1)', fontSize:14}}>
                      <span>{i+1}. {r.name} <span style={{fontSize:11, color:'#eee4da'}}>({r.maxTile})</span></span>
                      <span style={{fontWeight:'bold'}}>{r.score}</span>
                  </li>
              ))}
          </ul>
      </div>

      {/* 스타일 및 모바일 반응형 처리 */}
      <style>{`
        @keyframes pop {
            0% { transform: scale(0); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }
        
        @media (max-width: 370px) {
            .game-board-container {
                transform: scale(0.85);
            }
        }
      `}</style>
    </div>
  );
}