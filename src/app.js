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
  console.log('feed', watchedState.feed);
  const schema = yup.string().url('Ссылка должна быть валидным URL').notOneOf([watchedState.feed], 'RSS уже существует');

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    schema.validate(watchedState.input)
      .then(() => {
        const lastFeed = watchedState.input;
        watchedState.input = '';
        watchedState.feed = lastFeed;
        watchedState.formState = 'finished';
      })
      .catch((error) => {
        watchedState.formState = 'failed';
        console.log(error.errors);
        watchedState.error = error.errors;
      });
  });
};
