import { Injectable } from '@angular/core';
import { BehaviorSubject, from, map, Observable, tap } from 'rxjs';
import { GffFile, SequenceRegion } from './gff3';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class GffloaderService {
  constructor(
    private http: HttpClient,
  ) {
    this.gff
      .pipe(map((gff) => (gff instanceof GffFile)))
      .subscribe(this.isLoaded);
  }

  public gff = new BehaviorSubject<GffFile|null>(null);
  public isLoaded = new BehaviorSubject<boolean>(false);
  public selectedSequenceRegion = new BehaviorSubject<SequenceRegion|null>(null);

  loadFromURL(url: string) {
    from(fetch(url))
      .subscribe((response) => {
        from(response.text())
          .pipe(map(GffFile.parse))
          .subscribe(this.gff);
      });
  }

  load(file: File) {
    from(file.text())
      .pipe(map(GffFile.parse))
      .subscribe(this.gff);
  }

  close() {
    this.gff.next(null);
  }
}
