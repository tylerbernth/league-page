<script>
    import Button, { Group, Label } from '@smui/button';
    import LinearProgress from '@smui/linear-progress';
    import { loadPlayers, getLeagueTransactions, getLeagueRosters } from '$lib/utils/helper';
    import Roster from '../Rosters/Roster.svelte';
    import TransactionsPage from '../Transactions/TransactionsPage.svelte';
    import ManagerKeepers from './ManagerKeepers.svelte';
    import { goto } from '$app/navigation';
    import ManagerFantasyInfo from './ManagerFantasyInfo.svelte';
    import ManagerAwards from './ManagerAwards.svelte';
    import ManagerHistory from './ManagerHistory.svelte';
    import { onMount } from 'svelte';
    import { getDatesActive, getRosterIDFromManagerID, getTeamNameFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';

    export let manager, managers, rostersData, leagueTeamManagers, rosterPositions, transactionsData, awards, records, draftPicks = [];

    let transactions = transactionsData.transactions;

    $: viewManager = managers[manager];$: datesActive = getDatesActive(leagueTeamManagers, viewManager.managerID);

    const startersAndReserve = rostersData.startersAndReserve;
    let rosters = rostersData.rosters;

    $: ({rosterID, year} = viewManager.managerID ? getRosterIDFromManagerID(leagueTeamManagers, viewManager.managerID) : {rosterID: viewManager.roster, year: null});
    
    let selectedRosterID = null;

    $: activeRosterID = selectedRosterID || rosterID;
    $: activeYear = year;

    $: isHistoricalView = false;
    $: historicalTeamData = null;
    $: displayTeamName = getTeamNameFromTeamManagers(leagueTeamManagers, activeRosterID, activeYear);

   // Filter keepers across all historical seasons by checking team ownership per year
    $: teamKeepers = (() => {
        if (!draftPicks || !viewManager?.managerID) return [];

        const rawKeepers = draftPicks.filter(p => {
            if (!p) return false;

            // 1. Must be officially flagged as a keeper
            const isKeeper = Boolean(p.is_keeper || p.metadata?.is_keeper || p.keeper);
            if (!isKeeper) return false;

            const pickSeason = p.season;
            const rosterId = p.roster_id;

            if (!pickSeason || !rosterId) return false;

            // 2. Check if this roster ID belonged to the current viewManager during that specific draft season
            let matchesManager = false;
            const seasonMap = leagueTeamManagers?.teamManagersMap?.[pickSeason];
            
            if (seasonMap && seasonMap[rosterId]) {
                const rosterManagers = seasonMap[rosterId].managers || [];
                matchesManager = rosterManagers.includes(viewManager.managerID);
            }

            return matchesManager;
        });

        // Deduplicate by player_id + season so a multi-year keeper shows up cleanly once per season
        const seen = new Set();
        return rawKeepers.filter(p => {
            const key = `${p.player_id}-${p.season || 'unknown'}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    })();
    
    let historicalRostersCache = {};
    let fetchingHistoricalRoster = false;
    let historicalRosterData = null;

    async function loadHistoricalRoster(targetYear, targetRosterID) {
        if (!targetYear || targetYear === year) {
            historicalRosterData = null;
            return;
        }

        const cacheKey = `${targetYear}-${targetRosterID}`;
        if (historicalRostersCache[cacheKey]) {
            historicalRosterData = historicalRostersCache[cacheKey];
            return;
        }

        fetchingHistoricalRoster = true;
        try {
            const targetLeagueID = leagueTeamManagers?.leagues?.[targetYear];
            const histRostersData = await getLeagueRosters(targetLeagueID);
            const rostersMap = histRostersData?.rosters || histRostersData;

            const matchedRoster = rostersMap[targetRosterID] || Object.values(rostersMap).find(r => r.roster_id == targetRosterID);
            
            if (matchedRoster) {
                historicalRosterData = {
                    ...matchedRoster,
                    custom_given_name: displayTeamName
                };
                historicalRostersCache[cacheKey] = historicalRosterData;
            } else {
                historicalRosterData = null;
            }
        } catch (err) {
            console.error("Failed to load historical roster via helper:", err);
            historicalRosterData = null;
        }
        fetchingHistoricalRoster = false;
    }

    $: if (isHistoricalView) {
        loadHistoricalRoster(activeYear, activeRosterID);
    } else {
        historicalRosterData = null;
    }

    $: activeRoster = rosters[activeRosterID] || Object.values(rosters)[0] || {};

    $: teamTransactions = transactions.filter(t => t.rosters.includes(parseInt(activeRosterID)));
    $: coOwners = activeRosterID ? rosters[activeRosterID]?.co_owners : false;
    $: commissioner = viewManager.managerID ? leagueTeamManagers.users[viewManager.managerID]?.is_owner : false;

    let players, playersInfo;
    let loading = true;

    const refreshTransactions = async () => {
        const newTransactions = await getLeagueTransactions(false, true);
        transactions = newTransactions.transactions;
    }

    onMount(async () => {
        if(transactionsData.stale) {
            refreshTransactions();
        }
        const playerData = await loadPlayers(null);
        playersInfo = playerData;
        players = playerData.players;
        loading = false;

        if(playerData.stale) {
            const newPlayerData = await loadPlayers(null, true);
            playersInfo = newPlayerData;
            players = newPlayerData.players;
        }
    })

    const changeManager = (newManager, noscroll = false) => {
        if(!newManager) {
            goto(`/managers`);
        }
        manager = newManager;
        selectedRosterID = null;
        historicalRosterData = null;
        goto(`/manager?manager=${newManager}`, {noscroll});
    }
</script>

<div class="my-8 mb-20 w-full">
    <!-- Manager Profile Card -->
    <div class="mx-auto mb-16 w-full max-w-6xl rounded-2xl border border-slate-700/50 bg-slate-900/85 p-6 shadow-2xl backdrop-blur-md">
        <img 
            class="mx-auto mt-6 mb-4 h-auto w-[60%] max-w-[180px] aspect-square rounded-full object-cover shadow-md transition-all duration-300 hover:scale-105 hover:shadow-indigo-500/25 sm:mt-[3em] sm:max-w-[200px]" 
            src="{viewManager.photo}" 
            alt="manager"
        />
        
        <h2 class="mt-4 text-center text-2xl font-bold tracking-tight text-indigo-400 sm:text-3xl md:text-4xl">
            {viewManager.name}
            <div class="mt-1 text-xs font-normal text-slate-400 sm:text-sm">
                {coOwners ? 'Co-' : ''}Manager of <i class="font-medium text-slate-200">{displayTeamName}</i>
            </div>
        </h2>
        
        <!-- Basic Info Bar -->
        <div class="my-6 flex flex-col items-center justify-around gap-2 rounded-lg bg-indigo-500/5 p-3 sm:flex-row sm:gap-0 text-xs sm:text-sm text-slate-300">
            <span class="italic">{viewManager.location || 'Undisclosed Location'}</span>
            
            {#if viewManager.managerID && datesActive.start}
                <span class="hidden text-slate-600 sm:inline">|</span>
                {#if datesActive.end}
                    <span class="italic">In the league from '{datesActive.start.toString().substr(2)} to '{datesActive.end.toString().substr(2)}</span>
                {:else}
                    <span class="italic">In the league since '{datesActive.start.toString().substr(2)}</span>
                {/if}
            {:else if viewManager.fantasyStart}
                <span class="hidden text-slate-600 sm:inline">|</span>
                <span class="italic">Playing ff since '{viewManager.fantasyStart.toString().substr(2)}</span>
            {/if}

            {#if viewManager.preferredContact}
                <span class="hidden text-slate-600 sm:inline">|</span>
                <span class="inline-flex items-center gap-1.5 italic">
                    {viewManager.preferredContact}
                    <img class="h-5 w-auto" src="/{viewManager.preferredContact}.png" alt="preferred contact"/>
                </span>
            {/if}

            {#if viewManager.favoriteTeam}
                <span class="hidden text-slate-600 sm:inline">|</span>
                <img class="h-8 w-auto object-contain sm:h-10" src="https://sleepercdn.com/images/team_logos/nfl/{viewManager.favoriteTeam}.png" alt="favorite team"/>
            {/if}

            {#if commissioner}
                <span class="hidden text-slate-600 sm:inline">|</span>
                <div class="flex h-6 w-6 items-center justify-center rounded-full border border-indigo-500 bg-indigo-600 font-semibold text-white text-xs shadow-sm">
                    <span>C</span>
                </div>
            {/if}
        </div>

        <!-- Top Manager Navigation -->
        <div class="my-6 text-center">
            <Group variant="outlined">
                <Button disabled={manager == 0} class="selectionButtons" onclick={() => changeManager(parseInt(manager) - 1, true)} variant="outlined">
                    <Label>Previous Manager</Label>
                </Button>
                <Button class="selectionButtons" onclick={() => goto('/managers')} variant="outlined">
                    <Label>All Managers</Label>
                </Button>
                <Button disabled={manager == managers.length - 1} class="selectionButtons" onclick={() => changeManager(parseInt(manager) + 1, true)} variant="outlined">
                    <Label>Next Manager</Label>
                </Button>
            </Group>
        </div>

        <!-- Bio & Philosophy -->
        <p class="my-6 px-2 text-justify text-sm leading-relaxed text-slate-300 sm:px-6 sm:text-base [text-indent:2em] sm:[text-indent:4em]">
            {@html viewManager.bio}
        </p>

        {#if viewManager.philosophy}
            <h3 class="mt-8 mb-2 text-center text-lg font-light text-slate-300 sm:text-xl md:text-2xl">Team Philosophy</h3>
            <p class="my-4 px-2 text-justify text-sm leading-relaxed text-slate-300 sm:px-6 sm:text-base [text-indent:2em] sm:[text-indent:4em]">
                {@html viewManager.philosophy}
            </p>
        {/if}
    </div>

    {#if !loading}
        <ManagerFantasyInfo {viewManager} {players} {changeManager} />
    {/if}

    <!-- Manager Awards & Record Book -->
    <ManagerAwards {leagueTeamManagers} tookOver={viewManager.tookOver} {awards} {records} rosterID={activeRosterID} managerID={viewManager.managerID} />

    <!-- Franchise History Timeline -->
    <ManagerHistory 
        {leagueTeamManagers} 
        managerID={viewManager.managerID} 
        {viewManager} 
        bind:selectedRosterID 
    />

    <!-- Loading / Content Blocks -->
    {#if loading || fetchingHistoricalRoster}
        <div class="mx-auto my-20 w-[85%] max-w-lg text-center text-slate-400">
            <p class="mb-3 text-sm">Retrieving roster...</p>
            <LinearProgress indeterminate />
        </div>
    {:else}
        <!-- Keepers Section (Standalone Card) -->
        <div class="mx-auto mb-16 w-full max-w-6xl">
            <ManagerKeepers {teamKeepers} {players} />
        </div>

        <!-- Team Roster Section (Force Centered Roster Component) -->
        <div class="mx-auto mb-16 w-full max-w-6xl rounded-2xl border border-slate-700/50 bg-slate-900/85 p-6 shadow-2xl backdrop-blur-md">
            <div class="mb-6 pb-4 border-b border-slate-800 text-center">
                <h3 class="text-xl font-bold tracking-wide text-slate-100 sm:text-2xl">
                    Roster
                </h3>
            </div>
            
            <div class="flex justify-center w-full">
                <div class="w-full flex justify-center [&_.rosterContainer]:mx-auto [&_.rosterContainer]:w-full [&_.rosterContainer]:max-w-4xl [&_table]:mx-auto">
                    <Roster division="1" expanded={false} {rosterPositions} roster={activeRoster} {leagueTeamManagers} {players} {startersAndReserve} />
                </div>
            </div>
        </div>
    {/if}

    <!-- Team Transactions Section -->
    <div class="mx-auto mb-16 w-full max-w-6xl rounded-2xl border border-slate-700/50 bg-slate-900/85 p-6 shadow-2xl backdrop-blur-md">
        <div class="mb-6 pb-4 border-b border-slate-800 text-center">
            <h3 class="text-xl font-bold tracking-wide text-slate-100 sm:text-2xl">
                Team Transactions
            </h3>
        </div>
        {#if loading}
            <div class="mx-auto my-12 w-[85%] max-w-lg text-center text-slate-400">
                <p class="mb-3 text-sm">Retrieving players...</p>
                <LinearProgress indeterminate />
            </div>
        {:else}
            <TransactionsPage {playersInfo} transactions={teamTransactions} {leagueTeamManagers} show='both' query='' page={0} perPage={5} pageName="" />
        {/if}
    </div>

    <!-- Bottom Manager Navigation -->
    <div class="my-8 text-center">
        <Group variant="outlined">
            <Button disabled={manager == 0} class="selectionButtons" onclick={() => changeManager(parseInt(manager) - 1)} variant="outlined">
                <Label>Previous Manager</Label>
            </Button>
            <Button class="selectionButtons" onclick={() => goto('/managers')} variant="outlined">
                <Label>All Managers</Label>
            </Button>
            <Button disabled={manager == managers.length - 1} class="selectionButtons" onclick={() => changeManager(parseInt(manager) + 1)} variant="outlined">
                <Label>Label>Next Manager</Label>
            </Button>
        </Group>
    </div>
</div>