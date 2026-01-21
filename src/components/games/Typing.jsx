import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { doc, updateDoc, increment, runTransaction, onSnapshot } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

const SENTENCES = [
//     "지예아 나는다채로운랩핑과라이밍혹은랩스킬로혼을쏙빼놓는대한민국최고의rap뱉는자손심바하지만데일리다섯명의감상자오맨하지만난데자부소속래퍼들이전부갓마백",
// "그곳의 나는 얼마만큼 울었는지 이곳의 나는 누구보다 잘 알기에 후회로 가득 채운 유리잔만 내려다보네 아 뭐가 그리 샘이 났길래 그토록 휘몰아쳤던가 그럼에도 불구하고 나는 너를 용서하고 사랑 하게 될 거야",
//     "동해 물과 백두산이 마르고 닳도록 하느님이 보우 하사 우리나라만세 무궁화 삼천리 화려강산 대한사람 대한으로 길이 보전하세",
//    "백두산 정기 뻗은 삼천리 강산 무궁화 대한은 아세아의 빛 화랑의 핏줄 타고 자라난 남아 그 이름 용감하다 대한육군 앞으로 앞으로 용진 또 용진 우리는 삼천만 민족의 방패",
//    "나무가 사라져간 산길 주인 없는 바다 그래도 좋지 아니한가 내 마음대로 되는 세상 밤이 오면 싸워왔던 기억일기를 쓸만한 노트와 연필이 생기지 않았나 내 마음대로 그린 세상 ",
//    "하늘에 날린 아드레날린 하나도 화날일 없는 이곳은 그녀와 나 파랑새만이 육감의 교감으로 오감따위는 초월해버린 기적의 땅 쉿! 몽환의 숲"
"1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20",

];

export default function Typing() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    
    const [user, setUser] = useState(null);
    const [room, setRoom] = useState(null);
    const [statusLog, setStatusLog] = useState("초기화 중...");
    
    const [input, setInput] = useState("");
    const [myProgress, setMyProgress] = useState(0);
    const [enemyProgress, setEnemyProgress] = useState(0);
    const [gameResult, setGameResult] = useState(null);
    const [isError, setIsError] = useState(false);
    const [timeLeft, setTimeLeft] = useState(20); // ⏳ 20초 (입력 없을 시 패배)

    // 1. 유저 인증
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) setUser(currentUser);
            else navigate('/login');
        });
        return () => unsubscribe();
    }, [navigate]);

    // 2. 방 데이터 실시간 동기화 (기권패 로직 포함)
    useEffect(() => {
        if (!roomId || !user) return;

        const roomRef = doc(db, "battle_rooms", roomId);
        const unsub = onSnapshot(roomRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setRoom(data);
                setStatusLog("게임 진행 중");

                // 문장 초기화
                if (user.uid === data.host && !data.gameData?.sentence) {
                    const randomSentence = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
                    updateDoc(roomRef, {
                        "gameData.sentence": randomSentence,
                        hostProgress: 0,
                        guestProgress: 0
                    }).catch(e => console.error(e));
                }

                // 진행도 동기화
                const hProg = data.hostProgress ?? 0;
                const gProg = data.guestProgress ?? 0;
                if (user.uid === data.host) setEnemyProgress(gProg);
                else setEnemyProgress(hProg);

                // 결과 처리
                if (data.status === 'finished') {
                    setGameResult(data.winner === user.uid ? 'win' : 'lose');
                } 
                else if (data.status === 'playing' && gameResult !== null) {
                    // 재대결 시 리셋
                    setGameResult(null);
                    setInput("");
                    setMyProgress(0);
                    setEnemyProgress(0);
                    setIsError(false);
                    setTimeLeft(20);
                }

            } else {
                setStatusLog("방이 삭제되었습니다.");
                navigate('/gamelobby');
            }
        });

        return () => unsub();
    }, [roomId, user, gameResult, navigate]);

    // ⏳ 타임아웃 감지 (입력 변화 없을 때)
    useEffect(() => {
        if (gameResult || !room || room.status !== 'playing') return;

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
    }, [input, gameResult, room]); // input이 바뀔 때마다 타이머 리셋 효과

    // ⏰ 시간 초과 패배
    const handleTimeOut = () => {
        const winnerUid = user.uid === room.host ? room.guest : room.host;
        handleWin(winnerUid, "시간 초과 (기권패)");
    };

    // 3. 입력 감지
    const handleChange = async (e) => {
        if (gameResult || !room || room.status !== 'playing') return;
        
        const val = e.target.value;
        const target = room.gameData?.sentence || "";
        
        setInput(val);
        setTimeLeft(20); // 입력하면 타이머 리셋

        // 오타 체크
        if (!target.startsWith(val)) setIsError(true);
        else setIsError(false);
        
        // 진행도 계산
        if (!target) return;
        const progress = Math.min(100, Math.floor((val.length / target.length) * 100));
        setMyProgress(progress);
        
        // DB 업데이트
        const roomRef = doc(db, "battle_rooms", roomId);
        try {
            if (user.uid === room.host) await updateDoc(roomRef, { hostProgress: progress });
            else await updateDoc(roomRef, { guestProgress: progress });
        } catch(err) { console.error(err); }

        // 승리 체크
        if (val === target) handleWin(user.uid);
    };

    // 4. 승리 처리
    const handleWin = async (winnerUid, reason = "승리") => {
        if (room.status === 'finished') return;
        try {
            await runTransaction(db, async (t) => {
                const roomRef = doc(db, "battle_rooms", roomId);
                const sfDoc = await t.get(roomRef);
                if (!sfDoc.exists() || sfDoc.data().status === 'finished') return;
                
                const winAmount = Math.floor(sfDoc.data().betAmount * 2);
                t.update(doc(db, "users", winnerUid), { point: increment(winAmount) });
                t.update(roomRef, { status: 'finished', winner: winnerUid, "gameData.guestReady": false });
            });

            // 기록 저장
            await addDoc(collection(db, "history"), {
                uid: winnerUid, type: "게임", msg: `타자 배틀 ${reason} (상금)`, amount: room.betAmount * 2, createdAt: serverTimestamp()
            });

        } catch (e) { console.log(e); }
    };

    // 🔄 재대결 & 나가기 로직
    const isGuestReady = room?.gameData?.guestReady === true;
    const isHost = user?.uid === room?.host;

    const handleGuestReady = async () => {
        await updateDoc(doc(db, "battle_rooms", roomId), { "gameData.guestReady": true });
    };

    const restartGame = async () => {
        if (!isGuestReady) return;
        try {
            await runTransaction(db, async (t) => {
                const hostRef = doc(db, "users", room.host);
                const guestRef = doc(db, "users", room.guest);
                const hostSnap = await t.get(hostRef);
                const guestSnap = await t.get(guestRef);

                if (hostSnap.data().point < room.betAmount || guestSnap.data().point < room.betAmount) throw new Error("잔액 부족");

                t.update(hostRef, { point: increment(-room.betAmount) });
                t.update(guestRef, { point: increment(-room.betAmount) });

                const roomRef = doc(db, "battle_rooms", roomId);
                const newSentence = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
                
                t.update(roomRef, { 
                    status: 'playing',
                    winner: null,
                    hostProgress: 0,
                    guestProgress: 0,
                    "gameData.sentence": newSentence,
                    "gameData.guestReady": false
                });
            });

            await addDoc(collection(db, "history"), {
                uid: user.uid, type: "게임", msg: "타자 배틀 재대결 (배팅)", amount: -room.betAmount, createdAt: serverTimestamp()
            });
        } catch (e) {
            alert("재대결 실패: " + e.message);
        }
    };

    const handleHostExit = async () => {
        if (window.confirm("방을 삭제하고 나가시겠습니까?")) {
            await deleteDoc(doc(db, "battle_rooms", roomId));
            navigate('/gamelobby');
        }
    };

    const handleGuestExit = () => {
        navigate('/gamelobby');
    };

    if (!roomId || !user || !room) return <div style={{background:'#2c3e50', minHeight:'100vh', color:'white', textAlign:'center', paddingTop:50}}><h1>로딩 중...</h1></div>;

    const targetSentence = room.gameData?.sentence || "문장을 불러오는 중...";

    return (
        <div className="container" style={{ background: '#2c3e50', minHeight: '100vh', padding: '20px', color: 'white', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1 style={{ color: '#f1c40f', marginBottom: 20 }}>⌨️ 스피드 타자 배틀</h1>
            
            <div className="card" style={{ background: '#34495e', padding: '10px', marginBottom: 20, width: '100%', maxWidth: '600px' }}>
                <div style={{ fontSize: 18 }}>판돈: <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>{room.betAmount?.toLocaleString()}원</span></div>
                {/* ⏳ 남은 시간 표시 */}
                {!gameResult && <div style={{ color: timeLeft<=5?'#e74c3c':'#f1c40f', fontWeight:'bold', marginTop:5 }}>입력 대기: {timeLeft}초</div>}
            </div>

            <div className="card" style={{ background: '#ecf0f1', color: '#2c3e50', padding: '20px', borderRadius: '15px', width: '100%', maxWidth: '600px', fontSize: '18px', fontWeight: 'bold', marginBottom: '30px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', wordBreak: 'break-all', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                {targetSentence}
            </div>

            <div style={{ width: '100%', maxWidth: '600px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontWeight: 'bold', color: isError ? '#e74c3c' : '#3498db' }}>
                        😎 {isHost ? room.hostName : room.guestName} ({myProgress}%) {isError && "❌오타!"}
                    </span>
                </div>
                <div style={{ width: '100%', height: '20px', background: '#555', borderRadius: '10px', overflow: 'hidden', marginBottom: '15px' }}>
                    <div style={{ width: `${myProgress}%`, height: '100%', background: isError ? '#e74c3c' : '#3498db', transition: 'width 0.2s' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontWeight: 'bold', color: '#e74c3c' }}>
                        😈 {isHost ? room.guestName : room.hostName} ({enemyProgress}%)
                    </span>
                </div>
                <div style={{ width: '100%', height: '20px', background: '#555', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${enemyProgress}%`, height: '100%', background: '#e74c3c', transition: 'width 0.2s' }}></div>
                </div>
            </div>

            <textarea 
                value={input} 
                onChange={handleChange} 
                disabled={gameResult !== null} 
                placeholder={gameResult ? "게임 종료" : "위 문장을 똑같이 입력하세요!"} 
                className="input" 
                style={{ 
                    width: '100%', maxWidth: '600px', padding: '15px', fontSize: '18px', textAlign: 'left', 
                    background: gameResult ? '#7f8c8d' : (isError ? '#fab1a0' : 'white'), 
                    color: 'black', minHeight: '100px', resize: 'none',
                    border: isError ? '3px solid red' : '1px solid #ccc'
                }} 
                autoFocus 
                onPaste={(e) => e.preventDefault()} 
            />

            {/* 🏆 결과 화면 (재대결) */}
            {gameResult && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
                    <h2 style={{ fontSize: '50px', color: gameResult === 'win' ? '#f1c40f' : '#e74c3c', marginBottom: 30, animation: 'pop 0.5s' }}>
                        {gameResult === 'win' ? "🏆 YOU WIN! 🏆" : "😭 YOU LOSE..."}
                    </h2>
                    
                    <div style={{ display: 'flex', gap: '20px' }}>
                        {isHost ? (
                            <>
                                <button className="btn" disabled={!isGuestReady} style={{ fontSize: '20px', padding: '15px 30px', background: isGuestReady ? '#3498db' : '#7f8c8d' }} onClick={restartGame}>
                                    {isGuestReady ? "🔄 한 판 더" : "⏳ 대기중..."}
                                </button>
                                <button className="btn" style={{ fontSize: '20px', padding: '15px 30px', background: '#e74c3c' }} onClick={handleHostExit}>
                                    🏠 방 삭제
                                </button>
                            </>
                        ) : (
                            <>
                                {!isGuestReady ? (
                                    <button className="btn" style={{ fontSize: '20px', padding: '15px 30px', background: '#27ae60' }} onClick={handleGuestReady}>
                                        ✋ 준비 완료
                                    </button>
                                ) : (
                                    <div style={{ color: '#ccc', fontSize: '18px', display: 'flex', alignItems: 'center' }}>방장 대기중...</div>
                                )}
                                <button className="btn" style={{ fontSize: '20px', padding: '15px 30px', background: '#555' }} onClick={handleGuestExit}>
                                    🏠 나가기
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
            <style>{`@keyframes pop { 0% { transform: scale(0); } 80% { transform: scale(1.1); } 100% { transform: scale(1); } }`}</style>
        </div>
    );
}