<script>
    export let teamKeepers = [];
    export let players = {};

    $: groupedKeepers = (() => {
        if (!teamKeepers || teamKeepers.length === 0) return [];

        const map = {};
        for (const pick of teamKeepers) {
            const season = pick.season || 'Unknown';
            if (!map[season]) {
                map[season] = [];
            }
            map[season].push(pick);
        }

        return Object.entries(map)
            .sort(([yearA], [yearB]) => {
                if (yearA === 'Unknown') return 1;
                if (yearB === 'Unknown') return -1;
                return Number(yearB) - Number(yearA);
            });
    })();
</script>

<div class="mx-auto my-8 w-full max-w-6xl rounded-2xl border border-indigo-500/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md">
    <h3 class="mb-6 text-center text-xl font-light tracking-wide text-slate-200 sm:text-2xl">
        Keeper History
    </h3>
    
    {#if groupedKeepers.length === 0}
        <div class="py-6 text-center text-xs italic text-slate-500">
            No keepers designated for this season.
        </div>
    {:else}
        <div class="flex flex-col gap-4">
            {#each groupedKeepers as [year, picks]}
                <div class="flex flex-col md:flex-row items-stretch gap-4 rounded-xl border border-slate-800 bg-slate-800/40 p-4 shadow-sm">
                    <!-- Year Badge -->
                    <div class="flex h-12 md:h-auto md:w-20 shrink-0 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-950/80 text-xs font-bold text-indigo-300">
                        {year}
                    </div>

                    <!-- Players Grid -->
                    <div class="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {#each picks as pick}
                            {@const playerID = pick.player_id}
                            {@const player = players[playerID]}
                            {@const playerName = player?.full_name || (pick.metadata?.first_name ? `${pick.metadata.first_name} ${pick.metadata.last_name}` : playerID)}
                            <div class="flex flex-col items-center rounded-xl border border-slate-700/40 bg-slate-900/60 p-3 text-center shadow-inner transition-all hover:border-indigo-500/30">
                                <img 
                                    class="mb-2.5 h-16 w-16 rounded-full object-cover bg-slate-800 ring-2 ring-slate-700/50 shadow-sm" 
                                    src="https://sleepercdn.com/content/nfl/players/{playerID}.jpg" 
                                    alt={playerName} 
                                    onerror={(e) => e.target.src = '/default_player.png'}
                                />
                                <span class="text-xs font-semibold leading-tight text-slate-100 mb-1 line-clamp-1">{playerName}</span>
                                <span class="rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-indigo-300 border border-slate-700/50">
                                    Round {pick.round}
                                </span>
                            </div>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>