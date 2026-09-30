import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BootstrapService } from './core/services/bootstrap.service';
import { ThemeService } from './core/services/theme.service';
import { LanguageService } from './core/services/language.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private bootstrap = inject(BootstrapService);
  /** Instantiated here purely to trigger its constructor effect on app start. */
  private theme = inject(ThemeService);
  private language = inject(LanguageService);

  ready = signal(false);

  async ngOnInit(): Promise<void> {
    await this.bootstrap.ready();
    this.ready.set(true);
  }
}
