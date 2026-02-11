import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// 🔥 진짜 배포된 서버 주소 (배포 후엔 127.0.0.1 대신 https://... 사용)
const API_URL = "https://us-central1-myapp-f6fbd.cloudfunctions.net/getTftMatchHistory";

export default function TftSearch() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (data) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [data]);

  const searchTft = async (targetName) => {
    const searchName = targetName || nickname;
    if (!searchName) return;

    setLoading(true);
    setError("");
    setData(null);
    setNickname(searchName);
    window.scrollTo(0, 0);

    try {
      const res = await axios.get(`${API_URL}?nickname=${searchName}`);
      setData(res.data);
    } catch (e) {
      if (e.response && e.response.status === 404) {
          setError("소환사를 찾을 수 없습니다.");
      } else {
          setError("검색 실패 (서버 오류)");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') searchTft();
  };

  const formatGameLength = (seconds) => {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getTimeAgo = (timestamp) => {
      const diff = Date.now() - timestamp;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours < 1) return "방금 전";
      if (hours < 24) return `${hours}시간 전`;
      return `${Math.floor(hours / 24)}일 전`;
  };

  const getRankColor = (p) => {
      if (p === 1) return '#11b288';
      if (p <= 4) return '#33a8ff';
      return '#888';
  };
  
  const getPlacementBg = (p) => {
      if (p === 1) return 'linear-gradient(90deg, rgba(17, 178, 136, 0.2) 0%, rgba(32, 32, 32, 0) 100%)';
      if (p <= 4) return 'linear-gradient(90deg, rgba(51, 168, 255, 0.2) 0%, rgba(32, 32, 32, 0) 100%)';
      return 'linear-gradient(90deg, rgba(100, 100, 100, 0.1) 0%, rgba(32, 32, 32, 0) 100%)';
  };

  const getStats = () => {
      if (!data) return null;
      const total = data.history.length;
      const wins = data.history.filter(m => m.myPlacement === 1).length;
      const top4 = data.history.filter(m => m.myPlacement <= 4).length;
      const avgRank = (data.history.reduce((acc, cur) => acc + cur.myPlacement, 0) / total).toFixed(1);
      return { total, wins, top4, avgRank };
  };

  // 🔥 [핵심 수정] 챔피언 이미지 (DDragon 사용 + 이름 매핑)
  const getChampImg = (id) => {
      // 1. "TFT13_Jinx" -> "Jinx"
      let name = id.split('_').pop();
      
      // 2. 이름 예외 처리 (라이엇 API 이름 vs 이미지 파일명 다를 때)
      if (name === 'Wukong') name = 'MonkeyKing';
      if (name === 'BelVeth') name = 'Belveth';
      if (name === 'ChoGath') name = 'Chogath';
      if (name === 'KaiSa') name = 'Kaisa';
      if (name === 'KhaZix') name = 'Khazix';
      if (name === 'LeBlanc') name = 'Leblanc';
      if (name === 'VelKoz') name = 'Velkoz';
      if (name === 'RenataGlasc') name = 'Renata';
      // Set 13 신규/특수 챔피언 등은 기본 이름으로 매칭됨

      // DDragon이 가장 빠르고 안정적입니다.
      return `https://ddragon.leagueoflegends.com/cdn/15.2.1/img/champion/${name}.png`;
  };

  const getItemImg = (n) => `https://raw.communitydragon.org/latest/game/assets/maps/particles/tft/item_icons/standard/${n.replace('TFT_Item_','').toLowerCase()}.png`;
  const getAugmentImg = (n) => `https://raw.communitydragon.org/latest/game/assets/maps/particles/tft/item_icons/augments/${n.replace('TFT13_Augment_','').toLowerCase()}.png`;

  const stats = getStats();

  return (
    <div style={{ background: '#121212', minHeight: '100vh', color: '#e0e0e0', padding: '20px', fontFamily: '"Pretendard", sans-serif' }}>
      
      <div style={{ maxWidth: '1000px', margin: '0 auto 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h1 style={{ color: '#fff', fontSize: '24px', fontWeight:'bold', display:'flex', alignItems:'center', gap:10 }}>
            <span style={{color:'#11b288'}}>TFT</span> 전적검색
          </h1>
          <button onClick={() => navigate('/home')} style={{ background: '#333', border: 'none', color: '#ccc', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>나가기</button>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto 30px', display: 'flex', gap: '0' }}>
        <input 
          type="text" 
          placeholder="소환사명#태그 (예: 상체조진날#KR1)" 
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ flex: 1, padding: '15px', borderRadius: '4px 0 0 4px', border: 'none', background: '#252525', color: 'white', fontSize: '15px', outline:'none' }}
        />
        <button onClick={() => searchTft()} style={{ padding: '0 25px', background: '#11b288', color: '#fff', border: 'none', borderRadius: '0 4px 4px 0', cursor: 'pointer', fontWeight: 'bold' }}>검색</button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '60px', color:'#11b288' }}>데이터 불러오는 중...</div>}
      {error && <div style={{ textAlign: 'center', color: '#ff6b6b', padding: '20px' }}>{error}</div>}

      {data && stats && (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* 프로필 & 요약 */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <div style={{ flex: 1, background: '#202020', padding: '20px', borderRadius: '4px', display:'flex', alignItems:'center', gap:20 }}>
                <div style={{position:'relative'}}>
                    <img src={`https://ddragon.leagueoflegends.com/cdn/14.3.1/img/profileicon/${data.profile.icon}.png`} alt="" style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid #11b288' }} onError={e=>e.target.style.display='none'} />
                    <div style={{position:'absolute', bottom:0, right:0, background:'#111', fontSize:11, padding:'2px 6px', borderRadius:10, border:'1px solid #555'}}>Lv.{data.profile.level}</div>
                </div>
                <div>
                    <div style={{fontSize:24, fontWeight:'bold', color:'white'}}>{data.profile.name}</div>
                    <div style={{color:'#888', marginTop:5}}>{data.profile.rank} <span style={{color:'#11b288'}}>•</span> {data.profile.lp} LP</div>
                </div>
            </div>

            <div style={{ width: '300px', background: '#202020', padding: '20px', borderRadius: '4px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
                <div style={{color:'#888', fontSize:12, marginBottom:10}}>최근 {stats.total}게임 분석</div>
                <div style={{display:'flex', justifyContent:'space-between', textAlign:'center'}}>
                    <div>
                        <div style={{fontSize:12, color:'#aaa'}}>평균 등수</div>
                        <div style={{fontSize:18, fontWeight:'bold', color:'white'}}>#{stats.avgRank}</div>
                    </div>
                    <div>
                        <div style={{fontSize:12, color:'#aaa'}}>1등 횟수</div>
                        <div style={{fontSize:18, fontWeight:'bold', color:'white'}}>{stats.wins}번</div>
                    </div>
                    <div>
                        <div style={{fontSize:12, color:'#aaa'}}>TOP 4</div>
                        <div style={{fontSize:18, fontWeight:'bold', color:'#33a8ff'}}>{stats.top4}번</div>
                    </div>
                </div>
            </div>
          </div>

          {/* 전적 리스트 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.history.map((match, idx) => (
              <div key={idx} style={{ 
                  display: 'flex', 
                  background: '#202020', 
                  borderRadius: '4px', 
                  borderLeft: `6px solid ${getRankColor(match.myPlacement)}`,
                  height: '100px',
                  overflow: 'hidden'
              }}>
                
                <div style={{ width: '100px', paddingLeft: 15, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: getPlacementBg(match.myPlacement) }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: getRankColor(match.myPlacement) }}>#{match.myPlacement}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: 4 }}>랭크</div>
                    <div style={{ fontSize: '11px', color: '#aaa', marginTop: 2 }}>{formatGameLength(match.gameLength)}</div>
                    <div style={{ fontSize: '11px', color: '#666' }}>{getTimeAgo(match.gameDatetime)}</div>
                </div>

                <div style={{ width: '160px', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                        {match.myAugments.map((aug, i) => (
                            <img key={i} src={getAugmentImg(aug)} onError={e=>e.target.style.background='#333'} style={{ width: 22, height: 22, borderRadius: 2, background:'#000' }} alt="" title={aug} />
                        ))}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {match.myTraits.slice(0, 6).map((t, i) => (
                            <div key={i} style={{ 
                                display: 'flex', alignItems: 'center', gap: 3,
                                background: t.style === 3 ? '#ffb900' : (t.style === 2 ? '#b2bec3' : '#333'), 
                                padding: '2px 4px', borderRadius: 2 
                            }}>
                                <img src={`https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_${t.name.replace('TFT13_','').toLowerCase()}.png`} 
                                     onError={e=>e.target.style.display='none'} 
                                     style={{width:10, height:10, filter:'brightness(0)'}} alt=""/>
                                <span style={{ fontSize: 10, fontWeight: 'bold', color: '#000' }}>{t.num_units}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 5, paddingLeft: 10 }}>
                    {match.myUnits.map((u, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 36 }}>
                            <div style={{ fontSize: 10, color: '#f1c40f', height: 12 }}>{u.tier > 1 ? "★".repeat(u.tier) : ""}</div>
                            <div style={{ position: 'relative', width: 36, height: 36, marginBottom: 2 }}>
                                <img src={getChampImg(u.id)} onError={e=>{e.target.style.display='none';}} style={{ width: '100%', height: '100%', borderRadius: 4, border: `1px solid ${u.rarity>=4?'#9b59b6':'#555'}` }} alt="" />
                            </div>
                            <div style={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                {u.items.slice(0,3).map((item, idx) => (
                                    <img key={idx} src={getItemImg(item)} onError={e=>e.target.style.display='none'} style={{ width: 10, height: 10, borderRadius: 2 }} alt="" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ width: '180px', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '1px solid #333', background: '#1c1c1c' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px' }}>
                        {match.participants.map((p, pIdx) => (
                            <div key={pIdx} 
                                 onClick={() => p.name !== data.profile.name && searchTft(`${p.name}#${p.tag}`)}
                                 style={{ 
                                     display: 'flex', alignItems: 'center', gap: 4, 
                                     fontSize: 11, cursor: 'pointer', overflow: 'hidden',
                                     color: p.name === data.profile.name ? '#fff' : '#888',
                                     fontWeight: p.name === data.profile.name ? 'bold' : 'normal'
                                 }}>
                                <div style={{ 
                                    width: 14, height: 14, background: '#333', color: '#fff', 
                                    textAlign: 'center', lineHeight: '14px', borderRadius: 2, fontSize: 9 
                                }}>{p.placement}</div>
                                <div style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{p.name}</div>
                            </div>
                        ))}
                    </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}