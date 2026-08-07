<script>
    import { round } from '$lib/utils/helper';
    import { getTeamData } from '$lib/utils/helperFunctions/universalFunctions';

    export let managerID;
    export let manager; // Numeric index passed from Manager.svelte (e.g. 0, 1, 2...)
    export let managers; // Array of manager objects from leagueInfo.js
    export let records;
    export let leagueTeamManagers = {};

    // 1. Normalize records structure
    $: regData = records?.regularSeasonData || records || {};
    $: leagueManagerRecords = regData.leagueManagerRecords || {};

    // 2. Resolve the correct managerID using the numeric array index if managerID wasn't passed directly
    $: resolvedManagerID = (() => {
        if (managerID) return managerID;
        if (manager !== undefined && Array.isArray(managers) && managers[manager]) {
            return managers[manager].managerID;
        }
        return null;
    })();

    // 3. Direct dictionary lookup using the proper Sleeper managerID key
    $: managerRecord = (resolvedManagerID && leagueManagerRecords[resolvedManagerID]) 
        ? leagueManagerRecords[resolvedManagerID] 
        : (manager !== undefined && leagueManagerRecords[manager] ? leagueManagerRecords[manager] : {});

    // Safe metrics extraction
    $: wins = managerRecord.wins ?? 0;
    $: losses = managerRecord.losses ?? 0;
    $: ties = managerRecord.ties ?? 0;
    $: totalGames = wins + losses + ties;
    $: winPct = totalGames > 0 ? (wins + (ties * 0.5)) / totalGames : 0;

    $: rawFptsFor = managerRecord.fptsFor ?? 0;
    $: rawFptsAg = managerRecord.fptsAgainst ?? 0;

    $: avgScore = totalGames > 0 ? rawFptsFor / totalGames : 0;
    $: avgPtsAg = totalGames > 0 ? rawFptsAg / totalGames : 0;

    // Opponent info resolver helper
    function getOpponentInfo(opponentName) {
        if (!opponentName) return { name: '', photo: null, managerIndex: null };

        let matchedManager = null;
        let matchedIndex = null;

        if (Array.isArray(managers)) {
            matchedIndex = managers.findIndex(m => 
                m.name === opponentName || 
                m.managerID === opponentName || 
                m.user_name === opponentName ||
                m.display_name === opponentName
            );
            if (matchedIndex > -1) {
                matchedManager = managers[matchedIndex];
            }
        }

        if (!matchedManager && leagueTeamManagers?.users) {
            for (const uID in leagueTeamManagers.users) {
                const user = leagueTeamManagers.users[uID];
                if (user.display_name === opponentName || uID === opponentName || user.user_name === opponentName) {
                    matchedIndex = managers ? managers.findIndex(m => m.managerID === uID) : null;
                    matchedManager = {
                        name: user.display_name || opponentName,
                        photo: user.avatar ? `https://sleepercdn.com/avatars/thumbs/${user.avatar}` : null
                    };
                    break;
                }
            }
        }

        return {
            name: matchedManager?.name || opponentName,
            photo: matchedManager?.photo || matchedManager?.avatar || null,
            managerIndex: matchedIndex > -1 ? matchedIndex : null
        };
    }

    // Biggest Blowout
    $: blowoutData = managerRecord.biggestBlowout || {};
    $: blowoutMargin = blowoutData.margin ?? 0;
    $: blowoutOpponentRaw = blowoutData.opponent ?? '';
    $: blowoutYear = blowoutData.year ?? '';
    $: blowoutWeek = blowoutData.week ?? '';
    $: blowoutOpponent = getOpponentInfo(blowoutOpponentRaw);

    // Worst Loss
    $: worstLossData = managerRecord.worstLoss || {};
    $: worstLossMargin = worstLossData.margin ?? 0;
    $: worstLossOpponentRaw = worstLossData.opponent ?? '';
    $: worstLossYear = worstLossData.year ?? '';
    $: worstLossWeek = worstLossData.week ?? '';
    $: worstLossOpponent = getOpponentInfo(worstLossOpponentRaw);

    // High / Low Scores
    $: highData = managerRecord.highScore || {};
    $: highScore = highData.score ?? 0;
    $: highScoreOpponentRaw = highData.opponent ?? '';
    $: highScoreYear = highData.year ?? '';
    $: highScoreWeek = highData.week ?? '';
    $: highScoreOpponent = getOpponentInfo(highScoreOpponentRaw);

    $: lowData = managerRecord.lowScore || {};
    $: lowScore = lowData.score ?? 0;
    $: lowScoreOpponentRaw = lowData.opponent ?? '';
    $: lowScoreYear = lowData.year ?? '';
    $: lowScoreWeek = lowData.week ?? '';
    $: lowScoreOpponent = getOpponentInfo(lowScoreOpponentRaw);

    // League Ranks calculation across all dictionary entries
    function getRank(metricKey, descending = true) {
        const entries = Object.values(leagueManagerRecords);
        if (!entries.length) return '—';

        const sorted = [...entries].sort((a, b) => {
            let valA = 0;
            let valB = 0;
            const tA = (a.wins ?? 0) + (a.losses ?? 0) + (a.ties ?? 0);
            const tB = (b.wins ?? 0) + (b.losses ?? 0) + (b.ties ?? 0);

            if (metricKey === 'wins') {
                valA = (a.wins ?? 0);
                valB = (b.wins ?? 0);
            } else if (metricKey === 'winPct') {
                valA = tA > 0 ? ((a.wins ?? 0) + (((a.ties ?? 0)) * 0.5)) / tA : 0;
                valB = tB > 0 ? ((b.wins ?? 0) + (((b.ties ?? 0)) * 0.5)) / tB : 0;
            } else if (metricKey === 'avgScore') {
                valA = tA > 0 ? (a.fptsFor ?? 0) / tA : 0;
                valB = tB > 0 ? (b.fptsFor ?? 0) / tB : 0;
            } else if (metricKey === 'avgPtsAg') {
                valA = tA > 0 ? (a.fptsAgainst ?? 0) / tA : 0;
                valB = tB > 0 ? (b.fptsAgainst ?? 0) / tB : 0;
            } else if (metricKey.includes('.')) {
                const [parent, child] = metricKey.split('.');
                valA = a?.[parent]?.[child] ?? 0;
                valB = b?.[parent]?.[child] ?? 0;
            } else {
                valA = a?.[metricKey] ?? 0;
                valB = b?.[metricKey] ?? 0;
            }
            return descending ? valB - valA : valA - valB;
        });

        const index = sorted.findIndex(r => r === managerRecord);
        return index > -1 ? `#${index + 1}` : '—';
    }

    $: winRank = getRank('wins', true);
    $: winPctRank = getRank('winPct', true);
    $: blowoutRank = getRank('biggestBlowout.margin', true);
    $: worstLossRank = getRank('worstLoss.margin', false);
    $: avgScoreRank = getRank('avgScore', true);
    $: avgPtsAgRank = getRank('avgPtsAg', true);
    $: highScoreRank = getRank('highScore.score', true);
    $: lowScoreRank = getRank('lowScore.score', false);
</script>

<div class="mx-auto mb-16 w-full max-w-6xl rounded-2xl border border-slate-700/50 bg-slate-900/85 p-4 sm:p-6 shadow-2xl backdrop-blur-md">
    <div class="mb-5 pb-3 border-b border-slate-800 text-center">
        <h3 class="text-xl font-bold tracking-wide text-slate-100 sm:text-2xl uppercase">
            Career Stats
        </h3>
    </div>

    <!-- Changed grid-cols-1 to grid-cols-2 for mobile -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        <!-- Record Card -->
        <div class="relative rounded-xl bg-slate-800/40 p-3.5 sm:p-4 border border-slate-700/30 flex flex-col justify-between hover:border-slate-600/60 transition-all">
            <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Record</span>
                <span class="text-[10px] sm:text-[11px] font-medium text-slate-400">
                    Rank <strong class="text-indigo-400 font-bold">{winRank}</strong>
                </span>
            </div>
            <div class="text-xl sm:text-2xl font-black text-slate-100 tracking-tight my-1">
                {wins}-{losses}{ties > 0 ? `-${ties}` : ''}
            </div>
        </div>

        <!-- Winning % Card -->
        <div class="relative rounded-xl bg-slate-800/40 p-3.5 sm:p-4 border border-slate-700/30 flex flex-col justify-between hover:border-slate-600/60 transition-all">
            <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Winning %</span>
                <span class="text-[10px] sm:text-[11px] font-medium text-slate-400">
                    Rank <strong class="text-indigo-400 font-bold">{winPctRank}</strong>
                </span>
            </div>
            <div class="text-xl sm:text-2xl font-black text-slate-100 tracking-tight my-1">
                {winPct.toFixed(3).replace(/^0/, '')}
            </div>
        </div>

        <!-- Average Score Card -->
        <div class="relative rounded-xl bg-slate-800/40 p-3.5 sm:p-4 border border-slate-700/30 flex flex-col justify-between hover:border-slate-600/60 transition-all">
            <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Avg PF</span>
                <span class="text-[10px] sm:text-[11px] font-medium text-slate-400">
                    Rank <strong class="text-indigo-400 font-bold">{avgScoreRank}</strong>
                </span>
            </div>
            <div class="text-xl sm:text-2xl font-black text-slate-100 tracking-tight my-1">
                {avgScore.toFixed(2)}
            </div>
        </div>

        <!-- Avg Pts Ag Card -->
        <div class="relative rounded-xl bg-slate-800/40 p-3.5 sm:p-4 border border-slate-700/30 flex flex-col justify-between hover:border-slate-600/60 transition-all">
            <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Avg PA</span>
                <span class="text-[10px] sm:text-[11px] font-medium text-slate-400">
                    Rank <strong class="text-indigo-400 font-bold">{avgPtsAgRank}</strong>
                </span>
            </div>
            <div class="text-xl sm:text-2xl font-black text-slate-100 tracking-tight my-1">
                {avgPtsAg.toFixed(2)}
            </div>
        </div>

        <!-- Biggest Blowout Card -->
        <div class="relative rounded-xl bg-slate-800/40 p-3.5 sm:p-4 border border-slate-700/30 flex flex-col justify-between hover:border-slate-600/60 transition-all">
            <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Biggest Blowout</span>
                <span class="text-[10px] sm:text-[11px] font-medium text-slate-400">
                    Rank <strong class="text-indigo-400 font-bold">{blowoutRank}</strong>
                </span>
            </div>
            <div class="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight my-1">
                +{blowoutMargin > 0 ? blowoutMargin.toFixed(2) : '0.00'}
            </div>
            
            <div class="mt-2 pt-2 border-t border-slate-700/20 flex items-center">
                {#if blowoutOpponent.name}
                    <a href={blowoutOpponent.managerIndex !== null ? `/manager?manager=${blowoutOpponent.managerIndex}` : '#'} class="group/avatar flex items-center space-x-2 w-full">
                        {#if blowoutOpponent.photo}
                            <img src={blowoutOpponent.photo} alt={blowoutOpponent.name} class="h-6 w-6 sm:h-7 sm:w-7 rounded-full object-cover border border-slate-700 group-hover/avatar:border-emerald-500/60 bg-slate-900 transition-colors shrink-0" />
                        {:else}
                            <div class="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-slate-900 border border-slate-700 group-hover/avatar:border-emerald-500/60 flex items-center justify-center text-[10px] text-slate-200 font-bold transition-colors shrink-0">
                                {blowoutOpponent.name.charAt(0)}
                            </div>
                        {/if}
                        <div class="flex flex-col truncate leading-tight">
                            <span class="text-[9px] sm:text-[10px] text-slate-400">
                                {blowoutYear}{blowoutWeek ? ` • Wk ${blowoutWeek}` : ''} vs
                            </span>
                            <span class="text-[11px] sm:text-xs font-bold text-slate-300 group-hover/avatar:text-emerald-300 uppercase tracking-tight truncate transition-colors">
                                {blowoutOpponent.name}
                            </span>
                        </div>
                    </a>
                {:else}
                    <span class="text-[10px] sm:text-[11px] text-slate-500 italic">No record found</span>
                {/if}
            </div>
        </div>

        <!-- Worst Loss Card -->
        <div class="relative rounded-xl bg-slate-800/40 p-3.5 sm:p-4 border border-slate-700/30 flex flex-col justify-between hover:border-slate-600/60 transition-all">
            <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Worst Loss</span>
                <span class="text-[10px] sm:text-[11px] font-medium text-slate-400">
                    Rank <strong class="text-indigo-400 font-bold">{worstLossRank}</strong>
                </span>
            </div>
            <div class="text-xl sm:text-2xl font-black text-rose-400 tracking-tight my-1">
                -{worstLossMargin > 0 ? worstLossMargin.toFixed(2) : '0.00'}
            </div>

            <div class="mt-2 pt-2 border-t border-slate-700/20 flex items-center">
                {#if worstLossOpponent.name}
                    <a href={worstLossOpponent.managerIndex !== null ? `/manager?manager=${worstLossOpponent.managerIndex}` : '#'} class="group/avatar flex items-center space-x-2 w-full">
                        {#if worstLossOpponent.photo}
                            <img src={worstLossOpponent.photo} alt={worstLossOpponent.name} class="h-6 w-6 sm:h-7 sm:w-7 rounded-full object-cover border border-slate-700 group-hover/avatar:border-rose-500/60 bg-slate-900 transition-colors shrink-0" />
                        {:else}
                            <div class="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-slate-900 border border-slate-700 group-hover/avatar:border-rose-500/60 flex items-center justify-center text-[10px] text-slate-200 font-bold transition-colors shrink-0">
                                {worstLossOpponent.name.charAt(0)}
                            </div>
                        {/if}
                        <div class="flex flex-col truncate leading-tight">
                            <span class="text-[9px] sm:text-[10px] text-slate-400">
                                {worstLossYear}{worstLossWeek ? ` • Wk ${worstLossWeek}` : ''} vs
                            </span>
                            <span class="text-[11px] sm:text-xs font-bold text-slate-300 group-hover/avatar:text-rose-300 uppercase tracking-tight truncate transition-colors">
                                {worstLossOpponent.name}
                            </span>
                        </div>
                    </a>
                {:else}
                    <span class="text-[10px] sm:text-[11px] text-slate-500 italic">No record found</span>
                {/if}
            </div>
        </div>

        <!-- High Score Card -->
        <div class="relative rounded-xl bg-slate-800/40 p-3.5 sm:p-4 border border-slate-700/30 flex flex-col justify-between hover:border-slate-600/60 transition-all">
            <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">High Score</span>
                <span class="text-[10px] sm:text-[11px] font-medium text-slate-400">
                    Rank <strong class="text-indigo-400 font-bold">{highScoreRank}</strong>
                </span>
            </div>
            <div class="text-xl sm:text-2xl font-black text-slate-100 tracking-tight my-1">
                {highScore.toFixed(2)}
            </div>

            <div class="mt-2 pt-2 border-t border-slate-700/20 flex items-center">
                {#if highScoreOpponent.name}
                    <a href={highScoreOpponent.managerIndex !== null ? `/manager?manager=${highScoreOpponent.managerIndex}` : '#'} class="group/avatar flex items-center space-x-2 w-full">
                        {#if highScoreOpponent.photo}
                            <img src={highScoreOpponent.photo} alt={highScoreOpponent.name} class="h-6 w-6 sm:h-7 sm:w-7 rounded-full object-cover border border-slate-700 group-hover/avatar:border-indigo-500/60 bg-slate-900 transition-colors shrink-0" />
                        {:else}
                            <div class="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-slate-900 border border-slate-700 group-hover/avatar:border-indigo-500/60 flex items-center justify-center text-[10px] text-slate-200 font-bold transition-colors shrink-0">
                                {highScoreOpponent.name.charAt(0)}
                            </div>
                        {/if}
                        <div class="flex flex-col truncate leading-tight">
                            <span class="text-[9px] sm:text-[10px] text-slate-400">
                                {highScoreYear}{highScoreWeek ? ` • Wk ${highScoreWeek}` : ''} vs
                            </span>
                            <span class="text-[11px] sm:text-xs font-bold text-slate-300 group-hover/avatar:text-indigo-300 uppercase tracking-tight truncate transition-colors">
                                {highScoreOpponent.name}
                            </span>
                        </div>
                    </a>
                {:else}
                    <span class="text-[10px] sm:text-[11px] text-slate-500 italic">No record found</span>
                {/if}
            </div>
        </div>

        <!-- Low Score Card -->
        <div class="relative rounded-xl bg-slate-800/40 p-3.5 sm:p-4 border border-slate-700/30 flex flex-col justify-between hover:border-slate-600/60 transition-all">
            <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Low Score</span>
                <span class="text-[10px] sm:text-[11px] font-medium text-slate-400">
                    Rank <strong class="text-indigo-400 font-bold">{lowScoreRank}</strong>
                </span>
            </div>
            <div class="text-xl sm:text-2xl font-black text-slate-100 tracking-tight my-1">
                {lowScore.toFixed(2)}
            </div>

            <div class="mt-2 pt-2 border-t border-slate-700/20 flex items-center">
                {#if lowScoreOpponent.name}
                    <a href={lowScoreOpponent.managerIndex !== null ? `/manager?manager=${lowScoreOpponent.managerIndex}` : '#'} class="group/avatar flex items-center space-x-2 w-full">
                        {#if lowScoreOpponent.photo}
                            <img src={lowScoreOpponent.photo} alt={lowScoreOpponent.name} class="h-6 w-6 sm:h-7 sm:w-7 rounded-full object-cover border border-slate-700 group-hover/avatar:border-indigo-500/60 bg-slate-900 transition-colors shrink-0" />
                        {:else}
                            <div class="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-slate-900 border border-slate-700 group-hover/avatar:border-indigo-500/60 flex items-center justify-center text-[10px] text-slate-200 font-bold transition-colors shrink-0">
                                {lowScoreOpponent.name.charAt(0)}
                            </div>
                        {/if}
                        <div class="flex flex-col truncate leading-tight">
                            <span class="text-[9px] sm:text-[10px] text-slate-400">
                                {lowScoreYear}{lowScoreWeek ? ` • Wk ${lowScoreWeek}` : ''} vs
                            </span>
                            <span class="text-[11px] sm:text-xs font-bold text-slate-300 group-hover/avatar:text-indigo-300 uppercase tracking-tight truncate transition-colors">
                                {lowScoreOpponent.name}
                            </span>
                        </div>
                    </a>
                {:else}
                    <span class="text-[10px] sm:text-[11px] text-slate-500 italic">No record found</span>
                {/if}
            </div>
        </div>

    </div>
</div>