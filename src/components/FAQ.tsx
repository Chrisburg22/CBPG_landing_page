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
    <section className="section" id="faq">
      <div className="wrap">
        <div className="meta-row reveal">
          <span>(06) Preguntas frecuentes</span>
          <span>Lo que más nos preguntan</span>
        </div>

        <div className="faq__layout">
          <div className="faq__head reveal">
            <h2>Resolvemos tus dudas.</h2>
            <p>
              Si te queda algo suelto, escríbenos por WhatsApp: contestamos el mismo
              día en horario de consultorio.
            </p>
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
      </div>
    </section>
  );
}
