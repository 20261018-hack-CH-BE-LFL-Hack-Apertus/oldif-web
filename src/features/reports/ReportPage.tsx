import type { ReportCopy } from "./copy";
import {
  Architecture,
  Comparison,
  Metrics,
  Provenance,
  References,
  Workflow,
} from "./ReportFacts";
import { ReportFigure } from "./ReportFigure";
import s from "./styles";

type PageProps = { index: number; copy: ReportCopy };
function Research({ copy }: { copy: ReportCopy }) {
  return (
    <>
      <p>{copy.research}</p>
      <ul className={s.research}>
        {copy.researchItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <References copy={copy} />
    </>
  );
}
const Visuals = [
  Metrics,
  Provenance,
  Workflow,
  Comparison,
  Architecture,
  Research,
];
function PageVisual({ index, copy }: PageProps) {
  const Visual = Visuals[index];
  return (
    <>
      <Visual copy={copy} />
      {[0, 1, 2, 4].includes(index) && <ReportFigure index={index} copy={copy} />}
    </>
  );
}
function PageStory({ index, copy }: PageProps) {
  const page = copy.pages[index];
  return (
    <section className={s.story}>
      <h2>{page.title}</h2>
      <p className={s.intro}>{page.intro}</p>
      <ul>
        {page.bullets.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {index === 5 && (
        <ul className={s.limits}>
          {copy.limits.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
function PageFooter({ index, copy }: PageProps) {
  return (
    <footer className={s.pageFooter}>
      <span>HACK APERTUS · 19.10.2026 · {copy.team}: Jose OSPINA · Cristian OSPINA</span>
      <span>
        {copy.page} {index + 1} / {copy.pages.length}
      </span>
    </footer>
  );
}
function PageHeading({ index, copy }: PageProps) {
  return (
    <div className={s.pageHeading}>
      <span className={s.wordmark}>oldif.</span>
      <span className={s.eyebrow}>{copy.pages[index].label}</span>
    </div>
  );
}
function PageBody(props: PageProps) {
  return (
    <div className={s.pageBody}>
      <PageStory {...props} />
      <section className={s.visual}>
        <PageVisual {...props} />
      </section>
    </div>
  );
}
export function ReportPage({
  index,
  copy,
  deck = false,
  active = true,
}: PageProps & { deck?: boolean; active?: boolean }) {
  const props = { index, copy };
  return (
    <article
      id={`report-${index + 1}`}
      className={deck ? s.slide : s.sheet}
      data-active={active}
      data-page={index + 1}
      aria-label={`${copy.page} ${index + 1}: ${copy.pages[index].title}`}
    >
      <PageHeading {...props} />
      <PageBody {...props} />
      <PageFooter {...props} />
    </article>
  );
}
