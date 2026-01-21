import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, updateDoc, runTransaction, increment, addDoc, collection, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// 🎨 스타일 정의
const styles = `
  .memory-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; width: 100%; max-width: 600px; margin: 20px auto; perspective: 1000px; }
  .card-container { width: 100%; aspect-ratio: 2/3; position: relative; cursor: pointer; transform-style: preserve-3d; transition: transform 0.6s; }
  .card-container.flipped { transform: rotateY(180deg); }
  .card-face { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 8px; display: flex; justify-content: center; alignItems: center; font-size: 24px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 2px solid #fff; }
  .card-front { background: white; color: #333; transform: rotateY(180deg); }
  .card-back { background: repeating-linear-gradient(45deg, #c0392b, #c0392b 10px, #e74c3c 10px, #e74c3c 20px); }
  .card-matched { opacity: 0.5; cursor: default; }
  @keyframes pop { 0% { transform: scale(0); opacity: 0; } 80% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); } }
`;

// 🃏 카드 덱 생성 (10쌍 = 20장)
const generateDeck = () => {
    let deck = [];
    let id = 0;
    const pairs = [
        {v:'A', s:'♠'}, {v:'A', s:'♥'}, 
        {v:'K', s:'♣'}, {v:'K', s:'♦'},
        {v:'Q', s:'♠'}, {v:'Q', s:'♥'},
        {v:'J', s:'♣'}, {v:'J', s:'♦'},
        {v:'10', s:'♠'}, {v:'10', s:'♥'}
    ];
    
    pairs.forEach(p => {
        deck.push({ id: id++, val: p.v, suit: p.s, isFlipped: false, isMatched: false });
        deck.push({ id: id++, val: p.v, suit: p.s, isFlipped: false, isMatched: false });
    });

    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

export default function Memory({ room, user, myRole }) {
    const navigate = useNavigate();
    const gd = room.gameData;
    const isMyTurn = gd.turn === user.uid;
    const isFinished = room.status === 'finished';
    const isGuestReady = gd.guestReady === true;

    const [timeLeft, setTimeLeft] = useState(20);
    const [processing, setProcessing] = useState(false);

    // ⏳ 타임아웃
    useEffect(() => {
        if (!isMyTurn || isFinished || processing) {
            setTimeLeft(20);
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleTimeOut();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isMyTurn, isFinished, processing]);

    const handleTimeOut = () => {
        const winnerUid = myRole === 'host' ? room.guest : room.host;
        endGame(winnerUid, "시간 초과 (기권패)");
    };

    // 🃏 카드 클릭 핸들러
    const handleCardClick = async (idx) => {
        if (!isMyTurn || isFinished || processing) return;
        if (gd.deck[idx].isFlipped || gd.deck[idx].isMatched) return;
        
        // 🚨 [수정됨] 안전하게 배열 길이 확인 (|| 0 추가)
        if ((gd.flippedIndices?.length || 0) >= 2) return;

        const newDeck = [...gd.deck];
        newDeck[idx].isFlipped = true;
        
        // 🚨 [수정됨] 안전하게 배열 복사 (|| [] 추가)
        const newFlipped = [...(gd.flippedIndices || []), idx];

        await updateDoc(doc(db, "battle_rooms", room.id), {
            "gameData.deck": newDeck,
            "gameData.flippedIndices": newFlipped
        });
    };

    // 👀 매칭 검사 로직
    useEffect(() => {
        // 🚨 [수정됨] 여기가 에러 원인이었음 (?.length 로 변경)
        if (gd.flippedIndices?.length === 2 && isMyTurn) {
            setProcessing(true);
            setTimeout(() => checkMatch(), 800);
        }
    }, [gd.flippedIndices]);

    const checkMatch = async () => {
        // 🚨 [수정됨] 안전하게 배열 가져오기
        const [idx1, idx2] = gd.flippedIndices || [];
        if (idx1 === undefined || idx2 === undefined) return;

        const card1 = gd.deck[idx1];
        const card2 = gd.deck[idx2];
        const newDeck = [...gd.deck];
        
        let nextTurn = gd.turn;

        if (card1.val === card2.val && card1.suit === card2.suit) {
            newDeck[idx1].isMatched = true;
            newDeck[idx2].isMatched = true;
            
            const scoreField = myRole === 'host' ? "gameData.hostScore" : "gameData.guestScore";
            const currentScore = myRole === 'host' ? gd.hostScore : gd.guestScore;
            const leftPairs = (gd.pairsLeft || 10) - 1; // 기본값 10 안전장치
            
            if (leftPairs === 0) {
                const finalHostScore = myRole === 'host' ? currentScore + 1 : gd.hostScore;
                const finalGuestScore = myRole !== 'host' ? currentScore + 1 : gd.guestScore;
                
                let winner = 'draw';
                if (finalHostScore > finalGuestScore) winner = room.host;
                else if (finalGuestScore > finalHostScore) winner = room.guest;

                await runTransaction(db, async (t) => {
                    const roomRef = doc(db, "battle_rooms", room.id);
                    if (winner !== 'draw') {
                        const winRef = doc(db, "users", winner);
                        t.update(winRef, { point: increment(room.betAmount * 2) });
                    } else {
                        t.update(doc(db, "users", room.host), { point: increment(room.betAmount) });
                        t.update(doc(db, "users", room.guest), { point: increment(room.betAmount) });
                    }
                    t.update(roomRef, { 
                        status: 'finished', 
                        winner: winner, 
                        "gameData.deck": newDeck, 
                        "gameData.hostScore": finalHostScore,
                        "gameData.guestScore": finalGuestScore,
                        "gameData.pairsLeft": 0,
                        "gameData.guestReady": false
                    });
                });

                if (winner !== 'draw') {
                    await addDoc(collection(db, "history"), { uid: winner, type: "게임", msg: "기억력 게임 승리 (상금)", amount: room.betAmount * 2, createdAt: serverTimestamp() });
                }
                setProcessing(false);
                return;
            } else {
                await updateDoc(doc(db, "battle_rooms", room.id), {
                    "gameData.deck": newDeck,
                    "gameData.flippedIndices": [],
                    "gameData.pairsLeft": leftPairs,
                    [scoreField]: currentScore + 1
                });
            }
        } else {
            newDeck[idx1].isFlipped = false;
            newDeck[idx2].isFlipped = false;
            nextTurn = myRole === 'host' ? room.guest : room.host;

            await updateDoc(doc(db, "battle_rooms", room.id), {
                "gameData.deck": newDeck,
                "gameData.flippedIndices": [],
                "gameData.turn": nextTurn
            });
        }
        setProcessing(false);
    };

    const endGame = async (winnerUid, reason) => {
        if (isFinished) return;
        await runTransaction(db, async (t) => {
            const roomRef = doc(db, "battle_rooms", room.id);
            const winRef = doc(db, "users", winnerUid);
            t.update(winRef, { point: increment(room.betAmount * 2) });
            t.update(roomRef, { winner: winnerUid, status: 'finished', "gameData.guestReady": false });
        });
        await addDoc(collection(db, "history"), { uid: winnerUid, type: "게임", msg: `기억력 게임 ${reason}`, amount: room.betAmount * 2, createdAt: serverTimestamp() });
    };

    const handleGuestReady = async () => {
        await updateDoc(doc(db, "battle_rooms", room.id), { "gameData.guestReady": true });
    };

    const restartGame = async () => {
        if (!isGuestReady) return;
        try {
            await runTransaction(db, async (t) => {
                const hRef = doc(db, "users", room.host);
                const gRef = doc(db, "users", room.guest);
                const hSnap = await t.get(hRef);
                const gSnap = await t.get(gRef);
                if (hSnap.data().point < room.betAmount || gSnap.data().point < room.betAmount) throw new Error("잔액 부족");

                t.update(hRef, { point: increment(-room.betAmount) });
                t.update(gRef, { point: increment(-room.betAmount) });

                const newDeck = generateDeck();
                const nextTurn = Math.random() < 0.5 ? room.host : room.guest;

                const roomRef = doc(db, "battle_rooms", room.id);
                t.update(roomRef, { 
                    status: 'playing', winner: null,
                    "gameData.deck": newDeck,
                    "gameData.flippedIndices": [],
                    "gameData.turn": nextTurn,
                    "gameData.hostScore": 0, "gameData.guestScore": 0,
                    "gameData.pairsLeft": 10,
                    "gameData.guestReady": false
                });
            });
            await addDoc(collection(db, "history"), { uid: user.uid, type: "게임", msg: "기억력 게임 재대결", amount: -room.betAmount, createdAt: serverTimestamp() });
        } catch (e) { alert("재대결 실패: " + e.message); }
    };

    const handleHostExit = async () => {
        if (window.confirm("방을 삭제하시겠습니까?")) {
            await deleteDoc(doc(db, "battle_rooms", room.id));
            navigate('/gamelobby');
        }
    };
    const handleGuestExit = () => navigate('/gamelobby');

    useEffect(() => {
        if (myRole === 'host' && (!gd.deck || gd.deck.length === 0)) {
            const newDeck = generateDeck();
            updateDoc(doc(db, "battle_rooms", room.id), {
                "gameData.deck": newDeck,
                "gameData.flippedIndices": [],
                "gameData.hostScore": 0,
                "gameData.guestScore": 0,
                "gameData.pairsLeft": 10,
                "gameData.turn": room.host
            });
        }
    }, []);

    if (!gd.deck) return <div>카드 세팅 중...</div>;

    return (
        <div style={{textAlign:'center', width:'100%', position:'relative'}}>
            <style>{styles}</style>

            {/* 🆚 점수판 */}
            <div style={{background:'#2c3e50', padding:10, borderRadius:10, marginBottom:15, display:'flex', justifyContent:'space-between', alignItems:'center', border:'2px solid #555'}}>
                <div style={{opacity: gd.turn === room.host ? 1 : 0.5}}>
                    <div style={{color:'#f1c40f', fontWeight:'bold'}}>{room.hostName}</div>
                    <div style={{fontSize:24, color:'white'}}>{gd.hostScore}점</div>
                </div>
                <div style={{color:'white', fontWeight:'bold'}}>
                    {!isFinished && <span style={{color: timeLeft<=5?'#e74c3c':'#fff'}}>⏳ {timeLeft}초</span>}
                </div>
                <div style={{opacity: gd.turn === room.guest ? 1 : 0.5}}>
                    <div style={{color:'#f1c40f', fontWeight:'bold'}}>{room.guestName}</div>
                    <div style={{fontSize:24, color:'white'}}>{gd.guestScore}점</div>
                </div>
            </div>

            {/* 🃏 카드 그리드 */}
            <div className="memory-grid">
                {gd.deck.map((card, idx) => (
                    <div key={card.id} 
                         className={`card-container ${(card.isFlipped || card.isMatched) ? 'flipped' : ''} ${card.isMatched ? 'card-matched' : ''}`}
                         onClick={() => handleCardClick(idx)}>
                        <div className="card-face card-front" style={{color: (card.suit==='♥'||card.suit==='♦') ? '#e74c3c':'#2c3e50'}}>
                            {card.suit}{card.val}
                        </div>
                        <div className="card-face card-back"></div>
                    </div>
                ))}
            </div>

            {/* 상태 메시지 */}
            {!isFinished && (
                <div style={{fontSize:20, fontWeight:'bold', color: isMyTurn ? '#2ecc71' : '#7f8c8d', margin:'10px 0'}}>
                    {isMyTurn ? "당신의 차례입니다!" : "상대방의 턴..."}
                </div>
            )}

            {/* 🏆 결과 화면 */}
            {isFinished && (
                <div style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.85)', zIndex:100, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', borderRadius:10}}>
                    <h1 style={{color: room.winner === user.uid ? '#f1c40f' : '#ccc', fontSize:40, marginBottom:10}}>
                        {room.winner === user.uid ? "🏆 YOU WIN!" : (room.winner === 'draw' ? "🤝 DRAW" : "😭 YOU LOSE")}
                    </h1>
                    <div style={{color:'white', fontSize:20, marginBottom:30}}>
                        {room.hostName}: {gd.hostScore} vs {room.guestName}: {gd.guestScore}
                    </div>

                    <div style={{display:'flex', gap:10}}>
                        {myRole === 'host' ? (
                            <>
                                <button className="btn" disabled={!isGuestReady} style={{background: isGuestReady?'#2980b9':'#7f8c8d', padding:'15px', color:'white', fontWeight:'bold'}} onClick={restartGame}>
                                    {isGuestReady ? "🔄 한 판 더" : "⏳ 대기중..."}
                                </button>
                                <button className="btn" style={{background:'#c0392b', padding:'15px', fontWeight:'bold'}} onClick={handleHostExit}>
                                    🏠 방 삭제
                                </button>
                            </>
                        ) : (
                            <>
                                {!isGuestReady ? (
                                    <button className="btn" style={{background:'#27ae60', padding:'15px', fontWeight:'bold'}} onClick={handleGuestReady}>✋ 준비 완료</button>
                                ) : (
                                    <div style={{padding:'15px', background:'#2c3e50', color:'#ccc', borderRadius:5}}>방장 대기중...</div>
                                )}
                                <button className="btn" style={{background:'#555', padding:'15px', fontWeight:'bold'}} onClick={handleGuestExit}>🏠 나가기</button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}