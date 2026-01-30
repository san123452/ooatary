// import React, { useEffect, useState } from 'react';
// import { db } from '../../firebase';
// // 👇 필수 함수 import
// import { doc, updateDoc, runTransaction, increment, addDoc, collection, serverTimestamp, deleteDoc } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';

// const styles = `
//   @keyframes flyLeft { 0% { bottom: 10px; left: 50%; transform: translateX(-50%) scale(1); } 100% { bottom: 80%; left: 20%; transform: translateX(-50%) scale(0.6); } }
//   @keyframes flyCenter { 0% { bottom: 10px; left: 50%; transform: translateX(-50%) scale(1); } 100% { bottom: 80%; left: 50%; transform: translateX(-50%) scale(0.6); } }
//   @keyframes flyRight { 0% { bottom: 10px; left: 50%; transform: translateX(-50%) scale(1); } 100% { bottom: 80%; left: 80%; transform: translateX(-50%) scale(0.6); } }
//   @keyframes diveLeft { 0% { transform: translateX(0); } 100% { transform: translateX(-80px) rotate(-20deg); } }
//   @keyframes diveRight { 0% { transform: translateX(0); } 100% { transform: translateX(80px) rotate(20deg); } }
//   @keyframes popIn { 0% { transform: scale(0); opacity: 0; } 80% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
//   .ball { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); width: 30px; height: 30px; background: white; border-radius: 50%; box-shadow: 2px 2px 5px rgba(0,0,0,0.5); z-index: 5; }
//   .ball::after { content: '⚽'; position: absolute; top: -3px; left: -3px; font-size: 34px; }
//   .keeper { font-size: 50px; z-index: 2; transition: all 0.5s; }
//   .result-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 40px; font-weight: bold; text-shadow: 0 0 10px rgba(0,0,0,0.8); z-index: 10; animation: popIn 0.3s; white-space: nowrap; }
// `;

// export default function Soccer({ room, user, myRole }) {
//   const navigate = useNavigate();
//   const gd = room.gameData;
//   const isKicker = gd.kicker === user.uid; 
//   const myDir = myRole === 'host' ? gd.hostDir : gd.guestDir;
//   const isFinished = room.status === 'finished'; 
//   const isGuestReady = gd.guestReady === true;

//   const [animState, setAnimState] = useState('idle');
//   const [ballAnim, setBallAnim] = useState({});
//   const [keeperAnim, setKeeperAnim] = useState({});
//   const [resultMsg, setResultMsg] = useState(null); 
//   const [bgStatus, setBgStatus] = useState('normal');
//   const [timeLeft, setTimeLeft] = useState(20); // ⏳ 20초 타임아웃

//   // ⏳ 타임아웃 (아직 선택 안 했고 게임 중일 때)
//   useEffect(() => {
//     if (myDir || isFinished || animState !== 'idle') {
//         setTimeLeft(20);
//         return;
//     }

//     const timer = setInterval(() => {
//         setTimeLeft((prev) => {
//             if (prev <= 1) {
//                 clearInterval(timer);
//                 handleTimeOut(); 
//                 return 0;
//             }
//             return prev - 1;
//         });
//     }, 1000);

//     return () => clearInterval(timer);
//   }, [myDir, isFinished, animState]);

//   // ⏰ 시간 초과 패배 처리
//   const handleTimeOut = () => {
//     const winnerUid = myRole === 'host' ? room.guest : room.host;
//     endGame(winnerUid, "시간 초과 (기권패)");
//   };

//   // 🏁 게임 종료
//   const endGame = async (winnerUid, reason = "승리") => {
//     if (isFinished) return;

//     await runTransaction(db, async (t) => {
//       const roomRef = doc(db, "battle_rooms", room.id);
      
//       if (winnerUid === 'draw') {
//         const hostRef = doc(db, "users", room.host);
//         const guestRef = doc(db, "users", room.guest);
//         t.update(hostRef, { point: increment(room.betAmount) });
//         t.update(guestRef, { point: increment(room.betAmount) });
//       } else {
//         const winRef = doc(db, "users", winnerUid);
//         t.update(winRef, { point: increment(room.betAmount * 2) });
//       }
//       t.update(roomRef, { winner: winnerUid, status: 'finished', "gameData.guestReady": false });
//     });

//     if (winnerUid !== 'draw') {
//         await addDoc(collection(db, "history"), {
//             uid: winnerUid, type: "게임", msg: `승부차기 ${reason} (상금)`, amount: room.betAmount * 2, createdAt: serverTimestamp()
//         });
//     } else {
//         // 무승부 기록
//         await addDoc(collection(db, "history"), { uid: room.host, type: "게임", msg: "승부차기 무승부", amount: room.betAmount, createdAt: serverTimestamp() });
//         await addDoc(collection(db, "history"), { uid: room.guest, type: "게임", msg: "승부차기 무승부", amount: room.betAmount, createdAt: serverTimestamp() });
//     }
//   };

//   // 🔄 재대결 & 나가기 로직
//   const handleGuestReady = async () => {
//     await updateDoc(doc(db, "battle_rooms", room.id), { "gameData.guestReady": true });
//   };

//   const restartGame = async () => {
//     if (!isGuestReady) return; 
//     try {
//         await runTransaction(db, async (t) => {
//             const hostRef = doc(db, "users", room.host);
//             const guestRef = doc(db, "users", room.guest);
//             const hSnap = await t.get(hostRef);
//             const gSnap = await t.get(guestRef);

//             if (hSnap.data().point < room.betAmount || gSnap.data().point < room.betAmount) throw new Error("잔액 부족");

//             t.update(hostRef, { point: increment(-room.betAmount) });
//             t.update(guestRef, { point: increment(-room.betAmount) });

//             const roomRef = doc(db, "battle_rooms", room.id);
//             t.update(roomRef, { 
//                 status: 'playing',
//                 winner: null,
//                 "gameData.hostDir": null, "gameData.guestDir": null,
//                 "gameData.hostScore": 0, "gameData.guestScore": 0,
//                 "gameData.round": 1,
//                 "gameData.history": [],
//                 "gameData.kicker": room.host,
//                 "gameData.guestReady": false
//             });
//         });

//         await addDoc(collection(db, "history"), {
//             uid: user.uid, type: "게임", msg: "승부차기 재대결 (배팅)", amount: -room.betAmount, createdAt: serverTimestamp()
//         });
//     } catch (e) {
//         alert("재대결 실패: " + e.message);
//     }
//   };

//   const handleHostExit = async () => {
//       if (window.confirm("방을 삭제하고 나가시겠습니까?")) {
//           await deleteDoc(doc(db, "battle_rooms", room.id));
//           navigate('/gamelobby');
//       }
//   };

//   const handleGuestExit = () => {
//       navigate('/gamelobby');
//   };

//   const shoot = async (dir) => {
//     if (myDir || isFinished) return;
//     const field = myRole === 'host' ? "gameData.hostDir" : "gameData.guestDir";
//     await updateDoc(doc(db, "battle_rooms", room.id), { [field]: dir });
//   };

//   const handleRandomShoot = () => {
//       if (myDir || isFinished) return; 
//       const dirs = ['L', 'C', 'R'];
//       shoot(dirs[Math.floor(Math.random() * 3)]);
//   };

//   useEffect(() => {
//     if (gd.hostDir && gd.guestDir) {
//       setAnimState('shooting');
//       const kickDir = gd.kicker === room.host ? gd.hostDir : gd.guestDir;
//       const saveDir = gd.kicker === room.host ? gd.guestDir : gd.hostDir;

//       let ballStyle = { animation: `fly${kickDir === 'L' ? 'Left' : kickDir === 'R' ? 'Right' : 'Center'} 0.6s forwards` };
//       setBallAnim(ballStyle);
      
//       let keeperStyle = {};
//       if (saveDir === 'L') keeperStyle = { animation: 'diveLeft 0.5s forwards' };
//       if (saveDir === 'R') keeperStyle = { animation: 'diveRight 0.5s forwards' };
//       setKeeperAnim(keeperStyle);

//       const timer = setTimeout(async () => {
//         if (myRole !== 'host') return;
//         if (isFinished) return;

//         const isGoal = gd.hostDir !== gd.guestDir;
//         const isHostKicker = gd.kicker === room.host;
//         let newH = gd.hostScore;
//         let newG = gd.guestScore;
//         if (isHostKicker && isGoal) newH++;
//         if (!isHostKicker && isGoal) newG++;

//         const mark = isGoal ? '🟢' : '🔴'; 
//         const newHistory = [...(gd.history || []), mark];

//         if (gd.round >= 10 || (gd.round >= 6 && Math.abs(newH - newG) > (10 - gd.round + 1) / 2)) {
//              if (newH > newG) endGame(room.host);
//              else if (newG > newH) endGame(room.guest);
//              else endGame('draw');
//         } else {
//             await updateDoc(doc(db, "battle_rooms", room.id), {
//                 "gameData.hostDir": null, "gameData.guestDir": null,
//                 "gameData.hostScore": newH, "gameData.guestScore": newG,
//                 "gameData.kicker": isHostKicker ? room.guest : room.host, 
//                 "gameData.round": gd.round + 1,
//                 "gameData.history": newHistory
//             });
//         }
//       }, 2500); 
//       return () => clearTimeout(timer);
//     } else {
//         setAnimState('idle');
//         setResultMsg(null);
//         setBgStatus('normal');
//         setBallAnim({});
//         setKeeperAnim({});
//     }
//   }, [gd.hostDir, gd.guestDir, isFinished]);

//   useEffect(() => {
//       if (animState === 'shooting') {
//           const kickDir = gd.kicker === room.host ? gd.hostDir : gd.guestDir;
//           const saveDir = gd.kicker === room.host ? gd.guestDir : gd.hostDir;
//           const isGoal = kickDir !== saveDir; 
//           const timer = setTimeout(() => {
//               if (isKicker) {
//                   if (isGoal) { setResultMsg("🎉 GOAL!"); setBgStatus("good"); } 
//                   else { setResultMsg("❌ 막힘..."); setBgStatus("bad"); }
//               } else {
//                   if (isGoal) { setResultMsg("😭 먹힘..."); setBgStatus("bad"); } 
//                   else { setResultMsg("🛡️ SAVE!"); setBgStatus("good"); }
//               }
//           }, 600); 
//           return () => clearTimeout(timer);
//       }
//   }, [animState, isKicker]); 

//   const getBgColor = () => {
//       if (bgStatus === 'good') return '#2ecc71'; 
//       if (bgStatus === 'bad') return '#e74c3c';  
//       return '#27ae60'; 
//   };

//   return (
//     <div style={{textAlign:'center', width:'100%'}}>
//       <style>{styles}</style>

//       {/* 🆚 스코어보드 & 닉네임 */}
//       <div style={{background:'#222', color:'#fff', padding:10, borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:15, border:'2px solid #555'}}>
//          <div style={{textAlign:'left'}}>
//              <div style={{fontSize:12, color:'#aaa'}}>HOST</div>
//              <div style={{fontSize:18, fontWeight:'bold', color: room.host === gd.kicker ? '#f1c40f' : '#fff'}}>
//                  {room.hostName} ({gd.hostScore})
//              </div>
//          </div>
//          <div style={{display:'flex', gap:3, flexWrap:'wrap', maxWidth:'150px', justifyContent:'center'}}>
//              {gd.history.map((m,i)=><span key={i} style={{fontSize:12}}>{m}</span>)}
//          </div>
//          <div style={{textAlign:'right'}}>
//              <div style={{fontSize:12, color:'#aaa'}}>GUEST</div>
//              <div style={{fontSize:18, fontWeight:'bold', color: room.guest === gd.kicker ? '#f1c40f' : '#fff'}}>
//                  {room.guestName} ({gd.guestScore})
//              </div>
//          </div>
//       </div>

//       {/* 경기장 */}
//       <div style={{
//           position:'relative', height:220, background: getBgColor(), 
//           borderRadius:10, border:'4px solid white', 
//           overflow:'hidden', display:'flex', justifyContent:'center', alignItems:'flex-end',
//           boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)', transition: 'background 0.3s'
//       }}>
//          <div style={{position:'absolute', top:10, width:'60%', height:'80%', borderTop:'8px solid white', borderLeft:'8px solid white', borderRight:'8px solid white', opacity:0.8}}></div>
//          <div className="keeper" style={{marginBottom: 20, ...keeperAnim}}>🧤</div>
//          <div className="ball" style={ballAnim}></div>
//          {resultMsg && <div className="result-text" style={{color: '#fff'}}>{resultMsg}</div>}
         
//          {/* 🏆 게임 종료 화면 */}
//          {isFinished && (
//             <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', zIndex:50}}>
//                 <h1 style={{color:'#f1c40f', fontSize:40, textShadow:'0 0 10px red', margin:0}}>GAME OVER</h1>
//                 <h3 style={{color:'white', marginBottom:30}}>
//                     {room.winner === 'draw' ? "무승부" : (room.winner === user.uid ? "🏆 당신이 이겼습니다!" : "😭 패배했습니다...")}
//                 </h3>
                
//                 <div style={{display:'flex', gap:10, width:'80%', justifyContent:'center', maxWidth:'400px'}}>
//                     {myRole === 'host' ? (
//                         <>
//                             <button className="btn" disabled={!isGuestReady} 
//                                 style={{flex:1, background: isGuestReady ? '#2980b9' : '#7f8c8d', padding:'15px', cursor: isGuestReady ? 'pointer' : 'not-allowed', color: 'white', fontWeight: 'bold'}} 
//                                 onClick={restartGame}>
//                                 {isGuestReady ? "🔄 한 판 더" : "⏳ 대기중..."}
//                             </button>
//                             <button className="btn" style={{flex:1, background:'#c0392b', padding:'15px', fontWeight:'bold'}} onClick={handleHostExit}>
//                                 🏠 방 삭제
//                             </button>
//                         </>
//                     ) : (
//                         <>
//                             {!isGuestReady ? (
//                                 <button className="btn" style={{flex:1, background:'#27ae60', padding:'15px', fontWeight:'bold', animation:'popIn 0.5s'}} onClick={handleGuestReady}>
//                                     ✋ 준비 완료
//                                 </button>
//                             ) : (
//                                 <div style={{flex:1, background:'#2c3e50', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:5, padding:'0 10px'}}>
//                                     방장 대기중...
//                                 </div>
//                             )}
//                             <button className="btn" style={{flex:1, background:'#555', padding:'15px', fontWeight:'bold'}} onClick={handleGuestExit}>
//                                 🏠 나가기
//                             </button>
//                         </>
//                     )}
//                 </div>
//             </div>
//          )}
//       </div>

//       {/* 컨트롤 패널 & 타이머 */}
//       <h2 style={{color: isKicker ? '#f1c40f' : '#3498db', margin:'15px 0', fontWeight:'bold'}}>
//         {isFinished ? "경기 종료" : (isKicker ? "🎯 슛 날릴 방향!" : "🛡️ 막을 방향!")}
//       </h2>
      
//       {!isFinished && !myDir && (
//           <div style={{marginBottom:10, color: timeLeft<=5?'#e74c3c':'#f1c40f', fontWeight:'bold'}}>
//               남은 시간: {timeLeft}초
//           </div>
//       )}

//       {!myDir && !isFinished ? (
//         <div style={{display:'flex', gap:10}}>
//             <button className="btn" style={{flex:1, height:60, fontSize:24, background:'#34495e', borderBottom:'5px solid #2c3e50'}} onClick={()=>shoot('L')}>⬅️</button>
//             <button className="btn" style={{flex:1, height:60, fontSize:24, background:'#34495e', borderBottom:'5px solid #2c3e50'}} onClick={()=>shoot('C')}>⬆️</button>
//             <button className="btn" style={{flex:1, height:60, fontSize:24, background:'#34495e', borderBottom:'5px solid #2c3e50'}} onClick={()=>shoot('R')}>➡️</button>
//             <button className="btn" style={{flex:1, height:60, fontSize:18, fontWeight:'bold', background:'#9b59b6', borderBottom:'5px solid #8e44ad', color:'white'}} onClick={handleRandomShoot}>🎲 랜덤</button>
//         </div>
//       ) : (
//         <div style={{padding:15, background:'rgba(255,255,255,0.1)', borderRadius:10, color:'#ccc', fontSize:18}}>
//             {isFinished ? "결과를 확인하세요." : (animState === 'idle' ? "상대방 기다리는 중..." : "결과 확인 중! 👀")}
//         </div>
//       )}
//     </div>
//   );
// }

import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { doc, updateDoc, runTransaction, increment, addDoc, collection, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../LanguageContext'; // 👈

const styles = `
  @keyframes flyLeft { 0% { bottom: 10px; left: 50%; transform: translateX(-50%) scale(1); } 100% { bottom: 80%; left: 20%; transform: translateX(-50%) scale(0.6); } }
  @keyframes flyCenter { 0% { bottom: 10px; left: 50%; transform: translateX(-50%) scale(1); } 100% { bottom: 80%; left: 50%; transform: translateX(-50%) scale(0.6); } }
  @keyframes flyRight { 0% { bottom: 10px; left: 50%; transform: translateX(-50%) scale(1); } 100% { bottom: 80%; left: 80%; transform: translateX(-50%) scale(0.6); } }
  @keyframes diveLeft { 0% { transform: translateX(0); } 100% { transform: translateX(-80px) rotate(-20deg); } }
  @keyframes diveRight { 0% { transform: translateX(0); } 100% { transform: translateX(80px) rotate(20deg); } }
  @keyframes popIn { 0% { transform: scale(0); opacity: 0; } 80% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
  .ball { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); width: 30px; height: 30px; background: white; border-radius: 50%; box-shadow: 2px 2px 5px rgba(0,0,0,0.5); z-index: 5; }
  .ball::after { content: '⚽'; position: absolute; top: -3px; left: -3px; font-size: 34px; }
  .keeper { font-size: 50px; z-index: 2; transition: all 0.5s; }
  .result-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 40px; font-weight: bold; text-shadow: 0 0 10px rgba(0,0,0,0.8); z-index: 10; animation: popIn 0.3s; white-space: nowrap; }
`;

export default function Soccer({ room, user, myRole }) {
  const navigate = useNavigate();
  const gd = room.gameData;
  const isKicker = gd.kicker === user.uid; 
  const myDir = myRole === 'host' ? gd.hostDir : gd.guestDir;
  const isFinished = room.status === 'finished'; 
  const isGuestReady = gd.guestReady === true;
  const { t } = useLanguage(); // 👈

  const [animState, setAnimState] = useState('idle');
  const [ballAnim, setBallAnim] = useState({});
  const [keeperAnim, setKeeperAnim] = useState({});
  const [resultMsg, setResultMsg] = useState(null); 
  const [bgStatus, setBgStatus] = useState('normal');
  const [timeLeft, setTimeLeft] = useState(20);

  useEffect(() => {
    if (myDir || isFinished || animState !== 'idle') {
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
  }, [myDir, isFinished, animState]);

  const handleTimeOut = () => {
    const winnerUid = myRole === 'host' ? room.guest : room.host;
    endGame(winnerUid, "Time Out");
  };

  const endGame = async (winnerUid, reason = "Win") => {
    if (isFinished) return;

    await runTransaction(db, async (t) => {
      const roomRef = doc(db, "battle_rooms", room.id);
      
      if (winnerUid === 'draw') {
        const hostRef = doc(db, "users", room.host);
        const guestRef = doc(db, "users", room.guest);
        t.update(hostRef, { point: increment(room.betAmount) });
        t.update(guestRef, { point: increment(room.betAmount) });
      } else {
        const winRef = doc(db, "users", winnerUid);
        t.update(winRef, { point: increment(room.betAmount * 2) });
      }
      t.update(roomRef, { winner: winnerUid, status: 'finished', "gameData.guestReady": false });
    });

    if (winnerUid !== 'draw') {
        await addDoc(collection(db, "history"), {
            uid: winnerUid, type: "게임", msg: `${t.g_soccer} ${reason}`, amount: room.betAmount * 2, createdAt: serverTimestamp()
        });
    } else {
        await addDoc(collection(db, "history"), { uid: room.host, type: "게임", msg: "Soccer Draw", amount: room.betAmount, createdAt: serverTimestamp() });
        await addDoc(collection(db, "history"), { uid: room.guest, type: "게임", msg: "Soccer Draw", amount: room.betAmount, createdAt: serverTimestamp() });
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

            if (hSnap.data().point < room.betAmount || gSnap.data().point < room.betAmount) throw new Error("No Money");

            t.update(hostRef, { point: increment(-room.betAmount) });
            t.update(guestRef, { point: increment(-room.betAmount) });

            const roomRef = doc(db, "battle_rooms", room.id);
            t.update(roomRef, { 
                status: 'playing',
                winner: null,
                "gameData.hostDir": null, "gameData.guestDir": null,
                "gameData.hostScore": 0, "gameData.guestScore": 0,
                "gameData.round": 1,
                "gameData.history": [],
                "gameData.kicker": room.host,
                "gameData.guestReady": false
            });
        });

        await addDoc(collection(db, "history"), {
            uid: user.uid, type: "게임", msg: "Soccer Restart", amount: -room.betAmount, createdAt: serverTimestamp()
        });
    } catch (e) {
        alert("Error: " + e.message);
    }
  };

  const handleHostExit = async () => {
      if (window.confirm("Destroy?")) {
          await deleteDoc(doc(db, "battle_rooms", room.id));
          navigate('/gamelobby');
      }
  };

  const handleGuestExit = () => {
      navigate('/gamelobby');
  };

  const shoot = async (dir) => {
    if (myDir || isFinished) return;
    const field = myRole === 'host' ? "gameData.hostDir" : "gameData.guestDir";
    await updateDoc(doc(db, "battle_rooms", room.id), { [field]: dir });
  };

  const handleRandomShoot = () => {
      if (myDir || isFinished) return; 
      const dirs = ['L', 'C', 'R'];
      shoot(dirs[Math.floor(Math.random() * 3)]);
  };

  useEffect(() => {
    if (gd.hostDir && gd.guestDir) {
      setAnimState('shooting');
      const kickDir = gd.kicker === room.host ? gd.hostDir : gd.guestDir;
      const saveDir = gd.kicker === room.host ? gd.guestDir : gd.hostDir;

      let ballStyle = { animation: `fly${kickDir === 'L' ? 'Left' : kickDir === 'R' ? 'Right' : 'Center'} 0.6s forwards` };
      setBallAnim(ballStyle);
      
      let keeperStyle = {};
      if (saveDir === 'L') keeperStyle = { animation: 'diveLeft 0.5s forwards' };
      if (saveDir === 'R') keeperStyle = { animation: 'diveRight 0.5s forwards' };
      setKeeperAnim(keeperStyle);

      const timer = setTimeout(async () => {
        if (myRole !== 'host') return;
        if (isFinished) return;

        const isGoal = gd.hostDir !== gd.guestDir;
        const isHostKicker = gd.kicker === room.host;
        let newH = gd.hostScore;
        let newG = gd.guestScore;
        if (isHostKicker && isGoal) newH++;
        if (!isHostKicker && isGoal) newG++;

        const mark = isGoal ? '🟢' : '🔴'; 
        const newHistory = [...(gd.history || []), mark];

        if (gd.round >= 10 || (gd.round >= 6 && Math.abs(newH - newG) > (10 - gd.round + 1) / 2)) {
             if (newH > newG) endGame(room.host);
             else if (newG > newH) endGame(room.guest);
             else endGame('draw');
        } else {
            await updateDoc(doc(db, "battle_rooms", room.id), {
                "gameData.hostDir": null, "gameData.guestDir": null,
                "gameData.hostScore": newH, "gameData.guestScore": newG,
                "gameData.kicker": isHostKicker ? room.guest : room.host, 
                "gameData.round": gd.round + 1,
                "gameData.history": newHistory
            });
        }
      }, 2500); 
      return () => clearTimeout(timer);
    } else {
        setAnimState('idle');
        setResultMsg(null);
        setBgStatus('normal');
        setBallAnim({});
        setKeeperAnim({});
    }
  }, [gd.hostDir, gd.guestDir, isFinished]);

  useEffect(() => {
      if (animState === 'shooting') {
          const kickDir = gd.kicker === room.host ? gd.hostDir : gd.guestDir;
          const saveDir = gd.kicker === room.host ? gd.guestDir : gd.hostDir;
          const isGoal = kickDir !== saveDir; 
          const timer = setTimeout(() => {
              if (isKicker) {
                  if (isGoal) { setResultMsg("🎉 GOAL!"); setBgStatus("good"); } 
                  else { setResultMsg("❌ BLOCKED"); setBgStatus("bad"); }
              } else {
                  if (isGoal) { setResultMsg("😭 GOAL..."); setBgStatus("bad"); } 
                  else { setResultMsg("🛡️ SAVE!"); setBgStatus("good"); }
              }
          }, 600); 
          return () => clearTimeout(timer);
      }
  }, [animState, isKicker]); 

  const getBgColor = () => {
      if (bgStatus === 'good') return '#2ecc71'; 
      if (bgStatus === 'bad') return '#e74c3c';  
      return '#27ae60'; 
  };

  return (
    <div style={{textAlign:'center', width:'100%'}}>
      <style>{styles}</style>

      {/* 🆚 스코어보드 */}
      <div style={{background:'#222', color:'#fff', padding:10, borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:15, border:'2px solid #555'}}>
         <div style={{textAlign:'left'}}>
             <div style={{fontSize:12, color:'#aaa'}}>HOST</div>
             <div style={{fontSize:18, fontWeight:'bold', color: room.host === gd.kicker ? '#f1c40f' : '#fff'}}>
                 {room.hostName} ({gd.hostScore})
             </div>
         </div>
         <div style={{display:'flex', gap:3, flexWrap:'wrap', maxWidth:'150px', justifyContent:'center'}}>
             {gd.history.map((m,i)=><span key={i} style={{fontSize:12}}>{m}</span>)}
         </div>
         <div style={{textAlign:'right'}}>
             <div style={{fontSize:12, color:'#aaa'}}>GUEST</div>
             <div style={{fontSize:18, fontWeight:'bold', color: room.guest === gd.kicker ? '#f1c40f' : '#fff'}}>
                 {room.guestName} ({gd.guestScore})
             </div>
         </div>
      </div>

      {/* 경기장 */}
      <div style={{
          position:'relative', height:220, background: getBgColor(), 
          borderRadius:10, border:'4px solid white', 
          overflow:'hidden', display:'flex', justifyContent:'center', alignItems:'flex-end',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)', transition: 'background 0.3s'
      }}>
         <div style={{position:'absolute', top:10, width:'60%', height:'80%', borderTop:'8px solid white', borderLeft:'8px solid white', borderRight:'8px solid white', opacity:0.8}}></div>
         <div className="keeper" style={{marginBottom: 20, ...keeperAnim}}>🧤</div>
         <div className="ball" style={ballAnim}></div>
         {resultMsg && <div className="result-text" style={{color: '#fff'}}>{resultMsg}</div>}
         
         {/* 🏆 게임 종료 */}
         {isFinished && (
            <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', zIndex:50}}>
                <h1 style={{color:'#f1c40f', fontSize:40, textShadow:'0 0 10px red', margin:0}}>GAME OVER</h1>
                <h3 style={{color:'white', marginBottom:30}}>
                    {room.winner === 'draw' ? t.draw : (room.winner === user.uid ? t.win : t.lose)}
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
                                <button className="btn" style={{flex:1, background:'#27ae60', padding:'15px', fontWeight:'bold', animation:'popIn 0.5s'}} onClick={handleGuestReady}>
                                    {t.ready}
                                </button>
                            ) : (
                                <div style={{flex:1, background:'#2c3e50', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:5, padding:'0 10px'}}>
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

      {/* 컨트롤 패널 & 타이머 */}
      <h2 style={{color: isKicker ? '#f1c40f' : '#3498db', margin:'15px 0', fontWeight:'bold'}}>
        {isFinished ? "Finish" : (isKicker ? "Kick!" : "Block!")}
      </h2>
      
      {!isFinished && !myDir && (
          <div style={{marginBottom:10, color: timeLeft<=5?'#e74c3c':'#f1c40f', fontWeight:'bold'}}>
              {timeLeft}s
          </div>
      )}

      {!myDir && !isFinished ? (
        <div style={{display:'flex', gap:10}}>
            <button className="btn" style={{flex:1, height:60, fontSize:24, background:'#34495e', borderBottom:'5px solid #2c3e50'}} onClick={()=>shoot('L')}>⬅️</button>
            <button className="btn" style={{flex:1, height:60, fontSize:24, background:'#34495e', borderBottom:'5px solid #2c3e50'}} onClick={()=>shoot('C')}>⬆️</button>
            <button className="btn" style={{flex:1, height:60, fontSize:24, background:'#34495e', borderBottom:'5px solid #2c3e50'}} onClick={()=>shoot('R')}>➡️</button>
            <button className="btn" style={{flex:1, height:60, fontSize:18, fontWeight:'bold', background:'#9b59b6', borderBottom:'5px solid #8e44ad', color:'white'}} onClick={handleRandomShoot}>🎲</button>
        </div>
      ) : (
        <div style={{padding:15, background:'rgba(255,255,255,0.1)', borderRadius:10, color:'#ccc', fontSize:18}}>
            {isFinished ? t.result : (animState === 'idle' ? "Waiting..." : "Checking...")}
        </div>
      )}
    </div>
  );
}


