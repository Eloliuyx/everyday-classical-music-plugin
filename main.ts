import { App, Plugin, PluginSettingTab, Setting, TFile, Notice } from 'obsidian';
import { moment } from "obsidian";

// Plugin settings interface
interface EverydayClassicalMusicSettings {
    backfillExistingNotes: boolean;
    removeLinksBeforeDate: string;
}

// Default settings
const DEFAULT_SETTINGS: EverydayClassicalMusicSettings = {
    backfillExistingNotes: false,
    removeLinksBeforeDate: ''
}

// Define the structure of the JSON data
interface MusicPiece {
    name: string;
    author: string;
    link: string;
}

// Embedded JSON data
const embeddedMusicData: Record<string, MusicPiece> = {
    "01-01": {
        "name": "Symphonic \u00c9tudes, op. 13",
        "author": "Schumann",
        "link": "https://www.youtube.com/watch?v=CIWBd7-AP4Q"
    },
    "01-02": {
        "name": "Nocturnes",
        "author": "Faur\u00e9",
        "link": "https://www.youtube.com/watch?v=sqw5B9B9j4M"
    },
    "01-03": {
        "name": "\"Triple\" Concerto for violin, cello, and piano in C, op. 56",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=pkXGtE8_cig"
    },
    "01-04": {
        "name": "Piano Concerto #23 in A, K. 488",
        "author": "Mozart",
        "link": "https://www.youtube.com/watch?v=BMYjGkgzinU"
    },
    "01-05": {
        "name": "Requiem, op. 9",
        "author": "Durufl\u00e9",
        "link": "https://www.youtube.com/watch?v=05Ry3b_ARqE"
    },
    "01-06": {
        "name": "String Quartet #16 in F, op. 135",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=38DA-F1V0t8"
    },
    "01-07": {
        "name": "L'estro Armonico, op. 3",
        "author": "Vivaldi",
        "link": "https://www.youtube.com/watch?v=c6_Z5lpc1g0"
    },
    "01-08": {
        "name": "Concerto Grosso #1",
        "author": "Schnittke",
        "link": "https://www.youtube.com/watch?v=4RrLWema4tU"
    },
    "01-09": {
        "name": "Violin Concerto in E minor, op. 64",
        "author": "Mendelssohn",
        "link": "https://www.youtube.com/watch?v=I03Hs6dwj7E"
    },
    "01-10": {
        "name": "Clarinet Concerto in A, K. 622",
        "author": "Mozart",
        "link": "https://www.youtube.com/watch?v=YT_63UntRJE"
    },
    "01-11": {
        "name": "The Planets, op. 32",
        "author": "Holst",
        "link": "https://www.youtube.com/watch?v=5W-o5Y_GunU"
    },
    "01-12": {
        "name": "Symphony #8 in F, op. 93",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=fa6DRoxpOwg"
    },
    "01-13": {
        "name": "Symphony #2 in D, op. 43",
        "author": "Sibelius",
        "link": "https://www.youtube.com/watch?v=2lHncn68uyQ"
    },
    "01-14": {
        "name": "Madama Butterfly",
        "author": "Puccini",
        "link": "https://www.youtube.com/watch?v=IYrbdiee9SU"
    },
    "01-15": {
        "name": "Symphony #40 in G minor, K. 550",
        "author": "Mozart",
        "link": "https://www.youtube.com/watch?v=JTc1mDieQI8"
    },
    "01-16": {
        "name": "Cello Concerto #1 in C, Hob. VIIb/1",
        "author": "Haydn",
        "link": "https://www.youtube.com/watch?v=x8bLJeVQiJk"
    },
    "01-17": {
        "name": "Piano Quintet in F minor, op. 34",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=Jb7vDC5les4"
    },
    "01-18": {
        "name": "Quatuor pour la fin du temps (Quartet for the End of Time)",
        "author": "Messiaen",
        "link": "https://www.youtube.com/watch?v=QAQmZvxVffY"
    },
    "01-19": {
        "name": "Symphony #3 in C, op. 52",
        "author": "Sibelius",
        "link": "https://www.youtube.com/watch?v=_iPYeALbp50"
    },
    "01-20": {
        "name": "Piano Sonata #28 in A, op. 101",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=ZsItzA34B1I"
    },
    "01-21": {
        "name": "Die Zauberfl\u00f6te (The Magic Flute), K. 620",
        "author": "Mozart",
        "link": "https://www.youtube.com/watch?v=YuBeBjqKSGQ"
    },
    "01-22": {
        "name": "String Quartet #14 in C-sharp minor, op. 131",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=NdDNeMIvhIo"
    },
    "01-23": {
        "name": "Hebrides Overture, op. 26 \"Fingal's Cave\"",
        "author": "Mendelssohn",
        "link": "https://www.youtube.com/watch?v=zcogD-hHEYs"
    },
    "01-24": {
        "name": "Cello Concerto in A minor, op. 129",
        "author": "Schumann",
        "link": "https://www.youtube.com/watch?v=NayPFVXYo9o"
    },
    "01-25": {
        "name": "Piano Sonata #15 in D, op. 28 \"Pastoral\"",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=v5JOE60kQBQ"
    },
    "01-26": {
        "name": "Carmen",
        "author": "Bizet",
        "link": "https://www.youtube.com/watch?v=u_VkfIthWHo"
    },
    "01-27": {
        "name": "Variations on a Rococo Theme, op. 33",
        "author": "Tchaikovsky",
        "link": "https://www.youtube.com/watch?v=_591VkMY4iQ"
    },
    "01-28": {
        "name": "L'Oiseau de Feu",
        "author": "Stravinsky",
        "link": "https://www.youtube.com/watch?v=VZqYPIN4CEI"
    },
    "01-29": {
        "name": "Piano Quartet #2 in A, op. 26",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=AMQamKZkDvc"
    },
    "01-30": {
        "name": "Concerto for Two Violins in D minor, BWV 1043",
        "author": "Bach",
        "link": "https://www.youtube.com/watch?v=ILKJcsET-NM"
    },
    "01-31": {
        "name": "Also Sprach Zarathustra, op. 30",
        "author": "Strauss, R.",
        "link": "https://www.youtube.com/watch?v=IFPwm0e_K98"
    },
    "02-01": {
        "name": "Winterreise, D. 911",
        "author": "Schubert",
        "link": "https://www.youtube.com/watch?v=l0Rry-ahcHM"
    },
    "02-02": {
        "name": "Symphony #4 in E minor, op. 98",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=7QLuYj2jxoc"
    },
    "02-03": {
        "name": "Matth\u00e4us-Passion ('St. Matthew Passion'), BWV 244",
        "author": "Bach",
        "link": "https://www.youtube.com/watch?v=ZwVW1ttVhuQ"
    },
    "02-04": {
        "name": "Symphony #2 in E minor, op. 27",
        "author": "Rachmaninoff",
        "link": "https://www.youtube.com/watch?v=zQtoOWqZ_J4"
    },
    "02-05": {
        "name": "String Quartet #2 in D",
        "author": "Borodin",
        "link": "https://www.youtube.com/watch?v=c9zR8Q1vTqU"
    },
    "02-06": {
        "name": "Symphony #4 in A minor, op. 63",
        "author": "Sibelius",
        "link": "https://www.youtube.com/watch?v=C_GCIek9HjY"
    },
    "02-07": {
        "name": "Alto Rhapsody, op. 53",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=GheHLR05Nww"
    },
    "02-08": {
        "name": "String Quintet #1 in F, op. 88",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=KUTYq6d0gb0"
    },
    "02-09": {
        "name": "Symphony #9 in E-flat, op. 70",
        "author": "Shostakovich",
        "link": "https://www.youtube.com/watch?v=Qoui0sj7pGA"
    },
    "02-10": {
        "name": "Missa Pange lingua",
        "author": "Josquin",
        "link": "https://www.youtube.com/watch?v=_zxnFVWZVcE"
    },
    "02-11": {
        "name": "Cello Suites, BWV 1007-1012",
        "author": "Bach",
        "link": "https://www.youtube.com/watch?v=AAEVOLqFaHI"
    },
    "02-12": {
        "name": "Symphony #45 in F-sharp minor \"Farewell\"",
        "author": "Haydn",
        "link": "https://www.youtube.com/watch?v=cYvjr86_aJY"
    },
    "02-13": {
        "name": "Die Jahreszeiten (The Seasons), Hob. XXI/3",
        "author": "Haydn",
        "link": "https://www.youtube.com/watch?v=C3UdH79XZuE"
    },
    "02-14": {
        "name": "Piano Quintet in E-flat, op. 44",
        "author": "Schumann",
        "link": "https://www.youtube.com/watch?v=PU97k1_K3SE"
    },
    "02-15": {
        "name": "Salome, op. 54",
        "author": "Strauss, R.",
        "link": "https://www.youtube.com/watch?v=0CnRyTytiQg"
    },
    "02-16": {
        "name": "Symphony #9",
        "author": "Mahler",
        "link": "https://www.youtube.com/watch?v=IoNEeKJ2x44"
    },
    "02-17": {
        "name": "Violin Concerto in D, op. 77",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=tV7APwv68tY"
    },
    "02-18": {
        "name": "Symphony #1 in C minor, op. 68",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=BRdEgS_OHAk"
    },
    "02-19": {
        "name": "Piano Sonata #21 in C, op. 53 'Waldstein'",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=J3l18HTo5rY"
    },
    "02-20": {
        "name": "Piano Sonata #21 in B-flat, D. 960",
        "author": "Schubert",
        "link": "https://www.youtube.com/watch?v=oCn0PjPHdrc"
    },
    "02-21": {
        "name": "Symphony #7 in C, op. 105",
        "author": "Sibelius",
        "link": "https://www.youtube.com/watch?v=dfwLm1rW14Q"
    },
    "02-22": {
        "name": "Horn Concertos",
        "author": "Mozart",
        "link": "https://www.youtube.com/watch?v=gtOkOYTM_5E"
    },
    "02-23": {
        "name": "Symphony #6 in A minor",
        "author": "Mahler",
        "link": "https://www.youtube.com/watch?v=MjzfXeRYNGo"
    },
    "02-24": {
        "name": "Pictures at an Exhibition",
        "author": "Mussorgsky",
        "link": "https://www.youtube.com/watch?v=kkC3chi_ysw"
    },
    "02-25": {
        "name": "Violin Sonata #1 in G, op. 78",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=2Ec_DnPL578"
    },
    "02-26": {
        "name": "Piano Sonata #20 in A, D. 959",
        "author": "Schubert",
        "link": "https://www.youtube.com/watch?v=PNu9OxXprq0"
    },
    "02-27": {
        "name": "Piano Concerto #1 in G minor, op. 25",
        "author": "Mendelssohn",
        "link": "https://www.youtube.com/watch?v=2GGx8TRWFVA"
    },
    "02-28": {
        "name": "Symphony #7 in E, WAB 107",
        "author": "Bruckner",
        "link": "https://www.youtube.com/watch?v=Hq7VTOW6r6g"
    },
    "02-29": {
        "name": "Suite Bergamasque, L 75, including 'Clair de lune'",
        "author": "Debussy",
        "link": "https://www.youtube.com/watch?v=fZrm9h3JRGs"
    },
    "03-01": {
        "name": "Piano Concerto #2 in G, Sz. 95, BB 101",
        "author": "Bart\u00f3k",
        "link": "https://www.youtube.com/watch?v=EIDRAQVcbr8"
    },
    "03-02": {
        "name": "Spem in alium",
        "author": "Tallis",
        "link": "https://www.youtube.com/watch?v=iT-ZAAi4UQQ"
    },
    "03-03": {
        "name": "Symphony #4 in E-flat \"Romantic\", WAB 104",
        "author": "Bruckner",
        "link": "https://www.youtube.com/watch?v=-MiYzU8HQZQ"
    },
    "03-04": {
        "name": "Messe de Nostre Dame",
        "author": "Machaut",
        "link": "https://www.youtube.com/watch?v=11A4wqv8_wo"
    },
    "03-05": {
        "name": "Piano Trio #7 in B-flat, op. 97 \"Archduke\"",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=IWIrioMelNc"
    },
    "03-06": {
        "name": "Musikalisches Opfer (A Musical Offering), BWV 1079",
        "author": "Bach",
        "link": "https://www.youtube.com/watch?v=fjxKy3pP41w"
    },
    "03-07": {
        "name": "Piano Concerto #2 in G minor, op. 16",
        "author": "Prokofiev",
        "link": "https://www.youtube.com/watch?v=xcte8hM6kYA"
    },
    "03-08": {
        "name": "Images pour orchestre, L 122",
        "author": "Debussy",
        "link": "https://www.youtube.com/watch?v=jp-C3Lbgo5M"
    },
    "03-09": {
        "name": "Don Giovanni",
        "author": "Mozart",
        "link": "https://www.youtube.com/watch?v=aL2VdxseTvE"
    },
    "03-10": {
        "name": "Cantata #147 \"Herz und Mund und Tat und Leben\"",
        "author": "Bach",
        "link": "https://www.youtube.com/watch?v=h97JE4--p84"
    },
    "03-11": {
        "name": "Piano Quartet #1 in G minor, op. 25",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=42lro9rDSQQ"
    },
    "03-12": {
        "name": "Symphony #4 in G",
        "author": "Mahler",
        "link": "https://www.youtube.com/watch?v=YnfhInZLmUQ"
    },
    "03-13": {
        "name": "Tenebrae Responsories",
        "author": "Gesualdo",
        "link": "https://www.youtube.com/watch?v=E-gP1Cb4S_o"
    },
    "03-14": {
        "name": "String Quartet #15 in A minor, op. 132",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=IMIoGw0nKE4"
    },
    "03-15": {
        "name": "Madrigals, Book 8: Madrigali guerrieri, et amorosi",
        "author": "Monteverdi",
        "link": "https://www.youtube.com/watch?v=BNhfMVmRAhk"
    },
    "03-16": {
        "name": "Dichterliebe (A Poet\u2019s Love), op. 48",
        "author": "Schumann",
        "link": "https://www.youtube.com/watch?v=8xFU0IJimX4"
    },
    "03-17": {
        "name": "\"Double\" Concerto for Violin and Cello in A minor, op. 102",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=9WKpSDBvn9w"
    },
    "03-18": {
        "name": "Piano Concerto for the Left Hand in D",
        "author": "Ravel",
        "link": "https://www.youtube.com/watch?v=VoR6KgdDDTA"
    },
    "03-19": {
        "name": "Violin Concerto in D minor, op. 47",
        "author": "Sibelius",
        "link": "https://www.youtube.com/watch?v=3u-unvYedx8"
    },
    "03-20": {
        "name": "Parsifal",
        "author": "Wagner",
        "link": "https://www.youtube.com/watch?v=eqOBEH-JRhs"
    },
    "03-21": {
        "name": "Missa Solemnis in D, op. 123",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=umXYWd25hgQ"
    },
    "03-22": {
        "name": "Symphony #41 in C, K. 551 'Jupiter'",
        "author": "Mozart",
        "link": "https://www.youtube.com/watch?v=bnK3kh8ZEgA"
    },
    "03-23": {
        "name": "Requiem",
        "author": "Verdi",
        "link": "https://www.youtube.com/watch?v=Nlq9lJRElBk"
    },
    "03-24": {
        "name": "Clarinet Sonatas, op. 120",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=7tHkEqGMouM"
    },
    "03-25": {
        "name": "Ein deutsches Requiem, op. 45",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=ZXU9vqVdudM"
    },
    "03-26": {
        "name": "Symphony #4 in B-flat, op. 60",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=V1WqJFilxDg"
    },
    "03-27": {
        "name": "Requiem (Missa pro defunctis)",
        "author": "Ockeghem",
        "link": "https://www.youtube.com/watch?v=3Hzd41qeRyo"
    },
    "03-28": {
        "name": "Lyric Symphony, op. 18",
        "author": "Zemlinsky",
        "link": "https://www.youtube.com/watch?v=oC2Hkk50ujM"
    },
    "03-29": {
        "name": "Piano Sonata #8 in C minor, op. 13 \"Pathetique\"",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=91MTUXla-lE"
    },
    "03-30": {
        "name": "Die Sch\u00f6pfung (The Creation), Hob.XXI/2",
        "author": "Haydn",
        "link": "https://www.youtube.com/watch?v=gwKduvgzZnw"
    },
    "03-31": {
        "name": "Clarinet Quintet in A, K. 581",
        "author": "Mozart",
        "link": "https://www.youtube.com/watch?v=xTNbclgU3h4"
    },
    "04-01": {
        "name": "Piano Concerto #3 in C, op. 26",
        "author": "Prokofiev",
        "link": "https://www.youtube.com/watch?v=II3GoNY4rwc"
    },
    "04-02": {
        "name": "String Quartet #5, Sz. 102",
        "author": "Bart\u00f3k",
        "link": "https://www.youtube.com/watch?v=W2zPA4RuzaM"
    },
    "04-03": {
        "name": "Wanderer Fantasy in C, D. 760",
        "author": "Schubert",
        "link": "https://www.youtube.com/watch?v=wAnhIV8wzw0"
    },
    "04-04": {
        "name": "Piano Trio #2 in E minor, op. 67",
        "author": "Shostakovich",
        "link": "https://www.youtube.com/watch?v=os4N-dR7CuY"
    },
    "04-05": {
        "name": "Alexander Nevsky, op. 78",
        "author": "Prokofiev",
        "link": "https://www.youtube.com/watch?v=KGqVogrLEE4"
    },
    "04-06": {
        "name": "Violin Concerto #2 in E, BWV 1042",
        "author": "Bach",
        "link": "https://www.youtube.com/watch?v=DgfyryZJES4"
    },
    "04-07": {
        "name": "Piano Sonata #32 in C minor, op. 111",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=WGg9cE-ceso"
    },
    "04-08": {
        "name": "Lyric Pieces",
        "author": "Grieg",
        "link": "https://www.youtube.com/watch?v=9PFGpPzu_7s"
    },
    "04-09": {
        "name": "String Quintet #4 in G minor, K. 516",
        "author": "Mozart",
        "link": "https://www.youtube.com/watch?v=-RWsgnZZrZQ"
    },
    "04-10": {
        "name": "Music for Strings, Percussion, and Celesta, Sz. 106",
        "author": "Bart\u00f3k",
        "link": "https://www.youtube.com/watch?v=QElT9KD4uX8"
    },
    "04-11": {
        "name": "Ma m\u00e8re l'oye",
        "author": "Ravel",
        "link": "https://www.youtube.com/watch?v=N_ENSdLOblk"
    },
    "04-12": {
        "name": "Tabula Rasa",
        "author": "P\u00e4rt",
        "link": "https://www.youtube.com/watch?v=7YqF69HLkj8"
    },
    "04-13": {
        "name": "Symphony #1 in D, op. 25 \"Classical\"",
        "author": "Prokofiev",
        "link": "https://www.youtube.com/watch?v=5OpDwZN8kl4"
    },
    "04-14": {
        "name": "Water Music, HWV 348-350",
        "author": "Handel",
        "link": "https://www.youtube.com/watch?v=je_SW1KdFwI"
    },
    "04-15": {
        "name": "String Quartet #3, Sz. 85",
        "author": "Bart\u00f3k",
        "link": "https://www.youtube.com/watch?v=Knd04_iYTGc"
    },
    "04-16": {
        "name": "Violin Concerto, op. 14",
        "author": "Barber",
        "link": "https://www.youtube.com/watch?v=uM0NIQB3ZHU"
    },
    "04-17": {
        "name": "Rhapsody in Blue",
        "author": "Gershwin",
        "link": "https://www.youtube.com/watch?v=cH2PH0auTUU"
    },
    "04-18": {
        "name": "Fantasie in C, op. 17",
        "author": "Schumann",
        "link": "https://www.youtube.com/watch?v=XZ7hE4lQAYs"
    },
    "04-19": {
        "name": "Violin Concerto #2 in G minor, op. 63",
        "author": "Prokofiev",
        "link": "https://www.youtube.com/watch?v=uuXKaRFFJIc"
    },
    "04-20": {
        "name": "An American in Paris",
        "author": "Gershwin",
        "link": "https://www.youtube.com/watch?v=K4I2OzMltM4"
    },
    "04-21": {
        "name": "A Midsummer Night's Dream, op. 61; including the Overture, op. 21",
        "author": "Mendelssohn",
        "link": "https://www.youtube.com/watch?v=wIcImOYivDA"
    },
    "04-22": {
        "name": "Symphony #4",
        "author": "Ives",
        "link": "https://www.youtube.com/watch?v=aMT_EGXQwyk"
    },
    "04-23": {
        "name": "Symphony #3 in E-flat, op. 55 'Eroica'",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=nbGV-MVfgec"
    },
    "04-24": {
        "name": "Tristan und Isolde",
        "author": "Wagner",
        "link": "https://www.youtube.com/watch?v=5NvUyCdKAxM"
    },
    "04-25": {
        "name": "Symphony #3 in E-flat, op. 97 \"Rhenish\"",
        "author": "Schumann",
        "link": "https://www.youtube.com/watch?v=kYW12JpWvkc"
    },
    "04-26": {
        "name": "Il cimento dell'armonia e dell'inventione, including Le quattro stagioni (The Four Seasons)",
        "author": "Vivaldi",
        "link": "https://www.youtube.com/watch?v=sglI8vmqMkQ"
    },
    "04-27": {
        "name": "Symphony #3, op. 27 \"Sinfonia Espansiva\"",
        "author": "Nielsen",
        "link": "https://www.youtube.com/watch?v=VNNP_4TYnV4"
    },
    "04-28": {
        "name": "Piano Concerto #27 in B-flat, K. 595",
        "author": "Mozart",
        "link": "https://www.youtube.com/watch?v=Yaaksm19IzU"
    },
    "04-29": {
        "name": "Concerto for Orchestra, Sz. 116",
        "author": "Bart\u00f3k",
        "link": "https://www.youtube.com/watch?v=9uwpuyc7nS4"
    },
    "04-30": {
        "name": "Concierto de Aranjuez",
        "author": "Rodrigo",
        "link": "https://www.youtube.com/watch?v=Idsb6gk6j_U"
    },
    "05-01": {
        "name": "Der Erlk\u00f6nig, D. 328",
        "author": "Schubert",
        "link": "https://www.youtube.com/watch?v=Mrgvbd_OfsA"
    },
    "05-02": {
        "name": "Symphony #5 in B-flat, op. 100",
        "author": "Prokofiev",
        "link": "https://www.youtube.com/watch?v=vCXaPxeSkkI"
    },
    "05-03": {
        "name": "Piano Trio in A minor, op. 67",
        "author": "Ravel",
        "link": "https://www.youtube.com/watch?v=xFfoTqQbjA4"
    },
    "05-04": {
        "name": "Der Ring des Nibelungen (The Ring of the Nibelung)",
        "author": "Wagner",
        "link": "https://www.youtube.com/watch?v=1PBhlPeTJ_g"
    },
    "05-05": {
        "name": "Piano Trio #4 in E minor, op. 90 \"Dumky\"",
        "author": "Dvo\u0159\u00e1k",
        "link": "https://www.youtube.com/watch?v=vDPkMvUAgqo"
    },
    "05-06": {
        "name": "Piano Concerto #5 in E-flat, op. 73 'Emperor'",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=qSeg69d3CQ8"
    },
    "05-07": {
        "name": "Tout un monde lointain",
        "author": "Dutilleux",
        "link": "https://www.youtube.com/watch?v=O2qmECLxnCY"
    },
    "05-08": {
        "name": "Pr\u00e9lude \u00e0 l'apr\u00e8s-midi d'un faune (Prelude to the Afternoon of a Faun)",
        "author": "Debussy",
        "link": "https://www.youtube.com/watch?v=Y9iDOt2WbjY"
    },
    "05-09": {
        "name": "Sinfonia concertante in E-flat, K. 364/320d",
        "author": "Mozart",
        "link": "https://www.youtube.com/watch?v=_0hTDZ0whpU"
    },
    "05-10": {
        "name": "Iberia",
        "author": "Alb\u00e9niz",
        "link": "https://www.youtube.com/watch?v=XkkLsTUTRmw"
    },
    "05-11": {
        "name": "Fantas\u00eda para un Gentilhombre",
        "author": "Rodrigo",
        "link": "https://www.youtube.com/watch?v=fnwV92IrClo"
    },
    "05-12": {
        "name": "Nocturnes",
        "author": "Chopin",
        "link": "https://www.youtube.com/watch?v=-gDinVAmtA0"
    },
    "05-13": {
        "name": "Sinfonietta",
        "author": "Jan\u00e1\u010dek",
        "link": "https://www.youtube.com/watch?v=9aFTv50AoEQ"
    },
    "05-14": {
        "name": "Clarinet Quintet in B minor, op. 115",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=NijYtozUHaw"
    },
    "05-15": {
        "name": "Ordo Virtutum",
        "author": "Hildegard von Bingen",
        "link": "https://www.youtube.com/watch?v=zUMlhtoGTzY"
    },
    "05-16": {
        "name": "String Quartet #6, Sz. 114",
        "author": "Bart\u00f3k",
        "link": "https://www.youtube.com/watch?v=aR55nJWcJiM"
    },
    "05-17": {
        "name": "Missa L'homme arm\u00e9 super voces musicales",
        "author": "Josquin",
        "link": "https://www.youtube.com/watch?v=BKhSYH27Cr4"
    },
    "05-18": {
        "name": "Piano Sonata #17 in D minor, op. 31/2 \"Tempest\"",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=co6nWmswipo"
    },
    "05-19": {
        "name": "Missa Prolationum",
        "author": "Ockeghem",
        "link": "https://www.youtube.com/watch?v=ZWLsLAujZzI"
    },
    "05-20": {
        "name": "Symphony of Psalms",
        "author": "Stravinsky",
        "link": "https://www.youtube.com/watch?v=AEx9NxFJ09Y"
    },
    "05-21": {
        "name": "Le Sacre du printemps (The Rite of Spring)",
        "author": "Stravinsky",
        "link": "https://www.youtube.com/watch?v=5UJOaGIhG7A"
    },
    "05-22": {
        "name": "Sonata for Solo Cello, op. 8",
        "author": "Kod\u00e1ly",
        "link": "https://www.youtube.com/watch?v=O0_gw2Lillg"
    },
    "05-23": {
        "name": "Symphony #5 in D minor, op. 47",
        "author": "Shostakovich",
        "link": "https://www.youtube.com/watch?v=9AQMA0XLuAo"
    },
    "05-24": {
        "name": "Brandenburg Concertos, BWV 1046-1051",
        "author": "Bach",
        "link": "https://www.youtube.com/watch?v=rEzecIGYktA"
    },
    "05-25": {
        "name": "Diabelli Variations, op. 120",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=hTmQU4jEgJw"
    },
    "05-26": {
        "name": "Symphony #2 \"A London Symphony\"",
        "author": "Vaughan Williams",
        "link": "https://www.youtube.com/watch?v=BhKq8W9xhrU"
    },
    "05-27": {
        "name": "Requiem Mass in D minor, K. 626",
        "author": "Mozart",
        "link": "https://www.youtube.com/watch?v=qiMcXzfm9Mg"
    },
    "05-28": {
        "name": "String Quartet #4, Sz. 91",
        "author": "Bart\u00f3k",
        "link": "https://www.youtube.com/watch?v=E_XNfKk-Qbs"
    },
    "05-29": {
        "name": "Vespro della Beata Vergine 1610",
        "author": "Monteverdi",
        "link": "https://www.youtube.com/watch?v=3GYjNj75MFI"
    },
    "05-30": {
        "name": "Academic Festival Overture, op. 80",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=R5pzr5655yw"
    },
    "05-31": {
        "name": "Preludes, op. 28",
        "author": "Chopin",
        "link": "https://www.youtube.com/watch?v=CU9RgI9j7Do"
    },
    "06-01": {
        "name": "Symphony #104 in D \"London\"",
        "author": "Haydn",
        "link": "https://www.youtube.com/watch?v=OitPLIowJ70"
    },
    "06-02": {
        "name": "Symphony #9 in D minor, op. 125 \"Choral\"",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=-v8SQRIKntE"
    },
    "06-03": {
        "name": "Russian Easter Festival Overture, op. 36",
        "author": "Rimsky-Korsakov",
        "link": "https://www.youtube.com/watch?v=z4e8CvxV4Ho"
    },
    "06-04": {
        "name": "Symphony #1 in D 'Titan'",
        "author": "Mahler",
        "link": "https://www.youtube.com/watch?v=ISBfOpztUZM"
    },
    "06-05": {
        "name": "Symphony #38 in D, K. 504 \"Prague\"",
        "author": "Mozart",
        "link": "https://www.youtube.com/watch?v=1t18CpBuJJM"
    },
    "06-06": {
        "name": "Piano Sonata #30 in E, op. 109",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=luiOoylLTvc"
    },
    "06-07": {
        "name": "Symphony #4 in F minor, op. 36",
        "author": "Tchaikovsky",
        "link": "https://www.youtube.com/watch?v=KqV0RGR3Oh8"
    },
    "06-08": {
        "name": "Concerti Grossi (12), op. 6",
        "author": "Corelli",
        "link": "https://www.youtube.com/watch?v=UNsrdjzLrzM"
    },
    "06-09": {
        "name": "Aida",
        "author": "Verdi",
        "link": "https://www.youtube.com/watch?v=b8rsOzPzYr8"
    },
    "06-10": {
        "name": "Sonatas and Interludes for Prepared Piano",
        "author": "Cage",
        "link": "https://www.youtube.com/watch?v=jRHoKZRYBlY"
    },
    "06-11": {
        "name": "Das wohltemperierte Klavier (The Well-Tempered Clavier)",
        "author": "Bach",
        "link": "https://www.youtube.com/watch?v=gVah1cr3pU0"
    },
    "06-12": {
        "name": "Cello Concerto in B minor, op. 104",
        "author": "Dvo\u0159\u00e1k",
        "link": "https://www.youtube.com/watch?v=nJSlmoXpzfM"
    },
    "06-13": {
        "name": "Fantasia in F minor for piano four-hands, D. 940",
        "author": "Schubert",
        "link": "https://www.youtube.com/watch?v=UyjzqPPXDcw"
    },
    "06-14": {
        "name": "Petrushka",
        "author": "Stravinsky",
        "link": "https://www.youtube.com/watch?v=esD90diWZds"
    },
    "06-15": {
        "name": "Slavonic Dances, opp. 46 & 72",
        "author": "Dvo\u0159\u00e1k",
        "link": "https://www.youtube.com/watch?v=e4kTHnGfhvE"
    },
    "06-16": {
        "name": "Piano Sonata #19 in C minor, D. 958",
        "author": "Schubert",
        "link": "https://www.youtube.com/watch?v=_OEaXf8uZUg"
    },
    "06-17": {
        "name": "Das Lied von der Erde",
        "author": "Mahler",
        "link": "https://www.youtube.com/watch?v=Npy4gjZ81F0"
    },
    "06-18": {
        "name": "Preludes and Fugues (24), op. 87",
        "author": "Shostakovich",
        "link": "https://www.youtube.com/watch?v=dz7JgJGZeyg"
    },
    "06-19": {
        "name": "Fantasia on a Theme by Thomas Tallis",
        "author": "Vaughan Williams",
        "link": "https://www.youtube.com/watch?v=e6pEIHtffqQ"
    },
    "06-20": {
        "name": "Mystery (Rosary) Sonatas",
        "author": "Biber",
        "link": "https://www.youtube.com/watch?v=jd2wYGeGsn4&list=PLvszsPl-ZIE6zfwDQ5RafOT3ObUOQ6CA_"
    },
    "06-21": {
        "name": "Ballades",
        "author": "Chopin",
        "link": "https://www.youtube.com/watch?v=cV_xvsH_EDk"
    },
    "06-22": {
        "name": "Lieder ohne Worte (Songs Without Words)",
        "author": "Mendelssohn",
        "link": "https://www.youtube.com/watch?v=CdDazqakigY"
    },
    "06-23": {
        "name": "String Quartet #12 in E-flat, op. 127",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=rmQGgCAwgiE"
    },
    "06-24": {
        "name": "Rhapsody on a Theme of Paganini, op. 43",
        "author": "Rachmaninoff",
        "link": "https://www.youtube.com/watch?v=ThTU04p3drM"
    },
    "06-25": {
        "name": "Symphony #4 in C-sharp minor, op. 21",
        "author": "Magnard",
        "link": "https://www.youtube.com/watch?v=JfIid0DXZ8k"
    },
    "06-26": {
        "name": "Christmas Oratorio, BWV 248",
        "author": "Bach",
        "link": "https://www.youtube.com/watch?v=yHTqP5s12eg"
    },
    "06-27": {
        "name": "Symphony #6 in D minor, op. 104",
        "author": "Sibelius",
        "link": "https://www.youtube.com/watch?v=SIcjeoRLcoE"
    },
    "06-28": {
        "name": "Chants d'Auvergne",
        "author": "Canteloube",
        "link": "https://www.youtube.com/watch?v=24iMnUiRjzk"
    },
    "06-29": {
        "name": "Great Mass in C minor, K. 427",
        "author": "Mozart",
        "link": "https://www.youtube.com/watch?v=Ez0kqVShFEs"
    },
    "06-30": {
        "name": "Piano Sonata #7 in B-flat, op. 83",
        "author": "Prokofiev",
        "link": "https://www.youtube.com/watch?v=h21KSLqj7HA"
    },
    "07-01": {
        "name": "Piano Sonata in B minor, S.178",
        "author": "Liszt",
        "link": "https://www.youtube.com/watch?v=36SDx8bue08"
    },
    "07-02": {
        "name": "La Mer, L 109",
        "author": "Debussy",
        "link": "https://www.youtube.com/watch?v=b51FcFpwwgw"
    },
    "07-03": {
        "name": "Danse Macabre, op. 40",
        "author": "Saint-Sa\u00ebns",
        "link": "https://www.youtube.com/watch?v=YyknBTm_YyM"
    },
    "07-04": {
        "name": "Symphony #2 in D, op. 73",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=O_7cH_AyCXg"
    },
    "07-05": {
        "name": "Cello Sonata #1 in E minor, op. 38",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=J7ecdXzSADE"
    },
    "07-06": {
        "name": "Horn Trio in E-flat, op. 40",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=WWRJYpDtd7c"
    },
    "07-07": {
        "name": "Lemmink\u00e4inen Suite, op. 22, including \"The Swan of Tuonela\"",
        "author": "Sibelius",
        "link": "https://www.youtube.com/watch?v=pvVgU61cIbs"
    },
    "07-08": {
        "name": "Piano Sonata #29 in B-flat, op. 106 'Hammerklavier'",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=FwZsDzGY1XA"
    },
    "07-09": {
        "name": "Gaspard de la nuit",
        "author": "Ravel",
        "link": "https://www.youtube.com/watch?v=n_yIgrkSNzE"
    },
    "07-10": {
        "name": "Piano Quintet #2 in A, op. 81",
        "author": "Dvo\u0159\u00e1k",
        "link": "https://www.youtube.com/watch?v=eFMV63zy-Xk"
    },
    "07-11": {
        "name": "String Quartet #8 in C minor, op. 110",
        "author": "Shostakovich",
        "link": "https://www.youtube.com/watch?v=41HIXtBElH4"
    },
    "07-12": {
        "name": "Schelomo",
        "author": "Bloch",
        "link": "https://www.youtube.com/watch?v=RRGMPCXS_yM"
    },
    "07-13": {
        "name": "Symphony #7 in C, op. 60 \"Leningrad\"",
        "author": "Shostakovich",
        "link": "https://www.youtube.com/watch?v=favVFUe6igc"
    },
    "07-14": {
        "name": "La traviata",
        "author": "Verdi",
        "link": "https://www.youtube.com/watch?v=pu7zWrIMV_g"
    },
    "07-15": {
        "name": "Piano Concerto #1 in B-flat minor, op. 23",
        "author": "Tchaikovsky",
        "link": "https://www.youtube.com/watch?v=BWerj8FcprM"
    },
    "07-16": {
        "name": "Requiem in D minor, op. 48",
        "author": "Faur\u00e9",
        "link": "https://www.youtube.com/watch?v=4xZbnY5jQSk"
    },
    "07-17": {
        "name": "Vier letzte Lieder (Four Last Songs)",
        "author": "Strauss, R.",
        "link": "https://www.youtube.com/watch?v=RdRq7ynfkHs"
    },
    "07-18": {
        "name": "Octet for Strings in E-flat, op. 20",
        "author": "Mendelssohn",
        "link": "https://www.youtube.com/watch?v=KrITNrgQHuE"
    },
    "07-19": {
        "name": "Le nozze di Figaro (The Marriage of Figaro), K. 492",
        "author": "Mozart",
        "link": "https://www.youtube.com/watch?v=Mp6UAGN_Ir4"
    },
    "07-20": {
        "name": "Symphony #5 in E-flat, op. 82",
        "author": "Sibelius",
        "link": "https://www.youtube.com/watch?v=1iLHxeR3BlQ"
    },
    "07-21": {
        "name": "Piano Quintet #2 in E-flat minor, op. 26",
        "author": "Dohn\u00e1nyi",
        "link": "https://www.youtube.com/watch?v=4ceJgiFWGMM"
    },
    "07-22": {
        "name": "Piano Quintet in G minor, op. 57",
        "author": "Shostakovich",
        "link": "https://www.youtube.com/watch?v=UEPiqK-jqTc"
    },
    "07-23": {
        "name": "String Quartet #13 in B-flat, op. 130 and the Gro\u00dfe Fuge, op. 133",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=XAgdd2VqLVc"
    },
    "07-24": {
        "name": "String Sextet #1 in B-flat, op. 18",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=qTChy5-gDO8"
    },
    "07-25": {
        "name": "Missa Papae Marcelli",
        "author": "Palestrina",
        "link": "https://www.youtube.com/watch?v=3n8XdKkrqgo"
    },
    "07-26": {
        "name": "Knoxville, Summer of 1915, op. 24",
        "author": "Barber",
        "link": "https://www.youtube.com/watch?v=E0PaUMOjziI"
    },
    "07-27": {
        "name": "Symphony #4 in C minor, op. 43",
        "author": "Shostakovich",
        "link": "https://www.youtube.com/watch?v=-Us8ElJ3yUY"
    },
    "07-28": {
        "name": "La Boh\u00e8me",
        "author": "Puccini",
        "link": "https://www.youtube.com/watch?v=KP3lV-YvCYM"
    },
    "07-29": {
        "name": "String Quintet #2 in G, op. 111",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=Ye2pDTJNm6U"
    },
    "07-30": {
        "name": "Passacaglia and Fugue in C minor, BWV 582",
        "author": "Bach",
        "link": "https://www.youtube.com/watch?v=zzBXZ__LN_M"
    },
    "07-31": {
        "name": "Pierrot Lunaire, op. 21",
        "author": "Schoenberg",
        "link": "https://www.youtube.com/watch?v=YbTn7Y9XAhA"
    },
    "08-01": {
        "name": "Violin Sonata #2 in A, op. 100",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=p73MD6QHpIQ"
    },
    "08-02": {
        "name": "Symphony #8 in C minor, op. 65",
        "author": "Shostakovich",
        "link": "https://www.youtube.com/watch?v=9jFesZ-jxRw"
    },
    "08-03": {
        "name": "Romeo and Juliet Fantasy-Overture",
        "author": "Tchaikovsky",
        "link": "https://www.youtube.com/watch?v=_Od7gx3Dc-U"
    },
    "08-04": {
        "name": "Romeo and Juliet, op. 64",
        "author": "Prokofiev",
        "link": "https://www.youtube.com/watch?v=XX6GHiFKovw"
    },
    "08-05": {
        "name": "Piano Concerto #2 in G minor, op. 22",
        "author": "Saint-Sa\u00ebns",
        "link": "https://www.youtube.com/watch?v=tVCvJZtzkqQ"
    },
    "08-06": {
        "name": "Piano Concerto #24 in C minor, K. 491",
        "author": "Mozart",
        "link": "https://www.youtube.com/watch?v=POWVTXuB68I"
    },
    "08-07": {
        "name": "St. John's Night on Bare Mountain (Night on Bald Mountain)",
        "author": "Mussorgsky",
        "link": "https://www.youtube.com/watch?v=iCEDfZgDPS8"
    },
    "08-08": {
        "name": "String Quartets, op. 76 'Erd\u00f6dy'",
        "author": "Haydn",
        "link": "https://www.youtube.com/watch?v=k5IR5Wt0yEw"
    },
    "08-09": {
        "name": "Violin Concerto #1 in A minor, BWV 1041",
        "author": "Bach",
        "link": "https://www.youtube.com/watch?v=J7TFSsqnpHY"
    },
    "08-10": {
        "name": "Black Angels (Thirteen Images from the Dark Land)",
        "author": "Crumb",
        "link": "https://www.youtube.com/watch?v=v1K_iAmrO4U"
    },
    "08-11": {
        "name": "Goldberg Variations, BWV 988",
        "author": "Bach",
        "link": "https://www.youtube.com/watch?v=55hk75OgWDg"
    },
    "08-12": {
        "name": "Symphony #9 in C, D. 944 'Great'",
        "author": "Schubert",
        "link": "https://www.youtube.com/watch?v=bA6pzRx6gBE"
    },
    "08-13": {
        "name": "Tapiola, op. 112",
        "author": "Sibelius",
        "link": "https://www.youtube.com/watch?v=d7WhYC7bMFA"
    },
    "08-14": {
        "name": "Kinderszenen, op. 15",
        "author": "Schumann",
        "link": "https://www.youtube.com/watch?v=yibf6QNjgGU"
    },
    "08-15": {
        "name": "Violin Sonata in A",
        "author": "Franck",
        "link": "https://www.youtube.com/watch?v=YCp5XC2rsEM"
    },
    "08-16": {
        "name": "Toccata and Fugue in D minor, BWV 565",
        "author": "Bach",
        "link": "https://www.youtube.com/watch?v=Nnuq9PXbywA"
    },
    "08-17": {
        "name": "Partitas for Keyboard #1-6, BWV 825-830 (Clavier-\u00dcbung I)",
        "author": "Bach",
        "link": "https://www.youtube.com/watch?v=feikrhaRFTk&list=PLmdMr9Or9Em6s1BpWOZtw_C972__Wu3Dx"
    },
    "08-18": {
        "name": "Symphony #5 in B-flat, D. 485",
        "author": "Schubert",
        "link": "https://www.youtube.com/watch?v=cdLuvGsjwlA"
    },
    "08-19": {
        "name": "Piano Quintet #1 in D minor, op. 89",
        "author": "Faur\u00e9",
        "link": "https://www.youtube.com/watch?v=T9lASiozqM8"
    },
    "08-20": {
        "name": "Impromptus, D. 899 & 935",
        "author": "Schubert",
        "link": "https://www.youtube.com/watch?v=24DugWBRkYg"
    },
    "08-21": {
        "name": "Le Tombeau de Couperin",
        "author": "Ravel",
        "link": "https://www.youtube.com/watch?v=7NA4j3VhGY4"
    },
    "08-22": {
        "name": "Images pour piano, L 110 & 111",
        "author": "Debussy",
        "link": "https://www.youtube.com/watch?v=xM-omvkkHkk"
    },
    "08-23": {
        "name": "Violin Concerto in D, op. 61",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=W8hQSMxa7gk"
    },
    "08-24": {
        "name": "\"Enigma\" Variations on an Original Theme, op. 36",
        "author": "Elgar",
        "link": "https://www.youtube.com/watch?v=7iM5dymBBI4"
    },
    "08-25": {
        "name": "Symphony #3 in F, op. 90",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=4L0MqnAoEJM"
    },
    "08-26": {
        "name": "Piano Concerto in A minor, op. 54",
        "author": "Schumann",
        "link": "https://www.youtube.com/watch?v=Ynky7qoPnUU"
    },
    "08-27": {
        "name": "Appalachian Spring",
        "author": "Copland",
        "link": "https://www.youtube.com/watch?v=TXV8yO1FucA"
    },
    "08-28": {
        "name": "String Quartets, op. 20 \"Sun\"",
        "author": "Haydn",
        "link": "https://www.youtube.com/watch?v=hedAbM5qk_A"
    },
    "08-29": {
        "name": "From Me Flows What You Call Time",
        "author": "Takemitsu",
        "link": "https://www.youtube.com/watch?v=kWipy3Q6gAI"
    },
    "08-30": {
        "name": "Symphony #6 'Pastoral' in F, op. 68",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=t2VY33VXnrQ"
    },
    "08-31": {
        "name": "Symphony #3 in A minor, op. 56 'Scottish'",
        "author": "Mendelssohn",
        "link": "https://www.youtube.com/watch?v=Q-zoNEO55yU"
    },
    "09-01": {
        "name": "Harp Concerto \"Lyra Angelica\"",
        "author": "Alwyn",
        "link": "https://www.youtube.com/watch?v=U1VEJrQRzqI"
    },
    "09-02": {
        "name": "Symphony #7 in D minor, op. 70",
        "author": "Dvo\u0159\u00e1k",
        "link": "https://www.youtube.com/watch?v=V3CCe_UUHtw"
    },
    "09-03": {
        "name": "String Quartet in G minor, L 85",
        "author": "Debussy",
        "link": "https://www.youtube.com/watch?v=OrChfYDQFRc"
    },
    "09-04": {
        "name": "Scheherazade, op. 35",
        "author": "Rimsky-Korsakov",
        "link": "https://www.youtube.com/watch?v=zY4w4_W30aQ"
    },
    "09-05": {
        "name": "Piano Quintet #2 in C minor, op. 115",
        "author": "Faur\u00e9",
        "link": "https://www.youtube.com/watch?v=eCytVmL30lc"
    },
    "09-06": {
        "name": "War Requiem, op. 66",
        "author": "Britten",
        "link": "https://www.youtube.com/watch?v=ym7W3J34vJo"
    },
    "09-07": {
        "name": "Finlandia, op. 26",
        "author": "Sibelius",
        "link": "https://www.youtube.com/watch?v=qOSaT6U4e-8"
    },
    "09-08": {
        "name": "English Suites, BWV 806-811",
        "author": "Bach",
        "link": "https://www.youtube.com/watch?v=rJq80yxHeAQ"
    },
    "09-09": {
        "name": "Symphony #5 in C minor, op. 67",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=-VVXqNt4qU0"
    },
    "09-10": {
        "name": "Piano Concerto in G",
        "author": "Ravel",
        "link": "https://www.youtube.com/watch?v=cJOW5mlhH_Y"
    },
    "09-11": {
        "name": "Magnificat in D, BWV 243",
        "author": "Bach",
        "link": "https://www.youtube.com/watch?v=YSzWDc8UoN0"
    },
    "09-12": {
        "name": "Piano Sonata #18 in G, D 894",
        "author": "Schubert",
        "link": "https://www.youtube.com/watch?v=cBisjKwg43U"
    },
    "09-13": {
        "name": "Piano Concerto #1 in D minor, op. 15",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=1jB_6fpYY3o"
    },
    "09-14": {
        "name": "Piano Sonata #14 in C-sharp minor, op. 27/2 \"Moonlight\"",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=796jkaAHmx4"
    },
    "09-15": {
        "name": "Mass in B minor, BWV 232",
        "author": "Bach",
        "link": "https://www.youtube.com/watch?v=3FLbiDrn8IE"
    },
    "09-16": {
        "name": "Concerto for Violin, Piano, and String Quartet in D, op. 21",
        "author": "Chausson",
        "link": "https://www.youtube.com/watch?v=gsrypUDnlcw"
    },
    "09-17": {
        "name": "Symphony #5, op. 50",
        "author": "Nielsen",
        "link": "https://www.youtube.com/watch?v=pOohguxFpKY"
    },
    "09-18": {
        "name": "L'Orfeo",
        "author": "Monteverdi",
        "link": "https://www.youtube.com/watch?v=jUep3sqe35o"
    },
    "09-19": {
        "name": "Symphony #8 in C minor, WAB 108",
        "author": "Bruckner",
        "link": "https://www.youtube.com/watch?v=YI0LdVgi2cg"
    },
    "09-20": {
        "name": "Cello Concerto in E minor, op. 85",
        "author": "Elgar",
        "link": "https://www.youtube.com/watch?v=8hi8oAw0aUE"
    },
    "09-21": {
        "name": "Symphony #103 in E-flat \"Drumroll\"",
        "author": "Haydn",
        "link": "https://www.youtube.com/watch?v=6GXAmM_gau0"
    },
    "09-22": {
        "name": "Kindertotenlieder",
        "author": "Mahler",
        "link": "https://www.youtube.com/watch?v=9edKNmyiLBc"
    },
    "09-23": {
        "name": "M\u00e1 Vlast (My Country), including Vltava (The Moldau)",
        "author": "Smetana",
        "link": "https://www.youtube.com/watch?v=l6kqu2mk-Kw"
    },
    "09-24": {
        "name": "Piano Trio #1 in D minor, op. 49",
        "author": "Mendelssohn",
        "link": "https://www.youtube.com/watch?v=-PAFzEnJ6NU"
    },
    "09-25": {
        "name": "Symphony #94 in G \"Surprise\"",
        "author": "Haydn",
        "link": "https://www.youtube.com/watch?v=VOLy6JxEDLw"
    },
    "09-26": {
        "name": "Cello Concerto #1 in E-flat, op. 107",
        "author": "Shostakovich",
        "link": "https://www.youtube.com/watch?v=al3gOZk_ad8"
    },
    "09-27": {
        "name": "Sonatas and Partitas for Solo Violin, BWV 1001-1006",
        "author": "Bach",
        "link": "https://www.youtube.com/watch?v=rKdmGEIMci8"
    },
    "09-28": {
        "name": "Des Canyons aux \u00e9toiles",
        "author": "Messiaen",
        "link": "https://www.youtube.com/watch?v=h0N40AVL32U"
    },
    "09-29": {
        "name": "Piano Quartet #2 in G minor, op. 45",
        "author": "Faur\u00e9",
        "link": "https://www.youtube.com/watch?v=NUzlJpKoQy0"
    },
    "09-30": {
        "name": "Violin Concerto #2 in G, Sz. 112, BB 117",
        "author": "Bart\u00f3k",
        "link": "https://www.youtube.com/watch?v=AQclbpe8SfA"
    },
    "10-01": {
        "name": "Piano Concerto #20 in D minor, K. 466",
        "author": "Mozart",
        "link": "https://www.youtube.com/watch?v=yM8CFR01KwQ"
    },
    "10-02": {
        "name": "Piano Concerto #2 in C minor, op. 18",
        "author": "Rachmaninoff",
        "link": "https://www.youtube.com/watch?v=rEGOihjqO9w"
    },
    "10-03": {
        "name": "Piano Sonata #23 in F minor, op. 57 'Appassionata'",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=ACB2a7dOHmU"
    },
    "10-04": {
        "name": "Piano Concerto #21 in C, K. 467",
        "author": "Mozart",
        "link": "https://www.youtube.com/watch?v=whTEVQ2OizI"
    },
    "10-05": {
        "name": "Symphony #5",
        "author": "Mahler",
        "link": "https://www.youtube.com/watch?v=vOvXhyldUko"
    },
    "10-06": {
        "name": "Symphony #3 in C minor, op. 78 'Organ'",
        "author": "Saint-Sa\u00ebns",
        "link": "https://www.youtube.com/watch?v=ZWCZq33BrOo"
    },
    "10-07": {
        "name": "Symphony #3 \"Symphony of Sorrowful Songs,\" op. 36",
        "author": "G\u00f3recki",
        "link": "https://www.youtube.com/watch?v=dFKVjM1iMVU"
    },
    "10-08": {
        "name": "Symphonic Metamorphosis of Themes by Carl Maria von Weber",
        "author": "Hindemith",
        "link": "https://www.youtube.com/watch?v=2A8tUpPRyR4"
    },
    "10-09": {
        "name": "Violin Concerto #1 in A minor, op. 77",
        "author": "Shostakovich",
        "link": "https://www.youtube.com/watch?v=x3iSCa50DFg"
    },
    "10-10": {
        "name": "Metamorphosen",
        "author": "Strauss, R.",
        "link": "https://www.youtube.com/watch?v=MlpNB0WeQaQ"
    },
    "10-11": {
        "name": "String Quartets, op. 33 \"Russian\"",
        "author": "Haydn",
        "link": "https://www.youtube.com/watch?v=D4_NyYf2gnY"
    },
    "10-12": {
        "name": "Symphony #2 \"Resurrection\"",
        "author": "Mahler",
        "link": "https://www.youtube.com/watch?v=wgtSa6XYWdE"
    },
    "10-13": {
        "name": "On an Overgrown Path",
        "author": "Jan\u00e1\u010dek",
        "link": "https://www.youtube.com/watch?v=V280ixNS5Jc"
    },
    "10-14": {
        "name": "Symphony #39 in E-flat, K. 543",
        "author": "Mozart",
        "link": "https://www.youtube.com/watch?v=rM1LA_bngMQ"
    },
    "10-15": {
        "name": "The Nutcracker, op. 71",
        "author": "Tchaikovsky",
        "link": "https://www.youtube.com/watch?v=o_brMBTnFyM"
    },
    "10-16": {
        "name": "Giulio Cesare in Egitto, HWV 17",
        "author": "Handel",
        "link": "https://www.youtube.com/watch?v=ppAUohisvG8"
    },
    "10-17": {
        "name": "String Quartet #15 in G, D. 887",
        "author": "Schubert",
        "link": "https://www.youtube.com/watch?v=9One__hAjrI"
    },
    "10-18": {
        "name": "Johannes-Passion, BWV 245",
        "author": "Bach",
        "link": "https://www.youtube.com/watch?v=zMf9XDQBAaI"
    },
    "10-19": {
        "name": "Symphony #6 'Path\u00e9tique' in B minor, op. 74",
        "author": "Tchaikovsky",
        "link": "https://www.youtube.com/watch?v=uZmLx4w2VHo"
    },
    "10-20": {
        "name": "Orchestral Suites, BWV 1066-1069",
        "author": "Bach",
        "link": "https://www.youtube.com/watch?v=L3cdI-ZFQEQ&list=PLuOCFjLFfx-v_sQgS8-O0_xMQidc3SOrX"
    },
    "10-21": {
        "name": "Holberg Suite, op. 40",
        "author": "Grieg",
        "link": "https://www.youtube.com/watch?v=dFEBTbNs4yk"
    },
    "10-22": {
        "name": "Piano Sonata #26 in E-flat, op. 81a \"Les Adieux\"",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=nAapbue97JE"
    },
    "10-23": {
        "name": "Symphony #4 in D minor, op. 120",
        "author": "Schumann",
        "link": "https://www.youtube.com/watch?v=BfLxzNakUZw"
    },
    "10-24": {
        "name": "Madrigals, Book 6",
        "author": "Gesualdo",
        "link": "https://www.youtube.com/watch?v=k2lujQGQtLA&list=PLy30lkBpHSxdLFQogvh8TdYAXnh1iexga"
    },
    "10-25": {
        "name": "Piano Quartet #3 in C minor, op. 60 'Werther'",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=iyAiXNAZ5WE"
    },
    "10-26": {
        "name": "Symphony #3",
        "author": "Mahler",
        "link": "https://www.youtube.com/watch?v=Xplx64LVENg"
    },
    "10-27": {
        "name": "Piano Quintet in A, D. 667 \"The Trout\"",
        "author": "Schubert",
        "link": "https://www.youtube.com/watch?v=NtzEdLS6IQA"
    },
    "10-28": {
        "name": "Daphnis et Chlo\u00e9 (ballet and orchestral suites)",
        "author": "Ravel",
        "link": "https://www.youtube.com/watch?v=O4lzPz3NnI0"
    },
    "10-29": {
        "name": "Piano Trio #2 in E-flat, D. 929",
        "author": "Schubert",
        "link": "https://www.youtube.com/watch?v=mlCXE2wEe7w"
    },
    "10-30": {
        "name": "Symphony #13 in B-flat minor, op. 113 \"Babi Yar\"",
        "author": "Shostakovich",
        "link": "https://www.youtube.com/watch?v=acDDPoopgvw"
    },
    "10-31": {
        "name": "Serenade for Strings in E, op. 22",
        "author": "Dvo\u0159\u00e1k",
        "link": "https://www.youtube.com/watch?v=7psI60ZCOdw"
    },
    "11-01": {
        "name": "Violin Concerto #1 in G minor, op. 26",
        "author": "Bruch",
        "link": "https://www.youtube.com/watch?v=KDJ6Wbzgy3E"
    },
    "11-02": {
        "name": "Lachrimae, or Seaven Teares",
        "author": "Dowland",
        "link": "https://www.youtube.com/watch?v=srugGaEKGMA"
    },
    "11-03": {
        "name": "Die Meistersinger von N\u00fcrnberg",
        "author": "Wagner",
        "link": "https://www.youtube.com/watch?v=fDIkzHjHRhI"
    },
    "11-04": {
        "name": "Symphonie fantastique, op. 14",
        "author": "Berlioz",
        "link": "https://www.youtube.com/watch?v=sK-D9IpmclQ"
    },
    "11-05": {
        "name": "Variations and Fugue on a Theme by Handel, op. 24",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=q9tbCkACbGU"
    },
    "11-06": {
        "name": "String Quintet in C, D. 956",
        "author": "Schubert",
        "link": "https://www.youtube.com/watch?v=Dc3iX7x73JY"
    },
    "11-07": {
        "name": "Quintet for Piano and Winds in E-flat, K. 452",
        "author": "Mozart",
        "link": "https://www.youtube.com/watch?v=WC9Qp6wKWsg"
    },
    "11-08": {
        "name": "Piano Quartet #1 in C minor, op. 15",
        "author": "Faur\u00e9",
        "link": "https://www.youtube.com/watch?v=QMwcmX7bOxo"
    },
    "11-09": {
        "name": "Symphonie Espagnole in D minor, op. 21",
        "author": "Lalo",
        "link": "https://www.youtube.com/watch?v=lEeaFZkpLH4"
    },
    "11-10": {
        "name": "Turangal\u00eela-Symphonie",
        "author": "Messiaen",
        "link": "https://www.youtube.com/watch?v=oEghV-AJ230"
    },
    "11-11": {
        "name": "Symphony #4 in A, op. 90 'Italian'",
        "author": "Mendelssohn",
        "link": "https://www.youtube.com/watch?v=xI8IzIKGslA"
    },
    "11-12": {
        "name": "Piano Concerto #25 in C, K. 503",
        "author": "Mozart",
        "link": "https://www.youtube.com/watch?v=WIjAGbyQO9M"
    },
    "11-13": {
        "name": "Symphony #9 in E minor, op. 95 'From the New World'",
        "author": "Dvo\u0159\u00e1k",
        "link": "https://www.youtube.com/watch?v=89jOPAGJq-M"
    },
    "11-14": {
        "name": "Pavane pour une infante d\u00e9funte",
        "author": "Ravel",
        "link": "https://www.youtube.com/watch?v=DVtNt-6OTM8"
    },
    "11-15": {
        "name": "Pini di Roma",
        "author": "Respighi",
        "link": "https://www.youtube.com/watch?v=XgE7PUXTrlo"
    },
    "11-16": {
        "name": "Cantata #82 'Ich habe genug'",
        "author": "Bach",
        "link": "https://www.youtube.com/watch?v=Q_5DG9BD-SU"
    },
    "11-17": {
        "name": "Symphony #8 in G, op. 88",
        "author": "Dvo\u0159\u00e1k",
        "link": "https://www.youtube.com/watch?v=RhbK_5cWbpU"
    },
    "11-18": {
        "name": "String Sextet #2 in G, op. 36",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=gXOHCMY6Gx4"
    },
    "11-19": {
        "name": "Violin Concerto in D, op. 35",
        "author": "Tchaikovsky",
        "link": "https://www.youtube.com/watch?v=ovFPKu00cCc"
    },
    "11-20": {
        "name": "String Quartet #1 in E minor \"From My Life\"",
        "author": "Smetana",
        "link": "https://www.youtube.com/watch?v=lbv5mGb9_4s"
    },
    "11-21": {
        "name": "Chromatic Fantasia and Fugue in D minor, BWV 903",
        "author": "Bach",
        "link": "https://www.youtube.com/watch?v=SNWOhm5iXxs"
    },
    "11-22": {
        "name": "Serenade #10 \"Gran Partita\" for winds in B-flat, K. 361/370a",
        "author": "Mozart",
        "link": "https://www.youtube.com/watch?v=NecLh4YOT9M"
    },
    "11-23": {
        "name": "String Quartet #13 in A minor, D. 804 \"Rosamunde\"",
        "author": "Schubert",
        "link": "https://www.youtube.com/watch?v=JGO_qd4PTh4"
    },
    "11-24": {
        "name": "Die Kunst der Fuge (The Art of Fugue), BWV 1080",
        "author": "Bach",
        "link": "https://www.youtube.com/watch?v=N6sUlZa-IrU"
    },
    "11-25": {
        "name": "Violin Concerto",
        "author": "Berg",
        "link": "https://www.youtube.com/watch?v=P0GzNmf_AUw"
    },
    "11-26": {
        "name": "Symphony #8 in B minor, D. 759 'Unfinished'",
        "author": "Schubert",
        "link": "https://www.youtube.com/watch?v=3tisvEpblig"
    },
    "11-27": {
        "name": "Symphony #7 in A, op. 92",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=vCHREyE5GzQ"
    },
    "11-28": {
        "name": "\u00c9tudes pour piano, Books 1-3",
        "author": "Ligeti",
        "link": "https://www.youtube.com/watch?v=f9hLauEdjC4"
    },
    "11-29": {
        "name": "Eine Alpensinfonie, op. 64",
        "author": "Strauss, R.",
        "link": "https://www.youtube.com/watch?v=sZDkMZmE0YY"
    },
    "11-30": {
        "name": "Symphony #10 in E minor, op. 93",
        "author": "Shostakovich",
        "link": "https://www.youtube.com/watch?v=gQU9hNxImxA"
    },
    "12-01": {
        "name": "Klavierst\u00fccke (Piano Pieces, 6), op. 118",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=XnUuGRoL97o"
    },
    "12-02": {
        "name": "Harpsichord Concerto #1 in D minor, BWV 1052",
        "author": "Bach",
        "link": "https://www.youtube.com/watch?v=XcsfDxojdV8"
    },
    "12-03": {
        "name": "Symphony #9 in D minor",
        "author": "Bruckner",
        "link": "https://www.youtube.com/watch?v=Az-kHLRQhsk"
    },
    "12-04": {
        "name": "Verkl\u00e4rte Nacht, op. 4",
        "author": "Schoenberg",
        "link": "https://www.youtube.com/watch?v=U-pVz2LTakM"
    },
    "12-05": {
        "name": "Nocturnes, L 91",
        "author": "Debussy",
        "link": "https://www.youtube.com/watch?v=jBCnFj28kEc"
    },
    "12-06": {
        "name": "Piano Sonata #31 in A-flat, op. 110",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=8duMwTZ8yUg"
    },
    "12-07": {
        "name": "Piano Concerto #4 in G, op. 58",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=6lvBQJjxw4c"
    },
    "12-08": {
        "name": "Piano Concerto #2 in B-flat, op. 83",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=BszBccYHuAk"
    },
    "12-09": {
        "name": "String Quartet in F",
        "author": "Ravel",
        "link": "https://www.youtube.com/watch?v=ieRQyyPowH0"
    },
    "12-10": {
        "name": "Symphony #1 in G minor, op. 13 \"Winter Daydreams\"",
        "author": "Tchaikovsky",
        "link": "https://www.youtube.com/watch?v=jzctjcHBO9k"
    },
    "12-11": {
        "name": "Piano Trio #1 in B, op. 8",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=viPLLjpujOU"
    },
    "12-12": {
        "name": "Piano Concerto in A minor, op. 16",
        "author": "Grieg",
        "link": "https://www.youtube.com/watch?v=I1Yoyz6_Los"
    },
    "12-13": {
        "name": "Symphony #1 in B-flat, op. 38 \"Spring\"",
        "author": "Schumann",
        "link": "https://www.youtube.com/watch?v=1Lk2V6YOcIc"
    },
    "12-14": {
        "name": "Piano Concerto #3 in C minor, op. 37",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=D_iPsP8LXI0"
    },
    "12-15": {
        "name": "Kreisleriana, op. 16",
        "author": "Schumann",
        "link": "https://www.youtube.com/watch?v=J5FayGAxTf0"
    },
    "12-16": {
        "name": "Noches en los Jardines de Espa\u00f1a (Nights in the Gardens of Spain)",
        "author": "Falla",
        "link": "https://www.youtube.com/watch?v=UyoEiRPmq6M"
    },
    "12-17": {
        "name": "String Quartet #12 in F, op. 96 'American'",
        "author": "Dvo\u0159\u00e1k",
        "link": "https://www.youtube.com/watch?v=DxtAHpYIXdU"
    },
    "12-18": {
        "name": "Symphony #5 in E minor, op. 64",
        "author": "Tchaikovsky",
        "link": "https://www.youtube.com/watch?v=dYTUtDjK2Kc"
    },
    "12-19": {
        "name": "Grande Messe des Morts (Requiem), op. 5",
        "author": "Berlioz",
        "link": "https://www.youtube.com/watch?v=vLfZ4-Y4VaU"
    },
    "12-20": {
        "name": "Cantata #140 'Wachet auf, ruft uns die Stimme'",
        "author": "Bach",
        "link": "https://www.youtube.com/watch?v=DqZE54i-muE"
    },
    "12-21": {
        "name": "Piano Concerto #1 in E minor, op. 11",
        "author": "Chopin",
        "link": "https://www.youtube.com/watch?v=5BLU-CaKIt8"
    },
    "12-22": {
        "name": "Clarinet Trio in A minor, op. 114",
        "author": "Brahms",
        "link": "https://www.youtube.com/watch?v=YOayoH9YRWk"
    },
    "12-23": {
        "name": "Stabat Mater, op. 53",
        "author": "Szymanowski",
        "link": "https://www.youtube.com/watch?v=soC2WFYgWH0"
    },
    "12-24": {
        "name": "Piano Concerto #3 in D minor, op. 30",
        "author": "Rachmaninoff",
        "link": "https://www.youtube.com/watch?v=GvKQKnIVy1I"
    },
    "12-25": {
        "name": "Violin Sonata #9, op. 47 \"Kreutzer\"",
        "author": "Beethoven",
        "link": "https://www.youtube.com/watch?v=COGcCBJAC6I"
    },
    "12-26": {
        "name": "Peer Gynt, op. 23 (including the suites, #1, op. 46; and #2, op. 55)",
        "author": "Grieg",
        "link": "https://www.youtube.com/watch?v=7kpqALC8IbI"
    },
    "12-27": {
        "name": "Pr\u00e9ludes for piano, Books I & II, L 117 & 123",
        "author": "Debussy",
        "link": "https://www.youtube.com/watch?v=53okWti8NfA"
    },
    "12-28": {
        "name": "Messiah, HWV 56",
        "author": "Handel",
        "link": "https://www.youtube.com/watch?v=JH3T6YwwU9s"
    },
    "12-29": {
        "name": "R\u00fcckert Lieder",
        "author": "Mahler",
        "link": "https://www.youtube.com/watch?v=OJNaKMgvXRA"
    },
    "12-30": {
        "name": "String Quartet #14 in D minor, D. 810 'Death and the Maiden'",
        "author": "Schubert",
        "link": "https://www.youtube.com/watch?v=otdayisyIiM"
    },
    "12-31": {
        "name": "Piano Quintet",
        "author": "Schnittke",
        "link": "https://www.youtube.com/watch?v=Td-cUkR1Tu8"
    }
};

// Main plugin class
export default class EverydayClassicalMusicPlugin extends Plugin {
    settings: EverydayClassicalMusicSettings;
    musicData: Record<string, MusicPiece> = {};
    pluginEnabledTimestamp: number;

    async onload() {
        // Load settings
        await this.loadSettings();

        // Load JSON data from the embedded data
        this.musicData = embeddedMusicData;

        // Get the current timestamp when the plugin is enabled
        this.pluginEnabledTimestamp = Date.now();
    

        // Register event to modify daily note on creation
        this.registerEvent(this.app.vault.on('create', this.onFileCreate.bind(this)));

        if (this.settings.backfillExistingNotes) {
            this.backfillExistingNotes();
        }

        // Add settings tab
        this.addSettingTab(new EverydayClassicalMusicSettingTab(this.app, this));
    }


    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async onFileCreate(file: TFile) {
        const fileCreationTime = moment(file.stat.ctime).valueOf();
        if (this.isDailyNoteFile(file) && fileCreationTime >= this.pluginEnabledTimestamp) {
            await this.addMusicLinkToFile(file);
        }
    }

    async backfillExistingNotes() {
        const files = this.app.vault.getMarkdownFiles();
        for (const file of files) {
            if (this.isDailyNoteFile(file)) {
                await this.addMusicLinkToFile(file);
            }
        }
    }

    async addMusicLinkToFile(file: TFile) {
        const date = file.basename;
        const monthDay = date.slice(5); // Get MM-DD part
        const musicPiece = this.musicData[monthDay];

        if (musicPiece) {
            const content = await this.app.vault.read(file);

            // Check if the note already contains the music link block
            if (content.includes('> [!tip] Daily Classical Music') || content.includes('[!info] Daily Classical Music') || content.includes('[!quote] Daily Classical Music')) {
                return;
            }

            const musicLink = `[${musicPiece.name} by ${musicPiece.author}](${musicPiece.link})`;
            const quoteBlock = `> [!tip] Daily Classical Music\n> ${musicLink}\n`;

            const propertyFieldsEndIndex = content.indexOf('---', content.indexOf('---') + 1) + 3;
            const newContent = `${content.slice(0, propertyFieldsEndIndex)}\n\n${quoteBlock}\n${content.slice(propertyFieldsEndIndex).trim()}`;

            await this.app.vault.modify(file, newContent);
        }
    }

    async removeLinksBeforeDate(cutoffDate: string) {
        const files = this.app.vault.getMarkdownFiles();
        const cutoff = moment(cutoffDate, 'YYYY-MM-DD');

        for (const file of files) {
            if (this.isDailyNoteFile(file)) {
                const fileDate = moment(file.basename, 'YYYY-MM-DD', true);
                if (fileDate.isValid() && fileDate.isBefore(cutoff)) {
                    let content = await this.app.vault.read(file);
                    const pattern = /> \[!tip\] Daily Classical Music\n> .*?\n\n/;
                    content = content.replace(pattern, '');
                    await this.app.vault.modify(file, content);
                }
            }
        }
    }

    isDailyNoteFile(file: TFile): boolean {
        const dailyNoteFormat = 'YYYY-MM-DD';  // Adjust if your daily note format is different
        return moment(file.basename, dailyNoteFormat, true).isValid();
    }
}

// Plugin settings tab
class EverydayClassicalMusicSettingTab extends PluginSettingTab {
    plugin: EverydayClassicalMusicPlugin;

    constructor(app: App, plugin: EverydayClassicalMusicPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Backfill existing notes')
            .setDesc('If enabled, backfill all existing daily notes with classical music suggestions')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.backfillExistingNotes)
                .onChange(async (value) => {
                    this.plugin.settings.backfillExistingNotes = value;
                    await this.plugin.saveSettings();
                    if (value) {
                        await this.plugin.backfillExistingNotes();
                    }
                }));

        new Setting(containerEl)
            .setName('Remove links before date')
            .setDesc('Select a date to remove all the links added before this date')
            .addText(text => text
                .setPlaceholder('YYYY-MM-DD')
                .setValue(this.plugin.settings.removeLinksBeforeDate)
                .onChange(async (value) => {
                    this.plugin.settings.removeLinksBeforeDate = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .addButton(button => {
                button.setButtonText('Remove links')
                    .setCta()
                    .onClick(async () => {
                        const cutoffDate = this.plugin.settings.removeLinksBeforeDate;
                        if (moment(cutoffDate, 'YYYY-MM-DD', true).isValid()) {
                            await this.plugin.removeLinksBeforeDate(cutoffDate);
                        } else {
                            new Notice('Please enter a valid date in YYYY-MM-DD format');
                        }
                    });
            });

        // Add "Feed the Markhor" button
        const buttonDiv = containerEl.createDiv({ cls: 'ko-fi-button-container' });

        const koFiButton = buttonDiv.createEl('button', { text: 'Feed the Markhor 🦌🪽', cls: 'ko-fi-button' });

        koFiButton.onclick = () => {
            window.open('https://ko-fi.com/flyingmarkhor', '_blank');
        };
    }
}
