import onChange from 'on-change';

export default (elements, i18n, state) => onChange(state, (path, value) => {
  const { main, input, p } = elements;

  const body = document.querySelector('body');
  body.textContent = '';
  body.prepend(main);

  if (path === 'formState') {
    if (value === 'finished') {
      if (input.classList.contains('is-invalid')) {
        input.classList.remove('is-invalid');
      }
      p.classList.remove('text-danger');
      input.classList.add('is-valid');
      input.value = '';
      p.classList.add('text-success');
      p.textContent = i18n.t('successful');
    }
  }

  if (path === 'error') {
    if (input.classList.contains('is-valid')) {
      input.classList.remove('is-valid');
      p.classList.remove('text-success');
    }
    input.classList.add('is-invalid');
    p.classList.add('text-danger');
    p.textContent = i18n.t(state.error);
  }
});