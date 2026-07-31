<script>
	import { goto } from '$app/navigation';
	import { getLeagueTransactions, loadPlayers } from '$lib/utils/helper';
	import { match } from 'fuzzyjs';
	import Pagination from '../Pagination.svelte';
	import TradeTransaction from './TradeTransaction.svelte';
	import WaiverTransaction from './WaiverTransaction.svelte';

	export let show, playersInfo, query, queryPage, transactions, stale, perPage, postUpdate = false, leagueTeamManagers;
	
	const oldQuery = query;
	let page = queryPage || 0;

	const refreshTransactions = async () => {
		const newTransactions = await getLeagueTransactions(false, true);
		transactions = newTransactions.transactions;
	};

	if (stale) {
		refreshTransactions();
	}

	let players = playersInfo.players;

	const refreshPlayers = async () => {
		const newPlayersInfo = await loadPlayers(null, true);
		players = newPlayersInfo.players;
	};

	if (playersInfo.stale) {
		refreshPlayers();
	}

	// Filtered subset based on search
	let subsetTransactions = [];
	let totalTransactions = 0;

	const setFilter = (filterBy, transactions) => {
		if (filterBy === "both") {
			return transactions;
		} else {
			return transactions.filter(transaction => transaction.type === filterBy);
		}
	};

	// Filtered subset based on filter
	$: filteredTransactions = setFilter(show, transactions);

	const setQuery = (query, filteredTransactions) => {
		if (!filteredTransactions) {
			return [];
		}
		if (query && query.trim() !== "") {
			subsetTransactions = filteredTransactions.filter(transaction => checkForQuery(transaction));
			totalTransactions = subsetTransactions.length;
		} else {
			subsetTransactions = filteredTransactions;
			totalTransactions = subsetTransactions.length;
		}

		const start = page * perPage;
		const end = (page + 1) * perPage;
		return subsetTransactions.slice(start, end);
	};

	$: displayTransactions = setQuery(query, filteredTransactions);

	const changePage = (dest, pageChange = false) => {
		if (queryPage === dest && pageChange) return;
		page = dest;
		if (dest > (filteredTransactions.length / perPage) || dest < 0) {
			page = 0;
		}
		displayTransactions = setQuery(query, filteredTransactions);
		if (postUpdate) {
			goto(`/transactions?show=${show}&query=${query}&page=${page + 1}`, { noscroll: true, keepfocus: true });
		}
	};

	let lastUpdate = new Date();
	let timer;

	const debounce = (dest) => {
		clearTimeout(timer);
		timer = setTimeout(() => {
			goto(dest, { noscroll: true, keepfocus: true });
		}, 750);
	};

	const search = () => {
		lastUpdate = new Date();
		query = query.trimStart();
		if (query.trim() === oldQuery) return;
		page = 0;
		if (postUpdate) {
			const dest = `/transactions?show=${show}&query=${query.trim()}&page=${page + 1}`;
			debounce(dest);
		}
	};

	const clearSearch = () => {
		query = "";
		if (postUpdate) {
			goto(`/transactions?show=${show}&query=&page=${page + 1}`, { noscroll: true, keepfocus: true });
		}
	};

	const checkMatch = (query, name) => {
		const nameMatch = match(query, name);
		if (nameMatch.match && nameMatch.score > 0) {
			return true;
		}
	};

	const checkForQuery = (transaction) => {
		const moves = transaction.moves;
		for (const move of moves) {
			for (const col of move) {
				if (!col?.player) continue;
				return checkMatch(query, `${players[col.player].fn} ${players[col.player].ln}`);
			}
		}
		return false;
	};

	$: changePage(page, true);
	$: setQuery(query);

	let el;
	$: top = el?.getBoundingClientRect() ? el?.getBoundingClientRect().top : 0;

	const setShow = (val) => {
		show = val;
		page = 0;
		changePage(0);
	};
</script>

<div class="w-full space-y-6">
	<!-- Standalone Top Header Banner Card -->
	<div class="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
		<div class="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>

		<div class="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div>
				<div class="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20 mb-2">
					<span>🤝 Waiver Wire & Trade Activity</span>
				</div>
				<h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white uppercase">
					League Transactions
				</h1>
			</div>
		</div>
	</div>

	<!-- Main Content Section Container -->
	<div class="rounded-3xl bg-slate-900 border border-slate-800 p-4 sm:p-6 shadow-xl" bind:this={el}>
		
		<!-- Filter Segmented Control -->
		<div class="mb-6 flex justify-center">
			<div class="inline-flex rounded-xl border border-slate-800 bg-slate-950/80 p-1.5 shadow-inner">
				<button
					type="button"
					disabled={show === 'trade'}
					onclick={() => setShow('trade')}
					class="rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:px-6 sm:text-sm {show === 'trade' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}"
				>
					Trades
				</button>
				<button
					type="button"
					disabled={show === 'waiver'}
					onclick={() => setShow('waiver')}
					class="rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:px-6 sm:text-sm {show === 'waiver' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}"
				>
					Waivers
				</button>
				<button
					type="button"
					disabled={show === 'both'}
					onclick={() => setShow('both')}
					class="rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:px-6 sm:text-sm {show === 'both' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}"
				>
					Both
				</button>
			</div>
		</div>

		<!-- Search Bar -->
		<div class="mx-auto mb-6 w-full max-w-md">
			<div class="relative">
				<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
					<svg class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
				</div>
				<input
					type="text"
					bind:value={query}
					oninput={search}
					placeholder="Search for a player..."
					class="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 pl-10 pr-10 text-sm text-slate-100 placeholder-slate-500 transition-all focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
				/>
				{#if query.length > 0}
					<button
						type="button"
						onclick={clearSearch}
						class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				{/if}
			</div>
		</div>

		<!-- Dynamic Section Subheader -->
		<div class="mb-4 text-center">
			<h2 class="text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">
				{#if show === "both"}
					Recent Transactions
				{:else if show === "trade"}
					Recent Trades
				{:else}
					Recent Waivers
				{/if}
			</h2>
		</div>

		<!-- Top Pagination -->
		<div class="mb-4">
			<Pagination {perPage} total={totalTransactions} bind:page target={top} scroll={false} />
		</div>

		<!-- Transactions List -->
		<div class="space-y-4">
			{#each displayTransactions as transaction (transaction.id)}
				{#if transaction.type === "waiver"}
					<WaiverTransaction {players} {transaction} {leagueTeamManagers} />
				{:else}
					<TradeTransaction {players} {transaction} {leagueTeamManagers} />
				{/if}
			{/each}
		</div>

		<!-- Bottom Pagination -->
		<div class="mt-6">
			<Pagination {perPage} total={totalTransactions} bind:page target={top} scroll={true} />
		</div>

		<!-- Empty State Message -->
		{#if totalTransactions === 0}
			<div class="my-8 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 py-12 text-center">
				<p class="text-sm italic text-slate-400">
					{#if show === "trade"}
						{query.trim() !== "" ? "No trades match your search" : "Nobody has made any trades yet... that's just sad"}
					{:else if show === "waiver"}
						{query.trim() !== "" ? "No waivers match your search" : "Nobody has made any waiver wire moves yet... that's just sad"}
					{:else}
						{query.trim() !== "" ? "No transactions match your search" : "Nobody has made any moves yet... that's just sad"}
					{/if}
				</p>
			</div>
		{/if}
	</div>
</div>