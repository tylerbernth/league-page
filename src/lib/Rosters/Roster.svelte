<script>
	import { gotoManager } from '$lib/utils/helper';
	import RosterRow from "./RosterRow.svelte";
	
	export let roster, leagueTeamManagers, startersAndReserve, players, rosterPositions, division, expanded;

	$: team = leagueTeamManagers.teamManagersMap[leagueTeamManagers.currentSeason][roster.roster_id].team;

	let i = 0;

	const digestData = (passedPlayers, rawPlayers, startingPlayers = false, reserve = false) => {
		let digestedRoster = [];
	
		for(const singlePlayer of rawPlayers) {
			if(!startingPlayers && !reserve && startersAndReserve.includes(singlePlayer)) {
				continue;
			}
			let player = {};
			let slot = "BN";
			if(startingPlayers) {
				slot = rosterPositions[i] == "WRRB_FLEX" ? "WR/RB" : rosterPositions[i];
			}

			if(singlePlayer == "0") {
				player = {
					name: "Empty",
					poss: null,
					team: null,
					avatar: null,
					slot: slot
				};
				i++;
				digestedRoster.push(player);
				continue;
			}

			let injury = null;
			switch (passedPlayers[singlePlayer].is) {
				case "Questionable": injury = "Q"; break;
				case "Out": injury = "OUT"; break;
				case "PUP": injury = "PUP"; break;
				case "IR": injury = "IR"; break;
				default: break;
			}
			player = {
				name: `${passedPlayers[singlePlayer].fn} ${passedPlayers[singlePlayer].ln}${injury ? `<span class="injury ${injury}">${injury}</span>` : ""}`,
				nickname: roster.metadata && roster.metadata[`p_nick_${singlePlayer}`] ? roster.metadata[`p_nick_${singlePlayer}`] : null,
				poss: passedPlayers[singlePlayer].pos,
				team: passedPlayers[singlePlayer].t,
				avatar: passedPlayers[singlePlayer].pos == "DEF" ? `background-image: url(https://sleepercdn.com/images/team_logos/nfl/${singlePlayer.toLowerCase()}.png)` : `background-image: url(https://sleepercdn.com/content/nfl/players/thumb/${singlePlayer}.jpg), url(https://sleepercdn.com/images/v2/icons/player_default.webp)`,
				slot: slot
			};
			i++;
			digestedRoster.push(player);
		}
		i = 0;

		return digestedRoster;
	};

	$: finalStarters = digestData(players, roster.starters, true);
	let finalBench = [];
	$: if(roster.players) {
		finalBench = digestData(players, roster.players);
	}
	let finalIR = null;
	if(roster.reserve) {
		finalIR = digestData(players, roster.reserve, false, true);
	}

	const buildRecord = (newRoster) => {
		const innerRecord = [];
		if(!newRoster.metadata || !newRoster.metadata.record) return innerRecord;
		for (const c of newRoster.metadata.record) {
			switch (c) {
				case "W": innerRecord.push("bg-emerald-500"); break;
				case "L": innerRecord.push("bg-rose-500"); break;
				default: innerRecord.push("bg-slate-600"); break;
			}
		}
		return innerRecord;
	};

	$: record = buildRecord(roster);

	let isExpanded = false;
	$: isExpanded = expanded;

	const toggleSelected = () => {
		isExpanded = !isExpanded;
	};
</script>

<div class="w-full max-w-[380px] flex-col rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl backdrop-blur-md transition-all duration-300 hover:border-slate-700">
	<!-- Team Header Card -->
	<div 
		role="button"
		tabindex="0"
		onclick={() => gotoManager({leagueTeamManagers, rosterID: roster.roster_id})}
		onkeydown={(e) => e.key === 'Enter' && gotoManager({leagueTeamManagers, rosterID: roster.roster_id})}
		class="group flex cursor-pointer flex-col items-center rounded-t-2xl border-b border-slate-800 bg-slate-950/40 p-4 transition-colors hover:bg-slate-800/30"
	>
		<div class="flex items-center gap-3">
			<img 
				alt="team avatar" 
				class="h-11 w-11 rounded-full border border-slate-700/80 shadow-md group-hover:scale-105 transition-transform" 
				src="{team ? team.avatar : 'https://sleepercdn.com/images/v2/icons/player_default.webp'}" 
			/>
			<h3 class="text-base sm:text-lg font-extrabold tracking-tight text-slate-100 group-hover:text-indigo-400 transition-colors">
				{team?.name ? team.name : 'No Manager'}
			</h3>
		</div>

		<!-- Record Dots Bar -->
		{#if record.length > 0}
			<div class="mt-3 flex items-center gap-1.5">
				{#each record as bgClass}
					<span class="h-2.5 w-2.5 rounded-full {bgClass} shadow-sm"></span>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Starters Rows -->
	<div class="divide-y divide-slate-800/40">
		{#each finalStarters as starter}
			<RosterRow player={starter} />
		{/each}
	</div>

	<!-- Bench Toggle Button -->
	<button
		type="button"
		onclick={toggleSelected}
		class="flex w-full items-center justify-center gap-2 border-t border-slate-800 bg-slate-950/60 py-2.5 text-xs font-bold text-indigo-400 hover:bg-slate-950 hover:text-indigo-300 transition-all"
	>
		<svg class="h-4 w-4 transition-transform duration-300 {isExpanded ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
		<span>Bench ({isExpanded ? 'Expanded' : 'Minimized'})</span>
	</button>

	<!-- Expandable Bench Container -->
	{#if isExpanded}
		<div class="border-t border-slate-800/80 bg-slate-950/30 divide-y divide-slate-800/40">
			<!-- Bench Players -->
			{#each finalBench as bench}
				<RosterRow player={bench} />
			{/each}
			
			<!-- IR Section -->
			{#if finalIR}
				<div class="bg-rose-950/20 px-4 py-1.5 text-center text-xs font-semibold text-rose-400 border-y border-rose-900/30">
					🏥 Injured Reserve
				</div>
				{#each finalIR as ir}
					<RosterRow player={ir} />
				{/each}
			{/if}

			<!-- Bottom Close Toggle -->
			<button
				type="button"
				onclick={toggleSelected}
				class="flex w-full items-center justify-center gap-2 rounded-b-2xl bg-slate-950/80 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
			>
				<span>Close Bench</span>
			</button>
		</div>
	{/if}
</div>