// import React, { useState, useEffect, useRef } from 'react';
// import { db } from '../../firebase'; 
// import { doc, updateDoc, runTransaction, increment, addDoc, collection, serverTimestamp, deleteDoc } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';

// // 🍎 사과 아이콘 컴포넌트
// const AppleIcon = ({ value, active }) => (
//   <div className={`apple ${active ? 'active' : 'popped'}`}>
//     {active && (
//       <div className="apple-inner">
//         <span className="apple-number">{value}</span>
//         <div className="apple-shine"></div>
//         <div className="apple-stem"></div>
//       </div>
//     )}
//   </div>
// );

// // 🛠️ 게임 설정 (요청하신 대로 17x10)
// const ROWS = 10;
// const COLS = 17; 
// const GAME_TIME = 60; // 60초

// export default function Applegame({ room, user, myRole }) {
//   const navigate = useNavigate();
//   const gd = room.gameData;
//   const isFinished = room.status === 'finished';

//   // 내 정보 & 참가자 확인
//   const myPlayer = gd.players?.find(p => p.uid === user.uid);
//   const participants = gd.players?.filter(p => p.uid !== room.host) || [];
//   const allParticipantsReady = participants.length > 0 && participants.every(p => p.ready);

//   // 상태 관리
//   const [board, setBoard] = useState([]);
//   const [scores, setScores] = useState({});
//   const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  
//   // 드래그 관련
//   const [isDragging, setIsDragging] = useState(false);
//   const [startIndex, setStartIndex] = useState(null);
//   const [selectedIndices, setSelectedIndices] = useState([]);
//   const [currentSum, setCurrentSum] = useState(0);

//   // 🔄 데이터 동기화
//   useEffect(() => {
//     if (gd.board) setBoard(gd.board);
//     if (gd.scores) setScores(gd.scores);

//     if (gd.state === 'playing' && gd.endTime) {
//       const interval = setInterval(() => {
//         const now = Date.now();
//         const end = gd.endTime.toMillis ? gd.endTime.toMillis() : gd.endTime;
//         const remain = Math.max(0, Math.floor((end - now) / 1000));
//         setTimeLeft(remain);

//         if (remain === 0 && myRole === 'host' && !isFinished) {
//            handleTimeOver();
//         }
//       }, 1000);
//       return () => clearInterval(interval);
//     }
//   }, [gd, myRole, isFinished]);

//   // 🏁 게임 종료 (타임오버)
//   const handleTimeOver = () => {
//     const sortedPlayers = gd.players.slice().sort((a, b) => {
//         const scoreA = gd.scores?.[a.uid] || 0;
//         const scoreB = gd.scores?.[b.uid] || 0;
//         return scoreB - scoreA;
//     });
//     const winnerUid = sortedPlayers[0].uid;
//     endGame(winnerUid, "사과게임 승리");
//   };

//   // 🏁 게임 종료 처리 (상금 지급)
//   const endGame = async (winnerUid, reason) => {
//     if (isFinished) return;
    
//     await runTransaction(db, async (t) => {
//         const roomRef = doc(db, "battle_rooms", room.id);
//         const winRef = doc(db, "users", winnerUid);
//         const totalPot = room.betAmount * gd.players.length;

//         t.update(winRef, { point: increment(totalPot) });

//         const finishPlayers = gd.players.map(p => ({ ...p, ready: false }));

//         t.update(roomRef, {
//             "gameData.state": "result",
//             winner: winnerUid,
//             status: 'finished',
//             "gameData.players": finishPlayers
//         });
//     });

//     const totalPot = room.betAmount * gd.players.length;
//     await addDoc(collection(db, "history"), {
//         uid: winnerUid, type: "게임", msg: `${reason} (상금)`, amount: totalPot, createdAt: serverTimestamp()
//     });
//   };

//   // ⚡ 게임 시작
//   const startGame = async () => {
//     // 170개의 사과 생성 (1~9 랜덤)
//     const newBoard = Array.from({ length: ROWS * COLS }, (_, i) => ({
//       id: i,
//       value: Math.floor(Math.random() * 9) + 1,
//       active: true
//     }));

//     const initialScores = {};
//     gd.players.forEach(p => initialScores[p.uid] = 0);

//     const endTime = new Date();
//     endTime.setSeconds(endTime.getSeconds() + GAME_TIME);

//     await updateDoc(doc(db, "battle_rooms", room.id), {
//         "gameData.state": "playing",
//         "gameData.board": newBoard,
//         "gameData.scores": initialScores,
//         "gameData.endTime": endTime
//     });
//   };

//   // 🔄 준비 / 재대결 / 나가기
//   const toggleReady = async () => {
//       const newPlayers = gd.players.map(p => p.uid === user.uid ? { ...p, ready: !p.ready } : p);
//       await updateDoc(doc(db, "battle_rooms", room.id), { "gameData.players": newPlayers });
//   };

//   const restartGame = async () => {
//     if (!allParticipantsReady) return;
//     try {
//         await runTransaction(db, async (t) => {
//             const playerDocs = [];
//             for (const p of gd.players) {
//                 const pRef = doc(db, "users", p.uid);
//                 const pSnap = await t.get(pRef);
//                 if (!pSnap.exists()) throw new Error(`${p.name}님의 정보가 없습니다.`);
//                 playerDocs.push({ ref: pRef, data: pSnap.data(), name: p.name });
//             }
//             for (const pDoc of playerDocs) {
//                 if (pDoc.data.point < room.betAmount) throw new Error(`${pDoc.name}님의 잔액이 부족합니다.`);
//             }
//             for (const pDoc of playerDocs) {
//                 t.update(pDoc.ref, { point: increment(-room.betAmount) });
//             }
//             const resetPlayers = gd.players.map(p => ({ ...p, ready: false }));
//             const roomRef = doc(db, "battle_rooms", room.id);
//             t.update(roomRef, {
//                 status: 'playing',
//                 winner: null,
//                 "gameData.state": "ready",
//                 "gameData.players": resetPlayers,
//                 "gameData.scores": {},
//                 "gameData.board": []
//             });
//         });
//         await addDoc(collection(db, "history"), {
//             uid: user.uid, type: "게임", msg: "사과게임 재대결 (배팅)", amount: -room.betAmount, createdAt: serverTimestamp()
//         });
//     } catch (e) { alert("재대결 실패: " + e.message); }
//   };

//   const leaveGame = async () => {
//       if(myRole === 'host') {
//           if(window.confirm("방을 폭파하시겠습니까?")) {
//               await deleteDoc(doc(db, "battle_rooms", room.id));
//               navigate('/gamelobby');
//           }
//       } else {
//           navigate('/gamelobby'); 
//       }
//   };

//   // --- 🖱️ 드래그 로직 ---
//   const getRectIndices = (start, current) => {
//     const startRow = Math.floor(start / COLS);
//     const startCol = start % COLS;
//     const curRow = Math.floor(current / COLS);
//     const curCol = current % COLS;

//     const minRow = Math.min(startRow, curRow);
//     const maxRow = Math.max(startRow, curRow);
//     const minCol = Math.min(startCol, curCol);
//     const maxCol = Math.max(startCol, curCol);

//     const indices = [];
//     let sum = 0;
//     for (let r = minRow; r <= maxRow; r++) {
//       for (let c = minCol; c <= maxCol; c++) {
//         const idx = r * COLS + c;
//         indices.push(idx);
//         if (board[idx]?.active) sum += board[idx].value;
//       }
//     }
//     return { indices, sum };
//   };

//   const handlePointerDown = (index) => {
//     if (gd.state !== 'playing') return;
//     setIsDragging(true);
//     setStartIndex(index);
//     const { indices, sum } = getRectIndices(index, index);
//     setSelectedIndices(indices);
//     setCurrentSum(sum);
//   };

//   const handlePointerEnter = (index) => {
//     if (!isDragging) return;
//     const { indices, sum } = getRectIndices(startIndex, index);
//     setSelectedIndices(indices);
//     setCurrentSum(sum);
//   };

//   const handlePointerUp = async () => {
//     if (!isDragging) return;
//     setIsDragging(false);
//     if (currentSum === 10) await processSuccess(selectedIndices);
//     setSelectedIndices([]);
//     setStartIndex(null);
//     setCurrentSum(0);
//   };

//   // 🔥 사과 먹기 (트랜잭션)
//   const processSuccess = async (indices) => {
//     const roomRef = doc(db, "battle_rooms", room.id);
//     try {
//       await runTransaction(db, async (transaction) => {
//         const sfDoc = await transaction.get(roomRef);
//         if (!sfDoc.exists()) return;
//         const data = sfDoc.data();
//         const serverBoard = data.gameData.board;
//         const isAllAlive = indices.every(idx => serverBoard[idx].active);

//         if (isAllAlive) {
//           indices.forEach(idx => serverBoard[idx].active = false);
//           const newScores = { ...data.gameData.scores };
//           newScores[user.uid] = (newScores[user.uid] || 0) + indices.length;
//           transaction.update(roomRef, { 
//             "gameData.board": serverBoard,
//             "gameData.scores": newScores
//           });
//         }
//       });
//     } catch (e) { console.error("사과 먹기 실패:", e); }
//   };

//   return (
//     <div 
//       className="apple-game-wrapper"
//       onPointerUp={handlePointerUp}
//       style={{
//         width: '100%', minHeight: '600px', background: '#dcedc8', borderRadius: 15,
//         display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px',
//         position: 'relative', userSelect: 'none', touchAction: 'none',
//         backgroundImage: 'linear-gradient(#c5e1a5 1px, transparent 1px), linear-gradient(90deg, #c5e1a5 1px, transparent 1px)',
//         backgroundSize: '20px 20px'
//       }}
//     >
//       {/* 🟢 대기 화면 */}
//       {gd.state === 'ready' && !isFinished && (
//          <div style={{position:'absolute', inset:0, background:'rgba(220, 237, 200, 0.95)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 10, borderRadius:15}}>
//              <h1 style={{color: '#e74c3c', fontSize: '40px', marginBottom: '10px'}}>🍎 사과 게임</h1>
//              <h3 style={{marginBottom: '30px', color: '#555'}}>드래그해서 합을 10으로 만드세요!</h3>
             
//              <div style={{display:'flex', gap:10, marginBottom:30, flexWrap:'wrap', justifyContent:'center'}}>
//                  {gd.players.map((p, i) => (
//                     <div key={i} style={{background: p.ready ? '#27ae60' : '#95a5a6', padding:'10px 15px', borderRadius:8, color: 'white', border: p.uid===room.host ? '2px solid #f1c40f' : 'none'}}>
//                         <div>{p.name}</div>
//                         <div style={{fontSize:12}}>{p.ready ? '✅ 준비됨' : '⏳ 대기중'}</div>
//                     </div>
//                  ))}
//              </div>
//              <div style={{display:'flex', gap:10}}>
//                  {myRole === 'host' ? (
//                      <>
//                         <button className="btn" disabled={!allParticipantsReady || gd.players.length < 2} 
//                             style={{background: (allParticipantsReady && gd.players.length >= 2) ? '#e74c3c' : '#95a5a6', color: 'white', padding: '15px 30px', fontSize: 18}} 
//                             onClick={startGame}>{(gd.players.length < 2) ? "인원 부족" : "🍎 게임 시작"}</button>
//                         <button className="btn" style={{background:'#555', padding: '15px 30px', fontSize: 18}} onClick={leaveGame}>나가기</button>
//                      </>
//                  ) : (
//                      <>
//                         <button className="btn" style={{background: myPlayer?.ready ? '#e74c3c' : '#27ae60', padding: '15px 30px', fontSize: 18, color: 'white'}} onClick={toggleReady}>{myPlayer?.ready ? "준비 취소" : "준비 완료"}</button>
//                         <button className="btn" style={{background:'#555', padding: '15px 30px', fontSize: 18}} onClick={leaveGame}>나가기</button>
//                      </>
//                  )}
//              </div>
//          </div>
//       )}

//       {/* 🎮 게임 보드 */}
//       {gd.state === 'playing' && (
//         <>
//             <div style={{display:'flex', justifyContent:'space-between', width:'100%', maxWidth:'850px', marginBottom:10, background:'rgba(255,255,255,0.9)', padding:10, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.1)'}}>
//                 <div style={{fontSize:20, fontWeight:'bold', color:'#e74c3c'}}>⏰ {timeLeft}초</div>
//                 <div style={{display:'flex', gap:10, overflowX:'auto'}}>
//                     {Object.entries(scores || {}).sort(([,a],[,b])=>b-a).map(([uid, score], i) => {
//                         const pName = gd.players.find(p=>p.uid===uid)?.name || '???';
//                         return <div key={uid} style={{color: uid===user.uid ? '#2980b9' : '#555', fontWeight: uid===user.uid?'bold':'normal'}}>#{i+1} {pName}: {score}</div>
//                     })}
//                 </div>
//             </div>

//             <div className="apple-grid" onPointerLeave={handlePointerUp}>
//                 {board.map((apple, index) => (
//                     <div 
//                         key={index} 
//                         className={`grid-cell ${selectedIndices.includes(index) ? 'selected' : ''}`}
//                         onPointerDown={() => handlePointerDown(index)}
//                         onPointerEnter={() => handlePointerEnter(index)}
//                     >
//                         <AppleIcon value={apple.value} active={apple.active} />
//                     </div>
//                 ))}
//             </div>

//             {isDragging && (
//                 <div style={{position:'absolute', top: 70, left:'50%', transform:'translateX(-50%)', background: currentSum===10 ? '#2ecc71' : '#e74c3c', color:'white', padding:'5px 20px', borderRadius:20, fontWeight:'bold', boxShadow:'0 4px 10px rgba(0,0,0,0.3)', zIndex:50}}>
//                     합계: {currentSum}
//                 </div>
//             )}
//         </>
//       )}

//       {/* 🏆 결과 화면 */}
//       {isFinished && (
//         <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', zIndex:20, borderRadius:15}} onPointerDown={e=>e.stopPropagation()}>
//             <h1 style={{color:'#f1c40f', fontSize:40, marginBottom:10}}>🏆 WINNER 🏆</h1>
//             <h2 style={{color:'white', marginBottom:30}}>
//                 {gd.players.find(p => p.uid === room.winner)?.name} 
//                 <span style={{color:'#2ecc71', fontSize:20, marginLeft:10}}>(+{(room.betAmount * gd.players.length).toLocaleString()}원)</span>
//             </h2>
//             <div style={{background:'rgba(255,255,255,0.1)', padding:20, borderRadius:10, marginBottom:30, width:'80%', maxWidth:'400px'}}>
//                 {gd.players.slice().sort((a,b) => (gd.scores?.[b.uid]||0) - (gd.scores?.[a.uid]||0)).map((p, i) => (
//                     <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'10px', borderBottom:'1px solid #555', color: 'white'}}>
//                         <span style={{color: i===0 ? '#f1c40f' : 'white', fontWeight: i===0 ? 'bold' : 'normal'}}>#{i+1} {p.name}</span>
//                         <span>{gd.scores?.[p.uid] || 0}점</span>
//                     </div>
//                 ))}
//             </div>
//             <div style={{display:'flex', gap:15}}>
//                 {myRole === 'host' ? (
//                     <>
//                         <button className="btn" disabled={!allParticipantsReady} style={{background: allParticipantsReady ? '#2980b9' : '#7f8c8d', padding:'15px 30px', fontSize:18, color:'white'}} onClick={restartGame}>{allParticipantsReady ? "🔄 한 판 더" : "⏳ 대기중..."}</button>
//                         <button className="btn" style={{background:'#c0392b', padding:'15px 30px', fontSize:18}} onClick={leaveGame}>🏠 방 폭파</button>
//                     </>
//                 ) : (
//                     <>
//                         <button className="btn" style={{background: myPlayer?.ready ? '#e74c3c' : '#27ae60', padding:'15px 30px', fontSize:18, color:'white'}} onClick={toggleReady}>{myPlayer?.ready ? "취소" : "준비 완료"}</button>
//                         <button className="btn" style={{background:'#555', padding:'15px 30px', fontSize:18}} onClick={leaveGame}>🏠 나가기</button>
//                     </>
//                 )}
//             </div>
//         </div>
//       )}

//       {/* 스타일 */}
//       <style>{`
//         .apple-grid {
//             display: grid;
//             grid-template-columns: repeat(${COLS}, 1fr);
//             gap: 2px;
//             padding: 5px;
//             width: 100%;
//             /* 🚀 너비를 850px까지 늘려서 17칸이어도 사과가 작지 않게 수정함 */
//             max-width: 850px; 
//         }
//         .grid-cell {
//             aspect-ratio: 1;
//             position: relative;
//             cursor: pointer;
//             display: flex; justifyContent: center; alignItems: center;
//             border-radius: 4px;
//         }
//         .grid-cell.selected {
//             background: rgba(52, 152, 219, 0.4);
//             border: 2px solid #3498db;
//         }
//         .apple { width: 100%; height: 100%; display: flex; justify-content: center; alignItems: center; transition: transform 0.2s; }
//         .apple.popped { transform: scale(0); opacity: 0; }
        
//         .apple-inner {
//             width: 85%; height: 85%;
//             background: radial-gradient(circle at 30% 30%, #ff5252, #c0392b);
//             border-radius: 50% 50% 40% 40%;
//             display: flex; justify-content: center; alignItems: center;
//             position: relative;
//             box-shadow: 0 2px 5px rgba(0,0,0,0.2);
//         }
//         .apple-number { color: white; font-weight: 900; font-size: clamp(10px, 1.5vw, 24px); text-shadow: 1px 1px 0 rgba(0,0,0,0.3); z-index: 2; }
//         .apple-shine { position: absolute; top: 15%; left: 15%; width: 25%; height: 25%; background: rgba(255,255,255,0.4); border-radius: 50%; }
//         .apple-stem { position: absolute; top: -15%; left: 50%; width: 4px; height: 10px; background: #795548; transform: translateX(-50%) rotate(15deg); border-radius: 2px; }
//         .apple-stem::after { content: ''; position: absolute; top: 2px; left: 2px; width: 12px; height: 6px; background: #4caf50; border-radius: 10px 0; transform: rotate(-30deg); }
//       `}</style>
//     </div>
//   );
// }



import React, { useState, useEffect } from 'react';
import { db } from '../../firebase'; 
import { doc, updateDoc, runTransaction, increment, addDoc, collection, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../LanguageContext'; // 👈

const AppleIcon = ({ value, active }) => (
  <div className={`apple ${active ? 'active' : 'popped'}`}>
    {active && (
      <div className="apple-inner">
        <span className="apple-number">{value}</span>
        <div className="apple-shine"></div>
        <div className="apple-stem"></div>
      </div>
    )}
  </div>
);

const ROWS = 10;
const COLS = 17; 
const GAME_TIME = 60; 

export default function Applegame({ room, user, myRole }) {
  const navigate = useNavigate();
  const gd = room.gameData;
  const isFinished = room.status === 'finished';
  const { t } = useLanguage(); // 👈

  const myPlayer = gd.players?.find(p => p.uid === user.uid);
  const participants = gd.players?.filter(p => p.uid !== room.host) || [];
  const allParticipantsReady = participants.length > 0 && participants.every(p => p.ready);

  const [board, setBoard] = useState([]);
  const [scores, setScores] = useState({});
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  
  const [isDragging, setIsDragging] = useState(false);
  const [startIndex, setStartIndex] = useState(null);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [currentSum, setCurrentSum] = useState(0);

  useEffect(() => {
    if (gd.board) setBoard(gd.board);
    if (gd.scores) setScores(gd.scores);

    if (gd.state === 'playing' && gd.endTime) {
      const interval = setInterval(() => {
        const now = Date.now();
        const end = gd.endTime.toMillis ? gd.endTime.toMillis() : gd.endTime;
        const remain = Math.max(0, Math.floor((end - now) / 1000));
        setTimeLeft(remain);

        if (remain === 0 && myRole === 'host' && !isFinished) {
           handleTimeOver();
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gd, myRole, isFinished]);

  const handleTimeOver = () => {
    const sortedPlayers = gd.players.slice().sort((a, b) => {
        const scoreA = gd.scores?.[a.uid] || 0;
        const scoreB = gd.scores?.[b.uid] || 0;
        return scoreB - scoreA;
    });
    const winnerUid = sortedPlayers[0].uid;
    endGame(winnerUid, "사과게임 승리");
  };

  const endGame = async (winnerUid, reason) => {
    if (isFinished) return;
    
    await runTransaction(db, async (t) => {
        const roomRef = doc(db, "battle_rooms", room.id);
        const winRef = doc(db, "users", winnerUid);
        const totalPot = room.betAmount * gd.players.length;

        t.update(winRef, { point: increment(totalPot) });

        const finishPlayers = gd.players.map(p => ({ ...p, ready: false }));

        t.update(roomRef, {
            "gameData.state": "result",
            winner: winnerUid,
            status: 'finished',
            "gameData.players": finishPlayers
        });
    });

    const totalPot = room.betAmount * gd.players.length;
    await addDoc(collection(db, "history"), {
        uid: winnerUid, type: "게임", msg: `${reason} (상금)`, amount: totalPot, createdAt: serverTimestamp()
    });
  };

  const startGame = async () => {
    const newBoard = Array.from({ length: ROWS * COLS }, (_, i) => ({
      id: i,
      value: Math.floor(Math.random() * 9) + 1,
      active: true
    }));

    const initialScores = {};
    gd.players.forEach(p => initialScores[p.uid] = 0);

    const endTime = new Date();
    endTime.setSeconds(endTime.getSeconds() + GAME_TIME);

    await updateDoc(doc(db, "battle_rooms", room.id), {
        "gameData.state": "playing",
        "gameData.board": newBoard,
        "gameData.scores": initialScores,
        "gameData.endTime": endTime
    });
  };

  const toggleReady = async () => {
      const newPlayers = gd.players.map(p => p.uid === user.uid ? { ...p, ready: !p.ready } : p);
      await updateDoc(doc(db, "battle_rooms", room.id), { "gameData.players": newPlayers });
  };

  const restartGame = async () => {
    if (!allParticipantsReady) return;
    try {
        await runTransaction(db, async (t) => {
            const playerDocs = [];
            for (const p of gd.players) {
                const pRef = doc(db, "users", p.uid);
                const pSnap = await t.get(pRef);
                if (!pSnap.exists()) throw new Error(`${p.name} Info Error`);
                playerDocs.push({ ref: pRef, data: pSnap.data(), name: p.name });
            }
            for (const pDoc of playerDocs) {
                if (pDoc.data.point < room.betAmount) throw new Error(`${pDoc.name} No Money`);
            }
            for (const pDoc of playerDocs) {
                t.update(pDoc.ref, { point: increment(-room.betAmount) });
            }
            const resetPlayers = gd.players.map(p => ({ ...p, ready: false }));
            const roomRef = doc(db, "battle_rooms", room.id);
            t.update(roomRef, {
                status: 'playing',
                winner: null,
                "gameData.state": "ready",
                "gameData.players": resetPlayers,
                "gameData.scores": {},
                "gameData.board": []
            });
        });
        await addDoc(collection(db, "history"), {
            uid: user.uid, type: "게임", msg: "사과게임 재대결", amount: -room.betAmount, createdAt: serverTimestamp()
        });
    } catch (e) { alert("Error: " + e.message); }
  };

  const leaveGame = async () => {
      if(myRole === 'host') {
          if(window.confirm("Destroy room?")) {
              await deleteDoc(doc(db, "battle_rooms", room.id));
              navigate('/gamelobby');
          }
      } else {
          navigate('/gamelobby'); 
      }
  };

  const getRectIndices = (start, current) => {
    const startRow = Math.floor(start / COLS);
    const startCol = start % COLS;
    const curRow = Math.floor(current / COLS);
    const curCol = current % COLS;

    const minRow = Math.min(startRow, curRow);
    const maxRow = Math.max(startRow, curRow);
    const minCol = Math.min(startCol, curCol);
    const maxCol = Math.max(startCol, curCol);

    const indices = [];
    let sum = 0;
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const idx = r * COLS + c;
        indices.push(idx);
        if (board[idx]?.active) sum += board[idx].value;
      }
    }
    return { indices, sum };
  };

  const handlePointerDown = (index) => {
    if (gd.state !== 'playing') return;
    setIsDragging(true);
    setStartIndex(index);
    const { indices, sum } = getRectIndices(index, index);
    setSelectedIndices(indices);
    setCurrentSum(sum);
  };

  const handlePointerEnter = (index) => {
    if (!isDragging) return;
    const { indices, sum } = getRectIndices(startIndex, index);
    setSelectedIndices(indices);
    setCurrentSum(sum);
  };

  const handlePointerUp = async () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (currentSum === 10) await processSuccess(selectedIndices);
    setSelectedIndices([]);
    setStartIndex(null);
    setCurrentSum(0);
  };

  const processSuccess = async (indices) => {
    const roomRef = doc(db, "battle_rooms", room.id);
    try {
      await runTransaction(db, async (transaction) => {
        const sfDoc = await transaction.get(roomRef);
        if (!sfDoc.exists()) return;
        const data = sfDoc.data();
        const serverBoard = data.gameData.board;
        const isAllAlive = indices.every(idx => serverBoard[idx].active);

        if (isAllAlive) {
          indices.forEach(idx => serverBoard[idx].active = false);
          const newScores = { ...data.gameData.scores };
          newScores[user.uid] = (newScores[user.uid] || 0) + indices.length;
          transaction.update(roomRef, { 
            "gameData.board": serverBoard,
            "gameData.scores": newScores
          });
        }
      });
    } catch (e) { console.error(e); }
  };

  return (
    <div 
      className="apple-game-wrapper"
      onPointerUp={handlePointerUp}
      style={{
        width: '100%', minHeight: '600px', background: '#dcedc8', borderRadius: 15,
        display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px',
        position: 'relative', userSelect: 'none', touchAction: 'none',
        backgroundImage: 'linear-gradient(#c5e1a5 1px, transparent 1px), linear-gradient(90deg, #c5e1a5 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}
    >
      {/* 🟢 대기 화면 */}
      {gd.state === 'ready' && !isFinished && (
         <div style={{position:'absolute', inset:0, background:'rgba(220, 237, 200, 0.95)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 10, borderRadius:15}}>
             <h1 style={{color: '#e74c3c', fontSize: '40px', marginBottom: '10px'}}>{t.g_apple}</h1>
             <h3 style={{marginBottom: '30px', color: '#555'}}>{t.appleDesc}</h3>
             
             <div style={{display:'flex', gap:10, marginBottom:30, flexWrap:'wrap', justifyContent:'center'}}>
                 {gd.players.map((p, i) => (
                    <div key={i} style={{background: p.ready ? '#27ae60' : '#95a5a6', padding:'10px 15px', borderRadius:8, color: 'white', border: p.uid===room.host ? '2px solid #f1c40f' : 'none'}}>
                        <div>{p.name}</div>
                        <div style={{fontSize:12}}>{p.ready ? '✅ OK' : '⏳ Wait'}</div>
                    </div>
                 ))}
             </div>
             <div style={{display:'flex', gap:10}}>
                 {myRole === 'host' ? (
                     <>
                        <button className="btn" disabled={!allParticipantsReady || gd.players.length < 2} 
                            style={{background: (allParticipantsReady && gd.players.length >= 2) ? '#e74c3c' : '#95a5a6', color: 'white', padding: '15px 30px', fontSize: 18}} 
                            onClick={startGame}>{(gd.players.length < 2) ? t.notEnough : t.gameStart}</button>
                        <button className="btn" style={{background:'#555', padding: '15px 30px', fontSize: 18}} onClick={leaveGame}>{t.exit}</button>
                     </>
                 ) : (
                     <>
                        <button className="btn" style={{background: myPlayer?.ready ? '#e74c3c' : '#27ae60', padding: '15px 30px', fontSize: 18, color: 'white'}} onClick={toggleReady}>{myPlayer?.ready ? t.cancelReady : t.ready}</button>
                        <button className="btn" style={{background:'#555', padding: '15px 30px', fontSize: 18}} onClick={leaveGame}>{t.exit}</button>
                     </>
                 )}
             </div>
         </div>
      )}

      {/* 🎮 게임 보드 */}
      {gd.state === 'playing' && (
        <>
            <div style={{display:'flex', justifyContent:'space-between', width:'100%', maxWidth:'850px', marginBottom:10, background:'rgba(255,255,255,0.9)', padding:10, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.1)'}}>
                <div style={{fontSize:20, fontWeight:'bold', color:'#e74c3c'}}>⏰ {timeLeft}s</div>
                <div style={{display:'flex', gap:10, overflowX:'auto'}}>
                    {Object.entries(scores || {}).sort(([,a],[,b])=>b-a).map(([uid, score], i) => {
                        const pName = gd.players.find(p=>p.uid===uid)?.name || '???';
                        return <div key={uid} style={{color: uid===user.uid ? '#2980b9' : '#555', fontWeight: uid===user.uid?'bold':'normal'}}>#{i+1} {pName}: {score}</div>
                    })}
                </div>
            </div>

            <div className="apple-grid" onPointerLeave={handlePointerUp}>
                {board.map((apple, index) => (
                    <div 
                        key={index} 
                        className={`grid-cell ${selectedIndices.includes(index) ? 'selected' : ''}`}
                        onPointerDown={() => handlePointerDown(index)}
                        onPointerEnter={() => handlePointerEnter(index)}
                    >
                        <AppleIcon value={apple.value} active={apple.active} />
                    </div>
                ))}
            </div>

            {isDragging && (
                <div style={{position:'absolute', top: 70, left:'50%', transform:'translateX(-50%)', background: currentSum===10 ? '#2ecc71' : '#e74c3c', color:'white', padding:'5px 20px', borderRadius:20, fontWeight:'bold', boxShadow:'0 4px 10px rgba(0,0,0,0.3)', zIndex:50}}>
                    {currentSum}
                </div>
            )}
        </>
      )}

      {/* 🏆 결과 화면 */}
      {isFinished && (
        <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', zIndex:20, borderRadius:15}} onPointerDown={e=>e.stopPropagation()}>
            <h1 style={{color:'#f1c40f', fontSize:40, marginBottom:10}}>🏆 WINNER 🏆</h1>
            <h2 style={{color:'white', marginBottom:30}}>
                {gd.players.find(p => p.uid === room.winner)?.name} 
                <span style={{color:'#2ecc71', fontSize:20, marginLeft:10}}>(+{(room.betAmount * gd.players.length).toLocaleString()})</span>
            </h2>
            <div style={{background:'rgba(255,255,255,0.1)', padding:20, borderRadius:10, marginBottom:30, width:'80%', maxWidth:'400px'}}>
                {gd.players.slice().sort((a,b) => (gd.scores?.[b.uid]||0) - (gd.scores?.[a.uid]||0)).map((p, i) => (
                    <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'10px', borderBottom:'1px solid #555', color: 'white'}}>
                        <span style={{color: i===0 ? '#f1c40f' : 'white', fontWeight: i===0 ? 'bold' : 'normal'}}>#{i+1} {p.name}</span>
                        <span>{gd.scores?.[p.uid] || 0}</span>
                    </div>
                ))}
            </div>
            <div style={{display:'flex', gap:15}}>
                {myRole === 'host' ? (
                    <>
                        <button className="btn" disabled={!allParticipantsReady} style={{background: allParticipantsReady ? '#2980b9' : '#7f8c8d', padding:'15px 30px', fontSize:18, color:'white'}} onClick={restartGame}>{allParticipantsReady ? t.oneMore : t.waitUser}</button>
                        <button className="btn" style={{background:'#c0392b', padding:'15px 30px', fontSize:18}} onClick={leaveGame}>{t.destroyRoom}</button>
                    </>
                ) : (
                    <>
                        <button className="btn" style={{background: myPlayer?.ready ? '#e74c3c' : '#27ae60', padding:'15px 30px', fontSize:18, color:'white'}} onClick={toggleReady}>{myPlayer?.ready ? t.cancelReady : t.ready}</button>
                        <button className="btn" style={{background:'#555', padding:'15px 30px', fontSize:18}} onClick={leaveGame}>{t.exit}</button>
                    </>
                )}
            </div>
        </div>
      )}

      <style>{`
        .apple-grid {
            display: grid;
            grid-template-columns: repeat(${COLS}, 1fr);
            gap: 2px;
            padding: 5px;
            width: 100%;
            max-width: 850px; 
        }
        .grid-cell {
            aspect-ratio: 1;
            position: relative;
            cursor: pointer;
            display: flex; justifyContent: center; alignItems: center;
            border-radius: 4px;
        }
        .grid-cell.selected {
            background: rgba(52, 152, 219, 0.4);
            border: 2px solid #3498db;
        }
        .apple { width: 100%; height: 100%; display: flex; justify-content: center; alignItems: center; transition: transform 0.2s; }
        .apple.popped { transform: scale(0); opacity: 0; }
        
        .apple-inner {
            width: 85%; height: 85%;
            background: radial-gradient(circle at 30% 30%, #ff5252, #c0392b);
            border-radius: 50% 50% 40% 40%;
            display: flex; justify-content: center; alignItems: center;
            position: relative;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        .apple-number { color: white; font-weight: 900; font-size: clamp(10px, 1.5vw, 24px); text-shadow: 1px 1px 0 rgba(0,0,0,0.3); z-index: 2; }
        .apple-shine { position: absolute; top: 15%; left: 15%; width: 25%; height: 25%; background: rgba(255,255,255,0.4); border-radius: 50%; }
        .apple-stem { position: absolute; top: -15%; left: 50%; width: 4px; height: 10px; background: #795548; transform: translateX(-50%) rotate(15deg); border-radius: 2px; }
        .apple-stem::after { content: ''; position: absolute; top: 2px; left: 2px; width: 12px; height: 6px; background: #4caf50; border-radius: 10px 0; transform: rotate(-30deg); }
      `}</style>
    </div>
  );
}