import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.altKey && event.key === '1') {
      event.preventDefault();
      const accessibilityBtn = document.querySelector('.accessibility-floating-btn') as HTMLElement;
      if (accessibilityBtn) {
        accessibilityBtn.focus();
      }
    }
    
    if (event.key === 'Escape') {
      this.closeAllModals();
    }
  }
  
  private closeAllModals() {
    const modals = document.querySelectorAll('.modal, .accessibility-panel.open');
    modals.forEach(modal => {
      modal.classList.remove('open');
    });
  }
}