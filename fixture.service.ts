import { Injectable, EventEmitter } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FixtureDetails } from '../Model/fixtureDetails.model';
import { tap, switchMap, map, take } from 'rxjs/operators';
import { BehaviorSubject, of } from 'rxjs';
import { httpOptions } from '../shared/api/api-call'

import { FixtureModel } from '../Model/Fixture.model';
import { FilterModel, DivivsionList, SchoolList, RoundList, SportList } from '../Model/Filter/Filter.model';
import { FilterService } from '../shared/Filter/filter.service';
import { UserService } from '../shared/user/user.service';

export class Score {
    constructor(
        public away: string,
        public home: string,
        public event_id: string,
        public forfeit: string,
        public washout: string,
        public forfeitAway: string,
        public reportHome: string
    ) { }
}
export class TireBasedScoring {
    constructor(
        public away: number[],
        public home: number[],
        public event_id: number,
        public reportHome: string
    ) { }
}

export interface SaveGameScore {
    SUCCESS: boolean,
    SAVEGAMESCORE: boolean
}

@Injectable({
    providedIn: 'root'
})

export class FixtureService {

    constructor(
        private http: HttpClient,
        private filterservice: FilterService,
        private userServise: UserService
    ) { }

    private _fixtureList = new BehaviorSubject<FixtureModel[]>([]); // Fixture list obs
    loadFixtureData = new EventEmitter<boolean>(); //Load filter flag
    filter = new EventEmitter<FilterModel>(); //Flter details obs

    get fixtureList() {
        return this._fixtureList.asObservable();
    }

    /*-- load fixture details --*/
    getFixtureList(device_id: string, device_name: string, loadFavourite) {

        let body = new URLSearchParams();
        body.set('clientTimeZone', '');
        body.set('eventDate', '');
        body.set('favouriteTeamIds', JSON.stringify(this.filterservice.selectedFavourites));
        body.set('Client_ids', JSON.stringify(this.filterservice.selectedSports));
        body.set('Gamerounds', JSON.stringify(this.filterservice.selectedRounds));
        body.set('Division_ids', JSON.stringify(this.filterservice.selectedDivision));
        body.set('Club_ids', JSON.stringify(this.filterservice.selectedSchools));
        body.set('DeviceKey', device_id);
        body.set('DeviceName', device_name);
        body.set('loadFavourite', loadFavourite);
        body.set('masterPersonId', environment.masterPersonId);

        return this.userServise.getUser().pipe(
            switchMap(user => {
                if (user) {
                    body.set('person_id', user.personId.toString());
                }
                return this.userServise.getUser();
            }),
            take(1),
            switchMap(user => {
                return this.http.post<FixtureDetails>(
                    environment.baseURL + environment.endPoints.fixtureTirebased,
                    body.toString(),
                    httpOptions
                )
            }),
            map(result => {
                const fixtureList = [];
                if (result.hasOwnProperty('GETFIXTURELIST')) {
                    for (let key in result.GETFIXTURELIST) {
                        fixtureList.push(
                            new FixtureModel(
                                result.GETFIXTURELIST[key].date_schedule,
                                result.GETFIXTURELIST[key].fixture_details
                            )
                        );
                    }
                    return {
                        fixtureList: fixtureList,
                        filter: new FilterModel(
                            result.GETFILTERTEAMLIST,
                            result.GETFILTERDIVISIONLIST,
                            result.GETFILTERSCHOOLLIST,
                            result.GETFILTERROUNDLIST,
                            result.GETFILTERSPORTLIST
                        )
                    };
                }
            }),
            take(1),
            tap(fixtureList => {
                this._fixtureList.next(fixtureList.fixtureList);
                this.filterservice._filterData.next(fixtureList.filter);
                this.filterservice.loadFilter.emit({ flag: true, page: 1 });
            }, error => {
                console.log(error);
            })
        )
    }

    /*-- Update score  --*/
    updateScore(score: Score) {
        let body = new URLSearchParams();
        body.set('eventId', score.event_id);
        body.set('homescore', score.home);
        body.set('awayscore', score.away);
        body.set('forfeit', score.forfeit);
        body.set('washout', score.washout);
        body.set('forfeitAway', score.forfeitAway);
        body.set('reportHome', score.reportHome);

        return this.http.post<SaveGameScore>(
            environment.baseURL + environment.endPoints.saveGameScore,
            body.toString(),
            httpOptions
        ).pipe(
            map(result => {
                return result;
            }), error => {
                console.log(error);
            }
        )
    }

    /*-- Update score tirebased --*/
    updateScoreTireBased(score: TireBasedScoring) {
        let body = new URLSearchParams();
        body.set('eventId', score.event_id.toString());
        body.set('reportHome', score.reportHome);

        for (let i = 0; i < score.away.length; i++) {
            switch (i) {
                case 0:
                    body.set('homescore', score.home[i].toString());
                    body.set('awayscore', score.away[i].toString());
                    break;
                case 1:
                    body.set('tier2homeScore', score.home[i].toString());
                    body.set('tier2AwayScore', score.away[i].toString());
                    break;
                case 2:
                    body.set('tier3homeScore', score.home[i].toString());
                    body.set('tier3AwayScore', score.away[i].toString());
                    break;
                case 3:
                    body.set('tier4homeScore', score.home[i].toString());
                    body.set('tier4AwayScore', score.away[i].toString());
                    break;
                case 4:
                    body.set('tier5homeScore', score.home[i].toString());
                    body.set('tier5AwayScore', score.away[i].toString());
                    break;
            }
        }

        return this.http.post<SaveGameScore>(
            environment.baseURL + environment.endPoints.saveGameScoreTierBased,
            body.toString(),
            httpOptions
        ).pipe(
            map(result => {
                return result;
            }), error => {
                console.log(error);
            }
        )
    }
}
