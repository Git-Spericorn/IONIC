import { Component, OnInit, ViewChild } from '@angular/core';
import { FixtureModel } from '../Model/Fixture.model';

import { MenuController, LoadingController, IonInfiniteScroll } from '@ionic/angular';
import { FixtureService } from './fixture.service';
import { SharedUiService } from '../shared/shared-ui.service';
import { UserService } from '../shared/user/user.service';
import { FilterService } from '../shared/Filter/filter.service';
import { environment } from 'src/environments/environment';
import { DeviceService } from '../shared/device/device.service';
import { resolve } from 'dns';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-fixtures',
  templateUrl: './fixtures.page.html',
  styleUrls: ['./fixtures.page.scss'],
})
export class FixturesPage implements OnInit {

  @ViewChild(IonInfiniteScroll) infiniteScroll: IonInfiniteScroll;
  fixtureModel: FixtureModel[] = [];
  isLoading = false;
  isLogedIn = false;
  imgBaseUrl = environment.logoImgPath;
  perPage: number;
  recordCount: number;
  offset: number;
  itemsLoaded: number;
  loadFilter: boolean;
  subscription: Subscription

  constructor(
    private menuCntrl: MenuController,
    private fixtureService: FixtureService,
    public loadingController: LoadingController,
    private sharedService: SharedUiService,
    private userServise: UserService,
    private filterService: FilterService,
    private deviceService: DeviceService
  ) { }

  ngOnInit() {
    this.fixtureService.loadFixtureData.subscribe(data => {
      if (data) {
        this.getFixtureList(0);
      }
    })

    this.filterService.filterChanged.subscribe(data => {
      if (data && data.page == 1) {
        this.offset = 0;
        this.fixtureModel = [];
        this.getFixtureList(0);
      }
    })
  }

  ionViewWillEnter() {
    this.fixtureModel = [];
    this.offset = 0;
    this.menuCntrl.enable(true);

    this.isLoading = false;
    this.userServise.getUser().subscribe(
      userData => {
        if (userData) {
          this.isLogedIn = true;
        }
      }
    )
    this.sharedService.setCurrentPage("2");
    this.getFixtureList(0);
  }

  /*Toggle filter menu */
  toggleFilter() {
    this.menuCntrl.toggle()
  }

  /*Load Fixture details */
  getFixtureList(loadFavourite) {

    return new Promise((resolve, reject) => {
      if (this.fixtureModel.length == 0) {
        this.isLoading = true;
      }
      this.deviceService.getDeviceId().then(data => {
        this.subscription = this.fixtureService.getFixtureList(data.uuid.toString(), data.model.toString(), loadFavourite, this.offset).subscribe(data => {

          if (this.fixtureModel.length == 0) {
            this.isLoading = false;
          }

          if (this.offset > 0) {
            this.fixtureService.previousDateSchedule = this.fixtureModel[this.fixtureModel.length - 1].date_schedule;
          }
          if (this.offset == 0) {
            this.fixtureModel = [];
          }
          this.fixtureModel = this.fixtureModel.concat(data.fixtureList);
          this.recordCount = data.totalRecords;
          this.perPage = data.fetchRecords;
          this.itemsLoaded = data.currentRows;
          resolve();
        },
          error => {
            console.log("Fixture error :: " + error);
            reject();
          });
      })
    })

  }

  /*Pagination logic */
  loadData(event) {
    this.offset++;
    if (this.perPage == this.itemsLoaded) {
      this.getFixtureList(0).then(
        () => {
          event.target.complete();
          if (this.perPage != this.itemsLoaded) {
            event.target.disabled = true;
          }
        }
      )
    } else {
      event.target.disabled = true;
    }

  }

  /*Infinate scroll toggle*/
  toggleInfiniteScroll() {
    this.infiniteScroll.disabled = !this.infiniteScroll.disabled;
  }

  ionViewDidLeave() {
    this.filterService.clearFilter(); // clear filter data
    this.subscription.unsubscribe(); // unsubscribe
  }

}
