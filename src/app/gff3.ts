interface ISequenceRegions {
    [name: string]: SequenceRegion
}

export class GffFile {
    sequenceRegions: ISequenceRegions = {}

    sortedSequenceRegions(): SequenceRegion[] {
        return Object.values(this.sequenceRegions).sort((a, b) => a.length - b.length);
    }

    static parse(s: string): GffFile {
        const gff = new GffFile();
        let hasFasta: boolean = false;
        let fasta = "";

        for (const line of s.split("\n")) {
            if (hasFasta) {
                fasta += line + "\n";
                continue;
            }
            if (line.startsWith("##sequence-region")) {
                const parts = line.split(/\s+/);
                const name = parts[1];
                gff.sequenceRegions[name] = new SequenceRegion(name, Number(parts[2]), Number(parts[3]));
            }
            if (line.startsWith("##FASTA")) {
                hasFasta = true;
                continue;
            }

            if ((line.startsWith('#')) || (line.length == 0)) {
                continue;
            }
            const entry = entryFactory(line);
            if (!(entry.seqId in gff.sequenceRegions)) {
                gff.sequenceRegions[entry.seqId] = new SequenceRegion(entry.seqId, 1, 1);
            }
            gff.sequenceRegions[entry.seqId].addEntry(entry);
        }

        if (hasFasta) {
            for (const seqPart of fasta.split(">").slice(1)) {
                const parts = seqPart.split("\n");
                const name = parts[0].split(/\s+/)[0];
                const sequence = parts.slice(1).join("");
                if (!(name in gff.sequenceRegions)) {
                    gff.sequenceRegions[name] = new SequenceRegion(name, 1, 1);
                }
                gff.sequenceRegions[name].sequence = sequence;
                gff.sequenceRegions[name].end = gff.sequenceRegions[name].start + sequence.length;
            }
        }

        return gff;
    }
};

interface IEntries {
    [ID: string]: EntryBase
}

export class EntryList extends Array<EntryBase> {
    constructor(...entries: EntryBase[]) {
        super(...entries);
    }
    
    filterByType(type: string): EntryList {
        return new EntryList(...this.filter((entry) => entry.type == type));
    }
}

export class SequenceRegion {
    entries: IEntries = {};
    get entryList(): EntryList { return new EntryList(...Object.values(this.entries)); };
    get length(): number { return this.end - this.start; };
    sequence: string = "";

    constructor(
        public readonly name: string,
        public start: number,
        public end: number,
    ) {}

    addEntry(entry: EntryBase) {
        this.entries[entry.ID] = entry;
        if ("Parent" in entry.attributes) {
            for (const parent of entry.attributes["Parent"].split(",")) {
                this.entries[parent].addChild(entry)
            }
        }
        if (entry.end > this.end) {
            this.end = entry.end;
        }
    }

}

interface IAttributes {
    [key: string]: string;
};

export type scoreType = number|'.';
export type strandType = '+'|'-'|'.';
export type phaseType = 0|1|2|'.';

export abstract class EntryBase {
    public readonly ID: string;
    public readonly score: scoreType;
    public readonly strand: strandType;
    public readonly phase: phaseType;
    public readonly attributes: IAttributes;
    abstract get type(): string;

    public readonly children: EntryBase[] = [];

    constructor(
        public seqId: string,
        public source: string,
        public start: number,
        public end: number,
        score: string,
        strand: string,
        phase: string,
        attributes: string
    ) {
        this.score = convertScore(score);
        this.strand = convertStrand(strand)
        this.phase = convertPhase(phase);

        this.attributes = {};
        for (const attribute of attributes.split(";")) {
            const parts = attribute.split('=');
            this.attributes[parts[0]] = parts[1];
        }
        this.ID = this.attributes["ID"];
    }

    addChild(entry: EntryBase) {
        this.children.push(entry);
    }
}

class GeneEntry extends EntryBase {
    get type(): string { return "gene"; };
}

class mRNAEntry extends EntryBase {
    get type(): string { return "mRNA"; };
}

class ExonEntry extends EntryBase {
    get type(): string { return "exon"; };
}

class CDSEntry extends EntryBase {
    get type(): string { return "CDS"; };
}

class GenericEntry extends EntryBase {
    get type(): string { return this._type; };

    constructor(
        seqId: string,
        source: string,
        public _type: string,
        start: number,
        end: number,
        score: string,
        strand: string,
        phase: string,
        attributes: string,
    ) {
        super(seqId, source, start, end, score, strand, phase, attributes);
    }
}

function convertScore(s: string): scoreType {
    if (s === '.') {
        return s
    }
    try {
        return Number(s);
    } catch(e: unknown) {
        throw(Error(`"${s}" is not a valid entry for the score field.`))
    }
}

function convertStrand(s: string): strandType {
    if (s === '+') {
        return '+';
    } else if (s === '-') {
        return '-';
    } else if (s === '.') {
        return '.';
    }
    throw(Error(`"${s}" is not a valid entry for the strand field.`));
}

function convertPhase(s: string): phaseType {
    if (s === '.') {
        return s;
    }
    const n = Number(s);
    if ((n == 0) || (n == 1) || (n == 2)) {
        return n;
    }
    throw(Error(`"${s}" is not a valid entry for the phase field.`))
}

export function entryFactory(line: string): EntryBase {
    const parts = line.split(/\s+/);

    const seqId = parts[0];
    const source = parts[1];
    const type = parts[2];
    const start = Number(parts[3]);
    const end = Number(parts[4]);
    const score = parts[5];
    const strand = parts[6];
    const phase = parts[7];
    const attributes = parts[8];

    switch(type) {
        case "gene":
        case "protein_coding_gene":
            return new GeneEntry(seqId, source, start, end, score, strand, phase, attributes);
            break;
        case "mRNA":
            return new mRNAEntry(seqId, source, start, end, score, strand, phase, attributes);
            break;
        case "exon":
            return new ExonEntry(seqId, source, start, end, score, strand, phase, attributes);
            break;
        case "CDS":
            return new CDSEntry(seqId, source, start, end, score, strand, phase, attributes);
            break;
        default:
            return new GenericEntry(seqId, source, type, start, end, score, strand, phase, attributes);
            break
    }
}