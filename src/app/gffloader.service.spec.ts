import { TestBed } from '@angular/core/testing';

import { GffloaderService } from './gffloader.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { testGFFData } from './testGffData';
import { GffFile } from './gff3';
import { skipUntil, skipWhile, takeLast, takeUntil } from 'rxjs';

function testData() {
  return new File([testGFFData], "test.gff");
}

describe('GffloaderService', () => {
  let service: GffloaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(GffloaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load a GFF file', (done) => {
    service.gff
      .pipe(takeLast(1))
      .subscribe((gff) => {
        console.log(gff);
        expect(gff).toBeInstanceOf(GffFile);
        done();
    })
    service.load(testData());
  });

  it('should close a GFF file', (done) => {
    service.gff.subscribe(console.log);
    service.gff.next(new GffFile());
    service.close();
    service.gff
      .subscribe((gff) => {
        expect(gff).toBeNull();
        done();
      });
  });
});
