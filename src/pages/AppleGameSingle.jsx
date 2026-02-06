

 import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { db, auth } from '../firebase.js'; 
import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp, getDoc, doc, updateDoc, increment } from 'firebase/firestore'; 
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

const AppleIcon = ({ value, active }) => (
  <div className={`apple ${active ? 'active' : 'popped'}`}>
    {active && (
      <div className="apple-inner">
        <span className="apple-number">{value}</span>
        <div className="apple-shine"></div>
        <div className="apple-stem"></div>
      </div>
    )}
  </div>
);

// 최적화: GridCell 메모이제이션 - 비교 함수 개선
const GridCell = React.memo(({ index, apple, isSelected }) => {
  return (
    <div 
      data-index={index} 
      className={`grid-cell ${isSelected ? 'selected' : ''}`} 
      style={{ 
        aspectRatio: 1, 
        position: 'relative', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        background: isSelected ? 'rgba(52, 152, 219, 0.4)' : 'transparent', 
        border: isSelected ? '1px solid #3498db' : 'none', 
        borderRadius: 4, 
        cursor: 'pointer',
        transition: 'background 0.1s ease'
      }}
    >
      <AppleIcon value={apple.value} active={apple.active} />
    </div>
  );
}, (prev, next) => {
  return prev.apple.active === next.apple.active && 
         prev.isSelected === next.isSelected && 
         prev.apple.value === next.apple.value; 
});

const ROWS = 10;
const COLS = 17;
const TOTAL_APPLES = ROWS * COLS;
const GAME_TIME = 120; 
const TIME_TOLERANCE = 3; // 5초에서 3초로 감소

const DIFFICULTY_OPTIONS = [
    { label: "Easy", target: 100, multi: 1.5, color: '#2ecc71' },
    { label: "Normal", target: 110, multi: 1.75, color: '#f1c40f' },
    { label: "Hard", target: 130, multi: 2.0, color: '#e67e22' },
    { label: "God", target: 150, multi: 10.0, color: '#e74c3c' },
];

export default function AppleGameSingle() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const { t, lang } = useLanguage();

  const [board, setBoard] = useState([]);
  const [score, setScore] = useState(0); 
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [gameState, setGameState] = useState('ready'); 
  const [ranks, setRanks] = useState([]); 

  const [myPoint, setMyPoint] = useState(0);
  const [myName, setMyName] = useState("익명"); 

  const [betAmount, setBetAmount] = useState(1000); 
  const [selectedDiff, setSelectedDiff] = useState(DIFFICULTY_OPTIONS[0]); 
  const [resultMessage, setResultMessage] = useState(""); 

  const [isDragging, setIsDragging] = useState(false);
  const [startIndex, setStartIndex] = useState(null);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [currentSum, setCurrentSum] = useState(0);

  const realStartTime = useRef(0);
  const gridRef = useRef(null);
  const gameDataRef = useRef(null); // 게임 시작 데이터 보관

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    
    // 페이지 진입 시 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'auto' });
    
    fetchUserData();
    fetchRanks();
  }, [user, navigate]);

  const fetchUserData = async () => {
      if (user) {
          try {
              const userSnap = await getDoc(doc(db, "users", user.uid));
              if (userSnap.exists()) {
                  const data = userSnap.data();
                  setMyPoint(data.point || 0);
                  setMyName(data.name || "익명");
              }
          } catch (e) {
              console.error("User data fetch error:", e);
          }
      }
  };

  const fetchRanks = async () => {
    try {
      const q = query(collection(db, "apple_ranks"), orderBy("score", "desc"), limit(50));
      const querySnapshot = await getDocs(q);
      const rawList = querySnapshot.docs.map(doc => doc.data());
      
      const filteredList = [];
      const userCounts = {}; 
      for (const item of rawList) {
        const uid = item.uid;
        if (!userCounts[uid]) userCounts[uid] = 0;
        if (userCounts[uid] < 3) {
            filteredList.push(item);
            userCounts[uid]++;
        }
        if (filteredList.length >= 10) break;
      }
      setRanks(filteredList);
    } catch (e) {
      console.error("Rank Load Error:", e);
    }
  };

  // 뒤로가기 방지 - 게임 중일 때만 작동하도록 개선
  useEffect(() => {
    if (gameState !== 'playing') return;

    const preventGoBack = () => {
      window.history.pushState(null, "", window.location.href);
      alert("🚫 " + t.ag_disqualify);
      handleGameAbort();
    };
    
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", preventGoBack);
    
    return () => window.removeEventListener("popstate", preventGoBack);
  }, [gameState, t]);

  // 게임 중단 처리
  const handleGameAbort = useCallback(() => {
    setGameState('ready');
    setBoard([]);
    setScore(0);
    setTimeLeft(GAME_TIME);
    setResultMessage(t.ag_disqualify);
    setSelectedIndices([]);
    setStartIndex(null);
    setCurrentSum(0);
    setIsDragging(false);
  }, [t]);

  // 타이머
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      endGame();
    }
  }, [gameState, timeLeft]);

  // 터치 기본 동작 방지
  useEffect(() => {
    const gridElement = gridRef.current;
    if (!gridElement) return;
    const preventDefault = (e) => { if (gameState === 'playing') e.preventDefault(); };
    gridElement.addEventListener('touchstart', preventDefault, { passive: false });
    gridElement.addEventListener('touchmove', preventDefault, { passive: false });
    return () => {
        gridElement.removeEventListener('touchstart', preventDefault);
        gridElement.removeEventListener('touchmove', preventDefault);
    };
  }, [gameState]);

  const startGame = async () => {
    if (betAmount <= 0) return alert(t.alertInputBet);
    if (betAmount > myPoint) return alert(t.alertNoMoney);
    if (!Number.isInteger(betAmount) || betAmount < 0) return alert(t.alertInputBet);

    try {
        // 게임 시작 데이터 저장
        const gameStartData = {
            betAmount,
            difficulty: selectedDiff.label,
            startTime: Date.now(),
            userPoint: myPoint
        };
        gameDataRef.current = gameStartData;

        await updateDoc(doc(db, "users", user.uid), { point: increment(-betAmount) });
        setMyPoint(prev => prev - betAmount);

        await addDoc(collection(db, "history"), {
            uid: user.uid,
            type: "게임",
            msg: `🍏 ${t.ag_title} ${t.h_bet}`,
            amount: -betAmount,
            createdAt: serverTimestamp()
        });

        const newBoard = Array.from({ length: TOTAL_APPLES }, (_, i) => ({
            id: i,
            value: Math.floor(Math.random() * 9) + 1,
            active: true
        }));
        setBoard(newBoard);
        setScore(0);
        setTimeLeft(GAME_TIME);
        setGameState('playing');
        setResultMessage("");
        realStartTime.current = Date.now();

    } catch (e) {
        console.error("Start Error:", e);
        alert(t.alertError);
        // 실패시 롤백
        if (gameDataRef.current) {
            try {
                await updateDoc(doc(db, "users", user.uid), { point: increment(betAmount) });
                setMyPoint(prev => prev + betAmount);
            } catch (rollbackError) {
                console.error("Rollback error:", rollbackError);
            }
        }
    }
  };

  const endGame = async () => {
    if (gameState !== 'playing') return; // 중복 호출 방지
    
    setGameState('finished');
    const timeElapsed = (Date.now() - realStartTime.current) / 1000;
    const limitTime = GAME_TIME + TIME_TOLERANCE;

    // 시간 체크 강화
    if (timeElapsed > limitTime || timeElapsed < 0) {
        setResultMessage(t.ag_cheat);
        alert(t.ag_cheat);
        return; 
    }
    
    // 게임 데이터 검증
    if (!gameDataRef.current) {
        setResultMessage(t.ag_cheat);
        alert(t.ag_cheat);
        return;
    }

    // 점수 검증 - 물리적으로 불가능한 점수 체크
    const maxPossibleScore = TOTAL_APPLES;
    if (score > maxPossibleScore || score < 0) {
        setResultMessage(t.ag_cheat);
        alert(t.ag_cheat);
        return;
    }
    
    let earned = 0;
    let isWin = false;
    let finalMsg = "";

    if (score >= selectedDiff.target) {
        isWin = true;
        earned = Math.floor(betAmount * selectedDiff.multi);
        finalMsg = `${t.ag_success} +${earned.toLocaleString()}P`;
        
        try {
            await updateDoc(doc(db, "users", user.uid), { point: increment(earned) });
            setMyPoint(prev => prev + earned);
            
            await addDoc(collection(db, "history"), {
                uid: user.uid,
                type: "게임",
                msg: `🍏 ${t.ag_title} ${t.h_gain}`,
                amount: earned,
                createdAt: serverTimestamp()
            });

        } catch(e) { 
            console.error("Reward error:", e);
            alert(t.alertError);
        }

    } else {
        finalMsg = `${t.ag_fail}`;
    }

    setResultMessage(finalMsg);

    // 랭킹 저장 - 점수가 0보다 클 때만
    if (score > 0) {
      try {
        await addDoc(collection(db, "apple_ranks"), {
            uid: user.uid,
            name: myName, 
            score: score,
            difficulty: selectedDiff.label,
            createdAt: serverTimestamp()
        });
        fetchRanks(); // 랭킹 즉시 업데이트
      } catch (e) { 
        console.error("Save Error:", e); 
      }
    }

    // 게임 데이터 초기화
    gameDataRef.current = null;
  };

  // 성능 개선: selectedIndices를 Set으로 변환하여 O(1) 검색
  const selectedSet = useMemo(() => new Set(selectedIndices), [selectedIndices]);

  // 직사각형 영역 계산 최적화
  const getRectIndices = useCallback((start, current) => {
    const startRow = Math.floor(start / COLS);
    const startCol = start % COLS;
    const curRow = Math.floor(current / COLS);
    const curCol = current % COLS;
    const minRow = Math.min(startRow, curRow);
    const maxRow = Math.max(startRow, curRow);
    const minCol = Math.min(startCol, curCol);
    const maxCol = Math.max(startCol, curCol);
    const indices = [];
    let sum = 0;
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const idx = r * COLS + c;
        if (board[idx]?.active) {
            indices.push(idx);
            sum += board[idx].value;
        }
      }
    }
    return { indices, sum };
  }, [board]);

  const handleGridMouseDown = useCallback((e) => {
    e.preventDefault();
    if (gameState !== 'playing') return;

    const cell = e.target.closest('.grid-cell');
    if (!cell) return;

    const index = parseInt(cell.dataset.index);
    if (isNaN(index)) return;

    setIsDragging(true);
    setStartIndex(index);
    updateSelection(index, index);
  }, [gameState]);

  const handleGridMouseOver = useCallback((e) => {
    if (!isDragging || gameState !== 'playing') return;
    
    const cell = e.target.closest('.grid-cell');
    if (!cell) return;

    const index = parseInt(cell.dataset.index);
    if (isNaN(index)) return;

    updateSelection(startIndex, index);
  }, [isDragging, startIndex, gameState]);

  const handleTouchStart = useCallback((e) => {
    if (gameState !== 'playing') return;
    const touch = e.touches[0];
    if (!touch) return;

    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const cell = element?.closest('.grid-cell');
    if (cell) {
        const index = parseInt(cell.dataset.index);
        if (isNaN(index)) return;

        setIsDragging(true);
        setStartIndex(index);
        updateSelection(index, index);
    }
  }, [gameState]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || gameState !== 'playing') return;
    const touch = e.touches[0];
    if (!touch) return;

    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const cell = element?.closest('.grid-cell');
    if (cell) {
        const currentIndex = parseInt(cell.dataset.index);
        if (!isNaN(currentIndex)) {
            updateSelection(startIndex, currentIndex);
        }
    }
  }, [isDragging, startIndex, gameState]);

  const updateSelection = useCallback((start, current) => {
      if (start === null || current === null) return;

      const { indices, sum } = getRectIndices(start, current);
      
      // 배열 비교 최적화
      if (indices.length !== selectedIndices.length || 
          indices[0] !== selectedIndices[0] || 
          indices[indices.length-1] !== selectedIndices[indices.length-1]) {
          setSelectedIndices(indices);
          setCurrentSum(sum);
      }
  }, [getRectIndices, selectedIndices]);

  const finishDrag = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    // 합이 10이고 선택된 셀이 있을 때만 처리
    if (currentSum === 10 && selectedIndices.length > 0) {
        // 불변성 유지하며 업데이트
        setBoard(prev => prev.map((apple, i) => 
            selectedIndices.includes(i) ? { ...apple, active: false } : apple
        ));
        setScore(prev => prev + selectedIndices.length);
    }
    
    setSelectedIndices([]);
    setStartIndex(null);
    setCurrentSum(0);
  }, [isDragging, currentSum, selectedIndices]);

  return (
    <div className="container" style={{ background: '#dcedc8', minHeight: '100vh', padding: '10px 5px', display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect:'none' }}>
      
      <div style={{width: '98%', maxWidth: '850px', display: 'flex', justifyContent: 'space-between', marginBottom: 10, background: 'rgba(255,255,255,0.8)', padding: '10px', borderRadius: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}}>
         <button className="btn" onClick={() => navigate('/home')} style={{background:'#555', padding:'5px 10px', fontSize:14, whiteSpace:'nowrap'}}>{t.home}</button>
         
         {gameState === 'playing' ? (
             <div style={{display:'flex', gap:15, alignItems:'center', flexWrap:'wrap'}}>
                 <div style={{fontSize: 16, fontWeight: 'bold', color: '#e74c3c'}}>{t.ag_goal}: {selectedDiff.target}</div>
                 <div style={{fontSize: 18, fontWeight: 'bold', color: '#2ecc71'}}>{t.ag_score}: {score}</div>
                 <div style={{fontSize: 18, fontWeight: 'bold', color: '#333'}}>⏰ {timeLeft}</div>
             </div>
         ) : (
             <div style={{fontSize: 16, fontWeight: 'bold', color: '#f1c40f'}}>💰 {myPoint.toLocaleString()} P</div>
         )}
      </div>

      <div 
        ref={gridRef}
        className="apple-grid"
        onMouseDown={handleGridMouseDown}
        onMouseOver={handleGridMouseOver}
        onMouseUp={finishDrag}
        onMouseLeave={finishDrag}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={finishDrag}
        style={{
            display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 1, width: '100%', maxWidth: '850px', padding: 3, border: '4px solid #8bc34a', borderRadius: 10, background: 'rgba(255,255,255,0.3)', opacity: gameState === 'playing' ? 1 : 0.5,
            touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none'
        }}
      >
        {board.length > 0 ? board.map((apple, index) => (
            <GridCell 
                key={apple.id} 
                index={index} 
                apple={apple} 
                isSelected={selectedSet.has(index)} 
            />
        )) : <div style={{gridColumn: `span ${COLS}`, textAlign:'center', padding:50, fontSize:16, color:'#555'}}>{t.gameStart}..</div>}
      </div>

      {/* 게임 메뉴 모달 */}
      {gameState !== 'playing' && (
         <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)', background:'rgba(255,255,255,0.98)', padding:25, borderRadius:20, boxShadow:'0 10px 30px rgba(0,0,0,0.3)', textAlign:'center', zIndex:100, width: '90%', maxWidth: '400px' }}>
             
             {gameState === 'finished' ? (
                 <>
                    <h2 style={{color: resultMessage.includes(t.ag_success) ? '#2ecc71' : '#e74c3c', marginBottom:10}}>{resultMessage.includes(t.ag_success) ? "MISSION SUCCESS" : "GAME OVER"}</h2>
                    <p style={{fontSize:16, marginBottom:10, fontWeight:'bold'}}>{resultMessage}</p>
                    
                    <div style={{fontSize: 24, fontWeight: '900', color: '#2ecc71', marginBottom: 20}}>
                        🍎 {score}
                    </div>
                 </>
             ) : (
                <h2 style={{color:'#8bc34a', marginBottom:10}}>{t.ag_title}</h2>
             )}

             <div style={{textAlign:'left', background:'#f9f9f9', padding:15, borderRadius:10, marginBottom:20}}>
                 <label style={{display:'block', marginBottom:5, fontSize:14, fontWeight:'bold', color:'#333'}}>{t.ag_bet}</label>
                 <input 
                   type="number" 
                   value={betAmount} 
                   onChange={(e) => setBetAmount(Math.max(0, parseInt(e.target.value) || 0))}
                   min="0"
                   step="1000"
                   disabled={gameState === 'finished'}
                   style={{
                       width:'100%', padding:'10px', borderRadius:5, 
                       border:'2px solid #aaa', 
                       marginBottom:15, 
                       color:'#333',
                       fontWeight:'bold',
                       fontSize:'16px',
                       backgroundColor: gameState === 'finished' ? '#eee' : '#fff'
                   }}
                 />
                 
                 <label style={{display:'block', marginBottom:5, fontSize:14, fontWeight:'bold', color:'#333'}}>{t.ag_diff}</label>
                 <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                     {DIFFICULTY_OPTIONS.map((opt, i) => (
                         <button 
                           key={i}
                           onClick={() => setSelectedDiff(opt)}
                           disabled={gameState === 'finished'}
                           style={{
                               padding:'8px 0', 
                               border: selectedDiff.label === opt.label ? `2px solid ${opt.color}` : '1px solid #ccc',
                               background: selectedDiff.label === opt.label ? 'rgba(0,0,0,0.05)' : 'white',
                               borderRadius: 5,
                               cursor: gameState === 'finished' ? 'not-allowed' : 'pointer',
                               color: opt.color,
                               fontWeight:'bold',
                               opacity: gameState === 'finished' ? 0.6 : 1
                           }}
                         >
                             {opt.label}<br/>
                             <span style={{fontSize:12, color:'#555'}}>{opt.target} (x{opt.multi})</span>
                         </button>
                     ))}
                 </div>
             </div>

             <button 
               className="btn btn-primary" 
               onClick={startGame} 
               disabled={gameState === 'finished' && betAmount > myPoint}
               style={{
                 fontSize:18, 
                 padding:'12px 0', 
                 background: selectedDiff.color, 
                 width:'100%', 
                 borderRadius: 10, 
                 border:'none', 
                 color:'white', 
                 fontWeight:'bold', 
                 boxShadow:'0 4px 0 rgba(0,0,0,0.2)',
                 cursor: 'pointer',
                 opacity: (gameState === 'finished' && betAmount > myPoint) ? 0.5 : 1
               }}
             >
                 {t.ag_start}
             </button>
         </div>
      )}

      {/* 랭킹 */}
      <div style={{width: '98%', maxWidth: '600px', marginTop: 20, background: 'white', padding: 15, borderRadius: 10, boxShadow: '0 5px 15px rgba(0,0,0,0.1)', marginBottom: 20}}>
          <h3 style={{textAlign:'center', color:'#333', borderBottom:'2px solid #ddd', paddingBottom:10, fontSize: 18}}>{t.rank} Top 10</h3>
          <ul style={{listStyle:'none', padding:0, margin:0}}>
              {ranks.map((r, i) => (
                  <li key={i} style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #eee', fontSize:14}}>
                      <span style={{fontWeight:'bold', color: i<3 ? '#f1c40f' : '#555'}}>{i+1}. {r.name}</span>
                      <span style={{color:'#e74c3c', fontWeight:'bold'}}>{r.score}</span>
                  </li>
              ))}
              {ranks.length === 0 && <li style={{textAlign:'center', padding:20, color:'#999'}}>{t.noResult}</li>}
          </ul>
      </div>

      <style>{`
        * { -webkit-tap-highlight-color: transparent; }
        .apple { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; transition: transform 0.2s; }
        .apple.popped { transform: scale(0); opacity: 0; }
        .apple-inner { width: 90%; height: 90%; background: radial-gradient(circle at 30% 30%, #ff5252, #c0392b); border-radius: 50% 50% 40% 40%; display: flex; justify-content: center; align-items: center; position: relative; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
        .apple-number { color: white; font-weight: 900; font-size: clamp(12px, 4vw, 22px); text-shadow: 1px 1px 0 rgba(0,0,0,0.3); z-index: 2; pointer-events: none; }
        .apple-shine { position: absolute; top: 15%; left: 15%; width: 25%; height: 25%; background: rgba(255,255,255,0.4); border-radius: 50%; pointer-events: none; }
        .apple-stem { position: absolute; top: -15%; left: 50%; width: 3px; height: 8px; background: #795548; transform: translateX(-50%) rotate(15deg); border-radius: 2px; pointer-events: none; }
        .apple-stem::after { content: ''; position: absolute; top: 2px; left: 2px; width: 8px; height: 4px; background: #4caf50; border-radius: 10px 0; transform: rotate(-30deg); }
      `}</style>
    </div>
  );
}