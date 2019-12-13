import { Component, OnInit, Input } from '@angular/core';
import { PickerController, ModalController, LoadingController, AlertController } from '@ionic/angular';
import { PickerOptions } from '@ionic/core';
import { FixtureService, TireBasedScoring } from './fixture.service';

@Component({
  selector: 'app-score',
  templateUrl: './score.component.html',
  styleUrls: ['./score.component.scss'],
})
export class ScoreComponent implements OnInit {

  @Input() params;
  eventId: number;
  isClicked: boolean;
  isWashout = false;
  homeScore: string;
  awayScore: string;
  framework: string;
  type: number;
  scoreCount: number;
  selectedIndex: number;
  awayScores: number[];
  homeScores: number[];
  reportHome: string;
  backArrow: string;
  customPickerOptions: any;

  constructor(
    private pickerCntrl: PickerController,
    private modalCtrl: ModalController,
    private fixtureService: FixtureService,
    private loadingController: LoadingController,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
    this.homeScore = '0';
    this.awayScore = '0';
    this.framework = '';
    this.type = 1;
    this.scoreCount = 1;
    this.selectedIndex = 0;
    this.awayScores = [0];
    this.homeScores = [0];
    this.reportHome = '';
    this.eventId = this.params.eventId;
    this.backArrow = '/assets/icon/back.png';
    this.isClicked = false;
  }

  /*-- Wheel Picker --*/
  async showPicker(type) {
    let option = [];
    let selected = false;
    for (let i = 0; i < 100; i++) {
      option.push({ text: i, value: i });
    }
    let opts: PickerOptions = {
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Done',
          cssClass: 'wheelBtn',
          handler: () => {
            selected = true;
            return true;
          }
        }],
      columns: [
        {
          name: 'options',
          options: option
        }
      ],
      mode: 'ios'
    };
    let picker = await this.pickerCntrl.create(opts);
    picker.present();
    picker.onDidDismiss().then(async data => {
      let col = await picker.getColumn('options');
      this.framework = col.options[col.selectedIndex].text;

      if (selected) {
        if (type == '1') {
          this.homeScore = this.framework;
          this.homeScores[this.selectedIndex] = +this.framework;
        } else if (type == '2') {
          this.awayScore = this.framework;
          this.awayScores[this.selectedIndex] = +this.framework;
        }
      }
    })
  }

  onCancel() {
    this.modalCtrl.dismiss(null, 'cancel');
    this.fixtureService.loadFixtureData.emit(true);
  }

  /*-- Show alert --*/
  showAlert(message: string) {
    return this.alertCtrl.create(
      {
        header: 'Success',
        message: message,
        buttons: [
          {
            text: 'Okay'
          }
        ]
      }
    ).then(alertEl => alertEl.present());
  }

  /* --show picker for home section -- */
  updateHome(index: number) {
    this.selectedIndex = index;
    this.showPicker(1);
  }

  /* --show picker for away section -- */
  updateAway(index: number) {
    this.selectedIndex = index;
    this.showPicker(2);
  }

  /* -- add away/home scores */
  addGame() {
    if (this.params.gameType == 19) {
      if (this.scoreCount < 3) {
        this.scoreCount++;
        this.awayScores.push(0);
        this.homeScores.push(0);
      }
    } else {

      if (this.scoreCount < 4) {
        this.scoreCount++;
        this.awayScores.push(0);
        this.homeScores.push(0);
      }
    }
  }

  /*-- Save game score -- */
  finish() {
    let tireBasedScoringObj: TireBasedScoring = new TireBasedScoring(
      this.awayScores,
      this.homeScores,
      this.eventId,
      this.reportHome
    );

    this.loadingController.create({ keyboardClose: true, message: 'Updating Score' }).then(loadingEl => {
      loadingEl.present();
      this.fixtureService.updateScoreTireBased(tireBasedScoringObj)
        .subscribe(data => {
          loadingEl.dismiss();
          if (data) {
            this.showAlert("Scores updated successfully.");
            this.onCancel();
          }
        })
    })
  }

}
