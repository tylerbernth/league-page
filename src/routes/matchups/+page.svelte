<!-- src/routes/matchups/+page.svelte -->
<script>
	import { MatchupsAndBrackets } from '$lib/components';

	export let data;
	const { queryWeek, matchupsData, bracketsData, playersData, leagueTeamManagersData } = data;
</script>

<div class="w-full max-w-7xl mx-auto py-4 space-y-6">
	<!-- Page Header Banner -->
	<div class="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
		<div class="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
		
		<div class="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div>
				<div class="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20 mb-2">
					<span>⚔️ Weekly Head-to-Head & Playoff Brackets</span>
				</div>
				<h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white uppercase">
					League Matchups
				</h1>
			</div>
		</div>
	</div>

	<!-- Matchups & Brackets Container -->
	<div class="rounded-3xl bg-slate-900 border border-slate-800 p-4 sm:p-6 shadow-xl">
		<MatchupsAndBrackets 
			{queryWeek} 
			{matchupsData} 
			{bracketsData} 
			{playersData} 
			{leagueTeamManagersData} 
		/>
	</div>
</div>