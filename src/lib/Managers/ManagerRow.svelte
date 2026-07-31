<script>
    import { goto } from "$app/navigation";
    import { getDatesActive, getRosterIDFromManagerID, getTeamNameFromTeamManagers } from "$lib/utils/helperFunctions/universalFunctions";
    import { dynasty } from "$lib/utils/leagueInfo";

    export let manager, leagueTeamManagers, key;

    let retired = false;

    let rosterID = manager.roster;
    let year = null;

    if (manager.managerID) {
        const dates = getDatesActive(leagueTeamManagers, manager.managerID);
        if (dates?.end) retired = true;

        const res = getRosterIDFromManagerID(leagueTeamManagers, manager.managerID);
        if (res) {
            rosterID = res.rosterID;
            year = res.year;
        }
    }

    const commissioner = manager.managerID ? leagueTeamManagers.users[manager.managerID]?.is_owner : false;
</script>

<div 
    tabindex="0"
    role="button"
    class="mx-auto my-3 flex w-full max-w-6xl cursor-pointer items-center justify-start rounded-full border border-slate-800 bg-slate-900/60 p-2.5 sm:p-3.5 shadow-md backdrop-blur-md transition-all duration-200 hover:border-indigo-500/30 hover:bg-slate-850 hover:shadow-indigo-500/10 {retired ? 'opacity-70 bg-[url(/retired.png)] bg-no-repeat bg-[position:15%_50%]' : ''}"
    onclick={() => goto(`/manager?manager=${key}`)}
    onkeydown={(e) => e.key === 'Enter' && goto(`/manager?manager=${key}`)}
>
    <!-- Avatar & Commissioner Badge Container -->
    <div class="relative ml-2 flex shrink-0 items-center">
        <img 
            class="h-9 w-9 sm:h-11 sm:w-11 rounded-full border border-slate-700 object-cover shadow-sm" 
            src="{manager.photo}" 
            alt="{manager.name}" 
        />
        {#if commissioner}
            <div class="absolute -bottom-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full border border-indigo-500 bg-indigo-600 text-[9px] sm:text-[10px] font-bold text-white shadow">
                <span>C</span>
            </div>
        {/if}
    </div>

    <!-- Manager Name -->
    <div class="ml-3 sm:ml-4 text-sm font-semibold text-slate-100 sm:text-base">
        {manager.name}
    </div>

    <!-- Team Name -->
    <div class="hidden sm:block ml-3 text-xs font-normal italic text-slate-400 sm:text-sm">
        {getTeamNameFromTeamManagers(leagueTeamManagers, rosterID, year)}
    </div>

    <!-- Flexible Spacer -->
    <div class="flex-grow"></div>

    <!-- Info Slots -->
    <div class="flex items-center gap-2 sm:gap-4 mr-2">
        <!-- Favorite NFL Team -->
        <div class="flex w-10 sm:w-14 flex-col items-center justify-center text-center">
            <div class="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center overflow-hidden rounded-full border border-slate-800 bg-slate-950">
                {#if manager.favoriteTeam}
                    <img class="h-5 sm:h-7 w-auto object-contain" src="https://sleepercdn.com/images/team_logos/nfl/{manager.favoriteTeam}.png" alt="favorite team"/>
                {:else}
                    <img class="h-5 sm:h-7 w-auto object-contain opacity-40" src="/managers/question.jpg" alt="unknown team"/>
                {/if}
            </div>
        </div>

        <!-- Preferred Contact Method -->
        <div class="flex w-10 sm:w-14 flex-col items-center justify-center text-center">
            {#if manager.preferredContact}
                <div class="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center overflow-hidden rounded-full border border-slate-800 bg-slate-950">
                    <img class="h-4 sm:h-6 w-auto object-contain" src="/{manager.preferredContact}.png" alt="{manager.preferredContact}"/>
                </div>
                <div class="mt-0.5 text-[9px] sm:text-[11px] text-slate-400 truncate w-full">
                    {manager.preferredContact}
                </div>
            {:else}
                <div class="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center overflow-hidden rounded-full border border-slate-800 bg-slate-950">
                    <img class="h-4 sm:h-6 w-auto object-contain opacity-40" src="/managers/question.jpg" alt="unknown contact"/>
                </div>
            {/if}
        </div>

        <!-- Rebuild Mode -->
        {#if dynasty}
            <div class="flex w-10 sm:w-14 flex-col items-center justify-center text-center">
                {#if manager.mode}
                    <div class="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center overflow-hidden rounded-full border border-slate-800 bg-slate-950">
                        <img class="h-5 sm:h-7 w-auto object-contain" src="/{manager.mode.replace(' ', '%20')}.png" alt="win now or rebuild"/>
                    </div>
                    <div class="mt-0.5 text-[9px] sm:text-[11px] text-slate-400 capitalize truncate w-full">
                        {manager.mode}
                    </div>
                {:else}
                    <div class="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center overflow-hidden rounded-full border border-slate-800 bg-slate-950">
                        <img class="h-5 sm:h-7 w-auto object-contain opacity-40" src="/managers/question.jpg" alt="unknown mode"/>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>