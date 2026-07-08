// Burger menu (all pages)
const burgerBtn = document.getElementById('burgerBtn');
const navLinks = document.getElementById('navLinks');

burgerBtn.addEventListener('click', () => {
    burgerBtn.classList.toggle('open');
    navLinks.classList.toggle('open');
});

// Close the menu after picking a link
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        burgerBtn.classList.remove('open');
        navLinks.classList.remove('open');
    });
});

// Projects page: slideshow (only runs if the slideshow markup exists)
const projectSlides = document.querySelectorAll('.project');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pagerCurrent = document.getElementById('pagerCurrent');

if (projectSlides.length && prevBtn && nextBtn) {
    let currentIndex = 0;

    // Shows the slide at `index`, hides the rest, updates the counter
    function showProject(index) {
        projectSlides.forEach((project, i) => {
            project.classList.toggle('active', i === index);
        });

        if (pagerCurrent) {
            pagerCurrent.textContent = String(index + 1).padStart(2, '0');
        }

        currentIndex = index;
    }

    prevBtn.addEventListener('click', () => {
        const newIndex = (currentIndex - 1 + projectSlides.length) % projectSlides.length;
        showProject(newIndex);
    });

    nextBtn.addEventListener('click', () => {
        const newIndex = (currentIndex + 1) % projectSlides.length;
        showProject(newIndex);
    });
}

// Contact page: form validation (only runs if the form exists)
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    const fields = {
        name: { input: document.getElementById('name'), valid: false },
        email: { input: document.getElementById('email'), valid: false },
        subject: { input: document.getElementById('subject'), valid: false },
        message: { input: document.getElementById('message'), valid: false },
    };

    // Checks one field, shows/hides its error message, returns whether it's valid
    function validateField(key) {
        const field = fields[key];
        const value = field.input.value.trim();
        let valid = value.length > 0;

        if (key === 'email' && valid) {
            valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        }

        field.valid = valid;

        const wrapper = field.input.closest('.form-field');
        const errorEl = document.getElementById(key + 'Error');

        if (wrapper) {
            wrapper.classList.toggle('invalid', !valid);
        }

        if (errorEl) {
            errorEl.textContent = valid
                ? ''
                : key === 'email'
                    ? 'Please enter a valid email.'
                    : 'This field is required.';
        }

        return valid;
    }

    // Live validation as the user types
    Object.keys(fields).forEach((key) => {
        fields[key].input.addEventListener('input', () => validateField(key));
    });

    const submitBtn = document.getElementById('submitBtn');
    const formStatus = document.getElementById('formStatus');

    // Shows a success/error message under the button
    function showStatus(message, type) {
        if (!formStatus) return;
        formStatus.textContent = message;
        formStatus.classList.remove('success', 'error');
        formStatus.classList.add('visible', type);
    }

    // Submit is handled with fetch() so the page never leaves/reloads —
    // Formspree accepts a normal POST and returns JSON when asked via the
    // Accept header. See the form's `action` attribute in contact.html for
    // where to plug in a Formspree form ID.
    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const allValid = Object.keys(fields)
            .map((key) => validateField(key))
            .every(Boolean);

        if (!allValid) {
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
        }
        showStatus('Sending…', 'success');

        try {
            const response = await fetch(contactForm.action, {
                method: contactForm.method || 'POST',
                body: new FormData(contactForm),
                headers: { Accept: 'application/json' },
            });

            if (response.ok) {
                showStatus("Thanks! Your message has been sent — I'll reply within a day.", 'success');
                contactForm.reset();
            } else {
                showStatus('Something went wrong sending your message. Please try emailing me directly.', 'error');
            }
        } catch (error) {
            showStatus('Network error — please try again or email me directly.', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
            }
        }
    });
}
