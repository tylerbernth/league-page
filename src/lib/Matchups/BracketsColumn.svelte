<script>
	import { round } from "$lib/utils/helper";
	import { getAvatarFromTeamManagers, getTeamNameFromTeamManagers } from "$lib/utils/helperFunctions/universalFunctions";

	export let leagueTeamManagers, players, matchCol = [], playoffsStart, ix, playoffLength, consolation = false, losers = false, numRosters, consolationNum, selected;

	let label = '';

	const setLabel = (l) => {
		if (!matchCol) return;
		if (matchCol.length > 1) {
			switch (playoffLength - ix) {
				case 1:
					label = losers ? 'Toilet Bowl' : 'Championship Match';
					break;
				case 2:
					label = 'Semifinals';
					break;
				case 3:
					label = 'Quarterfinals';
					break;
				case 4:
					label = 'Eighth-Finals';
					break;
				default:
					label = `Round ${ix + 1}`;
					break;
			}
		} else {
			if (!consolation) {
				label = losers ? 'Toilet Bowl' : 'Championship Match';
				return;
			}
			if (losers) {
				label = nThPlace(numRosters - (2 * (consolationNum + 1)));
			} else {
				label = nThPlace(1 + (2 * (consolationNum + 1)));
			}
		}
	};

	const nThPlace = (num) => {
		let end = 'th';
		switch (num % 10) {
			case 3:
				if (num % 100 !== 13) end = 'rd';
				break;
			case 2:
				if (num % 100 !== 12) end = 'nd';
				break;
			case 1:
				if (num % 100 !== 11) end = 'st';
				break;
			default:
				break;
		}
		return `${num}${end} Place`;
	};

	$: setLabel(losers);

	let elementNode;
	let matchNodes = [];
	let connectorLines = [];

	const updateConnectors = () => {
		if (!elementNode || !Array.isArray(matchCol) || matchCol.length < 2) {
			connectorLines = [];
			return;
		}

		const lines = [];
		const containerRect = elementNode.getBoundingClientRect();

		const nextColumnEl = elementNode.nextElementSibling;
		let targetX = null;

		if (nextColumnEl) {
			const nextCard = nextColumnEl.querySelector('.match-card');
			if (nextCard) {
				targetX = nextCard.getBoundingClientRect().left - containerRect.left;
			}
		}

		const cardRect = matchNodes[0]?.getBoundingClientRect();
		const fallbackEnd = cardRect ? (cardRect.right - containerRect.left + 60) : 0;

		for (let i = 0; i < matchCol.length; i += 2) {
			const topMatch = matchNodes[i];
			const bottomMatch = matchNodes[i + 1];

			if (topMatch && bottomMatch) {
				const topRect = topMatch.getBoundingClientRect();
				const bottomRect = bottomMatch.getBoundingClientRect();

				const xStart = topRect.right - containerRect.left;
				const xEnd = targetX !== null ? targetX : fallbackEnd;
				const xMid = xStart + (xEnd - xStart) / 2;

				const yTop = (topRect.top + topRect.bottom) / 2 - containerRect.top;
				const yBottom = (bottomRect.top + bottomRect.bottom) / 2 - containerRect.top;
				const yMid = (yTop + yBottom) / 2;

				lines.push({ xStart, xMid, xEnd, yTop, yBottom, yMid });
			}
		}
		connectorLines = lines;
	};

	let innerWidth, innerHeight;
	$: if (elementNode || innerWidth || innerHeight || matchCol) {
		setTimeout(updateConnectors, 50);
	}

	const getPair = (m) => {
		if (!m) return [{ roster_id: null }, { roster_id: null }];
		if (Array.isArray(m)) return m;
		return [
			{ roster_id: m.t1 || m.home || m.roster_id, points: m.t1_points || m.points, starters: m.t1_starters || m.starters, m: m.m, r: m.r },
			{ roster_id: m.t2 || m.away, points: m.t2_points, starters: m.t2_starters, m: m.m, r: m.r }
		];
	};

	const isBye = (m) => {
		if (!m) return false;
		if (Array.isArray(m)) return m.bye || m[0]?.bye || false;
		return m.bye || false;
	};

	const getMatchId = (m) => {
		if (!m) return null;
		if (Array.isArray(m)) return m[0]?.m || null;
		return m.m || null;
	};

	const getPlayoffName = (manager, bye, season) => {
		if (bye && !manager) return 'BYE';
		if (!manager) return 'TBD';
		return getTeamNameFromTeamManagers(leagueTeamManagers, manager, season);
	};

	const calculatePoints = (allPoints) => {
		if (!allPoints) return 0;
		if (typeof allPoints === 'number') return round(allPoints);
		let totalPoints = 0;
		for (const k in allPoints) {
			const points = allPoints[k];
			if (!points) continue;
			if (typeof points === 'number') {
				totalPoints += points;
			} else if (Array.isArray(points)) {
				for (const point of points) {
					totalPoints += point;
				}
			}
		}
		return round(totalPoints);
	};

	const calculatePotentialPoints = (startersWeeks, roundIx, p) => {
		if (!startersWeeks || !p) return 0;
		let totalPoints = 0;

		if (Array.isArray(startersWeeks)) {
			for (const starter of startersWeeks) {
				totalPoints += parseFloat(p[starter]?.wi && p[starter].wi[playoffsStart - roundIx]?.p ? p[starter].wi[playoffsStart - roundIx].p : 0);
			}
			return round(totalPoints);
		}

		for (const k in startersWeeks) {
			const starters = startersWeeks[k];
			if (!starters || !Array.isArray(starters)) continue;
			const i = roundIx + parseInt(k) - 1;
			for (const starter of starters) {
				totalPoints += parseFloat(p[starter]?.wi && p[starter].wi[playoffsStart - i]?.p ? p[starter].wi[playoffsStart - i].p : 0);
			}
		}
		return round(totalPoints);
	};

	const changeSelection = (matchups) => {
		const mId = getMatchId(matchups);
		if (!mId || mId == selected) return;
		selected = mId;
	};
</script>

<svelte:window bind:innerWidth bind:innerHeight on:resize={updateConnectors} />

<div class="relative flex flex-col justify-around items-center flex-grow font-sans py-8 min-h-[320px]" bind:this={elementNode}>
	{#if matchCol && matchCol.length}
		<p class="absolute top-0 text-center text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400/90 whitespace-nowrap">
			{label}
		</p>
	{/if}

	<!-- BACKGROUND CONNECTOR LINES -->
	{#if connectorLines.length > 0}
		<svg class="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
			{#each connectorLines as line}
				<line x1={line.xStart} y1={line.yTop} x2={line.xMid} y2={line.yTop} stroke="#38bdf8" stroke-width="2" opacity="0.7" />
				<line x1={line.xStart} y1={line.yBottom} x2={line.xMid} y2={line.yBottom} stroke="#38bdf8" stroke-width="2" opacity="0.7" />
				<line x1={line.xMid} y1={line.yTop} x2={line.xMid} y2={line.yBottom} stroke="#38bdf8" stroke-width="2" opacity="0.7" />
				<line x1={line.xMid} y1={line.yMid} x2={line.xEnd} y2={line.yMid} stroke="#38bdf8" stroke-width="2" opacity="0.7" />
			{/each}
		</svg>
	{/if}

	<!-- MATCH CARDS -->
	{#each matchCol || [] as matchups, inx}
		{@const pair = getPair(matchups)}
		{@const matchId = getMatchId(matchups)}
		{@const byeMatch = isBye(matchups)}

		<button 
			type="button"
			bind:this={matchNodes[inx]}
			class="match-card w-[140px] sm:w-[180px] md:w-[220px] lg:w-[250px] my-4 mx-4 sm:mx-6 z-10 rounded-xl border transition-all duration-300 backdrop-blur-md overflow-hidden relative text-left p-0
			{matchId == selected 
				? 'bg-slate-900/95 border-blue-500 shadow-[0_0_18px_rgba(59,130,246,0.4)] ring-1 ring-blue-500/50' 
				: 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700/80 shadow-lg'
			}
			{matchId ? 'cursor-pointer hover:scale-[1.02]' : ''}"
			on:click={() => changeSelection(matchups)}
		>
			{#each pair as matchup, idx}
				<div class="flex flex-col p-2 sm:p-2.5 {idx === 0 ? 'border-b border-slate-800/60' : ''}">
					<div class="flex items-center justify-between w-full">
						<div class="flex items-center gap-1.5 sm:gap-2 min-w-0 grow">
							{#if matchup.roster_id || (!byeMatch && !matchup.roster_id)}
								<img 
									class="h-6 w-6 sm:h-7 sm:w-7 rounded-full border border-slate-700/80 object-cover shrink-0 bg-slate-800
									{!byeMatch && !matchup.roster_id ? 'opacity-30 border-none': ''}" 
									src={getAvatarFromTeamManagers(leagueTeamManagers, matchup.roster_id, leagueTeamManagers?.currentYear)} 
									alt="team avatar" 
								/>
							{/if}

							<div class="text-xs sm:text-sm font-semibold truncate text-slate-200 {byeMatch && !matchup.roster_id ? 'text-slate-500 italic font-normal': ''}">
								{getPlayoffName(matchup.roster_id, byeMatch, leagueTeamManagers?.currentYear)}
							</div>
						</div>

						{#if matchup.roster_id}
							<div class="text-right shrink-0 ml-1.5">
								<div class="text-xs sm:text-sm font-bold text-slate-100 leading-tight">
									{calculatePoints(matchup.points)}
								</div>
								<div class="text-[9px] text-slate-400/80 italic leading-tight">
									Proj {calculatePotentialPoints(matchup.starters, ix, players)}
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</button>
	{:else}
		<div class="w-[140px] sm:w-[180px] md:w-[220px] lg:w-[250px] my-4 mx-4 sm:mx-6 h-20"></div>
	{/each}
</div>