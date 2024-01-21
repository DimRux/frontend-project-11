import * as yup from 'yup';
import view from './view.js';

export default () => {
  const elements = {
    main: document.querySelector('main'),
    input: document.querySelector('input'),
    p: document.querySelector('.feedback'),
    form: document.querySelector('form'),
  };
  const initState = {
    formState: 'filling',
    input: '',
    feed: '',
    error: null,
  };

  const watchedState = view(elements, initState);

  elements.input.addEventListener('input', (e) => {
    e.preventDefault();
    watchedState.input = e.target.value;
    e.target.focus();
  });

  const schema = yup.string().url('Ссылка должна быть валидным URL');

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const currentSchema = schema.notOneOf([watchedState.feed], 'RSS уже существует');
    currentSchema.validate(watchedState.input)
      .then(() => {
        watchedState.feed = watchedState.input;
        watchedState.formState = 'finished';
      })
      .catch((error) => {
        watchedState.formState = 'failed';
        watchedState.error = error.errors;
      });
  });
};
