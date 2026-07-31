<script>
	import Button, { Group, Label } from '@smui/button';
	import BracketsColumn from "./BracketsColumn.svelte";
	import Matchup from "./Matchup.svelte";

	export let leagueTeamManagers, players, brackets, selection, year;

	$: playoffsStart = brackets?.playoffsStart ?? 15;
	$: numRosters = brackets?.numRosters ?? 0;

	let bracket = [];
	let consolations = [];
	let allMatches = [];
	let selected = null;

	let el, top;

	// Normalize any Sleeper data shape into round columns: [ [round1Matches], [round2Matches] ]
	const structureBracket = (inputData) => {
		if (!inputData) return [];

		// Extract raw list from potential wrapper objects
		let list = inputData;
		if (!Array.isArray(list)) {
			list = inputData.bracket || inputData.champs || inputData.winners || [];
		}
		if (!Array.isArray(list) || !list.length) return [];

		// If it's already a 2D array, return it directly
		if (Array.isArray(list[0])) return list;

		// Group flat list by round 'r'
		const rounds = {};
		for (const match of list) {
			if (!match) continue;
			const r = match.r || 1;
			if (!rounds[r]) rounds[r] = [];
			rounds[r].push(match);
		}

		return Object.keys(rounds).sort((a, b) => Number(a) - Number(b)).map(r => rounds[r]);
	};

	$: {
		const champsData = brackets?.champs ?? brackets?.winners ?? brackets ?? {};
		const losersData = brackets?.losers ?? {};

		if (selection === 'losers') {
			bracket = structureBracket(losersData);
			consolations = losersData?.consolations || [];
		} else {
			bracket = structureBracket(champsData);
			consolations = champsData?.consolations || [];
		}

		// Flatten for match detail view selection
		let matches = [];
		if (Array.isArray(bracket)) {
			for (const col of bracket) {
				if (Array.isArray(col)) matches = [...matches, ...col];
			}
		}
		allMatches = matches;

		// Set default selected match if none selected
		if (!selected && allMatches.length > 0) {
			const first = allMatches[0];
			selected = Array.isArray(first) ? first[0]?.m : first?.m;
		}
	}

	let matchup, displayWeek;

	const changeDisplay = (s) => {
		if (!s || !allMatches.length) return;
		top = el?.getBoundingClientRect()?.top || 0;
		let foundMatch = allMatches.find(match => {
			if (!match) return false;
			if (Array.isArray(match)) return match[0]?.m == s;
			return match?.m == s;
		});

		if (foundMatch) {
			if (!Array.isArray(foundMatch)) {
				foundMatch = [foundMatch];
			}
			matchup = foundMatch;
			displayWeek = playoffsStart + (matchup[0]?.r || 1) - 1;
		}
	};

	let matchupWeek = 1;

	const changeMatchupGame = (w) => {
		matchupWeek = w;
	};

	$: changeDisplay(selected);
</script>

<div class="w-full max-w-7xl mx-auto my-6 px-2 select-none font-sans">
	{#if bracket && bracket.length > 0}
		<div class="my-8 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-700">
			<div class="flex justify-center min-w-max items-center overflow-visible gap-4 sm:gap-8">
				{#each bracket as matchCol, ix}
					<BracketsColumn bind:selected={selected} {leagueTeamManagers} {matchCol} {ix} {players} {playoffsStart} playoffLength={bracket.length} losers={selection == 'losers'} />
				{/each}
			</div>

			{#each consolations as consolation, consolationNum}
				<div class="flex justify-center min-w-max items-center mt-8 overflow-visible gap-4 sm:gap-8">
					{#each structureBracket(consolation) as matchCol, ix}
						<BracketsColumn bind:selected={selected} {leagueTeamManagers} {consolationNum} {matchCol} {ix} {players} {playoffsStart} playoffLength={consolation.length} {numRosters} consolation={true} losers={selection == 'losers'} />
					{/each}
				</div>
			{/each}
		</div>
	{:else}
		<div class="text-center py-16 text-slate-400 font-medium bg-slate-900/40 rounded-2xl border border-slate-800/60 max-w-xl mx-auto my-8">
			<p class="text-lg text-slate-300 font-semibold mb-1">Playoff Bracket Not Ready</p>
			<p class="text-sm text-slate-500">Bracket details will populate once playoff matchups are set by the league.</p>
		</div>
	{/if}

	<div class="mt-8 pt-4 border-t border-slate-800/80" bind:this={el}>
		{#if matchup && matchup[0]}
			{#if matchup[0]?.starters?.[2]}
				<div class="flex justify-center my-6">
					<Group variant="outlined" class="bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
						<Button class="selectionButtons" on:click={() => changeMatchupGame(1)} variant={matchupWeek == 1 ? "raised" : "outlined"}>
							<Label>First Week</Label>
						</Button>
						<Button class="selectionButtons" on:click={() => changeMatchupGame(2)} variant={matchupWeek == 2 ? "raised" : "outlined"}>
							<Label>Second Week</Label>
						</Button>
					</Group>
				</div>
			{/if}
			<Matchup ix={selected} active={selected} {matchup} {matchupWeek} {players} {displayWeek} expandOverride={true} {leagueTeamManagers} {year} />
		{/if}
	</div>
</div>