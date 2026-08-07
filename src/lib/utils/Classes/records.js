import { sortHighAndLow } from '../helperFunctions/universalFunctions';

/** this holds all the data and the functions necessary to compute a league's records (both per season, as well as for all-time) */
export class Records {
    constructor() { 
        this.leagueManagerRecords = {}; 
        this.leagueRosterRecords = {}; 
        this.seasonWeekRecords = []; 
        this.leagueWeekRecords = []; 
        this.seasonLongPoints = []; 
        this.allTimeMatchupDifferentials = []; 

        this.allTimeBiggestBlowouts = [];
        this.allTimeClosestMatchups = [];
        this.leastSeasonLongPoints = [];
        this.mostSeasonLongPoints = [];
        this.leagueWeekLows = [];
        this.leagueWeekHighs = [];

        this.currentYear = null;
        this.lastYear = null;
    }
}

Records.prototype.confirmManagerRecord = function(managerID) {
    if(!this.leagueManagerRecords[managerID]) {
        this.leagueManagerRecords[managerID] = {
            wins: 0,
            losses: 0,
            ties: 0,
            fptsFor: 0,
            fptsAgainst: 0,
            potentialPoints: 0,
            pOGames: 0,
            byes: 0,
            playoffAppearances: 0,
            biggestBlowout: { margin: 0, opponent: '', year: '', week: '' },
            worstLoss: { margin: 0, opponent: '', year: '', week: '' },
            highScore: { score: 0, opponent: '', year: '', week: '' },
            lowScore: { score: 9999, opponent: '', year: '', week: '' },
        }
    }
}

Records.prototype.confirmRosterRecord = function(rosterID) {
    if(!this.leagueRosterRecords[rosterID]) {
        this.leagueRosterRecords[rosterID] = {
            years: []
        }
    }
}

Records.prototype.updateManagerRecord = function(managers, {rosterID, year, wins, losses, ties, fptsPerGame, fptsFor, fptsAgainst, potentialPoints, pOGames, byes}) {
    for(const managerID of managers) {
        this.confirmManagerRecord(managerID);

        this.leagueManagerRecords[managerID].wins += wins;
        this.leagueManagerRecords[managerID].losses += losses;
        this.leagueManagerRecords[managerID].ties += ties;
        this.leagueManagerRecords[managerID].fptsFor += fptsFor;
        this.leagueManagerRecords[managerID].fptsAgainst += fptsAgainst;
        this.leagueManagerRecords[managerID].potentialPoints += potentialPoints;
        this.leagueManagerRecords[managerID].pOGames += pOGames;
        this.leagueManagerRecords[managerID].byes += byes;
        this.leagueManagerRecords[managerID].playoffAppearances ++;
        
        this.leagueManagerRecords[managerID]._rosterIDs = this.leagueManagerRecords[managerID]._rosterIDs || new Set();
        this.leagueManagerRecords[managerID]._rosterIDs.add(rosterID);
    }
    
    this.confirmRosterRecord(rosterID);
    this.leagueRosterRecords[rosterID].years.push({
        wins, losses, ties, fpts: fptsFor, fptsAgainst, fptsPerGame,
        potentialPoints, pOGames, byes, rosterID, year,
    });
}

Records.prototype.addSeasonLongPoints = function({rosterID, fpts, fptsPerGame, year}) {
    this.seasonLongPoints.push({ rosterID, fpts, fptsPerGame, year });
}

Records.prototype.addLeagueWeekRecord = function(entry) {
    this.leagueWeekRecords.push(entry);
}

Records.prototype.addAllTimeMatchupDifferentials = function(matchupDifferentials) {
    this.allTimeMatchupDifferentials = this.allTimeMatchupDifferentials.concat(matchupDifferentials);
}

Records.prototype.addSeasonWeekRecord = function(entry) {
    this.seasonWeekRecords.push(entry);
}

/**
 * Computes individual manager career highlights from all-time match differentials.
 */
Records.prototype.computeManagerHighlights = function() {
    const rosterToMgr = {};
    for(const mId in this.leagueManagerRecords) {
        const mgr = this.leagueManagerRecords[mId];
        if(mgr._rosterIDs) {
            for(const rId of mgr._rosterIDs) {
                rosterToMgr[rId] = mId;
            }
        }
    }

    const findWeek = (year, rosterID, score) => {
        const targetRoster = String(rosterID);
        const targetYear = String(year);
        const searchArrays = [this.seasonWeekRecords, this.leagueWeekRecords];

        for (const arr of searchArrays) {
            if (!arr || !arr.length) continue;
            const found = arr.find(sw => {
                const swYear = String(sw.year || sw.season);
                const swRoster = String(sw.rosterID || sw.roster_id || sw.roster);
                const swScore = Number(sw.fpts ?? sw.score ?? 0);
                
                return swYear === targetYear && 
                       swRoster === targetRoster && 
                       Math.abs(swScore - score) < 0.01;
            });
            if (found && (found.week !== undefined && found.week !== null && found.week !== '')) {
                return found.week;
            }
        }
        return '';
    };

    for(const match of this.allTimeMatchupDifferentials) {
        const { year, home, away, differential } = match;
        const homeMgrId = rosterToMgr[home.rosterID];
        const awayMgrId = rosterToMgr[away.rosterID];

        const isHomeWinner = home.fpts >= away.fpts;
        const winner = isHomeWinner ? home : away;
        const loser = isHomeWinner ? away : home;
        const winnerMgrId = isHomeWinner ? homeMgrId : awayMgrId;
        const loserMgrId = isHomeWinner ? awayMgrId : homeMgrId;

        const homeRec = this.leagueManagerRecords[homeMgrId];
        const awayRec = this.leagueManagerRecords[awayMgrId];
        const winnerRec = this.leagueManagerRecords[winnerMgrId];
        const loserRec = this.leagueManagerRecords[loserMgrId];

        const homeOpponent = `Roster ${away.rosterID}`;
        const awayOpponent = `Roster ${home.rosterID}`;

        const baseWeek = match.week !== undefined ? match.week : '';
        const homeWeek = baseWeek !== '' ? baseWeek : findWeek(year, home.rosterID, home.fpts);
        const awayWeek = baseWeek !== '' ? baseWeek : findWeek(year, away.rosterID, away.fpts);

        // High / Low Scores
        if(homeRec) {
            if(home.fpts > homeRec.highScore.score) {
                homeRec.highScore = { score: home.fpts, opponent: homeOpponent, year, week: homeWeek };
            }
            if(home.fpts < homeRec.lowScore.score) {
                homeRec.lowScore = { score: home.fpts, opponent: homeOpponent, year, week: homeWeek };
            }
        }
        if(awayRec) {
            if(away.fpts > awayRec.highScore.score) {
                awayRec.highScore = { score: away.fpts, opponent: awayOpponent, year, week: awayWeek };
            }
            if(away.fpts < awayRec.lowScore.score) {
                awayRec.lowScore = { score: away.fpts, opponent: awayOpponent, year, week: awayWeek };
            }
        }

        // Blowouts & Losses
        const winnerObj = winner === home ? home : away;
        const loserObj = loser === home ? home : away;

        const winnerWeek = baseWeek !== '' ? baseWeek : findWeek(year, winnerObj.rosterID, winnerObj.fpts);
        const loserWeek = baseWeek !== '' ? baseWeek : findWeek(year, loserObj.rosterID, loserObj.fpts);

        const winnerOpponent = winner === home ? awayOpponent : homeOpponent;
        const loserOpponent = loser === home ? awayOpponent : homeOpponent;

        if(winnerRec && differential > winnerRec.biggestBlowout.margin) {
            winnerRec.biggestBlowout = { margin: differential, opponent: winnerOpponent, year, week: winnerWeek };
        }
        if(loserRec && differential > loserRec.worstLoss.margin) {
            loserRec.worstLoss = { margin: differential, opponent: loserOpponent, year, week: loserWeek };
        }
    }

    for(const mId in this.leagueManagerRecords) {
        if(this.leagueManagerRecords[mId].lowScore.score === 9999) {
            this.leagueManagerRecords[mId].lowScore.score = 0;
        }
    }
}

Records.prototype.finalizeAllTimeRecords = function({currentYear, lastYear}) {
    const [allTimeBiggestBlowouts, allTimeClosestMatchups] = sortHighAndLow(this.allTimeMatchupDifferentials, 'differential')
    this.allTimeBiggestBlowouts = allTimeBiggestBlowouts;
    this.allTimeClosestMatchups = allTimeClosestMatchups;

    const [leagueWeekHighs, leagueWeekLows] = sortHighAndLow(this.leagueWeekRecords, 'fpts')
    this.leagueWeekHighs = leagueWeekHighs;
    this.leagueWeekLows = leagueWeekLows;

    const [mostSeasonLongPoints, leastSeasonLongPoints] = sortHighAndLow(this.seasonLongPoints, 'fptsPerGame')
    this.mostSeasonLongPoints = mostSeasonLongPoints;
    this.leastSeasonLongPoints = leastSeasonLongPoints;

    this.computeManagerHighlights();

    this.currentYear = currentYear;
    this.lastYear = lastYear;
}

Records.prototype.returnRecords = function() {
    return {
        allTimeBiggestBlowouts: this.allTimeBiggestBlowouts,
        allTimeClosestMatchups: this.allTimeClosestMatchups,
        leastSeasonLongPoints: this.leastSeasonLongPoints,
        mostSeasonLongPoints: this.mostSeasonLongPoints,
        leagueWeekLows: this.leagueWeekLows,
        leagueWeekHighs: this.leagueWeekHighs,
        seasonWeekRecords: this.seasonWeekRecords,
        leagueManagerRecords: this.leagueManagerRecords,
        leagueRosterRecords: this.leagueRosterRecords,
        currentYear: this.currentYear,
        lastYear: this.lastYear,
    }
}