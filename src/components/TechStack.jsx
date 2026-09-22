import Reveal from './Reveal.jsx';

const STACK = [
  {
    code: '01',
    category: 'Languages',
    items: ['Python', 'Java', 'C','HTML / CSS / JavaScript','TypeScript'],
  },
  {
    code: '02',
    category: 'Frontend',
    items: [ 'React', 'Vue.js', 'Svelte'],
  },
  {
    code: '03',
    category: 'Backend & APIs',
    items: ['Flask', 'Hono','Express'],
  },
  {
    code: '04',
    category: 'Databases',
    items: ['MySQL', 'PostgreSQL', 'MongoDB', 'SQLite'],
  },
  {
    code: '05',
    category: 'Data & ML',
    items: ['NumPy', 'Pandas', 'Matplotlib', 'Scikit-learn', 'PyTorch'],
  },
  {
    code: '06',
    category: 'Mobile',
    items: ['React Native', 'Android Studio'],
  },
];

export default function TechStack() {
  return (
    <section id="stack" className="border-b border-ink-line/70 bg-ink-panel/20">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <Reveal as="header" className="mb-12 max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-blue-bright">Bill of materials</p>
          <h2 className="mt-3 font-mono text-3xl font-semibold text-paper md:text-4xl">The stack</h2>
          <p className="mt-4 text-paper-dim">
            The languages, frameworks, and tools each project draws from — picked per job, not forced onto it.
          </p>
        </Reveal>

        <div className="overflow-x-auto border border-ink-line/70">
          <table className="w-full min-w-[640px] border-collapse font-mono text-sm">
            <thead>
              <tr className="border-b border-ink-line/70 bg-ink-panel/50 text-left text-xs uppercase tracking-widest text-paper-dim">
                <th className="w-20 px-4 py-3 font-medium">Item</th>
                <th className="w-48 px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Components</th>
              </tr>
            </thead>
            <tbody>
              {STACK.map((row, i) => (
                <Reveal
                  key={row.code}
                  as="tr"
                  delay={i * 70}
                  className="border-b border-ink-line/40 transition-colors duration-300 last:border-b-0 hover:bg-ink-panel/40"
                >
                  <td className="px-4 py-4 align-top text-blue-bright">{row.code}</td>
                  <td className="px-4 py-4 align-top text-paper">{row.category}</td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-wrap gap-2">
                      {row.items.map((item) => (
                        <span
                          key={item}
                          className="rounded-sm border border-blue-line/60 px-2.5 py-1 text-xs text-paper-dim transition-colors duration-300 hover:border-blue-bright hover:text-paper"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </td>
                </Reveal>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
