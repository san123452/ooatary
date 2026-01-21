import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, updateDoc, runTransaction, increment, addDoc, collection, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function Reaction({ room, user, myRole }) {
  const navigate = useNavigate();
  const gd = room.gameData;
  const isFinished = room.status === 'finished';
  
  // 내 정보 찾기 (안전하게 옵셔널 체이닝 사용)
  const myPlayer = gd.players?.find(p => p.uid === user.uid);
  
  // 방장 제외 모든 참가자 준비 여부 확인
  const participants = gd.players?.filter(p => p.uid !== room.host) || [];
  const allParticipantsReady = participants.length > 0 && participants.every(p => p.ready);

  const [screenColor, setScreenColor] = useState('#34495e'); 
  const [msg, setMsg] = useState('준비...');

  // 🏁 게임 종료
  const endGame = async (winnerUid, reason = "승리") => {
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
        uid: winnerUid, type: "게임", msg: `반응속도(다인) ${reason} (상금)`, amount: totalPot, createdAt: serverTimestamp()
    });
  };

  // 🔄 준비 완료 (안전한 로직으로 변경)
  const toggleReady = async () => {
      if (!gd.players) return;
      
      // index 대신 map으로 내 uid를 찾아서 변경 (더 안전함)
      const newPlayers = gd.players.map(p => {
          if (p.uid === user.uid) {
              return { ...p, ready: !p.ready };
          }
          return p;
      });

      await updateDoc(doc(db, "battle_rooms", room.id), { "gameData.players": newPlayers });
  };

  // 🔄 재대결
  const restartGame = async () => {
    if (!allParticipantsReady) return;
    try {
        await runTransaction(db, async (t) => {
            const playerDocs = [];
            for (const p of gd.players) {
                const pRef = doc(db, "users", p.uid);
                const pSnap = await t.get(pRef);
                if (!pSnap.exists()) throw new Error(`${p.name}님의 정보가 없습니다.`);
                playerDocs.push({ ref: pRef, data: pSnap.data(), name: p.name });
            }

            for (const pDoc of playerDocs) {
                if (pDoc.data.point < room.betAmount) {
                    throw new Error(`${pDoc.name}님의 잔액이 부족합니다.`);
                }
            }

            for (const pDoc of playerDocs) {
                t.update(pDoc.ref, { point: increment(-room.betAmount) });
            }

            const resetPlayers = gd.players.map(p => ({ ...p, ready: false, reactionTime: null }));
            const roomRef = doc(db, "battle_rooms", room.id);
            
            t.update(roomRef, { 
                status: 'playing',
                winner: null,
                "gameData.state": "ready",
                "gameData.startTime": 0,
                "gameData.players": resetPlayers
            });
        });
        
        await addDoc(collection(db, "history"), {
            uid: user.uid, type: "게임", msg: "반응속도 재대결 (배팅)", amount: -room.betAmount, createdAt: serverTimestamp()
        });

    } catch (e) {
        alert("재대결 실패: " + e.message);
    }
  };

  const leaveGame = async () => {
      if(myRole === 'host') {
          if(window.confirm("방을 폭파하시겠습니까?")) {
              await deleteDoc(doc(db, "battle_rooms", room.id));
              navigate('/gamelobby');
          }
      } else {
          navigate('/gamelobby'); 
      }
  };

  const startReaction = async () => {
    setMsg('집중하세요...');
    const randomDelay = Math.floor(Math.random() * 3000) + 2000; 
    const triggerTime = Date.now() + randomDelay;
    
    const resetPlayers = gd.players.map(p => ({...p, reactionTime: null}));

    await updateDoc(doc(db, "battle_rooms", room.id), { 
      "gameData.state": "wait", 
      "gameData.startTime": triggerTime,
      "gameData.players": resetPlayers
    });
  };

  useEffect(() => {
    if (gd.state === 'wait' && gd.startTime) {
      setScreenColor('#c0392b'); 
      setMsg('기다려!!!');
      
      const now = Date.now();
      const diff = gd.startTime - now;
      
      const timer = setTimeout(() => { 
        setScreenColor('#2ecc71'); 
        setMsg('클릭!!!!'); 
      }, diff);
      
      return () => clearTimeout(timer);
    } else if (gd.state === 'ready') {
        setScreenColor('#34495e'); 
        setMsg('준비...');
    }
  }, [gd.startTime, gd.state]);

  // 🖱️ 클릭 핸들러 (여기가 핵심 수정됨)
  // onMouseDown 대신 onPointerDown 사용 (터치/클릭 모두 호환성 좋음)
  const handlePointerDown = async (e) => {
    // 이벤트 버블링 방지 (버튼 클릭 시 게임 클릭되는 것 방지)
    if (e.target.tagName === 'BUTTON') return;

    if (gd.state !== 'wait') return; 
    if (myPlayer?.reactionTime) return; // 이미 기록이 있으면 무시

    const now = Date.now();
    let reactionValue = now - gd.startTime;
    
    // 🚨 부정출발
    if (now < gd.startTime) {
        // alert("🚨 부정출발! 탈락!"); // 팝업은 흐름 끊기므로 제거하거나 토스트로 대체 추천
        reactionValue = 99999; // 탈락
        setScreenColor('#7f8c8d');
        setMsg("탈락...");
    } else {
        setScreenColor('#34495e');
        setMsg(`기록: ${reactionValue}ms`);
    }

    // 🔥 [수정] map을 사용하여 내 uid를 정확히 찾아서 업데이트
    const newPlayers = gd.players.map(p => {
        if (p.uid === user.uid) {
            return { ...p, reactionTime: reactionValue };
        }
        return p;
    });
    
    await updateDoc(doc(db, "battle_rooms", room.id), { "gameData.players": newPlayers });
  };

  // 🏆 결과 판정
  useEffect(() => {
      const activePlayers = gd.players || [];
      const recordedPlayers = activePlayers.filter(p => p.reactionTime !== null && p.reactionTime !== undefined);

      if (recordedPlayers.length === activePlayers.length && gd.state !== 'result' && !isFinished) {
          const validRecords = recordedPlayers.filter(p => p.reactionTime !== 99999);
          
          let winnerUid = null;
          if (validRecords.length > 0) {
              const winner = validRecords.reduce((prev, curr) => {
                  return (prev.reactionTime < curr.reactionTime) ? prev : curr;
              });
              winnerUid = winner.uid;
          } else {
              winnerUid = room.host; 
          }

          if (myRole === 'host') {
              setTimeout(() => endGame(winnerUid, "승리"), 1000);
          }
      }
  }, [gd.players]);

  return (
    <div 
      onPointerDown={handlePointerDown}  // 👈 마우스/터치 통합 이벤트
      style={{
        width:'100%', height:'500px', 
        background: screenColor, 
        borderRadius:15, 
        display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', 
        color:'white', fontWeight:'bold', 
        cursor:'pointer', userSelect:'none',
        transition: 'background 0.2s',
        position: 'relative',
        touchAction: 'none' // 👈 더블탭 확대 방지
      }}
    >
      {/* 🟢 대기 상태 */}
      {gd.state === 'ready' && !isFinished && (
          <div style={{textAlign:'center', zIndex:10}} onPointerDown={e=>e.stopPropagation()}>
              <h2 style={{marginBottom:20}}>참가자 현황 ({gd.players.length}/4)</h2>
              
              <div style={{display:'flex', gap:10, marginBottom:30, justifyContent:'center', flexWrap:'wrap'}}>
                  {gd.players.map((p, i) => (
                      <div key={i} style={{
                          background: p.ready ? '#27ae60' : '#7f8c8d', 
                          padding:'10px 15px', borderRadius:8, 
                          border: p.uid===room.host ? '2px solid #f1c40f' : 'none',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                      }}>
                          <div>{p.name}</div>
                          <div style={{fontSize:12, marginTop:5}}>
                              {p.uid===room.host ? '👑 방장' : (p.ready ? '✅ 준비됨' : '⏳ 대기중')}
                          </div>
                      </div>
                  ))}
              </div>

              <div style={{display:'flex', gap:10, justifyContent:'center'}}>
                  {myRole === 'host' ? (
                      <>
                          <button className="btn" disabled={!allParticipantsReady || gd.players.length < 2} 
                              style={{fontSize:20, padding:'15px 30px', background: (allParticipantsReady && gd.players.length >= 2) ? '#f1c40f' : '#95a5a6', color: 'black'}} 
                              onClick={startReaction}>
                              {(gd.players.length < 2) ? "인원 부족" : "⚡ 게임 시작"}
                          </button>
                          <button className="btn" style={{fontSize:20, padding:'15px 30px', background:'#c0392b'}} onClick={leaveGame}>
                              나가기
                          </button>
                      </>
                  ) : (
                      <>
                          <button className="btn" 
                              style={{fontSize:20, padding:'15px 30px', background: myPlayer?.ready ? '#e74c3c' : '#27ae60'}} 
                              onClick={toggleReady}>
                              {myPlayer?.ready ? "준비 취소" : "준비 완료"}
                          </button>
                          <button className="btn" style={{fontSize:20, padding:'15px 30px', background:'#555'}} onClick={leaveGame}>
                              나가기
                          </button>
                      </>
                  )}
              </div>
          </div>
      )}
      
      {/* ⚡ 게임 진행 중 */}
      {gd.state !== 'ready' && !isFinished && <h1 style={{fontSize:50}}>{msg}</h1>}

      {/* ⏱️ 실시간 기록 표시 */}
      {gd.state === 'wait' && (
          <div style={{position:'absolute', bottom:20, width:'100%', display:'flex', justifyContent:'center', gap:15}}>
              {gd.players.map((p, i) => (
                  <div key={i} style={{background:'rgba(0,0,0,0.5)', padding:'5px 10px', borderRadius:5, fontSize:14}}>
                      {p.name}: {p.reactionTime ? `${p.reactionTime}ms` : '...'}
                  </div>
              ))}
          </div>
      )}

      {/* 🏆 결과 화면 */}
      {isFinished && (
        <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.9)', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', zIndex:20}} onPointerDown={e=>e.stopPropagation()}>
            <h1 style={{color:'#f1c40f', fontSize:40, marginBottom:10}}>🏆 WINNER 🏆</h1>
            <h2 style={{color:'white', marginBottom:30}}>
                {gd.players.find(p => p.uid === room.winner)?.name} 
                <span style={{color:'#2ecc71', fontSize:20, marginLeft:10}}>(+{(room.betAmount * gd.players.length).toLocaleString()}원)</span>
            </h2>
            
            <div style={{background:'rgba(255,255,255,0.1)', padding:20, borderRadius:10, marginBottom:30, width:'80%', maxWidth:'400px'}}>
                {gd.players
                    .slice() 
                    .sort((a,b) => (a.reactionTime||99999) - (b.reactionTime||99999))
                    .map((p, i) => (
                    <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'10px', borderBottom:'1px solid #555', color: i===0 ? '#f1c40f' : 'white', fontWeight: i===0 ? 'bold' : 'normal'}}>
                        <span>#{i+1} {p.name}</span>
                        <span>
                            {p.reactionTime === 99999 ? '탈락' : (p.reactionTime ? `${p.reactionTime}ms` : '기록 없음')}
                        </span>
                    </div>
                ))}
            </div>

            <div style={{display:'flex', gap:15}}>
                {myRole === 'host' ? (
                    <>
                        <button className="btn" disabled={!allParticipantsReady} 
                            style={{background: allParticipantsReady ? '#2980b9' : '#7f8c8d', padding:'15px 30px', fontSize:18, color:'white'}} 
                            onClick={restartGame}>
                            {allParticipantsReady ? "🔄 한 판 더" : "⏳ 참가자 대기중..."}
                        </button>
                        <button className="btn" style={{background:'#c0392b', padding:'15px 30px', fontSize:18}} onClick={leaveGame}>
                            🏠 방 폭파
                        </button>
                    </>
                ) : (
                    <>
                        <button className="btn" 
                            style={{background: myPlayer?.ready ? '#e74c3c' : '#27ae60', padding:'15px 30px', fontSize:18}} 
                            onClick={toggleReady}>
                            {myPlayer?.ready ? "취소" : "준비 완료"}
                        </button>
                        <button className="btn" style={{background:'#555', padding:'15px 30px', fontSize:18}} onClick={leaveGame}>
                            🏠 나가기
                        </button>
                    </>
                )}
            </div>
        </div>
      )}
    </div>
  );
}