import { ArrowRight, SlidersHorizontal } from 'lucide-react';
import './CustomBuilderTeaser.css';

export default function CustomBuilderTeaser() {
  return (
    <section className="zero-one-builder-teaser" aria-label="Custom package builder teaser">
      <div className="zero-one-builder-teaser__line" aria-hidden="true" />
      <div className="zero-one-builder-teaser__copy">
        <p><SlidersHorizontal size={14} /> CUSTOM BUILDER</p>
        <h2>
          Build it. <span>Shape it.</span> Make it yours.
        </h2>
        <div className="zero-one-builder-teaser__words" aria-hidden="true">
          <span>CONTENT</span><i>·</i><span>VIDEO</span><i>·</i><span>DESIGN</span><i>·</i><span>DIGITAL</span>
        </div>
      </div>
      <a className="zero-one-builder-teaser__cta" href="/pricing">
        <span>Build your package</span>
        <b><ArrowRight size={17} /></b>
      </a>
    </section>
  );
}
