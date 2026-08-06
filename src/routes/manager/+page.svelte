<!-- Inside +page.svelte -->
<script>
	import LinearProgress from '@smui/linear-progress';
    import { Manager } from '$lib/components';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	export let data;
	
	$: ({ managers, manager, managersInfo, draftPicks, allDraftsByYear, playerPointsByYear, rosterToUserMapByYear } = data);

	onMount(() => {
		if(!managers.length) goto('/');
		if(manager < 0) goto("/managers");
	});

	$: if ($page.url.searchParams.get('manager') !== null) {
		const parsedManager = parseInt($page.url.searchParams.get('manager'), 10);
		if (isNaN(parsedManager) || parsedManager < 0 || parsedManager >= managers.length) {
			goto("/managers");
		}
	}
</script>

<!-- ... layout template ... -->

<div class="main">
    {#await managersInfo}
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
                    {allDraftsByYear}
                    {playerPointsByYear}
                    {rosterToUserMapByYear}
                />
            {/key}
        {/if}
    {:catch error}
        <p>Something went wrong: {error.message}</p>
    {/await}
</div>