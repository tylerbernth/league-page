<script>
    import { gotoManager } from '$lib/utils/helper';
  	import { Row, Cell } from '@smui/data-table';

    export let columnOrder, team, standing, leagueTeamManagers;
</script>

<style>
    .clickable {
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .clickable:hover {
        transform: translateX(4px);
    }
	
	.teamAvatar {
		vertical-align: middle;
		border-radius: 8px;
		height: 40px;
		margin-right: 15px;
		border: 2px solid var(--blueTwo);
		box-shadow: 0 2px 8px rgba(79, 70, 229, 0.15);
		transition: all 0.3s ease;
	}

	.teamAvatar:hover {
		transform: scale(1.1);
		box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
	}

    :global(.contrastRow) {
        background: linear-gradient(90deg, rgba(79, 70, 229, 0.02) 0%, transparent 100%);
        border-bottom: 1px solid rgba(79, 70, 229, 0.08);
        transition: all 0.2s ease;
    }

    :global(.contrastRow:hover) {
        background: linear-gradient(90deg, rgba(79, 70, 229, 0.05) 0%, rgba(6, 182, 212, 0.02) 100%);
    }

    .team {
        text-align: center;
        display: flex;
        align-items: center;
    }

    @media (max-width: 768px) {
        .teamAvatar {
            height: 35px;
            margin-right: 10px;
        }

        .team {
            font-size: 0.95em;
        }
    }

    @media (max-width: 480px) {
        .teamAvatar {
            height: 30px;
            margin-right: 8px;
        }

        .team {
            font-size: 0.85em;
        }

        :global(.contrastRow) {
            font-size: 0.8em;
        }
    }
</style>

<Row class="contrastRow">
    <Cell class="">
        <div class="clickable team" onclick={() => gotoManager({leagueTeamManagers, rosterID: standing.rosterID})}>
            <img alt="team avatar" class="teamAvatar clickable" src="{team.avatar}" />
            <div>
                {team.name}
            </div>
        </div>
    </Cell>
    {#each columnOrder as column}
        <Cell class="center">{standing[column.field]}</Cell>
    {/each}
</Row>