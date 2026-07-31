<script>
    import { generateGraph, gotoManager, round } from '$lib/utils/helper';
    import RecordTeam from './RecordTeam.svelte';
    import BarChart from '$lib/BarChart.svelte';

    export let key, tradesData, waiversData, weekRecords, weekLows, seasonLongRecords, seasonLongLows, showTies, winPercentages, fptsHistories, lineupIQs, prefix, blowouts, closestMatchups, allTime=false, leagueTeamManagers;

    let graphs = [];
    let curTable = 0;
    let curGraph = 0;

    let iqOffset = 0;
    let tables = [
        "Win Percentages",
        "Points",
        "Transactions",
    ]

    const year = allTime ? null : prefix;

    const changeTable = (newGraph) => {
        switch (newGraph) {
            case 0 - iqOffset:
            case (4 + (99 * iqOffset)):
                curTable = 0;
                break;
            case 1 - iqOffset:
            case 2 - iqOffset:
                curTable = 1 - iqOffset;
                break;
            case 3 - iqOffset:
                curTable = 2 - iqOffset;
                break;
            case 5 - (2 * iqOffset):
            case 6 - (2 * iqOffset):
                curTable = 3 - iqOffset;
                break;
            default:
                curTable = 0;
                break;
        }
    }

    const changeGraph = (newTable) => {
        switch (newTable) {
            case 0 - iqOffset:
                if(curGraph == 0 || curGraph == 4) {
                    break;
                }
                curGraph = 0;
                break;
            case 1 - iqOffset:
                if(curGraph == 1 - iqOffset || curGraph == 2 - iqOffset) {
                    break;
                }
                curGraph = 1 - iqOffset;
                break;
            case 2 - iqOffset:
                curGraph = 3 - iqOffset;
                break;
            case 3 - iqOffset:
                if(curGraph == 5 - (2 * iqOffset) || curGraph == 6 - (2 * iqOffset)) {
                    break;
                }
                curGraph = 5 - (2 * iqOffset);
                break;
            default:
                curGraph = 0;
                break;
        }
    }

    const setGraphs = (wD) => {
        const lineupIQGraph = {
            stats: lineupIQs,
            x: "Lineup IQ",
            stat: "%",
            header: "Manager Lineup IQ",
            field: "iq",
            short: "Lineup IQ"
        }

        const potentialPointsGraph = {
            stats: lineupIQs,
            x: "Points",
            stat: "",
            header: "Potential Points vs Points",
            field: "potentialPoints",
            secondField: "fpts",
            short: "Potential Points"
        }

        const winsGraph = {
            stats: winPercentages,
            x: "Wins",
            stat: "",
            header: "Team Wins",
            field: "wins",
            short: "Wins"
        }

        const winPercentagesGraph = {
            stats: winPercentages,
            x: "Win Percentage",
            stat: "%",
            header: "Team Win Percentages",
            field: "percentage",
            short: "Win Percentage"
        }

        const fptsHistoriesGraph = {
            stats: fptsHistories,
            x: "Fantasy Points",
            stat: "",
            header: "Team Fantasy Points",
            field: "fptsFor",
            short: "Fantasy Points"
        }

        const tradesGraph = {
            stats: tradesData,
            x: "# of trades",
            stat: "",
            header: "Number of Trades Managers Have Made",
            field: "trades",
            short: "Trades"
        }

        const waiversGraph = {
            stats: wD,
            x: "# of Waiver Moves",
            stat: "",
            header: "Waivers Moves Managers Have Made",
            field: "waivers",
            short: "Waivers"
        }
        const gs = [];

        if(lineupIQs[0]?.potentialPoints) {
            gs.push(generateGraph(lineupIQGraph, year));
        }
        gs.push(generateGraph(winsGraph, year, 5));
        gs.push(generateGraph(winPercentagesGraph, year));
        gs.push(generateGraph(fptsHistoriesGraph, year));
        if(lineupIQs[0]?.potentialPoints) {
            gs.push(generateGraph(potentialPointsGraph, year, 10, 0));
        }
        if(key == "regularSeasonData") {
            gs.push(generateGraph(tradesGraph, year));
            gs.push(generateGraph(waiversGraph, year));
        }

        curGraph = 0;
        graphs = gs;
    }

    const setTransactionsAndGraphs = (wD) => {
        if(wD[0].rosterID) {
            for(let i = 1; i <= waiversData.length; i++) {
                if(!tradesData.find(t => t.rosterID == i)) {
                    tradesData.push({
                        rosterID: i,
                        trades: 0,
                    })
                }
            }
        }
        if(wD[0].managerID) {
            for(const userID in leagueTeamManagers.users) {
                if(!tradesData.find(t => t.managerID == userID)) {
                    tradesData.push({
                        managerID: userID,
                        trades: 0,
                    })
                }
            }
        }
        const transactions = [];

        for(const w of wD) {
            let trades = 0;
            if(tradesData[0].managerID) {
                trades = tradesData.find(t => t.managerID == w.managerID)?.trades || 0;
            } else if(tradesData[0].rosterID) {
                trades = tradesData.find(t => t.rosterID == w.rosterID)?.trades || 0;
            }
            const waivers = w.waivers;
            transactions.push({
                rosterID: w.rosterID,
                managerID: w.managerID,
                trades,
                waivers,
            })
        }

        setGraphs(wD)
        return transactions;
    }

    const setTables = (lIQs) => {
        const t = [
            "Win Percentages",
            "Points",
        ]
        if(key == "regularSeasonData") {
            t.push("Transactions")
        }
        if(!lIQs[0]?.potentialPoints) {
            iqOffset = 1;
        } else {
            t.unshift('Lineup IQs');
        }
        tables = t
    }

    $: transactions =  setTransactionsAndGraphs(waiversData)
    $: changeTable(curGraph);
    $: changeGraph(curTable);
    $: setTables(lineupIQs)
    
    let innerWidth;
</script>

<svelte:window bind:innerWidth={innerWidth} />

<h4 class="text-center my-8 mb-4 text-white text-xl font-bold">{prefix} Records</h4>

<div class="flex flex-wrap justify-around my-12 mx-auto max-w-7xl gap-6">
    {#if weekRecords && weekRecords.length}
        <div class="w-full lg:w-[48%] bg-[#111827]/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-md">
            <div class="bg-[#1f2937]/80 text-white text-center font-semibold py-3 px-4 border-b border-slate-800">
                {prefix} {key == "playoffData" ? "Playoff " : ""}Single Week Scoring Records
            </div>
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="border-b border-slate-800 text-slate-400 text-sm">
                        <th class="py-3 px-4 w-12"></th>
                        <th class="py-3 px-4">Manager</th>
                        <th class="py-3 px-4">Week</th>
                        <th class="py-3 px-4 text-right">Total Points</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-slate-200">
                    {#each weekRecords as leagueWeekRecord, ix}
                        <tr class="hover:bg-slate-800/30 transition-colors">
                            <td class="py-3 px-4 text-slate-400">{ix + 1}</td>
                            <td class="py-3 px-4 cursor-pointer" on:click={() => gotoManager({year: leagueWeekRecord.year || prefix, leagueTeamManagers, rosterID: leagueWeekRecord.rosterID})}>
                                <RecordTeam {leagueTeamManagers} rosterID={leagueWeekRecord.rosterID} year={allTime ? leagueWeekRecord.year : prefix} />
                            </td>
                            <td class="py-3 px-4 text-slate-300">{allTime ? leagueWeekRecord.year + " " : "" }{key == "regularSeasonData" ? "Week " : ""}{leagueWeekRecord.week}</td>
                            <td class="py-3 px-4 text-right font-medium">{round(leagueWeekRecord.fpts)}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}

    {#if weekLows && weekLows.length}
        <div class="w-full lg:w-[48%] bg-[#111827]/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-md">
            <div class="bg-[#1f2937]/80 text-white text-center font-semibold py-3 px-4 border-b border-slate-800">
                {prefix} {key == "playoffData" ? "Playoff " : ""}Single Week Scoring Lows
            </div>
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="border-b border-slate-800 text-slate-400 text-sm">
                        <th class="py-3 px-4 w-12"></th>
                        <th class="py-3 px-4">Manager</th>
                        <th class="py-3 px-4">Week</th>
                        <th class="py-3 px-4 text-right">Total Points</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-slate-200">
                    {#each weekLows as leagueWeekLow, ix}
                        <tr class="hover:bg-slate-800/30 transition-colors">
                            <td class="py-3 px-4 text-slate-400">{ix + 1}</td>
                            <td class="py-3 px-4 cursor-pointer" on:click={() => gotoManager({year: leagueWeekLow.year || prefix, leagueTeamManagers, rosterID: leagueWeekLow.rosterID})}>
                                <RecordTeam {leagueTeamManagers} rosterID={leagueWeekLow.rosterID} year={allTime ? leagueWeekLow.year : prefix} />
                            </td>
                            <td class="py-3 px-4 text-slate-300">{allTime ? leagueWeekLow.year + " " : "" }{key == "regularSeasonData" ? "Week " : ""}{leagueWeekLow.week}</td>
                            <td class="py-3 px-4 text-right font-medium">{round(leagueWeekLow.fpts)}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}

    {#if allTime && key == "regularSeasonData"}
        <div class="w-full lg:w-[48%] bg-[#111827]/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-md">
            <div class="bg-[#1f2937]/80 text-white text-center font-semibold py-3 px-4 border-b border-slate-800">
                All-Time Highest Season Points
                <span class="block italic text-[0.85em] text-slate-400 font-normal">Ranked by PPG</span>
            </div>
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="border-b border-slate-800 text-slate-400 text-sm">
                        <th class="py-3 px-4 w-12"></th>
                        <th class="py-3 px-4">Manager</th>
                        <th class="py-3 px-4">Year</th>
                        <th class="py-3 px-4 text-right">Total Points</th>
                        <th class="py-3 px-4 text-right">PPG</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-slate-200">
                    {#each seasonLongRecords as mostSeasonLongPoint, ix}
                        <tr class="hover:bg-slate-800/30 transition-colors">
                            <td class="py-3 px-4 text-slate-400">{ix + 1}</td>
                            <td class="py-3 px-4 cursor-pointer" on:click={() => gotoManager({year: mostSeasonLongPoint.year, leagueTeamManagers, rosterID: mostSeasonLongPoint.rosterID})}>
                                <RecordTeam {leagueTeamManagers} rosterID={mostSeasonLongPoint.rosterID} year={mostSeasonLongPoint.year} />
                            </td>
                            <td class="py-3 px-4 text-slate-300">{mostSeasonLongPoint.year}</td>
                            <td class="py-3 px-4 text-right">{round(mostSeasonLongPoint.fpts)}</td>
                            <td class="py-3 px-4 text-right font-medium">{mostSeasonLongPoint.fptsPerGame}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
    
    {#if allTime && key == "regularSeasonData"}
        <div class="w-full lg:w-[48%] bg-[#111827]/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-md">
            <div class="bg-[#1f2937]/80 text-white text-center font-semibold py-3 px-4 border-b border-slate-800">
                All-Time Lowest Season Points
                <span class="block italic text-[0.85em] text-slate-400 font-normal">Ranked by PPG</span>
            </div>
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="border-b border-slate-800 text-slate-400 text-sm">
                        <th class="py-3 px-4 w-12"></th>
                        <th class="py-3 px-4">Manager</th>
                        <th class="py-3 px-4">Year</th>
                        <th class="py-3 px-4 text-right">Total Points</th>
                        <th class="py-3 px-4 text-right">PPG</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-slate-200">
                    {#each seasonLongLows as leastSeasonLongPoint, ix}
                        <tr class="hover:bg-slate-800/30 transition-colors">
                            <td class="py-3 px-4 text-slate-400">{ix + 1}</td>
                            <td class="py-3 px-4 cursor-pointer" on:click={() => gotoManager({year: leastSeasonLongPoint.year, leagueTeamManagers, rosterID: leastSeasonLongPoint.rosterID})}>
                                <RecordTeam {leagueTeamManagers} rosterID={leastSeasonLongPoint.rosterID} year={leastSeasonLongPoint.year} />
                            </td>
                            <td class="py-3 px-4 text-slate-300">{leastSeasonLongPoint.year}</td>
                            <td class="py-3 px-4 text-right">{round(leastSeasonLongPoint.fpts)}</td>
                            <td class="py-3 px-4 text-right font-medium">{leastSeasonLongPoint.fptsPerGame}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}

    {#if blowouts && blowouts.length}
        <div class="w-full lg:w-[48%] bg-[#111827]/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-md">
            <div class="bg-[#1f2937]/80 text-white text-center font-semibold py-3 px-4 border-b border-slate-800">
                {prefix} Largest {key == "playoffData" ? "Playoff " : ""}Blowouts
            </div>
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="border-b border-slate-800 text-slate-400 text-sm">
                        <th class="py-3 px-4 w-12"></th>
                        <th class="py-3 px-4">Matchup</th>
                        <th class="py-3 px-4">Week</th>
                        <th class="py-3 px-4 text-right">Differential</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-slate-200">
                    {#each blowouts as blowout, ix}
                        <tr class="hover:bg-slate-800/30 transition-colors">
                            <td class="py-3 px-4 text-slate-400">{ix + 1}</td>
                            <td class="py-3 px-4 py-2">
                                <div class="space-y-1.5">
                                    <div class="cursor-pointer" on:click={() => gotoManager({year: blowout.year || prefix, leagueTeamManagers, rosterID: blowout.home.rosterID})}>
                                        <RecordTeam {leagueTeamManagers} rosterID={blowout.home.rosterID} year={allTime ? blowout.year : prefix} compressed={true} points={round(blowout.home.fpts)} />
                                    </div>
                                    <div class="text-xs text-slate-500 pl-1">vs</div>
                                    <div class="cursor-pointer" on:click={() => gotoManager({year: blowout.year || prefix, leagueTeamManagers, rosterID: blowout.away.rosterID})}>
                                        <RecordTeam {leagueTeamManagers} rosterID={blowout.away.rosterID} year={allTime ? blowout.year : prefix} compressed={true} points={round(blowout.away.fpts)} />
                                    </div>
                                </div>
                            </td>
                            <td class="py-3 px-4 text-slate-300">{allTime ? blowout.year + " " : "" }{key == "regularSeasonData" ? "Week " : ""}{blowout.week}</td>
                            <td class="py-3 px-4 text-right font-medium">{round(blowout.differential)}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}

    {#if closestMatchups && closestMatchups.length}
        <div class="w-full lg:w-[48%] bg-[#111827]/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-md">
            <div class="bg-[#1f2937]/80 text-white text-center font-semibold py-3 px-4 border-b border-slate-800">
                {prefix} Narrowest {key == "playoffData" ? "Playoff " : ""}Wins
            </div>
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="border-b border-slate-800 text-slate-400 text-sm">
                        <th class="py-3 px-4 w-12"></th>
                        <th class="py-3 px-4">Matchup</th>
                        <th class="py-3 px-4">Week</th>
                        <th class="py-3 px-4 text-right">Differential</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-slate-200">
                    {#each closestMatchups as closestMatchup, ix}
                        <tr class="hover:bg-slate-800/30 transition-colors">
                            <td class="py-3 px-4 text-slate-400">{ix + 1}</td>
                            <td class="py-3 px-4 py-2">
                                <div class="space-y-1.5">
                                    <div class="cursor-pointer" on:click={() => gotoManager({year: closestMatchup.year || prefix, leagueTeamManagers, rosterID: closestMatchup.home.rosterID})}>
                                        <RecordTeam {leagueTeamManagers} rosterID={closestMatchup.home.rosterID} year={allTime ? closestMatchup.year : prefix} compressed={true} points={round(closestMatchup.home.fpts)} />
                                    </div>
                                    <div class="text-xs text-slate-500 pl-1">vs</div>
                                    <div class="cursor-pointer" on:click={() => gotoManager({year: closestMatchup.year || prefix, leagueTeamManagers, rosterID: closestMatchup.away.rosterID})}>
                                        <RecordTeam {leagueTeamManagers} rosterID={closestMatchup.away.rosterID} year={allTime ? closestMatchup.year : prefix} compressed={true} points={round(closestMatchup.away.fpts)} />
                                    </div>
                                </div>
                            </td>
                            <td class="py-3 px-4 text-slate-300">{allTime ? closestMatchup.year + " " : "" }{key == "regularSeasonData" ? "Week " : ""}{closestMatchup.week}</td>
                            <td class="py-3 px-4 text-right font-medium">{round(closestMatchup.differential)}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>

<h4 class="text-center my-8 mb-4 text-white text-xl font-bold">{prefix} {key == "playoffData" ? "Playoff " : ""}Rankings</h4>

{#if graphs.length}
    <BarChart {graphs} bind:curGraph={curGraph} {leagueTeamManagers} />
{/if}

<div class="block w-full overflow-x-hidden my-6">
    <div class="relative flex flex-nowrap w-[400%] transition-[margin-left] duration-500" style="margin-left: -{100 * curTable}%;">
        {#if lineupIQs[0]?.potentialPoints}
            <div class="w-1/4 px-4">
                <div class="max-w-5xl mx-auto bg-[#111827]/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-md">
                    <div class="bg-[#1f2937]/80 text-white text-center font-semibold py-3 px-4 border-b border-slate-800">
                        {prefix} {key == "playoffData" ? "Playoff " : ""}Lineup IQ Rankings
                        <div class="font-normal italic text-[0.8em] text-slate-400 mt-0.5">
                            The percentage of potential points each manager has captured
                        </div>
                    </div>
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="border-b border-slate-800 text-slate-400 text-sm">
                                <th class="py-3 px-4 w-12"></th>
                                <th class="py-3 px-4">Manager</th>
                                <th class="py-3 px-4">Lineup IQ</th>
                                <th class="py-3 px-4 text-right">Points</th>
                                <th class="py-3 px-4 text-right">Potential Points</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60 text-slate-200">
                            {#each lineupIQs as lineupIQ, ix}
                                <tr class="hover:bg-slate-800/30 transition-colors">
                                    <td class="py-3 px-4 text-slate-400">{ix + 1}</td>
                                    <td class="py-3 px-4 cursor-pointer" on:click={() => gotoManager({year: lineupIQ.year || prefix, leagueTeamManagers, managerID: lineupIQ.managerID, rosterID: lineupIQ.rosterID})}>
                                        <RecordTeam {leagueTeamManagers} managerID={lineupIQ.managerID} rosterID={lineupIQ.rosterID} year={allTime ? lineupIQ.year : prefix} />
                                    </td>
                                    <td class="py-3 px-4 font-medium">{lineupIQ.iq}%</td>
                                    <td class="py-3 px-4 text-right">{round(lineupIQ.fpts)}</td>
                                    <td class="py-3 px-4 text-right">{round(lineupIQ.potentialPoints)}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </div>
        {/if}

        <div class="w-1/4 px-4">
            <div class="max-w-5xl mx-auto bg-[#111827]/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-md">
                <div class="bg-[#1f2937]/80 text-white text-center font-semibold py-3 px-4 border-b border-slate-800">
                    {prefix} {key == "playoffData" ? "Playoff " : ""}Win Percentages Rankings
                </div>
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="border-b border-slate-800 text-slate-400 text-sm">
                            <th class="py-3 px-4 w-12"></th>
                            <th class="py-3 px-4">Manager</th>
                            <th class="py-3 px-4">Win %</th>
                            <th class="py-3 px-4">Wins</th>
                            {#if showTies}
                                <th class="py-3 px-4">Ties</th>
                            {/if}
                            <th class="py-3 px-4 text-right">Losses</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60 text-slate-200">
                        {#each winPercentages as winPercentage, ix}
                            <tr class="hover:bg-slate-800/30 transition-colors">
                                <td class="py-3 px-4 text-slate-400">{ix + 1}</td>
                                <td class="py-3 px-4 cursor-pointer" on:click={() => gotoManager({year: winPercentage.year || prefix, leagueTeamManagers, rosterID: winPercentage.rosterID, managerID: winPercentage.managerID})}>
                                    <RecordTeam {leagueTeamManagers} managerID={winPercentage.managerID} rosterID={winPercentage.rosterID} year={allTime ? winPercentage.year : prefix} />
                                </td>
                                <td class="py-3 px-4 font-medium">{winPercentage.percentage}%</td>
                                <td class="py-3 px-4">{winPercentage.wins}</td>
                                {#if showTies}
                                    <td class="py-3 px-4">{winPercentage.ties}</td>
                                {/if}
                                <td class="py-3 px-4 text-right">{winPercentage.losses}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="w-1/4 px-4">
            <div class="max-w-5xl mx-auto bg-[#111827]/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-md">
                <div class="bg-[#1f2937]/80 text-white text-center font-semibold py-3 px-4 border-b border-slate-800">
                    {prefix} {key == "playoffData" ? "Playoff " : ""}Fantasy Points Rankings
                </div>
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="border-b border-slate-800 text-slate-400 text-sm">
                            <th class="py-3 px-4 w-12"></th>
                            <th class="py-3 px-4">Manager</th>
                            <th class="py-3 px-4">Points For</th>
                            <th class="py-3 px-4">Points Against</th>
                            <th class="py-3 px-4 text-right">Points Per Game</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60 text-slate-200">
                        {#each fptsHistories as fptsHistory, ix}
                            <tr class="hover:bg-slate-800/30 transition-colors">
                                <td class="py-3 px-4 text-slate-400">{ix + 1}</td>
                                <td class="py-3 px-4 cursor-pointer" on:click={() => gotoManager({year: fptsHistory.year || prefix, leagueTeamManagers, rosterID: fptsHistory.rosterID, managerID: fptsHistory.managerID})}>
                                    <RecordTeam {leagueTeamManagers} managerID={fptsHistory.managerID} rosterID={fptsHistory.rosterID} year={allTime ? fptsHistory.year : prefix} />
                                </td>
                                <td class="py-3 px-4 font-medium">{round(fptsHistory.fptsFor)}</td>
                                <td class="py-3 px-4">{round(fptsHistory.fptsAgainst)}</td>
                                <td class="py-3 px-4 text-right">{round(fptsHistory.fptsPerGame)}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="w-1/4 px-4">
            <div class="max-w-5xl mx-auto bg-[#111827]/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-md">
                <div class="bg-[#1f2937]/80 text-white text-center font-semibold py-3 px-4 border-b border-slate-800">
                    {prefix} Transaction Totals
                </div>
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="border-b border-slate-800 text-slate-400 text-sm">
                            <th class="py-3 px-4 w-12"></th>
                            <th class="py-3 px-4">Manager</th>
                            <th class="py-3 px-4">Trades</th>
                            <th class="py-3 px-4 text-right">Waivers</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60 text-slate-200">
                        {#each transactions as transaction, ix}
                            <tr class="hover:bg-slate-800/30 transition-colors">
                                <td class="py-3 px-4 text-slate-400">{ix + 1}</td>
                                <td class="py-3 px-4 cursor-pointer" on:click={() => gotoManager({year: transaction.year || prefix, leagueTeamManagers, rosterID: transaction.rosterID, managerID: transaction.managerID})}>
                                    <RecordTeam {leagueTeamManagers} managerID={transaction.managerID} rosterID={transaction.rosterID} year={allTime ? transaction.year : prefix} />
                                </td>
                                <td class="py-3 px-4">{transaction.trades}</td>
                                <td class="py-3 px-4 text-right font-medium">{transaction.waivers}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<div class="flex justify-center my-8 mb-16">
    <div class="inline-flex rounded-xl border border-slate-800 bg-slate-950/80 p-1.5 shadow-inner">
        {#each tables as table, ix}
            <button 
                type="button"
                disabled={curTable === ix}
                on:click={() => curTable = ix}
                class="rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:px-6 sm:text-sm {curTable === ix ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}"
            >
                {table}
            </button>
        {/each}
    </div>
</div>