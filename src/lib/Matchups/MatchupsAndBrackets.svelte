<script>
	import LinearProgress from '@smui/linear-progress';
	import MatchupWeeks from './MatchupWeeks.svelte';
	import Brackets from './Brackets.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { loadPlayers } from '$lib/utils/helper';

	export let queryWeek, leagueTeamManagersData, matchupsData, bracketsData, playersData;

	let players, matchupWeeks, year, week, regularSeasonLength, brackets, leagueTeamManagers;

	let loading = true;
	let selection = 'regular';

	onMount(async () => {
		brackets = await bracketsData;
		const matchupsInfo = await matchupsData;
		leagueTeamManagers = await leagueTeamManagersData;
		matchupWeeks = matchupsInfo.matchupWeeks;
		year = matchupsInfo.year;
		week = matchupsInfo.week;
		regularSeasonLength = matchupsInfo.regularSeasonLength;
		const playersInfo = await playersData;
		players = playersInfo.players;
		loading = false;

		// Auto-switch to playoffs tab if queryWeek is beyond regular season
		if (queryWeek > regularSeasonLength) {
			selection = 'champions';
		}

		if (playersInfo.stale) {
			const newPlayersInfo = await loadPlayers(null, true);
			players = newPlayersInfo.players;
		}
	});

	const changeSelection = (s) => {
		if (s === 'regular') {
			queryWeek = 1;
			goto(`/matchups?week=1`, { noscroll: true });
		} else if (selection === 'regular') {
			queryWeek = 99;
			goto(`/matchups?week=99`, { noscroll: true });
		}
		selection = s;
	};
</script>

<style>
	.message {
		display: block;
		width: 85%;
		max-width: 500px;
		margin: 80px auto;
		text-align: center;
		font-size: 1.1em;
		color: #555;
	}
</style>

{#if loading}
	<div class="message">
		<p>Loading league matchups...</p>
		<LinearProgress indeterminate />
	</div>
{:else}
	{#if matchupWeeks && matchupWeeks.length}
		<!-- Main Navigation Controls Container -->
		<div class="mb-6 flex flex-col items-center gap-4">
			<!-- Primary Toggle: Regular Season vs Playoffs -->
			<div class="inline-flex rounded-xl border border-slate-800 bg-slate-950/80 p-1.5 shadow-inner">
				<button
					type="button"
					disabled={selection === 'regular'}
					onclick={() => changeSelection('regular')}
					class="rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:px-6 sm:text-sm {selection === 'regular' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}"
				>
					Regular Season
				</button>
				<button
					type="button"
					disabled={selection === 'champions' || selection === 'losers'}
					onclick={() => changeSelection('champions')}
					class="rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:px-6 sm:text-sm {selection === 'champions' || selection === 'losers' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}"
				>
					Playoffs
				</button>
			</div>

			<!-- Secondary Toggle: Champions' Bracket vs Losers' Bracket (Shown during Playoffs) -->
			{#if selection === 'champions' || selection === 'losers'}
				<div class="inline-flex rounded-xl border border-slate-800 bg-slate-950/80 p-1.5 shadow-inner">
					<button
						type="button"
						disabled={selection === 'champions'}
						onclick={() => changeSelection('champions')}
						class="rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:px-6 sm:text-sm {selection === 'champions' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}"
					>
						Champions' Bracket
					</button>
					<button
						type="button"
						disabled={selection === 'losers'}
						onclick={() => changeSelection('losers')}
						class="rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:px-6 sm:text-sm {selection === 'losers' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}"
					>
						Losers' Bracket
					</button>
				</div>
			{/if}
		</div>

		{#if selection === 'regular'}
			<MatchupWeeks 
				{players} 
				{queryWeek} 
				{matchupWeeks} 
				{regularSeasonLength} 
				{year} 
				{week} 
				bind:selection={selection} 
				{leagueTeamManagers} 
			/>
		{/if}
	{:else}
		<div class="message">
			<p>No upcoming matchups...</p>
		</div>
	{/if}

	{#if brackets && (selection === 'champions' || selection === 'losers')}
		<Brackets 
			{queryWeek} 
			{leagueTeamManagers} 
			{players} 
			{brackets} 
			bind:selection={selection} 
		/>
	{/if}
{/if}