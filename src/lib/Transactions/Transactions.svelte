<script>
	import { goto } from '$app/navigation';
	import { getLeagueTransactions, getLeagueTeamManagers, loadPlayers, waitForAll } from '$lib/utils/helper';
	import { onMount } from 'svelte';
	import TradeTransaction from './TradeTransaction.svelte';
	import WaiverTransaction from './WaiverTransaction.svelte';

	let loading = true;
	let players;
	let transactions;
	let leagueTeamManagers;

	onMount(async () => {
		const [transactionsData, playersData, leagueTeamManagersData] = await waitForAll(
			getLeagueTransactions(true),
			loadPlayers(null),
			getLeagueTeamManagers()
		);
		players = playersData.players;
		transactions = transactionsData.transactions;
		leagueTeamManagers = leagueTeamManagersData;
		loading = false;

		if (transactionsData.stale) {
			const newTransactions = await getLeagueTransactions(true, true);
			transactions = newTransactions.transactions;
		}

		if (playersData.stale) {
			const newPlayersData = await loadPlayers(true);
			players = newPlayersData.players;
		}
	});
</script>

<div class="relative z-10 w-full max-w-4xl mx-auto px-2 py-4 sm:px-4">
	{#if loading}
		<!-- Modern Skeleton Loader -->
		<div class="flex flex-col items-center justify-center py-12 space-y-4">
			<div class="h-4 w-48 animate-pulse rounded bg-slate-800"></div>
			<div class="w-full space-y-4">
				<div class="h-28 w-full animate-pulse rounded-xl border border-slate-800/80 bg-slate-900/50"></div>
				<div class="h-28 w-full animate-pulse rounded-xl border border-slate-800/80 bg-slate-900/50"></div>
			</div>
		</div>
	{:else}
		<!-- Waiver Moves Section -->
		<section class="mb-10">
			<div class="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
				<h3 class="text-base font-bold tracking-wide text-indigo-400 uppercase sm:text-lg">
					Recent Waiver Moves
				</h3>
				{#if transactions.waivers.length}
					<span class="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">
						{transactions.waivers.length}
					</span>
				{/if}
			</div>

			{#if transactions.waivers.length}
				<div class="space-y-4">
					{#each transactions.waivers as transaction}
						<WaiverTransaction {players} {transaction} {leagueTeamManagers} />
					{/each}
				</div>

				<div class="mt-4 text-center">
					<button
						onclick={() => goto("/transactions?show=waiver&query=&page=1")}
						class="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs font-semibold text-slate-300 transition-all duration-200 hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-indigo-300 active:scale-95"
					>
						<span>View all waiver moves</span>
						<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				</div>
			{:else}
				<div class="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 py-10 text-center">
					<p class="text-sm italic text-slate-500">No waiver moves have been made yet...</p>
				</div>
			{/if}
		</section>

		<!-- Trades Section -->
		<section>
			<div class="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
				<h3 class="text-base font-bold tracking-wide text-indigo-400 uppercase sm:text-lg">
					Recent Trades
				</h3>
				{#if transactions.trades.length}
					<span class="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">
						{transactions.trades.length}
					</span>
				{/if}
			</div>

			{#if transactions.trades.length}
				<div class="space-y-4">
					{#each transactions.trades as transaction}
						<TradeTransaction {players} {transaction} {leagueTeamManagers} />
					{/each}
				</div>

				<div class="mt-4 text-center">
					<button
						onclick={() => goto("/transactions?show=trade&query=&page=1")}
						class="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs font-semibold text-slate-300 transition-all duration-200 hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-indigo-300 active:scale-95"
					>
						<span>View all trades</span>
						<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				</div>
			{:else}
				<div class="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 py-10 text-center">
					<p class="text-sm italic text-slate-500">No trades have been made yet...</p>
				</div>
			{/if}
		</section>
	{/if}
</div>