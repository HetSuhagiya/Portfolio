'use client';
import { useState } from 'react';
import { about, type Skill } from '@/content/about';
import { Copy } from '@/components/ui/Copy';
export function Toolkit() {
  const [list, setList] = useState(false);
  const [selected, setSelected] = useState<Skill>(about.toolkit.groups[0]!.skills[0]!);
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <p className="text-small text-mute max-w-[50ch]">{about.toolkit.body}</p>
        <button type="button" className="btn btn-sm" aria-pressed={list} onClick={() => setList(!list)}>
          {list ? about.toolkit.listToggle.map : about.toolkit.listToggle.list}
        </button>
      </div>
      <div className={list ? 'toolkit-list' : 'toolkit-map'}>
        {about.toolkit.groups.map((group) => (
          <section key={group.id} className="toolkit-group" aria-label={group.label}>
            <h3 className="text-label text-mute mb-5">{group.label}</h3>
            {list ? (
              <dl>
                {group.skills.map((skill) => (
                  <div key={skill.name} className="border-line border-t py-4">
                    <dt className="text-body">{skill.name}</dt>
                    <dd className="text-small text-mute mt-2">
                      <Copy>{skill.usedFor}</Copy>
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="flex flex-wrap gap-3">
                {group.skills.map((skill) => (
                  <button
                    type="button"
                    key={skill.name}
                    className="toolkit-node"
                    aria-pressed={selected.name === skill.name}
                    onClick={() => setSelected(skill)}
                    onFocus={() => setSelected(skill)}
                    onMouseEnter={() => setSelected(skill)}
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
      {!list && (
        <div className="toolkit-detail mt-6" role="status">
          <h3 className="text-title">{selected.name}</h3>
          <p className="text-body text-mute mt-3">
            <Copy>{selected.usedFor}</Copy>
          </p>
        </div>
      )}
    </div>
  );
}
