import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import _ from 'lodash';
import view from './view.js';
import resources from './resources.js';
import parser from './parser.js';

export default () => {
  const elements = {
    main: document.querySelector('main'),
    input: document.querySelector('input'),
    p: document.querySelector('.feedback'),
    form: document.querySelector('form'),
    title: document.querySelector('h1'),
    tagline: document.querySelector('.lead'),
    fillInput: document.querySelector('label'),
    btnSubmit: document.querySelector('button'),
    inputExample: document.querySelector('.text-muted'),
  };

  const initState = {
    formState: 'filling',
    input: '',
    feeds: [],
    posts: [],
    error: null,
  };

  const i18n = i18next.createInstance();
  i18n.init({
    lng: 'ru',
    debug: false,
    resources,
  }).then(() => {
    elements.title.textContent = i18n.t('title');
    elements.tagline.textContent = i18n.t('tagline');
    elements.fillInput.textContent = i18n.t('fillInput');
    elements.btnSubmit.textContent = i18n.t('btnSubmit');
    elements.inputExample.textContent = i18n.t('inputExample');
    elements.input.setAttribute('placeholder', i18n.t('placeholder'));

    const watchedState = view(elements, i18n, initState);

    elements.input.addEventListener('input', (e) => {
      e.preventDefault();
      watchedState.input = e.target.value;
      e.target.focus();
    });

    yup.setLocale({
      string: {
        url: 'errors.validation.url',
      },
      mixed: {
        notOneOf: 'errors.validation.notOneOf',
      },
    });

    const schema = yup.string().url();

    elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const currentSchema = schema.notOneOf(watchedState.feeds);
      currentSchema.validate(watchedState.input, { abortEarly: false })
        .then(() => {
          watchedState.feeds.push(watchedState.input);
          axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(watchedState.input)}`)
            .then((res) => {
              const essence = parser(res.data.contents);
              const [feed, posts] = essence;
              const feedId = _.uniqueId();
              feed.feedId = feedId;
              const createIdPosts = posts.map((item) => ({ ...item, feedId, id: _.uniqueId() }));
              const newFeed = [feed, ...watchedState.feeds];
              const newPosts = [...createIdPosts, ...watchedState.posts];
              watchedState.feeds = newFeed;
              watchedState.posts = newPosts;
              watchedState.formState = 'finished';
            })
            .catch((err) => {
              if (err.message === 'parser') {
                watchedState.error = 'errors.parser';
              } else watchedState.error = 'errors.network';
            });
        })
        .catch((error) => {
          watchedState.formState = 'failed';
          watchedState.error = error.message;
        });
    });
  });
};
