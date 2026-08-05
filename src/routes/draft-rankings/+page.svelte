<script>
  import DraftValueLeaderboard from '$lib/components/DraftValueLeaderboard.svelte';
  export let data;

  $: availableSeasons = data.seasons 
    ? Object.keys(data.seasons).sort((a, b) => b.localeCompare(a)) 
    : [data.season || '2025'];

  let selectedSeason = '';
  $: if (!availableSeasons.includes(selectedSeason)) {
    selectedSeason = availableSeasons[0];
  }

  let isSeasonDropdownOpen = false;
  $: currentSeasonData = data.seasons ? (data.seasons[selectedSeason] || data) : data;

  function handleOutsideClick(event) {
    if (!event.target.closest('#season-dropdown-container')) {
      isSeasonDropdownOpen = false;
    }
  }
</script>

<svelte:window on:click={handleOutsideClick} />

<div class="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 font-sans">
  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-xl gap-4">
    <div>
      <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight">League Draft History</h1>
      <p class="text-xs sm:text-sm text-slate-400 mt-1">Review draft value and ROI across historical seasons automatically.</p>
    </div>
    
    {#if availableSeasons.length > 0}
      <div id="season-dropdown-container" class="relative">
        <button 
          type="button"
          on:click={() => isSeasonDropdownOpen = !isSeasonDropdownOpen}
          class="flex items-center gap-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 transition-all shadow-md focus:outline-none focus:border-indigo-500 min-w-[150px] justify-between"
        >
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400 uppercase tracking-wider font-semibold">Season:</span>
            <span class="font-bold text-white text-sm">{selectedSeason}</span>
          </div>
          <svg class="w-4 h-4 text-slate-400 transition-transform {isSeasonDropdownOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {#if isSeasonDropdownOpen}
          <div class="absolute right-0 mt-2 w-full min-w-[160px] bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden py-1">
            {#each availableSeasons as season}
              <button 
                type="button"
                class="w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-600/20 hover:text-indigo-300 transition-colors text-slate-200 flex items-center justify-between {selectedSeason === season ? 'bg-indigo-600/20 text-indigo-400 font-bold' : ''}"
                on:click={() => { selectedSeason = season; isSeasonDropdownOpen = false; }}
              >
                <span>{season} Season</span>
                {#if selectedSeason === season}
                  <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <DraftValueLeaderboard 
    draftPicks={currentSeasonData.draftPicks || []} 
    playerPoints={currentSeasonData.playerPoints || {}} 
    managers={data.managers || []}
    rosterToUserMap={currentSeasonData.rosterToUserMap || {}}
    rosters={currentSeasonData.rosters || []}
  />
</div>