<script>
	import { loadPlayers } from '$lib/utils/helper';
	import RosterSorter from './RosterSorter.svelte';

	export let leagueData, rosterData, leagueTeamManagers, playersInfo;

	let players = playersInfo.players;

	const refreshPlayers = async () => {
		const newPlayersInfo = await loadPlayers(null, true);
		players = newPlayersInfo.players;
	};

	if(playersInfo.stale) {
		refreshPlayers();
	}
</script>

<div class="w-full">
	<RosterSorter rosters={rosterData.rosters} {players} {leagueTeamManagers} startersAndReserve={rosterData.startersAndReserve} {leagueData} />
</div>