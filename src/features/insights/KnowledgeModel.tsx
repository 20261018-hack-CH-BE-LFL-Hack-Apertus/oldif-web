import type { Language } from "@/lib/models/types";
import type { InsightsCopy } from "./copy";
import { knowledgeCopy } from "./knowledgeCopy";
import s from "@/features/archive/ArchiveStyles.module.css";
export function KnowledgeModel({
  t,
  language,
  agents = false,
}: {
  t: InsightsCopy;
  language: Language;
  agents?: boolean;
}) {
  const k = knowledgeCopy(language);
  const relations = [
    [k.document, k.contains, k.page, "original_sha256 · page"],
    [k.page, k.contains, k.passage, "text_sha256 · char_start · char_end"],
    [k.result, k.cites, k.passage, "source_id · quote"],
    [k.review, k.revises, k.document, "actor · reason · version"],
    [
      k.annotation,
      k.labels,
      k.page,
      "handwriting · legibility · missingness · bias",
    ],
    [k.export, k.records, k.snapshot, "version · manifest"],
  ];
  return (
    <section className={`${s.panel} ${s.stack}`}>
      <h2>{agents ? t.agents : t.source}</h2>
      <p>{agents ? t.boundaries : t.semantics}</p>
      {agents ? (
        <>
          <div className={s.grid}>
            {[k.plan, k.research, k.verify, k.propose].map((value, index) => (
              <article key={value} className={s.panel}>
                <h3>
                  {index + 1} · {value}
                </h3>
              </article>
            ))}
          </div>
          <p className={s.warning}>
            OpenClaw → Rust core → Apertus · gRPC / WebSocket / WebRTC
          </p>
          <p className={s.muted}>{k.references}</p>
        </>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                {[k.subject, k.relation, k.object, k.provenance].map(
                  (value) => (
                    <th key={value}>{value}</th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {relations.map((row) => (
                <tr key={row.join("")}>
                  {row.map((value, index) => (
                    <td key={index}>{value}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
