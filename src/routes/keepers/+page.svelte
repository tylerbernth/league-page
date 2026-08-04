<script>
    import LinearProgress from '@smui/linear-progress';
    import { onMount } from 'svelte';
    import { loadPlayers, getPreviousDrafts, getLeagueTeamManagers } from '$lib/utils/helper';
    import { getTeamNameFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';

    let loading = true;
    let error = null;
    let historicalKeepersBySeason = {};

    onMount(async () => {
        try {
            const [playerRes, leagueTeamManagers, previousDraftsData] = await Promise.all([
                loadPlayers(null).catch(() => ({})),
                getLeagueTeamManagers().catch(() => ({})),
                getPreviousDrafts().catch(() => ([]))
            ]);
            
            // Handle different possible structures returned by loadPlayers()
            const players = playerRes?.players || playerRes || {};
            const aggregatedData = {};

            for (const draftObj of previousDraftsData) {
                const season = draftObj.year;
                const draftBoard = draftObj.draft || [];
                const draftOrder = draftObj.draftOrder || [];
                const seasonTeamManagersMap = leagueTeamManagers?.teamManagersMap?.[season] || {};
                const managersMapForSeason = {};

                for (let rIndex = 0; rIndex < draftBoard.length; rIndex++) {
                    const row = draftBoard[rIndex];
                    if (!Array.isArray(row)) continue;

                    for (let cIndex = 0; cIndex < row.length; cIndex++) {
                        const cell = row[cIndex];
                        if (!cell) continue;

                        // Check if cell is an object containing keeper metadata flags
                        const isKeeper = cell.is_keeper || cell.metadata?.is_keeper;
                        if (!isKeeper) continue;

                        // Extract the actual player ID string/number whether stored as cell.player or cell.player_id
                        const rawPlayerId = typeof cell === 'object' ? (cell.player || cell.player_id) : cell;
                        if (!rawPlayerId) continue;
                        
                        const playerIdStr = String(rawPlayerId);

                        const rosterId = draftOrder[cIndex];
                        if (!rosterId) continue;

                        const rosterInfo = seasonTeamManagersMap[rosterId];
                        const managerIDs = rosterInfo?.managers || [];
                        
                        let teamName = `Roster ${rosterId}`;
                        try {
                            teamName = getTeamNameFromTeamManagers(leagueTeamManagers, rosterId, season) || teamName;
                        } catch (e) {
                            // fallback if universal helper fails
                        }

                        const targetManagers = managerIDs.length > 0 ? managerIDs : [rosterId];

                        for (const mgrID of targetManagers) {
                            const userInfo = leagueTeamManagers?.users?.[mgrID];
                            const managerName = userInfo?.display_name || userInfo?.username || teamName;

                            if (!managersMapForSeason[managerName]) {
                                managersMapForSeason[managerName] = {
                                    teamName,
                                    keepers: []
                                };
                            }

                            // Pull matching player record from loaded dictionary using string keys
                            const pData = players[playerIdStr] || players[rawPlayerId] || {};
                            const fullName = pData.full_name || (pData.fn && pData.ln ? `${pData.fn} ${pData.ln}` : (pData.first_name && pData.last_name ? `${pData.first_name} ${pData.last_name}` : `Player ID: ${rawPlayerId}`));
                            const position = pData.pos || pData.position || pData.fantasy_positions?.[0] || 'NFL';
                            const team = pData.t || pData.team || pData.gsis_team || 'FA';

                            managersMapForSeason[managerName].keepers.push({
                                round: rIndex + 1,
                                pick: cIndex + 1,
                                player_id: rawPlayerId,
                                playerDetails: {
                                    full_name: fullName,
                                    position,
                                    team
                                },
                                metadata: cell.metadata || {}
                            });
                        }
                    }
                }

                if (Object.keys(managersMapForSeason).length > 0) {
                    aggregatedData[season] = managersMapForSeason;
                }
            }

            historicalKeepersBySeason = aggregatedData;
        } catch (err) {
            console.error('Failed to initialize historical keepers page:', err);
            error = err.message || 'Failed to load keeper archive.';
        } finally {
            loading = false;
        }
    });
</script>

<style>
/* Position pill styles (matching RosterRow) */
.position-pill {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    border-radius: 0.5rem;
    font-size: 0.6875rem; /* 11px */
    font-weight: 700;
    color: white;
    box-shadow: 0 1px 0 rgba(0,0,0,0.2) inset;
}
.pos-QB { background-color: #ff2a6d; }
.pos-RB { background-color: #00ceb8; }
.pos-WR { background-color: #58a6ff; }
.pos-TE { background-color: #ff9f1c; }
.pos-K { background-color: #9c27b0; }
.pos-DEF { background-color: #ffd600; color: #1e293b; }
.pos-DL { background-color: #8b5cf6; }
.pos-LB { background-color: #6366f1; }
.pos-DB { background-color: #06b6d4; }
.pos-BN { background-color: #374151; }
.pos-FLEX { background: linear-gradient(135deg, #58a6ff 0%, #00ceb8 50%, #ff9f1c 100%); }
.pos-WRRB { background: linear-gradient(135deg, #58a6ff 0%, #00ceb8 100%); }
.pos-S-FLEX { background: linear-gradient(135deg, #ff2a6d 0%, #58a6ff 33%, #00ceb8 66%, #ff9f1c 100%); }
.pos-R-FLEX { background: linear-gradient(135deg, #58a6ff 0%, #ff9f1c 100%); }
.pos-IDP { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #06b6d4 100%); }

.keeper-card {
    padding: 0.75rem;
}
.keeper-player-name { font-size: 0.95rem; }
</style>

<div class="my-8 mb-20 w-full max-w-6xl mx-auto px-4">
    <div class="mb-8 pb-4 border-b border-slate-800 text-center">
        <h2 class="text-2xl font-bold tracking-tight text-indigo-400 sm:text-3xl">
            Historical Keepers
        </h2>
        <p class="mt-2 text-sm text-slate-400">
            A comprehensive breakdown of franchise keeper selections across all recorded seasons.
        </p>
    </div>

    {#if loading}
        <div class="mx-auto my-20 w-[85%] max-w-lg text-center text-slate-400">
            <p class="mb-3 text-sm">Compiling historical keeper logs...</p>
            <LinearProgress indeterminate />
        </div>
    {:else if error}
        <div class="rounded-2xl border border-red-500/30 bg-red-950/40 p-8 text-center text-red-300 shadow-xl">
            <p class="font-semibold mb-1">Error Loading Keepers</p>
            <p class="text-xs text-red-400">{error}</p>
        </div>
    {:else if Object.keys(historicalKeepersBySeason).length === 0}
        <div class="rounded-2xl border border-slate-700/50 bg-slate-900/85 p-8 text-center text-slate-400 shadow-xl">
            <p class="text-slate-300">No historical keeper data found across available league years.</p>
        </div>
    {:else}
        <div class="space-y-12">
            {#each Object.entries(historicalKeepersBySeason).sort(([a], [b]) => b - a) as [season, managersData]}
                <div class="rounded-2xl border border-slate-700/50 bg-slate-900/85 p-6 shadow-2xl backdrop-blur-md">
                    <h3 class="text-xl font-bold tracking-wide text-slate-100 mb-6 border-b border-slate-800 pb-3 flex items-center justify-between">
                        <span>{season} Season Keepers</span>
                    </h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {#each Object.entries(managersData) as [managerName, data]}
                            <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-4 shadow-inner">
                                <div class="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
                                    <span class="font-semibold text-slate-200 text-base">{managerName}</span>
                                    <span class="text-xs text-slate-400 italic">{data.teamName}</span>
                                </div>

                                {#if data.keepers.length === 0}
                                    <p class="text-xs text-slate-500 italic py-2">No keepers logged for this season.</p>
                                {:else}
                                    <ul class="space-y-2.5">
                                        {#each data.keepers as pick}
                                            <li class="flex items-center justify-between bg-slate-900/80 rounded-lg border border-slate-800/50 keeper-card">
                                                <div class="flex items-center gap-4">
                                                    <!-- Larger Sleeper Player Headshot Image -->
                                                    <img 
                                                        src="https://sleepercdn.com/content/nfl/players/{pick.player_id}.jpg" 
                                                        alt={pick.playerDetails?.full_name || pick.player_id}
                                                        class="h-14 w-14 rounded-full bg-slate-800 object-cover border border-slate-700 shrink-0"
                                                        onerror={(e) => { e.target.src = 'https://sleepercdn.com/images/v2/icons/player_default.png'; }}
                                                    />
                                                    <div>
                                                        <div class="font-medium text-slate-200 keeper-player-name">
                                                            {pick.playerDetails?.full_name}
                                                        </div>
                                                        <div class="flex items-center gap-2 mt-1">
                                                            <span class="position-pill pos-{(pick.playerDetails?.position || 'BN').toUpperCase().replace(' ', '-')}">{pick.playerDetails?.position}</span>
                                                            <div class="text-slate-400 text-[12px]">
                                                                {pick.playerDetails?.team} • Round {pick.round} (Pick {pick.pick})
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        {/each}
                                    </ul>
                                {/if}
                            </div>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>