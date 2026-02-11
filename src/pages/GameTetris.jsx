
// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { db, auth } from '../firebase.js'; 
// import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp, getDoc, doc, updateDoc, increment } from 'firebase/firestore'; 
// import { useNavigate } from 'react-router-dom';
// import { useLanguage } from '../LanguageContext';

// // 🎨 블록 색상 테마 (6가지)
// const BLOCK_THEMES = {
//   neon: {
//     I: '0, 255, 255',      // Cyan
//     J: '0, 0, 255',        // Blue
//     L: '255, 165, 0',      // Orange
//     O: '255, 255, 0',      // Yellow
//     S: '0, 255, 0',        // Green
//     T: '128, 0, 128',      // Purple
//     Z: '255, 0, 0',        // Red
//   },
//   pastel: {
//     I: '173, 216, 230',    // Light Blue
//     J: '176, 196, 222',    // Light Steel Blue
//     L: '255, 192, 203',    // Pink
//     O: '255, 228, 181',    // Moccasin
//     S: '152, 251, 152',    // Pale Green
//     T: '221, 160, 221',    // Plum
//     Z: '255, 182, 193',    // Light Pink
//   },
//   galaxy: {
//     I: '138, 43, 226',     // Blue Violet
//     J: '75, 0, 130',       // Indigo
//     L: '255, 20, 147',     // Deep Pink
//     O: '218, 112, 214',    // Orchid
//     S: '186, 85, 211',     // Medium Orchid
//     T: '147, 112, 219',    // Medium Purple
//     Z: '238, 130, 238',    // Violet
//   },
//   ocean: {
//     I: '0, 191, 255',      // Deep Sky Blue
//     J: '30, 144, 255',     // Dodger Blue
//     L: '64, 224, 208',     // Turquoise
//     O: '72, 209, 204',     // Medium Turquoise
//     S: '32, 178, 170',     // Light Sea Green
//     T: '95, 158, 160',     // Cadet Blue
//     Z: '0, 206, 209',      // Dark Turquoise
//   },
//   sunset: {
//     I: '255, 99, 71',      // Tomato
//     J: '255, 140, 0',      // Dark Orange
//     L: '255, 69, 0',       // Orange Red
//     O: '255, 215, 0',      // Gold
//     S: '255, 160, 122',    // Light Salmon
//     T: '255, 127, 80',     // Coral
//     Z: '220, 20, 60',      // Crimson
//   },
//   forest: {
//     I: '34, 139, 34',      // Forest Green
//     J: '46, 125, 50',      // Dark Green
//     L: '139, 195, 74',     // Light Green
//     O: '205, 220, 57',     // Yellow Green
//     S: '102, 187, 106',    // Medium Sea Green
//     T: '76, 175, 80',      // Green
//     Z: '156, 204, 101',    // Light Green
//   }
// };

// const THEME_NAMES = Object.keys(BLOCK_THEMES);

// // 🎨 테트로미노 기본 구조 생성 함수
// const createTetrominos = (colorTheme) => ({
//   0: { shape: [[0]], color: '0, 0, 0' },
//   I: { shape: [[0, 'I', 0, 0], [0, 'I', 0, 0], [0, 'I', 0, 0], [0, 'I', 0, 0]], color: colorTheme.I },
//   J: { shape: [[0, 'J', 0], [0, 'J', 0], ['J', 'J', 0]], color: colorTheme.J },
//   L: { shape: [[0, 'L', 0], [0, 'L', 0], [0, 'L', 'L']], color: colorTheme.L },
//   O: { shape: [['O', 'O'], ['O', 'O']], color: colorTheme.O },
//   S: { shape: [[0, 'S', 'S'], ['S', 'S', 0], [0, 0, 0]], color: colorTheme.S },
//   T: { shape: [[0, 'T', 0], ['T', 'T', 'T'], [0, 0, 0]], color: colorTheme.T },
//   Z: { shape: [['Z', 'Z', 0], [0, 'Z', 'Z'], [0, 0, 0]], color: colorTheme.Z },
// });

// const RANDOM_TETROMINOS = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

// // 💰 배당률
// const PAYOUT_TABLE = {
//     5000: 0.1,
//     100000: 0.5,
//     200000: 1.0,
//     350000: 1.5,
//     500000: 2.0,
//     1000000: 2.5
// };

// const STAGE_WIDTH = 10;
// const STAGE_HEIGHT = 20;
// const BLOCK_SIZE = 26;

// // 🔧 블록의 실제 너비 계산
// const getTetrominoWidth = (shape) => {
//   let minX = shape[0].length;
//   let maxX = -1;
//   for (let y = 0; y < shape.length; y++) {
//     for (let x = 0; x < shape[y].length; x++) {
//       if (shape[y][x] !== 0) {
//         minX = Math.min(minX, x);
//         maxX = Math.max(maxX, x);
//       }
//     }
//   }
//   return maxX - minX + 1;
// };

// // 🔧 블록 중앙 정렬 X 좌표 계산
// const getCenterX = (shape) => {
//   const width = shape[0].length;
//   return Math.floor((STAGE_WIDTH - width) / 2);
// };

// // 빈 스테이지 생성
// const createStage = () =>
//   Array.from(Array(STAGE_HEIGHT), () =>
//     new Array(STAGE_WIDTH).fill([0, 'clear'])
//   );

// // 🎒 7-bag 시스템: 7개 블록을 섞어서 반환
// const generate7Bag = (TETROMINOS) => {
//   const bag = [...RANDOM_TETROMINOS];
//   // Fisher-Yates shuffle
//   for (let i = bag.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [bag[i], bag[j]] = [bag[j], bag[i]];
//   }
//   return bag.map(tag => TETROMINOS[tag]);
// };

// // 커스텀 훅 (Interval)
// function useInterval(callback, delay) {
//   const savedCallback = useRef();
//   useEffect(() => { savedCallback.current = callback; }, [callback]);
//   useEffect(() => {
//     if (delay !== null) {
//       const id = setInterval(() => savedCallback.current(), delay);
//       return () => clearInterval(id);
//     }
//   }, [delay]);
// }

// export default function GameTetris() {
//   const navigate = useNavigate();
//   const user = auth.currentUser;
//   const { t } = useLanguage();

//   // 🎨 현재 블록 색상 테마
//   const [TETROMINOS, setTETROMINOS] = useState(createTetrominos(BLOCK_THEMES.neon));

//   const [stage, setStage] = useState(createStage());
//   const [player, setPlayer] = useState({ pos: { x: 0, y: 0 }, tetromino: TETROMINOS[0].shape, collided: false });
//   const [dropTime, setDropTime] = useState(null);
//   const [gameOver, setGameOver] = useState(false);
//   const [gameState, setGameState] = useState('ready'); 
//   const [score, setScore] = useState(0);
//   const [rowsCleared, setRowsCleared] = useState(0);
//   const [level, setLevel] = useState(1);
//   const [clearingRows, setClearingRows] = useState([]); 

//   const [nextPieces, setNextPieces] = useState([]);
//   const [holdPiece, setHoldPiece] = useState(null);
//   const [canHold, setCanHold] = useState(true);

//   // 🎒 7-bag 시스템을 위한 bag 상태
//   const [currentBag, setCurrentBag] = useState([]);
//   const [bagIndex, setBagIndex] = useState(0);

//   const [myPoint, setMyPoint] = useState(0);
//   const [betAmount, setBetAmount] = useState(1000);
//   const [resultMessage, setResultMessage] = useState("");
//   const [ranks, setRanks] = useState([]);
//   const betAmountRef = useRef(1000);

//   // 초기화
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
//               if (userSnap.exists()) setMyPoint(userSnap.data().point || 0);
//           } catch (e) { console.error(e); }
//       }
//   };

//   const fetchRanks = async () => {
//     try {
//       const q = query(collection(db, "game_tetris_ranks"), orderBy("score", "desc"), limit(50));
//       const snap = await getDocs(q);
//       const rawList = snap.docs.map(doc => doc.data());
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

//   // 🎒 7-bag에서 다음 블록 가져오기
//   const getNextPieceFromBag = () => {
//       if (bagIndex >= currentBag.length) {
//           // 현재 bag이 다 소진되면 새로운 bag 생성
//           const newBag = generate7Bag(TETROMINOS);
//           setCurrentBag(newBag);
//           setBagIndex(1);
//           return newBag[0];
//       } else {
//           const piece = currentBag[bagIndex];
//           setBagIndex(prev => prev + 1);
//           return piece;
//       }
//   };

//   const startGame = async () => {
//     const bet = parseInt(betAmount);
//     if (isNaN(bet) || bet <= 0 || bet > myPoint) return alert(t.alertNoMoney || "포인트 부족");

//     try {
//         await updateDoc(doc(db, "users", user.uid), { point: increment(-bet) });
//         setMyPoint(prev => prev - bet);
//         betAmountRef.current = bet;

//         await addDoc(collection(db, "history"), {
//             uid: user.uid, type: "게임", msg: `🧱 ${t.g_tetris_title || '테트리스'} ${t.gameStart || "시작"}`, amount: -bet, createdAt: serverTimestamp()
//         });

//         // 🎨 랜덤 블록 색상 테마 선택
//         const randomThemeName = THEME_NAMES[Math.floor(Math.random() * THEME_NAMES.length)];
//         const newColorTheme = BLOCK_THEMES[randomThemeName];
//         const newTETROMINOS = createTetrominos(newColorTheme);
//         setTETROMINOS(newTETROMINOS);

//         // 리셋
//         setStage(createStage());
//         setScore(0);
//         setRowsCleared(0);
//         setLevel(1);
//         setGameOver(false);
//         setGameState('playing');
//         setHoldPiece(null);
//         setCanHold(true);
//         setDropTime(1000);
//         setResultMessage("");

//         // 🎒 7-bag 초기화 (새 테마 적용)
//         const initialBag = generate7Bag(newTETROMINOS);
//         setCurrentBag(initialBag);
//         setBagIndex(4); // 첫 4개를 사용 (현재 블록 + next 3개)
        
//         const p1 = initialBag[0];
//         const p2 = initialBag[1];
//         const p3 = initialBag[2];
//         const p4 = initialBag[3];
        
//         setNextPieces([p2, p3, p4]);
        
//         // 블록 크기에 따른 중앙 정렬
//         setPlayer({
//             pos: { x: getCenterX(p1.shape), y: 0 },
//             tetromino: p1.shape,
//             collided: false
//         });

//     } catch (e) { alert("Error: " + e.message); }
//   };

//   const checkCollision = (player, stage, { x: moveX, y: moveY }) => {
//     for (let y = 0; y < player.tetromino.length; y++) {
//       for (let x = 0; x < player.tetromino[y].length; x++) {
//         if (player.tetromino[y][x] !== 0) {
//           const targetY = y + player.pos.y + moveY;
//           const targetX = x + player.pos.x + moveX;
//           if (targetX < 0) return true;
//           if (targetX >= STAGE_WIDTH) return true;
//           if (targetY >= STAGE_HEIGHT) return true;
//           if (targetY < 0) continue;
//           if (stage[targetY] && stage[targetY][targetX]) {
//             if (stage[targetY][targetX][1] !== 'clear') return true;
//           }
//         }
//       }
//     }
//     return false;
//   };

//   const movePlayer = (dir) => {
//     if (!checkCollision(player, stage, { x: dir, y: 0 })) {
//       setPlayer(prev => ({ ...prev, pos: { x: prev.pos.x + dir, y: prev.pos.y } }));
//     }
//   };

//   const rotate = (matrix, dir) => {
//     const rotated = matrix.map((_, index) => matrix.map(col => col[index]));
//     if (dir > 0) return rotated.map(row => row.reverse());
//     return rotated.reverse();
//   };

//   const playerRotate = (dir) => {
//     const clonedPlayer = JSON.parse(JSON.stringify(player));
//     clonedPlayer.tetromino = rotate(clonedPlayer.tetromino, dir);
//     const pos = clonedPlayer.pos.x;
//     let offset = 1;
//     while (checkCollision(clonedPlayer, stage, { x: 0, y: 0 })) {
//       clonedPlayer.pos.x += offset;
//       offset = -(offset + (offset > 0 ? 1 : -1));
//       if (Math.abs(offset) > clonedPlayer.tetromino[0].length) {
//         rotate(clonedPlayer.tetromino, -dir);
//         clonedPlayer.pos.x = pos;
//         return;
//       }
//     }
//     setPlayer(clonedPlayer);
//   };

//   const drop = () => {
//     if (rowsCleared > level * 10) {
//       setLevel(prev => prev + 1);
//       setDropTime(1000 / (level + 1) + 200);
//     }
//     if (!checkCollision(player, stage, { x: 0, y: 1 })) {
//       setPlayer(prev => ({ ...prev, pos: { x: prev.pos.x, y: prev.pos.y + 1 } }));
//     } else {
//       if (player.pos.y < 1) {
//         setGameOver(true);
//         setGameState('finished');
//         setDropTime(null);
//         endGameCallback();
//         return;
//       }
//       updateStage();
//     }
//   };

//   const dropPlayer = () => {
//     drop();
//   };

//   const hardDrop = () => {
//       let tmpY = 0;
//       while (!checkCollision(player, stage, { x: 0, y: tmpY + 1 })) {
//           tmpY += 1;
//       }
//       const clonedPlayer = {
//           ...player,
//           pos: { x: player.pos.x, y: player.pos.y + tmpY },
//           collided: true
//       };
//       updateStage(clonedPlayer);
//   };

//   const updateStage = (finalPlayer = player) => {
//       const newStage = stage.map(row => row.map(cell => cell));
//       finalPlayer.tetromino.forEach((row, y) => {
//           row.forEach((value, x) => {
//               if (value !== 0) {
//                   const targetY = y + finalPlayer.pos.y;
//                   const targetX = x + finalPlayer.pos.x;
//                   if (targetY >= 0 && targetY < STAGE_HEIGHT && targetX >= 0 && targetX < STAGE_WIDTH) {
//                       newStage[targetY][targetX] = [value, 'merged'];
//                   }
//               }
//           });
//       });

//       const completedRows = [];
//       newStage.forEach((row, index) => {
//           if (row.findIndex(cell => cell[0] === 0) === -1) {
//               completedRows.push(index);
//           }
//       });

//       if (completedRows.length > 0) {
//           setClearingRows(completedRows);
//           setDropTime(null); // ⛔ 라인 클리어 중에는 drop 중지
//           setTimeout(() => {
//               const sweptStage = newStage.reduce((ack, row, index) => {
//                   if (completedRows.includes(index)) {
//                       ack.unshift(new Array(STAGE_WIDTH).fill([0, 'clear']));
//                       return ack;
//                   }
//                   ack.push(row);
//                   return ack;
//               }, []);
//               setRowsCleared(prev => prev + completedRows.length);
//               const pts = [0, 100, 300, 500, 800];
//               setScore(prev => prev + pts[completedRows.length] * level);
//               setStage(sweptStage);
//               setClearingRows([]);
//               setTimeout(() => resetPlayer(), 0);
//           }, 500);
//       } else {
//           setStage(newStage);
//           setTimeout(() => resetPlayer(), 0);
//       }
//   };

//   const resetPlayer = () => {
//       const nextPiece = nextPieces[0];
//       const newPiece = getNextPieceFromBag();
//       const newNextPieces = [...nextPieces.slice(1), newPiece];
//       setNextPieces(newNextPieces);
//       const newPlayer = {
//           pos: { x: getCenterX(nextPiece.shape), y: 0 },
//           tetromino: nextPiece.shape,
//           collided: false,
//       };
//       setPlayer(newPlayer);
//       setCanHold(true);
//       setDropTime(1000 / level + 200);
//       if (checkCollision(newPlayer, stage, {x:0, y:0})) {
//           setGameOver(true);
//           setGameState('finished');
//           setDropTime(null);
//           endGameCallback();
//       }
//   };

//   const hold = () => {
//       if (!canHold || gameState !== 'playing') return;
//       let currentType = 'I';
//       loop1:
//       for(let r=0; r<player.tetromino.length; r++){
//           for(let c=0; c<player.tetromino[r].length; c++){
//               if(player.tetromino[r][c] !== 0) {
//                   currentType = player.tetromino[r][c];
//                   break loop1;
//               }
//           }
//       }
//       if (!TETROMINOS[currentType]) currentType = 'I';
//       if (holdPiece === null) {
//           setHoldPiece(currentType);
//           resetPlayer(); 
//       } else {
//           const temp = holdPiece;
//           const tempShape = TETROMINOS[temp].shape;
//           setHoldPiece(currentType);
//           setPlayer({
//               pos: { x: getCenterX(tempShape), y: 0 },
//               tetromino: tempShape,
//               collided: false,
//           });
//       }
//       setCanHold(false);
//   };

//   useInterval(() => {
//     drop();
//   }, dropTime);

//   useEffect(() => {
//       const handleKeyDown = (e) => {
//           if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
          
//           // ⛔ 라인 클리어 중에는 입력 무시
//           if (clearingRows.length > 0) return;
          
//           if(gameState !== 'playing') return;
//           if (e.keyCode === 37) movePlayer(-1);
//           else if (e.keyCode === 39) movePlayer(1);
//           else if (e.keyCode === 40) dropPlayer();
//           else if (e.keyCode === 38) playerRotate(1);
//           else if (e.code === 'Space') hardDrop();
//           else if (e.keyCode === 67 || e.shiftKey) hold();
//           else if (e.keyCode === 80) setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
//       };
//       window.addEventListener('keydown', handleKeyDown);
//       return () => window.removeEventListener('keydown', handleKeyDown);
//   });

//   const endGameCallback = async () => {
//       const finalScore = score; 
//       let multiplier = 0;
//       const scores = Object.keys(PAYOUT_TABLE).map(Number).sort((a,b)=>b-a);
//       for (let s of scores) {
//           if (finalScore >= s) {
//               multiplier = PAYOUT_TABLE[s];
//               break;
//           }
//       }
//       const earned = Math.floor(betAmountRef.current * multiplier);
//       let msg = "";
//       if (earned > 0) {
//           msg = `🎉 ${t.win || '승리!'} ${finalScore.toLocaleString()} (+${earned.toLocaleString()}P)`;
//           try {
//               await updateDoc(doc(db, "users", user.uid), { point: increment(earned) });
//               setMyPoint(prev => prev + earned);
//               await addDoc(collection(db, "history"), {
//                   uid: user.uid, type: "게임", msg: `🧱 ${t.g_tetris_title || '테트리스'} [${finalScore}] ${t.h_gain || '획득'}`, amount: earned, createdAt: serverTimestamp()
//               });
//           } catch(e) {}
//       } else {
//           msg = `😭 ${t.fail || '실패'}... (${finalScore.toLocaleString()})`;
//       }
//       setResultMessage(msg);
//       if (finalScore >= 1000) {
//           try {
//               const userSnap = await getDoc(doc(db, "users", user.uid));
//               await addDoc(collection(db, "game_tetris_ranks"), {
//                   uid: user.uid, name: userSnap.data().name || "익명", score: finalScore, createdAt: serverTimestamp()
//               });
//               fetchRanks();
//           } catch(e) {}
//       }
//   };

//   const handleMobileControl = (action) => {
//       // ⛔ 라인 클리어 중에는 입력 무시
//       if (clearingRows.length > 0) return;
      
//       if(gameState !== 'playing') return;
//       if (action === 'L') movePlayer(-1);
//       if (action === 'R') movePlayer(1);
//       if (action === 'D') dropPlayer();
//       if (action === 'U') playerRotate(1);
//       if (action === 'H') hardDrop();
//       if (action === 'S') hold();
//   };

//   const getGhostPos = () => {
//       let ghostY = player.pos.y;
//       while (!checkCollision(player, stage, { x: 0, y: (ghostY - player.pos.y) + 1 })) {
//           ghostY += 1;
//       }
//       return { x: player.pos.x, y: ghostY };
//   };

//   const renderBoard = () => {
//       const board = stage.map((row, rowIndex) => row.map(cell => ({ 
//           type: cell[0], 
//           status: clearingRows.includes(rowIndex) ? 'clearing' : cell[1] 
//       })));
      
//       if (gameState === 'playing' && !player.collided) {
//           const ghost = getGhostPos();
//           player.tetromino.forEach((row, y) => {
//               row.forEach((value, x) => {
//                   if (value !== 0) {
//                       const ty = y + ghost.y;
//                       const tx = x + ghost.x;
//                       if (ty >= 0 && ty < STAGE_HEIGHT && tx >= 0 && tx < STAGE_WIDTH) {
//                           if (board[ty][tx].type === 0 && !clearingRows.includes(ty)) {
//                               board[ty][tx] = { type: value, status: 'ghost' };
//                           }
//                       }
//                   }
//               });
//           });
//           player.tetromino.forEach((row, y) => {
//               row.forEach((value, x) => {
//                   if (value !== 0) {
//                       const ty = y + player.pos.y;
//                       const tx = x + player.pos.x;
//                       if (ty >= 0 && ty < STAGE_HEIGHT && tx >= 0 && tx < STAGE_WIDTH) {
//                           if (!clearingRows.includes(ty)) {
//                               board[ty][tx] = { type: value, status: 'active' };
//                           }
//                       }
//                   }
//               });
//           });
//       }
//       return board;
//   };

//   const currentBoard = renderBoard();

//   return (
//     <>
//       <style>{`
//         @keyframes lineFlash {
//           0% { background: white; box-shadow: 0 0 20px rgba(255, 255, 255, 1), inset 0 0 20px rgba(255, 255, 255, 0.8); }
//           50% { background: rgba(255, 255, 100, 1); box-shadow: 0 0 30px rgba(255, 255, 100, 1), inset 0 0 30px rgba(255, 255, 100, 0.9); }
//           100% { background: white; box-shadow: 0 0 40px rgba(255, 255, 255, 1), inset 0 0 40px rgba(255, 255, 255, 1); }
//         }
//       `}</style>
//     <div className="container" style={{ background: 'linear-gradient(135deg, #1e3c72, #2a5298)', minHeight: '100vh', padding: '10px 5px', display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none', color:'white' }}>
      
//       {/* 헤더 */}
//       <div style={{width: '100%', maxWidth: '400px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)', padding: '12px 20px', borderRadius: 15, border: '1px solid rgba(255,255,255,0.1)', boxShadow:'0 8px 20px rgba(0,0,0,0.3)'}}>
//          <button onClick={() => navigate('/home')} style={{background:'rgba(255, 107, 107, 0.8)', fontSize:12, padding:'8px 16px', color:'white', border:'none', borderRadius:20, fontWeight:'bold', cursor:'pointer', boxShadow:'0 2px 5px rgba(0,0,0,0.2)'}}>{t.home || 'HOME'}</button>
//          <div style={{textAlign:'right'}}>
//              <div style={{fontSize:11, color:'#aaa', letterSpacing:'1px'}}>{t.g_score || "SCORE"}</div>
//              <div style={{fontWeight:'bold', color:'#feca57', fontSize:22, textShadow:'0 0 10px rgba(254, 202, 87, 0.5)'}}>{score.toLocaleString()}</div>
//          </div>
//       </div>

//       <div style={{ display: 'flex', gap: '10px', maxWidth: '500px', width: '100%', justifyContent: 'center' }}>
          
//           {/* HOLD 패널 */}
//           <div style={{display:'flex', flexDirection:'column', gap: 10, width: '75px'}}>
//               <div style={{background:'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(5px)', padding: '10px 5px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', textAlign:'center', height: '80px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
//                   <div style={{fontSize:10, fontWeight:'bold', color:'#a29bfe', marginBottom:5, letterSpacing:'1px'}}>{t.g_hold || "HOLD"}</div>
//                   {holdPiece ? <MiniBoard piece={holdPiece} TETROMINOS={TETROMINOS} /> : <div style={{fontSize:20, color:'#555'}}>-</div>}
//               </div>
//               <div style={{background:'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(5px)', padding: '10px 5px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', textAlign:'center', flex:1, display:'flex', flexDirection:'column', justifyContent:'center'}}>
//                   <div style={{fontSize:10, fontWeight:'bold', color:'#aaa'}}>{t.g_level || "LEVEL"}</div>
//                   <div style={{fontSize:20, fontWeight:'bold', color:'#fff', textShadow:'0 0 5px white'}}>{level}</div>
//                   <div style={{height:15}} />
//                   <div style={{fontSize:10, fontWeight:'bold', color:'#aaa'}}>{t.g_lines || "LINES"}</div>
//                   <div style={{fontSize:20, fontWeight:'bold', color:'#55efc4', textShadow:'0 0 5px #55efc4'}}>{rowsCleared}</div>
//               </div>
//           </div>

//           {/* 메인 보드 */}
//           <div style={{border: '2px solid rgba(255,255,255,0.1)', borderRadius: 10, width: STAGE_WIDTH * BLOCK_SIZE, height: STAGE_HEIGHT * BLOCK_SIZE, background: 'rgba(0, 0, 0, 0.6)', position: 'relative', boxShadow: '0 0 30px rgba(0,0,0,0.5)', overflow: 'visible'}}>
//               <div style={{display: 'grid', gridTemplateRows: `repeat(${STAGE_HEIGHT}, ${BLOCK_SIZE}px)`, gridTemplateColumns: `repeat(${STAGE_WIDTH}, ${BLOCK_SIZE}px)`, width: STAGE_WIDTH * BLOCK_SIZE, height: STAGE_HEIGHT * BLOCK_SIZE, gap: 0, padding: 0, margin: 0}}>
//                   {currentBoard.map((row, y) => row.map((cell, x) => <Cell key={`${y}-${x}`} type={cell.type} status={cell.status} TETROMINOS={TETROMINOS} />))}
//               </div>
//               {gameState !== 'playing' && (
//                   <div style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', background:'rgba(20, 20, 30, 0.9)', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', zIndex:10, backdropFilter: 'blur(5px)'}}>
//                       {gameState === 'ready' && (
//                           <>
//                             <h2 style={{color:'#48dbfb', fontSize:32, margin:0, textShadow:'0 0 15px #48dbfb', letterSpacing:'2px'}}>{t.g_tetris_title || "TETRIS"}</h2>
                            
//                             {/* 배당표 */}
//                             <div style={{background:'rgba(255,255,255,0.1)', padding:'12px', borderRadius:8, margin:'15px 0', width:'80%', fontSize:12, color:'#ddd'}}>
//                                 <div style={{fontWeight:'bold', borderBottom:'1px solid #555', paddingBottom:5, marginBottom:5, textAlign:'center'}}>{t.probTable || "Payout Table"}</div>
//                                 {Object.keys(PAYOUT_TABLE).map(score => (
//                                     <div key={score} style={{display:'flex', justifyContent:'space-between', padding:'2px 0'}}>
//                                         <span>{Number(score).toLocaleString()}+</span>
//                                         <span style={{fontWeight:'bold', color:'#feca57'}}>x{PAYOUT_TABLE[score]}</span>
//                                     </div>
//                                 ))}
//                             </div>

//                             <div style={{margin:'10px 0', width:'80%'}}>
//                                 <label style={{display:'block', fontSize:12, marginBottom:8, color:'#ccc', fontWeight:'bold'}}>{t.betAmount || "Bet Amount"}</label>
//                                 <input type="number" value={betAmount} onChange={(e)=>setBetAmount(e.target.value)} step="1000" style={{width:'100%', padding:'12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.05)', color:'white', textAlign:'center', fontSize:18, fontWeight:'bold', boxSizing:'border-box'}} />
//                             </div>
//                             <button onClick={startGame} style={{background:'linear-gradient(90deg, #48dbfb 0%, #0abde3 100%)', color:'white', border:'none', padding:'15px 50px', borderRadius:30, fontWeight:'bold', fontSize:18, cursor:'pointer', boxShadow:'0 10px 20px rgba(72, 219, 251, 0.3)', transition:'transform 0.2s', marginTop:10}}>{t.gameStart || "START"}</button>
//                           </>
//                       )}
//                       {gameState === 'paused' && (
//                           <>
//                             <h2 style={{color:'white', letterSpacing:'2px'}}>{t.g_paused || "PAUSED"}</h2>
//                             <button onClick={()=>setGameState('playing')} style={{background:'#5f27cd', color:'white', border:'none', padding:'12px 40px', borderRadius:25, marginTop:20, cursor:'pointer', fontWeight:'bold', boxShadow:'0 5px 15px rgba(95, 39, 205, 0.4)'}}>{t.g_resume || "RESUME"}</button>
//                           </>
//                       )}
//                       {gameState === 'finished' && (
//                           <>
//                             <h2 style={{color: resultMessage.includes("Win") ? '#2ecc71' : '#ff6b6b', fontSize:28, textShadow:'0 0 10px rgba(0,0,0,0.5)'}}>{resultMessage.includes("Win") ? (t.win || "WINNER") : (t.lose || "GAME OVER")}</h2>
//                             <p style={{margin:'15px 0', fontWeight:'bold', fontSize:14, color:'#ddd'}}>{resultMessage}</p>
//                             <button onClick={()=>setGameState('ready')} style={{background:'rgba(255,255,255,0.1)', color:'white', border:'1px solid rgba(255,255,255,0.3)', padding:'10px 30px', borderRadius:20, marginTop:15, cursor:'pointer', fontWeight:'bold'}}>{t.playAgain || "RETRY"}</button>
//                           </>
//                       )}
//                   </div>
//               )}
//           </div>

//           {/* NEXT 패널 */}
//           <div style={{width: '75px', background:'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(5px)', padding: '10px 5px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', textAlign:'center', height: '220px', display:'flex', flexDirection:'column', alignItems:'center'}}>
//               <div style={{fontSize:10, fontWeight:'bold', color:'#48dbfb', marginBottom:15, letterSpacing:'1px'}}>{t.g_next || "NEXT"}</div>
//               <div style={{display:'flex', flexDirection:'column', gap:12}}>
//                   {nextPieces.map((p, i) => <MiniBoard key={i} pieceObj={p} />)}
//               </div>
//           </div>
//       </div>



//       {/* 랭킹 */}
//       <div style={{width: '100%', maxWidth: '500px', marginTop: 25, background: 'rgba(0,0,0,0.2)', padding: 15, borderRadius: 15, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(5px)'}}>
//           <h3 style={{textAlign:'center', margin:'0 0 15px 0', borderBottom:'1px solid rgba(255,255,255,0.1)', paddingBottom:10, fontSize: 16, color: '#feca57', letterSpacing:'1px'}}>🏆 {t.rank || "TOP RANKING"}</h3>
//           <ul style={{listStyle:'none', padding:0, margin:0}}>
//               {ranks.map((r, i) => (
//                   <li key={i} style={{display:'flex', justifyContent:'space-between', padding:'8px 5px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize:14, color: i < 3 ? '#fff' : '#aaa'}}>
//                       <span style={{color: i===0?'#ffd700': i===1?'#c0c0c0': i===2?'#cd7f32':'#aaa'}}>{i+1}. {r.name}</span>
//                       <span style={{fontWeight:'bold'}}>{r.score.toLocaleString()}</span>
//                   </li>
//               ))}
//           </ul>
//       </div>
//     </div>
//     </>
//   );
// }

// // 🎨 렌더링 컴포넌트
// const Cell = React.memo(({ type, status, TETROMINOS }) => {
//     const color = (type !== 0 && TETROMINOS[type]) ? TETROMINOS[type].color : '0, 0, 0';
//     const isFilled = type !== 0;
//     const isGhost = status === 'ghost';
//     const isClearing = status === 'clearing';
    
//     const style = {
//         width: `${BLOCK_SIZE}px`,
//         height: `${BLOCK_SIZE}px`,
//         borderRadius: '2px',
//         transition: 'none',
//         boxSizing: 'border-box'
//     };

//     if (isClearing) {
//         style.background = 'white';
//         style.border = '1px solid rgba(255, 255, 255, 1)';
//         style.boxShadow = '0 0 20px rgba(255, 255, 255, 1), inset 0 0 20px rgba(255, 255, 255, 0.8)';
//         style.animation = 'lineFlash 0.5s ease-in-out';
//     } else if (isFilled) {
//         if (isGhost) {
//             style.border = `1px solid rgba(${color}, 0.5)`;
//             style.background = `rgba(${color}, 0.1)`;
//             style.boxShadow = `inset 0 0 5px rgba(${color}, 0.2)`;
//         } else {
//             style.background = `rgba(${color}, 0.8)`;
//             style.border = `1px solid rgba(255,255,255,0.5)`;
//             style.boxShadow = `0 0 8px rgba(${color}, 0.8), inset 0 0 5px rgba(255,255,255,0.3)`;
//         }
//     } else {
//         style.border = '1px solid rgba(255,255,255,0.03)';
//         style.background = 'transparent';
//     }

//     return <div style={style} />;
// });

// const MiniBoard = ({ piece, pieceObj, TETROMINOS }) => {
//     let shape, color;
//     if (pieceObj && pieceObj.shape) {
//         shape = pieceObj.shape;
//         color = pieceObj.color;
//     } else if (piece && TETROMINOS && TETROMINOS[piece]) {
//         shape = TETROMINOS[piece].shape;
//         color = TETROMINOS[piece].color;
//     } else {
//         return null;
//     }

//     return (
//         <div style={{
//             display:'grid', 
//             gridTemplateRows:`repeat(${shape.length}, 12px)`,
//             gridTemplateColumns:`repeat(${shape[0].length}, 12px)`,
//             gap: 1, justifyContent: 'center'
//         }}>
//             {shape.map((row, y) => row.map((cell, x) => (
//                 <div key={`${x}-${y}`} style={{
//                     width: 12, height: 12,
//                     background: cell !== 0 ? `rgb(${color})` : 'transparent',
//                     borderRadius: 2,
//                     boxShadow: cell !== 0 ? `0 0 4px rgba(${color}, 0.8)` : 'none'
//                 }} />
//             )))}
//         </div>
//     );
// };

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db, auth } from '../firebase.js'; 
import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp, getDoc, doc, updateDoc, increment } from 'firebase/firestore'; 
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

// 🎨 블록 색상 테마 (6가지)
const BLOCK_THEMES = {
  neon: {
    I: '0, 255, 255',      // Cyan
    J: '0, 0, 255',        // Blue
    L: '255, 165, 0',      // Orange
    O: '255, 255, 0',      // Yellow
    S: '0, 255, 0',        // Green
    T: '128, 0, 128',      // Purple
    Z: '255, 0, 0',        // Red
  },
  pastel: {
    I: '173, 216, 230',    // Light Blue
    J: '176, 196, 222',    // Light Steel Blue
    L: '255, 192, 203',    // Pink
    O: '255, 228, 181',    // Moccasin
    S: '152, 251, 152',    // Pale Green
    T: '221, 160, 221',    // Plum
    Z: '255, 182, 193',    // Light Pink
  },
  galaxy: {
    I: '138, 43, 226',     // Blue Violet
    J: '75, 0, 130',       // Indigo
    L: '255, 20, 147',     // Deep Pink
    O: '218, 112, 214',    // Orchid
    S: '186, 85, 211',     // Medium Orchid
    T: '147, 112, 219',    // Medium Purple
    Z: '238, 130, 238',    // Violet
  },
  ocean: {
    I: '0, 191, 255',      // Deep Sky Blue
    J: '30, 144, 255',     // Dodger Blue
    L: '64, 224, 208',     // Turquoise
    O: '72, 209, 204',     // Medium Turquoise
    S: '32, 178, 170',     // Light Sea Green
    T: '95, 158, 160',     // Cadet Blue
    Z: '0, 206, 209',      // Dark Turquoise
  },
  sunset: {
    I: '255, 99, 71',      // Tomato
    J: '255, 140, 0',      // Dark Orange
    L: '255, 69, 0',       // Orange Red
    O: '255, 215, 0',      // Gold
    S: '255, 160, 122',    // Light Salmon
    T: '255, 127, 80',     // Coral
    Z: '220, 20, 60',      // Crimson
  },
  forest: {
    I: '34, 139, 34',      // Forest Green
    J: '46, 125, 50',      // Dark Green
    L: '139, 195, 74',     // Light Green
    O: '205, 220, 57',     // Yellow Green
    S: '102, 187, 106',    // Medium Sea Green
    T: '76, 175, 80',      // Green
    Z: '156, 204, 101',    // Light Green
  }
};

const THEME_NAMES = Object.keys(BLOCK_THEMES);

// 🎨 테트로미노 기본 구조 생성 함수
const createTetrominos = (colorTheme) => ({
  0: { shape: [[0]], color: '0, 0, 0' },
  I: { shape: [[0, 'I', 0, 0], [0, 'I', 0, 0], [0, 'I', 0, 0], [0, 'I', 0, 0]], color: colorTheme.I },
  J: { shape: [[0, 'J', 0], [0, 'J', 0], ['J', 'J', 0]], color: colorTheme.J },
  L: { shape: [[0, 'L', 0], [0, 'L', 0], [0, 'L', 'L']], color: colorTheme.L },
  O: { shape: [['O', 'O'], ['O', 'O']], color: colorTheme.O },
  S: { shape: [[0, 'S', 'S'], ['S', 'S', 0], [0, 0, 0]], color: colorTheme.S },
  T: { shape: [[0, 'T', 0], ['T', 'T', 'T'], [0, 0, 0]], color: colorTheme.T },
  Z: { shape: [['Z', 'Z', 0], [0, 'Z', 'Z'], [0, 0, 0]], color: colorTheme.Z },
});

const RANDOM_TETROMINOS = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

// 💰 배당률
const PAYOUT_TABLE = {
    5000: 0.01,
    100000: 0.1,
    250000: 1.12,
    500000: 1.5,
    1000000: 1.75,
    2500000:2
};

const STAGE_WIDTH = 10;
const STAGE_HEIGHT = 20;
const BLOCK_SIZE = 26;

// 🔧 블록의 실제 너비 계산
const getTetrominoWidth = (shape) => {
  let minX = shape[0].length;
  let maxX = -1;
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x] !== 0) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
    }
  }
  return maxX - minX + 1;
};

// 🔧 블록 중앙 정렬 X 좌표 계산
const getCenterX = (shape) => {
  const width = shape[0].length;
  return Math.floor((STAGE_WIDTH - width) / 2);
};

// 빈 스테이지 생성
const createStage = () =>
  Array.from(Array(STAGE_HEIGHT), () =>
    new Array(STAGE_WIDTH).fill([0, 'clear'])
  );

// 🎒 7-bag 시스템: 7개 블록을 섞어서 반환
const generate7Bag = (TETROMINOS) => {
  const bag = [...RANDOM_TETROMINOS];
  // Fisher-Yates shuffle
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag.map(tag => TETROMINOS[tag]);
};

// 커스텀 훅 (Interval)
function useInterval(callback, delay) {
  const savedCallback = useRef();
  useEffect(() => { savedCallback.current = callback; }, [callback]);
  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export default function GameTetris() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const { t } = useLanguage();

  // 🎨 현재 블록 색상 테마
  const [TETROMINOS, setTETROMINOS] = useState(createTetrominos(BLOCK_THEMES.neon));

  const [stage, setStage] = useState(createStage());
  const [player, setPlayer] = useState({ pos: { x: 0, y: 0 }, tetromino: TETROMINOS[0].shape, collided: false });
  const [dropTime, setDropTime] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameState, setGameState] = useState('ready'); 
  const [score, setScore] = useState(0);
  const [rowsCleared, setRowsCleared] = useState(0);
  const [level, setLevel] = useState(1);
  const [clearingRows, setClearingRows] = useState([]); 

  const [nextPieces, setNextPieces] = useState([]);
  const [holdPiece, setHoldPiece] = useState(null);
  const [canHold, setCanHold] = useState(true);

  // 🎒 7-bag 시스템을 위한 bag 상태
  const [currentBag, setCurrentBag] = useState([]);
  const [bagIndex, setBagIndex] = useState(0);

  const [myPoint, setMyPoint] = useState(0);
  const [betAmount, setBetAmount] = useState(1000);
  const [resultMessage, setResultMessage] = useState("");
  const [ranks, setRanks] = useState([]);
  const betAmountRef = useRef(1000);

  // 초기화
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
              if (userSnap.exists()) setMyPoint(userSnap.data().point || 0);
          } catch (e) { console.error(e); }
      }
  };

  const fetchRanks = async () => {
    try {
      const q = query(collection(db, "game_tetris_ranks"), orderBy("score", "desc"), limit(50));
      const snap = await getDocs(q);
      const rawList = snap.docs.map(doc => doc.data());
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

  // 🎒 7-bag에서 다음 블록 가져오기
  const getNextPieceFromBag = () => {
      if (bagIndex >= currentBag.length) {
          // 현재 bag이 다 소진되면 새로운 bag 생성
          const newBag = generate7Bag(TETROMINOS);
          setCurrentBag(newBag);
          setBagIndex(1);
          return newBag[0];
      } else {
          const piece = currentBag[bagIndex];
          setBagIndex(prev => prev + 1);
          return piece;
      }
  };

  const startGame = async () => {
    const bet = parseInt(betAmount);
    if (isNaN(bet) || bet <= 0 || bet > myPoint) return alert(t.alertNoMoney || "포인트 부족");

    try {
        await updateDoc(doc(db, "users", user.uid), { point: increment(-bet) });
        setMyPoint(prev => prev - bet);
        betAmountRef.current = bet;

        await addDoc(collection(db, "history"), {
            uid: user.uid, type: "게임", msg: `🧱 ${t.g_tetris_title || '테트리스'} ${t.gameStart || "시작"}`, amount: -bet, createdAt: serverTimestamp()
        });

        // 🎨 랜덤 블록 색상 테마 선택
        const randomThemeName = THEME_NAMES[Math.floor(Math.random() * THEME_NAMES.length)];
        const newColorTheme = BLOCK_THEMES[randomThemeName];
        const newTETROMINOS = createTetrominos(newColorTheme);
        setTETROMINOS(newTETROMINOS);

        // 리셋
        setStage(createStage());
        setScore(0);
        setRowsCleared(0);
        setLevel(1);
        setGameOver(false);
        setGameState('playing');
        setHoldPiece(null);
        setCanHold(true);
        setDropTime(1000);
        setResultMessage("");

        // 🎒 7-bag 초기화 (새 테마 적용)
        const initialBag = generate7Bag(newTETROMINOS);
        setCurrentBag(initialBag);
        setBagIndex(4); // 첫 4개를 사용 (현재 블록 + next 3개)
        
        const p1 = initialBag[0];
        const p2 = initialBag[1];
        const p3 = initialBag[2];
        const p4 = initialBag[3];
        
        setNextPieces([p2, p3, p4]);
        
        // 블록 크기에 따른 중앙 정렬
        setPlayer({
            pos: { x: getCenterX(p1.shape), y: 0 },
            tetromino: p1.shape,
            collided: false
        });

    } catch (e) { alert("Error: " + e.message); }
  };

  const checkCollision = (player, stage, { x: moveX, y: moveY }) => {
    for (let y = 0; y < player.tetromino.length; y++) {
      for (let x = 0; x < player.tetromino[y].length; x++) {
        if (player.tetromino[y][x] !== 0) {
          const targetY = y + player.pos.y + moveY;
          const targetX = x + player.pos.x + moveX;
          if (targetX < 0) return true;
          if (targetX >= STAGE_WIDTH) return true;
          if (targetY >= STAGE_HEIGHT) return true;
          if (targetY < 0) continue;
          if (stage[targetY] && stage[targetY][targetX]) {
            if (stage[targetY][targetX][1] !== 'clear') return true;
          }
        }
      }
    }
    return false;
  };

  const movePlayer = (dir) => {
    if (!checkCollision(player, stage, { x: dir, y: 0 })) {
      setPlayer(prev => ({ ...prev, pos: { x: prev.pos.x + dir, y: prev.pos.y } }));
    }
  };

  const rotate = (matrix, dir) => {
    const rotated = matrix.map((_, index) => matrix.map(col => col[index]));
    if (dir > 0) return rotated.map(row => row.reverse());
    return rotated.reverse();
  };

  const playerRotate = (dir) => {
    const clonedPlayer = JSON.parse(JSON.stringify(player));
    clonedPlayer.tetromino = rotate(clonedPlayer.tetromino, dir);
    const pos = clonedPlayer.pos.x;
    let offset = 1;
    while (checkCollision(clonedPlayer, stage, { x: 0, y: 0 })) {
      clonedPlayer.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (Math.abs(offset) > clonedPlayer.tetromino[0].length) {
        rotate(clonedPlayer.tetromino, -dir);
        clonedPlayer.pos.x = pos;
        return;
      }
    }
    setPlayer(clonedPlayer);
  };

  const drop = () => {
    if (rowsCleared > level * 10) {
      const nextLevel = level + 1;
      setLevel(nextLevel);
      
      // 🔥 [속도 조정] 레벨 30부터 확 빨라지지만, 반응 가능한 수준으로 조정
      if (nextLevel >= 30) {
          // 30레벨일 때 150ms -> 40레벨일 때 100ms -> 50레벨일 때 50ms (최소 50ms)
          const fastSpeed = Math.max(50, 300 - (nextLevel * 5));
          setDropTime(fastSpeed);
      } else {
          setDropTime(1000 / (nextLevel + 1) + 200);
      }
    }
    if (!checkCollision(player, stage, { x: 0, y: 1 })) {
      setPlayer(prev => ({ ...prev, pos: { x: prev.pos.x, y: prev.pos.y + 1 } }));
    } else {
      if (player.pos.y < 1) {
        setGameOver(true);
        setGameState('finished');
        setDropTime(null);
        endGameCallback();
        return;
      }
      updateStage();
    }
  };

  const dropPlayer = () => {
    drop();
  };

  const hardDrop = () => {
      let tmpY = 0;
      while (!checkCollision(player, stage, { x: 0, y: tmpY + 1 })) {
          tmpY += 1;
      }
      const clonedPlayer = {
          ...player,
          pos: { x: player.pos.x, y: player.pos.y + tmpY },
          collided: true
      };
      updateStage(clonedPlayer);
  };

  const updateStage = (finalPlayer = player) => {
      const newStage = stage.map(row => row.map(cell => cell));
      finalPlayer.tetromino.forEach((row, y) => {
          row.forEach((value, x) => {
              if (value !== 0) {
                  const targetY = y + finalPlayer.pos.y;
                  const targetX = x + finalPlayer.pos.x;
                  if (targetY >= 0 && targetY < STAGE_HEIGHT && targetX >= 0 && targetX < STAGE_WIDTH) {
                      newStage[targetY][targetX] = [value, 'merged'];
                  }
              }
          });
      });

      const completedRows = [];
      newStage.forEach((row, index) => {
          if (row.findIndex(cell => cell[0] === 0) === -1) {
              completedRows.push(index);
          }
      });

      if (completedRows.length > 0) {
          setClearingRows(completedRows);
          setDropTime(null); // ⛔ 라인 클리어 중에는 drop 중지
          setTimeout(() => {
              const sweptStage = newStage.reduce((ack, row, index) => {
                  if (completedRows.includes(index)) {
                      ack.unshift(new Array(STAGE_WIDTH).fill([0, 'clear']));
                      return ack;
                  }
                  ack.push(row);
                  return ack;
              }, []);
              setRowsCleared(prev => prev + completedRows.length);
              const pts = [0, 100, 300, 500, 800];
              setScore(prev => prev + pts[completedRows.length] * level);
              setStage(sweptStage);
              setClearingRows([]);
              setTimeout(() => resetPlayer(), 0);
          }, 500);
      } else {
          setStage(newStage);
          setTimeout(() => resetPlayer(), 0);
      }
  };

  const resetPlayer = () => {
      const nextPiece = nextPieces[0];
      const newPiece = getNextPieceFromBag();
      const newNextPieces = [...nextPieces.slice(1), newPiece];
      setNextPieces(newNextPieces);
      const newPlayer = {
          pos: { x: getCenterX(nextPiece.shape), y: 0 },
          tetromino: nextPiece.shape,
          collided: false,
      };
      setPlayer(newPlayer);
      setCanHold(true);
      
      // 🔥 리셋 시에도 동일한 속도 로직 적용
      if (level >= 30) {
          setDropTime(Math.max(50, 300 - (level * 5)));
      } else {
          setDropTime(1000 / level + 200);
      }

      if (checkCollision(newPlayer, stage, {x:0, y:0})) {
          setGameOver(true);
          setGameState('finished');
          setDropTime(null);
          endGameCallback();
      }
  };

  const hold = () => {
      if (!canHold || gameState !== 'playing') return;
      let currentType = 'I';
      loop1:
      for(let r=0; r<player.tetromino.length; r++){
          for(let c=0; c<player.tetromino[r].length; c++){
              if(player.tetromino[r][c] !== 0) {
                  currentType = player.tetromino[r][c];
                  break loop1;
              }
          }
      }
      if (!TETROMINOS[currentType]) currentType = 'I';
      if (holdPiece === null) {
          setHoldPiece(currentType);
          resetPlayer(); 
      } else {
          const temp = holdPiece;
          const tempShape = TETROMINOS[temp].shape;
          setHoldPiece(currentType);
          setPlayer({
              pos: { x: getCenterX(tempShape), y: 0 },
              tetromino: tempShape,
              collided: false,
          });
      }
      setCanHold(false);
  };

  // 🔥 일시정지 상태면 타이머 null 전달 (일시정지 작동)
  useInterval(() => {
    drop();
  }, gameState === 'playing' ? dropTime : null);

  useEffect(() => {
      const handleKeyDown = (e) => {
          if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
          
          // ⛔ 라인 클리어 중에는 입력 무시
          if (clearingRows.length > 0) return;
          
          // P 키로 일시정지 토글
          if (e.keyCode === 80) {
              setGameState(prev => {
                  if (prev === 'playing') return 'paused';
                  if (prev === 'paused') return 'playing';
                  return prev;
              });
              return;
          }

          if(gameState !== 'playing') return;
          if (e.keyCode === 37) movePlayer(-1);
          else if (e.keyCode === 39) movePlayer(1);
          else if (e.keyCode === 40) dropPlayer();
          else if (e.keyCode === 38) playerRotate(1);
          else if (e.code === 'Space') hardDrop();
          else if (e.keyCode === 67 || e.shiftKey) hold();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const endGameCallback = async () => {
      const finalScore = score; 
      let multiplier = 0;
      const scores = Object.keys(PAYOUT_TABLE).map(Number).sort((a,b)=>b-a);
      for (let s of scores) {
          if (finalScore >= s) {
              multiplier = PAYOUT_TABLE[s];
              break;
          }
      }
      const earned = Math.floor(betAmountRef.current * multiplier);
      let msg = "";
      if (earned > 0) {
          msg = `🎉 ${t.win || '승리!'} ${finalScore.toLocaleString()} (+${earned.toLocaleString()}P)`;
          try {
              await updateDoc(doc(db, "users", user.uid), { point: increment(earned) });
              setMyPoint(prev => prev + earned);
              await addDoc(collection(db, "history"), {
                  uid: user.uid, type: "게임", msg: `🧱 ${t.g_tetris_title || '테트리스'} [${finalScore}] ${t.h_gain || '획득'}`, amount: earned, createdAt: serverTimestamp()
              });
          } catch(e) {}
      } else {
          msg = `😭 ${t.fail || '실패'}... (${finalScore.toLocaleString()})`;
      }
      setResultMessage(msg);
      if (finalScore >= 1000) {
          try {
              const userSnap = await getDoc(doc(db, "users", user.uid));
              await addDoc(collection(db, "game_tetris_ranks"), {
                  uid: user.uid, name: userSnap.data().name || "익명", score: finalScore, createdAt: serverTimestamp()
              });
              fetchRanks();
          } catch(e) {}
      }
  };

  const handleMobileControl = (action) => {
      // ⛔ 라인 클리어 중에는 입력 무시
      if (clearingRows.length > 0) return;
      
      if(gameState !== 'playing') return;
      if (action === 'L') movePlayer(-1);
      if (action === 'R') movePlayer(1);
      if (action === 'D') dropPlayer();
      if (action === 'U') playerRotate(1);
      if (action === 'H') hardDrop();
      if (action === 'S') hold();
  };

  const getGhostPos = () => {
      let ghostY = player.pos.y;
      while (!checkCollision(player, stage, { x: 0, y: (ghostY - player.pos.y) + 1 })) {
          ghostY += 1;
      }
      return { x: player.pos.x, y: ghostY };
  };

  const renderBoard = () => {
      const board = stage.map((row, rowIndex) => row.map(cell => ({ 
          type: cell[0], 
          status: clearingRows.includes(rowIndex) ? 'clearing' : cell[1] 
      })));
      
      if (gameState === 'playing' && !player.collided) {
          const ghost = getGhostPos();
          player.tetromino.forEach((row, y) => {
              row.forEach((value, x) => {
                  if (value !== 0) {
                      const ty = y + ghost.y;
                      const tx = x + ghost.x;
                      if (ty >= 0 && ty < STAGE_HEIGHT && tx >= 0 && tx < STAGE_WIDTH) {
                          if (board[ty][tx].type === 0 && !clearingRows.includes(ty)) {
                              board[ty][tx] = { type: value, status: 'ghost' };
                          }
                      }
                  }
              });
          });
          player.tetromino.forEach((row, y) => {
              row.forEach((value, x) => {
                  if (value !== 0) {
                      const ty = y + player.pos.y;
                      const tx = x + player.pos.x;
                      if (ty >= 0 && ty < STAGE_HEIGHT && tx >= 0 && tx < STAGE_WIDTH) {
                          if (!clearingRows.includes(ty)) {
                              board[ty][tx] = { type: value, status: 'active' };
                          }
                      }
                  }
              });
          });
      }
      return board;
  };

  const currentBoard = renderBoard();

  return (
    <>
      <style>{`
        @keyframes lineFlash {
          0% { background: white; box-shadow: 0 0 20px rgba(255, 255, 255, 1), inset 0 0 20px rgba(255, 255, 255, 0.8); }
          50% { background: rgba(255, 255, 100, 1); box-shadow: 0 0 30px rgba(255, 255, 100, 1), inset 0 0 30px rgba(255, 255, 100, 0.9); }
          100% { background: white; box-shadow: 0 0 40px rgba(255, 255, 255, 1), inset 0 0 40px rgba(255, 255, 255, 1); }
        }
      `}</style>
    <div className="container" style={{ background: 'linear-gradient(135deg, #1e3c72, #2a5298)', minHeight: '100vh', padding: '10px 5px', display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none', color:'white' }}>
      
      {/* 헤더 */}
      <div style={{width: '100%', maxWidth: '400px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)', padding: '12px 20px', borderRadius: 15, border: '1px solid rgba(255,255,255,0.1)', boxShadow:'0 8px 20px rgba(0,0,0,0.3)'}}>
         <button onClick={() => navigate('/home')} style={{background:'rgba(255, 107, 107, 0.8)', fontSize:12, padding:'8px 16px', color:'white', border:'none', borderRadius:20, fontWeight:'bold', cursor:'pointer', boxShadow:'0 2px 5px rgba(0,0,0,0.2)'}}>{t.home || 'HOME'}</button>
         <div style={{textAlign:'right'}}>
             <div style={{fontSize:11, color:'#aaa', letterSpacing:'1px'}}>{t.g_score || "SCORE"}</div>
             <div style={{fontWeight:'bold', color:'#feca57', fontSize:22, textShadow:'0 0 10px rgba(254, 202, 87, 0.5)'}}>{score.toLocaleString()}</div>
         </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', maxWidth: '500px', width: '100%', justifyContent: 'center' }}>
          
          {/* HOLD 패널 */}
          <div style={{display:'flex', flexDirection:'column', gap: 10, width: '75px'}}>
              <div style={{background:'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(5px)', padding: '10px 5px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', textAlign:'center', height: '80px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
                  <div style={{fontSize:10, fontWeight:'bold', color:'#a29bfe', marginBottom:5, letterSpacing:'1px'}}>{t.g_hold || "HOLD"}</div>
                  {holdPiece ? <MiniBoard piece={holdPiece} TETROMINOS={TETROMINOS} /> : <div style={{fontSize:20, color:'#555'}}>-</div>}
              </div>
              <div style={{background:'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(5px)', padding: '10px 5px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', textAlign:'center', flex:1, display:'flex', flexDirection:'column', justifyContent:'center'}}>
                  <div style={{fontSize:10, fontWeight:'bold', color:'#aaa'}}>{t.g_level || "LEVEL"}</div>
                  <div style={{fontSize:20, fontWeight:'bold', color:'#fff', textShadow:'0 0 5px white'}}>{level}</div>
                  <div style={{height:15}} />
                  <div style={{fontSize:10, fontWeight:'bold', color:'#aaa'}}>{t.g_lines || "LINES"}</div>
                  <div style={{fontSize:20, fontWeight:'bold', color:'#55efc4', textShadow:'0 0 5px #55efc4'}}>{rowsCleared}</div>
              </div>
          </div>

          {/* 메인 보드 */}
          <div style={{border: '2px solid rgba(255,255,255,0.1)', borderRadius: 10, width: STAGE_WIDTH * BLOCK_SIZE, height: STAGE_HEIGHT * BLOCK_SIZE, background: 'rgba(0, 0, 0, 0.6)', position: 'relative', boxShadow: '0 0 30px rgba(0,0,0,0.5)', overflow: 'visible'}}>
              <div style={{display: 'grid', gridTemplateRows: `repeat(${STAGE_HEIGHT}, ${BLOCK_SIZE}px)`, gridTemplateColumns: `repeat(${STAGE_WIDTH}, ${BLOCK_SIZE}px)`, width: STAGE_WIDTH * BLOCK_SIZE, height: STAGE_HEIGHT * BLOCK_SIZE, gap: 0, padding: 0, margin: 0}}>
                  {currentBoard.map((row, y) => row.map((cell, x) => <Cell key={`${y}-${x}`} type={cell.type} status={cell.status} TETROMINOS={TETROMINOS} />))}
              </div>
              {gameState !== 'playing' && (
                  <div style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', background:'rgba(20, 20, 30, 0.9)', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', zIndex:10, backdropFilter: 'blur(5px)'}}>
                      {gameState === 'ready' && (
                          <>
                            <h2 style={{color:'#48dbfb', fontSize:32, margin:0, textShadow:'0 0 15px #48dbfb', letterSpacing:'2px'}}>{t.g_tetris_title || "TETRIS"}</h2>
                            
                            {/* 배당표 */}
                            <div style={{background:'rgba(255,255,255,0.1)', padding:'12px', borderRadius:8, margin:'15px 0', width:'80%', fontSize:12, color:'#ddd'}}>
                                <div style={{fontWeight:'bold', borderBottom:'1px solid #555', paddingBottom:5, marginBottom:5, textAlign:'center'}}>{t.probTable || "Payout Table"}</div>
                                {Object.keys(PAYOUT_TABLE).map(score => (
                                    <div key={score} style={{display:'flex', justifyContent:'space-between', padding:'2px 0'}}>
                                        <span>{Number(score).toLocaleString()}+</span>
                                        <span style={{fontWeight:'bold', color:'#feca57'}}>x{PAYOUT_TABLE[score]}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{margin:'10px 0', width:'80%'}}>
                                <label style={{display:'block', fontSize:12, marginBottom:8, color:'#ccc', fontWeight:'bold'}}>{t.betAmount || "Bet Amount"}</label>
                                <input type="number" value={betAmount} onChange={(e)=>setBetAmount(e.target.value)} step="1000" style={{width:'100%', padding:'12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.05)', color:'white', textAlign:'center', fontSize:18, fontWeight:'bold', boxSizing:'border-box'}} />
                            </div>
                            <button onClick={startGame} style={{background:'linear-gradient(90deg, #48dbfb 0%, #0abde3 100%)', color:'white', border:'none', padding:'15px 50px', borderRadius:30, fontWeight:'bold', fontSize:18, cursor:'pointer', boxShadow:'0 10px 20px rgba(72, 219, 251, 0.3)', transition:'transform 0.2s', marginTop:10}}>{t.gameStart || "START"}</button>
                          </>
                      )}
                      {gameState === 'paused' && (
                          <>
                            <h2 style={{color:'white', letterSpacing:'2px'}}>{t.g_paused || "PAUSED"}</h2>
                            <button onClick={()=>setGameState('playing')} style={{background:'#5f27cd', color:'white', border:'none', padding:'12px 40px', borderRadius:25, marginTop:20, cursor:'pointer', fontWeight:'bold', boxShadow:'0 5px 15px rgba(95, 39, 205, 0.4)'}}>{t.g_resume || "RESUME"}</button>
                          </>
                      )}
                      {gameState === 'finished' && (
                          <>
                            <h2 style={{color: resultMessage.includes("Win") ? '#2ecc71' : '#ff6b6b', fontSize:28, textShadow:'0 0 10px rgba(0,0,0,0.5)'}}>{resultMessage.includes("Win") ? (t.win || "WINNER") : (t.lose || "GAME OVER")}</h2>
                            <p style={{margin:'15px 0', fontWeight:'bold', fontSize:14, color:'#ddd'}}>{resultMessage}</p>
                            <button onClick={()=>setGameState('ready')} style={{background:'rgba(255,255,255,0.1)', color:'white', border:'1px solid rgba(255,255,255,0.3)', padding:'10px 30px', borderRadius:20, marginTop:15, cursor:'pointer', fontWeight:'bold'}}>{t.playAgain || "RETRY"}</button>
                          </>
                      )}
                  </div>
              )}
          </div>

          {/* NEXT 패널 */}
          <div style={{width: '75px', background:'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(5px)', padding: '10px 5px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', textAlign:'center', height: '220px', display:'flex', flexDirection:'column', alignItems:'center'}}>
              <div style={{fontSize:10, fontWeight:'bold', color:'#48dbfb', marginBottom:15, letterSpacing:'1px'}}>{t.g_next || "NEXT"}</div>
              <div style={{display:'flex', flexDirection:'column', gap:12}}>
                  {nextPieces.map((p, i) => <MiniBoard key={i} pieceObj={p} />)}
              </div>
          </div>
      </div>



      {/* 랭킹 */}
      <div style={{width: '100%', maxWidth: '500px', marginTop: 25, background: 'rgba(0,0,0,0.2)', padding: 15, borderRadius: 15, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(5px)'}}>
          <h3 style={{textAlign:'center', margin:'0 0 15px 0', borderBottom:'1px solid rgba(255,255,255,0.1)', paddingBottom:10, fontSize: 16, color: '#feca57', letterSpacing:'1px'}}>🏆 {t.rank || "TOP RANKING"}</h3>
          <ul style={{listStyle:'none', padding:0, margin:0}}>
              {ranks.map((r, i) => (
                  <li key={i} style={{display:'flex', justifyContent:'space-between', padding:'8px 5px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize:14, color: i < 3 ? '#fff' : '#aaa'}}>
                      <span style={{color: i===0?'#ffd700': i===1?'#c0c0c0': i===2?'#cd7f32':'#aaa'}}>{i+1}. {r.name}</span>
                      <span style={{fontWeight:'bold'}}>{r.score.toLocaleString()}</span>
                  </li>
              ))}
          </ul>
      </div>
    </div>
    </>
  );
}

// 🎨 렌더링 컴포넌트
const Cell = React.memo(({ type, status, TETROMINOS }) => {
    const color = (type !== 0 && TETROMINOS[type]) ? TETROMINOS[type].color : '0, 0, 0';
    const isFilled = type !== 0;
    const isGhost = status === 'ghost';
    const isClearing = status === 'clearing';
    
    const style = {
        width: `${BLOCK_SIZE}px`,
        height: `${BLOCK_SIZE}px`,
        borderRadius: '2px',
        transition: 'none',
        boxSizing: 'border-box'
    };

    if (isClearing) {
        style.background = 'white';
        style.border = '1px solid rgba(255, 255, 255, 1)';
        style.boxShadow = '0 0 20px rgba(255, 255, 255, 1), inset 0 0 20px rgba(255, 255, 255, 0.8)';
        style.animation = 'lineFlash 0.5s ease-in-out';
    } else if (isFilled) {
        if (isGhost) {
            style.border = `1px solid rgba(${color}, 0.5)`;
            style.background = `rgba(${color}, 0.1)`;
            style.boxShadow = `inset 0 0 5px rgba(${color}, 0.2)`;
        } else {
            style.background = `rgba(${color}, 0.8)`;
            style.border = `1px solid rgba(255,255,255,0.5)`;
            style.boxShadow = `0 0 8px rgba(${color}, 0.8), inset 0 0 5px rgba(255,255,255,0.3)`;
        }
    } else {
        style.border = '1px solid rgba(255,255,255,0.03)';
        style.background = 'transparent';
    }

    return <div style={style} />;
});

const MiniBoard = ({ piece, pieceObj, TETROMINOS }) => {
    let shape, color;
    if (pieceObj && pieceObj.shape) {
        shape = pieceObj.shape;
        color = pieceObj.color;
    } else if (piece && TETROMINOS && TETROMINOS[piece]) {
        shape = TETROMINOS[piece].shape;
        color = TETROMINOS[piece].color;
    } else {
        return null;
    }

    return (
        <div style={{
            display:'grid', 
            gridTemplateRows:`repeat(${shape.length}, 12px)`,
            gridTemplateColumns:`repeat(${shape[0].length}, 12px)`,
            gap: 1, justifyContent: 'center'
        }}>
            {shape.map((row, y) => row.map((cell, x) => (
                <div key={`${x}-${y}`} style={{
                    width: 12, height: 12,
                    background: cell !== 0 ? `rgb(${color})` : 'transparent',
                    borderRadius: 2,
                    boxShadow: cell !== 0 ? `0 0 4px rgba(${color}, 0.8)` : 'none'
                }} />
            )))}
        </div>
    );
}