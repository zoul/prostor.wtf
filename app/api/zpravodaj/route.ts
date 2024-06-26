import { Event, allFutureEvents } from "@/src/events";
import { ContentType } from "@/src/utils";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const events = await allFutureEvents();
  const text = events
    .filter((e) => e.datumPresne != null)
    .filter((e) => !e.zruseno)
    .map(viewEvent)
    .join("\n");
  return new Response(text, {
    status: 200,
    headers: {
      "Content-Type": ContentType.plain,
      "Cache-Control": "s-maxage=300, stale-while-revalidate",
    },
  });
}

function viewEvent(event: Event): string {
  return [
    viewDateLine(event),
    viewTimeLine(event),
    event.jmeno,
    event.info,
    "",
  ].join("\n");
}

function viewDateLine(event: Event): string {
  if (event.datum) {
    return event.datum;
  } else if (event.datumPresne) {
    return viewDate(event.datumPresne);
  } else {
    return "";
  }
}

function viewTimeLine(event: Event): string {
  if (event.datum) {
    return "Prostor";
  } else {
    return `Prostor ${viewTime(event.datumPresne!)}`;
  }
}

function viewDate(d: Date): string {
  return d.toLocaleDateString("cs-CZ", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function viewTime(d: Date): string {
  return d.toLocaleTimeString("cs-CZ", {
    hour: "numeric",
    minute: "numeric",
  });
}
