<script>
    import Button, { Group, Label } from '@smui/button';
    import { getLeagueRecords, getLeagueTransactions } from '$lib/utils/helper';
    import AllTimeRecords from './AllTimeRecords.svelte';
    import PerSeasonRecords from './PerSeasonRecords.svelte';

    let {leagueData, totals, stale, leagueTeamManagers} = $props();

    const refreshTransactions = async () => {
        const newTransactions = await getLeagueTransactions(false, true);
        totals = newTransactions.totals;
    }

    let leagueManagerRecords = $state();
    let leagueRosterRecords = $state();
    let leagueWeekHighs = $state();
    let leagueWeekLows = $state();
    let allTimeClosestMatchups = $state();
    let allTimeBiggestBlowouts = $state();
    let mostSeasonLongPoints = $state();
    let leastSeasonLongPoints = $state();
    let seasonWeekRecords = $state();
    let currentYear = $state();
    let lastYear = $state();

    const refreshRecords = async () => {
        const newRecords = await getLeagueRecords(true);
        leagueData = newRecords;
    }

    let key = $state("regularSeasonData");

    $effect(() => {
        if(!leagueData || !leagueData[key]) return;

        const selectedLeagueData = leagueData[key];

        leagueManagerRecords = selectedLeagueData.leagueManagerRecords;
        leagueRosterRecords = selectedLeagueData.leagueRosterRecords;
        leagueWeekHighs = selectedLeagueData.leagueWeekHighs;
        leagueWeekLows = selectedLeagueData.leagueWeekLows;
        allTimeClosestMatchups = selectedLeagueData.allTimeClosestMatchups;
        allTimeBiggestBlowouts = selectedLeagueData.allTimeBiggestBlowouts;
        mostSeasonLongPoints = selectedLeagueData.mostSeasonLongPoints;
        leastSeasonLongPoints = selectedLeagueData.leastSeasonLongPoints;
        seasonWeekRecords = selectedLeagueData.seasonWeekRecords;
        currentYear = selectedLeagueData.currentYear;
        lastYear = selectedLeagueData.lastYear;
    });

    if(stale) {
        refreshTransactions();
    }

    if(leagueData.stale) {
        refreshRecords();
    }

    let display = $state("allTime");
</script>

<style>
    /* Force SMUI raised buttons to use custom indigo styling */
    :global(.mdc-button.mdc-button--raised) {
        background-color: #4f46e5 !important; /* bg-indigo-600 */
        color: #ffffff !important;
    }

    /* Keep outlined state matching your dark theme slate borders */
    :global(.mdc-button.mdc-button--outlined) {
        border-color: #334155 !important; /* border-slate-700 */
        color: #94a3b8 !important; /* text-slate-400 */
    }

    :global(.mdc-button.mdc-button--outlined:hover) {
        background-color: rgba(30, 41, 59, 0.5) !important;
        color: #f1f5f9 !important;
    }

    @media (max-width: 540px) {
        :global(.buttonHolder .selectionButtons) {
            font-size: 0.6em;
        }
    }
    @media (max-width: 415px) {
        :global(.buttonHolder .selectionButtons) {
            font-size: 0.5em;
            padding: 0 6px;
        }
    }
    @media (max-width: 315px) {
        :global(.buttonHolder .selectionButtons) {
            font-size: 0.45em;
            padding: 0 3px;
        }
    }
</style>

<div class="mx-auto w-full max-w-6xl px-4 py-8">
    <div class="buttonHolder mb-8 text-center space-y-4">
        <Group variant="outlined">
            <Button class="selectionButtons" onclick={() => key = "regularSeasonData"} variant={key == "regularSeasonData" ? "raised" : "outlined"}>
                <Label>Regular Season</Label>
            </Button>
            <Button class="selectionButtons" onclick={() => key = "playoffData"} variant={key == "playoffData" ? "raised" : "outlined"}>
                <Label>Playoffs</Label>
            </Button>
        </Group>
        <div class="block"></div>
        <Group variant="outlined">
            <Button class="selectionButtons" onclick={() => display = "allTime"} variant={display == "allTime" ? "raised" : "outlined"}>
                <Label>All-Time Records</Label>
            </Button>
            <Button class="selectionButtons" onclick={() => display = "season"} variant={display == "season" ? "raised" : "outlined"}>
                <Label>Season Records</Label>
            </Button>
        </Group>
    </div>

    {#if display == "allTime"}
        {#if leagueWeekHighs?.length}
            <AllTimeRecords transactionTotals={totals} {allTimeClosestMatchups} {allTimeBiggestBlowouts} {leagueManagerRecords} {leagueWeekHighs} {leagueWeekLows} {leagueTeamManagers} {mostSeasonLongPoints} {leastSeasonLongPoints} {key} />
        {:else}
            <div class="my-20 text-center text-slate-500 italic">
                <p>No records <i>yet</i>...</p>
            </div>
        {/if}
    {:else}
        <PerSeasonRecords transactionTotals={totals} {leagueRosterRecords} {seasonWeekRecords} {leagueTeamManagers} {currentYear} {lastYear} {key} />
    {/if}
</div>