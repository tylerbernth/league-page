<script>
    import { round } from "$lib/utils/helper";
    import { checkIfManagerReceivedAward, getTeamNameFromTeamManagers } from "$lib/utils/helperFunctions/universalFunctions";

    export let awards, records, rosterID, tookOver, leagueTeamManagers, managerID;

    let displayAwards = [];
    let formerGlobal = false;

    const capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    const checkIfDeserves = (awardRosterID, userRosterID, year) => {
        if (!managerID || !year || !awardRosterID) {
            return awardRosterID == userRosterID;
        }
        return checkIfManagerReceivedAward(leagueTeamManagers, awardRosterID, year, managerID);
    };

    const checkIfDeservesWithManagerID = (recordManagerID, userRosterID) => {
        if (managerID) {
            return recordManagerID == managerID;
        }
        for (const year in leagueTeamManagers.teamManagersMap) {
            for (const rID in leagueTeamManagers.teamManagersMap[year]) {
                if (leagueTeamManagers.teamManagersMap[year][rID].managers.indexOf(recordManagerID) > -1) {
                    return rID == userRosterID;
                }
            }
        }
        return false;
    };

    const computePodiums = (cRosterID) => {
        formerGlobal = false;
        displayAwards = [];

        // Annual awards (champion, second, etc)
        for (const podium of awards) {
            for (const award in podium) {
                if (award == "year") continue;
                if (award == "divisions") {
                    for (const division of podium[award]) {
                        if (checkIfDeserves(division.rosterID, cRosterID, podium.year)) {
                            const former = tookOver && tookOver > podium.year;
                            if (former) formerGlobal = true;
                            
                            let awardTitle = "Regular Season Champion";
                            if (division.name) {
                                awardTitle = `${division.name} Division Champion`;
                            }
                            displayAwards.push({
                                award: awardTitle,
                                icon: "/awards/division.png",
                                type: "award",
                                originalName: getTeamNameFromTeamManagers(leagueTeamManagers, cRosterID, podium.year),
                                year: podium.year,
                                former,
                            });
                        }
                    }
                } else if (checkIfDeserves(podium[award], cRosterID, podium.year)) {
                    const former = tookOver && tookOver > podium.year;
                    if (former) formerGlobal = true;

                    displayAwards.push({
                        award: capitalizeFirstLetter(award),
                        icon: `/awards/${award}.png`,
                        type: "award",
                        originalName: getTeamNameFromTeamManagers(leagueTeamManagers, cRosterID, podium.year),
                        year: podium.year,
                        former,
                    });
                }
            }
        }

        // Record books
        const leagueManagerRecords = [];
        for (const key in records.regularSeasonData.leagueManagerRecords) {
            const record = records.regularSeasonData.leagueManagerRecords[key];
            record.rosterID = key;
            leagueManagerRecords.push(record);
        }

        const winRecords = [...leagueManagerRecords].sort((a, b) => b.wins - a.wins);
        const pointsRecords = [...leagueManagerRecords].sort((a, b) => b.fptsFor - a.fptsFor);
        const iqRecords = [...leagueManagerRecords].sort((a, b) => (b.fptsFor / b.potentialPoints) - (a.fptsFor / a.potentialPoints));

        for (let i = 0; i < records.regularSeasonData.mostSeasonLongPoints.length; i++) {
            const seasonLongRecord = records.regularSeasonData.mostSeasonLongPoints[i];
            const winRecord = winRecords[i];
            const pointsRecord = pointsRecords[i];
            const iqRecord = iqRecords[i];

            if (checkIfDeservesWithManagerID(winRecord?.rosterID, cRosterID) && i < 3) {
                displayAwards.push({
                    award: i + 1,
                    icon: `/awards/record-${i + 1}.png`,
                    type: "All-Time Wins Record",
                    extraInfo: winRecord.wins,
                    wins: true,
                });
            }

            if (checkIfDeservesWithManagerID(pointsRecord?.rosterID, cRosterID) && i < 3) {
                displayAwards.push({
                    award: i + 1,
                    icon: `/awards/record-${i + 1}.png`,
                    type: "All-Time Fantasy Points Record",
                    extraInfo: round(pointsRecord.fptsFor),
                });
            }

            if (checkIfDeservesWithManagerID(iqRecord?.rosterID, cRosterID) && i < 3) {
                displayAwards.push({
                    award: i + 1,
                    icon: `/awards/record-${i + 1}.png`,
                    type: "All-Time Lineup IQ Record",
                    extraInfo: round((iqRecord.fptsFor * 100) / iqRecord.potentialPoints),
                    iq: true,
                });
            }

            if (checkIfDeserves(seasonLongRecord.rosterID, cRosterID, seasonLongRecord.year)) {
                const former = tookOver && tookOver > seasonLongRecord.year;
                if (former) formerGlobal = true;

                displayAwards.push({
                    award: i + 1,
                    icon: `/awards/${i < 3 ? `record-${i + 1}` : "generic"}.png`,
                    type: "All-Time Season Long Points",
                    originalName: getTeamNameFromTeamManagers(leagueTeamManagers, cRosterID, seasonLongRecord.year),
                    year: seasonLongRecord.year,
                    extraInfo: seasonLongRecord.fpts,
                    former,
                });
            }
        }

        for (let i = 0; i < records.regularSeasonData.leagueWeekHighs.length; i++) {
            const leagueWeekRecord = records.regularSeasonData.leagueWeekHighs[i];
            if (checkIfDeserves(leagueWeekRecord.rosterID, cRosterID, leagueWeekRecord.year)) {
                const former = tookOver && tookOver > leagueWeekRecord.year;
                if (former) formerGlobal = true;

                displayAwards.push({
                    award: i + 1,
                    icon: `/awards/${i < 3 ? `record-${i + 1}` : "generic"}.png`,
                    type: "All-Time Single Week Record",
                    originalName: getTeamNameFromTeamManagers(leagueTeamManagers, cRosterID, leagueWeekRecord.year),
                    year: leagueWeekRecord.year,
                    week: leagueWeekRecord.week,
                    extraInfo: leagueWeekRecord.fpts,
                    former,
                });
            }
        }

        for (const yearRecords of records.regularSeasonData.seasonWeekRecords) {
            for (let i = 0; i < 3; i++) {
                const seasonPointsRecord = yearRecords.seasonPointsHighs[i];
                if (seasonPointsRecord && checkIfDeserves(seasonPointsRecord.rosterID, cRosterID, yearRecords.year)) {
                    const former = tookOver && tookOver > yearRecords.year;
                    if (former) formerGlobal = true;

                    displayAwards.push({
                        award: i + 1,
                        icon: `/awards/${i < 3 ? `record-${i + 1}` : "generic"}.png`,
                        type: `${yearRecords.year} Single Week Record`,
                        originalName: getTeamNameFromTeamManagers(leagueTeamManagers, cRosterID, seasonPointsRecord.year),
                        year: null,
                        week: seasonPointsRecord.week,
                        extraInfo: seasonPointsRecord.fpts,
                        former,
                    });
                }
            }
        }
    };

    $: computePodiums(rosterID);

    const computeAward = (award) => {
        switch (award) {
            case 1: return '1st Place';
            case 2: return '2nd Place';
            case 3: return '3rd Place';
            case 4: case 5: case 6: case 7: case 8: case 9: case 10:
                return award + 'th Place';
            case 'Champion': return award;
            case 'Second': case 'Third':
                return award + ' Place';
            case 'Toilet': return award + ' Bowl';
            default: return award;
        }
    };

    const handleImgError = (e) => {
        e.target.src = '/awards/generic.png';
    };
</script>

<div class="mx-auto my-8 w-full max-w-6xl rounded-2xl border border-indigo-500/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md">
    <h3 class="mb-8 text-center text-2xl font-light tracking-wide text-slate-200 sm:text-3xl">
        Team Awards & Records
    </h3>
    
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {#each displayAwards as award}
            <div class="flex flex-col items-center justify-between rounded-xl border border-slate-800 bg-slate-800/40 p-3 text-center shadow-sm transition-all hover:border-indigo-500/30 hover:bg-slate-800/80">
                <div class="flex h-8 w-full items-center justify-center text-[10px] font-semibold uppercase tracking-wider text-indigo-300 sm:text-xs">
                    {award.type !== 'award' ? award.type : 'League Award'}
                </div>
                
                <div class="my-2 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-indigo-500/20 bg-slate-900 p-2 shadow-inner ring-1 ring-white/10 transition-transform hover:scale-105">
                    <img 
                        class="h-full w-full object-contain" 
                        src="{award.icon}" 
                        alt="award icon" 
                        onerror={handleImgError}
                    />
                </div>
                
                <div class="flex min-h-[2.5rem] w-full items-center justify-center text-xs font-bold leading-tight text-slate-100 sm:text-sm">
                    {award.type === 'award' ? `${award.year} ` : ''}{computeAward(award.award)}{award.former ? '*' : ''}
                </div>
                
                <div class="mt-1 flex min-h-[1.25rem] w-full items-center justify-center text-[11px] font-medium italic leading-tight text-slate-400">
                    {#if award.extraInfo}
                        {award.year ? `${award.year} ` : ''}{award.week ? `Week ${award.week} ` : ''}{award.year || award.week ? ' - ' : ''}{award.extraInfo}{award.wins ? ' Wins' : ''}{award.iq ? '%' : ''}{!award.wins && !award.iq ? 'pts' : ''}
                    {/if}
                </div>
            </div>
        {:else}
            <div class="col-span-full py-12 text-center text-sm italic text-slate-500">
                ...no awards or records found yet
            </div>
        {/each}
    </div>

    {#if formerGlobal}
        <p class="mt-6 text-center text-xs italic text-slate-500">
            *Awarded under a previous manager
        </p>
    {/if}
</div>