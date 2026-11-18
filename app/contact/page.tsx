import { Page } from '@/components/layout/Page';
import { PageHeading } from '@/components/layout/PageHeading';
import { CopyEmail } from '@/components/contact/CopyEmail';
import { TransitionLink } from '@/components/transition/TransitionLink';
import { contact } from '@/content/resume';
import { nextUp, pageSeo, site } from '@/content/site';
import { buildMetadata } from '@/lib/seo';
export const metadata = buildMetadata({ ...pageSeo.contact, path: '/contact' });
export default function ContactPage() {
  return (
    <Page next={nextUp['/contact']!}>
      <PageHeading eyebrow={contact.eyebrow} title={contact.heading} description={contact.body} />
      <section
        className="wrap contact-content grid-12 gap-y-12"
        data-chapter="Connect"
        aria-label="Contact details"
      >
        <div className="col-span-12 lg:col-span-8">
          <p className="text-label text-mute">{contact.links.email}</p>
          <a className="contact-email link mt-5 block" href={`mailto:${site.email}`}>
            {site.email.split('@')[0]}
            <wbr />@{site.email.split('@')[1]}
          </a>
          <div className="mt-8 flex flex-wrap gap-4">
            <a className="btn btn-solid" href={`mailto:${site.email}`}>
              Email me ↗
            </a>
            <CopyEmail />
          </div>
        </div>
        <aside className="col-span-12 lg:col-span-4">
          <p className="text-label text-mute">{site.location}</p>
          <p className="text-title mt-4">{site.status}</p>
          <ul className="text-body mt-6 space-y-3">
            {site.targetRoles.map((role) => (
              <li key={role}>{role}</li>
            ))}
          </ul>
        </aside>
        <div className="contact-links col-span-12">
          <a href={site.linkedin} target="_blank" rel="noopener noreferrer">
            <span className="text-label text-mute">Professional profile</span>
            <span className="text-title">{contact.links.linkedin} ↗</span>
          </a>
          <TransitionLink href="/resume">
            <span className="text-label text-mute">Experience & skills</span>
            <span className="text-title">Read résumé ↗</span>
          </TransitionLink>
          <a href={site.cv.href} download={site.cv.filename}>
            <span className="text-label text-mute">Take a copy</span>
            <span className="text-title">{contact.links.cv} ↓</span>
          </a>
          {site.github && (
            <a href={site.github} target="_blank" rel="noopener noreferrer">
              <span className="text-label text-mute">Code</span>
              <span className="text-title">GitHub ↗</span>
            </a>
          )}
        </div>
      </section>
    </Page>
  );
}
