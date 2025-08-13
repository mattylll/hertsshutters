/**
 * HertsShutters Website - Main JavaScript Application
 * Production-ready, modular implementation with ES6+
 * Includes all interactive functionality with graceful degradation
 */

(function() {
    'use strict';

    // Feature detection and polyfills
    const supportsIntersectionObserver = 'IntersectionObserver' in window;
    const supportsScrollBehavior = 'scrollBehavior' in document.documentElement.style;
    
    // Configuration
    const CONFIG = {
        SCROLL_THRESHOLD: 100,
        ANIMATION_DELAY: 100,
        DEBOUNCE_DELAY: 150,
        LAZY_LOAD_OFFSET: 50,
        COUNTER_DURATION: 2000,
        FORM_SUBMIT_DELAY: 1000,
        MAP_CENTER: [51.8159, -0.3515], // Harpenden coordinates
        MAP_ZOOM: 12
    };

    // State management
    const state = {
        isMenuOpen: false,
        isScrolling: false,
        galleryFilter: 'all',
        lightboxOpen: false,
        currentLightboxIndex: 0
    };

    // Utility Functions
    const utils = {
        // Debounce function for performance
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        // Throttle function for scroll events
        throttle(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        // Smooth scroll implementation
        smoothScroll(target, duration = 800) {
            const targetElement = document.querySelector(target);
            if (!targetElement) return;

            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
            const startPosition = window.pageYOffset;
            const distance = targetPosition - startPosition;
            let startTime = null;

            function animation(currentTime) {
                if (startTime === null) startTime = currentTime;
                const timeElapsed = currentTime - startTime;
                const run = utils.easeInOutQuad(timeElapsed, startPosition, distance, duration);
                window.scrollTo(0, run);
                if (timeElapsed < duration) requestAnimationFrame(animation);
            }

            requestAnimationFrame(animation);
        },

        // Easing function for smooth animations
        easeInOutQuad(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        },

        // Format phone number
        formatPhoneNumber(value) {
            const phone = value.replace(/\D/g, '');
            const match = phone.match(/^(\d{0,5})(\d{0,6})$/);
            if (!match) return value;
            return !match[2] ? match[1] : `${match[1]} ${match[2]}`;
        },

        // Validate email
        validateEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        },

        // Create element with attributes
        createElement(tag, attributes = {}, children = []) {
            const element = document.createElement(tag);
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'text') {
                    element.textContent = value;
                } else if (key === 'html') {
                    element.innerHTML = value;
                } else if (key.startsWith('data-')) {
                    element.dataset[key.slice(5)] = value;
                } else {
                    element.setAttribute(key, value);
                }
            });
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else {
                    element.appendChild(child);
                }
            });
            return element;
        }
    };

    // Navigation Module
    const Navigation = {
        init() {
            this.header = document.querySelector('.site-header');
            this.mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
            this.navbarMenu = document.querySelector('.navbar-menu');
            this.dropdowns = document.querySelectorAll('.dropdown');
            
            if (!this.header) return;

            this.setupStickyHeader();
            this.setupMobileMenu();
            this.setupDropdowns();
            this.setupSmoothScroll();
        },

        setupStickyHeader() {
            let lastScrollTop = 0;
            const handleScroll = utils.throttle(() => {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                
                // Add/remove sticky class
                if (scrollTop > CONFIG.SCROLL_THRESHOLD) {
                    this.header.classList.add('sticky');
                    
                    // Hide/show on scroll
                    if (scrollTop > lastScrollTop && scrollTop > 500) {
                        this.header.classList.add('hidden');
                    } else {
                        this.header.classList.remove('hidden');
                    }
                } else {
                    this.header.classList.remove('sticky', 'hidden');
                }
                
                lastScrollTop = scrollTop;
            }, 100);

            window.addEventListener('scroll', handleScroll);
        },

        setupMobileMenu() {
            if (!this.mobileMenuToggle) return;

            this.mobileMenuToggle.addEventListener('click', () => {
                state.isMenuOpen = !state.isMenuOpen;
                this.toggleMobileMenu(state.isMenuOpen);
            });

            // Close menu on outside click
            document.addEventListener('click', (e) => {
                if (state.isMenuOpen && 
                    !this.navbarMenu.contains(e.target) && 
                    !this.mobileMenuToggle.contains(e.target)) {
                    state.isMenuOpen = false;
                    this.toggleMobileMenu(false);
                }
            });

            // Close menu on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && state.isMenuOpen) {
                    state.isMenuOpen = false;
                    this.toggleMobileMenu(false);
                }
            });
        },

        toggleMobileMenu(open) {
            this.mobileMenuToggle.setAttribute('aria-expanded', open);
            this.mobileMenuToggle.classList.toggle('active', open);
            this.navbarMenu.classList.toggle('active', open);
            document.body.classList.toggle('menu-open', open);
        },

        setupDropdowns() {
            this.dropdowns.forEach(dropdown => {
                const toggle = dropdown.querySelector('.dropdown-toggle');
                const menu = dropdown.querySelector('.dropdown-menu');
                
                if (!toggle || !menu) return;

                // Click handler for mobile
                toggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
                    this.closeAllDropdowns();
                    if (!isOpen) {
                        toggle.setAttribute('aria-expanded', 'true');
                        dropdown.classList.add('active');
                    }
                });

                // Hover handlers for desktop
                if (window.matchMedia('(min-width: 768px)').matches) {
                    dropdown.addEventListener('mouseenter', () => {
                        toggle.setAttribute('aria-expanded', 'true');
                        dropdown.classList.add('active');
                    });

                    dropdown.addEventListener('mouseleave', () => {
                        toggle.setAttribute('aria-expanded', 'false');
                        dropdown.classList.remove('active');
                    });
                }
            });
        },

        closeAllDropdowns() {
            this.dropdowns.forEach(dropdown => {
                const toggle = dropdown.querySelector('.dropdown-toggle');
                toggle.setAttribute('aria-expanded', 'false');
                dropdown.classList.remove('active');
            });
        },

        setupSmoothScroll() {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', (e) => {
                    const href = anchor.getAttribute('href');
                    if (href === '#' || href === '#0') return;
                    
                    e.preventDefault();
                    
                    if (supportsScrollBehavior) {
                        const target = document.querySelector(href);
                        if (target) {
                            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    } else {
                        utils.smoothScroll(href);
                    }
                });
            });
        }
    };

    // Animation Module
    const Animations = {
        init() {
            if (supportsIntersectionObserver) {
                this.setupScrollAnimations();
                this.setupCounterAnimations();
                this.setupParallax();
            } else {
                // Fallback: show all elements immediately
                document.querySelectorAll('.animate-on-scroll').forEach(el => {
                    el.classList.add('animated');
                });
            }
        },

        setupScrollAnimations() {
            const elements = document.querySelectorAll('.animate-on-scroll, .fade-in, .slide-up, .slide-in');
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry, index) => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            entry.target.classList.add('animated');
                            observer.unobserve(entry.target);
                        }, index * CONFIG.ANIMATION_DELAY);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '50px'
            });

            elements.forEach(element => observer.observe(element));
        },

        setupCounterAnimations() {
            const counters = document.querySelectorAll('.counter');
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !entry.target.dataset.animated) {
                        this.animateCounter(entry.target);
                        entry.target.dataset.animated = 'true';
                    }
                });
            }, {
                threshold: 0.5
            });

            counters.forEach(counter => observer.observe(counter));
        },

        animateCounter(element) {
            const target = parseInt(element.dataset.target) || parseInt(element.textContent);
            const duration = CONFIG.COUNTER_DURATION;
            const step = target / (duration / 16);
            let current = 0;

            const updateCounter = () => {
                current += step;
                if (current < target) {
                    element.textContent = Math.floor(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    element.textContent = target;
                    // Add suffix if exists
                    if (element.dataset.suffix) {
                        element.textContent += element.dataset.suffix;
                    }
                }
            };

            updateCounter();
        },

        setupParallax() {
            const parallaxElements = document.querySelectorAll('.parallax');
            
            if (parallaxElements.length === 0) return;

            const handleParallax = utils.throttle(() => {
                const scrolled = window.pageYOffset;
                
                parallaxElements.forEach(element => {
                    const speed = element.dataset.speed || 0.5;
                    const yPos = -(scrolled * speed);
                    element.style.transform = `translateY(${yPos}px)`;
                });
            }, 16);

            window.addEventListener('scroll', handleParallax);
        }
    };

    // Gallery Module
    const Gallery = {
        init() {
            this.setupGallery();
            this.setupLightbox();
            this.setupFilters();
            this.setupLazyLoading();
        },

        setupGallery() {
            this.galleryContainer = document.querySelector('.gallery-container');
            this.galleryItems = document.querySelectorAll('.gallery-item');
            
            if (!this.galleryContainer) return;

            this.galleryItems.forEach((item, index) => {
                item.addEventListener('click', () => {
                    this.openLightbox(index);
                });

                // Add keyboard support
                item.setAttribute('tabindex', '0');
                item.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.openLightbox(index);
                    }
                });
            });
        },

        setupLightbox() {
            // Create lightbox structure if it doesn't exist
            if (!document.querySelector('.lightbox')) {
                const lightbox = utils.createElement('div', {
                    class: 'lightbox',
                    role: 'dialog',
                    'aria-label': 'Image gallery',
                    'aria-modal': 'true'
                });

                const lightboxContent = utils.createElement('div', {
                    class: 'lightbox-content'
                });

                const closeBtn = utils.createElement('button', {
                    class: 'lightbox-close',
                    'aria-label': 'Close gallery',
                    html: '&times;'
                });

                const prevBtn = utils.createElement('button', {
                    class: 'lightbox-prev',
                    'aria-label': 'Previous image',
                    html: '&#10094;'
                });

                const nextBtn = utils.createElement('button', {
                    class: 'lightbox-next',
                    'aria-label': 'Next image',
                    html: '&#10095;'
                });

                const image = utils.createElement('img', {
                    class: 'lightbox-image',
                    alt: ''
                });

                const caption = utils.createElement('div', {
                    class: 'lightbox-caption'
                });

                lightboxContent.appendChild(image);
                lightboxContent.appendChild(caption);
                lightbox.appendChild(closeBtn);
                lightbox.appendChild(prevBtn);
                lightbox.appendChild(nextBtn);
                lightbox.appendChild(lightboxContent);
                document.body.appendChild(lightbox);

                // Event listeners
                closeBtn.addEventListener('click', () => this.closeLightbox());
                prevBtn.addEventListener('click', () => this.navigateLightbox(-1));
                nextBtn.addEventListener('click', () => this.navigateLightbox(1));
                
                lightbox.addEventListener('click', (e) => {
                    if (e.target === lightbox) {
                        this.closeLightbox();
                    }
                });

                // Keyboard navigation
                document.addEventListener('keydown', (e) => {
                    if (!state.lightboxOpen) return;
                    
                    switch(e.key) {
                        case 'Escape':
                            this.closeLightbox();
                            break;
                        case 'ArrowLeft':
                            this.navigateLightbox(-1);
                            break;
                        case 'ArrowRight':
                            this.navigateLightbox(1);
                            break;
                    }
                });
            }

            this.lightbox = document.querySelector('.lightbox');
            this.lightboxImage = document.querySelector('.lightbox-image');
            this.lightboxCaption = document.querySelector('.lightbox-caption');
        },

        openLightbox(index) {
            state.lightboxOpen = true;
            state.currentLightboxIndex = index;
            
            const item = this.galleryItems[index];
            const img = item.querySelector('img');
            const caption = item.querySelector('.gallery-caption');
            
            this.lightboxImage.src = img.dataset.fullsize || img.src;
            this.lightboxImage.alt = img.alt;
            this.lightboxCaption.textContent = caption ? caption.textContent : '';
            
            this.lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Focus management
            this.lightbox.focus();
        },

        closeLightbox() {
            state.lightboxOpen = false;
            this.lightbox.classList.remove('active');
            document.body.style.overflow = '';
            
            // Return focus to the gallery item
            this.galleryItems[state.currentLightboxIndex].focus();
        },

        navigateLightbox(direction) {
            state.currentLightboxIndex += direction;
            
            if (state.currentLightboxIndex < 0) {
                state.currentLightboxIndex = this.galleryItems.length - 1;
            } else if (state.currentLightboxIndex >= this.galleryItems.length) {
                state.currentLightboxIndex = 0;
            }
            
            this.openLightbox(state.currentLightboxIndex);
        },

        setupFilters() {
            const filterButtons = document.querySelectorAll('.gallery-filter');
            
            filterButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const filter = button.dataset.filter;
                    this.filterGallery(filter);
                    
                    // Update active state
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                });
            });
        },

        filterGallery(filter) {
            state.galleryFilter = filter;
            
            this.galleryItems.forEach(item => {
                const category = item.dataset.category;
                
                if (filter === 'all' || category === filter) {
                    item.style.display = '';
                    setTimeout(() => {
                        item.classList.add('animated');
                    }, 100);
                } else {
                    item.style.display = 'none';
                    item.classList.remove('animated');
                }
            });
        },

        setupLazyLoading() {
            const images = document.querySelectorAll('img[data-src]');
            
            if (images.length === 0) return;

            if (supportsIntersectionObserver) {
                const imageObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            this.loadImage(img);
                            imageObserver.unobserve(img);
                        }
                    });
                }, {
                    rootMargin: `${CONFIG.LAZY_LOAD_OFFSET}px`
                });

                images.forEach(img => imageObserver.observe(img));
            } else {
                // Fallback: load all images immediately
                images.forEach(img => this.loadImage(img));
            }
        },

        loadImage(img) {
            const src = img.dataset.src;
            if (!src) return;

            // Create a new image to preload
            const newImg = new Image();
            newImg.onload = () => {
                img.src = src;
                img.classList.add('loaded');
                delete img.dataset.src;
            };
            newImg.src = src;
        }
    };

    // Form Handling Module
    const FormHandler = {
        init() {
            this.forms = document.querySelectorAll('form');
            this.setupForms();
        },

        setupForms() {
            this.forms.forEach(form => {
                // Add novalidate to use custom validation
                form.setAttribute('novalidate', '');
                
                // Setup form fields
                this.setupFormFields(form);
                
                // Handle submission
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleSubmit(form);
                });
            });
        },

        setupFormFields(form) {
            // Phone number formatting
            const phoneInputs = form.querySelectorAll('input[type="tel"]');
            phoneInputs.forEach(input => {
                input.addEventListener('input', (e) => {
                    e.target.value = utils.formatPhoneNumber(e.target.value);
                });
            });

            // Real-time validation
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.validateField(input);
                });

                // Clear error on input
                input.addEventListener('input', () => {
                    this.clearFieldError(input);
                });
            });
        },

        validateField(field) {
            const value = field.value.trim();
            const type = field.type;
            const required = field.hasAttribute('required');
            let isValid = true;
            let errorMessage = '';

            // Required field validation
            if (required && !value) {
                isValid = false;
                errorMessage = 'This field is required';
            }
            // Email validation
            else if (type === 'email' && value && !utils.validateEmail(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
            // Phone validation
            else if (type === 'tel' && value) {
                const phoneDigits = value.replace(/\D/g, '');
                if (phoneDigits.length < 10 || phoneDigits.length > 11) {
                    isValid = false;
                    errorMessage = 'Please enter a valid phone number';
                }
            }
            // Min length validation
            else if (field.minLength && value.length < field.minLength) {
                isValid = false;
                errorMessage = `Minimum ${field.minLength} characters required`;
            }

            if (!isValid) {
                this.showFieldError(field, errorMessage);
            } else {
                this.clearFieldError(field);
            }

            return isValid;
        },

        showFieldError(field, message) {
            const wrapper = field.closest('.form-group') || field.parentElement;
            wrapper.classList.add('error');
            
            // Remove existing error message
            const existingError = wrapper.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            
            // Add new error message
            const errorElement = utils.createElement('span', {
                class: 'error-message',
                text: message,
                role: 'alert'
            });
            wrapper.appendChild(errorElement);
            
            // Set aria-invalid
            field.setAttribute('aria-invalid', 'true');
            field.setAttribute('aria-describedby', errorElement.id);
        },

        clearFieldError(field) {
            const wrapper = field.closest('.form-group') || field.parentElement;
            wrapper.classList.remove('error');
            
            const errorElement = wrapper.querySelector('.error-message');
            if (errorElement) {
                errorElement.remove();
            }
            
            field.setAttribute('aria-invalid', 'false');
            field.removeAttribute('aria-describedby');
        },

        async handleSubmit(form) {
            // Validate all fields
            const fields = form.querySelectorAll('input, textarea, select');
            let isValid = true;
            
            fields.forEach(field => {
                if (!this.validateField(field)) {
                    isValid = false;
                }
            });

            if (!isValid) {
                // Focus first error field
                const firstError = form.querySelector('[aria-invalid="true"]');
                if (firstError) {
                    firstError.focus();
                }
                return;
            }

            // Honeypot anti-spam check
            const honeypot = form.querySelector('input[name="website"]');
            if (honeypot && honeypot.value) {
                console.warn('Spam detected');
                return;
            }

            // Show loading state
            const submitButton = form.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';
            submitButton.classList.add('loading');

            try {
                // Simulate form submission (replace with actual API call)
                const formData = new FormData(form);
                const data = Object.fromEntries(formData);
                
                // Add timestamp for rate limiting
                data.timestamp = Date.now();
                
                // Simulate API call
                await this.submitForm(data);
                
                // Show success message
                this.showSuccessMessage(form);
                
                // Reset form
                form.reset();
                
            } catch (error) {
                // Show error message
                this.showErrorMessage(form, error.message);
                
            } finally {
                // Reset button
                submitButton.disabled = false;
                submitButton.textContent = originalText;
                submitButton.classList.remove('loading');
            }
        },

        async submitForm(data) {
            // Simulate API call with delay
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    // Simulate success/failure
                    if (Math.random() > 0.1) {
                        resolve({ success: true, message: 'Form submitted successfully' });
                    } else {
                        reject(new Error('Network error. Please try again.'));
                    }
                }, CONFIG.FORM_SUBMIT_DELAY);
            });
        },

        showSuccessMessage(form) {
            const message = utils.createElement('div', {
                class: 'alert alert-success',
                html: '<strong>Success!</strong> Your message has been sent. We\'ll get back to you within 24 hours.',
                role: 'alert'
            });
            
            form.parentElement.insertBefore(message, form);
            
            // Remove message after 5 seconds
            setTimeout(() => {
                message.classList.add('fade-out');
                setTimeout(() => message.remove(), 500);
            }, 5000);
        },

        showErrorMessage(form, error) {
            const message = utils.createElement('div', {
                class: 'alert alert-error',
                html: `<strong>Error!</strong> ${error}`,
                role: 'alert'
            });
            
            form.parentElement.insertBefore(message, form);
            
            // Remove message after 5 seconds
            setTimeout(() => {
                message.classList.add('fade-out');
                setTimeout(() => message.remove(), 500);
            }, 5000);
        }
    };

    // Interactive Components Module
    const InteractiveComponents = {
        init() {
            this.setupBeforeAfterSlider();
            this.setupTestimonialSlider();
            this.setupQuoteCalculator();
            this.setupInteractiveMap();
        },

        setupBeforeAfterSlider() {
            const sliders = document.querySelectorAll('.before-after-slider');
            
            sliders.forEach(slider => {
                const handle = slider.querySelector('.slider-handle');
                const before = slider.querySelector('.before-image');
                const after = slider.querySelector('.after-image');
                
                if (!handle || !before || !after) return;

                let isDragging = false;
                
                const updateSlider = (x) => {
                    const rect = slider.getBoundingClientRect();
                    const percent = Math.max(0, Math.min(100, ((x - rect.left) / rect.width) * 100));
                    
                    handle.style.left = `${percent}%`;
                    before.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
                };

                // Mouse events
                handle.addEventListener('mousedown', () => isDragging = true);
                
                document.addEventListener('mousemove', (e) => {
                    if (isDragging) {
                        e.preventDefault();
                        updateSlider(e.clientX);
                    }
                });
                
                document.addEventListener('mouseup', () => isDragging = false);

                // Touch events
                handle.addEventListener('touchstart', () => isDragging = true);
                
                document.addEventListener('touchmove', (e) => {
                    if (isDragging && e.touches.length === 1) {
                        e.preventDefault();
                        updateSlider(e.touches[0].clientX);
                    }
                });
                
                document.addEventListener('touchend', () => isDragging = false);

                // Keyboard support
                handle.setAttribute('tabindex', '0');
                handle.setAttribute('role', 'slider');
                handle.setAttribute('aria-label', 'Before and after comparison');
                handle.setAttribute('aria-valuemin', '0');
                handle.setAttribute('aria-valuemax', '100');
                handle.setAttribute('aria-valuenow', '50');
                
                handle.addEventListener('keydown', (e) => {
                    const currentPercent = parseFloat(handle.style.left) || 50;
                    let newPercent = currentPercent;
                    
                    switch(e.key) {
                        case 'ArrowLeft':
                            newPercent = Math.max(0, currentPercent - 5);
                            break;
                        case 'ArrowRight':
                            newPercent = Math.min(100, currentPercent + 5);
                            break;
                        case 'Home':
                            newPercent = 0;
                            break;
                        case 'End':
                            newPercent = 100;
                            break;
                        default:
                            return;
                    }
                    
                    e.preventDefault();
                    handle.style.left = `${newPercent}%`;
                    before.style.clipPath = `inset(0 ${100 - newPercent}% 0 0)`;
                    handle.setAttribute('aria-valuenow', newPercent);
                });
            });
        },

        setupTestimonialSlider() {
            const sliders = document.querySelectorAll('.testimonial-slider');
            
            sliders.forEach(slider => {
                const slides = slider.querySelectorAll('.testimonial-slide');
                const prevBtn = slider.querySelector('.slider-prev');
                const nextBtn = slider.querySelector('.slider-next');
                const indicators = slider.querySelector('.slider-indicators');
                
                if (slides.length === 0) return;

                let currentSlide = 0;
                let autoplayInterval;

                // Create indicators
                if (indicators) {
                    slides.forEach((_, index) => {
                        const indicator = utils.createElement('button', {
                            class: 'indicator',
                            'aria-label': `Go to slide ${index + 1}`
                        });
                        
                        indicator.addEventListener('click', () => {
                            goToSlide(index);
                            stopAutoplay();
                        });
                        
                        indicators.appendChild(indicator);
                    });
                }

                const updateSlider = () => {
                    slides.forEach((slide, index) => {
                        slide.classList.toggle('active', index === currentSlide);
                        slide.setAttribute('aria-hidden', index !== currentSlide);
                    });
                    
                    // Update indicators
                    if (indicators) {
                        const dots = indicators.querySelectorAll('.indicator');
                        dots.forEach((dot, index) => {
                            dot.classList.toggle('active', index === currentSlide);
                        });
                    }
                    
                    // Update button states
                    if (prevBtn) prevBtn.disabled = currentSlide === 0;
                    if (nextBtn) nextBtn.disabled = currentSlide === slides.length - 1;
                };

                const goToSlide = (index) => {
                    currentSlide = Math.max(0, Math.min(slides.length - 1, index));
                    updateSlider();
                };

                const nextSlide = () => {
                    currentSlide = (currentSlide + 1) % slides.length;
                    updateSlider();
                };

                const prevSlide = () => {
                    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
                    updateSlider();
                };

                const startAutoplay = () => {
                    autoplayInterval = setInterval(nextSlide, 5000);
                };

                const stopAutoplay = () => {
                    clearInterval(autoplayInterval);
                };

                // Event listeners
                if (prevBtn) prevBtn.addEventListener('click', () => {
                    prevSlide();
                    stopAutoplay();
                });
                
                if (nextBtn) nextBtn.addEventListener('click', () => {
                    nextSlide();
                    stopAutoplay();
                });

                // Touch/swipe support
                let touchStartX = 0;
                let touchEndX = 0;

                slider.addEventListener('touchstart', (e) => {
                    touchStartX = e.touches[0].clientX;
                    stopAutoplay();
                });

                slider.addEventListener('touchend', (e) => {
                    touchEndX = e.changedTouches[0].clientX;
                    const difference = touchStartX - touchEndX;
                    
                    if (Math.abs(difference) > 50) {
                        if (difference > 0) {
                            nextSlide();
                        } else {
                            prevSlide();
                        }
                    }
                });

                // Keyboard navigation
                slider.addEventListener('keydown', (e) => {
                    switch(e.key) {
                        case 'ArrowLeft':
                            prevSlide();
                            stopAutoplay();
                            break;
                        case 'ArrowRight':
                            nextSlide();
                            stopAutoplay();
                            break;
                    }
                });

                // Initialize
                updateSlider();
                startAutoplay();

                // Pause on hover
                slider.addEventListener('mouseenter', stopAutoplay);
                slider.addEventListener('mouseleave', startAutoplay);
            });
        },

        setupQuoteCalculator() {
            const calculator = document.querySelector('.quote-calculator');
            if (!calculator) return;

            const form = calculator.querySelector('form');
            const resultDiv = calculator.querySelector('.quote-result');
            
            if (!form) return;

            // Price configuration
            const pricing = {
                shutters: {
                    plantation: 250,
                    solid: 300,
                    cafe: 220,
                    tierOnTier: 280,
                    fullHeight: 260
                },
                blinds: {
                    venetian: 120,
                    roller: 100,
                    roman: 150,
                    vertical: 130,
                    wooden: 180
                },
                extras: {
                    motorization: 150,
                    specialShape: 100,
                    installation: 50
                }
            };

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                calculateQuote();
            });

            form.addEventListener('input', utils.debounce(() => {
                if (form.checkValidity()) {
                    calculateQuote();
                }
            }, 500));

            function calculateQuote() {
                const formData = new FormData(form);
                
                const type = formData.get('type');
                const style = formData.get('style');
                const width = parseFloat(formData.get('width')) || 0;
                const height = parseFloat(formData.get('height')) || 0;
                const quantity = parseInt(formData.get('quantity')) || 1;
                const extras = formData.getAll('extras');
                
                // Calculate area in square meters
                const area = (width * height) / 10000;
                
                // Get base price per square meter
                let basePrice = pricing[type]?.[style] || 0;
                
                // Calculate total
                let total = basePrice * area * quantity;
                
                // Add extras
                extras.forEach(extra => {
                    total += pricing.extras[extra] || 0;
                });
                
                // Display result
                displayQuote(total, area, quantity);
            }

            function displayQuote(total, area, quantity) {
                if (!resultDiv) return;
                
                const formattedTotal = new Intl.NumberFormat('en-GB', {
                    style: 'currency',
                    currency: 'GBP'
                }).format(total);
                
                resultDiv.innerHTML = `
                    <div class="quote-summary">
                        <h3>Estimated Quote</h3>
                        <div class="quote-details">
                            <div class="quote-item">
                                <span>Area:</span>
                                <span>${area.toFixed(2)} m²</span>
                            </div>
                            <div class="quote-item">
                                <span>Quantity:</span>
                                <span>${quantity} window${quantity > 1 ? 's' : ''}</span>
                            </div>
                            <div class="quote-total">
                                <span>Total Estimate:</span>
                                <span class="price">${formattedTotal}</span>
                            </div>
                        </div>
                        <p class="quote-note">
                            This is an estimate only. Final price will be confirmed after our free consultation and measurement service.
                        </p>
                        <button class="btn btn-primary" onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})">
                            Book Free Consultation
                        </button>
                    </div>
                `;
                
                resultDiv.classList.add('active');
            }
        },

        setupInteractiveMap() {
            const mapContainer = document.getElementById('map');
            if (!mapContainer) return;

            // Check if Leaflet is loaded
            if (typeof L === 'undefined') {
                // Load Leaflet dynamically
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(link);

                const script = document.createElement('script');
                script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                script.onload = () => this.initMap();
                document.head.appendChild(script);
            } else {
                this.initMap();
            }
        },

        initMap() {
            const mapContainer = document.getElementById('map');
            if (!mapContainer || mapContainer.dataset.initialized) return;

            try {
                // Initialize map
                const map = L.map('map').setView(CONFIG.MAP_CENTER, CONFIG.MAP_ZOOM);

                // Add tile layer
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 19
                }).addTo(map);

                // Add marker for business location
                const marker = L.marker(CONFIG.MAP_CENTER).addTo(map);
                marker.bindPopup(`
                    <div class="map-popup">
                        <h4>HertsShutters</h4>
                        <p>7 Piggottshill Lane<br>
                        Harpenden, Hertfordshire<br>
                        AL5 1LG</p>
                        <p><strong>Phone:</strong> <a href="tel:01582787223">01582 787223</a></p>
                        <p><strong>Hours:</strong><br>
                        Mon-Fri: 9:00 AM - 6:00 PM<br>
                        Sat: 9:00 AM - 4:00 PM</p>
                    </div>
                `);

                // Add service area circle
                L.circle(CONFIG.MAP_CENTER, {
                    color: '#1e3a8a',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.2,
                    radius: 15000 // 15km radius
                }).addTo(map).bindPopup('Our service area covers all of Hertfordshire');

                // Mark as initialized
                mapContainer.dataset.initialized = 'true';

            } catch (error) {
                console.error('Error initializing map:', error);
                // Fallback: show static map or address
                mapContainer.innerHTML = `
                    <div class="map-fallback">
                        <h4>Visit Our Showroom</h4>
                        <address>
                            7 Piggottshill Lane<br>
                            Harpenden, Hertfordshire<br>
                            AL5 1LG
                        </address>
                        <p><a href="https://maps.google.com/?q=7+Piggottshill+Lane+Harpenden+AL5+1LG" target="_blank" rel="noopener">Get Directions</a></p>
                    </div>
                `;
            }
        }
    };

    // Performance Module
    const Performance = {
        init() {
            this.setupLazyLoading();
            this.setupResourceHints();
            this.monitorPerformance();
        },

        setupLazyLoading() {
            // Lazy load images (already handled in Gallery module)
            // Lazy load iframes
            const iframes = document.querySelectorAll('iframe[data-src]');
            
            if (iframes.length === 0) return;

            if (supportsIntersectionObserver) {
                const iframeObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const iframe = entry.target;
                            iframe.src = iframe.dataset.src;
                            delete iframe.dataset.src;
                            iframeObserver.unobserve(iframe);
                        }
                    });
                }, {
                    rootMargin: '100px'
                });

                iframes.forEach(iframe => iframeObserver.observe(iframe));
            } else {
                // Fallback: load all iframes
                iframes.forEach(iframe => {
                    iframe.src = iframe.dataset.src;
                });
            }
        },

        setupResourceHints() {
            // Preconnect to external domains
            const preconnectDomains = [
                'https://fonts.googleapis.com',
                'https://fonts.gstatic.com',
                'https://unpkg.com'
            ];

            preconnectDomains.forEach(domain => {
                const link = document.createElement('link');
                link.rel = 'preconnect';
                link.href = domain;
                document.head.appendChild(link);
            });

            // Prefetch critical resources
            const prefetchResources = [
                '/api/testimonials',
                '/api/gallery'
            ];

            if ('connection' in navigator && navigator.connection.saveData) {
                // Don't prefetch on slow connections
                return;
            }

            prefetchResources.forEach(resource => {
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.href = resource;
                document.head.appendChild(link);
            });
        },

        monitorPerformance() {
            if (!window.performance || !performance.getEntriesByType) return;

            // Log performance metrics
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    const paintData = performance.getEntriesByType('paint');
                    
                    console.group('Performance Metrics');
                    console.log('DOM Content Loaded:', perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart, 'ms');
                    console.log('Page Load Time:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
                    
                    paintData.forEach(entry => {
                        console.log(`${entry.name}:`, Math.round(entry.startTime), 'ms');
                    });
                    
                    console.groupEnd();
                }, 0);
            });
        }
    };

    // Accessibility Module
    const Accessibility = {
        init() {
            this.setupSkipLinks();
            this.setupFocusTrap();
            this.setupAnnouncements();
            this.enhanceKeyboardNavigation();
        },

        setupSkipLinks() {
            // Create skip to content link if it doesn't exist
            if (!document.querySelector('.skip-link')) {
                const skipLink = utils.createElement('a', {
                    href: '#main',
                    class: 'skip-link',
                    text: 'Skip to main content'
                });
                document.body.insertBefore(skipLink, document.body.firstChild);
            }
        },

        setupFocusTrap() {
            // Trap focus in modals and lightbox
            const trapContainers = ['.lightbox', '.modal'];
            
            trapContainers.forEach(selector => {
                const container = document.querySelector(selector);
                if (!container) return;

                container.addEventListener('keydown', (e) => {
                    if (e.key !== 'Tab') return;

                    const focusableElements = container.querySelectorAll(
                        'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
                    );
                    
                    const firstElement = focusableElements[0];
                    const lastElement = focusableElements[focusableElements.length - 1];

                    if (e.shiftKey && document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    } else if (!e.shiftKey && document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                });
            });
        },

        setupAnnouncements() {
            // Create live region for announcements
            if (!document.querySelector('.sr-only-live')) {
                const liveRegion = utils.createElement('div', {
                    class: 'sr-only-live',
                    'aria-live': 'polite',
                    'aria-atomic': 'true'
                });
                document.body.appendChild(liveRegion);
            }
        },

        enhanceKeyboardNavigation() {
            // Add visible focus indicators
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    document.body.classList.add('keyboard-nav');
                }
            });

            document.addEventListener('mousedown', () => {
                document.body.classList.remove('keyboard-nav');
            });
        },

        announce(message) {
            const liveRegion = document.querySelector('.sr-only-live');
            if (liveRegion) {
                liveRegion.textContent = message;
                setTimeout(() => {
                    liveRegion.textContent = '';
                }, 1000);
            }
        }
    };

    // Initialize all modules
    const App = {
        init() {
            // Check for JavaScript support
            document.documentElement.classList.remove('no-js');
            document.documentElement.classList.add('js');

            // Initialize modules
            Navigation.init();
            Animations.init();
            Gallery.init();
            FormHandler.init();
            InteractiveComponents.init();
            Performance.init();
            Accessibility.init();

            // Handle page visibility for performance
            this.handleVisibilityChange();

            // Setup error handling
            this.setupErrorHandling();

            console.log('HertsShutters App initialized successfully');
        },

        handleVisibilityChange() {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    // Pause animations and timers when page is hidden
                    document.body.classList.add('page-hidden');
                } else {
                    // Resume when visible
                    document.body.classList.remove('page-hidden');
                }
            });
        },

        setupErrorHandling() {
            window.addEventListener('error', (e) => {
                console.error('Global error:', e.error);
                // Could send to error tracking service
            });

            window.addEventListener('unhandledrejection', (e) => {
                console.error('Unhandled promise rejection:', e.reason);
                // Could send to error tracking service
            });
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => App.init());
    } else {
        App.init();
    }

    // Export for debugging/testing
    window.HertsShuttersApp = {
        App,
        Navigation,
        Animations,
        Gallery,
        FormHandler,
        InteractiveComponents,
        Performance,
        Accessibility,
        utils,
        state,
        CONFIG
    };

})();