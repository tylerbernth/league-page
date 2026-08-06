<script>
	import LinearProgress from '@smui/linear-progress';
	import { getNflState, leagueName, getAwards, getLeagueTeamManagers, homepageText, managers, gotoManager, enableBlog, waitForAll } from '$lib/utils/helper';
	import { Transactions, PowerRankings, HomePost } from '$lib/components';
	import { getAvatarFromTeamManagers, getTeamFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';

	const nflState = getNflState();
	const podiumsData = getAwards();
	const leagueTeamManagersData = getLeagueTeamManagers();

	let innerWidth;
</script>

<svelte:window bind:innerWidth={innerWidth} />

<div class="flex flex-col lg:flex-row gap-8 w-full max-w-7xl mx-auto my-4">
	<!-- MAIN CONTENT AREA (Left Column) -->
	<div class="flex-1 min-w-0 space-y-8">
		<!-- Hero / Intro Card -->
		<section class="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
			<!-- Subtle glow effect -->
			<div class="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>

			<div class="relative z-10 space-y-4">
				<h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white uppercase border-b border-slate-800 pb-3">
					{leagueName}
				</h1>
				
				<div class="prose prose-invert max-w-none text-slate-300 leading-relaxed text-sm sm:text-base">
					{@html homepageText}
				</div>

				<!-- Most recent Blog Post (if enabled) -->
				{#if enableBlog}
					<div class="pt-4 border-t border-slate-800/80">
						<HomePost />
					</div>
				{/if}
			</div>
		</section>

		<!-- Manager Profiles Grid Section -->
		<section class="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
			<h2 class="text-xl sm:text-2xl font-extrabold tracking-tight text-white uppercase border-b border-slate-800 pb-3 mb-6 text-center">
				Manager Profiles
			</h2>
			
			{#await leagueTeamManagersData}
				<div class="flex flex-col items-center justify-center py-8">
					<p class="text-sm font-medium text-slate-400 mb-2">Loading managers...</p>
					<LinearProgress indeterminate />
				</div>
			{:then leagueTeamManagers}
				<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 justify-items-center">
					{#each managers as manager, key}
						{@const currentYear = leagueTeamManagers.currentYear}
						<div 
							class="group flex flex-col items-center w-full bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/40 hover:border-blue-500/50 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-1"
							on:click={() => {
								gotoManager({year: currentYear, leagueTeamManagers, managerID: manager.managerID});
							}}
						>
							<!-- Manager Image Box with subtle background ring & glowing border on hover -->
							<div class="relative w-20 h-20 sm:w-24 sm:h-24 mb-3 rounded-full bg-slate-900/80 p-1 border-2 border-slate-700 group-hover:border-blue-400 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-200 flex items-center justify-center overflow-hidden shrink-0">
								{#if manager.photo}
									<img 
										src="{manager.photo}" 
										alt="{manager.name}" 
										class="w-full h-full object-cover rounded-full" 
									/>
								{:else}
									<span class="text-xl font-bold text-slate-400">{manager.name?.slice(0, 2).toUpperCase()}</span>
								{/if}
							</div>

							<!-- Manager Name: Allows wrapping onto multiple lines so nothing gets cut off -->
							<span class="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-blue-400 text-center tracking-wide transition-colors w-full leading-tight min-h-[2.5rem] flex items-center justify-center">
								{manager.name}
							</span>
						</div>
					{/each}
				</div>
			{:catch error}
				<p class="text-xs text-red-400 text-center">Failed to load managers: {error.message}</p>
			{/await}
		</section>

		<!-- Power Rankings Section -->
		<section class="rounded-3xl bg-slate-900 border border-slate-800 p-4 sm:p-6 shadow-xl">
			<PowerRankings />
		</section>
	</div>

	<!-- LEAGUE DATA SIDEBAR (Right Column) -->
	<aside class="w-full lg:w-[420px] shrink-0 space-y-6">
		<!-- NFL Season State Banner -->
		<div class="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 p-4 text-white shadow-lg shadow-blue-900/20">
			{#await nflState}
				<div class="text-center text-sm font-semibold mb-2">Retrieving NFL state...</div>
				<LinearProgress indeterminate />
			{:then nflStateData}
				<div class="text-center font-bold tracking-wide uppercase text-sm sm:text-base">
					NFL {nflStateData.season} 
					{#if nflStateData.season_type == 'pre'}
						Preseason
					{:else if nflStateData.season_type == 'post'}
						Postseason
					{:else}
						Season - {nflStateData.week > 0 ? `Week ${nflStateData.week}` : "Preseason"}
					{/if}
				</div>
			{:catch error}
				<div class="text-center text-xs text-red-200">Something went wrong: {error.message}</div>
			{/await}
		</div>

		<!-- Current Champ Spotlight -->
		<div class="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl text-center">
			{#await waitForAll(podiumsData, leagueTeamManagersData)}
				<p class="text-sm font-medium text-slate-400 mb-2">Retrieving awards...</p>
				<LinearProgress indeterminate />
			{:then [podiums, leagueTeamManagers]}
				{#if podiums[0]}
					<div class="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
						👑 {podiums[0].year} Reigning Champion
					</div>

					<!-- Avatar & Laurel Graphic -->
					<div 
						class="relative w-36 h-36 mx-auto cursor-pointer group my-2 transition-transform hover:scale-105"
						on:click={() => {if(managers.length) gotoManager({year: podiums[0].year, leagueTeamManagers, rosterID: parseInt(podiums[0].champion)})}}
					>
						<!-- Champion Avatar -->
						<img 
							src="{getAvatarFromTeamManagers(leagueTeamManagers, podiums[0].champion, podiums[0].year)}" 
							class="absolute left-1/2 top-[43%] h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-400/80 object-cover shadow-md" 
							alt="champion" 
						/>
						<!-- Laurel Overlay -->
						<img 
							src="/laurel.png" 
							class="absolute left-1/2 top-1/2 h-auto w-32 -translate-x-1/2 -translate-y-1/2 pointer-events-none" 
							alt="laurel" 
						/>
					</div>

					<!-- Team Name Link -->
					<button 
						type="button"
						class="mt-2 text-xl font-bold text-white hover:text-amber-400 transition-colors cursor-pointer block mx-auto"
						on:click={() => gotoManager({year: podiums[0].year, leagueTeamManagers, rosterID: parseInt(podiums[0].champion)})}
					>
						{getTeamFromTeamManagers(leagueTeamManagers, podiums[0].champion, podiums[0].year).name}
					</button>
				{:else}
					<p class="text-sm text-slate-400">No former champs found.</p>
				{/if}
			{:catch error}
				<p class="text-xs text-red-400">Something went wrong: {error.message}</p>
			{/await}
		</div>

		<!-- Recent Transactions Section -->
		<div class="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-xl">
			<h3 class="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 px-2">
				Recent Activity
			</h3>
			<div class="w-full">
				<Transactions />
			</div>
		</div>
	</aside>
</div>