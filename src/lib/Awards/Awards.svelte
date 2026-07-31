<script>
    import { gotoManager } from '$lib/utils/helper';
	import { getAvatarFromTeamManagers, getNestedTeamNamesFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';
	export let podium, leagueTeamManagers;

	const { year, champion, second, third, divisions, toilet } = podium;
</script>

<div class="relative w-full max-w-5xl mx-auto px-4 py-8 text-slate-200">
	<!-- Header Section -->
	<div class="text-center mb-10">
		<span class="inline-block py-1 px-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-3">
			Hall of Fame
		</span>
		<h3 class="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{year} Awards & Champions</h3>
	</div>

	<!-- Champion's Podium Card -->
	<div class="relative bg-gradient-to-b from-slate-900/80 to-slate-950/90 border border-slate-800/80 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-xl overflow-hidden mb-12">
		<!-- Decorative background glow -->
		<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

		<div class="text-center mb-8 relative z-10">
			<img src="/banner.png" class="w-2/3 max-w-[320px] mx-auto filter drop-shadow-[0_10px_8px_rgba(0,0,0,0.5)]" alt="The Champion's Cup" />
		</div>

		<div id="podium" class="w-[280px] h-[233px] sm:w-[380px] sm:h-[316px] md:w-[480px] md:h-[400px] lg:w-[560px] lg:h-[466px] relative mx-auto my-4">
			<img src="/podium.png" class="absolute bottom-0 left-0 w-full h-auto z-20 opacity-90 drop-shadow-lg" alt="podium" />

			<!-- Champion (1st) -->
			<div class="absolute bottom-[70%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center group cursor-pointer" onclick={() => gotoManager({year, leagueTeamManagers, rosterID: champion})}>
				<div class="relative">
					<div class="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-200 opacity-75 blur group-hover:opacity-100 transition duration-300"></div>
					<img src="{getAvatarFromTeamManagers(leagueTeamManagers, champion, year)}" class="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full border-2 border-amber-300 bg-slate-900 object-cover shadow-xl" alt="champion" />
				</div>
			</div>
			<img src="/laurel.png" class="absolute w-[30%] h-auto -translate-x-1/2 -translate-y-1/2 bottom-[55%] left-[50%] pointer-events-none z-30 drop-shadow-md" alt="laurel" />
			<div class="absolute -translate-x-1/2 -translate-y-1/2 bottom-[49%] sm:bottom-[54%] lg:bottom-[57%] left-[50%] z-40 cursor-pointer group" onclick={() => gotoManager({year, leagueTeamManagers, rosterID: champion})}>
				<div class="px-3 py-1.5 bg-slate-900/90 border border-amber-500/40 rounded-xl shadow-lg backdrop-blur-md text-center transition group-hover:border-amber-400 group-hover:bg-slate-800">
					<span class="block text-[10px] sm:text-xs font-semibold text-amber-400 uppercase tracking-wider mb-0.5">Champion</span>
					<span class="block text-xs sm:text-sm font-bold text-white whitespace-nowrap">{@html getNestedTeamNamesFromTeamManagers(leagueTeamManagers, year, champion)}</span>
				</div>
			</div>

			<!-- Second Place -->
			<div class="absolute bottom-[43%] left-[20%] -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center group cursor-pointer" onclick={() => gotoManager({year, leagueTeamManagers, rosterID: second})}>
				<div class="relative">
					<div class="absolute -inset-1 rounded-full bg-gradient-to-r from-slate-300 to-slate-500 opacity-50 blur group-hover:opacity-100 transition duration-300"></div>
					<img src="{getAvatarFromTeamManagers(leagueTeamManagers, second, year)}" class="relative w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full border-2 border-slate-300 bg-slate-900 object-cover shadow-xl" alt="2nd" />
				</div>
			</div>
			<div class="absolute -translate-x-1/2 -translate-y-1/2 bottom-[30%] sm:bottom-[34%] lg:bottom-[38%] left-[20%] z-40 cursor-pointer group" onclick={() => gotoManager({year, leagueTeamManagers, rosterID: second})}>
				<div class="px-2.5 py-1 bg-slate-900/90 border border-slate-700 rounded-xl shadow-lg backdrop-blur-md text-center transition group-hover:border-slate-500 group-hover:bg-slate-800">
					<span class="block text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">2nd Place</span>
					<span class="block text-[11px] sm:text-xs font-bold text-slate-200 whitespace-nowrap">{@html getNestedTeamNamesFromTeamManagers(leagueTeamManagers, year, second)}</span>
				</div>
			</div>

			<!-- Third Place -->
			<div class="absolute bottom-[39%] left-[80%] -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center group cursor-pointer" onclick={() => gotoManager({year, leagueTeamManagers, rosterID: third})}>
				<div class="relative">
					<div class="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-700 to-amber-900 opacity-50 blur group-hover:opacity-100 transition duration-300"></div>
					<img src="{getAvatarFromTeamManagers(leagueTeamManagers, third, year)}" class="relative w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full border-2 border-amber-700 bg-slate-900 object-cover shadow-xl" alt="3rd" />
				</div>
			</div>
			<div class="absolute -translate-x-1/2 -translate-y-1/2 bottom-[26%] sm:bottom-[30%] lg:bottom-[34%] left-[80%] z-40 cursor-pointer group" onclick={() => gotoManager({year, leagueTeamManagers, rosterID: third})}>
				<div class="px-2.5 py-1 bg-slate-900/90 border border-amber-800/60 rounded-xl shadow-lg backdrop-blur-md text-center transition group-hover:border-amber-600 group-hover:bg-slate-800">
					<span class="block text-[9px] sm:text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-0.5">3rd Place</span>
					<span class="block text-[11px] sm:text-xs font-bold text-slate-200 whitespace-nowrap">{@html getNestedTeamNamesFromTeamManagers(leagueTeamManagers, year, third)}</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Divisions / Regular Season Section -->
	<div class="mb-12">
		<h4 class="text-center text-lg font-bold text-slate-400 uppercase tracking-wider mb-6">Division & Conference Honors</h4>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each divisions as division}
				{#if division.rosterID}
					<div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 text-center backdrop-blur-md shadow-xl flex flex-col items-center justify-between hover:border-slate-700 transition duration-300">
						{#if division.name}
							<h6 class="text-indigo-400 font-semibold text-sm uppercase tracking-wider mb-4">{division.name} Division</h6>
						{:else}
							<h6 class="text-indigo-400 font-semibold text-sm uppercase tracking-wider mb-4">Regular Season Champion</h6>
						{/if}
						
						<div class="relative w-20 h-20 my-2 cursor-pointer group" onclick={() => gotoManager({year, leagueTeamManagers, rosterID: division.rosterID})}>
							<div class="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-40 blur group-hover:opacity-80 transition"></div>
							<img src="{getAvatarFromTeamManagers(leagueTeamManagers, division.rosterID, year)}" class="relative w-20 h-20 rounded-full border-2 border-indigo-500/50 bg-slate-900 object-cover shadow-lg group-hover:scale-105 transition-transform" alt="{division.name} champion" />
							<img src="/medal.png" class="absolute -bottom-1 -right-1 w-8 h-auto z-20 pointer-events-none filter drop-shadow" alt="medal" />
						</div>

						<div class="mt-4 cursor-pointer group w-full" onclick={() => gotoManager({year, leagueTeamManagers, rosterID: division.rosterID})}>
							<div class="py-2 px-4 bg-slate-950/60 border border-slate-800 rounded-xl group-hover:bg-slate-800 transition">
								<span class="text-xs sm:text-sm font-bold text-white block truncate">{@html getNestedTeamNamesFromTeamManagers(leagueTeamManagers, year, division.rosterID)}</span>
							</div>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	</div>

	<!-- Toilet Bowl Section -->
	{#if toilet}
		<div class="bg-gradient-to-b from-slate-950/80 to-slate-900/90 border border-slate-900 rounded-3xl p-6 md:p-8 text-center shadow-xl backdrop-blur-xl">
			<img src="/toilet-banner.png" class="w-1/2 max-w-[280px] mx-auto mb-6 opacity-90 filter drop-shadow" alt="The Toilet Bowl" />

			<div class="relative w-[180px] h-[160px] mx-auto my-4">
				<div class="absolute top-2 left-1/2 -translate-x-1/2 z-30 cursor-pointer group" onclick={() => gotoManager({year, leagueTeamManagers, rosterID: toilet})}>
					<div class="absolute -inset-1 rounded-full bg-slate-700 opacity-50 blur group-hover:opacity-100 transition"></div>
					<img src="{getAvatarFromTeamManagers(leagueTeamManagers, toilet, year)}" class="relative w-14 h-14 rounded-full border-2 border-slate-600 bg-slate-900 object-cover shadow-xl group-hover:scale-105 transition-transform" alt="toilet bowl winner" />
				</div>
				<img src="/toilet-bowl-2.png" class="absolute w-full h-auto bottom-0 left-1/2 -translate-x-1/2 pointer-events-none opacity-80" alt="toilet bowl" />
			</div>

			<div class="inline-block mt-2 cursor-pointer group" onclick={() => gotoManager({year, leagueTeamManagers, rosterID: toilet})}>
				<div class="px-5 py-2 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg backdrop-blur-md text-center transition group-hover:border-slate-700 group-hover:bg-slate-800">
					<span class="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Toilet Bowl Winner</span>
					<span class="block text-xs sm:text-sm font-bold text-white">{@html getNestedTeamNamesFromTeamManagers(leagueTeamManagers, year, toilet)}</span>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(.curOwner) {
		font-size: 0.75em;
		color: #94a3b8;
		font-style: italic;
	}
</style>