<script>
	import LinearProgress from '@smui/linear-progress';
	import { TransactionsPage } from '$lib/components';
	import { waitForAll } from '$lib/utils/helper';

	export let data;
	const { show, query, page, playersData, transactionsData, leagueTeamManagersData } = data;

	const perPage = 10;
</script>

<style>
	.loading {
		display: block;
		position: relative;
		z-index: 1;
		width: 85%;
		max-width: 500px;
		margin: 80px auto;
	}
</style>

<div class="w-full max-w-7xl mx-auto py-4 space-y-6">
	{#await waitForAll(transactionsData, playersData, leagueTeamManagersData)}
		<div class="loading">
			<p>Loading league transactions...</p>
			<LinearProgress indeterminate />
		</div>
	{:then [{transactions, currentTeams, stale}, playersInfo, leagueTeamManagers]}
		<TransactionsPage {playersInfo} {stale} {transactions} {currentTeams} {show} {query} queryPage={page} {perPage} postUpdate={true} {leagueTeamManagers} />
	{:catch error}
		<p class="center">Something went wrong: {error.message}</p>
	{/await}
</div>