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
    const previousDraftsData = resolvedInfo ? resolvedInfo[6] : null;

    const draftPicks = [];
    const draftsList = Array.isArray(previousDraftsData) ? previousDraftsData : (previousDraftsData?.drafts || []);

    if (draftsList.length > 0) {
        for (const draftObj of draftsList) {
            const seasonYear = draftObj.year;
            const draftOrder = draftObj.draftOrder || [];
            const matrix = draftObj.draft || [];

            // Safely iterate through the fully built draft matrix (rows and columns)
            matrix.forEach((roundRow, roundIndex) => {
                if (!Array.isArray(roundRow)) return;

                roundRow.forEach((cell, colIndex) => {
                    if (!cell) return;

                    // Handle both object cells (standard picks/keepers) and primitive player IDs
                    const playerData = typeof cell === 'object' ? cell : { player: cell };
                    const playerId = playerData.player;

                    if (!playerId) return;

                    // The actual roster ID for this cell is determined by the draftOrder column index,
                    // UNLESS the pick was traded to a new owner (stored in playerData.newOwner).
                    const originalRosterId = draftOrder[colIndex];
                    const finalRosterId = playerData.newOwner || originalRosterId;

                    const isKeeperFlag = Boolean(
                        playerData.is_keeper || 
                        playerData.keeper || 
                        playerData.metadata?.is_keeper || 
                        playerData.metadata?.keeper
                    );

                    if (finalRosterId) {
                        draftPicks.push({
                            season: seasonYear,
                            round: roundIndex + 1, // <--- Correctly populates the actual draft round number
                            roster_id: finalRosterId,
                            player_id: playerId,
                            is_keeper: isKeeperFlag,
                            metadata: playerData.metadata || {}
                        });
                    }
                });
            });
        }
    }

    const managerParam = url?.searchParams?.get('manager');
    const managerIndex = managerParam !== null ? parseInt(managerParam, 10) : -1;

    const props = {
        manager: !isNaN(managerIndex) && managerIndex >= 0 && managerIndex < managersObj.length ? managerIndex : -1,
        managers: managersObj,
        managersInfo,
        draftPicks
    }

    return props;
}