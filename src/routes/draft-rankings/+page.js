import { leagueID, managers as configuredManagers } from '$lib/utils/leagueInfo';

export async function load({ fetch }) {
  try {
    if (!leagueID) {
      throw new Error("leagueID is undefined in leagueInfo.js");
    }

    let currentLeagueId = leagueID;
    const seasonsData = {};
    const managersMap = new Map();

    // Seed configured managers from leagueInfo.js first so custom photos/names take priority
    if (configuredManagers && Array.isArray(configuredManagers)) {
      configuredManagers.forEach(m => {
        if (m.managerID) {
          managersMap.set(m.managerID, {
            managerID: m.managerID,
            name: m.name || 'Unknown Manager',
            photo: m.photo || '/managers/question.png'
          });
        }
      });
    }

    while (currentLeagueId) {
      const leagueRes = await fetch(`https://api.sleeper.app/v1/league/${currentLeagueId}`);
      if (!leagueRes.ok) break;

      const league = await leagueRes.json();
      if (!league || !league.league_id) break;

      const seasonYear = league.season || 'Unknown';

      const [draftsRes, rostersRes, usersRes] = await Promise.all([
        fetch(`https://api.sleeper.app/v1/league/${currentLeagueId}/drafts`),
        fetch(`https://api.sleeper.app/v1/league/${currentLeagueId}/rosters`),
        fetch(`https://api.sleeper.app/v1/league/${currentLeagueId}/users`)
      ]);

      const drafts = draftsRes.ok ? await draftsRes.json() : [];
      const rosters = rostersRes.ok ? await rostersRes.json() : [];
      const users = usersRes.ok ? await usersRes.json() : [];

      users.forEach(u => {
        // If the manager isn't already overridden by leagueInfo.js, fall back to Sleeper profile data
        if (!managersMap.has(u.user_id)) {
          managersMap.set(u.user_id, {
            managerID: u.user_id,
            name: u.display_name || u.username || 'Unknown Manager',
            photo: u.avatar ? `https://sleepercdn.com/avatars/thumbs/${u.avatar}` : '/managers/question.png'
          });
        } else {
          // If configured via leagueInfo.js by managerID, check if we want to fallback avatar if photo is missing
          const existing = managersMap.get(u.user_id);
          if ((!existing.photo || existing.photo === '/managers/question.png') && u.avatar) {
            existing.photo = `https://sleepercdn.com/avatars/thumbs/${u.avatar}`;
          }
        }
      });

      const rosterToUserMap = {};
      rosters.forEach(r => {
        rosterToUserMap[r.roster_id] = r.owner_id;
      });

      let draftPicks = [];
      for (const draft of drafts) {
        if (!draft?.draft_id) continue;
        const picksRes = await fetch(`https://api.sleeper.app/v1/draft/${draft.draft_id}/picks`);
        if (picksRes.ok) {
          const picks = await picksRes.json();
          if (picks && picks.length > 0) {
            draftPicks = picks;
            break;
          }
        }
      }

      const playerPoints = {};
      for (let week = 1; week <= 17; week++) {
        const matchRes = await fetch(`https://api.sleeper.app/v1/league/${currentLeagueId}/matchups/${week}`);
        if (!matchRes.ok) continue;
        const matchups = await matchRes.json();
        
        matchups.forEach(team => {
          const pointsMap = team.players_points || {};
          for (const [playerId, pts] of Object.entries(pointsMap)) {
            playerPoints[playerId] = (playerPoints[playerId] || 0) + pts;
          }
        });
      }

      seasonsData[seasonYear] = {
        draftPicks,
        playerPoints,
        rosters,
        rosterToUserMap
      };

      currentLeagueId = league.previous_league_id;
    }

    return {
      seasons: seasonsData,
      managers: Array.from(managersMap.values())
    };
  } catch (err) {
    console.error("Error loading draft rankings data:", err);
    return { seasons: {}, managers: [] };
  }
}