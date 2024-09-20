import { AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ViewerComponent } from './viewer/viewer.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { GffloaderService } from './gffloader.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { SequenceRegion } from './gff3';
import { ValueChangeEvent } from '@angular/forms';
import { filter, take } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { HeaderComponent } from "./header/header.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    ViewerComponent,
    HeaderComponent,
    MatToolbarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    HeaderComponent
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'geview';
  drawerOpened: boolean = false
  
  constructor(
    public gffService: GffloaderService,
  ) {}

  public ngOnInit(): void {
    this.gffService.loadFromURL('./example.gff');
  }

  fileDropHandler(event: Event) {
    if (event.target !== null) {
      const target = event.target as HTMLInputElement;
      if ((target.files !== null) && (target.files.length)) {
        this.gffService.load(target.files[0]);
      }
    }
  }

  toggleDrawer() {
    this.drawerOpened = !this.drawerOpened;
  }

}
