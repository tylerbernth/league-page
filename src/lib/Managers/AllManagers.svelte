<script>
    import { leagueName } from '$lib/utils/helper';
    import ManagerRow from './ManagerRow.svelte';

    export let managers, leagueTeamManagers;

    let innerWidth;
</script>

<svelte:window bind:innerWidth={innerWidth} />

<div class="my-8 mb-20 w-full">
    <h2 class="my-6 text-center text-3xl font-extrabold tracking-tight text-slate-100 sm:my-8 sm:text-4xl md:text-5xl">
        {leagueName} Managers
    </h2>
    <div class="mx-auto w-[97%] max-w-3xl">
        {#each managers as manager, key}
            <ManagerRow {manager} {leagueTeamManagers} {key} />
        {/each}
    </div>
</div>