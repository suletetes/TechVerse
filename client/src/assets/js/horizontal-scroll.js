// Horizontal Scroll Controls JavaScript
function initHorizontalScroll() {
    console.log('Initializing horizontal scroll controls...');
    
    // Initialize all horizontal scroll containers
    const scrollContainers = document.querySelectorAll('.blocs-horizontal-scroll-container');
    console.log('Found', scrollContainers.length, 'scroll containers');
    
    scrollContainers.forEach((container, index) => {
        console.log('Processing container', index + 1);
        
        const scrollArea = container.querySelector('.blocs-horizontal-scroll-area');
        const prevBtn = container.querySelector('.blocs-scroll-control-prev');
        const nextBtn = container.querySelector('.blocs-scroll-control-next');
        
        console.log('Container elements:', {
            scrollArea: !!scrollArea,
            prevBtn: !!prevBtn,
            nextBtn: !!nextBtn
        });
        
        if (!scrollArea || !prevBtn || !nextBtn) {
            console.log('Missing elements in container', index + 1);
            return;
        }
        
        // Scroll amount (adjust as needed)
        const scrollAmount = 300;
        
        // Previous button click handler
        prevBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Previous button clicked');
            
            scrollArea.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        });
        
        // Next button click handler
        nextBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Next button clicked');
            
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
        
        console.log('Container', index + 1, 'initialized successfully');
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHorizontalScroll);
} else {
    initHorizontalScroll();
}

// Also initialize after a short delay to catch dynamically loaded content
setTimeout(initHorizontalScroll, 1000);

// Alternative jQuery version (if jQuery is available)
function initJQueryHorizontalScroll() {
    if (typeof jQuery !== 'undefined') {
        console.log('Initializing jQuery horizontal scroll...');
        
        jQuery(document).ready(function($) {
            $('.blocs-horizontal-scroll-container').each(function(index) {
                console.log('Processing jQuery container', index + 1);
                
                const $container = $(this);
                const $scrollArea = $container.find('.blocs-horizontal-scroll-area');
                const $prevBtn = $container.find('.blocs-scroll-control-prev');
                const $nextBtn = $container.find('.blocs-scroll-control-next');
                
                if (!$scrollArea.length || !$prevBtn.length || !$nextBtn.length) {
                    console.log('Missing jQuery elements in container', index + 1);
                    return;
                }
                
                const scrollAmount = 300;
                
                // Remove any existing click handlers
                $prevBtn.off('click.horizontalScroll');
                $nextBtn.off('click.horizontalScroll');
                
                $prevBtn.on('click.horizontalScroll', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('jQuery Previous button clicked');
                    
                    $scrollArea.animate({
                        scrollLeft: $scrollArea.scrollLeft() - scrollAmount
                    }, 300);
                });
                
                $nextBtn.on('click.horizontalScroll', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('jQuery Next button clicked');
                    
                    $scrollArea.animate({
                        scrollLeft: $scrollArea.scrollLeft() + scrollAmount
                    }, 300);
                });
                
                console.log('jQuery container', index + 1, 'initialized successfully');
            });
        });
        
        // Also try after a delay
        setTimeout(function() {
            jQuery(function($) {
                $('.blocs-horizontal-scroll-container').each(function() {
                    const $container = $(this);
                    const $prevBtn = $container.find('.blocs-scroll-control-prev');
                    const $nextBtn = $container.find('.blocs-scroll-control-next');
                    
                    if ($prevBtn.length && !$prevBtn.data('scroll-initialized')) {
                        $prevBtn.data('scroll-initialized', true);
                        console.log('Re-initializing button handlers');
                    }
                });
            });
        }, 2000);
    }
}

// Initialize jQuery version
initJQueryHorizontalScroll();