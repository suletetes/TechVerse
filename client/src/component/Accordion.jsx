import React, { useState } from "react";

const AccordionItem = ({ title, children, isOpen, onToggle }) => {
    return (
        <div className="accordion-item mb-3 border rounded">
            <div 
                className="accordion-header p-3 cursor-pointer d-flex justify-content-between align-items-center"
                onClick={onToggle}
                style={{ backgroundColor: '#f8f9fa', cursor: 'pointer' }}
            >
                <h3 className="mb-0 tc-6533">{title}</h3>
                <span className={`accordion-icon ${isOpen ? 'rotate' : ''}`}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                    </svg>
                </span>
            </div>
            <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
                <div className="p-3">
                    {children}
                </div>
            </div>
        </div>
    );
};

const Accordion = ({ items, allowMultiple = false }) => {
    const [openItems, setOpenItems] = useState(new Set());

    const toggleItem = (index) => {
        const newOpenItems = new Set(openItems);
        
        if (allowMultiple) {
            if (newOpenItems.has(index)) {
                newOpenItems.delete(index);
            } else {
                newOpenItems.add(index);
            }
        } else {
            if (newOpenItems.has(index)) {
                newOpenItems.clear();
            } else {
                newOpenItems.clear();
                newOpenItems.add(index);
            }
        }
        
        setOpenItems(newOpenItems);
    };

    return (
        <div className="accordion">
            {items.map((item, index) => (
                <AccordionItem
                    key={index}
                    title={item.title}
                    isOpen={openItems.has(index)}
                    onToggle={() => toggleItem(index)}
                >
                    {item.content}
                </AccordionItem>
            ))}
        </div>
    );
};

export default Accordion;