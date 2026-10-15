'use client';
/* Wega's answers used to be pages of their own (/wega/risk-mix, /wega/ask?k=…). Old links now ask the same
   question in the chat on /wega. */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function ToChat() {
  const router = useRouter();
  useEffect(() => {
    const { pathname, search } = window.location;
    const q = new URLSearchParams(search);
    const text = q.get('q'),
      p = q.get('p');
    router.replace(pathname === '/wega/ask' && text ? `/wega?q=${encodeURIComponent(text)}${p ? '&p=' + encodeURIComponent(p) : ''}` : `/wega?ask=${encodeURIComponent(pathname + search)}`);
  }, [router]);
  return <div className="page wp wp-home" />;
}
