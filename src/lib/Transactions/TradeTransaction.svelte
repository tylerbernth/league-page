<!-- TradeTransaction.svelte -->
<script>
	import { gotoManager } from '$lib/utils/helper';
	import { getTeamFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';
	import TransactionMove from './TransactionMove.svelte';

	export let transaction, players, leagueTeamManagers;
</script>

<div class="mb-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-slate-700 hover:shadow-indigo-500/10">
	<div class="w-full overflow-x-auto">
		<table class="w-full table-fixed border-collapse">
			<!-- Trade Header (Roster/Owner Columns) -->
			<thead>
				<tr class="border-b border-slate-800 bg-slate-800/50">
					{#each transaction.rosters as owner}
						<th 
							class="cursor-pointer p-3 text-center transition-colors hover:bg-slate-800/80"
							style="width: {1 / transaction.rosters.length * 100}%;" 
							onclick={() => gotoManager({year: transaction.season, leagueTeamManagers, rosterID: owner})}
						>
							<div class="flex flex-col items-center justify-between gap-2">
								<img 
									class="h-10 w-10 rounded-full border-2 border-indigo-500 bg-slate-950 object-cover shadow-sm sm:h-12 sm:w-12" 
									src={getTeamFromTeamManagers(leagueTeamManagers, owner, transaction.season).avatar} 
									alt="{getTeamFromTeamManagers(leagueTeamManagers, owner, transaction.season).name} avatar"
								/>
								<span class="text-xs font-semibold leading-snug text-slate-100 sm:text-sm">
									{getTeamFromTeamManagers(leagueTeamManagers, owner, transaction.season).name}
									{#if getTeamFromTeamManagers(leagueTeamManagers, owner, transaction.season).name !== getTeamFromTeamManagers(leagueTeamManagers, owner).name}
										<br />
										<span class="text-[11px] font-normal italic text-slate-400">
											({getTeamFromTeamManagers(leagueTeamManagers, owner).name})
										</span>
									{/if}
								</span>
							</div>
						</th>
					{/each}
				</tr>
			</thead>

			<!-- Trade Moves Body -->
			<tbody class="divide-y divide-slate-800/60 bg-slate-900/40">
				{#each transaction.moves as move}
					<TransactionMove {players} {move} type={transaction.type} {leagueTeamManagers} season={transaction.season} />
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Trade Footer -->
	<div class="w-full border-t border-slate-800/60 bg-slate-950/40 px-5 py-2 text-right text-xs italic text-slate-400">
		{transaction.date}
	</div>
</div>