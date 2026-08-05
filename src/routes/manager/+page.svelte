<script>
	import LinearProgress from '@smui/linear-progress';
    import { Manager } from '$lib/components';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount, afterUpdate } from 'svelte';

	export let data;
	
	// Reactively pull current managers, manager index, and promises from data
	$: ({ managers, manager, managersInfo, draftPicks } = data);

	onMount(() => {
		if(!managers.length) goto('/');
		if(manager < 0) goto("/managers");
	});

	// If the URL query parameter changes while already on the manager page, 
	// ensure invalid states or top-of-page layout adjustments are handled gracefully.
	$: if ($page.url.searchParams.get('manager') !== null) {
		const parsedManager = parseInt($page.url.searchParams.get('manager'), 10);
		if (isNaN(parsedManager) || parsedManager < 0 || parsedManager >= managers.length) {
			goto("/managers");
		}
	}
</script>

<style>
	.main {
		position: relative;
		z-index: 1;
	}
    .loading {
        display: block;
        width: 85%;
        max-width: 500px;
        margin: 80px auto;
    }
</style>

<div class="main">
    {#await managersInfo}
        <!-- promise is pending -->
        <div class="loading">
            <p>Retrieving managers...</p>
            <LinearProgress indeterminate />
        </div>
    {:then [rostersData, leagueTeamManagers, leagueData, transactionsData, awards, records]}
        {#if managers.length && manager > -1}
            {#key manager}
                <Manager 
                    {awards} 
                    {records} 
                    {manager} 
                    {managers} 
                    {rostersData} 
                    {leagueTeamManagers} 
                    rosterPositions={leagueData.roster_positions} 
                    {transactionsData} 
                    {draftPicks} 
                />
            {/key}
        {/if}
    {:catch error}
        <!-- promise was rejected -->
        <p>Something went wrong: {error.message}</p>
    {/await}
</div>