<script>
	import { round } from '$lib/utils/helper';
	import { getTeamFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';

	export let matchup, players, active, ix, displayWeek, expandOverride = false, matchupWeek, leagueTeamManagers, year;

	let home = matchup[0];
	let away = matchup[1];

	let homePointsTotal = 0;
	let homeProjectionTotal = 0;
	let awayPointsTotal = 0;
	let awayProjectionTotal = 0;

	let winning = "home";

	const digestStarters = (x, p) => {
		home = matchup[0];
		away = matchup[1];
		
		const targetYear = year || leagueTeamManagers?.currentYear;
		home.manager = getTeamFromTeamManagers(leagueTeamManagers, home.roster_id, targetYear);
		away.manager = getTeamFromTeamManagers(leagueTeamManagers, away.roster_id, targetYear);

		const homeStarters = matchupWeek ? home.starters[matchupWeek] : home.starters;
		const awayStarters = matchupWeek ? away.starters[matchupWeek] : away.starters;
		const homePoints = matchupWeek ? home.points[matchupWeek] : home.points;
		const awayPoints = matchupWeek ? away.points[matchupWeek] : away.points;

		homePointsTotal = 0;
		homeProjectionTotal = 0;
		awayPointsTotal = 0;
		awayProjectionTotal = 0;

		const localStarters = [];
		if (homeStarters) {
			for (let i = 0; i < homeStarters.length; i++) {
				const hPoint = homePoints ? homePoints[i] : 0;
				const aPoint = awayPoints ? awayPoints[i] : 0;
				homePointsTotal += hPoint;
				awayPointsTotal += aPoint;

				const homePlayer = digestStarter(homeStarters[i], hPoint);
				const awayStarter = awayStarters ? awayStarters[i] : null;
				const awayPlayer = digestStarter(awayStarter, aPoint);

				homeProjectionTotal += homePlayer.projection;
				awayProjectionTotal += awayPlayer ? awayPlayer.projection : 0;
				localStarters.push({ home: homePlayer, away: awayPlayer });
			}
		}
		
		if (awayPointsTotal < homePointsTotal) winning = "home";
		if (awayPointsTotal > homePointsTotal) winning = "away";
		if (awayPointsTotal == homePointsTotal) winning = "tied";

		starters = localStarters;
	};

	const digestStarter = (starter, points) => {
		if (!starter || starter == 0) {
			return {
				name: "Empty",
				avatar: null,
				poss: null,
				team: null,
				opponent: null,
				projection: 0,
				points: 0,
			};
		}
		const player = players[starter] || {};
		let name = player.pos == "DEF" ? player.ln : `${player.fn ? player.fn[0] : ''}. ${player.ln || ''}`;
		let projection = 0;
		if (player.wi && player.wi[displayWeek]) {
			projection = parseFloat(player.wi[displayWeek].p);
		}
		return {
			name,
			avatar: player.pos == "DEF" 
				? `background-image: url(https://sleepercdn.com/images/team_logos/nfl/${starter.toLowerCase()}.png)` 
				: `background-image: url(https://sleepercdn.com/content/nfl/players/thumb/${starter}.jpg), url(https://sleepercdn.com/images/v2/icons/player_default.webp)`,
			pos: player.pos,
			team: player.t,
			opponent: player.wi && player.wi[displayWeek] ? player.wi[displayWeek].o : null,
			projection,
			points,
		};
	};

	let starters;

	$: digestStarters(ix, players, matchupWeek);

	let el;

	$: top = el?.getBoundingClientRect() ? el?.getBoundingClientRect().top : 0;

	const expandClose = () => {
		if (expandOverride) return;
		active = active == ix ? null : ix;
		setTimeout(() => {
			window.scrollTo({ left: 0, top, behavior: 'smooth' });
		}, 200);
	};

	let innerWidth;

	const calcHeight = () => {
		let multiplier = 73;
		if (innerWidth < 500) multiplier = 72;
		if (innerWidth < 410) multiplier = 71;
		const startersLength = matchupWeek ? home.starters[matchupWeek]?.length : home.starters?.length;
		return (startersLength || 0) * multiplier + 42;
	};
</script>

<svelte:window bind:innerWidth={innerWidth} />

<div class="w-full max-w-xl mx-auto my-3.5 select-none font-sans">
	<!-- HEADER SCORE CARD -->
	<div 
		class="relative flex h-16 w-full rounded-2xl overflow-hidden border border-slate-700/60 shadow-xl cursor-pointer transition-all duration-300 hover:border-slate-500/80 hover:shadow-2xl hover:scale-[1.008] bg-slate-950/80 backdrop-blur-md group"
		on:click={expandClose}
		bind:this={el}
	>
		<!-- HOME TEAM (Blue Side) -->
		<div 
			class="relative flex items-center justify-between w-[54%] pl-3.5 pr-8 transition-all duration-500 bg-gradient-to-r {winning === 'home' ? 'from-blue-900 to-blue-950' : 'from-slate-900 to-blue-950/60'}"
			style="clip-path: polygon(0 0, 100% 0, 87% 100%, 0 100%);"
		>
			<div class="relative shrink-0">
				<img class="h-10 w-10 rounded-full border-2 border-slate-400/20 object-cover shadow-inner group-hover:border-blue-400/40 transition-colors" src={home?.manager?.avatar} alt="home team avatar" />
				{#if winning === "home"}
					<span class="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-black font-extrabold shadow-sm">✓</span>
				{/if}
			</div>

			<div class="mx-2.5 text-xs sm:text-sm font-bold tracking-tight text-slate-100 truncate grow text-left drop-shadow-sm">{home?.manager?.name || 'Team 1'}</div>
			
			<div class="text-right shrink-0 pr-1">
				<div class="text-sm sm:text-lg font-black text-white tracking-tight leading-none drop-shadow">{round(homePointsTotal)}</div>
				<div class="text-[10px] text-blue-200/60 font-medium italic leading-tight mt-0.5">Proj {round(homeProjectionTotal)}</div>
			</div>
		</div>

		<!-- AWAY TEAM (Red Side) -->
		<div 
			class="relative flex items-center justify-between w-[54%] -ml-[8%] pr-3.5 pl-8 transition-all duration-500 bg-gradient-to-r {winning === 'away' ? 'from-red-950 to-red-900' : 'from-red-950/60 to-slate-900'}"
			style="clip-path: polygon(13% 0, 100% 0, 100% 100%, 0 100%);"
		>
			<div class="text-left shrink-0 pl-1">
				<div class="text-sm sm:text-lg font-black text-white tracking-tight leading-none drop-shadow">{round(awayPointsTotal)}</div>
				<div class="text-[10px] text-red-200/60 font-medium italic leading-tight mt-0.5">Proj {round(awayProjectionTotal)}</div>
			</div>

			<div class="mx-2.5 text-xs sm:text-sm font-bold tracking-tight text-slate-100 truncate grow text-right drop-shadow-sm">{away?.manager?.name || 'Team 2'}</div>

			<div class="relative shrink-0">
				<img class="h-10 w-10 rounded-full border-2 border-slate-400/20 object-cover shadow-inner group-hover:border-red-400/40 transition-colors" src={away?.manager?.avatar} alt="away team avatar" />
				{#if winning === "away"}
					<span class="absolute -bottom-1 -left-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-black font-extrabold shadow-sm">✓</span>
				{/if}
			</div>
		</div>
	</div>

	<!-- EXPANDABLE STARTERS ROSTER -->
	<div 
		class="relative overflow-hidden transition-all duration-300 ease-in-out bg-slate-900/95 backdrop-blur-lg rounded-b-2xl border-x border-b border-slate-800/80 shadow-2xl mt-[-4px] pt-1"
		style="max-height: {active == ix ? calcHeight() + 'px' : '0'}; {active != ix ? 'border: none' : ''};"
	>
		{#if starters}
			{#each starters as player}
				<div class="relative flex justify-between items-center min-h-[46px] sm:min-h-[50px] border-t border-slate-800/60 hover:bg-slate-800/30 px-2 sm:px-3 text-xs sm:text-sm transition-colors">
					<!-- HOME PLAYER -->
					<div class="relative w-[46%] flex items-center justify-start gap-1.5 sm:gap-2 pr-12">
						{#if player.home.pos}
							<span class="pos-badge {player.home.pos} shadow-sm">{player.home.pos}</span>
						{/if}

						{#if player.home.avatar}
							<div class="relative h-9 w-9 sm:h-10 sm:w-10 bg-center bg-no-repeat bg-contain shrink-0 drop-shadow-md" style="{player.home.avatar}">
								{#if player.home.team && player.home.pos != "DEF"}
									<img src="https://sleepercdn.com/images/team_logos/nfl/{player.home.team.toLowerCase()}.png" class="absolute top-0 -right-1.5 h-3.5 w-3.5 object-contain" alt="team logo"/>
								{/if}
							</div>
						{/if}

						<div class="truncate text-left">
							<div class="font-semibold text-slate-100 truncate {player.home.name == 'Empty' ? 'italic text-slate-500' : ''}">
								{player.home.name}
							</div>
							{#if player.home.team}
								<div class="text-[10px] text-slate-400/80 font-medium">
									{player.home.pos != "DEF" ? `${player.home.team} ` : ""}
									{player.home.opponent ? `vs ${player.home.opponent}` : ''}
								</div>
							{/if}
						</div>

						<div class="absolute right-1 text-right">
							<div class="font-extrabold text-slate-100 leading-none">{round(player.home.points)}</div>
							<div class="text-[9px] text-slate-400/80 italic mt-0.5">{round(player.home.projection)}</div>
						</div>
					</div>

					<!-- MIDLINE GLOW DIVIDER -->
					<div class="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800 -translate-x-1/2 opacity-75"></div>

					<!-- AWAY PLAYER -->
					<div class="relative w-[46%] flex items-center justify-end gap-1.5 sm:gap-2 pl-12 text-right">
						<div class="absolute left-1 text-left">
							<div class="font-extrabold text-slate-100 leading-none">{round(player.away.points)}</div>
							<div class="text-[9px] text-slate-400/80 italic mt-0.5">{round(player.away.projection)}</div>
						</div>

						<div class="truncate text-right">
							<div class="font-semibold text-slate-100 truncate {player.away.name == 'Empty' ? 'italic text-slate-500' : ''}">
								{player.away.name}
							</div>
							{#if player.away.team}
								<div class="text-[10px] text-slate-400/80 font-medium">
									{player.away.opponent ? `${player.away.opponent} vs ` : ''}
									{player.away.pos != "DEF" ? player.away.team : ""}
								</div>
							{/if}
						</div>

						{#if player.away.avatar}
							<div class="relative h-9 w-9 sm:h-10 sm:w-10 bg-center bg-no-repeat bg-contain shrink-0 drop-shadow-md" style="{player.away.avatar}">
								{#if player.away.team && player.away.pos != "DEF"}
									<img src="https://sleepercdn.com/images/team_logos/nfl/{player.away.team.toLowerCase()}.png" class="absolute top-0 -left-1.5 h-3.5 w-3.5 object-contain" alt="team logo"/>
								{/if}
							</div>
						{/if}

						{#if player.away.pos}
							<span class="pos-badge {player.away.pos} shadow-sm">{player.away.pos}</span>
						{/if}
					</div>
				</div>
			{/each}
		{/if}

		{#if !expandOverride}
			<button 
				type="button"
				class="w-full py-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[11px] font-bold tracking-widest uppercase transition-all text-center border-t border-slate-800/80" 
				on:click={expandClose}
			>
				Close Matchup
			</button>
		{/if}
	</div>
</div>

<style>
	.pos-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		width: 28px;
		height: 22px;
		font-size: 10px;
		font-weight: 800;
		color: #ffffff;
		flex-shrink: 0;
		letter-spacing: -0.2px;
	}

	:global(.QB) { background-color: var(--QB, #e11d48); }
	:global(.RB) { background-color: var(--RB, #16a34a); }
	:global(.WR) { background-color: var(--WR, #0284c7); }
	:global(.TE) { background-color: var(--TE, #d97706); }
	:global(.K) { background-color: var(--K, #9333ea); }
	:global(.DEF) { background-color: var(--DEF, #78350f); }
	:global(.DL), :global(.DE), :global(.DT) { background-color: var(--DL, #27272a); }
	:global(.LB) { background-color: var(--LB, #3f3f46); }
	:global(.DB), :global(.CB), :global(.SS), :global(.FS) { background-color: var(--DB, #52525b); }

	:global(.FLEX) {
		background: linear-gradient(135deg, var(--WR, #0284c7) 0%, var(--RB, #16a34a) 50%, var(--TE, #d97706) 100%);
	}
	:global(.WRRB) {
		background: linear-gradient(135deg, var(--WR, #0284c7) 0%, var(--RB, #16a34a) 100%);
	}
	:global(.IDP) {
		background: linear-gradient(135deg, var(--DL, #27272a) 0%, var(--LB, #3f3f46) 50%, var(--DB, #52525b) 100%);
	}
</style>