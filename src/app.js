import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import _ from 'lodash';
import view from './view.js';
import resources from './resources.js';
import parser from './parser.js';

export default function app() {
  const container = document.querySelector('.container-xxl');
  const containerfirstChild = container.querySelector('.row');
  const elements = {
    sections: containerfirstChild,
    modal: document.querySelector('.modal'),
    input: document.querySelector('input'),
    p: document.querySelector('.feedback'),
    form: document.querySelector('form'),
    title: document.querySelector('h1'),
    tagline: document.querySelector('.lead'),
    fillInput: document.querySelector('label'),
    btnSubmit: document.querySelector('.btn-lg'),
    inputExample: document.querySelector('.text-muted'),
  };

  const initState = {
    formState: 'filling',
    formIsValid: true,
    input: '',
    feedsUrl: [],
    feeds: [],
    posts: [],
    UIstate: {
      modal: [],
    },
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

    function checkRss() {
      const getRssFeeds = watchedState.feedsUrl.map((feed) => axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(feed)}`));
      const promises = Promise.all(getRssFeeds);
      promises
        .then((feeds) => {
          const resultFeeds = [];
          const resultPosts = [];
          feeds.forEach((res) => {
            const essence = parser(res.data.contents);
            const [feed, posts] = essence;
            const postsTitle = posts.map(({ content }) => content);
            const oldContentPosts = watchedState.posts.map(({ content }) => content);
            const newPostsTitle = postsTitle
              .filter((post) => !oldContentPosts.includes(post));
            const newPosts = posts.filter(({ content }) => newPostsTitle.includes(content));
            const oldFeed = watchedState.feeds.filter(({ title }) => title === feed.title);
            const { feedId } = oldFeed[0];
            feed.feedId = feedId;
            const oldPosts = watchedState.posts
              .filter((post) => post.feedId === feedId);
            const createIdPosts = newPosts.map((item) => ({ ...item, feedId, id: _.uniqueId() }));
            const allPosts = [...createIdPosts, ...oldPosts]
              .filter((item, index) => index < oldPosts.length);
            resultFeeds.unshift(feed);
            resultPosts.unshift(...allPosts);
          });
          watchedState.formState = 'processing';
          watchedState.feeds = resultFeeds;
          watchedState.posts = resultPosts;
          if (resultPosts.length !== 0) {
            watchedState.formState = 'finished';
          }
        });
      setTimeout(checkRss, 5000);
    }
    checkRss();

    elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const currentSchema = schema.notOneOf(watchedState.feedsUrl);
      currentSchema.validate(watchedState.input, { abortEarly: false })
        .then(() => {
          watchedState.feedsUrl.push(watchedState.input);
          elements.input.value = '';
          axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(watchedState.input)}`)
            .then((res) => {
              watchedState.formState = 'processing';
              const essence = parser(res.data.contents);
              const [feed, posts] = essence;
              const feedId = _.uniqueId();
              feed.feedId = feedId;
              const createIdPosts = posts.map((item) => ({ ...item, feedId, id: _.uniqueId() }));
              const newFeed = [feed, ...watchedState.feeds];
              const newPosts = [...createIdPosts, ...watchedState.posts];
              watchedState.feeds = newFeed;
              watchedState.posts = newPosts;
              watchedState.formIsValid = true;
              watchedState.formState = 'finished';
            })
            .catch((err) => {
              watchedState.formIsValid = false;
              if (err.message === 'parser') {
                watchedState.error = 'errors.parser';
              } else watchedState.error = 'errors.network';
            });
        })
        .catch((error) => {
          watchedState.formState = 'failed';
          watchedState.formIsValid = false;
          watchedState.error = error.message;
        });
    });
  });
}
