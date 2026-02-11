const functions = require("firebase-functions");
const axios = require("axios");
const cors = require("cors")({ origin: true });

// 🔥 API 키 (그대로 유지)
const RIOT_API_KEY = "RGAPI-e3e2ad28-bc5d-4648-b9e3-4d07aefd0792"; 

exports.getTftMatchHistory = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { nickname } = req.query;
      if (!nickname) return res.status(400).send("닉네임 필요");

      // 0. 닉네임 파싱
      let gameName = nickname;
      let tagLine = "KR1";
      if (nickname.includes("#")) {
        const parts = nickname.split("#");
        gameName = parts[0];
        tagLine = parts[1];
      }

      console.log(`🚀 검색 시작: ${gameName} #${tagLine}`);

      // 1. Riot ID -> PUUID
      const accountUrl = `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
      const accountRes = await axios.get(accountUrl, { headers: { "X-Riot-Token": RIOT_API_KEY } });
      const { puuid, gameName: realName } = accountRes.data;

      // 2. 소환사 정보 (티어 정보용)
      let id = null;
      let profileIconId = 1;
      let summonerLevel = 0;
      try {
        const summonerUrl = `https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
        const summonerRes = await axios.get(summonerUrl, { headers: { "X-Riot-Token": RIOT_API_KEY } });
        id = summonerRes.data.id;
        profileIconId = summonerRes.data.profileIconId;
        summonerLevel = summonerRes.data.summonerLevel;
      } catch (e) {
        console.log("⚠️ 소환사 ID 조회 실패");
      }

      // 3. 티어 조회
      let rankInfo = null;
      if (id) {
        try {
          const leagueUrl = `https://kr.api.riotgames.com/tft/league/v1/entries/by-summoner/${id}`;
          const leagueRes = await axios.get(leagueUrl, { headers: { "X-Riot-Token": RIOT_API_KEY } });
          rankInfo = leagueRes.data.find(l => l.queueType === "RANKED_TFT") || null;
        } catch (e) { console.log("⚠️ 티어 조회 실패"); }
      }

      // 4. 전적 리스트 (🔥 여기를 20으로 수정했습니다!)
      // start=0, count=20
      const matchesUrl = `https://asia.api.riotgames.com/tft/match/v1/matches/by-puuid/${puuid}/ids?start=0&count=20`;
      const matchesRes = await axios.get(matchesUrl, { headers: { "X-Riot-Token": RIOT_API_KEY } });

      // 5. 전적 상세 (20개 병렬 처리)
      const matchPromises = matchesRes.data.map(matchId => 
        axios.get(`https://asia.api.riotgames.com/tft/match/v1/matches/${matchId}`, { headers: { "X-Riot-Token": RIOT_API_KEY } })
      );
      const matchDetailsRes = await Promise.all(matchPromises);

      // 6. 데이터 가공
      const history = matchDetailsRes.map(m => {
        const info = m.data.info;
        const myData = info.participants.find(user => user.puuid === puuid);
        
        const allPlayers = info.participants.map(p => {
            const units = p.units ? p.units.map(u => ({
                id: u.character_id,
                name: u.character_id, // 이름 원본 그대로 보냄 (프론트에서 처리)
                tier: u.tier,
                rarity: u.rarity,
                items: u.itemNames
            })) : [];
            
            const traits = p.traits ? p.traits.filter(t => t.tier_current > 0).sort((a,b) => b.style - a.style) : [];

            return {
                puuid: p.puuid,
                name: p.riotIdGameName,
                tag: p.riotIdTagline,
                placement: p.placement,
                level: p.level,
                augments: p.augments || [],
                traits: traits,
                units: units
            };
        }).sort((a, b) => a.placement - b.placement);

        return {
          matchId: m.data.metadata.match_id,
          gameLength: info.game_length,
          gameDatetime: info.game_datetime,
          myPlacement: myData.placement,
          myLevel: myData.level,
          myAugments: myData.augments || [],
          myUnits: allPlayers.find(p => p.puuid === puuid).units,
          myTraits: allPlayers.find(p => p.puuid === puuid).traits,
          participants: allPlayers
        };
      });

      res.status(200).json({
        profile: {
          name: realName, 
          icon: profileIconId, 
          level: summonerLevel,
          rank: rankInfo ? `${rankInfo.tier} ${rankInfo.rank}` : "Unranked",
          lp: rankInfo ? rankInfo.leaguePoints : 0,
          winRate: rankInfo ? Math.round((rankInfo.wins / (rankInfo.wins + rankInfo.losses)) * 100) : 0
        },
        history
      });

    } catch (error) {
      console.error(error);
      if (error.response && error.response.status === 404) return res.status(404).json({ error: "유저 없음" });
      res.status(500).json({ error: "서버 오류" });
    }
  });
});