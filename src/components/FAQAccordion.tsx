"use client";

import React, { useState } from "react";

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

export function FAQAccordion({ items }: FAQAccordionProps) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id || null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = items.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.question.toLowerCase().includes(term) ||
      item.answer.toLowerCase().includes(term)
    );
  });

  const toggleItem = (id: string) => {
    setActiveId((prev) => (prev === id ? null : id));
  };

  return (
    <>
      <div className="faq-search-wrapper">
        <div className="faq-search-box">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            id="faqSearchInput"
            placeholder="Type a keyword (e.g. 'pricing', 'Thalassery', 'timeline', 'source code')..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="faq-search-input"
          />
        </div>
      </div>

      <div className="faq-accordion-list">
        {filteredItems.map((item) => {
          const isOpen = activeId === item.id;
          return (
            <div
              key={item.id}
              className={`faq-item ${isOpen ? "active" : ""}`}
            >
              <button
                type="button"
                className="faq-question"
                aria-expanded={isOpen}
                onClick={() => toggleItem(item.id)}
              >
                <span>{item.question}</span>
                <span className="faq-icon" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
              </button>
              <div
                className="faq-answer"
                style={{ maxHeight: isOpen ? "1000px" : "0px" }}
              >
                <div className="faq-answer-inner">
                  <p>{item.answer}</p>
                </div>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div
            id="faqNoResults"
            className="faq-no-results"
            style={{ display: "block" }}
          >
            <p>
              No matching answers found. Please contact us directly at{" "}
              <a href="tel:+917510109730">+91 7510109730</a> or ask on WhatsApp.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
