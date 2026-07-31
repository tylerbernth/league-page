<!-- TransactionMove.svelte -->
<script>
	import { getTeamFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';

	export let move, leagueTeamManagers, players, season;

	const getAvatar = (pos, player) => {
	if (pos === 'DEF') {
		return `background-image: url(https://sleepercdn.com/images/team_logos/nfl/${player.toLowerCase()}.png); background-size: contain; background-repeat: no-repeat; background-position: center;`;
	}
	// Note: We use only the primary thumbnail here and handle background color via HTML/Tailwind
	return `background-image: url(https://sleepercdn.com/content/nfl/players/thumb/${player}.jpg); background-size: cover; background-repeat: no-repeat; background-position: center;`;
};

	let origin, dest;

	for (let i = 0; i < move.length; i++) {
		if (move[i] && move[i] === "origin") origin = i;
		if (move[i] && (move[i].pick || move[i].player || move[i].budget)) {
			dest = i;
		}
	}

	const checkL = (cell, ix) => {
		if (!cell) {
			if (ix < origin && ix < dest) return true;
			if (ix > origin && ix > dest) return true;
			return false;
		}
		if (ix === origin) {
			return dest > origin;
		}
		return ix < origin;
	};

	const checkR = (cell, ix) => {
		if (!cell) {
			if (ix < origin && ix < dest) return true;
			if (ix > origin && ix > dest) return true;
			return false;
		}
		if (ix === origin) {
			return dest < origin;
		}
		return ix > origin;
	};

	const getNumEnd = (num) => {
		switch (num) {
			case 1:
				return "st";
			case 2:
				return "nd";
			case 3:
				return "rd";
			default:
				return "th";
		}
	};
</script>

<tr class="transition-colors hover:bg-slate-800/20">
	{#each move as cell, ix}
		<td class="p-0 text-center align-top">
			<div class="relative flex items-center justify-evenly py-4">
				<!-- Connecting Flow Lines -->
				<div class="absolute top-8 left-0 h-[2px] w-1/2 bg-indigo-500/30 {checkL(cell, ix) ? 'hidden' : ''}"></div>
				<div class="absolute top-8 right-0 h-[2px] w-1/2 bg-indigo-500/30 {checkR(cell, ix) ? 'hidden' : ''}"></div>

				<!-- Player Slot -->
				{#if cell && cell.player}
					<div class="z-10 flex flex-col items-center justify-center">
						<div 
							class="relative h-12 w-12 rounded-full border-2 bg-slate-800 bg-cover bg-center shadow-md sm:h-14 sm:w-14" 
							style="border-color: var(--{players[cell.player].pos}); {getAvatar(players[cell.player].pos, cell.player)}"
						>
							<i class="material-icons absolute -bottom-1 -right-1 rounded-full bg-slate-900 text-base text-indigo-400 shadow-sm" aria-hidden="true">
								add_circle
							</i>
						</div>
						<div class="mt-1.5 flex max-w-[120px] flex-col flex-wrap justify-center text-center text-xs leading-tight">
							<span class="font-semibold text-slate-100">{players[cell.player].fn} {players[cell.player].ln}</span>
							<span class="mt-0.5 text-[11px] text-slate-400">
								<span>{players[cell.player].pos}</span>
								{#if players[cell.player].t}
									- <span>{players[cell.player].t}</span>
								{/if}
							</span>
						</div>
					</div>

				<!-- Draft Pick Slot -->
				{:else if cell && cell.pick}
					<div class="z-10 flex flex-col items-center justify-center">
						<div class="relative flex h-12 w-12 flex-col items-center justify-center rounded-full border-2 border-indigo-500/50 bg-indigo-500/10 shadow-md sm:h-14 sm:w-14">
							<span class="text-[10px] font-semibold uppercase tracking-wider text-indigo-300">Rd</span>
							<span class="text-sm font-extrabold text-indigo-100 sm:text-base">
								{cell.pick.round}<span class="text-[10px] font-normal align-super">{getNumEnd(cell.pick.round)}</span>
							</span>
							<i class="material-icons absolute -bottom-1 -right-1 rounded-full bg-slate-900 text-base text-indigo-400 shadow-sm" aria-hidden="true">
								add_circle
							</i>
						</div>
						<div class="mt-1.5 flex flex-col text-center text-xs leading-tight">
							<span class="font-semibold text-slate-200">{cell.pick.season}</span>
							{#if cell.pick.original_owner}
								<span class="mt-0.5 text-[11px] italic text-slate-400">
									{getTeamFromTeamManagers(leagueTeamManagers, cell.pick.original_owner, season).name}
									{#if getTeamFromTeamManagers(leagueTeamManagers, cell.pick.original_owner, season).name !== getTeamFromTeamManagers(leagueTeamManagers, cell.pick.original_owner).name}
										({getTeamFromTeamManagers(leagueTeamManagers, cell.pick.original_owner).name})
									{/if}
								</span>
							{/if}
						</div>
					</div>

				<!-- FAAB Budget Slot -->
				{:else if cell && cell.budget}
					<div class="z-10 flex flex-col items-center justify-center">
						<div class="relative flex h-12 w-12 flex-col items-center justify-center rounded-full border-2 border-emerald-500/50 bg-emerald-500/10 shadow-md sm:h-14 sm:w-14">
							<span class="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">FAAB</span>
							<span class="text-xs font-bold text-emerald-300 sm:text-sm">
								${cell.budget.amount}
							</span>
							<i class="material-icons absolute -bottom-1 -right-1 rounded-full bg-slate-900 text-base text-emerald-400 shadow-sm" aria-hidden="true">
								add_circle
							</i>
						</div>
					</div>

				<!-- Origin Direction Indicator Slot -->
				{:else if cell && cell === "origin"}
					<div class="z-10 flex flex-col items-center justify-center">
						<div class="mt-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-indigo-500 bg-slate-900 shadow-inner">
							{#if dest - origin < 0}
								<i class="material-icons text-lg text-indigo-400" aria-hidden="true">chevron_left</i>
							{:else}
								<i class="material-icons text-lg text-indigo-400" aria-hidden="true">chevron_right</i>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</td>
	{/each}
</tr>