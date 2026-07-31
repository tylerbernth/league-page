<script>
    import Button, { Group, Label } from '@smui/button';
    import LinearProgress from '@smui/linear-progress';
    import { loadPlayers, getLeagueTransactions, getLeagueRosters } from '$lib/utils/helper';
    import Roster from '../Rosters/Roster.svelte';
    import TransactionsPage from '../Transactions/TransactionsPage.svelte';
    import { goto } from '$app/navigation';
    import ManagerFantasyInfo from './ManagerFantasyInfo.svelte';
    import ManagerAwards from './ManagerAwards.svelte';
    import ManagerHistory from './ManagerHistory.svelte';
    import { onMount } from 'svelte';
    import { getDatesActive, getRosterIDFromManagerID, getTeamNameFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';

    export let manager, managers, rostersData, leagueTeamManagers, rosterPositions, transactionsData, awards, records;

    let transactions = transactionsData.transactions;

    $: viewManager = managers[manager];
    $: datesActive = getDatesActive(leagueTeamManagers, viewManager.managerID);

    const startersAndReserve = rostersData.startersAndReserve;
    let rosters = rostersData.rosters;

    $: ({rosterID, year} = viewManager.managerID ? getRosterIDFromManagerID(leagueTeamManagers, viewManager.managerID) : {rosterID: viewManager.roster, year: null});
    
    let selectedRosterID = null;
    let selectedYear = null;

    $: activeRosterID = selectedRosterID || rosterID;
    $: activeYear = selectedYear || year;

    $: isHistoricalView = activeYear && activeYear !== year;
    $: historicalTeamData = leagueTeamManagers?.teamManagersMap?.[activeYear]?.[activeRosterID];
    $: displayTeamName = historicalTeamData?.team?.name || getTeamNameFromTeamManagers(leagueTeamManagers, activeRosterID, activeYear);

    // State for historical rosters fetched via helper
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

    $: activeRoster = isHistoricalView ? (historicalRosterData || {}) : (rosters[activeRosterID] || Object.values(rosters)[0] || {});

    $: teamTransactions = transactions.filter(t => t.rosters.includes(parseInt(activeRosterID)));
    $: coOwners = activeYear && activeRosterID ? leagueTeamManagers.teamManagersMap[activeYear]?.[activeRosterID]?.managers?.length > 1 : rosters[activeRosterID]?.co_owners;
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
        selectedYear = null;
        historicalRosterData = null;
        goto(`/manager?manager=${newManager}`, {noscroll});
    }
</script>

<div class="my-8 mb-20 w-full">
    <!-- Manager Profile Card -->
    <div class="mx-auto mb-16 w-[97%] max-w-3xl rounded-xl border border-indigo-500/10 bg-gradient-to-br from-indigo-600/[0.03] to-cyan-500/[0.03] p-4 sm:p-6 md:p-8 shadow-sm backdrop-blur-sm">
        <img 
            class="mx-auto mt-6 mb-4 h-auto w-[60%] max-w-[180px] aspect-square rounded-full object-cover shadow-md transition-all duration-300 hover:scale-105 hover:shadow-indigo-500/25 sm:mt-[3em] sm:max-w-[200px]" 
            src="{viewManager.photo}" 
            alt="manager"
        />
        
        <h2 class="mt-4 text-center text-2xl font-bold tracking-tight text-indigo-400 sm:text-3xl md:text-4xl">
            {viewManager.name}
            <div class="mt-1 text-xs font-normal text-slate-400 sm:text-sm">
                {coOwners ? 'Co-' : ''}Manager of <i class="font-medium text-slate-200">{displayTeamName}</i>
                {#if isHistoricalView}
                    <span class="ml-2 rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-300">({activeYear} Archive)</span>
                {/if}
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
        bind:selectedYear 
    />

    {#if loading || fetchingHistoricalRoster}
        <div class="mx-auto my-20 w-[85%] max-w-lg text-center text-slate-400">
            <p class="mb-3 text-sm">Retrieving roster for {activeYear}...</p>
            <LinearProgress indeterminate />
        </div>
    {:else}
        <Roster division="1" expanded={false} {rosterPositions} roster={activeRoster} {leagueTeamManagers} {players} {startersAndReserve} />
    {/if}

    <!-- Team Transactions Section -->
    <h3 class="mt-12 mb-4 text-center text-xl font-light text-slate-300 sm:text-2xl">Team Transactions</h3>
    <div class="mx-auto mb-16 w-[97%] max-w-3xl rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:p-6">
        {#if loading}
            <div class="mx-auto my-12 w-[85%] max-w-lg text-center text-slate-400">
                <p class="mb-3 text-sm">Retrieving players...</p>
                <LinearProgress indeterminate />
            </div>
        {:else}
            <TransactionsPage {playersInfo} transactions={teamTransactions} {leagueTeamManagers} show='both' query='' page={0} perPage={5} />
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
                <Label>Next Manager</Label>
            </Button>
        </Group>
    </div>
</div>