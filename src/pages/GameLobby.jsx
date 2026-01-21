import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, doc, runTransaction, query, orderBy, onSnapshot, increment, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// 게임 설정 데이터
const GAME_META = {
    omok: { icon: '⚫', name: '오목', color: '#d35400', isMulti: false },
    rps: { icon: '✌️', name: '가위바위보', color: '#f39c12', isMulti: false },
    soccer: { icon: '⚽', name: '승부차기', color: '#27ae60', isMulti: false },
    typing: { icon: '⌨️', name: '숫자치기', color: '#3498db', isMulti: false },
    memory: { icon: '🃏', name: '기억력 게임', color: '#16a085', isMulti: false },
    
    // 👇 다인용 게임 (isMulti: true)
    reaction: { icon: '⚡', name: '반응속도(2-4인)', color: '#8e44ad', isMulti: true },
};

export default function GameLobby() {
    const [rooms, setRooms] = useState([]);
    const [myPoint, setMyPoint] = useState(0);
    const [inputTitle, setInputTitle] = useState('');
    const [inputBet, setInputBet] = useState('');
    const [selectedGame, setSelectedGame] = useState('omok');

    const navigate = useNavigate();
    const user = auth.currentUser;

    useEffect(() => {
        if (!user) { navigate('/login'); return; }

        // 내 포인트 실시간 감시
        const unsubUser = onSnapshot(doc(db, "users", user.uid), d => setMyPoint(d.data()?.point || 0));

        // 대기 중인(waiting) 또는 참여 가능한(joined) 방만 가져오기
        const q = query(
            collection(db, "battle_rooms"),
            where("status", "in", ["waiting", "joined"]),
            orderBy("createdAt", "desc")
        );

        const unsubRooms = onSnapshot(q, sn => {
            const list = sn.docs.map(d => ({ id: d.id, ...d.data() }));
            // waiting 상태이거나, 다인용 게임이면서 playing이 아닌 방만 필터링
            const validRooms = list.filter(r => r.status === 'waiting' || (GAME_META[r.gameType]?.isMulti && r.status === 'joined'));
            setRooms(validRooms);
        });
        
        return () => { unsubUser(); unsubRooms(); };
    }, [user, navigate]);

    // 🔥 방 만들기
    const createRoom = async () => {
        const bet = parseInt(inputBet);
        if (!bet || bet < 1000) return alert("최소 1,000원 이상!");
        if (myPoint < bet) return alert("포인트 부족!");

        try {
            const result = await runTransaction(db, async (t) => {
                // 내 정보(닉네임, 잔액) 가져오기
                const userRef = doc(db, "users", user.uid);
                const userSnap = await t.get(userRef);
                const userData = userSnap.data();
                
                if (userData.point < bet) throw new Error("잔액 부족");
                
                // 돈 차감
                t.update(userRef, { point: increment(-bet) });

                const newRoomRef = doc(collection(db, "battle_rooms"));
                const isMulti = GAME_META[selectedGame]?.isMulti;
                const myName = userData.name || "익명"; // 닉네임 사용

                // 게임별 초기 데이터 설정
                let gData = {};
                
                // 1:1 게임 데이터
                if (selectedGame === 'omok') gData = { board: Array(225).fill(null), turn: user.uid, lastMove: -1 };
                if (selectedGame === 'rps') gData = { hostScore: 0, guestScore: 0, round: 1, hostMove: null, guestMove: null };
                if (selectedGame === 'soccer') gData = { hostScore: 0, guestScore: 0, round: 1, kicker: user.uid, history: [] };
                if (selectedGame === 'typing') gData = { sentence: '', hostProgress: 0, guestProgress: 0 };
                if (selectedGame === 'memory') gData = { deck: [], flippedIndices: [], turn: user.uid, hostScore: 0, guestScore: 0, pairsLeft: 10 };

                // ⚡ 다인용 게임 데이터 (반응속도 등)
                if (isMulti) {
                    gData = { 
                        state: 'ready', 
                        startTime: 0, 
                        players: [{ 
                            uid: user.uid, 
                            name: myName, 
                            ready: true, // 방장은 자동 준비
                            reactionTime: null 
                        }] 
                    };
                } else if (selectedGame === 'reaction') {
                    // 기존 1:1 반응속도 호환성 유지
                    gData = { state: 'ready', startTime: 0, hostTime: null, guestTime: null };
                }

                const title = inputTitle.trim() || `${myName}님의 한판!`;

                t.set(newRoomRef, {
                    title: title,
                    host: user.uid, hostName: myName,
                    guest: null, guestName: '', // 1:1용 필드
                    betAmount: bet,
                    gameType: selectedGame,
                    status: 'waiting',
                    gameData: gData,
                    maxPlayers: isMulti ? 4 : 2, // 최대 인원 설정
                    createdAt: Date.now()
                });

                return { id: newRoomRef.id, title: title };
            });

            // 📜 기록 저장
            await addDoc(collection(db, "history"), {
                uid: user.uid, type: "게임", msg: `${result.title} 방 생성 (배팅)`, amount: -bet, createdAt: serverTimestamp()
            });

            navigate(`/gameroom/${result.id}`); 
        } catch (e) { alert(e.message); }
    };

    // 🏃 방 입장하기
    const joinRoom = async (room) => {
        if (room.host === user.uid) { navigate(`/gameroom/${room.id}`); return; }
        
        // 이미 참여 중인지 확인 (다인용)
        if (GAME_META[room.gameType]?.isMulti) {
            const isJoined = room.gameData.players.some(p => p.uid === user.uid);
            if (isJoined) { navigate(`/gameroom/${room.id}`); return; }
        }

        if (myPoint < room.betAmount) return alert("포인트 부족!");
        if (!window.confirm(`${room.betAmount.toLocaleString()}원 내고 입장하시겠습니까?`)) return;

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

                // 인원 체크
                if (GAME_META[rData.gameType]?.isMulti) {
                    if (rData.gameData.players.length >= (rData.maxPlayers || 4)) throw new Error("방이 꽉 찼습니다.");
                } else {
                    if (rData.guest) throw new Error("이미 꽉 찬 방");
                }

                // 돈 차감
                t.update(userRef, { point: increment(-room.betAmount) });
                
                // 참가자 추가 로직
                if (GAME_META[rData.gameType]?.isMulti) {
                    const newPlayers = [...rData.gameData.players, { 
                        uid: user.uid, 
                        name: myName, 
                        ready: false, 
                        reactionTime: null 
                    }];
                    t.update(roomRef, { 
                        "gameData.players": newPlayers,
                        status: 'joined'
                    });
                } else {
                    // 기존 1:1 방식
                    t.update(roomRef, { guest: user.uid, guestName: myName, status: 'joined' });
                }
            });

            // 📜 기록 저장
            await addDoc(collection(db, "history"), {
                uid: user.uid, type: "게임", msg: `${room.title} 방 입장 (배팅)`, amount: -room.betAmount, createdAt: serverTimestamp()
            });

            navigate(`/gameroom/${room.id}`);
        } catch (e) { alert(e.message); }
    };

    return (
        <div className="container" style={{ background: '#2c3e50', minHeight: '100vh', padding: 20, color: 'white' }}>
            <h1 style={{ textAlign: 'center', color: '#f1c40f', marginBottom: 30 }}>⚔️ BATTLE LOBBY</h1>

            {/* 컨트롤 패널 */}
            <div className="card" style={{ background: '#34495e', padding: 20, marginBottom: 20 }}>
                <div style={{ marginBottom: 10 }}>
                    💰 잔액: {Math.floor(myPoint).toLocaleString()}원
                </div>
                <input className="input" placeholder="방 제목" value={inputTitle} onChange={e => setInputTitle(e.target.value)} style={{ width: '100%', marginBottom: 10 }} />
                <div style={{ display: 'flex', gap: 10 }}>
                    <select className="input" style={{ flex: 1 }} value={selectedGame} onChange={e => setSelectedGame(e.target.value)}>
                        {Object.entries(GAME_META).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.name}</option>)}
                    </select>
                    <input className="input" type="number" placeholder="금액" value={inputBet} onChange={e => setInputBet(e.target.value)} style={{ flex: 1 }} />
                </div>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: 10 }} onClick={createRoom}>방 만들기</button>
            </div>

            {/* 방 목록 */}
            <div style={{ display: 'grid', gap: 10 }}>
                {rooms.length === 0 ? <div style={{ textAlign: 'center', padding: 20, color: '#ccc', border: '1px dashed #7f8c8d' }}>대기 중인 방이 없습니다.</div> :
                    rooms.map(room => {
                        const isMulti = GAME_META[room.gameType]?.isMulti;
                        const currentPlayers = isMulti ? (room.gameData.players?.length || 1) : (room.guest ? 2 : 1);
                        const maxPlayers = room.maxPlayers || 2;
                        const isFull = currentPlayers >= maxPlayers;

                        return (
                            <div key={room.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ecf0f1', color: '#333', borderLeft: `5px solid ${GAME_META[room.gameType]?.color}` }}>
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{room.title}</div>
                                    <div style={{ fontSize: 12 }}>
                                        {GAME_META[room.gameType]?.name} · {room.betAmount.toLocaleString()}원
                                        <span style={{marginLeft: 8, color: isFull ? 'red' : 'green'}}>
                                            ({currentPlayers}/{maxPlayers})
                                        </span>
                                    </div>
                                </div>
                                <button className="btn" 
                                    disabled={isFull && room.host !== user.uid}
                                    style={{ background: (isFull && room.host !== user.uid) ? '#95a5a6' : '#2ecc71' }} 
                                    onClick={() => joinRoom(room)}>
                                    {room.host === user.uid ? "입장" : (isFull ? "만원" : "참가")}
                                </button>
                            </div>
                        );
                    })
                }
            </div>
            <button className="btn" style={{ marginTop: 20, width: '100%', background: '#222' }} onClick={() => navigate('/home')}>나가기</button>
        </div>
    );
}