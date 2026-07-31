<script>
    import { getTeamNameFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';
    import { Row, Cell } from '@smui/data-table';
    export let draftRow, draftType, row, reversalRound, previous=false, players, year, leagueTeamManagers;
</script>

<style>
    :global(.draftCell) {
        position: relative;
    }

    :global(.changedHands) {
        background-color: var(--draftSwapped);
    }

    .draftPos {
        position: absolute;
        top: 0.3em;
        left: 0.3em;
        font-style: italic;
        color: #aaa;
    }

    .draftPosPrev {
        position: absolute;
        top: 0.1em;
        left: 0.1em;
        font-style: italic;
        color: #444;
    }

    .newOwner {
        font-style: italic;
        color: #444;
        text-align: center;
        white-space: break-spaces;
        line-height: 1.2em;
    }

    :global(.prevQB) {
        background-color: var(--QBfade);
    }

    :global(.prevWR) {
        background-color: var(--WRfade);
    }

    :global(.prevRB) {
        background-color: var(--RBfade);
    }

    :global(.prevTE) {
        background-color: var(--TEfade);
    }

    :global(.prevK) {
        background-color: var(--Kfade);
    }

    :global(.prevDEF) {
        background-color: var(--DEfadeFfade);
    }

    :global(.prevCB) {
        background-color: var(--CBfade);
    }

    :global(.prevSS) {
        background-color: var(--SSfade);
    }

    :global(.prevFS) {
        background-color: var(--FSfade);
    }

    :global(.prevDE) {
        background-color: var(--DEfade);
    }

    :global(.prevDL) {
        background-color: var(--DLfade);
    }

    :global(.prevLB) {
        background-color: var(--LBfade);
    }

    .playerAvatar {
        display: inline-block;
        position: absolute;
        transform: translate(-50%, -50%);
        left: 50%;
        top: 45%;
        height: 25px;
        width: 25px;
        background-position: center;
        border-radius: 100%;
        background-repeat: no-repeat;
        background-size: auto 25px;
    }

    .name {
        display: block;
        width: 100%;
        text-align: center;
        position: absolute;
        left: 0;
        white-space: break-spaces;
        line-height: 1em;
        bottom: 0.5em;
        color: rgba(0, 0, 0, 0.87);
    }

    .keeperBadge {
        position: absolute;
        top: 0.25em;
        right: 0.25em;
        z-index: 10;
        display: flex;
        height: 18px;
        width: 18px;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background-color: #f59e0b;
        border: 1.5px solid #ffffff;
        font-size: 9px;
        font-weight: 900;
        color: #ffffff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
    }
</style>

<Row>
    {#each draftRow as draftCol, col}
        {#if !previous || draftCol}
            <Cell class="draftCell{draftCol && typeof draftCol === 'object' && draftCol.changedHands ? ' changedHands' : ''}{previous && draftCol && players && players[typeof draftCol === 'object' ? draftCol.player : draftCol] ? ` prev${players[typeof draftCol === 'object' ? draftCol.player : draftCol].pos}` : ''}">
                <span class="draftPos{previous ? "Prev" : ""}">
                    {#if draftType == "auction" && previous}
                        ${typeof draftCol === 'object' ? draftCol.amount : ''}
                    {:else if draftType == "snake" && !reversalRound}
                        {row}.{row % 2 == 0 ? draftRow.length - col : col + 1}{typeof draftCol === 'object' && draftCol?.newOwner ? ` ${getTeamNameFromTeamManagers(leagueTeamManagers, draftCol.newOwner, year)}` : ''}
                    {:else if draftType == "snake" && reversalRound}
                        {#if (row < reversalRound && row % 2 == 0) || (row >= reversalRound && row % 2 == 1)}
                            {row}.{draftRow.length - col}
                        {:else}
                            {row}.{col + 1}
                        {/if}
                        {typeof draftCol === 'object' && draftCol?.newOwner ? ` ${getTeamNameFromTeamManagers(leagueTeamManagers, draftCol.newOwner, year)}` : ''}
                    {:else}
                        {#if !reversalRound || row < reversalRound}
                            {row}.{col+1}{typeof draftCol === 'object' && draftCol?.newOwner ? ` ${getTeamNameFromTeamManagers(leagueTeamManagers, draftCol.newOwner, year)}` : ''}
                        {:else}
                            {row}.{draftRow.length - col}{typeof draftCol === 'object' && draftCol?.newOwner ? ` ${getTeamNameFromTeamManagers(leagueTeamManagers, draftCol.newOwner, year)}` : ''}
                        {/if}
                    {/if}
                </span>

                {#if draftCol && typeof draftCol === 'object' && (draftCol?.is_keeper || draftCol?.metadata?.is_keeper || draftCol?.keeper)}
                    <div class="keeperBadge" title="Keeper">
                        K
                    </div>
                {/if}

                {#if draftCol && !previous}
                    <div class="newOwner">{getTeamNameFromTeamManagers(leagueTeamManagers, draftCol)}</div>
                {/if}
                {#if previous && draftCol}
                    {@const playerId = typeof draftCol === 'object' ? draftCol.player : draftCol}
                    {#if playerId && players && players[playerId]}
                        <div class="playerAvatar" style="background-image: {players[playerId].pos == "DEF" ? `url(https://sleepercdn.com/images/team_logos/nfl/${playerId.toLowerCase()}.png)` : `url(https://sleepercdn.com/content/nfl/players/thumb/${playerId}.jpg), url(https://sleepercdn.com/images/v2/icons/player_default.webp)`}" />
                        <br />
                        <div class="name">{`${players[playerId]?.fn || ''} ${players[playerId]?.ln || playerId}`}{players[playerId].pos == "DEF" ? "" : players[playerId]?.t ? ` (${players[playerId].t})` : ''}</div>
                    {/if}
                {/if}
            </Cell>
        {/if}
    {/each}
</Row>