import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { doc, onSnapshot, updateDoc, deleteDoc, runTransaction, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';

import Omok from '../components/games/Omok';
import RPS from '../components/games/RPS';
import Soccer from '../components/games/Soccer';
import Reaction from '../components/games/Reaction';
import Typing from '../components/games/Typing';
import Memory from '../components/games/Memory';

export default function GameRoom() {
    const { roomId } = useParams();
    const [room, setRoom] = useState(null);
    const navigate = useNavigate();
    const user = auth.currentUser;
    const roomRefState = useRef(null);

    useEffect(() => {
        if (!roomId || !user) return;
        const unsub = onSnapshot(doc(db, "battle_rooms", roomId), (d) => {
            if (!d.exists()) { alert("방이 삭제되었습니다."); navigate('/gamelobby'); return; }
            const data = d.data();
            const roomData = { id: d.id, ...data };
            setRoom(roomData);
            roomRefState.current = roomData;

            // 🚨 [수정됨] 반응속도(reaction) 게임은 여기서 쫓아내지 않고, 게임 파일 안에서 처리하게 둠
            if (data.gameType !== 'reaction' && data.winner) {
                setTimeout(() => {
                    if (data.winner === user.uid) alert(`🎉 승리! ${data.betAmount * 2}원 획득!`);
                    else if (data.winner === 'draw') alert("무승부!");
                    else alert("패배...");
                    navigate('/gamelobby');
                }, 500);
            }
        });
        return () => unsub();
    }, [roomId, user, navigate]);

    // 기권패 로직 (이전과 동일)
    useEffect(() => {
        const handleForfeit = async () => {
            const currentRoom = roomRefState.current;
            if (currentRoom && currentRoom.status === 'playing' && !currentRoom.winner) {
                // ... (기존 기권 로직 생략, 코드는 유지됨)
                // 반응속도 게임은 다인용이라 기권패 로직이 좀 복잡해서 일단 1:1만 확실히 처리
                if (currentRoom.gameType === 'reaction') return; 

                const myRole = currentRoom.host === user.uid ? 'host' : 'guest';
                const winnerUid = myRole === 'host' ? currentRoom.guest : currentRoom.host;
                try {
                    await runTransaction(db, async (t) => {
                        const rRef = doc(db, "battle_rooms", roomId);
                        const rSnap = await t.get(rRef);
                        if (rSnap.data().status === 'finished') return;
                        const winRef = doc(db, "users", winnerUid);
                        t.update(winRef, { point: increment(currentRoom.betAmount * 2) });
                        t.update(rRef, { winner: winnerUid, status: 'finished', "gameData.guestReady": false });
                    });
                } catch (e) { console.error(e); }
            }
        };
        return () => { handleForfeit(); };
    }, [roomId, user]);

    if (!room) return <div>Loading...</div>;

    const myRole = room.host === user.uid ? 'host' : 'guest';
    const isMulti = room.gameType === 'reaction'; // 🚨 다인용 게임인지 확인

    // 👋 게스트 준비 (1:1 전용)
    const setReady = async () => {
        await updateDoc(doc(db, "battle_rooms", roomId), { status: 'ready' });
    };

    // 🔥 방장 시작 (1:1 전용)
    const startGame = async () => {
        await updateDoc(doc(db, "battle_rooms", roomId), { status: 'playing' });
    };

    // 🚪 방 나가기
    const leaveRoom = async () => {
        if (!room) return navigate('/gamelobby');
        // ... (기존 나가기 로직 유지) ...
        try {
             if (myRole === 'host') {
                if (window.confirm("방을 삭제하고 환불받으시겠습니까?")) {
                    await deleteDoc(doc(db, "battle_rooms", roomId));
                    // (환불 로직은 생략, 필요하면 추가)
                }
             } else {
                 // 참가자 나가기 (다인용은 players 배열에서 제거해야 완벽하지만 일단 이동)
                 navigate('/gamelobby');
             }
        } catch(e) { navigate('/gamelobby'); }
    };

    return (
        <div className="container" style={{ background: '#222', minHeight: '100vh', padding: 20, color: 'white', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#333', padding: 10, borderRadius: 10, marginBottom: 20 }}>
                <div>🔴 {room.hostName}</div>
                <div style={{ color: '#f1c40f', fontWeight: 'bold' }}>{room.betAmount.toLocaleString()}원</div>
                {/* 다인용은 게스트 이름 대신 인원수 표시 */}
                <div>{isMulti ? `참가자 ${room.gameData.players?.length || 1}명` : `🔵 ${room.guestName || '대기중'}`}</div>
            </div>

            <h2 style={{ color: '#ccc' }}>{room.title}</h2>

            {/* 🚨 [핵심 수정] 다인용 게임(Reaction)은 GameRoom의 기본 UI를 싹 무시하고 바로 게임 컴포넌트를 띄움 */}
            {isMulti ? (
                <div style={{ background: '#fff', padding: 10, borderRadius: 10, color: '#333' }}>
                    <Reaction room={room} user={user} myRole={myRole} />
                </div>
            ) : (
                <>
                    {/* 👇 기존 1:1 게임용 UI (오목, 가위바위보 등) */}
                    
                    {/* 1. 대기 중 */}
                    {room.status === 'waiting' && (
                        <div style={{ margin: '50px 0' }}>
                            <h1>👥 도전자 입장 대기...</h1>
                            {myRole === 'host' && <button className="btn" style={{ background: '#e74c3c' }} onClick={leaveRoom}>방 삭제</button>}
                        </div>
                    )}

                    {/* 2. 준비 단계 */}
                    {room.status === 'joined' && (
                        <div style={{ margin: '50px 0' }}>
                            <h1>👋 참가자가 들어왔습니다!</h1>
                            {myRole === 'guest' ? (
                                <div>
                                    <h3>준비가 되면 버튼을 눌러주세요.</h3>
                                    <button className="btn btn-primary" style={{ padding: '15px 40px', fontSize: 20, background: '#2980b9' }} onClick={setReady}>준비 완료 (READY)</button>
                                </div>
                            ) : (
                                <h3>참가자의 준비를 기다리는 중...</h3>
                            )}
                        </div>
                    )}

                    {/* 3. 시작 대기 */}
                    {room.status === 'ready' && (
                        <div style={{ margin: '50px 0' }}>
                            <h1>✅ 모든 준비 완료!</h1>
                            {myRole === 'host' ?
                                <button className="btn btn-primary" style={{ padding: '15px 40px', fontSize: 20 }} onClick={startGame}>게임 시작 (START)</button>
                                : <h3>방장이 시작하면 게임이 진행됩니다.</h3>
                            }
                        </div>
                    )}

                    {/* 4. 게임 진행 */}
                    {room.status === 'playing' && (
                        <div style={{ background: '#fff', padding: 10, borderRadius: 10, color: '#333' }}>
                            {room.gameType === 'omok' && <Omok room={room} user={user} myRole={myRole} />}
                            {room.gameType === 'rps' && <RPS room={room} user={user} myRole={myRole} />}
                            {room.gameType === 'soccer' && <Soccer room={room} user={user} myRole={myRole} />}
                            {room.gameType === 'typing' && <Typing room={room} user={user} myRole={myRole} />}
                            {room.gameType === 'memory' && <Memory room={room} user={user} myRole={myRole} />}
                        </div>
                    )}

                    {room.status !== 'playing' && <button className="btn" style={{ marginTop: 30, background: '#555' }} onClick={leaveRoom}>나가기</button>}
                </>
            )}
        </div>
    );
}