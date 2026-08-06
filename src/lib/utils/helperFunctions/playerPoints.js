// file: src/lib/utils/helperFunctions/playerPoints.js
export const getHistoricalPlayerPoints = async (year) => {
    try {
        // Sleeper API provides season-long stats per year
        const res = await fetch(`https://api.sleeper.app/v1/stats/nfl/regular/${year}`);
        if (!res.ok) return {};
        
        const data = await res.json();
        const pointsMap = {};
        
        // Loop through all players and extract their fantasy points 
        // Note: Change pts_ppr to pts_half_ppr or pts_std if your league uses a different scoring format
        for (const [playerId, stats] of Object.entries(data)) {
            pointsMap[playerId] = stats.pts_ppr || stats.pts_half_ppr || stats.pts_std || 0;
        }
        
        return pointsMap;
    } catch (e) {
        console.error(`Error fetching stats for ${year}:`, e);
        return {};
    }
}