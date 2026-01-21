import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
// 👇 deleteDoc 포함 필수 함수 import
import { doc, updateDoc, runTransaction, increment, addDoc, collection, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function RPS({ room, user, myRole }) {
  const navigate = useNavigate();
  const gd = room.gameData;
  const myMove = myRole === 'host' ? gd.hostMove : gd.guestMove;
  const isFinished = room.status === 'finished';
  const isGuestReady = gd.guestReady === true;

  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20); // ⏳ 타임아웃 20초

  // ⏳ 타임아웃 로직 (내가 아직 안 냈을 때만 작동)
  useEffect(() => {
    if (myMove || isFinished || showResult) {
        setTimeLeft(20);
        return;
    }

    const timer = setInterval(() => {
        setTimeLeft((prev) => {
            if (prev <= 1) {
                clearInterval(timer);
                handleTimeOut(); // 0초 되면 시간패
                return 0;
            }
            return prev - 1;
        });
    }, 1000);

    return () => clearInterval(timer);
  }, [myMove, isFinished, showResult]);

  // ⏰ 시간 초과 패배 처리
  const handleTimeOut = () => {
    const winnerUid = myRole === 'host' ? room.guest : room.host;
    endGame(winnerUid, "시간 초과 (기권패)");
  };

  // 🏁 게임 종료
  const endGame = async (winnerUid, reason = "승리") => {
    // 이미 끝난 상태면 중복 실행 방지
    if (room.status === 'finished') return;

    await runTransaction(db, async (t) => {
      const roomRef = doc(db, "battle_rooms", room.id);
      if (winnerUid === 'draw') { /* 무승부 */ }
      else {
        const winRef = doc(db, "users", winnerUid);
        t.update(winRef, { point: increment(room.betAmount * 2) });
      }
      t.update(roomRef, { winner: winnerUid, status: 'finished', "gameData.guestReady": false });
    });

    if (winnerUid !== 'draw') {
        await addDoc(collection(db, "history"), {
            uid: winnerUid, type: "게임", msg: `가위바위보 ${reason} (상금)`, amount: room.betAmount * 2, createdAt: serverTimestamp()
        });
    }
  };

  // 🔄 재대결 & 나가기 로직
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

            if (hSnap.data().point < room.betAmount || gSnap.data().point < room.betAmount) throw new Error("잔액 부족");

            // 배팅금 차감
            t.update(hostRef, { point: increment(-room.betAmount) });
            t.update(guestRef, { point: increment(-room.betAmount) });

            // 게임 리셋
            const roomRef = doc(db, "battle_rooms", room.id);
            t.update(roomRef, { 
                status: 'playing',
                winner: null,
                "gameData.hostMove": null, "gameData.guestMove": null,
                "gameData.hostScore": 0, "gameData.guestScore": 0,
                "gameData.round": 1,
                "gameData.guestReady": false
            });
        });

        await addDoc(collection(db, "history"), {
            uid: user.uid, type: "게임", msg: "가위바위보 재대결 (배팅)", amount: -room.betAmount, createdAt: serverTimestamp()
        });
    } catch (e) {
        alert("재대결 실패: " + e.message);
    }
  };

  const handleHostExit = async () => {
      if (window.confirm("방을 삭제하고 나가시겠습니까?")) {
          await deleteDoc(doc(db, "battle_rooms", room.id));
          navigate('/gamelobby');
      }
  };

  const handleGuestExit = () => {
      navigate('/gamelobby');
  };

  const selectMove = async (move) => {
    if (myMove || isFinished) return;
    const field = myRole === 'host' ? "gameData.hostMove" : "gameData.guestMove";
    await updateDoc(doc(db, "battle_rooms", room.id), { [field]: move });
  };

  useEffect(() => {
    if (gd.hostMove && gd.guestMove) {
      setShowResult(true);
      const timer = setTimeout(async () => {
        if (myRole !== 'host') return;
        if (room.status === 'finished') return; // 종료됐으면 실행 X
        
        let winner = null; 
        const h = gd.hostMove, g = gd.guestMove;
        
        if (h !== g) {
          if ((h==='r'&&g==='s') || (h==='s'&&g==='p') || (h==='p'&&g==='r')) winner = 'host';
          else winner = 'guest';
        }
        
        const newH = winner === 'host' ? gd.hostScore + 1 : gd.hostScore;
        const newG = winner === 'guest' ? gd.guestScore + 1 : gd.guestScore;

        // 2점 먼저 내면 승리
        if (newH >= 2) endGame(room.host);
        else if (newG >= 2) endGame(room.guest);
        else {
          await updateDoc(doc(db, "battle_rooms", room.id), {
            "gameData.hostMove": null, "gameData.guestMove": null,
            "gameData.hostScore": newH, "gameData.guestScore": newG,
            "gameData.round": gd.round + 1
          });
        }
      }, 2500); 
      return () => clearTimeout(timer);
    } else { 
        setShowResult(false); 
    }
  }, [gd.hostMove, gd.guestMove, room.status]);

  return (
    <div style={{textAlign:'center', width:'100%', position:'relative'}}>
      <style>{`
        @keyframes shake {
            0% { transform: rotate(0deg) translateY(0); }
            25% { transform: rotate(-10deg) translateY(-10px); }
            50% { transform: rotate(0deg) translateY(0); }
            75% { transform: rotate(10deg) translateY(-10px); }
            100% { transform: rotate(0deg) translateY(0); }
        }
        @keyframes pop {
            0% { transform: scale(0.5); opacity: 0; }
            80% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(1); }
        }
      `}</style>

      {/* 🆚 닉네임 표시 */}
      <h3>
          {room.hostName} <span style={{color:'#f1c40f', fontSize:24}}>{gd.hostScore}</span> : <span style={{color:'#f1c40f', fontSize:24}}>{gd.guestScore}</span> {room.guestName}
      </h3>
      
      {/* ⏰ 타이머 */}
      {!isFinished && !myMove && !showResult && (
          <div style={{color: timeLeft <= 5 ? '#e74c3c' : '#f1c40f', fontWeight:'bold', marginBottom:10}}>
              남은 시간: {timeLeft}초
          </div>
      )}
      
      {/* ✊ 주먹 애니메이션 영역 */}
      <div style={{
          fontSize: 80, margin:'30px 0', 
          display:'flex', justifyContent:'center', gap: 50,
          perspective: 500
      }}>
        {showResult ? (
          <div style={{animation:'pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)', display:'flex', gap:50}}>
             <div>{gd.hostMove==='r'?'✊':gd.hostMove==='p'?'✋':'✌️'}</div>
             <div style={{fontSize:40, alignSelf:'center'}}>VS</div>
             <div>{gd.guestMove==='r'?'✊':gd.guestMove==='p'?'✋':'✌️'}</div>
          </div>
        ) : (
          <div style={{display:'flex', gap:50}}>
             <div style={{animation: 'shake 0.8s infinite', transformOrigin:'bottom center'}}>✊</div>
             <div style={{fontSize:40, alignSelf:'center', color:'#aaa'}}>VS</div>
             <div style={{animation: 'shake 0.8s infinite reverse', transformOrigin:'bottom center'}}>✊</div>
          </div>
        )}
      </div>

      {/* 컨트롤 버튼 */}
      {!myMove && !showResult && !isFinished && (
        <div>
            <div style={{marginBottom:10, fontSize:18, fontWeight:'bold', color:'#f1c40f'}}>무엇을 낼까요?</div>
            <div style={{display:'flex', gap:10, justifyContent:'center'}}>
              {['r','p','s'].map(m => (
                <button key={m} className="btn" 
                    style={{fontSize:40, padding:'10px 20px', borderRadius:15, background:'#34495e', border:'2px solid #555', boxShadow:'0 5px 0 #222', transition:'transform 0.1s'}}
                    onClick={()=>selectMove(m)}
                    onMouseDown={(e)=>e.currentTarget.style.transform='translateY(5px)'}
                    onMouseUp={(e)=>e.currentTarget.style.transform='translateY(0)'}
                >
                  {m==='r'?'✊':m==='p'?'✋':'✌️'}
                </button>
              ))}
            </div>
        </div>
      )}
      
      {myMove && !showResult && !isFinished && (
          <div style={{fontSize:20, color:'#aaa', marginTop:20}}>
              상대방이 고민 중입니다... 🤔
          </div>
      )}

      {/* 🏆 게임 종료 오버레이 (재대결/나가기) */}
      {isFinished && (
        <div style={{
            position:'absolute', top:0, left:0, width:'100%', height:'100%', 
            background:'rgba(0,0,0,0.85)', zIndex:100, borderRadius: 10,
            display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'
        }}>
            <h1 style={{color:'#f1c40f', fontSize:40, textShadow:'0 0 10px red', margin:0}}>GAME OVER</h1>
            <h3 style={{color:'white', marginBottom:30}}>
                {room.winner === user.uid ? "🏆 승리!" : "😭 패배..."}
            </h3>

            <div style={{display:'flex', gap:10, width:'80%', justifyContent:'center', maxWidth:'400px'}}>
                {myRole === 'host' ? (
                    <>
                        <button className="btn" disabled={!isGuestReady} 
                            style={{flex:1, background: isGuestReady ? '#2980b9' : '#7f8c8d', padding:'15px', cursor: isGuestReady ? 'pointer' : 'not-allowed', color: 'white', fontWeight: 'bold'}} 
                            onClick={restartGame}>
                            {isGuestReady ? "🔄 한 판 더" : "⏳ 대기중..."}
                        </button>
                        <button className="btn" style={{flex:1, background:'#c0392b', padding:'15px', fontWeight:'bold'}} onClick={handleHostExit}>
                            🏠 방 삭제
                        </button>
                    </>
                ) : (
                    <>
                        {!isGuestReady ? (
                            <button className="btn" style={{flex:1, background:'#27ae60', padding:'15px', fontWeight:'bold'}} onClick={handleGuestReady}>
                                ✋ 준비 완료
                            </button>
                        ) : (
                            <div style={{flex:1, background:'#2c3e50', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:5}}>
                                방장 대기중...
                            </div>
                        )}
                        <button className="btn" style={{flex:1, background:'#555', padding:'15px', fontWeight:'bold'}} onClick={handleGuestExit}>
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