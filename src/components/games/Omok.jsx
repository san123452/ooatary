// import React, { useState, useEffect } from 'react';
// import { db } from '../../firebase';
// // 👇 deleteDoc 등 필수 함수 import
// import { doc, updateDoc, runTransaction, increment, addDoc, collection, serverTimestamp, deleteDoc } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';

// export default function Omok({ room, user, myRole }) {
//   const navigate = useNavigate();
  
//   // 1. 흑/백 결정 로직 (방장이 무조건 흑이 아니라, gameData.blackPlayer에 따라 결정)
//   // 기존 방들은 blackPlayer가 없을 수 있으므로 없으면 host를 흑으로 설정
//   const blackPlayer = room.gameData.blackPlayer || room.host; 
//   const myStone = user.uid === blackPlayer ? 'B' : 'W';
  
//   const isMyTurn = room.gameData.turn === user.uid;
//   const board = room.gameData.board;
//   const isFinished = room.status === 'finished';
//   const isGuestReady = room.gameData.guestReady === true;

//   const [tempIndex, setTempIndex] = useState(null);
//   const [timeLeft, setTimeLeft] = useState(20); // ⏳ 20초 타임아웃

//   // ⏳ 타임아웃 타이머 (내 턴일 때만 작동)
//   useEffect(() => {
//     if (!isMyTurn || isFinished) {
//         setTimeLeft(20);
//         return;
//     }

//     const timer = setInterval(() => {
//         setTimeLeft((prev) => {
//             if (prev <= 1) {
//                 clearInterval(timer);
//                 handleTimeOut(); // 0초 되면 시간패
//                 return 0;
//             }
//             return prev - 1;
//         });
//     }, 1000);

//     return () => clearInterval(timer);
//   }, [isMyTurn, isFinished]);

//   // ⏰ 시간 초과 패배 처리
//   const handleTimeOut = () => {
//     const winnerUid = myRole === 'host' ? room.guest : room.host;
//     endGame(winnerUid, "시간 초과 (기권패)");
//   };

//   // 🏁 게임 종료 처리
//   const endGame = async (winnerUid, reason = "승리") => {
//     await runTransaction(db, async (t) => {
//       const roomRef = doc(db, "battle_rooms", room.id);
//       if (winnerUid === 'draw') { 
//           // 무승부 (오목은 거의 없지만)
//       } else {
//         const winRef = doc(db, "users", winnerUid);
//         t.update(winRef, { point: increment(room.betAmount * 2) });
//       }
//       // 게임 종료 상태로 변경 + 준비 상태 초기화
//       t.update(roomRef, { winner: winnerUid, status: 'finished', "gameData.guestReady": false });
//     });

//     if (winnerUid !== 'draw') {
//         await addDoc(collection(db, "history"), {
//             uid: winnerUid, 
//             type: "게임", 
//             msg: `오목 ${reason} (상금)`, 
//             amount: room.betAmount * 2, 
//             createdAt: serverTimestamp()
//         });
//     }
//   };

//   // 🙋‍♂️ 참가자: 준비 완료
//   const handleGuestReady = async () => {
//     await updateDoc(doc(db, "battle_rooms", room.id), { "gameData.guestReady": true });
//   };

//   // 🔄 방장: 재대결 (흑돌 랜덤 배정 포함!)
//   const restartGame = async () => {
//     if (!isGuestReady) return;

//     try {
//         await runTransaction(db, async (t) => {
//             const hostRef = doc(db, "users", room.host);
//             const guestRef = doc(db, "users", room.guest);
//             const hSnap = await t.get(hostRef);
//             const gSnap = await t.get(guestRef);

//             if (hSnap.data().point < room.betAmount || gSnap.data().point < room.betAmount) {
//                 throw new Error("누군가의 잔액이 부족합니다.");
//             }

//             // 배팅금 차감
//             t.update(hostRef, { point: increment(-room.betAmount) });
//             t.update(guestRef, { point: increment(-room.betAmount) });

//             // 🎲 흑돌(선공) 랜덤 결정
//             const nextBlack = Math.random() < 0.5 ? room.host : room.guest;

//             // 게임 리셋
//             const roomRef = doc(db, "battle_rooms", room.id);
//             t.update(roomRef, {
//                 status: 'playing',
//                 winner: null,
//                 "gameData.board": Array(225).fill(null),
//                 "gameData.turn": nextBlack,       // 흑돌이 선공
//                 "gameData.blackPlayer": nextBlack, // 누가 흑인지 저장
//                 "gameData.lastMove": -1,
//                 "gameData.guestReady": false
//             });
//         });

//         // 내 기록 저장
//         await addDoc(collection(db, "history"), {
//             uid: user.uid, type: "게임", msg: "오목 재대결 (배팅)", amount: -room.betAmount, createdAt: serverTimestamp()
//         });

//     } catch (e) {
//         alert("재대결 실패: " + e.message);
//     }
//   };

//   // 🚪 방장: 방 삭제하고 나가기
//   const handleHostExit = async () => {
//       if (window.confirm("방을 삭제하고 나가시겠습니까?")) {
//           await deleteDoc(doc(db, "battle_rooms", room.id));
//           navigate('/gamelobby');
//       }
//   };

//   // 🚪 참가자: 나가기
//   const handleGuestExit = () => {
//       navigate('/gamelobby');
//   };

//   // 승리 체크 로직
//   const checkWin = (bd, i, color) => {
//       const size = 15;
//       const x = i % size;
//       const y = Math.floor(i / size);
//       const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
//       for (let [dx, dy] of dirs) {
//           let count = 1;
//           for (let s = 1; s < 5; s++) {
//               const nx = x + dx * s, ny = y + dy * s;
//               if (nx < 0 || nx >= size || ny < 0 || ny >= size || bd[ny * size + nx] !== color) break;
//               count++;
//           }
//           for (let s = 1; s < 5; s++) {
//               const nx = x - dx * s, ny = y - dy * s;
//               if (nx < 0 || nx >= size || ny < 0 || ny >= size || bd[ny * size + nx] !== color) break;
//               count++;
//           }
//           if (count >= 5) return true;
//       }
//       return false;
//   };

//   const handleBoardClick = (i) => {
//       if (!isMyTurn || board[i]) return; 
//       setTempIndex(i); 
//   };

//   const confirmMove = async () => {
//     if (tempIndex === null || board[tempIndex]) return;

//     const newBoard = [...board];
//     newBoard[tempIndex] = myStone;
//     setTempIndex(null);

//     // 승리 체크
//     if (checkWin(newBoard, tempIndex, myStone)) {
//         endGame(user.uid);
//     } else {
//         // 다음 턴 넘기기
//         const nextTurn = room.gameData.turn === room.host ? room.guest : room.host;
//         await updateDoc(doc(db, "battle_rooms", room.id), {
//             "gameData.board": newBoard,
//             "gameData.turn": nextTurn,
//             "gameData.lastMove": tempIndex
//         });
//     }
//   };

//   // 흑/백 이름 가져오기
//   const blackName = blackPlayer === room.host ? room.hostName : room.guestName;
//   const whiteName = blackPlayer === room.host ? room.guestName : room.hostName;

//   return (
//     <div style={{display:'flex', flexDirection:'column', alignItems:'center', width:'100%', position:'relative'}}>
      
//       {/* 🆚 닉네임 & 점수판 */}
//       <div style={{
//           display:'flex', justifyContent:'space-between', width:'100%', maxWidth:'600px', 
//           marginBottom: 10, padding: '10px 20px', background:'#34495e', borderRadius:10, color:'white', alignItems:'center'
//       }}>
//           <div style={{textAlign:'center', opacity: room.gameData.turn === blackPlayer ? 1 : 0.5}}>
//               <div style={{fontSize:24}}>⚫</div>
//               <div style={{fontWeight:'bold'}}>{blackName || '흑돌'}</div>
//           </div>
          
//           <div style={{textAlign:'center'}}>
//               <div style={{fontSize:14, color:'#ccc'}}>VS</div>
//               {/* ⏰ 타이머 표시 */}
//               {!isFinished && (
//                 <div style={{
//                     color: timeLeft <= 5 ? '#e74c3c' : '#f1c40f', 
//                     fontWeight:'bold', fontSize:20, marginTop:5
//                 }}>
//                     {timeLeft}s
//                 </div>
//               )}
//           </div>

//           <div style={{textAlign:'center', opacity: room.gameData.turn !== blackPlayer ? 1 : 0.5}}>
//               <div style={{fontSize:24}}>⚪</div>
//               <div style={{fontWeight:'bold'}}>{whiteName || '백돌'}</div>
//           </div>
//       </div>

//       {/* 오목판 */}
//       <div style={{
//           width: '100%', maxWidth: '600px', aspectRatio: '1/1', 
//           background: '#eebb77', border: '3px solid #8b4513', boxSizing: 'border-box',
//           display: 'grid', gridTemplateColumns: 'repeat(15, 1fr)',
//           padding: '10px', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' 
//       }}>
//         {board.map((c, i) => (
//           <div key={i} onClick={() => handleBoardClick(i)} 
//                style={{
//                    display: 'flex', justifyContent: 'center', alignItems: 'center', 
//                    position: 'relative', cursor: (isMyTurn && !isFinished) ? 'pointer' : 'default'
//                }}>
//              <div style={{position:'absolute', width:'100%', height:'1px', background:'#555'}}></div>
//              <div style={{position:'absolute', height:'100%', width:'1px', background:'#555'}}></div>
             
//              {c === 'B' && <div style={{width:'85%', height:'85%', borderRadius:'50%', background:'radial-gradient(circle at 30% 30%, #666, #000)', zIndex:2, boxShadow:'2px 2px 2px rgba(0,0,0,0.4)'}}/>}
//              {c === 'W' && <div style={{width:'85%', height:'85%', borderRadius:'50%', background:'radial-gradient(circle at 30% 30%, #fff, #ddd)', zIndex:2, boxShadow:'2px 2px 2px rgba(0,0,0,0.4)'}}/>}
             
//              {room.gameData.lastMove === i && <div style={{position:'absolute', width:'20%', height:'20%', background:'red', borderRadius:'50%', zIndex:3}}/>}
             
//              {tempIndex === i && !c && (
//                  <div style={{
//                      width:'85%', height:'85%', borderRadius:'50%', 
//                      background: myStone === 'B' ? 'black' : 'white', 
//                      opacity: 0.5, zIndex: 2, border: '2px solid red' 
//                  }}/>
//              )}
//           </div>
//         ))}
//       </div>

//       {/* 상태 메시지 및 컨트롤 버튼 */}
//       <div style={{marginTop:15, width:'100%', textAlign:'center'}}>
//           {!isFinished && isMyTurn && (
//               <div style={{animation:'pop 0.3s'}}>
//                   <div style={{fontSize:18, fontWeight:'bold', marginBottom:10, color:'#27ae60'}}>
//                       당신의 차례입니다! ({timeLeft}초)
//                   </div>
//                   {tempIndex !== null && (
//                       <button className="btn btn-primary" 
//                           style={{width:'80%', maxWidth:'300px', padding:'15px', fontSize:'20px', fontWeight:'bold', boxShadow:'0 4px 10px rgba(0,0,0,0.3)'}}
//                           onClick={confirmMove}
//                       >
//                           ✅ 두기
//                       </button>
//                   )}
//               </div>
//           )}
//           {!isFinished && !isMyTurn && (
//               <div style={{fontSize:18, color:'#7f8c8d'}}>
//                   ⏳ 상대방이 고민 중입니다...
//               </div>
//           )}
//       </div>

//       {/* 🏆 게임 종료 오버레이 (재대결/나가기) */}
//       {isFinished && (
//         <div style={{
//             position:'absolute', top:0, left:0, width:'100%', height:'100%', 
//             background:'rgba(0,0,0,0.85)', zIndex:100,
//             display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'
//         }}>
//             <h1 style={{color:'#f1c40f', fontSize:40, textShadow:'0 0 10px red', margin:0}}>GAME OVER</h1>
//             <h3 style={{color:'white', marginBottom:30}}>
//                 {room.winner === user.uid ? "🏆 승리!" : "😭 패배..."}
//             </h3>

//             <div style={{display:'flex', gap:10, width:'80%', justifyContent:'center', maxWidth:'400px'}}>
//                 {myRole === 'host' ? (
//                     <>
//                         <button className="btn" disabled={!isGuestReady} 
//                             style={{flex:1, background: isGuestReady ? '#2980b9' : '#7f8c8d', padding:'15px', cursor: isGuestReady ? 'pointer' : 'not-allowed', color: 'white', fontWeight: 'bold'}} 
//                             onClick={restartGame}>
//                             {isGuestReady ? "🔄 한 판 더" : "⏳ 대기중..."}
//                         </button>
//                         <button className="btn" style={{flex:1, background:'#c0392b', padding:'15px', fontWeight:'bold'}} onClick={handleHostExit}>
//                             🏠 방 삭제
//                         </button>
//                     </>
//                 ) : (
//                     <>
//                         {!isGuestReady ? (
//                             <button className="btn" style={{flex:1, background:'#27ae60', padding:'15px', fontWeight:'bold'}} onClick={handleGuestReady}>
//                                 ✋ 준비 완료
//                             </button>
//                         ) : (
//                             <div style={{flex:1, background:'#2c3e50', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:5}}>
//                                 방장 대기중...
//                             </div>
//                         )}
//                         <button className="btn" style={{flex:1, background:'#555', padding:'15px', fontWeight:'bold'}} onClick={handleGuestExit}>
//                             🏠 나가기
//                         </button>
//                     </>
//                 )}
//             </div>
//         </div>
//       )}
//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, updateDoc, runTransaction, increment, addDoc, collection, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../LanguageContext'; // 👈

export default function Omok({ room, user, myRole }) {
  const navigate = useNavigate();
  const { t } = useLanguage(); // 👈

  const blackPlayer = room.gameData.blackPlayer || room.host; 
  const myStone = user.uid === blackPlayer ? 'B' : 'W';
  
  const isMyTurn = room.gameData.turn === user.uid;
  const board = room.gameData.board;
  const isFinished = room.status === 'finished';
  const isGuestReady = room.gameData.guestReady === true;

  const [tempIndex, setTempIndex] = useState(null);
  const [timeLeft, setTimeLeft] = useState(20);

  useEffect(() => {
    if (!isMyTurn || isFinished) {
        setTimeLeft(20);
        return;
    }

    const timer = setInterval(() => {
        setTimeLeft((prev) => {
            if (prev <= 1) {
                clearInterval(timer);
                handleTimeOut(); 
                return 0;
            }
            return prev - 1;
        });
    }, 1000);

    return () => clearInterval(timer);
  }, [isMyTurn, isFinished]);

  const handleTimeOut = () => {
    const winnerUid = myRole === 'host' ? room.guest : room.host;
    endGame(winnerUid, "Time Out");
  };

  const endGame = async (winnerUid, reason = "Win") => {
    await runTransaction(db, async (t) => {
      const roomRef = doc(db, "battle_rooms", room.id);
      if (winnerUid === 'draw') { 
          // Draw
      } else {
        const winRef = doc(db, "users", winnerUid);
        t.update(winRef, { point: increment(room.betAmount * 2) });
      }
      t.update(roomRef, { winner: winnerUid, status: 'finished', "gameData.guestReady": false });
    });

    if (winnerUid !== 'draw') {
        await addDoc(collection(db, "history"), {
            uid: winnerUid, 
            type: "게임", 
            msg: `${t.g_omok} ${reason}`, 
            amount: room.betAmount * 2, 
            createdAt: serverTimestamp()
        });
    }
  };

  const handleGuestReady = async () => {
    await updateDoc(doc(db, "battle_rooms", room.id), { "gameData.guestReady": true });
  };

  const restartGame = async () => {
    if (!isGuestReady) return;

    try {
        await runTransaction(db, async (t) => {
            const hostRef = doc(db, "users", room.host);
            const guestRef = doc(db, "users", room.guest);
            const hSnap = await t.get(hostRef);
            const gSnap = await t.get(guestRef);

            if (hSnap.data().point < room.betAmount || gSnap.data().point < room.betAmount) {
                throw new Error("No Money");
            }

            t.update(hostRef, { point: increment(-room.betAmount) });
            t.update(guestRef, { point: increment(-room.betAmount) });

            const nextBlack = Math.random() < 0.5 ? room.host : room.guest;

            const roomRef = doc(db, "battle_rooms", room.id);
            t.update(roomRef, {
                status: 'playing',
                winner: null,
                "gameData.board": Array(225).fill(null),
                "gameData.turn": nextBlack,       
                "gameData.blackPlayer": nextBlack, 
                "gameData.lastMove": -1,
                "gameData.guestReady": false
            });
        });

        await addDoc(collection(db, "history"), {
            uid: user.uid, type: "게임", msg: `${t.g_omok} ${t.restart}`, amount: -room.betAmount, createdAt: serverTimestamp()
        });

    } catch (e) {
        alert("Error: " + e.message);
    }
  };

  const handleHostExit = async () => {
      if (window.confirm("Destroy Room?")) {
          await deleteDoc(doc(db, "battle_rooms", room.id));
          navigate('/gamelobby');
      }
  };

  const handleGuestExit = () => {
      navigate('/gamelobby');
  };

  const checkWin = (bd, i, color) => {
      const size = 15;
      const x = i % size;
      const y = Math.floor(i / size);
      const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
      for (let [dx, dy] of dirs) {
          let count = 1;
          for (let s = 1; s < 5; s++) {
              const nx = x + dx * s, ny = y + dy * s;
              if (nx < 0 || nx >= size || ny < 0 || ny >= size || bd[ny * size + nx] !== color) break;
              count++;
          }
          for (let s = 1; s < 5; s++) {
              const nx = x - dx * s, ny = y - dy * s;
              if (nx < 0 || nx >= size || ny < 0 || ny >= size || bd[ny * size + nx] !== color) break;
              count++;
          }
          if (count >= 5) return true;
      }
      return false;
  };

  const handleBoardClick = (i) => {
      if (!isMyTurn || board[i]) return; 
      setTempIndex(i); 
  };

  const confirmMove = async () => {
    if (tempIndex === null || board[tempIndex]) return;

    const newBoard = [...board];
    newBoard[tempIndex] = myStone;
    setTempIndex(null);

    if (checkWin(newBoard, tempIndex, myStone)) {
        endGame(user.uid);
    } else {
        const nextTurn = room.gameData.turn === room.host ? room.guest : room.host;
        await updateDoc(doc(db, "battle_rooms", room.id), {
            "gameData.board": newBoard,
            "gameData.turn": nextTurn,
            "gameData.lastMove": tempIndex
        });
    }
  };

  const blackName = blackPlayer === room.host ? room.hostName : room.guestName;
  const whiteName = blackPlayer === room.host ? room.guestName : room.hostName;

  return (
    <div style={{display:'flex', flexDirection:'column', alignItems:'center', width:'100%', position:'relative'}}>
      
      <div style={{
          display:'flex', justifyContent:'space-between', width:'100%', maxWidth:'600px', 
          marginBottom: 10, padding: '10px 20px', background:'#34495e', borderRadius:10, color:'white', alignItems:'center'
      }}>
          <div style={{textAlign:'center', opacity: room.gameData.turn === blackPlayer ? 1 : 0.5}}>
              <div style={{fontSize:24}}>⚫</div>
              <div style={{fontWeight:'bold'}}>{blackName}</div>
          </div>
          
          <div style={{textAlign:'center'}}>
              <div style={{fontSize:14, color:'#ccc'}}>VS</div>
              {!isFinished && (
                <div style={{
                    color: timeLeft <= 5 ? '#e74c3c' : '#f1c40f', 
                    fontWeight:'bold', fontSize:20, marginTop:5
                }}>
                    {timeLeft}s
                </div>
              )}
          </div>

          <div style={{textAlign:'center', opacity: room.gameData.turn !== blackPlayer ? 1 : 0.5}}>
              <div style={{fontSize:24}}>⚪</div>
              <div style={{fontWeight:'bold'}}>{whiteName}</div>
          </div>
      </div>

      <div style={{
          width: '100%', maxWidth: '600px', aspectRatio: '1/1', 
          background: '#eebb77', border: '3px solid #8b4513', boxSizing: 'border-box',
          display: 'grid', gridTemplateColumns: 'repeat(15, 1fr)',
          padding: '10px', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' 
      }}>
        {board.map((c, i) => (
          <div key={i} onClick={() => handleBoardClick(i)} 
               style={{
                   display: 'flex', justifyContent: 'center', alignItems: 'center', 
                   position: 'relative', cursor: (isMyTurn && !isFinished) ? 'pointer' : 'default'
               }}>
             <div style={{position:'absolute', width:'100%', height:'1px', background:'#555'}}></div>
             <div style={{position:'absolute', height:'100%', width:'1px', background:'#555'}}></div>
             
             {c === 'B' && <div style={{width:'85%', height:'85%', borderRadius:'50%', background:'radial-gradient(circle at 30% 30%, #666, #000)', zIndex:2, boxShadow:'2px 2px 2px rgba(0,0,0,0.4)'}}/>}
             {c === 'W' && <div style={{width:'85%', height:'85%', borderRadius:'50%', background:'radial-gradient(circle at 30% 30%, #fff, #ddd)', zIndex:2, boxShadow:'2px 2px 2px rgba(0,0,0,0.4)'}}/>}
             
             {room.gameData.lastMove === i && <div style={{position:'absolute', width:'20%', height:'20%', background:'red', borderRadius:'50%', zIndex:3}}/>}
             
             {tempIndex === i && !c && (
                 <div style={{
                     width:'85%', height:'85%', borderRadius:'50%', 
                     background: myStone === 'B' ? 'black' : 'white', 
                     opacity: 0.5, zIndex: 2, border: '2px solid red' 
                 }}/>
             )}
          </div>
        ))}
      </div>

      <div style={{marginTop:15, width:'100%', textAlign:'center'}}>
          {!isFinished && isMyTurn && (
              <div style={{animation:'pop 0.3s'}}>
                  <div style={{fontSize:18, fontWeight:'bold', marginBottom:10, color:'#27ae60'}}>
                      YOUR TURN! ({timeLeft}s)
                  </div>
                  {tempIndex !== null && (
                      <button className="btn btn-primary" 
                          style={{width:'80%', maxWidth:'300px', padding:'15px', fontSize:'20px', fontWeight:'bold', boxShadow:'0 4px 10px rgba(0,0,0,0.3)'}}
                          onClick={confirmMove}
                      >
                          {t.confirm}
                      </button>
                  )}
              </div>
          )}
          {!isFinished && !isMyTurn && (
              <div style={{fontSize:18, color:'#7f8c8d'}}>
                  Thinking...
              </div>
          )}
      </div>

      {isFinished && (
        <div style={{
            position:'absolute', top:0, left:0, width:'100%', height:'100%', 
            background:'rgba(0,0,0,0.85)', zIndex:100,
            display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'
        }}>
            <h1 style={{color:'#f1c40f', fontSize:40, textShadow:'0 0 10px red', margin:0}}>GAME OVER</h1>
            <h3 style={{color:'white', marginBottom:30}}>
                {room.winner === user.uid ? t.win : t.lose}
            </h3>

            <div style={{display:'flex', gap:10, width:'80%', justifyContent:'center', maxWidth:'400px'}}>
                {myRole === 'host' ? (
                    <>
                        <button className="btn" disabled={!isGuestReady} 
                            style={{flex:1, background: isGuestReady ? '#2980b9' : '#7f8c8d', padding:'15px', cursor: isGuestReady ? 'pointer' : 'not-allowed', color: 'white', fontWeight: 'bold'}} 
                            onClick={restartGame}>
                            {isGuestReady ? t.oneMore : t.waitUser}
                        </button>
                        <button className="btn" style={{flex:1, background:'#c0392b', padding:'15px', fontWeight:'bold'}} onClick={handleHostExit}>
                            {t.destroyRoom}
                        </button>
                    </>
                ) : (
                    <>
                        {!isGuestReady ? (
                            <button className="btn" style={{flex:1, background:'#27ae60', padding:'15px', fontWeight:'bold'}} onClick={handleGuestReady}>
                                {t.ready}
                            </button>
                        ) : (
                            <div style={{flex:1, background:'#2c3e50', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:5}}>
                                {t.waitHost}
                            </div>
                        )}
                        <button className="btn" style={{flex:1, background:'#555', padding:'15px', fontWeight:'bold'}} onClick={handleGuestExit}>
                            {t.exit}
                        </button>
                    </>
                )}
            </div>
        </div>
      )}
    </div>
  );
}
