import { entryFactory, GffFile } from "./gff3";
import { testGFFData } from "./testGffData";

describe('Gff3', () => {
  it('line parsing should work', () => {
    const gene = entryFactory("ctg123 . gene            1000  9000  .  +  .  ID=gene00001;Name=EDEN");
    expect(gene.attributes["ID"]).toBe("gene00001");
  });

  it('whole GFF3 parsing should work', () => {
    const gff = GffFile.parse(testGFFData);
    console.log(gff);
  });

});
