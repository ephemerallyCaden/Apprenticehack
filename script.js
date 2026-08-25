document.documentElement.classList.add('js');

(() => {
  const targets = document.querySelectorAll('.js-reveal');
  if (!targets.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0, rootMargin: '0px 0px -12% 0px' }
  );

  targets.forEach((el) => observer.observe(el));

  // Safety net for the observer missing something the visitor can already see
  // (very tall elements at high zoom). Anything still below the fold keeps its
  // entrance, so the team cards do not flip before they are scrolled to.
  setTimeout(() => {
    targets.forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) {
        el.classList.add('is-visible');
      }
    });
  }, 3000);
})();

/* Badge cards tilt toward the pointer, the way you angle a real ID card
   to read it. Pointer-driven only: no tilt for touch or reduced motion. */
(() => {
  const cards = document.querySelectorAll('[data-tilt]');
  if (!cards.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const MAX_DEG = 10;

  cards.forEach((card) => {
    let frame = null;

    card.addEventListener('pointerenter', () => {
      card.classList.add('is-tilting');
    });

    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const dx = (e.clientX - rect.left) / rect.width - 0.5;
      const dy = (e.clientY - rect.top) / rect.height - 0.5;

      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Perspective comes from .team__card, so it must not be repeated here.
        card.style.transform =
          `rotateY(${(dx * MAX_DEG * 2).toFixed(2)}deg) ` +
          `rotateX(${(-dy * MAX_DEG * 2).toFixed(2)}deg) translateZ(8px)`;
      });
    });

    card.addEventListener('pointerleave', () => {
      if (frame) cancelAnimationFrame(frame);
      frame = null;
      // Drop the class first so the transition carries it home.
      card.classList.remove('is-tilting');
      card.style.transform = '';
    });
  });
})();

(() => {
  const form = document.getElementById('register-form');
  if (!form) return;

  // Apps Script Web App endpoint. Appends one row per submission to the
  // registrations Google Sheet. See PRODUCT.md / the deploy notes for setup.
  const REGISTER_ENDPOINT = 'https://script.google.com/macros/s/AKfycbw8U2GNotKDvsbQBN4_PzjKM42eS7KzmVfT4Rf3AjPuHa-K-HqM-Ov-Xhp8qP_HeD0F/exec';

  const summary = document.getElementById('form-error');
  const summaryList = document.getElementById('form-error-list');
  const submitError = document.getElementById('form-submit-error');
  const success = document.getElementById('form-success');
  const badgeFields = document.getElementById('success-badge-fields');
  const editBtn = document.getElementById('success-edit');
  const submitBtn = form.querySelector('button[type="submit"]');
  const submitBtnDefaultText = submitBtn ? submitBtn.textContent : '';

  const text = (v) => String(v || '').trim();

  const FIELDS = [
    {
      name: 'name',
      label: 'your name',
      message: 'Tell us what to call you.',
      valid: (d) => text(d.get('name')) !== '',
    },
    {
      name: 'email',
      label: 'your email',
      message: 'We need an email address to send you the details.',
      valid: (d) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(d.get('email'))),
    },
    {
      name: 'company',
      label: 'your company or university',
      message: 'Add where you work or study, or what you are working towards.',
      valid: (d) => text(d.get('company')) !== '',
    },
    {
      name: 'route',
      label: 'whether you are an apprentice or a student',
      message: 'Pick the one that fits you best.',
      valid: (d) => Boolean(d.get('route')),
    },
    {
      name: 'level',
      label: 'where you are on the journey',
      message: 'Any answer is fine. Pick the closest one.',
      valid: (d) => Boolean(d.get('level')),
    },
  ];

  const controlsFor = (name) => form.querySelectorAll(`[name="${name}"]`);
  const firstControl = (name) => form.querySelector(`[name="${name}"]`);
  const errorEl = (name) => document.getElementById(`err-${name}`);

  function clearField(name) {
    const el = errorEl(name);
    if (el) el.hidden = true;
    controlsFor(name).forEach((c) => c.removeAttribute('aria-invalid'));
  }

  function markField(field) {
    const el = errorEl(field.name);
    if (el) {
      el.textContent = field.message;
      el.hidden = false;
    }
    controlsFor(field.name).forEach((c) => c.setAttribute('aria-invalid', 'true'));
  }

  function addBadgeField(label, value, accent) {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    if (accent) dd.classList.add('is-accent');
    badgeFields.append(dt, dd);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const invalid = FIELDS.filter((f) => !f.valid(data));

    FIELDS.forEach((f) => clearField(f.name));
    submitError.hidden = true;

    if (invalid.length) {
      invalid.forEach(markField);

      summaryList.innerHTML = '';
      invalid.forEach((f) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${firstControl(f.name).id || f.name}`;
        a.textContent = `Add ${f.label}`;
        a.addEventListener('click', (ev) => {
          ev.preventDefault();
          firstControl(f.name).focus();
        });
        li.appendChild(a);
        summaryList.appendChild(li);
      });

      summary.hidden = false;
      // Send the user to the problem, not to the message about the problem.
      firstControl(invalid[0].name).focus();
      return;
    }

    summary.hidden = true;

    // Honeypot: real visitors never see or fill this field. If it has a
    // value, quietly treat the submission as accepted without sending it on.
    if (text(data.get('hp-field')) !== '') {
      showSuccess(data);
      return;
    }

    const payload = {
      name: text(data.get('name')),
      email: text(data.get('email')),
      company: text(data.get('company')),
      route: text(data.get('route')),
      level: text(data.get('level')),
      interests: data.getAll('interests'),
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
    }

    try {
      const res = await fetch(REGISTER_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok || result.result !== 'success') {
        throw new Error(result.message || 'Unknown error');
      }
      showSuccess(data);
    } catch (err) {
      submitError.hidden = false;
      submitError.focus();
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtnDefaultText;
      }
    }
  });

  function showSuccess(data) {
    const routeLabel = form.querySelector('input[name="route"]:checked')
      .closest('.choice').querySelector('.choice__title').textContent;
    const levelLabel = form.querySelector('input[name="level"]:checked')
      .closest('.choice').querySelector('.choice__title').textContent;

    badgeFields.innerHTML = '';
    addBadgeField('Name', text(data.get('name')));
    addBadgeField('Company', text(data.get('company')), true);
    addBadgeField('Status', `${routeLabel} · ${levelLabel}`);

    form.hidden = true;
    success.hidden = false;
    success.focus();
  }

  // Clear only the field the user is actually repairing.
  form.addEventListener('input', (e) => {
    const name = e.target.name;
    if (!name) return;
    clearField(name);
    if (!summary.hidden && FIELDS.every((f) => f.valid(new FormData(form)))) {
      summary.hidden = true;
    }
  });

  form.addEventListener('change', (e) => {
    if (e.target.name) clearField(e.target.name);
  });

  editBtn.addEventListener('click', () => {
    success.hidden = true;
    form.hidden = false;
    firstControl('name').focus();
  });
})();
