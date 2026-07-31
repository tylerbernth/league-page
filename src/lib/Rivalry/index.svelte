<script>
	import Matchup from "$lib/Matchups/Matchup.svelte";
	import TradeTransaction from "$lib/Transactions/TradeTransaction.svelte";
	import { getLeagueRecords, getLeagueTransactions, getRivalryMatchups, loadPlayers, round } from "$lib/utils/helper";
	import { getRosterIDFromManagerIDAndYear } from "$lib/utils/helperFunctions/universalFunctions";
	import LinearProgress from '@smui/linear-progress';
	import { onMount } from "svelte";
	import ComparissonBar from "./ComparissonBar.svelte";
	import ManagerSelectors from "./ManagerSelectors.svelte";
	import RivalryControls from "./RivalryControls.svelte";

	export let leagueTeamManagers, playersInfo, transactionsInfo, recordsInfo, playerOne, playerTwo;

    // refresh stale data
    onMount(async () => {
        if(transactionsInfo.stale) {
            transactionsInfo = await getLeagueTransactions(false, true);
        }
        if(playersInfo.stale) {
            playersInfo = await loadPlayers(null, true);
        }
        if(recordsInfo.stale) {
            recordsInfo = await getLeagueRecords(true);
        }
    })

    let rivalry = null;
    let loading = true;

    const analyzeRivalry = async (p1, p2) => {
        loading = true;
        matchup = null;
        if(p1 && p2) {
            rivalry = await getRivalryMatchups(p1, p2);
            loading = false;
        }
    }

    $: analyzeRivalry(playerOne, playerTwo);

    let selected = 0;

    $: matchup = rivalry?.matchups[selected]?.matchup;
    $: displayWeek = rivalry?.matchups[selected]?.week;
    $: year = rivalry?.matchups[selected]?.year;
    
    const setTradeHistory = (p1, p2) => {
        if(!p1 || !p2) {
            return [];
        }
        const trades = transactionsInfo.transactions.filter( transaction => {
            if(transaction.type !== "trade") {
                return false;
            }
            const rosterIDOne = parseInt(getRosterIDFromManagerIDAndYear(leagueTeamManagers, playerOne, transaction.season));
            const rosterIDTwo = parseInt(getRosterIDFromManagerIDAndYear(leagueTeamManagers, playerTwo, transaction.season));
            if(rosterIDOne == rosterIDTwo) {
                return false;
            }
            return transaction.rosters.includes(rosterIDOne) && transaction.rosters.includes(rosterIDTwo);
        });
        const move = (arr, from, to) => {
            arr.splice(to, 0, arr.splice(from, 1)[0]);
        };
        // reorganize trades so that they match the left-right alignment of the rivalry page
        return trades.map(t => {
            const rosterIDOne = parseInt(getRosterIDFromManagerIDAndYear(leagueTeamManagers, playerOne, t.season));
            const rosterIDTwo = parseInt(getRosterIDFromManagerIDAndYear(leagueTeamManagers, playerTwo, t.season));
            const rosterOneStartLocation = t.rosters.indexOf(rosterIDOne);
            if(rosterOneStartLocation > 0) {
                move(t.rosters, rosterOneStartLocation, 0);
                for(const tradeMove of t.moves) {
                    move(tradeMove, rosterOneStartLocation, 0);
                }
            }
            const rosterTwoStartLocation = t.rosters.indexOf(rosterIDTwo);
            const last = t.rosters.length - 1;
            if(rosterTwoStartLocation < last) {
                move(t.rosters, rosterTwoStartLocation, last);
                for(const tradeMove of t.moves) {
                    move(tradeMove, rosterTwoStartLocation, last);
                }
            }
            return t;
        })
    }

    $: tradeHistory = setTradeHistory(playerOne, playerTwo);

    const performanceOrderOne = [
        {field: "wins", label: "Wins", unit: "wins"},
        {field: "losses", label: "Losses", unit: "losses"},
        {field: "ties", label: "Ties", unit: "ties"},
    ]

    const performanceOrderTwo = [
        {field: "fptsFor", label: "Fantasy Points For", unit: "fpts"},
        {field: "fptsAgainst", label: "Fantasy Points Against", unit: "fpts against"},
    ]

    $: playerOneRecords = recordsInfo?.regularSeasonData?.leagueManagerRecords ? recordsInfo.regularSeasonData.leagueManagerRecords[playerOne] : null;
    $: playerTwoRecords = recordsInfo?.regularSeasonData?.leagueManagerRecords ? recordsInfo.regularSeasonData.leagueManagerRecords[playerTwo] : null;
</script>

<div class="mx-auto max-w-6xl px-4 py-8">
    <h2 class="mb-6 text-center text-3xl font-light tracking-wide text-slate-100 sm:text-4xl">
        Rivalry
    </h2>

    <div class="mb-10">
        <ManagerSelectors bind:playerOne={playerOne} bind:playerTwo={playerTwo} {leagueTeamManagers} />
    </div>

    {#if loading }
        {#if playerOne && playerTwo }
            <div class="mx-auto my-20 w-full max-w-md rounded-2xl border border-indigo-500/10 bg-slate-900/60 p-8 text-center shadow-xl backdrop-blur-md">
                <p class="text-lg font-medium text-slate-300">Analyzing rivalry...</p>
                <div class="mt-6">
                    <LinearProgress indeterminate />
                </div>
            </div>
        {:else}
            <div class="my-12 text-center">
                <img class="mx-auto w-4/5 max-w-md opacity-80 drop-shadow-2xl" src="/helmets.png" alt="placeholder of helmets clashing" />
            </div>
        {/if}
    {:else}
        {#if rivalry?.matchups.length > 0 }
            <div class="mx-auto my-8 w-full max-w-5xl rounded-2xl border border-indigo-500/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md sm:p-8">
                <h3 class="mb-6 text-center text-xl font-light tracking-wide text-slate-200 sm:text-2xl">Head to Head</h3>
                
                <!-- wins -->
                <ComparissonBar sideOne={rivalry.wins.one} sideTwo={rivalry.wins.two} label="Wins" unit="wins" />
                
                <!-- points -->
                <ComparissonBar sideOne={parseFloat(round(rivalry.points.one))} sideTwo={parseFloat(round(rivalry.points.two))} label="Points" unit="pts" />
                
                <h3 class="mt-10 mb-6 text-center text-xl font-light tracking-wide text-slate-200 sm:text-2xl">Matchups</h3>
                <RivalryControls bind:selected={selected} {year} {displayWeek} length={rivalry.matchups.length} />
                
                <div class="mt-4">
                    <Matchup key={`${playerOne}-${playerTwo}`} ix={selected} active={selected} {year} {matchup} players={playersInfo.players} {displayWeek} expandOverride={true} {leagueTeamManagers} />
                </div>
            </div>
        {/if}

        <div class="mx-auto my-8 w-full max-w-5xl rounded-2xl border border-indigo-500/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md sm:p-8">
            {#if playerOne && playerTwo }
                <!-- trades -->
                <h3 class="mb-6 text-center text-xl font-light tracking-wide text-slate-200 sm:text-2xl">Trade History</h3>
                <div class="mx-auto max-w-3xl space-y-4">
                    {#each tradeHistory as transaction }
                        <TradeTransaction players={playersInfo.players} {transaction} {leagueTeamManagers} />
                    {:else}
                        <div class="py-8 text-center text-sm italic text-slate-500">
                            No trades yet...
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        {#if playerOne && playerTwo && playerOneRecords && playerTwoRecords }
            <div class="mx-auto my-8 w-full max-w-5xl rounded-2xl border border-indigo-500/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md sm:p-8">
                <!-- record comparisson -->
                <h3 class="mb-6 text-center text-xl font-light tracking-wide text-slate-200 sm:text-2xl">Performance Comparison</h3>
                
                <ComparissonBar
                    sideOne={parseFloat(round(
                        playerOneRecords.wins/(playerOneRecords.wins + playerOneRecords.ties + playerOneRecords.losses) * 100
                        ))}
                    sideTwo={parseFloat(round(
                        playerTwoRecords.wins/(playerTwoRecords.wins + playerTwoRecords.ties + playerTwoRecords.losses) * 100
                        ))}
                    label="Win Percentage"
                    unit="%"
                />
                
                {#each performanceOrderOne as stat }
                    <ComparissonBar
                        sideOne={parseFloat(round(playerOneRecords[stat.field]))}
                        sideTwo={parseFloat(round(playerTwoRecords[stat.field]))}
                        label={stat.label}
                        unit={stat.unit}
                    />
                {/each}
                
                <ComparissonBar
                    sideOne={parseFloat(round(
                        playerOneRecords.fptsFor/(playerOneRecords.wins + playerOneRecords.ties + playerOneRecords.losses)
                        ))}
                    sideTwo={parseFloat(round(
                        playerTwoRecords.fptsFor/(playerTwoRecords.wins + playerTwoRecords.ties + playerTwoRecords.losses)
                        ))}
                    label="Fantasy Points per Game"
                    unit="fpts/game"
                />
                
                {#each performanceOrderTwo as stat }
                    <ComparissonBar
                        sideOne={parseFloat(round(playerOneRecords[stat.field]))}
                        sideTwo={parseFloat(round(playerTwoRecords[stat.field]))}
                        label={stat.label}
                        unit={stat.unit}
                    />
                {/each}
                
                <ComparissonBar
                    sideOne={parseFloat(round(
                        playerOneRecords.fptsFor/playerOneRecords.potentialPoints * 100
                        ))}
                    sideTwo={parseFloat(round(
                        playerTwoRecords.fptsFor/playerTwoRecords.potentialPoints * 100
                        ))}
                    label="Lineup IQ"
                    unit="%"
                />
            </div>
        {/if}
    {/if}
</div>