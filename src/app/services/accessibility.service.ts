import { Injectable, Renderer2, RendererFactory2, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AccessibilityPreferences {
    fontSize: number;
    contrastMode: boolean;
    highContrastMode: boolean;
    grayscaleMode: boolean;
    dyslexiaMode: boolean;
    animationReduction: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class AccessibilityService {
    private renderer: Renderer2;
    private preferencesSubject = new BehaviorSubject<AccessibilityPreferences>(this.getDefaultPreferences());

    public preferences$: Observable<AccessibilityPreferences> = this.preferencesSubject.asObservable();

    constructor(
        rendererFactory: RendererFactory2,
        @Inject(DOCUMENT) private document: Document
    ) {
        this.renderer = rendererFactory.createRenderer(null, null);
        this.loadSavedPreferences();
    }

    // 🎯 PREFERÊNCIAS COMPARTILHADAS
    getPreferences(): AccessibilityPreferences {
        return this.preferencesSubject.value;
    }

    updatePreferences(updates: Partial<AccessibilityPreferences>): void {
        const current = this.preferencesSubject.value;
        const newPreferences = { ...current, ...updates };

        this.preferencesSubject.next(newPreferences);
        this.applyPreferences(newPreferences);
        this.savePreferences(newPreferences);
    }

    resetPreferences(): void {
        const defaultPrefs = this.getDefaultPreferences();
        this.preferencesSubject.next(defaultPrefs);
        this.applyPreferences(defaultPrefs);
        localStorage.removeItem('accessibilityPreferences');
    }

    // 🔧 APLICAÇÃO DAS CONFIGURAÇÕES
    private applyPreferences(prefs: AccessibilityPreferences): void {
        this.applyFontSize(prefs.fontSize);
        this.toggleClass('high-contrast', prefs.contrastMode);
        this.toggleClass('very-high-contrast', prefs.highContrastMode);
        this.toggleClass('grayscale', prefs.grayscaleMode);
        this.toggleClass('dyslexia-friendly', prefs.dyslexiaMode);
        this.toggleClass('reduce-animation', prefs.animationReduction);
    }

    private applyFontSize(size: number): void {
        this.document.documentElement.style.fontSize = `${size}%`;
    }

    private toggleClass(className: string, shouldAdd: boolean): void {
        if (shouldAdd) {
            this.renderer.addClass(this.document.body, className);
        } else {
            this.renderer.removeClass(this.document.body, className);
        }
    }

    // 💾 PERSISTÊNCIA
    private savePreferences(prefs: AccessibilityPreferences): void {
        localStorage.setItem('accessibilityPreferences', JSON.stringify(prefs));
    }

    private loadSavedPreferences(): void {
        const saved = localStorage.getItem('accessibilityPreferences');
        if (saved) {
            try {
                const preferences = JSON.parse(saved);
                this.updatePreferences(preferences);
            } catch (error) {
                console.error('Erro ao carregar preferências de acessibilidade:', error);
            }
        }
    }

    private getDefaultPreferences(): AccessibilityPreferences {
        return {
            fontSize: 100,
            contrastMode: false,
            highContrastMode: false,
            grayscaleMode: false,
            dyslexiaMode: false,
            animationReduction: false
        };
    }

    // 🎯 MÉTODOS DE AJUSTE INDIVIDUAL
    increaseFontSize(): void {
        const current = this.getPreferences();
        if (current.fontSize < 200) {
            this.updatePreferences({ fontSize: current.fontSize + 10 });
        }
    }

    decreaseFontSize(): void {
        const current = this.getPreferences();
        if (current.fontSize > 80) {
            this.updatePreferences({ fontSize: current.fontSize - 10 });
        }
    }

    resetFontSize(): void {
        this.updatePreferences({ fontSize: 100 });
    }

    toggleContrast(): void {
        const current = this.getPreferences();
        this.updatePreferences({
            contrastMode: !current.contrastMode,
            highContrastMode: false
        });
    }

    toggleHighContrast(): void {
        const current = this.getPreferences();
        this.updatePreferences({
            highContrastMode: !current.highContrastMode,
            contrastMode: false
        });
    }

    toggleGrayscale(): void {
        const current = this.getPreferences();
        this.updatePreferences({ grayscaleMode: !current.grayscaleMode });
    }

    toggleDyslexiaMode(): void {
        const current = this.getPreferences();
        this.updatePreferences({ dyslexiaMode: !current.dyslexiaMode });
    }

    toggleAnimationReduction(): void {
        const current = this.getPreferences();
        this.updatePreferences({ animationReduction: !current.animationReduction });
    }
}