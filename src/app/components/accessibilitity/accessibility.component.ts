import { Component, OnInit, Renderer2, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-accessibility',
  templateUrl: './accessibility.component.html',
  styleUrls: ['./accessibility.component.css']
})
export class AccessibilityComponent implements OnInit {
  isPanelOpen = false;
  fontSize = 100; // %
  contrastMode = false;
  highContrastMode = false;
  grayscaleMode = false;
  dyslexiaMode = false;
  animationReduction = false;

  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit() {
    this.loadAccessibilityPreferences();
  }

  togglePanel() {
    this.isPanelOpen = !this.isPanelOpen;
  }

  // 🔧 FERRAMENTAS PARA DEFICIÊNCIA VISUAL
  increaseFontSize() {
    if (this.fontSize < 200) {
      this.fontSize += 10;
      this.applyFontSize();
    }
  }

  decreaseFontSize() {
    if (this.fontSize > 80) {
      this.fontSize -= 10;
      this.applyFontSize();
    }
  }

  resetFontSize() {
    this.fontSize = 100;
    this.applyFontSize();
  }

  private applyFontSize() {
    this.document.documentElement.style.fontSize = `${this.fontSize}%`;
    this.savePreferences();
  }

  toggleContrast() {
    this.contrastMode = !this.contrastMode;
    this.highContrastMode = false;
    
    if (this.contrastMode) {
      this.renderer.addClass(this.document.body, 'high-contrast');
    } else {
      this.renderer.removeClass(this.document.body, 'high-contrast');
    }
    this.savePreferences();
  }

  toggleHighContrast() {
    this.highContrastMode = !this.highContrastMode;
    this.contrastMode = false;
    
    if (this.highContrastMode) {
      this.renderer.addClass(this.document.body, 'very-high-contrast');
    } else {
      this.renderer.removeClass(this.document.body, 'very-high-contrast');
    }
    this.savePreferences();
  }

  toggleGrayscale() {
    this.grayscaleMode = !this.grayscaleMode;
    
    if (this.grayscaleMode) {
      this.renderer.addClass(this.document.body, 'grayscale');
    } else {
      this.renderer.removeClass(this.document.body, 'grayscale');
    }
    this.savePreferences();
  }

  // 🔧 FERRAMENTAS PARA DISLEXIA
  toggleDyslexiaMode() {
    this.dyslexiaMode = !this.dyslexiaMode;
    
    if (this.dyslexiaMode) {
      this.renderer.addClass(this.document.body, 'dyslexia-friendly');
    } else {
      this.renderer.removeClass(this.document.body, 'dyslexia-friendly');
    }
    this.savePreferences();
  }

  // 🔧 REDUÇÃO DE ANIMAÇÕES (EPILEPSIA)
  toggleAnimationReduction() {
    this.animationReduction = !this.animationReduction;
    
    if (this.animationReduction) {
      this.renderer.addClass(this.document.body, 'reduce-animation');
    } else {
      this.renderer.removeClass(this.document.body, 'reduce-animation');
    }
    this.savePreferences();
  }

  // 🔧 FERRAMENTAS PARA DEFICIÊNCIA MOTORA
  activateVirtualKeyboard() {
    // Simula a abertura de teclado virtual
    alert('Teclado virtual ativado. Use Tab, Shift+Tab e Enter para navegar.');
  }

  // 💾 SALVAR PREFERÊNCIAS
  private savePreferences() {
    const preferences = {
      fontSize: this.fontSize,
      contrastMode: this.contrastMode,
      highContrastMode: this.highContrastMode,
      grayscaleMode: this.grayscaleMode,
      dyslexiaMode: this.dyslexiaMode,
      animationReduction: this.animationReduction
    };
    
    localStorage.setItem('accessibilityPreferences', JSON.stringify(preferences));
  }

  private loadAccessibilityPreferences() {
    const saved = localStorage.getItem('accessibilityPreferences');
    if (saved) {
      const preferences = JSON.parse(saved);
      
      this.fontSize = preferences.fontSize || 100;
      this.contrastMode = preferences.contrastMode || false;
      this.highContrastMode = preferences.highContrastMode || false;
      this.grayscaleMode = preferences.grayscaleMode || false;
      this.dyslexiaMode = preferences.dyslexiaMode || false;
      this.animationReduction = preferences.animationReduction || false;

      // Aplicar preferências salvas
      this.applyFontSize();
      
      if (this.contrastMode) this.renderer.addClass(this.document.body, 'high-contrast');
      if (this.highContrastMode) this.renderer.addClass(this.document.body, 'very-high-contrast');
      if (this.grayscaleMode) this.renderer.addClass(this.document.body, 'grayscale');
      if (this.dyslexiaMode) this.renderer.addClass(this.document.body, 'dyslexia-friendly');
      if (this.animationReduction) this.renderer.addClass(this.document.body, 'reduce-animation');
    }
  }

  resetAll() {
    this.fontSize = 100;
    this.contrastMode = false;
    this.highContrastMode = false;
    this.grayscaleMode = false;
    this.dyslexiaMode = false;
    this.animationReduction = false;

    this.document.documentElement.style.fontSize = '100%';
    this.renderer.removeClass(this.document.body, 'high-contrast');
    this.renderer.removeClass(this.document.body, 'very-high-contrast');
    this.renderer.removeClass(this.document.body, 'grayscale');
    this.renderer.removeClass(this.document.body, 'dyslexia-friendly');
    this.renderer.removeClass(this.document.body, 'reduce-animation');

    localStorage.removeItem('accessibilityPreferences');
  }
}