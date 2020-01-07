import { Component, OnInit } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { LaderService } from './lader.service';
import { environment } from '../../environments/environment';
import { DeviceService } from '../shared/device/device.service';

@Component({
  selector: 'app-laders',
  templateUrl: './laders.page.html',
  styleUrls: ['./laders.page.scss'],
})
export class LadersPage implements OnInit {
  isLoading = false;
  ladderGames: [] = [];
  favouriteTeams: [] = [];
  imgBaseUrl = environment.logoImgPath
  constructor(
    private menuCntrl: MenuController,
    private ladderService: LaderService,
    private deviceService: DeviceService
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    // this.isLoading = true;
    console.log("----ION---");
    this.loadLadderGames();
    this.menuCntrl.enable(false);

  }

  toggleFilter() {
    this.menuCntrl.toggle()
  }

  loadLadderGames() {
    this.isLoading = true;
    this.deviceService.getDeviceId().then(data => {

      this.ladderService.getLadderGame(data.uuid.toString(), data.model.toString()).subscribe(data => {
        this.isLoading = false;
        this.ladderGames = data.GETGAME;
        this.favouriteTeams = data.FAVOURITETEAM;
        console.log(data);
      })
    })

  }

}
