<script>
    export let allDraftsByYear = {};
    export let playerPointsByYear = {};
    export let managers = [];
    export let rosterToUserMapByYear = {};
    export let selectedManagerId = null;

    const processDraftValues = () => {
        if (!selectedManagerId || !allDraftsByYear) return { best: [], worst: [] };

        let allManagerPicks = [];

        for (const [year, draftData] of Object.entries(allDraftsByYear)) {
            const picks = draftData.draftPicks || [];
            const yearPoints = playerPointsByYear[year] || {};
            const seasonMap = rosterToUserMapByYear[year] || {};

            picks.forEach(pick => {
                const ownerId = pick.picked_by || seasonMap[pick.roster_id];
                if (ownerId !== selectedManagerId) return;

                const actualPoints = yearPoints[pick.player_id] || 0;
                
                const expectedPoints = Math.max(30, 280 - (pick.round * 24));
                const rawDiff = actualPoints - expectedPoints;

                let grade = Number((Math.max(0, Math.min(10, (rawDiff + 150) / 35))).toFixed(1));
                const pickNumber = pick.pick_no || (((pick.round - 1) * 12) + 1);

                allManagerPicks.push({
                    ...pick,
                    actualPoints,
                    grade,
                    rawDiff,
                    pickNumber
                });
            });
        }

        const best = [...allManagerPicks].sort((a, b) => b.rawDiff - a.rawDiff).slice(0, 5);
        const worst = [...allManagerPicks].sort((a, b) => a.rawDiff - b.rawDiff).slice(0, 5);

        return { best, worst };
    };

    $: ({ best, worst } = processDraftValues());
</script>

<!-- Responsive Grid: Stacks on mobile, side-by-side on large screens -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
    <!-- Best Value Picks Section -->
    <div class="rounded-2xl border border-slate-700/50 bg-slate-900/85 p-4 sm:p-6 shadow-2xl backdrop-blur-md flex flex-col">
        <div class="mb-6 flex items-center gap-3 border-b border-slate-800 pb-4">
            <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-lg">✓</span>
            <h3 class="text-xl font-bold tracking-wide text-emerald-400 sm:text-2xl whitespace-nowrap">
                Best Value Picks
            </h3>
        </div>

        {#if best.length === 0}
            <p class="text-center py-12 text-sm text-slate-400 italic">No historical draft data found for this manager.</p>
        {:else}
            <div class="grid grid-cols-1 gap-3 flex-1">
                {#each best as pick, i}
                    <div class="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 transition-all duration-200 hover:border-slate-700">
                        <!-- Left side: Index, Headshot, Name/Position, Subtitle -->
                        <div class="flex items-center gap-3 overflow-hidden min-w-0">
                            <span class="w-5 flex-shrink-0 text-center font-mono text-xs font-bold text-slate-400">#{i + 1}</span>
                            
                            <div class="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-full bg-slate-800 border border-slate-700">
                                <img 
                                    src="https://sleepercdn.com/content/nfl/players/{pick.player_id}.jpg" 
                                    alt="{pick.first_name} {pick.last_name}"
                                    class="h-full w-full object-cover"
                                    onerror={(e) => { e.target.src = 'https://sleepercdn.com/images/v2/icons/player_default.png'; }}
                                />
                            </div>

                            <div class="min-w-0 flex-1">
                                <div class="font-bold text-sm text-slate-100 truncate flex items-center gap-2">
                                    <span class="truncate">{pick.first_name || ''} {pick.last_name || 'Unknown Player'}</span>
                                    <!-- Position pill next to name -->
                                    <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex-shrink-0
                                        {pick.position === 'QB' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                                         pick.position === 'RB' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                         pick.position === 'WR' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 
                                         'bg-amber-500/10 text-amber-400 border border-amber-500/20'}">
                                        {pick.position || 'FLEX'}
                                    </span>
                                </div>
                                <div class="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5">
                                    <span class="font-semibold text-indigo-400">Pick #{pick.pickNumber}</span>
                                    <span class="text-slate-650">•</span>
                                    <span class="font-medium text-slate-300">R{pick.round}</span>
                                    <span class="text-slate-650">•</span>
                                    <span class="uppercase">{pick.team || 'FA'}</span>
                                    <span class="text-slate-650">•</span>
                                    <span class="text-slate-500">{pick.season}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Right side: Points and grade -->
                        <div class="flex items-center gap-2.5 flex-shrink-0">
                            <div class="text-right">
                                <div class="text-[11px] font-medium text-slate-400">{pick.actualPoints} pts</div>
                            </div>
                            <div class="flex h-8 w-11 items-center justify-center rounded border border-emerald-500/20 bg-emerald-500/10 font-mono text-sm font-bold text-emerald-400 shadow-sm">
                                {pick.grade}
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    <!-- Worst Value Picks Section -->
    <div class="rounded-2xl border border-slate-700/50 bg-slate-900/85 p-4 sm:p-6 shadow-2xl backdrop-blur-md flex flex-col">
        <div class="mb-6 flex items-center gap-3 border-b border-slate-800 pb-4">
            <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 font-bold text-lg">✕</span>
            <h3 class="text-xl font-bold tracking-wide text-rose-400 sm:text-2xl whitespace-nowrap">
                Worst Value Picks
            </h3>
        </div>

        {#if worst.length === 0}
            <p class="text-center py-12 text-sm text-slate-400 italic">No historical draft data found for this manager.</p>
        {:else}
            <div class="grid grid-cols-1 gap-3 flex-1">
                {#each worst as pick, i}
                    <div class="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 transition-all duration-200 hover:border-slate-700">
                        <!-- Left side: Index, Headshot, Name/Position, Subtitle -->
                        <div class="flex items-center gap-3 overflow-hidden min-w-0">
                            <span class="w-5 flex-shrink-0 text-center font-mono text-xs font-bold text-slate-400">#{i + 1}</span>
                            
                            <div class="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-full bg-slate-800 border border-slate-700">
                                <img 
                                    src="https://sleepercdn.com/content/nfl/players/{pick.player_id}.jpg" 
                                    alt="{pick.first_name} {pick.last_name}"
                                    class="h-full w-full object-cover"
                                    onerror={(e) => { e.target.src = 'https://sleepercdn.com/images/v2/icons/player_default.png'; }}
                                />
                            </div>

                            <div class="min-w-0 flex-1">
                                <div class="font-bold text-sm text-slate-100 truncate flex items-center gap-2">
                                    <span class="truncate">{pick.first_name || ''} {pick.last_name || 'Unknown Player'}</span>
                                    <!-- Position pill next to name -->
                                    <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex-shrink-0
                                        {pick.position === 'QB' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                                         pick.position === 'RB' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                         pick.position === 'WR' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 
                                         'bg-amber-500/10 text-amber-400 border border-amber-500/20'}">
                                        {pick.position || 'FLEX'}
                                    </span>
                                </div>
                                <div class="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5">
                                    <span class="font-semibold text-indigo-400">Pick #{pick.pickNumber}</span>
                                    <span class="text-slate-650">•</span>
                                    <span class="font-medium text-slate-300">R{pick.round}</span>
                                    <span class="text-slate-650">•</span>
                                    <span class="uppercase">{pick.team || 'FA'}</span>
                                    <span class="text-slate-650">•</span>
                                    <span class="text-slate-500">{pick.season}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Right side: Points and grade -->
                        <div class="flex items-center gap-2.5 flex-shrink-0">
                            <div class="text-right">
                                <div class="text-[11px] font-medium text-slate-400">{pick.actualPoints} pts</div>
                            </div>
                            <div class="flex h-8 w-11 items-center justify-center rounded border border-rose-500/20 bg-rose-500/10 font-mono text-sm font-bold text-rose-400 shadow-sm">
                                {pick.grade}
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>