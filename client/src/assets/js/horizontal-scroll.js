// Horizontal Scroll Controls JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all horizontal scroll containers
    const scrollContainers = document.querySelectorAll('.blocs-horizontal-scroll-container');
    
    scrollContainers.forEach(container => {
        const scrollArea = container.querySelector('.blocs-horizontal-scroll-area');
        const prevBtn = container.querySelector('.blocs-scroll-control-prev');
        const nextBtn = container.querySelector('.blocs-scroll-control-next');
        
        if (!scrollArea || !prevBtn || !nextBtn) return;
        
        // Scroll amount (adjust as needed)
        const scrollAmount = 300;
        
        // Previous button click handler
        prevBtn.addEventListener('click', function(e) {
            e.preventDefault();
            scrollArea.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        });
        
        // Next button click handler
        nextBtn.addEventListener('click', function(e) {
            e.preventDefault();
            scrollArea.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        });
        
        // Update button visibility based on scroll position
        function updateButtonVisibility() {
            const isAtStart = scrollArea.scrollLeft <= 0;
            const isAtEnd = scrollArea.scrollLeft >= (scrollArea.scrollWidth - scrollArea.clientWidth);
            
            // Add/remove classes for styling
            if (isAtStart) {
                container.classList.add('hide-left-control');
            } else {
                container.classList.remove('hide-left-control');
            }
            
            if (isAtEnd) {
                container.classList.add('hide-right-control');
            } else {
                container.classList.remove('hide-right-control');
            }
        }
        
        // Listen for scroll events to update button visibility
        scrollArea.addEventListener('scroll', updateButtonVisibility);
        
        // Initial button visibility check
        updateButtonVisibility();
        
        // Show controls on hover (for containers without show-controls class)
        if (!container.classList.contains('show-controls')) {
            container.addEventListener('mouseenter', function() {
                container.classList.add('show-controls');
            });
            
            container.addEventListener('mouseleave', function() {
                container.classList.remove('show-controls');
            });
        }
    });
});

// Alternative jQuery version (if jQuery is available)
if (typeof jQuery !== 'undefined') {
    jQuery(document).ready(function($) {
        $('.blocs-horizontal-scroll-container').each(function() {
            const $container = $(this);
            const $scrollArea = $container.find('.blocs-horizontal-scroll-area');
            const $prevBtn = $container.find('.blocs-scroll-control-prev');
            const $nextBtn = $container.find('.blocs-scroll-control-next');
            
            if (!$scrollArea.length || !$prevBtn.length || !$nextBtn.length) return;
            
            const scrollAmount = 300;
            
            $prevBtn.on('click', function(e) {
                e.preventDefault();
                $scrollArea.animate({
                    scrollLeft: $scrollArea.scrollLeft() - scrollAmount
                }, 300);
            });
            
            $nextBtn.on('click', function(e) {
                e.preventDefault();
                $scrollArea.animate({
                    scrollLeft: $scrollArea.scrollLeft() + scrollAmount
                }, 300);
            });
        });
    });
}