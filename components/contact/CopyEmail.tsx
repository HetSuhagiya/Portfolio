'use client';
import { useState } from 'react';
import { site } from '@/content/site';
import { contact } from '@/content/resume';
export function CopyEmail() {
  const [message, setMessage] = useState('');
  return (
    <div>
      <button
        type="button"
        className="btn"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(site.email);
            setMessage(contact.copiedLabel);
          } catch {
            setMessage('Copy was unavailable. Select the email address above and copy it, or use Email me.');
          }
        }}
      >
        {contact.copyLabel}
      </button>
      <p className="text-small text-mute mt-3 max-w-[40ch]" role="status">
        {message}
      </p>
    </div>
  );
}
