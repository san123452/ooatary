

// import React, { useState, useEffect, useRef } from 'react';
// import { db, auth } from '../firebase';
// import { doc, onSnapshot, updateDoc, deleteDoc, runTransaction, increment } from 'firebase/firestore';
// import { useNavigate, useParams } from 'react-router-dom';
// import { useLanguage } from '../LanguageContext';

// import Omok from '../components/games/Omok';
// import RPS from '../components/games/RPS';
// import Soccer from '../components/games/Soccer';
// import Reaction from '../components/games/Reaction';
// import Typing from '../components/games/Typing';
// import Memory from '../components/games/Memory';
// import Applegame from '../components/games/Applegame';

// export default function GameRoom() {
//     const { roomId } = useParams();
//     const [room, setRoom] = useState(null);
//     const navigate = useNavigate();
//     const user = auth.currentUser;
//     const roomRefState = useRef(null);
//     const { t } = useLanguage(); // 👈

//     useEffect(() => {
//         if (!roomId || !user) return;
//         const unsub = onSnapshot(doc(db, "battle_rooms", roomId), (d) => {
//             if (!d.exists()) { alert("Deleted room"); navigate('/gamelobby'); return; }
//             const data = d.data();
//             const roomData = { id: d.id, ...data };
//             setRoom(roomData);
//             roomRefState.current = roomData;

//             const isMultiGame = data.gameType === 'reaction' || data.gameType === 'apple';

//             if (!isMultiGame && data.winner) {
//                 setTimeout(() => {
//                     if (data.winner === user.uid) alert(`${t.win} +${data.betAmount * 2}`);
//                     else if (data.winner === 'draw') alert(t.draw);
//                     else alert(t.lose);
//                     navigate('/gamelobby');
//                 }, 500);
//             }
//         });
//         return () => unsub();
//     }, [roomId, user, navigate, t]);

//     useEffect(() => {
//         const handleForfeit = async () => {
//             const currentRoom = roomRefState.current;
//             if (currentRoom && currentRoom.status === 'playing' && !currentRoom.winner) {
//                 if (currentRoom.gameType === 'reaction' || currentRoom.gameType === 'apple') return;
//                 const myRole = currentRoom.host === user.uid ? 'host' : 'guest';
//                 const winnerUid = myRole === 'host' ? currentRoom.guest : currentRoom.host;
//                 try {
//                     await runTransaction(db, async (tx) => {
//                         const rRef = doc(db, "battle_rooms", roomId);
//                         const rSnap = await tx.get(rRef);
//                         if (rSnap.data().status === 'finished') return;
//                         const winRef = doc(db, "users", winnerUid);
//                         tx.update(winRef, { point: increment(currentRoom.betAmount * 2) });
//                         tx.update(rRef, { winner: winnerUid, status: 'finished', "gameData.guestReady": false });
//                     });
//                 } catch (e) { console.error(e); }
//             }
//         };
//         return () => { handleForfeit(); };
//     }, [roomId, user]);

//     if (!room) return <div>Loading...</div>;

//     const myRole = room.host === user.uid ? 'host' : 'guest';
//     const isMulti = room.gameType === 'reaction' || room.gameType === 'apple'; 

//     const setReady = async () => {
//         await updateDoc(doc(db, "battle_rooms", roomId), { status: 'ready' });
//     };

//     const startGame = async () => {
//         await updateDoc(doc(db, "battle_rooms", roomId), { status: 'playing' });
//     };

//     const leaveRoom = async () => {
//         if (!room) return navigate('/gamelobby');
//         try {
//              if (myRole === 'host') {
//                 if (window.confirm("Delete?")) {
//                     await deleteDoc(doc(db, "battle_rooms", roomId));
//                 }
//              } else {
//                  navigate('/gamelobby');
//              }
//         } catch(e) { navigate('/gamelobby'); }
//     };

//     return (
//         <div className="container" style={{ background: '#222', minHeight: '100vh', padding: 20, color: 'white', textAlign: 'center' }}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', background: '#333', padding: 10, borderRadius: 10, marginBottom: 20 }}>
//                 <div>🔴 {room.hostName}</div>
//                 <div style={{ color: '#f1c40f', fontWeight: 'bold' }}>{room.betAmount.toLocaleString()}</div>
//                 <div>{isMulti ? `${t.participate} ${room.gameData.players?.length || 1}${t.people}` : `🔵 ${room.guestName || '...'}`}</div>
//             </div>

//             <h2 style={{ color: '#ccc' }}>{room.title}</h2>

//             {isMulti ? (
//                 <div style={{ background: '#fff', padding: 10, borderRadius: 10, color: '#333' }}>
//                     {room.gameType === 'reaction' && <Reaction room={room} user={user} myRole={myRole} />}
//                     {room.gameType === 'apple' && <Applegame room={room} user={user} myRole={myRole} />} 
//                 </div>
//             ) : (
//                 <>
//                     {room.status === 'waiting' && (
//                         <div style={{ margin: '50px 0' }}>
//                             <h1>{t.waitingChallenger}</h1>
//                             {myRole === 'host' && <button className="btn" style={{ background: '#e74c3c' }} onClick={leaveRoom}>{t.deleteRoom}</button>}
//                         </div>
//                     )}

//                     {room.status === 'joined' && (
//                         <div style={{ margin: '50px 0' }}>
//                             <h1>{t.playerJoined}</h1>
//                             {myRole === 'guest' ? (
//                                 <div>
//                                     <h3>{t.readyBtn}</h3>
//                                     <button className="btn btn-primary" style={{ padding: '15px 40px', fontSize: 20, background: '#2980b9' }} onClick={setReady}>READY</button>
//                                 </div>
//                             ) : (
//                                 <h3>{t.waitingReady}</h3>
//                             )}
//                         </div>
//                     )}

//                     {room.status === 'ready' && (
//                         <div style={{ margin: '50px 0' }}>
//                             <h1>{t.allReady}</h1>
//                             {myRole === 'host' ?
//                                 <button className="btn btn-primary" style={{ padding: '15px 40px', fontSize: 20 }} onClick={startGame}>{t.gameStart}</button>
//                                 : <h3>{t.startWait}</h3>
//                             }
//                         </div>
//                     )}

//                     {room.status === 'playing' && (
//                         <div style={{ background: '#fff', padding: 10, borderRadius: 10, color: '#333' }}>
//                             {room.gameType === 'omok' && <Omok room={room} user={user} myRole={myRole} />}
//                             {room.gameType === 'rps' && <RPS room={room} user={user} myRole={myRole} />}
//                             {room.gameType === 'soccer' && <Soccer room={room} user={user} myRole={myRole} />}
//                             {room.gameType === 'typing' && <Typing room={room} user={user} myRole={myRole} />}
//                             {room.gameType === 'memory' && <Memory room={room} user={user} myRole={myRole} />}
//                         </div>
//                     )}

//                     {room.status !== 'playing' && <button className="btn" style={{ marginTop: 30, background: '#555' }} onClick={leaveRoom}>{t.exit}</button>}
//                 </>
//             )}
//         </div>
//     );
// }


import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { doc, onSnapshot, updateDoc, deleteDoc, runTransaction, increment } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

import Omok from '../components/games/Omok';
import RPS from '../components/games/RPS';
import Soccer from '../components/games/Soccer';
import Reaction from '../components/games/Reaction';
import Typing from '../components/games/Typing';
import Memory from '../components/games/Memory';
import Applegame from '../components/games/Applegame';
import Poketball from '../components/games/Poketball'; // 👈 추가

export default function GameRoom() {
    const { roomId } = useParams();
    const [room, setRoom] = useState(null);
    const navigate = useNavigate();
    const user = auth.currentUser;
    const roomRefState = useRef(null);
    const { t } = useLanguage();

    useEffect(() => {
        if (!roomId || !user) return;
        const unsub = onSnapshot(doc(db, "battle_rooms", roomId), (d) => {
            if (!d.exists()) { alert("Deleted room"); navigate('/gamelobby'); return; }
            const data = d.data();
            const roomData = { id: d.id, ...data };
            setRoom(roomData);
            roomRefState.current = roomData;

            const isMultiGame = data.gameType === 'reaction' || data.gameType === 'apple';

            if (!isMultiGame && data.winner) {
                setTimeout(() => {
                    if (data.winner === user.uid) alert(`${t.win} +${data.betAmount * 2}`);
                    else if (data.winner === 'draw') alert(t.draw);
                    else alert(t.lose);
                    navigate('/gamelobby');
                }, 500);
            }
        });
        return () => unsub();
    }, [roomId, user, navigate, t]);

    useEffect(() => {
        const handleForfeit = async () => {
            const currentRoom = roomRefState.current;
            if (currentRoom && currentRoom.status === 'playing' && !currentRoom.winner) {
                if (currentRoom.gameType === 'reaction' || currentRoom.gameType === 'apple') return;
                const myRole = currentRoom.host === user.uid ? 'host' : 'guest';
                const winnerUid = myRole === 'host' ? currentRoom.guest : currentRoom.host;
                try {
                    await runTransaction(db, async (tx) => {
                        const rRef = doc(db, "battle_rooms", roomId);
                        const rSnap = await tx.get(rRef);
                        if (rSnap.data().status === 'finished') return;
                        const winRef = doc(db, "users", winnerUid);
                        tx.update(winRef, { point: increment(currentRoom.betAmount * 2) });
                        tx.update(rRef, { winner: winnerUid, status: 'finished', "gameData.guestReady": false });
                    });
                } catch (e) { console.error(e); }
            }
        };
        return () => { handleForfeit(); };
    }, [roomId, user]);

    if (!room) return <div>Loading...</div>;

    const myRole = room.host === user.uid ? 'host' : 'guest';
    const isMulti = room.gameType === 'reaction' || room.gameType === 'apple'; 

    const setReady = async () => {
        await updateDoc(doc(db, "battle_rooms", roomId), { status: 'ready' });
    };

    const startGame = async () => {
        await updateDoc(doc(db, "battle_rooms", roomId), { status: 'playing' });
    };

    const leaveRoom = async () => {
        if (!room) return navigate('/gamelobby');
        try {
             if (myRole === 'host') {
                if (window.confirm("Delete?")) {
                    await deleteDoc(doc(db, "battle_rooms", roomId));
                }
             } else {
                 navigate('/gamelobby');
             }
        } catch(e) { navigate('/gamelobby'); }
    };

    return (
        <div className="container" style={{ background: '#222', minHeight: '100vh', padding: 20, color: 'white', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#333', padding: 10, borderRadius: 10, marginBottom: 20 }}>
                <div>🔴 {room.hostName}</div>
                <div style={{ color: '#f1c40f', fontWeight: 'bold' }}>{room.betAmount.toLocaleString()}</div>
                <div>{isMulti ? `${t.participate} ${room.gameData.players?.length || 1}${t.people}` : `🔵 ${room.guestName || '...'}`}</div>
            </div>

            <h2 style={{ color: '#ccc' }}>{room.title}</h2>

            {isMulti ? (
                <div style={{ background: '#fff', padding: 10, borderRadius: 10, color: '#333' }}>
                    {room.gameType === 'reaction' && <Reaction room={room} user={user} myRole={myRole} />}
                    {room.gameType === 'apple' && <Applegame room={room} user={user} myRole={myRole} />} 
                </div>
            ) : (
                <>
                    {room.status === 'waiting' && (
                        <div style={{ margin: '50px 0' }}>
                            <h1>{t.waitingChallenger}</h1>
                            {myRole === 'host' && <button className="btn" style={{ background: '#e74c3c' }} onClick={leaveRoom}>{t.deleteRoom}</button>}
                        </div>
                    )}

                    {room.status === 'joined' && (
                        <div style={{ margin: '50px 0' }}>
                            <h1>{t.playerJoined}</h1>
                            {myRole === 'guest' ? (
                                <div>
                                    <h3>{t.readyBtn}</h3>
                                    <button className="btn btn-primary" style={{ padding: '15px 40px', fontSize: 20, background: '#2980b9' }} onClick={setReady}>READY</button>
                                </div>
                            ) : (
                                <h3>{t.waitingReady}</h3>
                            )}
                        </div>
                    )}

                    {room.status === 'ready' && (
                        <div style={{ margin: '50px 0' }}>
                            <h1>{t.allReady}</h1>
                            {myRole === 'host' ?
                                <button className="btn btn-primary" style={{ padding: '15px 40px', fontSize: 20 }} onClick={startGame}>{t.gameStart}</button>
                                : <h3>{t.startWait}</h3>
                            }
                        </div>
                    )}

                    {room.status === 'playing' && (
                        <div style={{ background: '#fff', padding: 10, borderRadius: 10, color: '#333' }}>
                            {room.gameType === 'omok' && <Omok room={room} user={user} myRole={myRole} />}
                            {room.gameType === 'rps' && <RPS room={room} user={user} myRole={myRole} />}
                            {room.gameType === 'soccer' && <Soccer room={room} user={user} myRole={myRole} />}
                            {room.gameType === 'typing' && <Typing room={room} user={user} myRole={myRole} />}
                            {room.gameType === 'memory' && <Memory room={room} user={user} myRole={myRole} />}
                            {room.gameType === 'poketball' && <Poketball room={room} user={user} myRole={myRole} />} {/* 👈 추가 */}
                        </div>
                    )}

                    {room.status !== 'playing' && <button className="btn" style={{ marginTop: 30, background: '#555' }} onClick={leaveRoom}>{t.exit}</button>}
                </>
            )}
        </div>
    );
}