import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef, EventEmitter, Output } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { BackgroundMessageService } from '../background-message.service';
import { TASKS } from 'src/const'; 
import { IdentityService } from '../identity.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  currentDID: string;
  signingInfoSet: any[] = [];
  
  @ViewChild('addNewKeyButton') addNewKeyButton: ElementRef;

  @ViewChild('newPasswordModalClose') newPasswordModalClose: ElementRef;
  @ViewChild('newPasswordModalYes') newPasswordModalYes: ElementRef;
  @ViewChild('newPasswordModalInfo') newPasswordModalInfo: ElementRef;
  @ViewChild('oldPassword') oldPassword: ElementRef;
  @ViewChild('newPassword') newPassword: ElementRef;
  @ViewChild('newPassword2') newPassword2: ElementRef;
  
  @ViewChild('removeKeyModalInfo') removeKeyModalInfo: ElementRef;
  @ViewChild('removeKeyModalClose') removeKeyModalClose: ElementRef;
  @ViewChild('removeKeyModalYes') removeKeyModalYes: ElementRef;
  @ViewChild('toRemoveKeyKID') toRemoveKeyKID: ElementRef;

  @Output() clickedBack = new EventEmitter<boolean>();

  constructor(private changeDetector: ChangeDetectorRef, private toastrService: ToastrService, private messageService: BackgroundMessageService, private identityService: IdentityService) {
    this.messageService.sendMessage(
      {
        task: TASKS.GET_IDENTITY
      }
      ,
      (response) => {
        if(response.did){
          this.currentDID = response.did;
          this.signingInfoSet = JSON.parse(response.keys);
        }
        else{
          this.currentDID = 'No DID provided';
          this.addNewKeyButton.nativeElement.disabled = true;
        }
        this.changeDetector.detectChanges();
      }
    )
  }

  ngOnInit(): void {
  }

  didChange(changed: boolean){
    if(changed){
      this.addNewKeyButton.nativeElement.disabled = false;
      this.currentDID = this.identityService.getCurrentDID();
      this.signingInfoSet = this.identityService.getSigningInfoSet();
      this.changeDetector.detectChanges();
    }
  }

  async removeKey(kid: string){
    this.removeKeyModalInfo.nativeElement.classList.remove('error');
    this.removeKeyModalInfo.nativeElement.classList.add('waiting');
    this.removeKeyModalInfo.nativeElement.innerText = 'Please wait';
    this.removeKeyModalClose.nativeElement.disabled = true;
    this.removeKeyModalYes.nativeElement.disabled = true;

    if(kid){
      this.messageService.sendMessage({
        task: TASKS.REMOVE_KEY,
        kid: kid,
        }, 
        (response) =>{
          if(response.result){
            this.signingInfoSet = this.signingInfoSet.filter(key => {
              return key.kid !== kid;
            });
            this.toastrService.success(response.result, 'DID_SIOP', {
              onActivateTick: true,
              positionClass: 'toast-bottom-center',
            });
            this.removeKeyModalClose.nativeElement.disabled = false;
            this.removeKeyModalYes.nativeElement.disabled = false;
            this.removeKeyModalClose.nativeElement.click();
            this.changeDetector.detectChanges();
          }
          else if(response.err){
            this.removeKeyModalInfo.nativeElement.innerText = response.err;
            this.removeKeyModalInfo.nativeElement.classList.remove('waiting');
            this.removeKeyModalInfo.nativeElement.classList.add('error');
            this.removeKeyModalClose.nativeElement.disabled = false;
            this.removeKeyModalYes.nativeElement.disabled = false;
          }
        }
      );
    }
  }

  selectKey(keyid){
    this.toRemoveKeyKID.nativeElement.value = keyid;
    this.removeKeyModalInfo.nativeElement.innerText = '';
  }

  changePasswordButtonClicked(){
    this.newPasswordModalInfo.nativeElement.innerText = '';
    this.newPassword.nativeElement.value = '';
    this.newPassword2.nativeElement.value = '';
    this.oldPassword.nativeElement.value = '';
  }

  async changePassword(oldPassword: string, newPassword: string, newPassword2: string){
    this.newPasswordModalInfo.nativeElement.classList.remove('error');
    this.newPasswordModalInfo.nativeElement.classList.add('waiting');
    this.newPasswordModalInfo.nativeElement.innerText = 'Please wait';
    this.newPasswordModalClose.nativeElement.disabled = true;
    this.newPasswordModalYes.nativeElement.disabled = true;

    if(oldPassword.length != 0 && newPassword.length != 0 && newPassword2.length != 0){
      if(newPassword === newPassword2){
        this.messageService.sendMessage({
            task: TASKS.LOGIN,
            password: oldPassword
          }, 
          (response)=> {
            if(response.result){
             this.messageService.sendMessage({
               task: TASKS.CHANGE_EXT_AUTHENTICATION,
               oldPassword: oldPassword,
               newPassword: newPassword,
             },
              (response)=> {
                if(response.result){
                  this.oldPassword.nativeElement.value = '';
                  this.newPassword.nativeElement.value = '';
                  this.newPassword2.nativeElement.value = '';
                  this.newPasswordModalClose.nativeElement.disabled = false;
                  this.newPasswordModalYes.nativeElement.disabled = false;
                  this.newPasswordModalClose.nativeElement.click();
                  this.changeDetector.detectChanges();
                  this.toastrService.success('Password changed successfully', 'DID_SIOP', {
                    onActivateTick: true,
                    positionClass: 'toast-bottom-center',
                  });
                }
                else if(response.err){
                  this.newPasswordModalClose.nativeElement.disabled = false;
                  this.newPasswordModalYes.nativeElement.disabled = false;
                  this.newPasswordModalInfo.nativeElement.classList.remove('waiting');
                  this.newPasswordModalInfo.nativeElement.classList.add('error');
                  this.newPasswordModalInfo.nativeElement.innerText = 'An error occurred';
                }
              }
             );
            }
            else{
              this.newPasswordModalClose.nativeElement.disabled = false;
              this.newPasswordModalYes.nativeElement.disabled = false;
              this.newPasswordModalInfo.nativeElement.classList.remove('waiting');
              this.newPasswordModalInfo.nativeElement.classList.add('error');
              this.newPasswordModalInfo.nativeElement.innerText = 'Incorrect old password';
            }
          }
        );
      }
      else{
        this.newPasswordModalClose.nativeElement.disabled = false;
        this.newPasswordModalYes.nativeElement.disabled = false;
        this.newPasswordModalInfo.nativeElement.classList.remove('waiting');
        this.newPasswordModalInfo.nativeElement.classList.add('error');
        this.newPasswordModalInfo.nativeElement.innerText = 'Passwords do not match';
      }
    }
    else{
      this.newPasswordModalClose.nativeElement.disabled = false;
      this.newPasswordModalYes.nativeElement.disabled = false;
      this.newPasswordModalInfo.nativeElement.classList.remove('waiting');
      this.newPasswordModalInfo.nativeElement.classList.add('error');
      this.newPasswordModalInfo.nativeElement.innerText = 'Please fill all data';
    }
  }

  goBack(){
    this.clickedBack.emit(true);
  }
}
