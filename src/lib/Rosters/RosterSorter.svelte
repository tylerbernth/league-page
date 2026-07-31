<script>
	import Roster from './Roster.svelte';
	
	export let rosters, leagueTeamManagers, startersAndReserve, leagueData, players;

	const rosterPositions = leagueData.roster_positions;
	const numDivisions = leagueData.settings.divisions || 1;

	const divisions = [];

	for(let i = 0; i < numDivisions; i++) {
		divisions.push({
			name: leagueData.metadata ? leagueData.metadata[`division_${i + 1}`] : null,
			rosters: [],
		});
	}

	for(const rosterID in rosters) {
		const roster = rosters[rosterID];
		const division = !roster.settings.division || roster.settings.division > numDivisions ? 0 : roster.settings.division - 1;
		divisions[division].rosters.push(roster);
	}

	let expanded = false;
</script>

<div class="w-full space-y-8">
	<!-- Expand All Benches Action Button -->
	<div class="flex justify-center">
		<button
			type="button"
			onclick={() => { expanded = !expanded; }}
			class="rounded-xl border border-slate-800 bg-slate-900/80 px-5 py-2.5 text-xs font-semibold text-slate-200 shadow-md backdrop-blur-md hover:border-indigo-500/50 hover:bg-slate-800 transition-all sm:text-sm"
		>
			{expanded ? "Minimize" : "Expand"} All Benches
		</button>
	</div>

	<!-- Divisions Loop -->
	{#each divisions as division, ix}
		{#if division.name}
			<div class="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center shadow-lg">
				<div class="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none"></div>
				<h2 class="relative z-10 text-2xl font-extrabold uppercase tracking-tight text-white sm:text-3xl">
					{division.name}
				</h2>
			</div>
		{/if}
		
		<!-- Roster Grid Container -->
		<div class="flex flex-wrap justify-center gap-6">
			{#each division.rosters as roster}
				<Roster division={ix + 1} {expanded} {rosterPositions} {roster} {leagueTeamManagers} {players} {startersAndReserve} />
			{/each}
		</div>
	{/each}
</div>