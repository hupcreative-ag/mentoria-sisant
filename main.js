// main.js - Inicialização de scripts e GSAP

document.addEventListener('DOMContentLoaded', () => {
    
    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    initHeroAnimations();
    initHeroGridAnimation();
    initMagneticButtons();
    initScrollAnimations();
});

function initHeroAnimations() {
    // Easing and staggered animations for Hero Section
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    heroTl.from(".hero-content > *", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        delay: 0.2
    })
    .from('.hero-image-container img', {
        scale: 0.9,
        y: 20,
        opacity: 0,
        duration: 1,
        ease: "power2.out"
    }, "-=0.4")
    .from('.floating-badge', {
        scale: 0.5,
        opacity: 0,
        y: 20,
        duration: 0.8,
        stagger: 0.15,
        ease: "back.out(1.5)"
    }, "-=0.2");
}

function initHeroGridAnimation() {
    const heroGridPaths = document.querySelectorAll('.hero-grid-pattern');
    const heroSection = document.getElementById('hero');
    const maskLayer = document.querySelector('.hero-grid-mask');

    if (!heroGridPaths.length || !heroSection || !maskLayer) return;

    // Constant flow of the grid lines
    let offsetX = 0;
    let offsetY = 0;
    const speedX = 0.5;
    const speedY = 0.5;

    function animateGrid() {
        offsetX = (offsetX + speedX) % 40;
        offsetY = (offsetY + speedY) % 40;

        heroGridPaths.forEach(pattern => {
            pattern.setAttribute('x', offsetX);
            pattern.setAttribute('y', offsetY);
        });

        requestAnimationFrame(animateGrid);
    }
    requestAnimationFrame(animateGrid);

    // Initial mask positioning (hidden far away)
    maskLayer.style.webkitMaskImage = `radial-gradient(circle at -1000px -1000px, black 0%, transparent 400px)`;
    maskLayer.style.maskImage = `radial-gradient(circle at -1000px -1000px, black 0%, transparent 400px)`;
    maskLayer.style.transition = 'opacity 0.6s ease';
    
    // Track mouse over the hero section
    heroSection.addEventListener('mousemove', (e) => {
        const rect = heroSection.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        maskLayer.style.webkitMaskImage = `radial-gradient(circle at ${x}px ${y}px, black 0%, transparent 400px)`;
        maskLayer.style.maskImage = `radial-gradient(circle at ${x}px ${y}px, black 0%, transparent 400px)`;
    });

    heroSection.addEventListener('mouseleave', () => {
        maskLayer.style.opacity = '0'; // Hide mask smoothly when leaving
    });
    
    heroSection.addEventListener('mouseenter', () => {
        maskLayer.style.opacity = '0.25'; // Show back when active (subdued)
    });
}

function initMagneticButtons() {
    // Implement magnetic logic for the button inside the area
    const magneticBtns = document.querySelectorAll('.magnetic-btn');

    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            // Limit the movement
            gsap.to(btn, {
                x: x * 0.2, // Move 20% of the distance
                y: y * 0.2,
                duration: 0.3,
                ease: "power2.out"
            });
        });

        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
                x: 0,
                y: 0,
                duration: 0.5,
                ease: "elastic.out(1, 0.3)"
            });
        });
    });
}

function initScrollAnimations() {
    // Reveal for Headers/Sections
    const sectionReveals = document.querySelectorAll('.section-reveal');
    sectionReveals.forEach(el => {
        gsap.from(el, {
            scrollTrigger: {
                trigger: el,
                start: "top 85%",
                toggleActions: "play none none reverse"
            },
            y: 40,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out"
        });
    });

    // Reveal for Cards (Standard stagger equivalent)
    const cardReveals = document.querySelectorAll('.card-reveal');
    cardReveals.forEach(el => {
        gsap.from(el, {
            scrollTrigger: {
                trigger: el,
                start: "top 85%",
                toggleActions: "play none none reverse"
            },
            y: 50,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out"
        });
    });

    // Reveal for Text Lists / Elements inside a container
    const textReveals = document.querySelectorAll('.text-reveal');
    textReveals.forEach(container => {
        const elements = container.children;
        gsap.from(elements, {
            scrollTrigger: {
                trigger: container,
                start: "top 85%",
                toggleActions: "play none none reverse"
            },
            y: 20,
            opacity: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out"
        });
    });

    // Scale reveal (for CTAs inside page)
    const scaleReveals = document.querySelectorAll('.scale-reveal');
    scaleReveals.forEach(el => {
        gsap.from(el, {
            scrollTrigger: {
                trigger: el,
                start: "top 90%",
                toggleActions: "play none none reverse"
            },
            scale: 0.8,
            opacity: 0,
            duration: 0.8,
            ease: "back.out(1.5)"
        });
    });
}
