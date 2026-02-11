// src/components/games/Poketball.jsx
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { doc, updateDoc, runTransaction, increment, addDoc, collection, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../LanguageContext';

const TABLE_WIDTH = 600;
const TABLE_HEIGHT = 300;
const BALL_RADIUS = 10;
const FRICTION = 0.985;
const POCKET_RADIUS = 18;

const POCKETS = [
  { x: 0, y: 0 }, { x: TABLE_WIDTH / 2, y: 0 }, { x: TABLE_WIDTH, y: 0 },
  { x: 0, y: TABLE_HEIGHT }, { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT }, { x: TABLE_WIDTH, y: TABLE_HEIGHT }
];

export default function Poketball({ room, user, myRole }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const canvasRef = useRef(null);
  const bgCanvasRef = useRef(null);
  const timerRef = useRef(null);
  const lastShotIdRef = useRef(null);

  const isMyTurn = room.gameData.turn === user.uid;
  const isFinished = room.status === 'finished';
  const isGuestReady = room.gameData.guestReady === true;
  const canPlaceCueBall = room.gameData.canPlaceCueBall === user.uid;

  const [timeLeft, setTimeLeft] = useState(30);
  const [isShooting, setIsShooting] = useState(false);
  const [cueAngle, setCueAngle] = useState(0);
  const [cuePower, setCuePower] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [balls, setBalls] = useState([]);
  const [cueBallPlacing, setCueBallPlacing] = useState(false);

  // 🎯 초기화 - DB 데이터로 공 배치
  useEffect(() => {
    const dbBalls = room.gameData.balls;
    if (dbBalls && Array.isArray(dbBalls) && dbBalls.length > 0) {
      setBalls(JSON.parse(JSON.stringify(dbBalls)));
    } else {
      setBalls(initBalls());
    }
  }, [room.gameData.turnCount]);

  // 🎯 큐볼 배치 모드 활성화
  useEffect(() => {
    if (canPlaceCueBall && isMyTurn) {
      setCueBallPlacing(true);
    } else {
      setCueBallPlacing(false);
    }
  }, [canPlaceCueBall, isMyTurn]);

  // 🎯 상대방 슈팅 감지 → 똑같이 재생
  useEffect(() => {
    const lastShot = room.gameData.lastShot;
    if (!lastShot) return;
    
    if (lastShotIdRef.current === lastShot.id) return;
    
    if (lastShot.uid === user.uid) {
      lastShotIdRef.current = lastShot.id;
      return;
    }

    lastShotIdRef.current = lastShot.id;
    
    setBalls(prevBalls => {
      const newBalls = JSON.parse(JSON.stringify(prevBalls));
      const cueBallIndex = newBalls.findIndex(b => b.id === 0 && b.type !== 'pocketed');
      
      if (cueBallIndex !== -1) {
        newBalls[cueBallIndex].vx = Math.cos(lastShot.angle) * lastShot.power;
        newBalls[cueBallIndex].vy = Math.sin(lastShot.angle) * lastShot.power;
      }
      
      return newBalls;
    });
    
    setIsShooting(true);
  }, [room.gameData.lastShot]);

  // 🎯 타이머
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!isMyTurn || isFinished || isShooting || cueBallPlacing) {
      setTimeLeft(30);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => prev > 1 ? prev - 1 : prev);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isMyTurn, isFinished, isShooting, cueBallPlacing]);

  useEffect(() => {
    if (timeLeft === 0 && isMyTurn && !isFinished && !isShooting && !cueBallPlacing) {
      handleTimeOut();
    }
  }, [timeLeft, isMyTurn, isFinished, isShooting, cueBallPlacing]);

  const handleTimeOut = () => {
    const winnerUid = myRole === 'host' ? room.guest : room.host;
    endGame(winnerUid, "Time Out");
  };

  const endGame = async (winnerUid, reason = "Win") => {
    try {
      await runTransaction(db, async (t) => {
        const roomRef = doc(db, "battle_rooms", room.id);
        if (winnerUid !== 'draw') {
          const winRef = doc(db, "users", winnerUid);
          t.update(winRef, { point: increment(room.betAmount * 2) });
        }
        t.update(roomRef, { 
          winner: winnerUid, 
          status: 'finished', 
          "gameData.guestReady": false 
        });
      });

      if (winnerUid !== 'draw') {
        await addDoc(collection(db, "history"), {
          uid: winnerUid, 
          type: "게임", 
          msg: `🎱 8-Ball ${reason}`, 
          amount: room.betAmount * 2, 
          createdAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.error("End game error:", e);
    }
  };

  const restartGame = async () => {
    if (!isGuestReady) return;
    try {
      await runTransaction(db, async (t) => {
        const hostRef = doc(db, "users", room.host);
        const guestRef = doc(db, "users", room.guest);
        const hSnap = await t.get(hostRef);
        const gSnap = await t.get(guestRef);

        if (hSnap.data().point < room.betAmount || gSnap.data().point < room.betAmount) {
          throw new Error("No Money");
        }

        t.update(hostRef, { point: increment(-room.betAmount) });
        t.update(guestRef, { point: increment(-room.betAmount) });

        const initialBalls = initBalls();
        const roomRef = doc(db, "battle_rooms", room.id);
        t.update(roomRef, {
          status: 'playing',
          winner: null,
          "gameData.balls": initialBalls,
          "gameData.turn": room.host,
          "gameData.guestReady": false,
          "gameData.turnCount": 0,
          "gameData.lastShot": null,
          "gameData.canPlaceCueBall": null
        });
      });
      
      await addDoc(collection(db, "history"), {
        uid: user.uid, 
        type: "게임", 
        msg: `🎱 8-Ball ${t.restart}`, 
        amount: -room.betAmount, 
        createdAt: serverTimestamp()
      });
    } catch (e) { 
      alert("Error: " + e.message); 
    }
  };

  const handleGuestReady = async () => {
    await updateDoc(doc(db, "battle_rooms", room.id), { 
      "gameData.guestReady": true 
    });
  };
  
  const handleHostExit = async () => {
    if (window.confirm("Destroy Room?")) {
      await deleteDoc(doc(db, "battle_rooms", room.id));
      navigate('/gamelobby');
    }
  };

  const handleGuestExit = () => navigate('/gamelobby');

  const initBalls = () => {
    const startX = TABLE_WIDTH * 0.75;
    const startY = TABLE_HEIGHT / 2;
    let ballsArr = [];
    ballsArr.push({ 
      id: 0, 
      x: TABLE_WIDTH * 0.25, 
      y: TABLE_HEIGHT / 2, 
      vx: 0, 
      vy: 0, 
      color: 'white', 
      type: 'cue',
      number: 0
    });

    const arrangement = [5, 12, 10, 3, 14, 11, 2, 13, 4, 15, 7, 6, 9, 1, 8];
    let count = 0;
    
    for (let col = 0; col < 5; col++) {
      for (let row = 0; row <= col; row++) {
        let x = startX + col * (BALL_RADIUS * 2 + 1);
        let y = startY - (col * BALL_RADIUS) + (row * BALL_RADIUS * 2);
        const num = arrangement[count];
        
        let color, type;
        if (num === 8) {
          color = 'black';
          type = '8ball';
        } else if (num <= 7) {
          color = getBallColor(num);
          type = 'solid';
        } else {
          color = getBallColor(num);
          type = 'stripe';
        }
        
        ballsArr.push({ 
          id: num, 
          x, 
          y, 
          vx: 0, 
          vy: 0, 
          color, 
          type,
          number: num
        });
        count++;
      }
    }
    return ballsArr;
  };

  const getBallColor = (num) => {
    const colors = {
      1: '#FFD700', 2: '#1E90FF', 3: '#FF4500', 4: '#8B008B',
      5: '#FF8C00', 6: '#228B22', 7: '#8B0000', 8: '#000000',
      9: '#FFD700', 10: '#1E90FF', 11: '#FF4500', 12: '#8B008B',
      13: '#FF8C00', 14: '#228B22', 15: '#8B0000'
    };
    return colors[num] || '#ccc';
  };

  const shoot = () => {
    if (!isMyTurn || isShooting || isFinished || cueBallPlacing) return;
    const cueBallIndex = balls.findIndex(b => b.id === 0 && b.type !== 'pocketed');
    if (cueBallIndex === -1) return;

    const newBalls = JSON.parse(JSON.stringify(balls));
    const power = Math.min(cuePower, 30);
    newBalls[cueBallIndex].vx = Math.cos(cueAngle) * power;
    newBalls[cueBallIndex].vy = Math.sin(cueAngle) * power;

    setBalls(newBalls);
    setIsShooting(true);
    setCuePower(0);

    const shotId = `${user.uid}_${Date.now()}`;
    lastShotIdRef.current = shotId;
    
    updateDoc(doc(db, "battle_rooms", room.id), {
      "gameData.lastShot": {
        id: shotId,
        uid: user.uid,
        angle: cueAngle,
        power: power,
        timestamp: Date.now()
      }
    }).catch(err => console.error("Shot update error:", err));
  };

  // 🎯 물리 엔진
  useEffect(() => {
    if (!isShooting) return;
    
    let animId;
    const updatePhysics = () => {
      setBalls(prevBalls => {
        let nextBalls = prevBalls.map(b => ({ ...b }));
        let isMoving = false;

        for (let b of nextBalls) {
          if (b.type === 'pocketed') continue;
          
          b.x += b.vx;
          b.y += b.vy;
          b.vx *= FRICTION;
          b.vy *= FRICTION;
          
          if (Math.abs(b.vx) < 0.05) b.vx = 0;
          if (Math.abs(b.vy) < 0.05) b.vy = 0;

          if (b.x < BALL_RADIUS) { 
            b.x = BALL_RADIUS; 
            b.vx *= -1; 
          }
          if (b.x > TABLE_WIDTH - BALL_RADIUS) { 
            b.x = TABLE_WIDTH - BALL_RADIUS; 
            b.vx *= -1; 
          }
          if (b.y < BALL_RADIUS) { 
            b.y = BALL_RADIUS; 
            b.vy *= -1; 
          }
          if (b.y > TABLE_HEIGHT - BALL_RADIUS) { 
            b.y = TABLE_HEIGHT - BALL_RADIUS; 
            b.vy *= -1; 
          }

          for (let p of POCKETS) {
            const dx = b.x - p.x;
            const dy = b.y - p.y;
            if (Math.sqrt(dx * dx + dy * dy) < POCKET_RADIUS) {
              b.vx = 0; 
              b.vy = 0;
              b.type = 'pocketed';
              b.x = -100;
            }
          }
          
          if (b.vx !== 0 || b.vy !== 0) isMoving = true;
        }

        for (let i = 0; i < nextBalls.length; i++) {
          for (let j = i + 1; j < nextBalls.length; j++) {
            const b1 = nextBalls[i];
            const b2 = nextBalls[j];
            if (b1.type === 'pocketed' || b2.type === 'pocketed') continue;
            
            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < BALL_RADIUS * 2) {
              const angle = Math.atan2(dy, dx);
              const sin = Math.sin(angle);
              const cos = Math.cos(angle);
              
              const vx1 = b1.vx * cos + b1.vy * sin;
              const vy1 = b1.vy * cos - b1.vx * sin;
              const vx2 = b2.vx * cos + b2.vy * sin;
              const vy2 = b2.vy * cos - b2.vx * sin;
              
              const vx1Final = vx2;
              const vx2Final = vx1;
              
              b1.vx = vx1Final * cos - vy1 * sin;
              b1.vy = vy1 * cos + vx1Final * sin;
              b2.vx = vx2Final * cos - vy2 * sin;
              b2.vy = vy2 * cos + vx2Final * sin;
              
              const overlap = (BALL_RADIUS * 2 - dist) / 2;
              b1.x -= overlap * Math.cos(angle);
              b1.y -= overlap * Math.sin(angle);
              b2.x += overlap * Math.cos(angle);
              b2.y += overlap * Math.sin(angle);
            }
          }
        }

        if (!isMoving) {
          handleTurnEnd(nextBalls);
        }
        return nextBalls;
      });
      
      animId = requestAnimationFrame(updatePhysics);
    };

    const handleTurnEnd = async (finalBalls) => {
      cancelAnimationFrame(animId);
      setIsShooting(false);
      
      const eightBall = finalBalls.find(b => b.id === 8);
      const cueBall = finalBalls.find(b => b.id === 0);

      if (eightBall && eightBall.type === 'pocketed') {
        if (cueBall.type === 'pocketed') {
          endGame(
            room.gameData.turn === room.host ? room.guest : room.host, 
            "Foul (8ball + Cue)"
          );
        } else {
          endGame(room.gameData.turn, "Win (8ball)");
        }
        return;
      }

      const cueBallPocketed = cueBall && cueBall.type === 'pocketed';
      const nextTurn = room.gameData.turn === room.host ? room.guest : room.host;

      // 🎯 큐볼 포켓되면 상대방이 배치 가능
      if (cueBallPocketed) {
        cueBall.type = 'cue';
        cueBall.x = -100;
        cueBall.y = -100;
        cueBall.vx = 0; 
        cueBall.vy = 0;
      }

      try {
        await updateDoc(doc(db, "battle_rooms", room.id), {
          "gameData.balls": finalBalls,
          "gameData.turn": nextTurn,
          "gameData.turnCount": increment(1),
          "gameData.canPlaceCueBall": cueBallPocketed ? nextTurn : null
        });
      } catch (err) {
        console.error("Turn end update error:", err);
      }
    };

    updatePhysics();
    return () => cancelAnimationFrame(animId);
  }, [isShooting]);

  // 🎯 배경 캔버스 (펠트 질감 포함)
  useEffect(() => {
    const bgCanvas = bgCanvasRef.current;
    if (!bgCanvas) return;
    const ctx = bgCanvas.getContext('2d');

    // 펠트 질감
    ctx.fillStyle = '#0B6623';
    ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
    
    // 나무 테두리
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 20;
    ctx.strokeRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

    // 포켓 그림자
    POCKETS.forEach(p => {
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, POCKET_RADIUS);
      gradient.addColorStop(0, '#000');
      gradient.addColorStop(1, '#1a1a1a');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, POCKET_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      
      // 포켓 가장자리
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // 헤드 스트링 (브레이크 라인)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(TABLE_WIDTH * 0.25, 0);
    ctx.lineTo(TABLE_WIDTH * 0.25, TABLE_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);
  }, []);

  // 🎯 공 렌더링 (3D 효과)
  const drawBall = (ctx, ball) => {
    if (ball.type === 'pocketed') return;

    const x = ball.x;
    const y = ball.y;
    const r = BALL_RADIUS;

    // 그림자
    ctx.beginPath();
    ctx.ellipse(x + 2, y + 2, r * 0.8, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();

    // 공 그라디언트 (3D 효과)
    const gradient = ctx.createRadialGradient(
      x - r * 0.3, y - r * 0.3, 0,
      x, y, r
    );
    
    if (ball.number === 0) {
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(1, '#e0e0e0');
    } else if (ball.number === 8) {
      gradient.addColorStop(0, '#333');
      gradient.addColorStop(1, '#000');
    } else {
      const lightColor = lightenColor(ball.color, 40);
      gradient.addColorStop(0, lightColor);
      gradient.addColorStop(1, ball.color);
    }

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // 테두리
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // 스트라이프 볼 (9-15번)
    if (ball.type === 'stripe') {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.clip();
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - r, y - r * 0.5, r * 2, r);
      ctx.restore();
    }

    // 번호 표시
    if (ball.number > 0) {
      ctx.save();
      
      // 번호 원판
      const circleR = r * 0.55;
      ctx.beginPath();
      ctx.arc(x, y, circleR, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // 번호 텍스트
      ctx.fillStyle = ball.number === 8 ? '#000' : ball.color;
      ctx.font = `bold ${r * 1.2}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ball.number, x, y);
      
      ctx.restore();
    }
  };

  const lightenColor = (color, percent) => {
    const num = parseInt(color.replace("#",""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const bgCanvas = bgCanvasRef.current;
    if (!canvas || !bgCanvas) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
    ctx.drawImage(bgCanvas, 0, 0);

    // 공 그리기
    balls.forEach(b => drawBall(ctx, b));

    // 큐대 그리기
    if (isMyTurn && !isFinished && !isShooting && !cueBallPlacing) {
      const cueBall = balls.find(b => b.id === 0 && b.type !== 'pocketed');
      if (cueBall) {
        // 조준선
        ctx.beginPath();
        ctx.moveTo(cueBall.x, cueBall.y);
        ctx.lineTo(
          cueBall.x + Math.cos(cueAngle) * 200, 
          cueBall.y + Math.sin(cueAngle) * 200
        );
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // 큐대
        ctx.save();
        ctx.translate(cueBall.x, cueBall.y);
        ctx.rotate(cueAngle);
        
        const pullBack = 20 + cuePower * 2;
        
        // 큐대 본체
        const gradient = ctx.createLinearGradient(-pullBack - 100, 0, -pullBack, 0);
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(1, '#D2691E');
        ctx.fillStyle = gradient;
        ctx.fillRect(-pullBack - 100, -3, 100, 6);
        
        // 큐대 팁
        ctx.fillStyle = '#E8F4F8';
        ctx.fillRect(-pullBack - 5, -3, 8, 6);
        
        ctx.restore();
      }
    }

    // 큐볼 배치 모드 안내
    if (cueBallPlacing) {
      const cueBall = balls.find(b => b.id === 0);
      if (cueBall && cueBall.x > 0) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        drawBall(ctx, cueBall);
        ctx.restore();
      }
    }
  }, [balls, isMyTurn, cueAngle, cuePower, isFinished, isShooting, cueBallPlacing]);

  const handleMouseDown = (e) => {
    if (!isMyTurn || isShooting || isFinished) return;
    
    if (cueBallPlacing) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // 헤드 스트링 안쪽에만 배치 가능
      if (mouseX < TABLE_WIDTH * 0.25 && 
          mouseX > BALL_RADIUS && 
          mouseX < TABLE_WIDTH - BALL_RADIUS &&
          mouseY > BALL_RADIUS && 
          mouseY < TABLE_HEIGHT - BALL_RADIUS) {
        
        const newBalls = JSON.parse(JSON.stringify(balls));
        const cueBallIndex = newBalls.findIndex(b => b.id === 0);
        
        if (cueBallIndex !== -1) {
          newBalls[cueBallIndex].x = mouseX;
          newBalls[cueBallIndex].y = mouseY;
          newBalls[cueBallIndex].vx = 0;
          newBalls[cueBallIndex].vy = 0;
          
          updateDoc(doc(db, "battle_rooms", room.id), {
            "gameData.balls": newBalls,
            "gameData.canPlaceCueBall": null
          }).then(() => {
            setCueBallPlacing(false);
          });
        }
      }
      return;
    }
    
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isMyTurn || isShooting || isFinished) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (cueBallPlacing) {
      setBalls(prevBalls => {
        const newBalls = JSON.parse(JSON.stringify(prevBalls));
        const cueBallIndex = newBalls.findIndex(b => b.id === 0);
        
        if (cueBallIndex !== -1 && mouseX < TABLE_WIDTH * 0.25) {
          newBalls[cueBallIndex].x = mouseX;
          newBalls[cueBallIndex].y = mouseY;
        }
        
        return newBalls;
      });
      return;
    }
    
    const cueBall = balls.find(b => b.id === 0 && b.type !== 'pocketed');
    
    if (cueBall) {
      const angle = Math.atan2(mouseY - cueBall.y, mouseX - cueBall.x);
      if (isDragging) {
        const dist = Math.sqrt(
          Math.pow(mouseX - cueBall.x, 2) + 
          Math.pow(mouseY - cueBall.y, 2)
        );
        setCuePower(Math.min(dist / 5, 20));
      } else {
        setCueAngle(angle + Math.PI);
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      shoot();
    }
  };

  return (
    <div style={{
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      width: '100%', 
      position: 'relative', 
      padding: '10px'
    }}>
      <div style={{
        display: 'flex', 
        justifyContent: 'space-between', 
        width: '100%', 
        maxWidth: '600px', 
        marginBottom: 10, 
        padding: '10px 20px', 
        background: '#2c3e50', 
        borderRadius: 10, 
        color: 'white', 
        alignItems: 'center',
        boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          textAlign: 'center', 
          opacity: room.gameData.turn === room.host ? 1 : 0.5
        }}>
          <div style={{ fontSize: 24 }}>🎱</div>
          <div style={{ fontWeight: 'bold' }}>{room.hostName}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#ccc' }}>VS</div>
          {!isFinished && (
            <div style={{
              color: timeLeft <= 10 ? '#e74c3c' : '#f1c40f', 
              fontWeight: 'bold', 
              fontSize: 24, 
              marginTop: 5
            }}>
              {timeLeft}s
            </div>
          )}
        </div>
        <div style={{
          textAlign: 'center', 
          opacity: room.gameData.turn === room.guest ? 1 : 0.5
        }}>
          <div style={{ fontSize: 24 }}>⚪</div>
          <div style={{ fontWeight: 'bold' }}>{room.guestName}</div>
        </div>
      </div>

      <div style={{
        position: 'relative', 
        border: '5px solid #3e2723', 
        borderRadius: '10px', 
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
      }}>
        <canvas 
          ref={bgCanvasRef}
          width={TABLE_WIDTH}
          height={TABLE_HEIGHT}
          style={{ position: 'absolute', top: 0, left: 0, display: 'none' }}
        />
        <canvas 
          ref={canvasRef}
          width={TABLE_WIDTH}
          height={TABLE_HEIGHT}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{
            cursor: cueBallPlacing ? 'crosshair' : (isMyTurn && !isShooting && !isFinished ? 'crosshair' : 'default'), 
            borderRadius: '5px'
          }}
        />
        {cueBallPlacing && (
          <div style={{
            position: 'absolute', 
            bottom: 10, 
            left: '50%', 
            transform: 'translateX(-50%)', 
            color: 'white', 
            background: 'rgba(231, 76, 60, 0.9)', 
            padding: '8px 15px', 
            borderRadius: 20,
            fontWeight: 'bold',
            pointerEvents: 'none'
          }}>
            Click to place cue ball (left side only)
          </div>
        )}
        {!isFinished && isMyTurn && !isShooting && !cueBallPlacing && (
          <div style={{
            position: 'absolute', 
            bottom: 10, 
            left: '50%', 
            transform: 'translateX(-50%)', 
            color: 'white', 
            background: 'rgba(0,0,0,0.6)', 
            padding: '5px 10px', 
            borderRadius: 20, 
            pointerEvents: 'none'
          }}>
            {t.dragToShoot || "Drag mouse to shoot!"}
          </div>
        )}
      </div>

      <div style={{ marginTop: 15, width: '100%', textAlign: 'center' }}>
        {cueBallPlacing ? (
          <div style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: 18 }}>
            🎯 PLACE CUE BALL
          </div>
        ) : !isFinished && isMyTurn ? (
          <div style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: 18 }}>
            YOUR TURN
          </div>
        ) : (
          <div style={{ color: '#95a5a6', fontSize: 18 }}>
            Waiting...
          </div>
        )}
      </div>

      {isFinished && (
        <div style={{
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          background: 'rgba(0,0,0,0.85)', 
          zIndex: 100, 
          borderRadius: 10,
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center'
        }}>
          <h1 style={{
            color: '#f1c40f', 
            fontSize: 40, 
            textShadow: '0 0 10px red', 
            margin: 0
          }}>
            GAME OVER
          </h1>
          <h3 style={{ color: 'white', marginBottom: 30 }}>
            {room.winner === user.uid ? t.win : t.lose}
          </h3>
          <div style={{
            display: 'flex', 
            gap: 10, 
            width: '80%', 
            justifyContent: 'center', 
            maxWidth: '400px'
          }}>
            {myRole === 'host' ? (
              <>
                <button 
                  className="btn" 
                  disabled={!isGuestReady} 
                  style={{
                    flex: 1, 
                    background: isGuestReady ? '#2980b9' : '#7f8c8d', 
                    padding: '15px', 
                    cursor: isGuestReady ? 'pointer' : 'not-allowed', 
                    color: 'white', 
                    fontWeight: 'bold'
                  }} 
                  onClick={restartGame}
                >
                  {isGuestReady ? t.oneMore : t.waitUser}
                </button>
                <button 
                  className="btn" 
                  style={{
                    flex: 1, 
                    background: '#c0392b', 
                    padding: '15px', 
                    fontWeight: 'bold'
                  }} 
                  onClick={handleHostExit}
                >
                  {t.destroyRoom}
                </button>
              </>
            ) : (
              <>
                {!isGuestReady ? (
                  <button 
                    className="btn" 
                    style={{
                      flex: 1, 
                      background: '#27ae60', 
                      padding: '15px', 
                      fontWeight: 'bold'
                    }} 
                    onClick={handleGuestReady}
                  >
                    {t.ready}
                  </button>
                ) : (
                  <div style={{
                    flex: 1, 
                    background: '#2c3e50', 
                    color: '#fff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    borderRadius: 5
                  }}>
                    {t.waitHost}
                  </div>
                )}
                <button 
                  className="btn" 
                  style={{
                    flex: 1, 
                    background: '#555', 
                    padding: '15px', 
                    fontWeight: 'bold'
                  }} 
                  onClick={handleGuestExit}
                >
                  {t.exit}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}