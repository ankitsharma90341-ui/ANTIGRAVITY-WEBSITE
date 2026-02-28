document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 1. Loader Logic
    // ==========================================
    const loader = document.getElementById('loader');
    // Hide loader after loading animation completes
    setTimeout(() => {
        loader.style.transform = 'translateY(-100%)';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 800);
    }, 2200);

    // ==========================================
    // 2. Custom Cursor Tracking
    // ==========================================
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');
    const hoverLinks = document.querySelectorAll('.hover-link, button, a');

    let mouseX = 0, mouseY = 0;
    let followerX = 0, followerY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Immediate cursor movement
        cursor.style.left = mouseX + 'px';
        cursor.style.top = mouseY + 'px';
    });

    // Smooth follower movement Loop using interpolation
    function animateCursor() {
        followerX += (mouseX - followerX) * 0.15;
        followerY += (mouseY - followerY) * 0.15;

        follower.style.left = followerX + 'px';
        follower.style.top = followerY + 'px';

        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Enlarge custom cursor on interactable elements
    hoverLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
            document.body.classList.add('cursor-hover');
        });
        link.addEventListener('mouseleave', () => {
            document.body.classList.remove('cursor-hover');
        });
    });

    // ==========================================
    // 3. Intersection Observer for Scroll Animations
    // ==========================================
    const reveals = document.querySelectorAll('.reveal');
    const observerOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            entry.target.classList.add("active");

            // Trigger counter animation if split section comes into view
            if (entry.target.classList.contains('split-section')) {
                animateCounters();
            }

            observer.unobserve(entry.target);
        });
    }, observerOptions);

    reveals.forEach(reveal => {
        sectionObserver.observe(reveal);
    });

    // ==========================================
    // 4. Counter Animation logic
    // ==========================================
    let countersAnimated = false;
    function animateCounters() {
        if (countersAnimated) return;
        countersAnimated = true;

        const counters = document.querySelectorAll('.counter');
        const animationSpeed = 250;

        counters.forEach(counter => {
            const updateCount = () => {
                const target = +counter.getAttribute('data-target');
                const count = +counter.innerText;
                const increment = target / animationSpeed;

                if (count < target) {
                    counter.innerText = Math.ceil(count + increment);
                    setTimeout(updateCount, 15);
                } else {
                    counter.innerText = target;
                }
            };
            updateCount();
        });
    }

    // ==========================================
    // 5. Hero Floating Elements (Parallax + subtle sway)
    // ==========================================
    const floatItems = document.querySelectorAll('.float-item');

    // Randomize initial positions of the floating text/shapes
    floatItems.forEach((item, index) => {
        item.style.top = `${Math.random() * 70 + 15}%`;
        item.style.left = `${Math.random() * 80 + 10}%`;
    });

    // React to mouse movement for parallax depth effect
    window.addEventListener('mousemove', (e) => {
        const xOffset = (window.innerWidth / 2 - e.pageX) / 40;
        const yOffset = (window.innerHeight / 2 - e.pageY) / 40;

        floatItems.forEach((target, index) => {
            const depth = index * 0.8 + 1; // Different depths per item
            // Add slight continuous floating by using simple transform
            target.style.transform = `translate(${xOffset * depth}px, ${yOffset * depth}px)`;
        });
    });

    // ==========================================
    // 6. Anti-Gravity / Google Gravity Drop Physics
    // ==========================================
    let gravityActive = false;
    let physicsObjects = [];
    const heroSection = document.getElementById('hero');
    // Select all elements to drop on click
    const dropTargets = document.querySelectorAll('.float-item, .gravity-tgt');

    // Synthesize a subtle thud sound via Web Audio API 
    // Creating it dynamically on interaction avoids browser restrictions
    const playThud = () => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(120, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

            gainNode.gain.setValueAtTime(0.6, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.3);
        } catch (e) {
            console.warn("Web Audio API not supported or permitted yet.");
        }
    };

    heroSection.addEventListener('click', (e) => {
        if (gravityActive) return; // Only execute once
        gravityActive = true;

        playThud();

        // Prepare each target element for custom JS physics
        dropTargets.forEach(el => {
            // Get exact current on-screen coords to prevent visual jumping
            const rect = el.getBoundingClientRect();

            physicsObjects.push({
                element: el,
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height,
                vx: (Math.random() - 0.5) * 12, // explosive sideways momentum
                vy: (Math.random() * -8) - 4, // jump up before falling
                rotation: 0,
                vRot: (Math.random() - 0.5) * 10
            });
        });

        // Detach them from DOM flow and strictly use Javascript positioning
        physicsObjects.forEach(obj => {
            // Unbind CSS transitions to allow raw frame-by-frame JS updating
            obj.element.style.transition = 'none';
            obj.element.classList.remove('hover-link');

            obj.element.style.position = 'fixed'; // Fixed instead of absolute keeps them in the viewport
            obj.element.style.left = obj.x + 'px';
            obj.element.style.top = obj.y + 'px';
            obj.element.style.transform = 'none';
            obj.element.style.margin = '0';
        });

        // Start Physics Frame Loop
        requestAnimationFrame(physicsLoop);
    });

    const gravityForce = 0.8;
    const groundFriction = 0.8;
    const bounceFactor = -0.55;

    function physicsLoop() {
        let isMoving = false;

        // Define floor boundary based on current viewport
        const floor = window.innerHeight;

        physicsObjects.forEach(obj => {
            // Apply gravity to vertical velocity
            obj.vy += gravityForce;

            // Apply velocities to positions
            obj.x += obj.vx;
            obj.y += obj.vy;
            obj.rotation += obj.vRot;

            // Simple floor collision bounds
            if (obj.y + obj.height > floor) {
                obj.y = floor - obj.height; // Snap to floor
                obj.vy *= bounceFactor; // Reverse Y velocity (Bounce)
                obj.vx *= groundFriction; // Add friction to X
                obj.vRot *= groundFriction; // Add friction to rotation

                // Play tiny thud on hard bounces occasionally
                if (Math.abs(obj.vy) > 3 && Math.random() > 0.8) playThud();
            }

            // Wall collisions (Left and Right view bounds)
            if (obj.x < 0) {
                obj.x = 0;
                obj.vx *= -groundFriction;
                obj.vRot *= -1;
            } else if (obj.x + obj.width > window.innerWidth) {
                obj.x = window.innerWidth - obj.width;
                obj.vx *= -groundFriction;
                obj.vRot *= -1;
            }

            // Sync visual element layer
            obj.element.style.left = obj.x + 'px';
            obj.element.style.top = obj.y + 'px';
            obj.element.style.transform = `rotate(${obj.rotation}deg)`;

            // Check if element is still active/moving
            if (Math.abs(obj.vy) > 0.2 || Math.abs(obj.vx) > 0.2 || obj.y < floor - obj.height - 2) {
                isMoving = true;
            }
        });

        if (isMoving) {
            requestAnimationFrame(physicsLoop);
        } else {
            // Once movement stops, slightly fade out the settled objects
            physicsObjects.forEach(obj => {
                obj.element.style.opacity = '0.7';
                obj.element.style.transition = 'opacity 1s ease';
            });
        }
    }
});
