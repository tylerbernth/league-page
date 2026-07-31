<script>
	import { getAvatarFromTeamManagers, getTeamNameFromTeamManagers, renderManagerNames } from "$lib/utils/helperFunctions/universalFunctions";

    export let leagueTeamManagers, managerID = null, rosterID = null, year, compressed = false, points = null;

    let user = null;

    if(managerID) {
        user = leagueTeamManagers.users[managerID];
    }
</script>

<style>
	.teamAvatar {
		vertical-align: middle;
		border-radius: 50%;
		height: 40px;
		margin-right: 15px;
		border: 0.25px solid #777;
	}
    .compressed {
		height: 30px;
		margin-right: 6px;
    }
    @media (max-width: 405px) {
        .teamAvatar {
            height: 25px;
            margin-right: 8px;
        }
        .compressed {
            height: 20px;
            margin-right: 4px;
        }
    }
    @media (max-width: 295px) {
        .teamAvatar {
            display: none;
        }
    }
</style>

<div class="flex">
    {#if user}
        <img alt="team avatar" class="teamAvatar{compressed ? " compressed" : ""}" src="{`https://sleepercdn.com/avatars/thumbs/${user.avatar}`}" />
    {:else if rosterID}
        <img alt="team avatar" class="teamAvatar{compressed ? " compressed" : ""}" src="{getAvatarFromTeamManagers(leagueTeamManagers, rosterID, year)}" />
    {/if}
    <span class="my-auto mx-0">
        <div class="teamName">
            {#if user}
                {user.display_name}
            {:else if rosterID}
                {getTeamNameFromTeamManagers(leagueTeamManagers, rosterID, year)}
                {points ? ` (${points})` : ""}
            {/if}
        </div>
        {#if !user}
            <div class="text-[0.75em] italic text-[var(--g999)] max-w-[180px] whitespace-normal text-left">
                {renderManagerNames(leagueTeamManagers, rosterID, year)}
            </div>
        {/if}
    </span>
</div>