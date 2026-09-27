import Link from "next/link";

const projectTypes = [
  { icon: "🎵", label: "Single", sub: "1 song" },
  { icon: "💿", label: "EP", sub: "3–5 songs" },
  { icon: "📀", label: "Album", sub: "Multiple songs" },
  { icon: "🎬", label: "Music video", sub: "Visual content" },
  { icon: "📣", label: "Content campaign", sub: "Social media" },
  { icon: "🤝", label: "Collaboration", sub: "Work with others" },
];

export default function Create() {
  return (
    <div className="px-5 pt-6 pb-28">
      <h2 className="text-lg font-extrabold">Create a project</h2>
      <p className="text-sm text-molla-sub mt-1.5 mb-4">What are you building next?</p>

      <div className="grid grid-cols-2 gap-3">
        {projectTypes.map((t) => (
          <div key={t.label} className="border border-molla-line rounded-card p-5">
            <div className="text-xl">{t.icon}</div>
            <h4 className="font-extrabold text-sm mt-2.5">{t.label}</h4>
            <p className="text-xs text-molla-sub">{t.sub}</p>
          </div>
        ))}
      </div>

      <div className="text-xs font-extrabold text-molla-sub mt-6 mb-2.5">YOUR PROJECTS</div>
      <Link href="/project" className="block border border-molla-line rounded-card p-5">
        <div className="flex justify-between">
          <span className="font-extrabold">Debut Single</span>
          <span className="text-molla-blue font-extrabold">72%</span>
        </div>
      </Link>
    </div>
  );
}
