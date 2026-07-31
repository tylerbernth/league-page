<script>
	export let player;

	const playerSLotClass = player.slot.replace('/', '').replace('SUPER_', 'S-').replace('REC_', 'R-');
	const playerSlot = player.slot.replace('SUPER_', 'S ').replace('REC_', 'R ');
</script>

<style>
	/* Sleeper Official Position Colors */
	.pos-QB { background-color: #ff2a6d; }
	.pos-RB { background-color: #00ceb8; }
	.pos-WR { background-color: #58a6ff; }
	.pos-TE { background-color: #ff9f1c; }
	.pos-K { background-color: #9c27b0; }
	.pos-DEF { background-color: #ffd600; color: #1e293b; }
	.pos-DL { background-color: #8b5cf6; }
	.pos-LB { background-color: #6366f1; }
	.pos-DB { background-color: #06b6d4; }
	.pos-BN { background-color: #374151; }

	/* Sleeper Flex Multi-Color Gradients */
	.pos-FLEX {
		background: linear-gradient(135deg, #58a6ff 0%, #00ceb8 50%, #ff9f1c 100%);
	}
	.pos-WRRB {
		background: linear-gradient(135deg, #58a6ff 0%, #00ceb8 100%);
	}
	.pos-S-FLEX {
		background: linear-gradient(135deg, #ff2a6d 0%, #58a6ff 33%, #00ceb8 66%, #ff9f1c 100%);
	}
	.pos-R-FLEX {
		background: linear-gradient(135deg, #58a6ff 0%, #ff9f1c 100%);
	}
	.pos-IDP {
		background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #06b6d4 100%);
	}

	/* Position Text Colors (Sleeper Accents) */
	.text-QB { color: #ff2a6d; }
	.text-RB { color: #00ceb8; }
	.text-WR { color: #58a6ff; }
	.text-TE { color: #ff9f1c; }
	.text-K { color: #ba68c8; }
	.text-DEF { color: #ffd600; }
	.text-DL { color: #a78bfa; }
	.text-LB { color: #818cf8; }
	.text-DB { color: #22d3ee; }

	:global(.injury) {
		font-style: italic;
		font-weight: 700;
		font-size: 0.75rem;
		margin-left: 0.35rem;
		vertical-align: super;
	}
	:global(.Q) { color: #facc15; }
	:global(.OUT), :global(.IR), :global(.PUP) { color: #f87171; }
</style>

<div class="flex items-center justify-between border-b border-slate-800/60 px-3 py-2 transition-colors hover:bg-slate-800/40">
	<!-- Slot Badge -->
	<div class="flex w-12 shrink-0 items-center justify-center">
		<span class="pos-{playerSLotClass} inline-flex h-7 w-11 items-center justify-center rounded-md text-[11px] font-bold text-white shadow-sm">
			{playerSlot}
		</span>
	</div>

	<!-- Player Avatar & Team Emblem -->
	{#if player.avatar}
		<div class="relative ml-2 h-10 w-10 shrink-0">
			<div 
				class="h-full w-full rounded-lg bg-cover bg-center bg-no-repeat border border-slate-700/60 shadow-inner"
				style="{player.avatar}"
			></div>
			{#if player.team && player.poss !== "DEF"}
				<img 
					src="https://sleepercdn.com/images/team_logos/nfl/{player.team.toLowerCase()}.png" 
					class="absolute -right-1.5 -top-1.5 h-4 w-4 rounded-full border border-slate-900 bg-slate-950 shadow" 
					alt="team logo"
				/>
			{/if}
		</div>
	{/if}

	<!-- Player Details -->
	<div class="ml-3 flex flex-1 flex-col justify-center overflow-hidden">
		<div class="truncate text-xs font-semibold text-slate-100 sm:text-sm">
			{#if player.name === "Empty"}
				<span class="italic text-slate-500">Empty Slot</span>
			{:else}
				{@html player.name}
			{/if}
		</div>

		{#if player.name !== "Empty" && player.poss !== "DEF"}
			<div class="flex items-center gap-1.5 text-[11px] text-slate-400">
				<span class="font-bold text-{player.poss}">{@html player.poss}</span>
				{#if player.team}
					<span>•</span>
					<span class="text-slate-400">{player.team}</span>
				{/if}
			</div>
		{/if}

		{#if player.nickname}
			<div class="truncate text-[10px] italic text-slate-400">"{player.nickname}</div>
		{/if}
	</div>
</div>