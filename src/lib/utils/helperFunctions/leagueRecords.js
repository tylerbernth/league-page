import { getLeagueData } from './leagueData';
import { leagueID } from '$lib/utils/leagueInfo';
import { getNflState } from './nflState';
import { getLeagueRosters } from "./leagueRosters";
import { waitForAll } from './multiPromise';
import { get } from 'svelte/store';
import { records } from '$lib/stores';
import { getManagers, round, sortHighAndLow } from './universalFunctions';
import { Records } from '$lib/utils/dataClasses';
import { getBrackets } from './leagueBrackets';
import { browser } from '$app/environment';
import { getLeagueTeamManagers } from './leagueTeamManagers';
import { managers as managersObj } from '$lib/utils/leagueInfo';

/**
 * Computes individual manager career highlights (Blowouts, Worst Losses, High/Low Scores)
 * from processed matchup differentials and roster mappings.
 */
const computeManagerCareerHighlights = (matchupDifferentials, leagueTeamManagerData, managerRecords) => {
    if (!matchupDifferentials || !managerRecords) return managerRecords;

    const getMgrId = (year, rosterID) => {
        return leagueTeamManagerData?.teamManagersMap?.[year]?.[rosterID]?.managers?.[0] || null;
    };

    const getTeamLabel = (mgrId, rosterID, year) => {
        if (mgrId) {
            const userObj = leagueTeamManagerData?.users?.[mgrId];
            if (userObj?.display_name) return userObj.display_name;
            const found = managersObj.find(m => m.managerID === mgrId);
            if (found) return found.name;
        }
        return `Roster ${rosterID}`;
    };

    for (const key in managerRecords) {
        managerRecords[key].biggestBlowout = { margin: 0, opponent: '', year: '', week: '' };
        managerRecords[key].worstLoss = { margin: 0, opponent: '', year: '', week: '' };
        managerRecords[key].highScore = { score: 0, opponent: '', year: '', week: '' };
        managerRecords[key].lowScore = { score: 9999, opponent: '', year: '', week: '' };
    }

    const findRecordRef = (mgrId, rosterID) => {
        if (mgrId && managerRecords[mgrId]) return managerRecords[mgrId];
        if (rosterID && managerRecords[rosterID]) return managerRecords[rosterID];
        for (const k in managerRecords) {
            if (managerRecords[k]?.rosterID === rosterID) return managerRecords[k];
        }
        return null;
    };

    for (const match of matchupDifferentials) {
        const { year, week, home, away, differential } = match;
        const homeMgrId = getMgrId(year, home.rosterID);
        const awayMgrId = getMgrId(year, away.rosterID);

        const homeOpponentName = getTeamLabel(awayMgrId, away.rosterID, year);
        const awayOpponentName = getTeamLabel(homeMgrId, home.rosterID, year);

        const isHomeWinner = home.fpts >= away.fpts;
        const winner = isHomeWinner ? home : away;
        const loser = isHomeWinner ? away : home;
        const winnerMgrId = isHomeWinner ? homeMgrId : awayMgrId;
        const loserMgrId = isHomeWinner ? awayMgrId : homeMgrId;

        const homeRec = findRecordRef(homeMgrId, home.rosterID);
        const awayRec = findRecordRef(awayMgrId, away.rosterID);
        const winnerRec = findRecordRef(winnerMgrId, winner.rosterID);
        const loserRec = findRecordRef(loserMgrId, loser.rosterID);

        // 1. Check High / Low Scores
        if (homeRec) {
            if (home.fpts > (homeRec.highScore?.score || 0)) {
                homeRec.highScore = { score: home.fpts, opponent: homeOpponentName, year, week };
            }
            if (home.fpts < (homeRec.highScore?.score === 0 ? 9999 : (homeRec.lowScore?.score || 9999))) {
                homeRec.lowScore = { score: home.fpts, opponent: homeOpponentName, year, week };
            }
        }
        if (awayRec) {
            if (away.fpts > (awayRec.highScore?.score || 0)) {
                awayRec.highScore = { score: away.fpts, opponent: awayOpponentName, year, week };
            }
            if (away.fpts < (awayRec.highScore?.score === 0 ? 9999 : (awayRec.lowScore?.score || 9999))) {
                awayRec.lowScore = { score: away.fpts, opponent: awayOpponentName, year, week };
            }
        }

        // 2. Check Biggest Blowout & Worst Loss
        if (winnerRec) {
            if (differential > (winnerRec.biggestBlowout?.margin || 0)) {
                winnerRec.biggestBlowout = { margin: differential, opponent: winner === home ? homeOpponentName : awayOpponentName, year, week };
            }
        }
        if (loserRec) {
            if (differential > (loserRec.worstLoss?.margin || 0)) {
                loserRec.worstLoss = { margin: differential, opponent: loser === home ? homeOpponentName : awayOpponentName, year, week };
            }
        }
    }

    for (const key in managerRecords) {
        if (managerRecords[key].lowScore?.score === 9999) {
            managerRecords[key].lowScore.score = 0;
        }
    }

    return managerRecords;
};

/**
 * getLeagueRecords obtains all the record for a league since it was first created
 * @param {bool} refresh if set to false, getLeagueRecords returns the records stored in localStorage
 * @returns {Object} { allTimeBiggestBlowouts, allTimeClosestMatchups, leastSeasonLongPoints, mostSeasonLongPoints, leagueWeekLows, leagueWeekHighs, seasonWeekRecords, leagueManagerRecords, currentYear, lastYear}
 */
export const getLeagueRecords = async (refresh = false) => {
    if(get(records).leagueWeekHighs) {
        return get(records);
    }

    if(!refresh && browser) {
        let localRecords = await JSON.parse(localStorage.getItem("records"));
        if(localRecords && localRecords.playoffData) {
            localRecords.stale = true;
            return localRecords;
        }
    }

    const nflState = await getNflState().catch((err) => { console.error(err); });
    let week = 0;
    if(nflState.season_type == 'regular') {
        week = nflState.week - 1;
    } else if(nflState.season_type == 'post') {
        week = 18;
    }

    let curSeason = leagueID;
    let currentYear;
    let lastYear;

    let regularSeason = new Records();
    let playoffRecords = new Records();

    let leagueTeamManagers = await getLeagueTeamManagers().catch(err => console.error(err));

    while(curSeason && curSeason != 0) {
        const [rosterRes, leagueData] = await waitForAll(
            getLeagueRosters(curSeason),
            getLeagueData(curSeason),
        ).catch((err) => { console.error(err); });

        const rosters = rosterRes.rosters;

        if(leagueData.status == 'complete' || week > leagueData.settings.playoff_week_start - 1) {
            week = leagueData.settings.playoff_week_start - 1;
        }

        const {
            season,
            year,
        } = await processRegularSeason({leagueData, rosters, curSeason, week, regularSeason})

        const pS = await processPlayoffs({year, curSeason, week, playoffRecords, rosters})

        if(pS) {
            playoffRecords = pS; 
        }

        lastYear = year;

        if(!currentYear && year) {
            currentYear = year;
        }

        curSeason = season;
    }

    playoffRecords.currentYear = regularSeason.currentYear;
    playoffRecords.lastYear = regularSeason.lastYear;

    regularSeason.finalizeAllTimeRecords({currentYear, lastYear});
    playoffRecords.finalizeAllTimeRecords({currentYear, lastYear});
    
    const regularSeasonData = regularSeason.returnRecords();
    const playoffData = playoffRecords.returnRecords();

    let managerRecordsMap = regularSeasonData?.leagueManagerRecords || regularSeasonData?.managerRecords || regularSeasonData?.managers || regularSeasonData;

    if ((!managerRecordsMap || Object.keys(managerRecordsMap).length === 0) && regularSeason.managerRecords) {
        managerRecordsMap = regularSeason.managerRecords;
    }

    if (managerRecordsMap && typeof managerRecordsMap === 'object') {
        for (const mId in managerRecordsMap) {
            const mRecord = managerRecordsMap[mId];
            const wins = mRecord.wins || mRecord.W || 0;
            const losses = mRecord.losses || mRecord.L || 0;
            const ties = mRecord.ties || mRecord.T || 0;
            const totalGames = wins + losses + ties;

            if (mRecord.fptsFor && totalGames > 0 && !mRecord.avgScore) {
                mRecord.avgScore = mRecord.fptsFor / totalGames;
            } else if (!mRecord.avgScore) {
                mRecord.avgScore = mRecord.fptsPerGame || 0;
            }

            if (mRecord.fptsAgainst && totalGames > 0 && !mRecord.avgPtsAg) {
                mRecord.avgPtsAg = mRecord.fptsAgainst / totalGames;
            } else if (!mRecord.avgPtsAg) {
                mRecord.avgPtsAg = mRecord.fptsAgainstPerGame || 0;
            }

            mRecord.biggestBlowout = mRecord.biggestBlowout || { margin: 0, opponent: '', year: '', week: '' };
            mRecord.worstLoss = mRecord.worstLoss || { margin: 0, opponent: '', year: '', week: '' };
            mRecord.highScore = mRecord.highScore || { score: 0, opponent: '', year: '', week: '' };
            mRecord.lowScore = mRecord.lowScore || { score: 0, opponent: '', year: '', week: '' };
        }
    }

    if (leagueTeamManagers && managerRecordsMap) {
        computeManagerCareerHighlights(regularSeason.allTimeMatchupDifferentials || [], leagueTeamManagers, managerRecordsMap);
    }

    const recordsData = {regularSeasonData, playoffData};

    if(browser) {
        localStorage.setItem("records", JSON.stringify(recordsData));
        records.update(() => recordsData);
    }

    return recordsData;
}

const processRegularSeason = async ({rosters, leagueData, curSeason, week, regularSeason}) => {
    let year = parseInt(leagueData.season);

    if(leagueData.status == 'complete' || week > leagueData.settings.playoff_week_start - 1) {
        week = leagueData.settings.playoff_week_start - 1;
    }

    for(const rosterID in rosters) {
        analyzeRosters({year, roster: rosters[rosterID], regularSeason});
    }

    const matchupsPromises = [];
    let fetchWeek = parseInt(week);
    while(fetchWeek > 0) {
        matchupsPromises.push(fetch(`https://api.sleeper.app/v1/league/${curSeason}/matchups/${fetchWeek}`, {compress: true}))
        fetchWeek--;
    }

    const matchupsRes = await waitForAll(...matchupsPromises).catch((err) => { console.error(err); });

    const matchupsJsonPromises = [];
    for(const matchupRes of matchupsRes) {
        const data = matchupRes.json();
        matchupsJsonPromises.push(data)
        if (!matchupRes.ok) {
            console.error(data);
        }
    }
    const matchupsData = await waitForAll(...matchupsJsonPromises).catch((err) => { console.error(err); });

    curSeason = leagueData.previous_league_id;

    let seasonPointsRecord = [];
    let matchupDifferentials = [];
    
    // Process weeks cleanly in descending order matching the fetch sequence
    let currentWeekNum = parseInt(week);
    for(const matchupWeek of matchupsData) {
        const {sPR, mD} = processMatchups({
            matchupWeek, 
            seasonPointsRecord, 
            record: regularSeason, 
            weekNum: currentWeekNum, 
            matchupDifferentials, 
            year
        });
        seasonPointsRecord = sPR;
        matchupDifferentials = mD;
        currentWeekNum--;
    }

    const [biggestBlowouts, closestMatchups] = sortHighAndLow(matchupDifferentials, 'differential')
    const [seasonPointsHighs, seasonPointsLows] = sortHighAndLow(seasonPointsRecord, 'fpts')

    regularSeason.addAllTimeMatchupDifferentials(matchupDifferentials);

    if(seasonPointsHighs.length > 0) {
        regularSeason.addSeasonWeekRecord({
            year,
            biggestBlowouts,
            closestMatchups,
            seasonPointsLows,
            seasonPointsHighs,
        });
    } else {
        year = null;
    }

    return {
        season: curSeason,
        year,
    }
}

const analyzeRosters = ({year, roster, regularSeason}) => {
    const rosterID = roster.roster_id;
    const managers = getManagers(roster);

    if(roster.settings.wins == 0 && roster.settings.ties == 0 && roster.settings.losses == 0) return;

    const fptsFor = roster.settings.fpts + (roster.settings.fpts_decimal / 100);
    const fptsPerGame = round(fptsFor / (roster.settings.wins + roster.settings.losses + roster.settings.ties));

    const rosterRecords = {
        wins:  roster.settings.wins,
        losses:  roster.settings.losses,
        ties:  roster.settings.ties,
        fptsFor,
        fptsAgainst:  roster.settings.fpts_against + (roster.settings.fpts_against_decimal / 100),
        fptsPerGame,
        potentialPoints:  roster.settings.ppts + (roster.settings.ppts_decimal / 100),
        rosterID,
        year,
    }

    regularSeason.updateManagerRecord(managers, rosterRecords);

    regularSeason.addSeasonLongPoints({
        rosterID,
        fpts: fptsFor,
        fptsPerGame,
        year,
    });
}

const processMatchups = ({matchupWeek, seasonPointsRecord, record, weekNum, matchupDifferentials, year}) => {
    let matchups = {};
    let pSD = {};

    for(const matchup of matchupWeek) {
        const rosterID = matchup.roster_id;
        if(!rosterID) continue;

        let mID = matchup.matchup_id;

        if(!mID) {
            if(!pSD[rosterID]) {
                pSD[rosterID] = {
                    wins: 0,
                    losses: 0,
                    ties: 0,
                    fptsFor: 0,
                    fptsAgainst: 0,
                    potentialPoints: 0,
                    fptspg: 0,
                    pOGames: 0,
                    byes: 0,
                }
            }
            pSD[rosterID].pOGames = 1;
            const m = matchup.m;
            if(!m) {
                pSD[rosterID].byes = 1;
                continue;
            }
            mID = `PS:${m}`
        }
        
        const entry = {
            rosterID,
            fpts: matchup.points,
            week: weekNum,
            year,
        }

        if(!matchups[mID]) {
            matchups[mID] = [];
        }
        matchups[mID].push(entry);
        record.addLeagueWeekRecord(entry);
        seasonPointsRecord.push(entry);
    }

    for(const matchupKey in matchups) {
        const matchup = matchups[matchupKey];
        let home = matchup[0];
        let away = matchup[1];

        if(!away || !home) continue;
        
        if(home.fpts < away.fpts) {
            home = matchup[1];
            away = matchup[0];
        }
        const matchupDifferential = {
            year: home.year,
            week: home.week, // Explicitly bound to entry week
            home: {
                rosterID: home.rosterID,
                fpts: home.fpts,
            },
            away: {
                rosterID: away.rosterID,
                fpts: away.fpts,
            },
            differential: home.fpts - away.fpts
        }
        matchupDifferentials.push(matchupDifferential);

        if(matchupKey.split(":")[0] == "PS") {
            pSD[home.rosterID].wins = 1;
            pSD[home.rosterID].fptsFor = home.fpts;
            pSD[home.rosterID].fptsAgainst = away.fpts;
            
            pSD[away.rosterID].losses = 1;
            pSD[away.rosterID].fptsFor = away.fpts;
            pSD[away.rosterID].fptsAgainst = home.fpts;
        }
    }

    return {
        sPR: seasonPointsRecord,
        mD: matchupDifferentials,
        pSD
    }
}

const processPlayoffs = async ({curSeason, playoffRecords, year, week, rosters}) => {
    const {
        playoffsStart,
        playoffRounds,
        champs,
    } = await getBrackets(curSeason);

    if(week <= playoffsStart || !year) {
        return null;
    }

    let seasonPointsRecord = [];
    let matchupDifferentials = [];
    let postSeasonData = {};

    const champBracket = digestBracket({bracket: champs.bracket, playoffsStart, matchupDifferentials, postSeasonData, playoffRecords, playoffRounds, consolation: false, seasonPointsRecord, year});

    postSeasonData = champBracket.postSeasonData;
    seasonPointsRecord = champBracket.seasonPointsRecord;
    playoffRecords = champBracket.playoffRecords;
    matchupDifferentials = champBracket.matchupDifferentials;

    const consolationBracket = digestBracket({bracket: champs.consolations, playoffsStart, matchupDifferentials, postSeasonData, playoffRecords, playoffRounds, consolation: true, seasonPointsRecord, year});

    postSeasonData = consolationBracket.postSeasonData;
    seasonPointsRecord = consolationBracket.seasonPointsRecord;
    playoffRecords = consolationBracket.playoffRecords;
    matchupDifferentials = consolationBracket.matchupDifferentials;

    for(const rosterID in postSeasonData) {
        const pSD = postSeasonData[rosterID];
        const fptsPerGame = round(pSD.fptsFor / (pSD.wins + pSD.losses + pSD.ties));
        pSD.fptsPerGame = fptsPerGame;
        pSD.year = year;
        pSD.rosterID = rosterID;

        playoffRecords.addSeasonLongPoints({
            fpts: pSD.fptsFor,
            fptsPerGame,
            year,
            rosterID: rosterID,
        })

        const managers = getManagers(rosters[rosterID]);
        playoffRecords.updateManagerRecord(managers, pSD);
    }

    const [biggestBlowouts, closestMatchups] = sortHighAndLow(matchupDifferentials, 'differential')
    const [seasonPointsHighs, seasonPointsLows] = sortHighAndLow(seasonPointsRecord, 'fpts')

    playoffRecords.addAllTimeMatchupDifferentials(matchupDifferentials);

    if(seasonPointsHighs.length > 0) {
        playoffRecords.addSeasonWeekRecord({
            year,
            biggestBlowouts,
            closestMatchups,
            seasonPointsLows,
            seasonPointsHighs,
        });
    }
    
    return playoffRecords;
}

const digestBracket = ({bracket, playoffRecords, playoffRounds, matchupDifferentials, postSeasonData, consolation, seasonPointsRecord, playoffsStart, year}) => {
    for(let i = 0; i < bracket.length; i++) {
        const weekNum = getStartWeek(i + (playoffRounds - bracket.length), playoffRounds, consolation, playoffsStart);
        const matchupWeek = [];

        for(let matchups of bracket[i]) {
            if(consolation) {
                matchups.flat();
            }
            for(const matchup of matchups) {
                if(matchup.r) {
                    const newMatchup = {...matchup}
                    let points = 0;
                    for(const k in newMatchup.points) {
                        points += newMatchup.points[k].reduce((t, nV) => t + nV, 0);
                    }
                    newMatchup.points = points;
                    matchupWeek.push(newMatchup);
                }
            }
        }
        const {sPR, mD, pSD} = processMatchups({matchupWeek, seasonPointsRecord, record: playoffRecords, weekNum, matchupDifferentials, year})

        postSeasonData = meshPostSeasonData(postSeasonData, pSD);

        seasonPointsRecord = sPR;
        matchupDifferentials = mD;
    }

    return {postSeasonData, seasonPointsRecord, playoffRecords, matchupDifferentials}
}

const meshPostSeasonData = (postSeasonData, pSD) => {
    for(const key in pSD) {
        if(!postSeasonData[key]) {
            postSeasonData[key] = pSD[key];
            continue;
        }
        for(const k in pSD[key]) {
            if(k == 'manager') continue;
            postSessionData[key][k] += pSD[key][k];
        }
    }

    return postSeasonData;
}

const getStartWeek = (i, playoffRounds, consolation, playoffsStart) => {
    if (consolation) {
        return `(C) Week ${playoffsStart + i}`;
    }

    switch (playoffRounds - i) {
        case 1:
            return "Finals";
        case 2:
            return "Semi-Finals"
        case 3:
            return "Quarter-Finals"
    
        default:
            return "Qualifiers";
    }
}