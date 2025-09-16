import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, Sparkles } from 'lucide-react';
import '../styles/main.css';
import SiteHeader from './SiteHeader';

export default function EvaRoomLanding() {
  return (
    <div className="page solid-bg">
      <SiteHeader />
      <main className="container content">
        <section className="eva-room card section">
          <div className="eva-room__eyebrow">Eva Room</div>
          <h1 className="eva-room__title">Your EVA Room staging area</h1>
          <p className="eva-room__lead">
            We&apos;re preparing a richer EVA Room hand-off. In the meantime, use the
            framework tools to shortlist roles, then jump into EVA for deeper
            conversations with your talent partner.
          </p>
          <div className="eva-room__grid">
            <article className="eva-room__card">
              <Compass className="eva-room__icon" aria-hidden="true" />
              <h2>Anchor your current position</h2>
              <p>
                Set your home role in the matcher so EVA Room knows where you are
                today and can tailor recommendations accordingly.
              </p>
            </article>
            <article className="eva-room__card">
              <Sparkles className="eva-room__icon" aria-hidden="true" />
              <h2>Capture inspiration</h2>
              <p>
                Save interesting transitions, note critical skills, and bring those
                highlights into EVA for a focused conversation.
              </p>
            </article>
          </div>
          <footer className="eva-room__footer">
            <Link to="/" className="button button--secondary">
              <ArrowLeft size={18} aria-hidden="true" /> Back to framework
            </Link>
            <a
              className="button button--primary"
              href="https://eva.msd.com"
              target="_blank"
              rel="noreferrer"
            >
              Open EVA Room
            </a>
          </footer>
        </section>
      </main>
    </div>
  );
}
