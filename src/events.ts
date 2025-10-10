import { Client } from "@notionhq/client";
import {
  array,
  decodeType,
  field,
  literal,
  record,
  string,
} from "typescript-json-decoder";
import {
  checkboxProp,
  dateProp,
  numberProp,
  richTextProp,
  selectProp,
  titleProp,
  urlProp,
} from "@/src/notion";
import { notEmpty } from "./utils";

process.env.TZ = "Europe/Prague";

type EventPage = decodeType<typeof decodeEventPage>;
const decodeEventPage = record({
  object: literal("page"),
  id: string,
  props: field(
    "properties",
    record({
      jmeno: field("Název", titleProp),
      datum: field("Kdy", richTextProp),
      datumPresne: field("Kdy přesně", dateProp),
      info: field("Popis", richTextProp),
      fb: field("FB událost", urlProp),
      vstupenky: field("Vstupenky", urlProp),
      vstupne: field("Vstupné", numberProp),
      doporuceneVstupne: field("Doporučené vstupné", numberProp),
      zanr: field("Žánr", selectProp),
      promo: field("Promovat", checkboxProp),
      zruseno: field("Zrušeno", checkboxProp),
      zverejnit: field("Zveřejnit", checkboxProp),
    })
  ),
});

export interface Event {
  id: string;
  jmeno: string;
  datumPresne: Date;
  datum?: string;
  ukazujCas: boolean;
  sekce: string;
  info?: string;
  fb?: string;
  vstupenky?: string;
  vstupne?: number;
  doporuceneVstupne?: number;
  zanr?: string;
  zverejnit: boolean;
  zruseno: boolean;
}

export async function allFutureEvents(
  apiKey = process.env.NOTION_API_KEY
): Promise<Event[]> {
  const decodeQueryResponse = record({
    object: literal("list"),
    results: array(decodeEventPage),
  });
  const notion = new Client({ auth: apiKey });
  const events = await notion.databases
    .query({
      database_id: "030ee6a0cbbf40bc9b5cbae4001f0d8e",
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    })
    .then(decodeQueryResponse)
    .then((response) => response.results)
    .then((pages) => pages.map(unwrapEventPage))
    .then((events) => events.filter(notEmpty));

  return (
    events
      // Only published events
      .filter((e) => e.zverejnit)
      // Only future events
      .filter((e) => e.datumPresne != null && e.datumPresne >= new Date())
      // Sort by date
      .sort((a, b) => +a.datumPresne! - +b.datumPresne!)
  );
}

function unwrapEventPage(page: EventPage): Event | undefined {
  const p = page.props;

  const jmeno = p.jmeno.value.at(0)?.plainText;
  const datumPresne = p.datumPresne?.date?.start;
  const zanr = p.zanr.select?.name;

  if (!jmeno || !datumPresne) {
    return undefined;
  }

  const sekce = categorizeDate(datumPresne);

  return {
    id: page.id,
    jmeno,
    datumPresne,
    ukazujCas: !datumPresne.toISOString().endsWith("T00:00:00.000Z"),
    sekce,
    datum: p.datum?.value.at(0)?.plainText,
    info: p.info.value.at(0)?.plainText,
    fb: p.fb.value ?? undefined,
    zanr: zanr ? normalizeGenre(zanr) : undefined,
    vstupenky: p.vstupenky.value ?? undefined,
    vstupne: p.vstupne.value ?? undefined,
    doporuceneVstupne: p.doporuceneVstupne?.value || undefined,
    zverejnit: p.zverejnit.value,
    zruseno: p.zruseno.value,
  };
}

//
// Helpers
//

const normalizeGenre = (s: string) =>
  s.slice(0, 1).toLocaleUpperCase() + s.slice(1).toLocaleLowerCase();

const daysBetweenDays = (a: Date, b: Date) => (+a - +b) / (1000 * 60 * 60 * 24);

const categorizeDate = (d: Date) => {
  const diff = daysBetweenDays(d, new Date());
  if (diff < 0) {
    return "proběhlo";
  } else if (diff < 30) {
    return "nejbližší měsíc";
  } else if (diff < 60) {
    return "na obzoru";
  } else {
    return "připravujeme";
  }
};
