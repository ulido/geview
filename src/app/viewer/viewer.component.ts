import { AfterViewInit, Component, ElementRef, Input, OnChanges, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { GffloaderService } from '../gffloader.service';
import { BehaviorSubject } from 'rxjs';
import { GffFile, SequenceRegion, EntryBase, EntryList } from '../gff3';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { SearchService } from '../search.service';

@Component({
  selector: 'app-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatListModule
  ],
  templateUrl: './viewer.component.html',
  styleUrl: './viewer.component.scss'
})
export class ViewerComponent implements OnChanges {
  @Input() sequenceRegion: SequenceRegion | null = null;
  @Input() drawerOpened:boolean = false;

  displayEntries = new BehaviorSubject<IDisplayEntry[]>([]);

  constructor(
    private searchService: SearchService,
  ) {
    this.searchService.IDSearchTerm.subscribe((term) => {
      const element = document.getElementById('container');
      console.log(element);
      if (element) {
        const entry = this.displayEntries.value.find((entry) => entry.entry.ID == term);
        console.log({left: entry?.left});
        if (entry) {
          element.scrollTo({left: 16*entry.left, behavior: "smooth"});
        }
      }
    })
  };

  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes);
    if (this.sequenceRegion) {
      const displayTypes = this.extractEntryTypes(this.sequenceRegion);
      this.renderDisplayEntries(this.sequenceRegion.entryList, displayTypes);
    }
  }

  renderDisplayEntries(entryList: EntryList, displayTypes: string[], xScale: number = 0.01, yScale: number = 3) {
    const events: IOverlapEvent[] = [];
    for (const [index, entry] of entryList.entries()) {
      if (displayTypes.includes(entry.type)) {
        events.push({index: index, entry: entry, type: 'start', position: entry.start});
        events.push({index: index, entry: entry, type: 'end', position: entry.end});
      }
    }
    events.sort((a, b) => a.position - b.position);

    const displayEntries: IDisplayEntry[] = [];

    const stackEntries: number[] = [];
    const stackLayers: number[] = [];
    for (const event of events) {
        if (event.type == 'start') {
            var layer: number;
            if (stackLayers.length == 0) {
                layer = 0;
            } else {
                layer = stackLayers.length
                for (var i=0; i < stackLayers.length; i++) {
                    if (i != stackLayers[i]) {
                        layer = i;
                        break;
                    }
                }
            }
            stackEntries.splice(layer, 0, event.index);
            stackLayers.splice(layer, 0, layer);
            
            const displayEntry: IDisplayEntry = {entry: event.entry, layer: layer, left: 0, width: 0, top: 0};
            this.transform(displayEntry, xScale, yScale);
            displayEntries.push(displayEntry);
        } else if (event.type == 'end') {
            const index = stackEntries.indexOf(event.index);
            stackEntries.splice(index, 1);
            stackLayers.splice(index, 1);
        }
    }

    this.displayEntries.next(displayEntries);
  }

  transform(displayEntry: IDisplayEntry, xScale: number, yScale: number = 1) {
    displayEntry.left = xScale * (displayEntry.entry.start - 1);
    displayEntry.width = xScale * (displayEntry.entry.end - displayEntry.entry.start + 1);
    displayEntry.top = yScale * displayEntry.layer;
  }

  gridLines(sequenceRegion: SequenceRegion, scale: number) {
    const ntExtent = sequenceRegion.end - sequenceRegion.start;
    const ntSpacing = Math.pow(10, Math.floor(Math.log10(1000/scale)) - 1);
    const ret = [...Array(Math.floor(ntExtent / ntSpacing)).keys()].map((x: number) => { return {position: x*ntSpacing*scale, label: x*ntSpacing};});
    return ret;
  }


  extractEntryTypes(sequenceRegion: SequenceRegion | null): string[] {
    const typeList: string[] = [];
    if (sequenceRegion === null) {
      return [];
    }
    return [...new Set(sequenceRegion.entryList.map((entry) => entry.type))];
  }

  typeSelectionChange(change: MatSelectionListChange) {
    if (this.sequenceRegion) {
      const displayTypes = change.source.selectedOptions.selected.map((o) => o.value);
      this.renderDisplayEntries(this.sequenceRegion.entryList, displayTypes);
    }
  }

}

export interface IDisplayEntry {
  entry: EntryBase;
  layer: number;
  left: number;
  top: number;
  width: number;
}
interface IOverlapEvent {
  index: number;
  entry: EntryBase;
  type: 'start'|'end';
  position: number;
}

