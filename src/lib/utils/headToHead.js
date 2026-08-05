/// file: src/lib/utils/headToHead.js
import { leagueID, managers } from '$lib/utils/leagueInfo';

const fetchLeagueUsers = async (targetLeagueId) => {
    try {
        const res = await fetch(`https://api.sleeper.app/v1/league/${targetLeagueId}/users`, { compress: true });
        if (!res.ok) return {};
        const users = await res.json();
        const userMap = {};
        for (const user of users) {
            userMap[user.user_id] = {
                display_name: user.display_name || user.username || `User ${user.user_id}`,
                username: user.username
            };
        }
        return userMap;
    } catch (err) {
        console.error("Failed to fetch league users:", err);
        return {};
    }
};

const fetchLeagueRosters = async (targetLeagueId) => {
    try {
        const res = await fetch(`https://api.sleeper.app/v1/league/${targetLeagueId}/rosters`, { compress: true });
        if (!res.ok) return {};
        const rosters = await res.json();
        const rosterOwnerMap = {};
        for (const roster of rosters) {
            const ownerId = roster.owner_id || (roster.co_owners && roster.co_owners[0]);
            if (ownerId) {
                rosterOwnerMap[roster.roster_id] = ownerId;
            }
        }
        return rosterOwnerMap;
    } catch (err) {
        console.error("Failed to fetch league rosters:", err);
        return {};
    }
};

export const calculateHeadToHeadHistory = async (targetManagerId) => {
    if (!targetManagerId) return [];

    // Build a lookup map mapping Sleeper user ID (managerID) -> { index, name, photo }
    const localManagerMap = {};
    if (Array.isArray(managers)) {
        managers.forEach((m, index) => {
            if (m.managerID) {
                localManagerMap[String(m.managerID)] = {
                    index: index,
                    name: m.name,
                    photo: m.photo
                };
            }
        });
    }

    const statsMap = {}; 
    let currentLeagueId = leagueID;
    const visitedLeagues = new Set();

    while (currentLeagueId && !visitedLeagues.has(currentLeagueId)) {
        visitedLeagues.add(currentLeagueId);

        try {
            const leagueRes = await fetch(`https://api.sleeper.app/v1/league/${currentLeagueId}`, { compress: true });
            if (!leagueRes.ok) break;
            const leagueData = await leagueRes.json();

            const previousLeagueId = leagueData.previous_league_id;
            const playoffStartWeek = leagueData.settings?.playoff_week_start || 15;
            const regularSeasonLength = playoffStartWeek - 1;

            const [usersMap, rosterOwnerMap] = await Promise.all([
                fetchLeagueUsers(currentLeagueId),
                fetchLeagueRosters(currentLeagueId)
            ]);

            const matchPromises = [];
            for (let w = 1; w <= regularSeasonLength; w++) {
                matchPromises.push(
                    fetch(`https://api.sleeper.app/v1/league/${currentLeagueId}/matchups/${w}`, { compress: true })
                        .then(res => res.ok ? res.json() : null)
                        .catch(() => null)
                );
            }

            const weeksData = await Promise.all(matchPromises);

            weeksData.forEach((weekMatchups) => {
                if (!Array.isArray(weekMatchups) || weekMatchups.length === 0) return;

                const matchupPairs = {};

                for (const m of weekMatchups) {
                    if (!m.matchup_id) continue;
                    if (!matchupPairs[m.matchup_id]) {
                        matchupPairs[m.matchup_id] = [];
                    }
                    matchupPairs[m.matchup_id].push(m);
                }

                for (const pair of Object.values(matchupPairs)) {
                    if (pair.length !== 2) continue;

                    const [teamA, teamB] = pair;
                    const managerIdA = rosterOwnerMap[teamA.roster_id];
                    const managerIdB = rosterOwnerMap[teamB.roster_id];

                    if (!managerIdA || !managerIdB) continue;

                    const isTargetA = String(managerIdA) === String(targetManagerId);
                    const isTargetB = String(managerIdB) === String(targetManagerId);

                    if (!isTargetA && !isTargetB) continue;

                    const userTeam = isTargetA ? teamA : teamB;
                    const oppTeam = isTargetA ? teamB : teamA;
                    const oppManagerId = isTargetA ? managerIdB : managerIdA;

                    const getPts = (t) => {
                        if (typeof t.points === 'number') return t.points;
                        if (t.starters_points && Array.isArray(t.starters_points)) {
                            return t.starters_points.reduce((sum, val) => sum + (val || 0), 0);
                        }
                        return 0;
                    };

                    const ptsFor = getPts(userTeam);
                    const ptsAgainst = getPts(oppTeam);

                    if (ptsFor === 0 && ptsAgainst === 0) continue;

                    const localConfig = localManagerMap[String(oppManagerId)] || {};
                    const rawUserInfo = usersMap[oppManagerId] || {};

                    const oppName = localConfig.name || rawUserInfo.display_name || rawUserInfo.username || `Team ${oppManagerId}`;
                    const oppAvatar = localConfig.photo || null;
                    const managerIndex = localConfig.index !== undefined ? localConfig.index : 0;

                    if (!statsMap[oppManagerId]) {
                        statsMap[oppManagerId] = {
                            managerIndex: managerIndex,
                            opponentName: oppName,
                            opponentAvatar: oppAvatar,
                            wins: 0,
                            losses: 0,
                            ties: 0,
                            pf: 0,
                            pa: 0
                        };
                    } else {
                        if (oppAvatar && !statsMap[oppManagerId].opponentAvatar) {
                            statsMap[oppManagerId].opponentAvatar = oppAvatar;
                        }
                    }

                    statsMap[oppManagerId].pf += ptsFor;
                    statsMap[oppManagerId].pa += ptsAgainst;

                    if (ptsFor > ptsAgainst) {
                        statsMap[oppManagerId].wins += 1;
                    } else if (ptsFor < ptsAgainst) {
                        statsMap[oppManagerId].losses += 1;
                    } else {
                        statsMap[oppManagerId].ties += 1;
                    }
                }
            });

            currentLeagueId = previousLeagueId;
        } catch (err) {
            console.error("Error traversing league history chain:", err);
            break;
        }
    }

    return Object.entries(statsMap).map(([id, data]) => {
        const totalGames = data.wins + data.losses + data.ties;
        const winPct = totalGames > 0 ? (data.wins + data.ties * 0.5) / totalGames : 0;
        return {
            id,
            ...data,
            totalGames,
            winPct
        };
    }).sort((a, b) => b.winPct - a.winPct || b.totalGames - a.totalGames);
};