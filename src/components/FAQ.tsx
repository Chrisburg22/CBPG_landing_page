import { useId, useState } from 'react';
import type { FAQItem } from '@/types/site';

interface FAQItemComponentProps {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItemComponent({ item, isOpen, onToggle }: FAQItemComponentProps) {
  const id = useId();
  const panelId = `${id}-panel`;
  const buttonId = `${id}-button`;

  return (
    <div className={`faq__item${isOpen ? ' open' : ''}`}>
      <h3 className="faq__heading">
        <button
          id={buttonId}
          className="faq__q"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
        >
          {item.question}
          <span className="icn" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </span>
        </button>
      </h3>
      <div className="faq__a" id={panelId} role="region" aria-labelledby={buttonId}>
        <div>{item.answer}</div>
      </div>
    </div>
  );
}

interface FAQProps {
  items: FAQItem[];
}

export default function FAQ({ items }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex((prev) => (prev === i ? null : i));

  return (
    <section className="section section--alt" id="faq">
      <div className="wrap">
        <div className="section__head reveal" style={{ marginInline: 'auto', textAlign: 'center' }}>
          <span className="eyebrow" style={{ justifyContent: 'center' }}>Preguntas frecuentes</span>
          <h2>Resolvemos tus dudas.</h2>
        </div>
        <div className="faq reveal">
          {items.map((item, i) => (
            <FAQItemComponent
              key={item.question}
              item={item}
              isOpen={openIndex === i}
              onToggle={() => toggle(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
