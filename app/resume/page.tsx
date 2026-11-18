import { Page } from '@/components/layout/Page';
import { Copy, Caption } from '@/components/ui/Copy';
import { TransitionLink } from '@/components/transition/TransitionLink';
import { PrintResume } from '@/components/resume/PrintResume';
import { resume } from '@/content/resume';
import { nextUp, pageSeo, site } from '@/content/site';
import { buildMetadata } from '@/lib/seo';
export const metadata = buildMetadata({ ...pageSeo.resume, path: '/resume' });
export default function ResumePage() {
  return (
    <Page next={nextUp['/resume']!}>
      <article className="wrap resume-document">
        <header data-chapter="Résumé" className="resume-header">
          <div className="no-print">
            <Caption>{resume.eyebrow}</Caption>
            <h1 className="text-display-lg mt-5">{resume.heading}</h1>
          </div>
          <h2 className="resume-name">{site.name}</h2>
          <p className="text-title mt-2">
            {site.role} · {site.location}
          </p>
          <div className="resume-contact">
            <a className="link" href={`mailto:${site.email}`}>
              {site.email}
            </a>
            <a className="link" href={site.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn ↗
            </a>
            <a className="link" href={resume.mobileHref}>
              {resume.mobile}
            </a>
          </div>
          <div className="no-print mt-8 flex flex-wrap gap-3">
            <a className="btn btn-solid" href={site.cv.href} download={site.cv.filename}>
              Download CV ↓
            </a>
            <PrintResume />
          </div>
          <p className="no-print text-caption mt-4">{resume.printHint}</p>
        </header>
        <section className="resume-section" data-chapter="Summary" aria-labelledby="resume-summary">
          <h2 id="resume-summary">Summary</h2>
          <p>{resume.summary}</p>
        </section>
        <section className="resume-section" data-chapter="Experience" aria-labelledby="resume-experience">
          <h2 id="resume-experience">Work Experience</h2>
          <div>
            {resume.experience.map((job) => (
              <article className="resume-entry" key={job.org}>
                <div className="resume-entry-heading">
                  <h3>
                    {job.role} · {job.org}
                  </h3>
                  <p className="text-mute">
                    <Copy>{job.when}</Copy>
                  </p>
                </div>
                <ul>
                  {job.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
        <section className="resume-section" data-chapter="Projects" aria-labelledby="resume-projects">
          <h2 id="resume-projects">Projects</h2>
          <div>
            {resume.projects.map((project) => (
              <article key={project.name} className="resume-entry">
                <h3>
                  <TransitionLink className="link" href={project.href}>
                    {project.name} ↗
                  </TransitionLink>
                </h3>
                <ul>
                  {project.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
        <section className="resume-section" data-chapter="Education" aria-labelledby="resume-education">
          <h2 id="resume-education">Education</h2>
          <div>
            {resume.education.map((e) => (
              <article className="resume-entry" key={e.degree}>
                <div className="resume-entry-heading">
                  <h3>{e.degree}</h3>
                  <p className="text-mute">{e.when}</p>
                </div>
                <p className="mt-2">{e.school}</p>
                <p className="text-small text-mute mt-2">{e.detail}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="resume-section" data-chapter="Skills" aria-labelledby="resume-skills">
          <h2 id="resume-skills">Technical Skills</h2>
          <dl className="resume-skills">
            {resume.skills.map((group) => (
              <div key={group.label}>
                <dt>{group.label}</dt>
                <dd>{group.items.join(' · ')}</dd>
              </div>
            ))}
          </dl>
        </section>
      </article>
    </Page>
  );
}
