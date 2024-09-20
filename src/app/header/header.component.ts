import { Component, ElementRef, EventEmitter, Input, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { GffloaderService } from '../gffloader.service';
import { AsyncPipe, CommonModule } from '@angular/common';
import { SequenceRegion } from '../gff3';
import { filter, map, Observable, startWith, take } from 'rxjs';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { SearchService } from '../search.service';
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatToolbarModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    MatSelectModule,
    AsyncPipe,
    ScrollingModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit{
  @Input() selectedSequenceRegion!: SequenceRegion | null;
  @Output() drawerToggle = new EventEmitter<void>();

  // I have no idea why ViewChildren works, but ViewChild isn't initialized in AfterViewInit.
  @ViewChildren('selectSequenceRegions') selectList!: QueryList<MatSelect>;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  searchControl = new FormControl('');
  filteredSearchOptions!: string[];

  constructor(
    public gffService: GffloaderService,
    private searchService: SearchService,
  ) {};

  ngOnInit(): void {
  }

  filter() {
    if (this.selectedSequenceRegion) {
      const filterValue = this.searchInput.nativeElement.value.toLowerCase();
      this.filteredSearchOptions = (this.selectedSequenceRegion?.entryList
        .filter(entry => entry.ID.toLowerCase().includes(filterValue))
        .map(entry => entry.ID)
      );
    } else {
      this.filteredSearchOptions = [];
    }
  }

  selectSequenceRegion(name: string) {
    const seqReg = this.gffService.gff.value?.sequenceRegions[name];
    var seqRegObject: SequenceRegion | null = null;
    if (seqReg !== undefined) {
      seqRegObject = seqReg;
    }
    this.gffService.selectedSequenceRegion.next(seqRegObject);
  }

  ngAfterViewInit(): void {
    this.gffService.gff.pipe(filter((value) => value !== null), take(1)).subscribe((gff) => {
      const seqregs = gff!.sortedSequenceRegions()!;
      const selected = seqregs[seqregs.length - 1];
      this.selectList.first.value = selected.name;
      this.selectSequenceRegion(selected.name);
    });
  }

  onToggleDrawer() {
    this.drawerToggle.emit();
  }

  searchOptionSelected(event: MatAutocompleteSelectedEvent) {
    this.searchService.IDSearchTerm.next(event.option.value);
  }
}
