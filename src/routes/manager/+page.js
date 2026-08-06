/// file: src/routes/manager/+page.js
import {
    waitForAll,
    getLeagueRosters,
    getLeagueTeamManagers,
    getLeagueData,
    getLeagueTransactions,
    getAwards,
    getLeagueRecords,
    getPreviousDrafts,
    getHistoricalPlayerPoints, // <-- Newly imported function
    managers as managersObj
} from '$lib/utils/helper';

export async function load({ url }) {
    if(!managersObj.length) return false;
    
    const managersInfo = waitForAll(
        getLeagueRosters(),    
        getLeagueTeamManagers(),
        getLeagueData(),
        getLeagueTransactions(),
        getAwards(),
        getLeagueRecords(),
        getPreviousDrafts(), 
    );

    const resolvedInfo = await managersInfo;
    const leagueTeamManagers = resolvedInfo ? resolvedInfo[1] : null;
    const previousDraftsData = resolvedInfo ? resolvedInfo[6] : null;

    const draftPicks = [];
    const allDraftsByYear = {};
    const playerPointsByYear = {};
    const rosterToUserMapByYear = {};

    const draftsList = Array.isArray(previousDraftsData) ? previousDraftsData : (previousDraftsData?.drafts || []);

    if (draftsList.length > 0) {
        // Fetch stats for all unique draft years in parallel to speed up load time
        const draftYears = [...new Set(draftsList.map(d => d.year))];
        const statsPromises = draftYears.map(year => getHistoricalPlayerPoints(year));
        const resolvedStats = await Promise.all(statsPromises);
        
        draftYears.forEach((year, index) => {
            playerPointsByYear[year] = resolvedStats[index];
            
            // Map historical roster IDs to their manager ID for that specific year
            rosterToUserMapByYear[year] = {};
            const seasonMap = leagueTeamManagers?.teamManagersMap?.[year] || {};
            for (const [rId, rData] of Object.entries(seasonMap)) {
                rosterToUserMapByYear[year][rId] = rData.managers?.[0] || null;
            }
        });

        for (const draftObj of draftsList) {
            const seasonYear = draftObj.year;
            const draftOrder = draftObj.draftOrder || [];
            const matrix = draftObj.draft || [];
            const yearPicks = [];

            matrix.forEach((roundRow, roundIndex) => {
                if (!Array.isArray(roundRow)) return;

                roundRow.forEach((cell, colIndex) => {
                    if (!cell) return;

                    const playerData = typeof cell === 'object' ? cell : { player: cell };
                    const playerId = playerData.player;

                    if (!playerId) return;

                    const originalRosterId = draftOrder[colIndex];
                    const finalRosterId = playerData.newOwner || originalRosterId;

                    const isKeeperFlag = Boolean(
                        playerData.is_keeper || 
                        playerData.keeper || 
                        playerData.metadata?.is_keeper || 
                        playerData.metadata?.keeper
                    );

                    const pickObject = {
                        season: seasonYear,
                        round: roundIndex + 1,
                        pick_no: (roundIndex * draftOrder.length) + (colIndex + 1),
                        roster_id: finalRosterId,
                        player_id: playerId,
                        is_keeper: isKeeperFlag,
                        first_name: playerData.first_name || playerData.metadata?.first_name,
                        last_name: playerData.last_name || playerData.metadata?.last_name,
                        position: playerData.position || playerData.metadata?.position,
                        team: playerData.team || playerData.metadata?.team,
                        picked_by: rosterToUserMapByYear[seasonYear]?.[finalRosterId] || null,
                        metadata: playerData.metadata || {}
                    };

                    if (finalRosterId) {
                        draftPicks.push(pickObject);
                        yearPicks.push(pickObject);
                    }
                });
            });

            allDraftsByYear[seasonYear] = {
                draftPicks: yearPicks,
                rosters: draftObj.rosters || []
            };
        }
    }

    const managerParam = url?.searchParams?.get('manager');
    const managerIndex = managerParam !== null ? parseInt(managerParam, 10) : -1;

    return {
        manager: !isNaN(managerIndex) && managerIndex >= 0 && managerIndex < managersObj.length ? managerIndex : -1,
        managers: managersObj,
        managersInfo,
        draftPicks,
        allDraftsByYear,        // <-- Newly added prop
        playerPointsByYear,     // <-- Newly added prop
        rosterToUserMapByYear   // <-- Newly added prop
    };
}