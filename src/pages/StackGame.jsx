import React, { useState, useEffect, useRef, Suspense, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera, Stars, Environment, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, increment, setDoc, collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// --- ⚙️ 설정 ---
const BOX_HEIGHT = 1;
const INITIAL_SIZE = 3;
const GAME_SPEED_BASE = 0.08; 
const PLAY_COST = 10000; // 💰 한 판 비용: 10,000원
const REWARD_PER_BLOCK = 1500; // 💰 1층당 보상
const MIN_REWARD_LEVEL = 50; // ⭐ [수정] 보상은 50층부터 지급

// --- 🎵 사운드 시스템 ---
class AudioManager {
    constructor() {
        this.context = null;
        this.isMuted = false;
    }

    getContext() {
        if (!this.context) {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
        return this.context;
    }

    playSound(type, combo = 0) {
        if (this.isMuted) return;
        
        const ctx = this.getContext();
        if (!ctx) return;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === 'stack') {
            const scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]; 
            const noteIndex = combo % scale.length;
            const octaveOffset = (Math.floor(combo / scale.length) % 3) * 0.5; 
            const multiplier = 1 + octaveOffset;
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(scale[noteIndex] * multiplier, now);
            
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            
            osc.start(now);
            osc.stop(now + 0.15);

        } else if (type === 'perfect') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
            
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            
            osc.start(now);
            osc.stop(now + 0.3);

        } else if (type === 'fail') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
            
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.5);
            
            osc.start(now);
            osc.stop(now + 0.5);
        }
    }

    setMuted(muted) {
        this.isMuted = muted;
    }

    cleanup() {
        if (this.context && this.context.state !== 'closed') {
            this.context.close();
        }
    }
}

// --- 🎨 테마 설정 ---
const THEMES = [
    { name: 'URBAN NIGHT', env: 'city', bg: '#0a0a1a', light: 'purple', particleColor: '#00ffff', getColor: (i) => `hsl(${(i * 10) % 360}, 70%, 55%)` },
    { name: 'GLACIER POINT', env: 'park', bg: '#001122', light: '#aaffff', particleColor: '#ffffff', getColor: (i) => `hsl(${190 + (i * 5) % 40}, 60%, ${60 + (i % 2) * 10}%)` },
    { name: 'VOLCANIC ASH', env: 'sunset', bg: '#1a0500', light: '#ff4400', particleColor: '#ffaa00', getColor: (i) => `hsl(${0 + (i * 5) % 30}, 80%, 50%)` },
    { name: 'MYSTIC FOREST', env: 'forest', bg: '#051505', light: '#44ff44', particleColor: '#aaffaa', getColor: (i) => `hsl(${90 + (i * 10) % 60}, 70%, 45%)` },
    { name: 'GOLDEN PENTHOUSE', env: 'apartment', bg: '#1a1100', light: '#ffcc00', particleColor: '#ffd700', getColor: (i) => `hsl(45, 80%, ${50 + (i % 3) * 10}%)` }
];

// --- 🏆 랭킹 시스템 ---
const updateRanking = async (user, newScore, playerName) => {
    if (!user) return;
    const rankRef = doc(db, "stack_ranks", user.uid); 
    try {
        const docSnap = await getDoc(rankRef);
        if (docSnap.exists()) {
            if (newScore > docSnap.data().score) {
                await setDoc(rankRef, { name: playerName, score: newScore, timestamp: Date.now() }, { merge: true });
            }
        } else {
            await setDoc(rankRef, { name: playerName, score: newScore, timestamp: Date.now() });
        }
    } catch (e) { console.error('Ranking update failed:', e); }
};

const fetchLeaderboard = async () => {
    try {
        const q = query(collection(db, "stack_ranks"), orderBy("score", "desc"), limit(10));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) { return []; }
};

// --- 🧱 떨어진 조각 ---
const Debris = React.memo(({ position, size, color }) => {
    const mesh = useRef();
    const velocity = useRef(new THREE.Vector3(0, 0, 0));
    const rotation = useRef(new THREE.Vector3(Math.random()*0.1, Math.random()*0.1, Math.random()*0.1));

    useFrame((state, delta) => {
        if (!mesh.current) return;
        velocity.current.y -= 20 * delta; 
        mesh.current.position.add(velocity.current.clone().multiplyScalar(delta));
        mesh.current.rotation.x += rotation.current.x;
        mesh.current.rotation.y += rotation.current.y;
        if (mesh.current.position.y < -20) mesh.current.scale.set(0,0,0);
    });

    return (
        <mesh ref={mesh} position={position}>
            <boxGeometry args={size} />
            <meshStandardMaterial color={color} transparent opacity={0.8} />
        </mesh>
    );
});

// --- ✨ 퍼펙트 이펙트 ---
const Shockwave = React.memo(({ position }) => {
    const mesh = useRef();
    useFrame((state, delta) => {
        if (!mesh.current) return;
        mesh.current.scale.x += delta * 5;
        mesh.current.scale.y += delta * 5;
        mesh.current.material.opacity -= delta * 2;
        if (mesh.current.material.opacity <= 0) mesh.current.visible = false;
    });

    return (
        <mesh ref={mesh} position={position} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[INITIAL_SIZE * 0.8, INITIAL_SIZE * 1.2, 32]} />
            <meshBasicMaterial color="white" transparent opacity={0.8} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
    );
});

// --- 🏗️ 게임 로직 씬 ---
const StackGameScene = ({ isPlaying, onGameOver, onScore, setScoreDisplay, theme, audioManager }) => {
    const [stack, setStack] = useState([{ id: 0, pos: [0, 0, 0], size: [INITIAL_SIZE, BOX_HEIGHT, INITIAL_SIZE], color: theme.getColor(0) }]);
    const [debris, setDebris] = useState([]);
    const [shockwaves, setShockwaves] = useState([]); 
    const [activeState, setActiveState] = useState({ pos: 0, direction: 'x', moveDir: 1, speed: GAME_SPEED_BASE });
    const [cameraTargetY, setCameraTargetY] = useState(5);
    const [combo, setCombo] = useState(0);
    const [cameraImpact, setCameraImpact] = useState(0);

    const stackRef = useRef(stack);
    const activeStateRef = useRef(activeState);
    const comboRef = useRef(combo);
    const isPlayingRef = useRef(isPlaying);

    useEffect(() => { stackRef.current = stack; }, [stack]);
    useEffect(() => { activeStateRef.current = activeState; }, [activeState]);
    useEffect(() => { comboRef.current = combo; }, [combo]);
    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

    const placeBlock = useCallback(() => {
        if (!isPlayingRef.current) return;

        const currentStack = stackRef.current;
        const currentActiveState = activeStateRef.current;
        const currentCombo = comboRef.current;

        const topIndex = currentStack.length;
        const isX = topIndex % 2 === 0;
        const prev = currentStack[currentStack.length - 1];
        
        const currentPos = isX 
            ? [currentActiveState.pos, topIndex * BOX_HEIGHT, prev.pos[2]] 
            : [prev.pos[0], topIndex * BOX_HEIGHT, currentActiveState.pos];
        
        const delta = isX ? currentPos[0] - prev.pos[0] : currentPos[2] - prev.pos[2];
        const prevSize = isX ? prev.size[0] : prev.size[2];
        const overlap = prevSize - Math.abs(delta);

        if (overlap <= 0) {
            audioManager.playSound('fail'); 
            onGameOver(); 
            return;
        }

        let newSize = [...prev.size];
        let newPos = [...currentPos];
        let debrisInfo = null;
        let isPerfect = false;

        if (Math.abs(delta) < 0.15) {
            isPerfect = true;
            newPos[isX ? 0 : 2] = prev.pos[isX ? 0 : 2]; 
            setCombo(c => c + 1);
            if(window.navigator.vibrate) window.navigator.vibrate(50);
            
            audioManager.playSound('perfect', currentCombo); 
            setShockwaves(prev => [...prev.slice(-5), { pos: [newPos[0], newPos[1], newPos[2]], id: Date.now() }]);
            setCameraImpact(0.5); 

            if(isX) newSize[0] = Math.min(INITIAL_SIZE, newSize[0] + 0.2);
            else newSize[2] = Math.min(INITIAL_SIZE, newSize[2] + 0.2);
            
        } else {
            isPerfect = false;
            setCombo(0);
            audioManager.playSound('stack', 0); 

            if (isX) {
                newSize[0] = overlap;
                newPos[0] = prev.pos[0] + delta / 2;
                const debrisSize = [Math.abs(delta), BOX_HEIGHT, prev.size[2]];
                const debrisX = prev.pos[0] + (prevSize / 2 + Math.abs(delta) / 2) * Math.sign(delta);
                debrisInfo = { id: `debris-${Date.now()}`, pos: [debrisX, currentPos[1], currentPos[2]], size: debrisSize, color: theme.getColor(topIndex) };
            } else {
                newSize[2] = overlap;
                newPos[2] = prev.pos[2] + delta / 2;
                const debrisSize = [prev.size[0], BOX_HEIGHT, Math.abs(delta)];
                const debrisZ = prev.pos[2] + (prevSize / 2 + Math.abs(delta) / 2) * Math.sign(delta);
                debrisInfo = { id: `debris-${Date.now()}`, pos: [currentPos[0], currentPos[1], debrisZ], size: debrisSize, color: theme.getColor(topIndex) };
            }
        }

        if(isPerfect) audioManager.playSound('stack', currentCombo + 1); 

        setStack(prevStack => [...prevStack, { 
            id: topIndex, pos: newPos, size: newSize, color: theme.getColor(topIndex) 
        }]);
        if (debrisInfo) setDebris(prev => [...prev.slice(-10), debrisInfo]);
        
        setActiveState({
            pos: -5, direction: isX ? 'z' : 'x', moveDir: 1,
            speed: Math.min(0.35, currentActiveState.speed + 0.0015) 
        });
        
        onScore();
        setScoreDisplay(topIndex);
        setCameraTargetY(topIndex * BOX_HEIGHT + 5);
    }, [onGameOver, onScore, setScoreDisplay, theme, audioManager]);

    useFrame((state, delta) => {
        if (!isPlaying) return;
        setActiveState(prev => {
            let nextPos = prev.pos + prev.speed * prev.moveDir * 60 * delta;
            if (nextPos > 6 || nextPos < -6) {
                prev.moveDir *= -1;
                nextPos = prev.pos + prev.speed * prev.moveDir * 60 * delta;
            }
            return { ...prev, pos: nextPos };
        });
        if(cameraImpact > 0) setCameraImpact(prev => Math.max(0, prev - delta * 3));
    });

    const { camera, size } = useThree();
    
    useEffect(() => {
        const isMobile = size.width < 600;
        camera.zoom = isMobile ? 35 : 75; 
        camera.updateProjectionMatrix();
    }, [size, camera]);

    useFrame((state, delta) => {
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, cameraTargetY, delta * 2);
        const isMobile = size.width < 600;
        const baseZoom = isMobile ? 35 : 75; 
        camera.zoom = THREE.MathUtils.lerp(camera.zoom, baseZoom + (cameraImpact * 8), delta * 5);
        camera.lookAt(0, camera.position.y - 5, 0);
        camera.updateProjectionMatrix();
    });

    useEffect(() => {
        const handleTap = (e) => {
            if(e.target.closest('button')) return;
            if (e.type === 'touchstart') e.preventDefault();
            placeBlock();
        };
        const handleKey = (e) => {
            if (e.code === 'Space') { e.preventDefault(); placeBlock(); }
        };
        window.addEventListener('mousedown', handleTap);
        window.addEventListener('touchstart', handleTap, { passive: false });
        window.addEventListener('keydown', handleKey);
        return () => {
            window.removeEventListener('mousedown', handleTap);
            window.removeEventListener('touchstart', handleTap);
            window.removeEventListener('keydown', handleKey);
        };
    }, [placeBlock]);

    const topIndex = stack.length;
    const isX = topIndex % 2 === 0;
    const prevBlock = stack[stack.length-1];
    const movingPos = isX ? [activeState.pos, topIndex * BOX_HEIGHT, prevBlock.pos[2]] : [prevBlock.pos[0], topIndex * BOX_HEIGHT, activeState.pos];
    const movingSize = prevBlock.size;

    return (
        <group>
            {stack.map((block) => (
                <mesh key={block.id} position={block.pos} castShadow receiveShadow>
                    <boxGeometry args={block.size} />
                    <meshStandardMaterial color={block.color} roughness={0.2} metalness={0.6} />
                    <mesh scale={[1.02, 1.02, 1.02]}>
                        <boxGeometry args={block.size} />
                        <meshBasicMaterial color="white" wireframe transparent opacity={0.1} />
                    </mesh>
                </mesh>
            ))}
            {isPlaying && (
                <mesh position={movingPos} castShadow>
                    <boxGeometry args={movingSize} />
                    <meshStandardMaterial color={theme.getColor(topIndex)} emissive={theme.getColor(topIndex)} emissiveIntensity={0.3} roughness={0.2} metalness={0.6} />
                </mesh>
            )}
            {debris.map((d) => <Debris key={d.id} position={d.pos} size={d.size} color={d.color} />)}
            {shockwaves.map((s) => <Shockwave key={s.id} position={s.pos} />)}
        </group>
    );
};

// --- UI ---
const GameUI = ({ score, isPlaying, isGameOver, onStart, onExit, ranks, themeName, errorMessage }) => {
    // 🔥 보상 계산 (50층 이상일 때만)
    const reward = score >= MIN_REWARD_LEVEL ? score * REWARD_PER_BLOCK : 0;

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none', display:'flex', flexDirection:'column', justifyContent:'space-between', fontFamily:'sans-serif', userSelect: 'none' }}>
            <div style={{ padding: '20px', textAlign:'center', color:'white', textShadow:'0 0 10px rgba(0,0,0,0.5)' }}>
                <h1 style={{margin:0, fontSize:'3rem', fontWeight:'bold'}}>{score}</h1>
                <p style={{margin:0, opacity:0.8, color:'#ccc', fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:'2px'}}>{themeName}</p>
                {/* ⭐ "7층부터 이득" 문구 삭제됨 */}
            </div>

            {(!isPlaying || isGameOver) && (
                <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'auto' }}>
                    <div style={{marginTop:20, textAlign:'center'}}>
                        {isGameOver ? (
                            <>
                                <h1 style={{fontSize:'3rem', color:'#ff4444', margin:0}}>GAME OVER</h1>
                                <h2 style={{color:'white', marginTop:10}}>SCORE: {score}</h2>
                                {/* ⭐ 텍스트 "획득" -> "+" 로 변경 */}
                                <h3 style={{color:'gold', marginTop:5}}>+ {reward.toLocaleString()}P</h3>
                                <button onClick={onStart} style={btnStyle} aria-label="게임 재시작">RETRY ({PLAY_COST.toLocaleString()}P)</button>
                            </>
                        ) : (
                            <>
                                <h1 style={{fontSize:'3rem', color:'cyan', margin:0}}>STACK TOWER</h1>
                                <p style={{color:'#ccc'}}>TAP / SPACE TO STACK</p>
                                {/* ⭐ 게임 설명 추가 (50층) */}
                                <button onClick={onStart} style={btnStyle} aria-label={`게임 시작 (${PLAY_COST} 포인트)`}>START ({PLAY_COST.toLocaleString()}P)</button>
                            </>
                        )}
                        {errorMessage && (
                            <p style={{color:'#ff6666', marginTop:10, fontSize:'0.9rem'}}>{errorMessage}</p>
                        )}
                        <div style={{marginTop:20}}>
                            <button onClick={onExit} style={{background:'none', border:'none', color:'#ccc', textDecoration:'underline', cursor:'pointer', fontSize:'1rem'}} aria-label="게임 종료">EXIT</button>
                        </div>
                    </div>
                </div>
            )}
            
            {isPlaying && <div style={{ textAlign:'center', paddingBottom:50, color:'rgba(255,255,255,0.3)', pointerEvents:'none', fontSize:'0.9rem' }}>TAP SCREEN</div>}
        </div>
    );
};
const btnStyle = { padding:'15px 50px', fontSize:'1.5rem', background:'cyan', color:'#000', border:'none', borderRadius:'50px', fontWeight:'bold', cursor:'pointer', boxShadow:'0 0 20px cyan', marginTop:20 };

// --- 🏆 랭킹 보드 ---
const LeaderBoard = React.memo(({ ranks }) => {
    return (
        <div style={{ width: '100%', maxWidth: '550px', background: '#222', padding: '20px', borderRadius: '15px', border: '2px solid #444', color: 'white', marginTop: '20px', marginBottom:'20px', fontFamily: 'sans-serif' }}>
            <h3 style={{ textAlign: 'center', margin: '0 0 15px 0', color: 'cyan', borderBottom: '1px solid #444', paddingBottom: '10px' }}>🏆 TOP 10 BUILDERS</h3>
            {ranks.length === 0 ? <div style={{textAlign:'center', color:'#666'}}>Loading Ranking...</div> : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {ranks.map((r, i) => (
                        <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #333' }}>
                            <span style={{ color: i < 3 ? 'cyan' : '#ccc' }}>{i + 1}. {r.name}</span>
                            <span style={{ fontWeight: 'bold', color: 'white' }}>{r.score}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
});

// --- 🔊 음소거 버튼 ---
const MuteButton = React.memo(({ isMuted, toggleMute }) => {
    return (
        <button
            onClick={(e) => { e.stopPropagation(); toggleMute(); }}
            style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0, 0, 0, 0.5)', border: '1px solid #555', borderRadius: '50%', width: '40px', height: '40px', color: 'white', fontSize: '1.2rem', cursor: 'pointer', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label={isMuted ? '음소거 해제' : '음소거'}
        >
            {isMuted ? '🔇' : '🔊'}
        </button>
    );
});

// --- 🚀 Main Component ---
export default function StackGame() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [ranks, setRanks] = useState([]);
    const [playerName, setPlayerName] = useState('Builder');
    const [currentTheme, setCurrentTheme] = useState(THEMES[0]);
    const [isMuted, setIsMuted] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const navigate = useNavigate();
    const user = auth.currentUser;

    const audioManagerRef = useRef(null);
    if (!audioManagerRef.current) {
        audioManagerRef.current = new AudioManager();
    }

    // ⭐ 페이지 로드 시 상단 스크롤
    useEffect(() => { 
        window.scrollTo(0, 0); 
        if (!user) navigate('/login'); 
    }, [user, navigate]);

    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                try {
                    const snap = await getDoc(doc(db, 'users', user.uid));
                    if (snap.exists() && snap.data().name) setPlayerName(snap.data().name);
                    else setPlayerName(user.email.split('@')[0]);
                } catch(e) { console.error(e); setPlayerName(user.email.split('@')[0]); }
            }
        }
        fetchUserData();
        fetchLeaderboard().then(setRanks);
    }, [user]);

    useEffect(() => { if(!isPlaying) fetchLeaderboard().then(setRanks); }, [isPlaying, isGameOver]);
    useEffect(() => { audioManagerRef.current.setMuted(isMuted); }, [isMuted]);
    useEffect(() => { return () => { if (audioManagerRef.current) audioManagerRef.current.cleanup(); }; }, []);

    const handleStart = async () => {
        setErrorMessage('');
        if (window.navigator.vibrate) window.navigator.vibrate(100);
        
        try { 
            // 💰 참가비 차감 및 기록
            const userDoc = await getDoc(doc(db, "users", user.uid));
            const currentPoints = userDoc.data()?.point || 0;
            if (currentPoints < PLAY_COST) {
                setErrorMessage(`포인트가 부족합니다. (보유: ${currentPoints.toLocaleString()}P)`);
                return;
            }
            await updateDoc(doc(db, "users", user.uid), { point: increment(-PLAY_COST) }); 
            // 🔥 [기록 저장]
            await addDoc(collection(db, "history"), {
                uid: user.uid,
                type: "게임",
                msg: `🏗️ 스택 타워 시작`,
                amount: -PLAY_COST,
                createdAt: serverTimestamp()
            });
        } catch(e) {
            console.error(e);
            setErrorMessage('오류가 발생했습니다.');
            return;
        }
        
        const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
        setCurrentTheme(randomTheme);
        setIsPlaying(true);
        setIsGameOver(false);
        setScore(0);
    };

    const handleGameOver = useCallback(async () => {
        setIsPlaying(false);
        setIsGameOver(true);
        if (window.navigator.vibrate) window.navigator.vibrate(500);
        
        // ⭐ [수정] 50층 이상일 때만 보상 계산
        const reward = score >= MIN_REWARD_LEVEL ? score * REWARD_PER_BLOCK : 0;
        
        if(reward > 0) {
            try {
                // 💰 보상 지급 및 기록
                await updateDoc(doc(db, "users", user.uid), { point: increment(reward) });
                // 🔥 [기록 저장]
                await addDoc(collection(db, "history"), {
                    uid: user.uid,
                    type: "게임",
                    msg: `🏗️ 스택 타워 보상 (${score}층)`,
                    amount: reward,
                    createdAt: serverTimestamp()
                });
            } catch(e) { console.error(e); }
        }
        
        // 랭킹은 층수(점수)만 기록 (보상과 무관)
        updateRanking(user, score, playerName);
        
    }, [score, user, playerName]);

    const toggleMute = useCallback(() => { setIsMuted(prev => !prev); }, []);

    return (
        <div style={{ width: '100vw', minHeight: '100vh', background: '#111', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', touchAction: 'none', padding: '10px 0' }}>
            <div style={{ width: '100%', maxWidth: '550px', height: '90dvh', maxHeight: '800px', position: 'relative', overflow: 'hidden', border: '2px solid #333', borderRadius: '15px', boxShadow: '0 0 30px rgba(0,0,0,0.9)', background: '#000' }}>
                <MuteButton isMuted={isMuted} toggleMute={toggleMute} />
                <GameUI score={score} isPlaying={isPlaying} isGameOver={isGameOver} onStart={handleStart} onExit={()=>navigate('/home')} ranks={ranks} themeName={currentTheme.name} errorMessage={errorMessage} />
                <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: false }}>
                    <OrthographicCamera makeDefault position={[20, 20, 20]} zoom={40} near={-50} far={200} onUpdate={c => c.lookAt(0, 0, 0)} />
                    <color attach="background" args={[currentTheme.bg]} />
                    <Environment preset={currentTheme.env} />
                    <ambientLight intensity={0.3} />
                    <directionalLight position={[10, 20, 5]} intensity={1.5} castShadow />
                    <pointLight position={[-10, -10, -10]} intensity={0.8} color={currentTheme.light} />
                    <Sparkles count={50} scale={20} size={4} speed={0.4} opacity={0.5} color={currentTheme.particleColor} />
                    <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade opacity={0.5} />
                    <Suspense fallback={null}>
                        <group key={isPlaying ? 'playing' : 'idle'}>
                            <StackGameScene isPlaying={isPlaying} onGameOver={handleGameOver} onScore={() => setScore(s => s + 1)} setScoreDisplay={setScore} theme={currentTheme} audioManager={audioManagerRef.current} />
                        </group>
                        <EffectComposer disableNormalPass>
                            <Bloom luminanceThreshold={0.4} mipmapBlur intensity={0.8} radius={0.4} />
                            <Vignette eskil={false} offset={0.1} darkness={0.5} />
                            <ChromaticAberration offset={[0.001, 0.001]} />
                        </EffectComposer>
                    </Suspense>
                </Canvas>
            </div>
            <LeaderBoard ranks={ranks} />
        </div>
    );
}