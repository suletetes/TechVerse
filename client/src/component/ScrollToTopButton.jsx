import React  from "react";
export default function ScrollToTopButton() {
    const scrollToTop = () => {
        window.scrollTo({top: 0, behavior: "smooth"});
    };

    return (
        <button
            aria-label="Scroll to top button"
            className="bloc-button btn btn-d scrollToTop"
            onClick={scrollToTop}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 32 32">
                <path className="scroll-to-top-btn-icon" d="M30,22.656l-14-13-14,13"/>
            </svg>
        </button>
    );
}
