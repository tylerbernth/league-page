<script>
    import { getTeamNameFromTeamManagers } from "$lib/utils/helperFunctions/universalFunctions";
    import { leagueID } from "$lib/utils/leagueInfo";

    export let leagueTeamManagers, managerID = null, viewManager = null;

    let historicalTeams = [];
    let loadingRecords = true;
    let rosterCache = null;

    const fetchAllHistoricalRosters = async () => {
        if (rosterCache) return rosterCache;
        
        let rostersByYear = {};
        let activeID = leagueID;

        while (activeID) {
            try {
                const leagueRes = await fetch(`https://api.sleeper.app/v1/league/${activeID}`);
                const leagueData = await leagueRes.json();
                
                if (!leagueData || !leagueData.season) break;

                const rostersRes = await fetch(`https://api.sleeper.app/v1/league/${activeID}/rosters`);
                const rostersData = await rostersRes.json();

                const rostersMap = {};
                if (Array.isArray(rostersData)) {
                    for (const r of rostersData) {
                        rostersMap[r.roster_id] = r;
                    }
                }

                rostersByYear[leagueData.season] = rostersMap;
                activeID = leagueData.previous_league_id;
            } catch (err) {
                console.error("Error fetching historical league chain:", err);
                break;
            }
        }

        rosterCache = rostersByYear;
        return rostersByYear;
    };

    const getHistoricalTeams = async (mID, currentRosterID) => {
        if (!leagueTeamManagers?.teamManagersMap) {
            historicalTeams = [];
            loadingRecords = false;
            return;
        }

        const allRostersByYear = await fetchAllHistoricalRosters();
        const teams = [];
        
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
                    let hasRecord = false;

                    const yearRosters = allRostersByYear[year];
                    if (yearRosters && yearRosters[rID] && yearRosters[rID].settings) {
                        const settings = yearRosters[rID].settings;
                        wins = settings.wins ?? 0;
                        losses = settings.losses ?? 0;
                        ties = settings.ties ?? 0;
                        hasRecord = true;
                    }

                    teams.push({
                        year,
                        rosterID: rID,
                        name: getTeamNameFromTeamManagers(leagueTeamManagers, rID, year) || team.teamName || `Team ${rID}`,
                        avatar: team.teamAvatar || team.team?.avatar || null,
                        wins,
                        losses,
                        ties,
                        record: hasRecord ? `${wins}-${losses}${ties > 0 ? `-${ties}` : ''}` : null
                    });
                }
            }
        }
        
        historicalTeams = teams.sort((a, b) => b.year - a.year);
        loadingRecords = false;
    };

    $: activeManagerId = managerID || viewManager?.managerID;
    $: activeRosterId = viewManager?.roster;
    
    $: if (leagueTeamManagers) {
        getHistoricalTeams(activeManagerId, activeRosterId);
    }
</script>

<div class="mx-auto my-8 w-full max-w-6xl rounded-2xl border border-slate-700/50 bg-slate-900/85 p-6 shadow-2xl backdrop-blur-md">
    <div class="mb-6 pb-4 border-b border-slate-800 text-center">
        <h3 class="text-xl font-bold tracking-wide text-slate-100 sm:text-2xl">
            Franchise History
        </h3>
    </div>

    <div class="grid grid-cols-1 gap-4">
        {#each historicalTeams as team}
            <div class="group flex w-full items-center justify-between gap-4 rounded-xl border border-slate-800 bg-gradient-to-r from-slate-800/60 to-slate-900/80 p-4 text-left shadow-md transition-all duration-300 hover:border-indigo-500/40 hover:shadow-indigo-500/10 hover:from-slate-800/80">
                <div class="flex items-center gap-4 overflow-hidden">
                    <!-- Year Badge -->
                    <div class="flex h-12 w-16 shrink-0 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-950/90 text-sm font-extrabold text-indigo-300 shadow-inner">
                        {team.year}
                    </div>

                    <!-- Avatar -->
                    {#if team.avatar}
                        <img class="h-12 w-12 shrink-0 rounded-full border-2 border-slate-700 object-cover shadow-md group-hover:border-indigo-500/50 transition-colors" src={team.avatar} alt={team.name} />
                    {:else}
                        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-slate-700 bg-slate-800 text-sm font-bold text-slate-400 shadow-md">
                            #{team.rosterID}
                        </div>
                    {/if}

                    <!-- Team Name -->
                    <div class="overflow-hidden">
                        <div class="text-base font-bold tracking-tight text-slate-100 truncate group-hover:text-indigo-200 transition-colors">
                            {team.name}
                        </div>
                    </div>
                </div>

                <!-- Record Badge / Status -->
                <div class="shrink-0">
                    {#if team.record}
                        <div class="flex items-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-950/40 px-4 py-2 shadow-inner">
                            <span class="text-xs font-bold text-indigo-400 uppercase tracking-wider">Record</span>
                            <span class="text-sm font-extrabold text-slate-100">{team.record}</span>
                        </div>
                    {:else if loadingRecords}
                        <div class="flex items-center gap-2 px-3 py-1 text-xs italic text-slate-400 animate-pulse">
                            <span class="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
                            Loading...
                        </div>
                    {:else}
                        <div class="rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-2 text-xs font-medium text-slate-400">
                            No Record
                        </div>
                    {/if}
                </div>
            </div>
        {:else}
            <div class="col-span-full py-10 text-center text-sm italic text-slate-500 bg-slate-800/20 rounded-xl border border-dashed border-slate-800">
                No historical teams found for this manager.
            </div>
        {/each}
    </div>
</div>