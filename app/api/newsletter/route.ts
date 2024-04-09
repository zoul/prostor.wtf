import { Event, allFutureEvents } from "@/src/events";

export async function GET(): Promise<Response> {
  const events = await allFutureEvents();
  const html = events
    .filter((e) => e.datumPresne != null)
    .filter((e) => !e.zruseno)
    .map(viewEvent)
    .join("\n");
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
    },
  });
}

function viewEvent(event: Event): string {
  return [
    viewEventTitle(event),
    viewEventSubtitle(event),
    viewEventInfo(event),
  ].join("\n");
}

function viewEventInfo(event: Event): string {
  return `<p>${event.info}</p>`;
}

function viewEventTitle(event: Event): string {
  if (event.fb != null) {
    return `<h2><a href="${event.fb}">${event.jmeno}</a></h2>`;
  } else {
    return `<h2>${event.jmeno}</h2>`;
  }
}

function viewEventSubtitle(event: Event): string {
  var items = event.datum
    ? [event.datum]
    : [viewDate(event.datumPresne!), viewTime(event.datumPresne!)];
  if (event.vstupenky) {
    items.push(`<a href="${event.vstupenky}">vstupenky</a>`);
  }
  if (event.vstupne) {
    const format = new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: "CZK",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format;
    items.push(`Doporučené vstupné ${format(event.vstupne)}`);
  }
  return `
    <p style="text-transform: uppercase">
      ${items.join("  //  ")}
    </p>`;
}

function viewDate(d: Date): string {
  return d.toLocaleDateString("cs-CZ", {
    weekday: "long",
    month: "numeric",
    day: "numeric",
  });
}

function viewTime(d: Date): string {
  return d.toLocaleTimeString("cs-CZ", {
    hour: "numeric",
    minute: "numeric",
  });
}
