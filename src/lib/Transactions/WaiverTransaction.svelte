<script>
	import { gotoManager } from '$lib/utils/helper';
	import { getTeamFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';

	export let transaction, players, leagueTeamManagers;

	// Dynamically resolve roster ID to handle Sleeper waiver move objects correctly
	$: owner = (() => {
		// 1. Check if the specific move object holds the true roster_id
		const moveRosterID = transaction?.moves?.[0]?.[0]?.roster_id;
		if (moveRosterID) return moveRosterID;

		// 2. Direct rosterID property check
		if (transaction?.rosterID) return transaction.rosterID;
		
		// 3. Fallback to standard rosters array
		if (Array.isArray(transaction?.rosters) && transaction.rosters.length > 0) {
			return transaction.rosters[0];
		}

		return 1;
	})();

	const getAvatar = (pos, player) => {
	if (pos === 'DEF') {
		return `background-image: url(https://sleepercdn.com/images/team_logos/nfl/${player.toLowerCase()}.png); background-size: contain; background-repeat: no-repeat; background-position: center;`;
	}
	// Note: We use only the primary thumbnail here and handle background color via HTML/Tailwind
	return `background-image: url(https://sleepercdn.com/content/nfl/players/thumb/${player}.jpg); background-size: cover; background-repeat: no-repeat; background-position: center;`;
};

	const handleNavigate = () => {
		gotoManager({
			year: transaction.season,
			leagueTeamManagers,
			rosterID: owner
		});
	};
</script>

<!-- Card Wrapper -->
<div 
	class="mb-6 cursor-pointer overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-slate-700 hover:shadow-indigo-500/10"
	onclick={handleNavigate}
>
	<!-- Card Header -->
	<div class="relative flex w-full flex-wrap items-center justify-between border-b border-slate-800 bg-slate-800/50 px-4 py-3 pl-14 transition-colors">
		<img
			class="absolute left-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full border-2 border-indigo-500 bg-slate-950 object-cover shadow-sm"
			src={getTeamFromTeamManagers(leagueTeamManagers, owner, transaction.season).avatar}
			alt="{getTeamFromTeamManagers(leagueTeamManagers, owner, transaction.season).name} avatar"
		/>
		
		<div class="flex flex-wrap items-center gap-2">
			<span class="text-sm font-semibold text-slate-100">
				{getTeamFromTeamManagers(leagueTeamManagers, owner, transaction.season).name}
				{#if getTeamFromTeamManagers(leagueTeamManagers, owner, transaction.season).name !== getTeamFromTeamManagers(leagueTeamManagers, owner).name}
					<span class="text-xs font-normal italic text-slate-400">
						({getTeamFromTeamManagers(leagueTeamManagers, owner).name})
					</span>
				{/if}
			</span>

			{#if transaction.moves && transaction.moves[0] && transaction.moves[0][0] && transaction.moves[0][0].bid}
				<span class="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
					- {transaction.moves[0][0].bid}$
				</span>
			{/if}
		</div>
	</div>

	<!-- Card Body (Player Moves) -->
	<div class="flex flex-col bg-slate-900/40">
		<div class="flex flex-col justify-center py-4">
			<div class="flex flex-col items-start gap-4 px-5 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
				{#each transaction.moves as move}
					<div class="flex items-center gap-3">
						<!-- Player Avatar Slot -->
						<div
							class="relative h-12 w-12 rounded-full border-2 bg-slate-800 bg-cover bg-center shadow-inner"
							style="border-color: var(--{players[move[0].player].pos}); background-color: var(--{move[0].type === 'Added' ? 'waiverAdd' : 'waiverDrop'}); {getAvatar(players[move[0].player].pos, move[0].player)}"
						>
							{#if move[0].type === "Added"}
								<i class="material-icons absolute -bottom-1 -right-1 rounded-full bg-slate-900 text-base text-emerald-400 shadow-sm" aria-hidden="true">
									add_circle
								</i>
							{:else if move[0].type === "Dropped"}
								<i class="material-icons absolute -bottom-1 -right-1 rounded-full bg-slate-900 text-base text-rose-500 shadow-sm" aria-hidden="true">
									do_not_disturb_on
								</i>
							{/if}
						</div>

						<!-- Player Details -->
						<div class="flex flex-col text-left">
							<span class="text-sm font-semibold text-slate-100">
								{players[move[0].player].fn} {players[move[0].player].ln}
							</span>
							<span class="flex items-center gap-1 text-xs text-slate-400">
								<span>{players[move[0].player].pos}</span>
								{#if players[move[0].player].t}
									<span>-</span>
									<span>{players[move[0].player].t}</span>
								{/if}
							</span>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Card Footer -->
		<div class="w-full border-t border-slate-800/60 bg-slate-950/40 px-5 py-2 text-center text-xs italic text-slate-400">
			{transaction.date}
		</div>
	</div>
</div>