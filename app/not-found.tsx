import { Page } from '@/components/layout/Page';
import { PageHeading } from '@/components/layout/PageHeading';
import { TransitionLink } from '@/components/transition/TransitionLink';
import { notFound } from '@/content/resume';
export default function NotFoundPage() {
  return (
    <Page next={{ href: '/work', label: 'The work', eyebrow: 'Reconnect' }}>
      <PageHeading eyebrow={`// ${notFound.code}`} title={notFound.heading} description={notFound.body}>
        {notFound.links.map((link) => (
          <TransitionLink key={link.href} href={link.href} className="btn">
            {link.label} ↗
          </TransitionLink>
        ))}
      </PageHeading>
    </Page>
  );
}
