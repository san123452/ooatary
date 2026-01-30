// import React, { useState, useEffect } from 'react';
// import { db, auth } from '../firebase';
// // 👇 deleteDoc 추가됨 (삭제 기능 필수)
// import { collection, doc, runTransaction, query, orderBy, onSnapshot, increment, where, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';

// // 게임 설정 데이터
// const GAME_META = {
//     omok: { icon: '⚫', name: '오목', color: '#d35400', isMulti: false },
//     rps: { icon: '✌️', name: '가위바위보', color: '#f39c12', isMulti: false },
//     soccer: { icon: '⚽', name: '승부차기', color: '#27ae60', isMulti: false },
//     typing: { icon: '⌨️', name: '숫자치기', color: '#3498db', isMulti: false },
//     memory: { icon: '🃏', name: '기억력 게임', color: '#16a085', isMulti: false },
    
//     // 👇 다인용 게임
//     reaction: { icon: '⚡', name: '반응속도(2-4인)', color: '#8e44ad', isMulti: true },
//     apple: { icon: '🍎', name: '사과농장(2-4인)', color: '#e74c3c', isMulti: true }, // 🍎 사과게임 추가됨
// };

// export default function GameLobby() {
//     const [rooms, setRooms] = useState([]);
//     const [myPoint, setMyPoint] = useState(0);
//     const [inputTitle, setInputTitle] = useState('');
//     const [inputBet, setInputBet] = useState('');
//     const [selectedGame, setSelectedGame] = useState('omok');

//     const navigate = useNavigate();
//     const user = auth.currentUser;

//     useEffect(() => {
//         if (!user) { navigate('/login'); return; }

//         // 내 포인트 실시간 감시
//         const unsubUser = onSnapshot(doc(db, "users", user.uid), d => setMyPoint(d.data()?.point || 0));

//         // 대기 중인(waiting) 또는 참여 가능한(joined) 방만 가져오기
//         const q = query(
//             collection(db, "battle_rooms"),
//             where("status", "in", ["waiting", "joined"]),
//             orderBy("createdAt", "desc")
//         );

//         const unsubRooms = onSnapshot(q, sn => {
//             const list = sn.docs.map(d => ({ id: d.id, ...d.data() }));
//             // waiting 상태이거나, 다인용 게임이면서 playing이 아닌 방만 필터링
//             const validRooms = list.filter(r => r.status === 'waiting' || (GAME_META[r.gameType]?.isMulti && r.status === 'joined'));
//             setRooms(validRooms);
//         });
        
//         return () => { unsubUser(); unsubRooms(); };
//     }, [user, navigate]);

//     // 🔥 방 만들기
//     const createRoom = async () => {
//         const bet = parseInt(inputBet);
//         if (!bet || bet < 1000) return alert("최소 1,000원 이상!");
//         if (myPoint < bet) return alert("포인트 부족!");

//         try {
//             const result = await runTransaction(db, async (t) => {
//                 const userRef = doc(db, "users", user.uid);
//                 const userSnap = await t.get(userRef);
//                 const userData = userSnap.data();
                
//                 if (userData.point < bet) throw new Error("잔액 부족");
                
//                 t.update(userRef, { point: increment(-bet) });

//                 const newRoomRef = doc(collection(db, "battle_rooms"));
//                 const isMulti = GAME_META[selectedGame]?.isMulti;
//                 const myName = userData.name || "익명"; 

//                 let gData = {};
                
//                 // 1:1 게임 데이터
//                 if (selectedGame === 'omok') gData = { board: Array(225).fill(null), turn: user.uid, lastMove: -1 };
//                 if (selectedGame === 'rps') gData = { hostScore: 0, guestScore: 0, round: 1, hostMove: null, guestMove: null };
//                 if (selectedGame === 'soccer') gData = { hostScore: 0, guestScore: 0, round: 1, kicker: user.uid, history: [] };
//                 if (selectedGame === 'typing') gData = { sentence: '', hostProgress: 0, guestProgress: 0 };
//                 if (selectedGame === 'memory') gData = { deck: [], flippedIndices: [], turn: user.uid, hostScore: 0, guestScore: 0, pairsLeft: 10 };

//                 // ⚡ 다인용 게임 데이터
//                 if (isMulti) {
//                     gData = { 
//                         state: 'ready', 
//                         startTime: 0, 
//                         players: [{ 
//                             uid: user.uid, 
//                             name: myName, 
//                             ready: true, 
//                             reactionTime: null 
//                         }],
//                         // 사과게임용 초기 데이터
//                         board: [], 
//                         scores: {},
//                         endTime: null
//                     };
//                 } else if (selectedGame === 'reaction') {
//                     gData = { state: 'ready', startTime: 0, hostTime: null, guestTime: null };
//                 }

//                 const title = inputTitle.trim() || `${myName}님의 한판!`;

//                 t.set(newRoomRef, {
//                     title: title,
//                     host: user.uid, hostName: myName,
//                     guest: null, guestName: '',
//                     betAmount: bet,
//                     gameType: selectedGame,
//                     status: 'waiting',
//                     gameData: gData,
//                     maxPlayers: isMulti ? 4 : 2,
//                     createdAt: Date.now()
//                 });

//                 return { id: newRoomRef.id, title: title };
//             });

//             await addDoc(collection(db, "history"), {
//                 uid: user.uid, type: "게임", msg: `${result.title} 방 생성 (배팅)`, amount: -bet, createdAt: serverTimestamp()
//             });

//             navigate(`/gameroom/${result.id}`); 
//         } catch (e) { alert(e.message); }
//     };

//     // 🏃 방 입장하기
//     const joinRoom = async (room) => {
//         if (room.host === user.uid) { navigate(`/gameroom/${room.id}`); return; }
        
//         if (GAME_META[room.gameType]?.isMulti) {
//             const isJoined = room.gameData.players.some(p => p.uid === user.uid);
//             if (isJoined) { navigate(`/gameroom/${room.id}`); return; }
//         }

//         if (myPoint < room.betAmount) return alert("포인트 부족!");
//         if (!window.confirm(`${room.betAmount.toLocaleString()}원 내고 입장하시겠습니까?`)) return;

//         try {
//             await runTransaction(db, async (t) => {
//                 const userRef = doc(db, "users", user.uid);
//                 const userSnap = await t.get(userRef);
//                 const userData = userSnap.data();

//                 if (userData.point < room.betAmount) throw new Error("잔액 부족");

//                 const roomRef = doc(db, "battle_rooms", room.id);
//                 const roomSnap = await t.get(roomRef);
//                 const rData = roomSnap.data();
//                 const myName = userData.name || "익명";

//                 if (GAME_META[rData.gameType]?.isMulti) {
//                     if (rData.gameData.players.length >= (rData.maxPlayers || 4)) throw new Error("방이 꽉 찼습니다.");
//                 } else {
//                     if (rData.guest) throw new Error("이미 꽉 찬 방");
//                 }

//                 t.update(userRef, { point: increment(-room.betAmount) });
                
//                 if (GAME_META[rData.gameType]?.isMulti) {
//                     const newPlayers = [...rData.gameData.players, { 
//                         uid: user.uid, 
//                         name: myName, 
//                         ready: false, 
//                         reactionTime: null 
//                     }];
//                     t.update(roomRef, { 
//                         "gameData.players": newPlayers,
//                         status: 'joined'
//                     });
//                 } else {
//                     t.update(roomRef, { guest: user.uid, guestName: myName, status: 'joined' });
//                 }
//             });

//             await addDoc(collection(db, "history"), {
//                 uid: user.uid, type: "게임", msg: `${room.title} 방 입장 (배팅)`, amount: -room.betAmount, createdAt: serverTimestamp()
//             });

//             navigate(`/gameroom/${room.id}`);
//         } catch (e) { alert(e.message); }
//     };

//     return (
//         <div className="container" style={{ background: '#2c3e50', minHeight: '100vh', padding: 20, color: 'white' }}>
//             <h1 style={{ textAlign: 'center', color: '#f1c40f', marginBottom: 30 }}>⚔️ BATTLE LOBBY</h1>

//             {/* 컨트롤 패널 */}
//             <div className="card" style={{ background: '#34495e', padding: 20, marginBottom: 20 }}>
//                 <div style={{ marginBottom: 10 }}>
//                     💰 잔액: {Math.floor(myPoint).toLocaleString()}원
//                 </div>
//                 <input className="input" placeholder="방 제목" value={inputTitle} onChange={e => setInputTitle(e.target.value)} style={{ width: '100%', marginBottom: 10 }} />
//                 <div style={{ display: 'flex', gap: 10 }}>
//                     <select className="input" style={{ flex: 1 }} value={selectedGame} onChange={e => setSelectedGame(e.target.value)}>
//                         {Object.entries(GAME_META).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.name}</option>)}
//                     </select>
//                     <input className="input" type="number" placeholder="금액" value={inputBet} onChange={e => setInputBet(e.target.value)} style={{ flex: 1 }} />
//                 </div>
//                 <button className="btn btn-primary" style={{ width: '100%', marginTop: 10 }} onClick={createRoom}>방 만들기</button>
//             </div>

//             {/* 방 목록 */}
//             <div style={{ display: 'grid', gap: 10 }}>
//                 {rooms.length === 0 ? <div style={{ textAlign: 'center', padding: 20, color: '#ccc', border: '1px dashed #7f8c8d' }}>대기 중인 방이 없습니다.</div> :
//                     rooms.map(room => {
//                         const isMulti = GAME_META[room.gameType]?.isMulti;
//                         const currentPlayers = isMulti ? (room.gameData.players?.length || 1) : (room.guest ? 2 : 1);
//                         const maxPlayers = room.maxPlayers || 2;
//                         const isFull = currentPlayers >= maxPlayers;

//                         return (
//                             <div key={room.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ecf0f1', color: '#333', borderLeft: `5px solid ${GAME_META[room.gameType]?.color}` }}>
//                                 <div style={{flex: 1}}>
//                                     <div style={{ fontWeight: 'bold' }}>
//                                         {room.title}
//                                         {/* 🛡️ 관리자(kks3172@naver.com) 전용 강제 삭제 버튼 */}
//                                         {user?.email === 'kks3172@naver.com' && (
//                                             <button 
//                                                 onClick={(e) => {
//                                                     e.stopPropagation(); 
//                                                     if(window.confirm("🗑️ 관리자 권한으로 이 방을 삭제하시겠습니까?")) {
//                                                         deleteDoc(doc(db, "battle_rooms", room.id));
//                                                     }
//                                                 }}
//                                                 style={{ marginLeft: '10px', fontSize: '12px', padding: '2px 8px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
//                                             >
//                                                 삭제
//                                             </button>
//                                         )}
//                                     </div>
//                                     <div style={{ fontSize: 12 }}>
//                                         {GAME_META[room.gameType]?.name} · {room.betAmount.toLocaleString()}원
//                                         <span style={{marginLeft: 8, color: isFull ? 'red' : 'green'}}>
//                                             ({currentPlayers}/{maxPlayers})
//                                         </span>
//                                     </div>
//                                 </div>
//                                 <button className="btn" 
//                                     disabled={isFull && room.host !== user.uid}
//                                     style={{ background: (isFull && room.host !== user.uid) ? '#95a5a6' : '#2ecc71' }} 
//                                     onClick={() => joinRoom(room)}>
//                                     {room.host === user.uid ? "입장" : (isFull ? "만원" : "참가")}
//                                 </button>
//                             </div>
//                         );
//                     })
//                 }
//             </div>
//             <button className="btn" style={{ marginTop: 20, width: '100%', background: '#222' }} onClick={() => navigate('/home')}>나가기</button>
//         </div>
//     );
// }

import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, doc, runTransaction, query, orderBy, onSnapshot, increment, where, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext'; // 👈

const GAME_ICONS = {
    omok: '⚫', rps: '✌️', soccer: '⚽', typing: '⌨️', memory: '🃏', reaction: '⚡', apple: '🍎'
};

const GAME_COLORS = {
    omok: '#d35400', rps: '#f39c12', soccer: '#27ae60', typing: '#3498db', memory: '#16a085', reaction: '#8e44ad', apple: '#e74c3c'
};

const GAME_MULTI = {
    omok: false, rps: false, soccer: false, typing: false, memory: false, reaction: true, apple: true
};

export default function GameLobby() {
    const [rooms, setRooms] = useState([]);
    const [myPoint, setMyPoint] = useState(0);
    const [inputTitle, setInputTitle] = useState('');
    const [inputBet, setInputBet] = useState('');
    const [selectedGame, setSelectedGame] = useState('omok');

    const navigate = useNavigate();
    const user = auth.currentUser;
    const { t } = useLanguage(); // 👈

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        const unsubUser = onSnapshot(doc(db, "users", user.uid), d => setMyPoint(d.data()?.point || 0));
        const q = query(
            collection(db, "battle_rooms"),
            where("status", "in", ["waiting", "joined"]),
            orderBy("createdAt", "desc")
        );
        const unsubRooms = onSnapshot(q, sn => {
            const list = sn.docs.map(d => ({ id: d.id, ...d.data() }));
            const validRooms = list.filter(r => r.status === 'waiting' || (GAME_MULTI[r.gameType] && r.status === 'joined'));
            setRooms(validRooms);
        });
        return () => { unsubUser(); unsubRooms(); };
    }, [user, navigate]);

    // 게임 이름 가져오기 헬퍼
    const getGameName = (type) => {
        const key = `g_${type}`;
        return t[key] || type;
    };

    const createRoom = async () => {
        const bet = parseInt(inputBet);
        if (!bet || bet < 1000) return alert("Min 1000");
        if (myPoint < bet) return alert(t.alertNoMoney);

        try {
            const result = await runTransaction(db, async (t) => {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await t.get(userRef);
                const userData = userSnap.data();
                if (userData.point < bet) throw new Error("잔액 부족");
                t.update(userRef, { point: increment(-bet) });

                const newRoomRef = doc(collection(db, "battle_rooms"));
                const isMulti = GAME_MULTI[selectedGame];
                const myName = userData.name || "익명"; 

                let gData = {};
                if (selectedGame === 'omok') gData = { board: Array(225).fill(null), turn: user.uid, lastMove: -1 };
                if (selectedGame === 'rps') gData = { hostScore: 0, guestScore: 0, round: 1, hostMove: null, guestMove: null };
                if (selectedGame === 'soccer') gData = { hostScore: 0, guestScore: 0, round: 1, kicker: user.uid, history: [] };
                if (selectedGame === 'typing') gData = { sentence: '', hostProgress: 0, guestProgress: 0 };
                if (selectedGame === 'memory') gData = { deck: [], flippedIndices: [], turn: user.uid, hostScore: 0, guestScore: 0, pairsLeft: 10 };
                if (isMulti) {
                    gData = { 
                        state: 'ready', startTime: 0, 
                        players: [{ uid: user.uid, name: myName, ready: true, reactionTime: null }],
                        board: [], scores: {}, endTime: null
                    };
                } else if (selectedGame === 'reaction') {
                    gData = { state: 'ready', startTime: 0, hostTime: null, guestTime: null };
                }

                const title = inputTitle.trim() || `${myName} - ${getGameName(selectedGame)}`;
                t.set(newRoomRef, {
                    title: title, host: user.uid, hostName: myName, guest: null, guestName: '',
                    betAmount: bet, gameType: selectedGame, status: 'waiting', gameData: gData,
                    maxPlayers: isMulti ? 4 : 2, createdAt: Date.now()
                });
                return { id: newRoomRef.id, title: title };
            });
            await addDoc(collection(db, "history"), { uid: user.uid, type: "게임", msg: `${result.title} Open`, amount: -bet, createdAt: serverTimestamp() });
            navigate(`/gameroom/${result.id}`); 
        } catch (e) { alert(e.message); }
    };

    const joinRoom = async (room) => {
        if (room.host === user.uid) { navigate(`/gameroom/${room.id}`); return; }
        if (GAME_MULTI[room.gameType]) {
            const isJoined = room.gameData.players.some(p => p.uid === user.uid);
            if (isJoined) { navigate(`/gameroom/${room.id}`); return; }
        }
        if (myPoint < room.betAmount) return alert(t.alertNoMoney);
        if (!window.confirm(`${room.betAmount.toLocaleString()}?`)) return;

        try {
            await runTransaction(db, async (t) => {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await t.get(userRef);
                const userData = userSnap.data();
                if (userData.point < room.betAmount) throw new Error("잔액 부족");

                const roomRef = doc(db, "battle_rooms", room.id);
                const roomSnap = await t.get(roomRef);
                const rData = roomSnap.data();
                const myName = userData.name || "익명";

                if (GAME_MULTI[rData.gameType]) {
                    if (rData.gameData.players.length >= (rData.maxPlayers || 4)) throw new Error("Full");
                } else {
                    if (rData.guest) throw new Error("Full");
                }

                t.update(userRef, { point: increment(-room.betAmount) });
                if (GAME_MULTI[rData.gameType]) {
                    const newPlayers = [...rData.gameData.players, { uid: user.uid, name: myName, ready: false, reactionTime: null }];
                    t.update(roomRef, { "gameData.players": newPlayers, status: 'joined' });
                } else {
                    t.update(roomRef, { guest: user.uid, guestName: myName, status: 'joined' });
                }
            });
            await addDoc(collection(db, "history"), { uid: user.uid, type: "게임", msg: `${room.title} Join`, amount: -room.betAmount, createdAt: serverTimestamp() });
            navigate(`/gameroom/${room.id}`);
        } catch (e) { alert(e.message); }
    };

    return (
        <div className="container" style={{ background: '#2c3e50', minHeight: '100vh', padding: 20, color: 'white' }}>
            <h1 style={{ textAlign: 'center', color: '#f1c40f', marginBottom: 30 }}>{t.lobbyTitle}</h1>

            <div className="card" style={{ background: '#34495e', padding: 20, marginBottom: 20 }}>
                <div style={{ marginBottom: 10 }}>💰 {t.balance}: {Math.floor(myPoint).toLocaleString()}</div>
                <input className="input" placeholder={t.roomTitlePlaceholder} value={inputTitle} onChange={e => setInputTitle(e.target.value)} style={{ width: '100%', marginBottom: 10 }} />
                <div style={{ display: 'flex', gap: 10 }}>
                    <select className="input" style={{ flex: 1 }} value={selectedGame} onChange={e => setSelectedGame(e.target.value)}>
                        {Object.keys(GAME_ICONS).map(key => <option key={key} value={key}>{GAME_ICONS[key]} {getGameName(key)}</option>)}
                    </select>
                    <input className="input" type="number" placeholder={t.betAmount} value={inputBet} onChange={e => setInputBet(e.target.value)} style={{ flex: 1 }} />
                </div>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: 10 }} onClick={createRoom}>{t.createRoom}</button>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
                {rooms.length === 0 ? <div style={{ textAlign: 'center', padding: 20, color: '#ccc', border: '1px dashed #7f8c8d' }}>{t.waiting}</div> :
                    rooms.map(room => {
                        const isMulti = GAME_MULTI[room.gameType];
                        const currentPlayers = isMulti ? (room.gameData.players?.length || 1) : (room.guest ? 2 : 1);
                        const maxPlayers = room.maxPlayers || 2;
                        const isFull = currentPlayers >= maxPlayers;

                        return (
                            <div key={room.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ecf0f1', color: '#333', borderLeft: `5px solid ${GAME_COLORS[room.gameType]}` }}>
                                <div style={{flex: 1}}>
                                    <div style={{ fontWeight: 'bold' }}>
                                        {room.title}
                                        {user?.email === 'kks3172@naver.com' && (
                                            <button onClick={(e) => {
                                                    e.stopPropagation(); 
                                                    if(window.confirm("🗑️ Delete?")) deleteDoc(doc(db, "battle_rooms", room.id));
                                                }}
                                                style={{ marginLeft: '10px', fontSize: '12px', padding: '2px 8px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                                            >
                                                DEL
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 12 }}>
                                        {getGameName(room.gameType)} · {room.betAmount.toLocaleString()}
                                        <span style={{marginLeft: 8, color: isFull ? 'red' : 'green'}}>({currentPlayers}/{maxPlayers})</span>
                                    </div>
                                </div>
                                <button className="btn" 
                                    disabled={isFull && room.host !== user.uid}
                                    style={{ background: (isFull && room.host !== user.uid) ? '#95a5a6' : '#2ecc71' }} 
                                    onClick={() => joinRoom(room)}>
                                    {room.host === user.uid ? t.enter : (isFull ? t.full : t.participate)}
                                </button>
                            </div>
                        );
                    })
                }
            </div>
            <button className="btn" style={{ marginTop: 20, width: '100%', background: '#222' }} onClick={() => navigate('/home')}>{t.exit}</button>
        </div>
    );
}