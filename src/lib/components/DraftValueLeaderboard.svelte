<script>
  export let draftPicks = [];      
  export let playerPoints = {};    
  export let managers = [];
  export let rosterToUserMap = {};
  export let rosters = [];

  let sortBy = 'rating'; 
  let sortAsc = false;
  let selectedManager = 'ALL';
  let isDropdownOpen = false;

  $: leagueSize = rosters && rosters.length > 0 ? rosters.length : 12;

  $: hasDraftHappened = draftPicks && draftPicks.length > 0;

  function getExpectedPoints(pickNo) {
    return Math.max(40, 320 - (pickNo * 2.2));
  }

  function getManagerForPick(pick) {
    const userId = pick.picked_by || (rosterToUserMap ? rosterToUserMap[pick.roster_id] : null);
    if (!userId) return { name: 'Unknown Manager', photo: '/managers/question.png' };

    const matchedManager = managers.find(m => m.managerID === userId);
    if (matchedManager) {
      return {
        name: matchedManager.name,
        photo: matchedManager.photo || '/managers/question.png'
      };
    }

    return { name: 'Unknown Manager', photo: '/managers/question.png' };
  }

  function getPositionStyle(position) {
    switch (position?.toUpperCase()) {
      case 'QB':
        return 'bg-rose-600 text-white font-bold shadow-sm';
      case 'RB':
        return 'bg-emerald-500 text-white font-bold shadow-sm';
      case 'WR':
        return 'bg-sky-500 text-white font-bold shadow-sm';
      case 'TE':
        return 'bg-amber-500 text-white font-bold shadow-sm';
      case 'K':
        return 'bg-pink-500 text-white font-bold shadow-sm';
      case 'DEF':
      case 'DL':
      case 'LB':
      case 'DB':
        return 'bg-teal-600 text-white font-bold shadow-sm';
      case 'FLEX':
        return 'bg-teal-500 text-white font-bold shadow-sm';
      default:
        return 'bg-slate-700 text-white font-bold shadow-sm';
    }
  }

  $: rawPicks = (draftPicks || []).map(pick => {
    const playerId = pick.player_id;
    const pickNo = pick.pick_no;
    
    const firstName = pick.first_name || pick.metadata?.first_name || '';
    const lastName = pick.last_name || pick.metadata?.last_name || '';
    const playerName = (firstName || lastName) ? `${firstName} ${lastName}` : `Player ID: ${playerId}`;
    
    const position = pick.position || pick.metadata?.position || 'FLEX';
    const team = pick.team || pick.metadata?.team || 'FA';
    
    const manager = getManagerForPick(pick);
    const actualPoints = playerPoints[playerId] || 0.0;
    const expectedPoints = getExpectedPoints(pickNo);
    const rawScore = actualPoints - expectedPoints;

    return {
      pickNo,
      playerName: playerName.trim(),
      position,
      team,
      managerName: manager.name,
      managerPhoto: manager.photo,
      actualPoints,
      rawScore
    };
  });

  $: rawScores = rawPicks.map(p => p.rawScore);
  $: maxScore = rawScores.length ? Math.max(...rawScores, 1) : 1;
  $: minScore = rawScores.length ? Math.min(...rawScores, -1) : -1;

  $: processedPicks = rawPicks.map(pick => {
    let normalized = maxScore === minScore ? 5 : ((pick.rawScore - minScore) / (maxScore - minScore)) * 10;
    let rating = Math.max(0, Math.min(10, normalized));

    return {
      ...pick,
      rating: rating.toFixed(1)
    };
  });

  $: filteredPicks = processedPicks.filter(pick => {
    if (selectedManager === 'ALL') return true;
    return pick.managerName === selectedManager;
  });

  $: sortedPicks = [...filteredPicks].sort((a, b) => {
    let modifier = sortAsc ? 1 : -1;
    if (sortBy === 'rating') return (Number(b.rating) - Number(a.rating)) * modifier;
    if (sortBy === 'points') return (b.actualPoints - a.actualPoints) * modifier;
    return (a.pickNo - b.pickNo) * modifier;
  });

  function setSort(criteria) {
    if (sortBy === criteria) {
      sortAsc = !sortAsc;
    } else {
      sortBy = criteria;
      sortAsc = criteria === 'pick';
    }
  }

  function handleOutsideClick(event) {
    if (!event.target.closest('#manager-dropdown-container')) {
      isDropdownOpen = false;
    }
  }
</script>

<svelte:window on:click={handleOutsideClick} />

<div class="w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl text-slate-100 font-sans">
  <!-- Header / Controls Container -->
  <div class="p-4 sm:p-6 border-b border-slate-800 flex flex-col gap-4">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
      <div>
        <h2 class="text-base sm:text-lg font-bold tracking-tight text-white">
          Draft Value Leaderboard
        <p class="text-xs text-slate-400 mt-0.5">Normalized 0–10 grading scale evaluating actual production vs. draft capital.</p>
      </div>
    </div>
    
    <!-- Filter and Sort Controls -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs pt-1">
      <!-- Manager Selector -->
      <div id="manager-dropdown-container" class="relative w-full sm:w-auto">
        <button 
          type="button" 
          on:click={() => isDropdownOpen = !isDropdownOpen}
          class="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 rounded-lg px-3.5 py-2.5 sm:py-1.5 transition-all focus:outline-none focus:border-indigo-500 shadow-sm"
        >
          <div class="flex items-center gap-2 truncate">
            <span class="text-slate-400">Manager:</span>
            <span class="font-medium text-white truncate">{selectedManager === 'ALL' ? 'All Managers' : selectedManager}</span>
          </div>
          <svg class="w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 {isDropdownOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {#if isDropdownOpen}
          <div class="absolute left-0 sm:left-auto sm:right-0 mt-2 w-full sm:w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden py-1 max-h-60 overflow-y-auto">
            <button 
              type="button"
              class="w-full text-left px-4 py-2.5 sm:py-2 hover:bg-indigo-600/20 hover:text-indigo-300 transition-colors text-slate-200 {selectedManager === 'ALL' ? 'bg-indigo-600/15 text-indigo-400 font-semibold' : ''}"
              on:click={() => { selectedManager = 'ALL'; isDropdownOpen = false; }}
            >
              All Managers
            </button>
            {#each managers as m}
              <button 
                type="button"
                class="w-full text-left px-4 py-2.5 sm:py-2 hover:bg-indigo-600/20 hover:text-indigo-300 transition-colors text-slate-200 flex items-center gap-2.5 {selectedManager === m.name ? 'bg-indigo-600/15 text-indigo-400 font-semibold' : ''}"
                on:click={() => { selectedManager = m.name; isDropdownOpen = false; }}
              >
                <img src={m.photo || '/managers/question.png'} alt="" class="w-5 h-5 rounded-full object-cover bg-slate-700 shrink-0" on:error={(e) => e.target.src='/managers/question.png'} />
                <span class="truncate">{m.name}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Sorting Controls -->
      <div class="flex items-center gap-1.5 justify-between sm:justify-end">
        <span class="text-slate-400 mr-1 hidden sm:inline">Sort:</span>
        <button class="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 rounded-lg border transition-all text-center {sortBy === 'rating' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-medium' : 'bg-slate-800/50 border-slate-700 text-slate-300'}" on:click={() => setSort('rating')}>Grade</button>
        <button class="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 rounded-lg border transition-all text-center {sortBy === 'points' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-medium' : 'bg-slate-800/50 border-slate-700 text-slate-300'}" on:click={() => setSort('points')}>Points</button>
        <button class="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 rounded-lg border transition-all text-center {sortBy === 'pick' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-medium' : 'bg-slate-800/50 border-slate-700 text-slate-300'}" on:click={() => setSort('pick')}>Pick #</button>
      </div>
    </div>
  </div>

  <!-- Table View with sticky columns -->
  <div class="overflow-x-auto relative">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="border-b border-slate-800 text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/40">
          <th class="py-3 px-3 sm:px-4 sticky left-0 z-20 bg-slate-950 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">Pick</th>
          <th class="py-3 px-3 sm:px-4">Player</th>
          <th class="py-3 px-3 sm:px-4">Manager</th>
          <th class="py-3 px-3 sm:px-4 text-center">Pos</th>
          <th class="py-3 px-3 sm:px-4 text-right">Points</th>
          <th class="py-3 px-3 sm:px-4 text-right sticky right-0 z-25 bg-slate-950 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">Grade</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-800/60 text-sm">
        {#each sortedPicks as pick}
          <tr class="hover:bg-slate-800/30 transition-colors">
            <!-- Sticky Pick Column (Round.Pick format only) -->
            <td class="py-3 px-3 sm:px-4 font-mono text-xs text-slate-300 font-medium whitespace-nowrap align-middle sticky left-0 z-10 bg-slate-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
              R{Math.ceil(pick.pickNo / leagueSize)}.{(pick.pickNo - 1) % leagueSize + 1}
            </td>

            <!-- Player Column -->
            <td class="py-3 px-3 sm:px-4 align-middle">
              <div class="font-medium text-slate-200 text-xs sm:text-sm leading-snug">{pick.playerName}</div>
              <div class="text-[10px] text-slate-400 mt-0.5">{pick.team}</div>
            </td>

            <!-- Manager Column -->
            <td class="py-3 px-3 sm:px-4 align-middle">
              <div class="flex items-center gap-2">
                <img src={pick.managerPhoto} alt={pick.managerName} class="w-6 h-6 rounded-full object-cover bg-slate-800 border border-slate-700 shrink-0" on:error={(e) => e.target.src='/managers/question.png'} />
                <span class="text-slate-200 font-medium text-xs sm:text-sm truncate">{pick.managerName}</span>
              </div>
            </td>

            <!-- Position Badge -->
            <td class="py-3 px-3 sm:px-4 text-center align-middle whitespace-nowrap">
              <span class="inline-block px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs rounded-md uppercase tracking-wider {getPositionStyle(pick.position)}">{pick.position}</span>
            </td>

            <!-- Points -->
            <td class="py-3 px-3 sm:px-4 text-right font-mono font-medium text-slate-200 text-xs sm:text-sm align-middle whitespace-nowrap">
              {pick.actualPoints.toFixed(1)}
            </td>

            <!-- Sticky Grade Badge Column -->
            <td class="py-3 px-3 sm:px-4 text-right font-mono font-bold align-middle whitespace-nowrap sticky right-0 z-15 bg-slate-900 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">
              <span class="inline-block text-center tabular-nums px-2 py-1 sm:px-2.5 rounded text-xs {Number(pick.rating) >= 7 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : Number(pick.rating) >= 4 ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}">
                {pick.rating}
              </span>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="6" class="py-8 text-center text-slate-500 text-sm">No draft picks match the selected filter.</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>