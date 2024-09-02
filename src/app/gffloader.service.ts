import { Injectable } from '@angular/core';
import { BehaviorSubject, from, map, Observable } from 'rxjs';
import { GffFile } from './gff3';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class GffloaderService {
  constructor(
    private http: HttpClient,
  ) { }

  public gff = new BehaviorSubject<GffFile|null>(null);

  load(file: File) {
    from(file.text())
      .pipe(map(GffFile.parse))
      .subscribe(this.gff);
  }

  close() {
    this.gff.next(null);
  }
}
