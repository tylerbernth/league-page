<script>
	import { goto } from "$app/navigation";
	import { getTeamData } from "$lib/utils/helperFunctions/universalFunctions";

    export let playerOne, playerTwo, leagueTeamManagers;

    const users = Object.keys(leagueTeamManagers.users);

    $: usersOne = users.filter(u => u !== playerTwo);
    $: usersTwo = users.filter(u => u !== playerOne);

    const analyzeRivalry = (p1, p2) => {
        if(!p1 || !p2) {
            return;
        }
        goto(`/rivalry?player_one=${p1}&player_two=${p2}`, {noscroll: true, keepfocus: true})
    }

    $: analyzeRivalry(playerOne, playerTwo)
</script>

<div class="mx-auto my-12 flex max-w-4xl flex-col items-center justify-evenly gap-6 sm:flex-row">
    <!-- manager 1 -->
    <div class="text-center">
        <div class="relative inline-block">
            <select 
                class="w-full appearance-none rounded-xl border border-indigo-500/30 bg-slate-900/80 px-6 py-3 text-center text-base font-medium text-slate-100 shadow-lg backdrop-blur-md focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:text-lg" 
                id="managerOne" 
                name="managerOne" 
                bind:value={playerOne}
            >
                <option value={null} class="bg-slate-900 text-slate-400">Select a manager</option>
                {#each usersOne as user}
                    <option value={user} class="bg-slate-900 text-slate-100">{leagueTeamManagers.users[user].display_name}</option>
                {/each}
            </select>
            {#if playerOne}
                <img 
                    class="absolute top-1/2 -left-12 h-12 w-12 -translate-y-1/2 rounded-full border-2 border-indigo-500 bg-slate-900 object-cover shadow-md sm:-left-16 sm:h-14 sm:w-14" 
                    src="{getTeamData(leagueTeamManagers.users, playerOne).avatar}" 
                    alt="manager one avatar"
                />
            {/if}
        </div>
    </div>

    <!-- vs -->
    <span class="my-2 text-xl font-bold tracking-wider text-slate-500">VS</span>

    <!-- manager 2 -->
    <div class="text-center">
        <div class="relative inline-block">
            <select 
                class="w-full appearance-none rounded-xl border border-cyan-500/30 bg-slate-900/80 px-6 py-3 text-center text-base font-medium text-slate-100 shadow-lg backdrop-blur-md focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 sm:text-lg" 
                id="managerTwo" 
                name="managerTwo" 
                bind:value={playerTwo}
            >
                <option value={null} class="bg-slate-900 text-slate-400">Select a manager</option>
                {#each usersTwo as user}
                    <option value={user} class="bg-slate-900 text-slate-100">{leagueTeamManagers.users[user].display_name}</option>
                {/each}
            </select>
            {#if playerTwo}
                <img 
                    class="absolute top-1/2 -right-12 h-12 w-12 -translate-y-1/2 rounded-full border-2 border-cyan-500 bg-slate-900 object-cover shadow-md sm:-right-16 sm:h-14 sm:w-14" 
                    src="{getTeamData(leagueTeamManagers.users, playerTwo).avatar}" 
                    alt="manager two avatar"
                />
            {/if}
        </div>
    </div>
</div>