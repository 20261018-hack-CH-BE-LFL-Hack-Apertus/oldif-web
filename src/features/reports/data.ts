import snapshot from "../../../public/reports/evidence-snapshot.json";
export const evidence = snapshot;
export const referenceLinks = [
  {
    title: "University of Bern · Deciphering Archives with Apertus",
    url: "https://hackapertus.notion.site/university-of-bern",
  },
  {
    title: "Stapfer-Enquête · opendata.swiss",
    url: snapshot.dataset.source_url,
  },
  {
    title: "NVIDIA · Nemotron 3.5 Parse",
    url: "https://huggingface.co/nvidia/Nemotron-3.5-Parse",
  },
  { title: "NVIDIA · OpenShell", url: "https://github.com/NVIDIA/OpenShell" },
  {
    title: "AutoData · arXiv:2606.25996",
    url: "https://arxiv.org/abs/2606.25996",
  },
  {
    title: "Microsoft · MDASH",
    url: "https://learn.microsoft.com/en-us/security-exposure-management/ai-code-security-overview",
  },
];
export const figureFiles = [
  "workspace-redesign-light.png",
  "archive-workspace.png",
  "workspace-redesign-running.png",
  null,
  "voice-baseline.png",
  null,
];
