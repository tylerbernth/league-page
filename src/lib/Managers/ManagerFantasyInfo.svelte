<script>
    export let viewManager, players, changeManager;

    const getPositionColor = (pos) => {
        switch (pos) {
            case 'QB': return 'bg-rose-600/90 text-white';
            case 'RB': return 'bg-emerald-600/90 text-white';
            case 'WR': return 'bg-sky-600/90 text-white';
            case 'TE': return 'bg-amber-600/90 text-white';
            case 'K': return 'bg-purple-600/90 text-white';
            case 'DEF': return 'bg-indigo-600/90 text-white';
            case 'Picks': return 'bg-lime-600/90 text-white';
            default: return 'bg-slate-700 text-slate-100';
        }
    };

    const handlePlayerImgError = (e) => {
        e.target.src = 'https://sleepercdn.com/images/v2/icons/player_default.png';
    };

    const handleGenericImgError = (e) => {
        e.target.src = '/managers/question.jpg';
    };
</script>

<div class="mx-auto my-8 flex w-full max-w-6xl flex-wrap justify-around rounded-2xl border border-indigo-500/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md">
    <!-- Rookie or Vets -->
    {#if viewManager.rookieOrVets}
        <div class="m-3 flex w-24 sm:w-28 flex-col items-center text-center">
            <div class="flex h-8 w-full items-center justify-center text-[11px] font-bold text-indigo-400 leading-tight">
                Rookie or Vet
            </div>
            <div class="mt-2 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-800 shadow-inner">
                <img 
                    class="h-12 w-auto object-contain" 
                    src="/{viewManager.rookieOrVets}.png" 
                    alt="rookie or vet preference"
                    onerror={handleGenericImgError}
                />
            </div>
            <div class="mt-2 text-xs text-slate-400 capitalize leading-tight">
                {viewManager.rookieOrVets}
            </div>
        </div>
    {/if}

    <!-- Favorite Fantasy Asset -->
    {#if viewManager.valuePosition}
        <div class="m-3 flex w-24 sm:w-28 flex-col items-center text-center">
            <div class="flex h-8 w-full items-center justify-center text-[11px] font-bold text-indigo-400 leading-tight">
                Favorite Asset
            </div>
            <div class="mt-2 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center overflow-hidden rounded-full border border-slate-700 shadow-md {getPositionColor(viewManager.valuePosition)}">
                <span class="text-xl sm:text-2xl font-black">{viewManager.valuePosition}</span>
            </div>
            <div class="mt-2 text-xs text-slate-400 capitalize leading-tight">
                {viewManager.valuePosition}
            </div>
        </div>
    {/if}

    <!-- Desire to Trade -->
    {#if viewManager.tradingScale}
        <div class="m-3 flex w-24 sm:w-28 flex-col items-center text-center">
            <div class="flex h-8 w-full items-center justify-center text-[11px] font-bold text-indigo-400 leading-tight">
                Trade Frequency
            </div>
            <div class="mt-2 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-800 shadow-inner">
                <span class="text-2xl sm:text-3xl font-black text-indigo-400">{viewManager.tradingScale}</span>
            </div>
            <div class="mt-2 text-xs text-slate-400 leading-tight">
                {viewManager.tradingScale} / 10
            </div>
        </div>
    {/if}

    <!-- Favorite Player -->
    {#if viewManager.favoritePlayer}
        <div class="m-3 flex w-24 sm:w-28 flex-col items-center text-center">
            <div class="flex h-8 w-full items-center justify-center text-[11px] font-bold text-indigo-400 leading-tight">
                Favorite Player
            </div>
            <div class="mt-2 flex h-16 w-16 sm:h-20 sm:w-20 items-end justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-800 shadow-inner">
                <img 
                    class="h-14 sm:h-18 w-auto object-cover" 
                    src="https://sleepercdn.com/content/nfl/players/thumb/{viewManager.favoritePlayer}.jpg" 
                    alt="favorite player"
                    onerror={handlePlayerImgError}
                />
            </div>
            <div class="mt-2 text-xs text-slate-400 leading-tight">
                {players[viewManager.favoritePlayer]?.fn || ''} {players[viewManager.favoritePlayer]?.ln || ''}
            </div>
        </div>
    {/if}

    <!-- Rebuild Mode -->
    {#if viewManager.mode}
        <div class="m-3 flex w-24 sm:w-28 flex-col items-center text-center">
            <div class="flex h-8 w-full items-center justify-center text-[11px] font-bold text-indigo-400 leading-tight">
                Team Strategy
            </div>
            <div class="mt-2 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-800 shadow-inner">
                <img 
                    class="h-12 sm:h-16 w-auto object-contain" 
                    src="/{viewManager.mode}.png" 
                    alt="win now or rebuild"
                    onerror={handleGenericImgError}
                />
            </div>
            <div class="mt-2 text-xs text-slate-400 capitalize leading-tight">
                {viewManager.mode}
            </div>
        </div>
    {/if}

    <!-- Rival -->
    {#if viewManager.rival}
        <button 
            type="button"
            class="group m-3 flex w-24 sm:w-28 flex-col items-center text-center focus:outline-none"
            onclick={() => changeManager(viewManager.rival.link)}
        >
            <div class="flex h-8 w-full items-center justify-center text-[11px] font-bold text-indigo-400 group-hover:text-cyan-400 transition-colors leading-tight">
                Rival
            </div>
            <div class="mt-2 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-800 shadow-md ring-2 ring-transparent transition-all group-hover:scale-105 group-hover:border-cyan-500/50 group-hover:ring-cyan-500/20">
                <img 
                    class="h-full w-full object-cover" 
                    src="{viewManager.rival.image}" 
                    alt="rival"
                    onerror={handleGenericImgError}
                />
            </div>
            <div class="mt-2 text-xs font-medium text-slate-300 group-hover:text-cyan-400 transition-colors leading-tight">
                {viewManager.rival.name}
            </div>
        </button>
    {/if}
</div>