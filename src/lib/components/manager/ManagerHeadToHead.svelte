<script>
    import { onMount } from 'svelte';
    import { calculateHeadToHeadHistory } from '$lib/utils/headToHead';
    import LinearProgress from '@smui/linear-progress';

    export let currentManagerId = '';

    let loading = true;
    let error = null;
    let headToHeadRecords = [];

    onMount(async () => {
        try {
            if (!currentManagerId) {
                loading = false;
                return;
            }
            headToHeadRecords = await calculateHeadToHeadHistory(currentManagerId);
        } catch (err) {
            console.error('Failed to load head-to-head records:', err);
            error = 'Could not compile matchup history.';
        } finally {
            loading = false;
        }
    });
</script>

<div class="mx-auto mb-16 w-full max-w-6xl rounded-2xl border border-slate-700/50 bg-slate-900/85 p-6 shadow-2xl backdrop-blur-md">
    <div class="mb-6 pb-4 border-b border-slate-800 flex items-center justify-between">
        <div>
            <h3 class="text-xl font-bold tracking-tight text-slate-100">All-Time Head-to-Head Records</h3>
            <p class="text-xs text-slate-400 mt-1">Lifetime regular-season and playoff matchup history across all league years.</p>
        </div>
    </div>

    {#if loading}
        <div class="mx-auto my-12 w-[85%] max-w-lg text-center text-slate-400">
            <p class="mb-3 text-sm">Compiling historical head-to-head games...</p>
            <LinearProgress indeterminate />
        </div>
    {:else if error}
        <div class="rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-center text-red-300 text-xs">
            {error}
        </div>
    {:else if headToHeadRecords.length === 0}
        <div class="py-8 text-center text-slate-500 text-xs italic">
            No historical matchup data found for this manager.
        </div>
    {:else}
        <!-- Grid layout matching the style of Team Awards & Records cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {#each headToHeadRecords as record}
                {@const avgPf = record.totalGames ? (record.pf / record.totalGames).toFixed(1) : '0.0'}
                {@const avgPa = record.totalGames ? (record.pa / record.totalGames).toFixed(1) : '0.0'}
                
                <a href="/manager?manager={record.managerIndex}" class="rounded-xl border border-slate-700/60 bg-slate-950/60 p-4 flex flex-col items-center text-center shadow-md transition-all hover:border-indigo-500/50 hover:bg-slate-900/80 hover:scale-[1.02] group">
                    <!-- Larger Category/Name Label -->
                    <span class="text-xs font-bold uppercase tracking-wider text-indigo-400 group-hover:text-indigo-300 transition-colors mb-3 min-h-[2.5rem] flex items-center justify-center leading-tight">
                        {record.opponentName}
                    </span>

                    <!-- Larger Centered Manager Photo -->
                    <div class="mb-3">
                        {#if record.opponentAvatar}
                            <img src={record.opponentAvatar} alt={record.opponentName} class="h-20 w-20 rounded-full object-cover border-2 border-slate-700 group-hover:border-indigo-500/60 transition-colors bg-slate-900 shadow-inner" />
                        {:else}
                            <div class="h-20 w-20 rounded-full bg-slate-900 border-2 border-slate-700 group-hover:border-indigo-500/60 transition-colors flex items-center justify-center text-xl text-slate-300 font-bold shadow-inner">
                                {record.opponentName.charAt(0)}
                            </div>
                        {/if}
                    </div>

                    <!-- Record Value -->
                    <span class="text-sm font-mono font-bold text-slate-100 mb-1">
                        <span class="text-emerald-400">{record.wins}</span>-<span class="text-rose-400">{record.losses}</span>{#if record.ties > 0}-{record.ties}{/if}
                    </span>

                    <!-- Secondary Info (Win % & Subtitle) -->
                    <span class="text-[11px] font-mono text-indigo-300 font-medium mb-1">
                        {(record.winPct * 100).toFixed(1)}% Win Rate
                    </span>

                    <span class="text-[10px] font-mono text-slate-400 mt-auto pt-2 border-t border-slate-800/80 w-full">
                        PF: {avgPf} | PA: {avgPa}
                    </span>
                </a>
            {/each}
        </div>
    {/if}
</div>