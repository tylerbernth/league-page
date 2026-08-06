<script>
    import { getTeamNameFromTeamManagers } from "$lib/utils/helperFunctions/universalFunctions";
    import { leagueID } from "$lib/utils/leagueInfo";

    export let leagueTeamManagers, managerID = null, viewManager = null;

    let historicalSeasons = [];
    let loadingRecords = true;
    let seasonCache = null;

    const fetchAllHistoricalData = async () => {
        if (seasonCache) return seasonCache;
        
        let seasonsData = {};
        let activeID = leagueID;

        while (activeID) {
            try {
                const leagueRes = await fetch(`https://api.sleeper.app/v1/league/${activeID}`);
                const leagueData = await leagueRes.json();
                
                if (!leagueData || !leagueData.season) break;
                const seasonYear = leagueData.season;
                const playoffStartWeek = leagueData.settings?.playoff_week_start || 15;
                const regularSeasonLength = playoffStartWeek - 1;

                const rostersRes = await fetch(`https://api.sleeper.app/v1/league/${activeID}/rosters`);
                const rostersData = await rostersRes.json();

                const rostersMap = {};
                if (Array.isArray(rostersData)) {
                    for (const r of rostersData) {
                        rostersMap[r.roster_id] = r;
                    }
                }

                const [winnersRes, losersRes] = await Promise.all([
                    fetch(`https://api.sleeper.app/v1/league/${activeID}/winners_bracket`).then(res => res.ok ? res.json() : []).catch(() => []),
                    fetch(`https://api.sleeper.app/v1/league/${activeID}/losers_bracket`).then(res => res.ok ? res.json() : []).catch(() => [])
                ]);

                const matchPromises = [];
                for (let w = 1; w <= regularSeasonLength; w++) {
                    matchPromises.push(
                        fetch(`https://api.sleeper.app/v1/league/${activeID}/matchups/${w}`)
                            .then(res => res.ok ? res.json() : [])
                            .catch(() => [])
                    );
                }
                const weeksMatchups = await Promise.all(matchPromises);

                seasonsData[seasonYear] = {
                    leagueStatus: leagueData.status,
                    winnersBracket: Array.isArray(winnersRes) ? winnersRes : [],
                    losersBracket: Array.isArray(losersRes) ? losersRes : [],
                    rosters: rostersMap,
                    matchups: weeksMatchups
                };

                activeID = leagueData.previous_league_id;
            } catch (err) {
                console.error("Error fetching historical league data chain:", err);
                break;
            }
        }

        seasonCache = seasonsData;
        return seasonsData;
    };

    const formatOrdinal = (n) => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    const getRegularSeasonStandingsRanks = (rostersMap) => {
        const rosterList = Object.values(rostersMap).map(r => {
            const wins = r.settings?.wins ?? 0;
            const losses = r.settings?.losses ?? 0;
            const ties = r.settings?.ties ?? 0;
            const fpts = (r.settings?.fpts ?? 0) + ((r.settings?.fpts_decimal ?? 0) / 100);
            return {
                roster_id: r.roster_id,
                wins,
                losses,
                ties,
                fpts
            };
        });

        rosterList.sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            if (b.ties !== a.ties) return b.ties - a.ties;
            return b.fpts - a.fpts;
        });

        const standingsRanks = {};
        rosterList.forEach((r, index) => {
            standingsRanks[r.roster_id] = index + 1;
        });

        return standingsRanks;
    };

    const calculateRanksFromBrackets = (winnersBracket, losersBracket, rostersMap, numRosters) => {
        const ranks = {};
        const rosterIds = Object.keys(rostersMap);
        const standingsRanks = getRegularSeasonStandingsRanks(rostersMap);
        const str = (id) => String(id);

        const winTeamIds = new Set();
        if (Array.isArray(winnersBracket)) {
            winnersBracket.forEach(m => {
                if (m.t1 && m.t1 !== null) winTeamIds.add(str(m.t1));
                if (m.t2 && m.t2 !== null) winTeamIds.add(str(m.t2));
            });
        }

        const loseTeamIds = new Set();
        if (Array.isArray(losersBracket)) {
            losersBracket.forEach(m => {
                if (m.t1 && m.t1 !== null) loseTeamIds.add(str(m.t1));
                if (m.t2 && m.t2 !== null) loseTeamIds.add(str(m.t2));
            });
        }

        const topTier = Array.from(winTeamIds);
        const bottomTier = Array.from(loseTeamIds).filter(id => !winTeamIds.has(id)); 
        const middleTier = rosterIds.filter(id => !winTeamIds.has(id) && !loseTeamIds.has(id));

        let currentRank = 1;

        if (topTier.length > 0) {
            const tierRanks = [];
            for (let i = 0; i < topTier.length; i++) tierRanks.push(currentRank + i);
            
            const explicitRanks = {};
            winnersBracket.forEach(m => {
                if (m.p && m.w) {
                    const winner = str(m.w);
                    const loser = m.l !== undefined && m.l !== null
                        ? str(m.l)
                        : (str(m.t1) === winner ? str(m.t2) : str(m.t1));
                    if (winner && winner !== 'null') explicitRanks[winner] = m.p;
                    if (loser && loser !== 'null') explicitRanks[loser] = m.p + 1;
                }
            });

            const unrankedTop = [];
            topTier.forEach(id => {
                if (explicitRanks[id] && tierRanks.includes(explicitRanks[id])) {
                    ranks[id] = explicitRanks[id];
                    tierRanks.splice(tierRanks.indexOf(explicitRanks[id]), 1);
                } else {
                    unrankedTop.push(id);
                }
            });

            unrankedTop.sort((a, b) => standingsRanks[a] - standingsRanks[b]);
            unrankedTop.forEach(id => {
                if (tierRanks.length > 0) ranks[id] = tierRanks.shift();
            });

            currentRank += topTier.length;
        }

        if (middleTier.length > 0) {
            const tierRanks = [];
            for (let i = 0; i < middleTier.length; i++) tierRanks.push(currentRank + i);
            
            middleTier.sort((a, b) => standingsRanks[a] - standingsRanks[b]);
            middleTier.forEach(id => {
                if (tierRanks.length > 0) ranks[id] = tierRanks.shift();
            });

            currentRank += middleTier.length;
        }

        if (bottomTier.length > 0 && Array.isArray(losersBracket) && losersBracket.length > 0) {
            const teamResults = {};
            const roundNumbers = [];

            const recordMatch = (teamId, outcome, round) => {
                const id = str(teamId);
                if (!teamResults[id]) {
                    teamResults[id] = [];
                }
                teamResults[id].push({ outcome, round });
            };

            losersBracket.forEach(m => {
                const round = typeof m.r === 'number' ? m.r : Number(m.r) || 1;
                if (!roundNumbers.includes(round)) roundNumbers.push(round);

                const winner = m.w != null ? str(m.w) : null;
                const loser = m.l != null ? str(m.l) : (winner === str(m.t1) ? str(m.t2) : str(m.t1));

                if (winner) recordMatch(winner, 'win', round);
                if (loser) recordMatch(loser, 'loss', round);
            });

            const maxRound = Math.max(...roundNumbers, 1);

            const bottomRanking = bottomTier
                .map(id => {
                    const results = teamResults[id] || [];
                    const lossRounds = results
                        .filter(r => r.outcome === 'loss')
                        .map(r => r.round)
                        .sort((a, b) => a - b);

                    const eliminationRound = lossRounds.length > 0 ? lossRounds[0] : maxRound + 1;
                    const winCount = results.filter(r => r.outcome === 'win').length;

                    return {
                        id,
                        eliminationRound,
                        winCount,
                        standingsRank: standingsRanks[id] || Number.MAX_SAFE_INTEGER
                    };
                })
                .sort((a, b) => {
                    if (a.eliminationRound !== b.eliminationRound) {
                        return a.eliminationRound - b.eliminationRound;
                    }
                    if (a.winCount !== b.winCount) {
                        return b.winCount - a.winCount;
                    }
                    return a.standingsRank - b.standingsRank;
                });

            bottomRanking.forEach(item => {
                ranks[item.id] = currentRank;
                currentRank += 1;
            });
        }

        return ranks;
    };

    const getHistoricalSeasonsData = async (mID, currentRosterID) => {
        if (!leagueTeamManagers?.teamManagersMap) {
            historicalSeasons = [];
            loadingRecords = false;
            return;
        }

        const allSeasons = await fetchAllHistoricalData();
        const seasonsList = [];
        
        for (const year in leagueTeamManagers.teamManagersMap) {
            const yearData = leagueTeamManagers.teamManagersMap[year];
            
            for (const rID in yearData) {
                const team = yearData[rID];
                const matchesManager = mID && team.managers && team.managers.includes(mID);
                const matchesRoster = !mID && currentRosterID && rID == currentRosterID;

                if (matchesManager || matchesRoster) {
                    let wins = 0;
                    let losses = 0;
                    let ties = 0;
                    let totalPointsFor = 0;
                    let totalPointsAgainst = 0;
                    let gamesPlayed = 0;
                    let madePlayoffs = false;
                    let finishRank = '-';
                    let numericRank = null;
                    let numRosters = 10;

                    const seasonBundle = allSeasons[year];
                    if (seasonBundle) {
                        const rosterInfo = seasonBundle.rosters[rID];
                        numRosters = Object.keys(seasonBundle.rosters).length || 10;
                        const isPreSeason = seasonBundle.leagueStatus === 'pre_draft' || (seasonBundle.leagueStatus !== 'complete' && seasonBundle.matchups.every(w => w.length === 0));

                        if (rosterInfo && rosterInfo.settings) {
                            wins = rosterInfo.settings.wins ?? 0;
                            losses = rosterInfo.settings.losses ?? 0;
                            ties = rosterInfo.settings.ties ?? 0;
                        }

                        if (!isPreSeason) {
                            if (Array.isArray(seasonBundle.winnersBracket)) {
                                madePlayoffs = seasonBundle.winnersBracket.some(
                                    node => node && (String(node.t1) === String(rID) || String(node.t2) === String(rID)) && (node.t1_from || node.t2_from || node.w)
                                );
                            }
                            if (!madePlayoffs && rosterInfo?.settings?.playoff_seed && rosterInfo.settings.playoff_seed > 0 && rosterInfo.settings.playoff_seed <= 4) {
                                madePlayoffs = true;
                            }

                            const bracketRanks = calculateRanksFromBrackets(seasonBundle.winnersBracket, seasonBundle.losersBracket, seasonBundle.rosters, numRosters);
                            
                            let calculatedRank = '-';
                            if (bracketRanks[rID]) {
                                calculatedRank = bracketRanks[rID];
                            } else {
                                calculatedRank = numRosters; 
                            }

                            if (calculatedRank !== '-') {
                                numericRank = Number(calculatedRank);
                                finishRank = formatOrdinal(numericRank);
                            }
                        }

                        seasonBundle.matchups.forEach(weekMatchups => {
                            if (!Array.isArray(weekMatchups)) return;
                            
                            const userMatchup = weekMatchups.find(m => String(m.roster_id) === String(rID));
                            if (!userMatchup || !userMatchup.matchup_id) return;

                            const oppMatchup = weekMatchups.find(m => m.matchup_id === userMatchup.matchup_id && String(m.roster_id) !== String(rID));

                            const getPts = (mObj) => {
                                if (!mObj) return 0;
                                if (typeof mObj.points === 'number') return mObj.points;
                                if (Array.isArray(mObj.starters_points)) {
                                    return mObj.starters_points.reduce((sum, val) => sum + (val || 0), 0);
                                }
                                return 0;
                            };

                            const pf = getPts(userMatchup);
                            const pa = getPts(oppMatchup);

                            if (pf > 0 || pa > 0) {
                                totalPointsFor += pf;
                                totalPointsAgainst += pa;
                                gamesPlayed++;
                            }
                        });
                    }

                    const avgPf = gamesPlayed > 0 ? (totalPointsFor / gamesPlayed).toFixed(2) : '0.00';
                    const avgPa = gamesPlayed > 0 ? (totalPointsAgainst / gamesPlayed).toFixed(2) : '0.00';

                    seasonsList.push({
                        year,
                        name: getTeamNameFromTeamManagers(leagueTeamManagers, rID, year) || team.teamName || `Team ${rID}`,
                        avatar: team.teamAvatar || team.team?.avatar || null,
                        wins,
                        losses,
                        ties,
                        madePlayoffs,
                        avgPf,
                        avgPa,
                        finish: finishRank,
                        numericRank,
                        numRosters
                    });
                }
            }
        }
        
        historicalSeasons = seasonsList.sort((a, b) => b.year - a.year);
        loadingRecords = false;
    };

    $: activeManagerId = managerID || viewManager?.managerID;
    $: activeRosterId = viewManager?.roster;
    
    $: if (leagueTeamManagers) {
        getHistoricalSeasonsData(activeManagerId, activeRosterId);
    }
</script>

<div class="mx-auto my-8 w-full max-w-6xl rounded-2xl border border-slate-700/50 bg-slate-900/85 p-4 sm:p-6 shadow-2xl backdrop-blur-md">
    <div class="mb-6 pb-4 border-b border-slate-800 text-center">
        <h3 class="text-xl font-extrabold tracking-wider text-slate-100 sm:text-2xl uppercase">
            Season History
        </h3>
    </div>

    {#if loadingRecords}
        <div class="py-12 text-center text-slate-400 text-xs italic animate-pulse">
            Loading franchise history records...
        </div>
    {:else if historicalSeasons.length === 0}
        <div class="py-10 text-center text-sm italic text-slate-500 bg-slate-800/20 rounded-xl border border-dashed border-slate-800">
            No historical season records found for this manager.
        </div>
    {:else}
        <!-- Desktop Table View -->
        <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-center border-collapse">
                <thead>
                    <tr class="border-b border-slate-800 text-xs font-bold tracking-wider text-slate-400 uppercase">
                        <th class="py-3 px-4 text-center">Year</th>
                        <th class="py-3 px-4 text-left">Team Name</th>
                        <th class="py-3 px-4 text-center" colspan="3">Record</th>
                        <th class="py-3 px-4 text-center">Playoffs</th>
                        <th class="py-3 px-4 text-center">PF</th>
                        <th class="py-3 px-4 text-center">PA</th>
                        <th class="py-3 px-4 text-center">Finish</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-sm font-medium text-slate-200">
                    {#each historicalSeasons as season}
                        <tr class="transition-colors hover:bg-slate-800/40">
                            <!-- Year Badge -->
                            <td class="py-4 px-4">
                                <span class="inline-flex items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-950/90 px-3 py-1 text-xs font-bold text-indigo-300 shadow-inner">
                                    {season.year}
                                </span>
                            </td>

                            <!-- Team Name & Avatar -->
                            <td class="py-4 px-4 text-left">
                                <div class="flex items-center gap-3">
                                    {#if season.avatar}
                                        <img class="h-9 w-9 shrink-0 rounded-full border border-slate-700 object-cover shadow" src={season.avatar} alt={season.name} />
                                    {:else}
                                        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-xs font-bold text-slate-400 shadow">
                                            {season.name.charAt(0)}
                                        </div>
                                    {/if}
                                    <span class="font-bold text-slate-100 truncate max-w-[180px] sm:max-w-xs">{season.name}</span>
                                </div>
                            </td>

                            <!-- W - L - T Record breakdown -->
                            <td class="py-4 px-1 text-right font-bold text-emerald-400">{season.wins}</td>
                            <td class="py-4 px-1 text-center text-slate-500">—</td>
                            <td class="py-4 px-2 text-left font-bold text-rose-400">
                                {season.losses}{#if season.ties > 0}-{season.ties}{/if}
                            </td>

                            <!-- Playoffs Indicator Check/Cross -->
                            <td class="py-4 px-4">
                                {#if season.madePlayoffs}
                                    <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                        ✓
                                    </span>
                                {:else}
                                    <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs">
                                        ✕
                                    </span>
                                {/if}
                            </td>

                            <!-- Avg Points For -->
                            <td class="py-4 px-4 font-mono text-slate-300">{season.avgPf}</td>

                            <!-- Points Against -->
                            <td class="py-4 px-4 font-mono text-slate-400">{season.avgPa}</td>

                            <!-- Finish Rank Badge -->
                            <td class="py-4 px-4">
                                {#if season.numericRank === 1}
                                    <span class="inline-flex px-3 py-1 items-center justify-center rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 border border-yellow-200 text-xs font-extrabold text-slate-950 shadow-md">
                                        {season.finish}
                                    </span>
                                {:else if season.numericRank === 2}
                                    <span class="inline-flex px-3 py-1 items-center justify-center rounded-full bg-gradient-to-r from-slate-300 via-slate-100 to-slate-300 border border-slate-300 text-xs font-extrabold text-slate-900 shadow-md">
                                        {season.finish}
                                    </span>
                                {:else if season.numericRank === 3}
                                    <span class="inline-flex px-3 py-1 items-center justify-center rounded-full bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 border border-amber-500 text-xs font-extrabold text-amber-100 shadow-md">
                                        {season.finish}
                                    </span>
                                {:else if season.numericRank === season.numRosters}
                                    <span class="inline-flex px-3 py-1 items-center justify-center gap-1.5 rounded-full bg-amber-950/60 border border-amber-700/60 text-xs font-extrabold text-amber-300 shadow-inner">
                                        <span>{season.finish}</span>
                                        <span>🚽</span>
                                    </span>
                                {:else}
                                    <span class="inline-flex px-3 py-1 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 shadow-inner">
                                        {season.finish}
                                    </span>
                                {/if}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>

        <!-- Mobile Card View -->
        <div class="block md:hidden space-y-4">
            {#each historicalSeasons as season}
                <div class="rounded-xl border border-slate-800 bg-slate-800/40 p-4 space-y-3 shadow-md">
                    <!-- Top Bar: Year & Finish -->
                    <div class="flex items-center justify-between">
                        <span class="inline-flex items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-950/90 px-3 py-1 text-xs font-bold text-indigo-300 shadow-inner">
                            {season.year}
                        </span>

                        <div class="flex items-center gap-2">
                            <span class="text-xs text-slate-400 font-medium">Finish:</span>
                            {#if season.numericRank === 1}
                                <span class="inline-flex px-3 py-1 items-center justify-center rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 border border-yellow-200 text-xs font-extrabold text-slate-950 shadow-md">
                                    {season.finish}
                                </span>
                            {:else if season.numericRank === 2}
                                <span class="inline-flex px-3 py-1 items-center justify-center rounded-full bg-gradient-to-r from-slate-300 via-slate-100 to-slate-300 border border-slate-300 text-xs font-extrabold text-slate-900 shadow-md">
                                    {season.finish}
                                </span>
                            {:else if season.numericRank === 3}
                                <span class="inline-flex px-3 py-1 items-center justify-center rounded-full bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 border border-amber-500 text-xs font-extrabold text-amber-100 shadow-md">
                                    {season.finish}
                                </span>
                            {:else if season.numericRank === season.numRosters}
                                <span class="inline-flex px-3 py-1 items-center justify-center gap-1.5 rounded-full bg-amber-950/60 border border-amber-700/60 text-xs font-extrabold text-amber-300 shadow-inner">
                                    <span>{season.finish}</span>
                                    <span>🚽</span>
                                </span>
                            {:else}
                                <span class="inline-flex px-3 py-1 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 shadow-inner">
                                    {season.finish}
                                </span>
                            {/if}
                        </div>
                    </div>

                    <!-- Team Name & Avatar -->
                    <div class="flex items-center gap-3 pt-1 border-t border-slate-800/80">
                        {#if season.avatar}
                            <img class="h-9 w-9 shrink-0 rounded-full border border-slate-700 object-cover shadow" src={season.avatar} alt={season.name} />
                        {:else}
                            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-xs font-bold text-slate-400 shadow">
                                {season.name.charAt(0)}
                            </div>
                        {/if}
                        <span class="font-bold text-slate-100 truncate text-sm">{season.name}</span>
                    </div>

                    <!-- Stats Grid (4 columns now including Points Against) -->
                    <div class="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-center text-xs">
                        <div class="bg-slate-900/50 p-2 rounded-lg border border-slate-800/60">
                            <div class="text-slate-400 mb-1">Record</div>
                            <div class="font-bold">
                                <span class="text-emerald-400">{season.wins}</span>-<span class="text-rose-400">{season.losses}</span>{#if season.ties > 0}<span class="text-amber-400">-{season.ties}</span>{/if}
                            </div>
                        </div>

                        <div class="bg-slate-900/50 p-2 rounded-lg border border-slate-800/60">
                            <div class="text-slate-400 mb-1">Playoffs</div>
                            <div class="flex justify-center">
                                {#if season.madePlayoffs}
                                    <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
                                        ✓
                                    </span>
                                {:else}
                                    <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px]">
                                        ✕
                                    </span>
                                {/if}
                            </div>
                        </div>

                        <div class="bg-slate-900/50 p-2 rounded-lg border border-slate-800/60">
                            <div class="text-slate-400 mb-1">PF</div>
                            <div class="font-mono text-slate-200 font-semibold">{season.avgPf}</div>
                        </div>

                        <div class="bg-slate-900/50 p-2 rounded-lg border border-slate-800/60">
                            <div class="text-slate-400 mb-1">PA</div>
                            <div class="font-mono text-slate-300 font-semibold">{season.avgPa}</div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>