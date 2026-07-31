<script>
    import { getTeamNameFromTeamManagers } from "$lib/utils/helperFunctions/universalFunctions";

    export let leagueTeamManagers, managerID = null, viewManager = null;

    let historicalTeams = [];

    const getHistoricalTeams = (mID, currentRosterID) => {
        if (!leagueTeamManagers?.teamManagersMap) {
            historicalTeams = [];
            return;
        }

        const teams = [];
        
        for (const year in leagueTeamManagers.teamManagersMap) {
            const yearData = leagueTeamManagers.teamManagersMap[year];
            
            for (const rID in yearData) {
                const team = yearData[rID];
                const matchesManager = mID && team.managers && team.managers.includes(mID);
                const matchesRoster = !mID && currentRosterID && rID == currentRosterID;

                if (matchesManager || matchesRoster) {
                    teams.push({
                        year,
                        rosterID: rID,
                        name: getTeamNameFromTeamManagers(leagueTeamManagers, rID, year) || team.teamName || `Team ${rID}`,
                        avatar: team.teamAvatar || team.team?.avatar || null
                    });
                }
            }
        }
        
        historicalTeams = teams.sort((a, b) => b.year - a.year);
    };

    $: activeManagerId = managerID || viewManager?.managerID;
    $: activeRosterId = viewManager?.roster;
    $: getHistoricalTeams(activeManagerId, activeRosterId);
</script>

<div class="mx-auto my-8 w-full max-w-6xl rounded-2xl border border-indigo-500/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md">
    <h3 class="mb-6 text-center text-xl font-light tracking-wide text-slate-200 sm:text-2xl">
        Franchise History
    </h3>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {#each historicalTeams as team}
            <div class="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/40 p-3.5 text-left shadow-sm">
                <div class="flex h-10 w-12 shrink-0 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-950/80 text-xs font-bold text-indigo-300">
                    {team.year}
                </div>

                {#if team.avatar}
                    <img class="h-10 w-10 shrink-0 rounded-full border border-slate-700 object-cover shadow-sm" src={team.avatar} alt={team.name} />
                {:else}
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-xs font-bold text-slate-400">
                        #{team.rosterID}
                    </div>
                {/if}

                <div class="flex-1 overflow-hidden">
                    <div class="text-sm font-semibold leading-snug text-slate-100">
                        {team.name}
                    </div>
                </div>
            </div>
        {:else}
            <div class="col-span-full py-6 text-center text-xs italic text-slate-500">
                No historical teams found for this manager.
            </div>
        {/each}
    </div>
</div>