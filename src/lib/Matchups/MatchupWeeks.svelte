<script>
    import { Icon } from '@smui/tab';
    import Matchup from './Matchup.svelte';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    export let queryWeek, players, matchupWeeks, year, week, regularSeasonLength, selection, leagueTeamManagers;

    let displayWeek = (queryWeek * 1) || 1;
    let active = null;
    let matchupArray = [];

    // Sync displayWeek whenever queryWeek prop changes (e.g. via navigation)
    $: if (queryWeek) {
        displayWeek = queryWeek * 1;
    }

    onMount(() => {
        if (!queryWeek || queryWeek < 1) {
            queryWeek = week;
            displayWeek = queryWeek * 1;
            goto(`/matchups?week=${queryWeek}`, { noscroll: true });
            if (queryWeek > regularSeasonLength) {
                selection = 'champions';
            }
        } else if (queryWeek > regularSeasonLength) {
            selection = 'champions';
        }
    });

    // Automatically recalculate matchupArray whenever displayWeek or matchupWeeks changes
    $: if (matchupWeeks && matchupWeeks.length && displayWeek) {
        const matchup = matchupWeeks[displayWeek - 1];
        if (matchup && matchup.matchups) {
            const allMatchups = matchup.matchups;
            const newArray = [];
            for (const key in allMatchups) {
                newArray.push(allMatchups[key]);
            }
            matchupArray = newArray;
        } else {
            matchupArray = [];
        }
    }

    const changeWeek = (newWeek) => {
        displayWeek = newWeek;
        queryWeek = newWeek;
        active = null;
        goto(`/matchups?week=${displayWeek}`, { noscroll: true });
    };
</script>

<style>
    .matchups {
        margin: 2em 0 6em;
    }
    .weekContainer {
        display: flex;
        width: 95%;
        max-width: 600px;
        margin: 0 auto;
        align-items: center;
    }

    :global(.changeWeek) {
        font-size: 3em;
        cursor: pointer;
        color: #888;
        transition: color 0.2s ease-in-out;
        user-select: none;
    }

    :global(.changeWeek:hover) {
        color: #00316b;
    }

    .spacer {
        width: 48px;
    }

    .weekText {
        flex-grow: 1;
        text-align: center;
        font-size: 2em;
        font-weight: 600;
        margin: 0;
    }

    @media (max-width: 800px) {
        .weekText {
            font-size: 1.6em;
        }
    }

    @media (max-width: 400px) {
        .weekText {
            font-size: 1.3em;
        }
    }

    @media (max-width: 350px) {
        .weekText {
            font-size: 1.2em;
        }
    }
</style>

<div class="matchups">
    <div class="weekContainer">
        {#if displayWeek > 1}
            <!-- Svelte 5 uses onclick directly -->
            <Icon class="material-icons changeWeek" onclick={() => changeWeek(displayWeek - 1)}>chevron_left</Icon>
        {:else}
            <!-- Fixed self-closing span tag -->
            <span class="spacer"></span>
        {/if}

        <h3 class="weekText">{year} Week {displayWeek} Matchups</h3>

        {#if displayWeek < (matchupWeeks ? matchupWeeks.length : 0)}
            <Icon class="material-icons changeWeek" onclick={() => changeWeek(displayWeek + 1)}>chevron_right</Icon>
        {:else}
            <!-- Fixed self-closing span tag -->
            <span class="spacer"></span>
        {/if}
    </div>

    {#key displayWeek}
        {#each matchupArray as matchup, ix (ix)}
            <Matchup 
                {ix} 
                {matchup} 
                {players} 
                {displayWeek} 
                bind:active={active} 
                {leagueTeamManagers} 
                {year}
            />
        {/each}
    {/key}
</div>