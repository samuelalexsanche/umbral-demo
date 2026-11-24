import { asset } from "@/lib/format";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/** Guadalajara y Puerto Vallarta lado a lado. Fotos de Wikimedia Commons con licencia CC BY-SA: el crédito debe quedar visible. */
export const CITIES = [
  { name: "Guadalajara", src: "/img/ciudades/guadalajara.webp", credit: "Allenpivot", license: "CC BY-SA 3.0", url: "https://commons.wikimedia.org/wiki/File:Skyline_Guadalajara_(cropped).jpg" },
  { name: "Puerto Vallarta", src: "/img/ciudades/puerto-vallarta.webp", credit: "August Dominus", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Panorama_meksi%C4%8Dkog_grada_Puerto_Vallarte_2022.jpg" },
];

export default function CityPair({ className }: { className?: string }) {
  return (
    <figure className="grid gap-2">
      <div className={cx("grid grid-cols-2 gap-2 overflow-hidden rounded-[14px]", className)}>
        {CITIES.map((c) => (
          <div key={c.name} className="relative overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset(c.src)} alt={`Vista de ${c.name}`} loading="lazy" className="h-full w-full object-cover" />
            <span className="absolute bottom-3 left-3 rounded-full bg-ink/75 px-3 py-1 text-sm font-semibold text-paper backdrop-blur">{c.name}</span>
          </div>
        ))}
      </div>
      <figcaption className="text-[11px] opacity-60">
        Fotos: {CITIES.map((c, i) => (
          <span key={c.name}>{i > 0 && " · "}<a href={c.url} target="_blank" rel="noopener" className="underline">{c.credit}</a>, {c.license}</span>
        ))}
      </figcaption>
    </figure>
  );
}
