import Image from "next/image";
import type { ReportCopy } from "./copy";
import { figureFiles } from "./data";
import s from "./styles";
export function ReportFigure({
  index,
  copy,
}: {
  index: number;
  copy: ReportCopy;
}) {
  const file = figureFiles[index];
  if (!file) return null;
  return (
    <figure className={s.figure}>
      <Image
        src={`/reports/${file}`}
        width={1440}
        height={1000}
        alt={copy.pages[index].caption}
        unoptimized
        loading="eager"
      />
      <figcaption>{copy.pages[index].caption}</figcaption>
    </figure>
  );
}
