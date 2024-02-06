import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import _ from 'lodash';
import setLocale from './setLocale.js';
import validation from './validation.js';
import watch from './watch.js';
import resources from './locales/index.js';
import fetch from './fetch.js';
import parser from './parser.js';

export default function app() {
  const elements = {
    sections: document.querySelector('.container-xxl .row'),
    modal: document.querySelector('.modal'),
    input: document.querySelector('#url-input'),
    feedback: document.querySelector('.feedback'),
    form: document.querySelector('.rss-form'),
    title: document.querySelector('.display-3'),
    tagline: document.querySelector('.lead'),
    label: document.querySelector('.form-floating label'),
    btnSubmit: document.querySelector('.btn-lg'),
    inputExample: document.querySelector('.text-muted'),
  };

  const initState = {
    formState: 'filling',
    formIsValid: true,
    watchedFeeds: [],
    feeds: [],
    posts: [],
    uiState: {
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
    elements.label.textContent = i18n.t('label');
    elements.btnSubmit.textContent = i18n.t('btnSubmit');
    elements.inputExample.textContent = i18n.t('inputExample');
    elements.input.setAttribute('placeholder', i18n.t('placeholder'));

    const watchedState = watch(elements, i18n, initState);

    yup.setLocale(setLocale);

    const schema = yup.string().url();

    function checkRss() {
      const getRssFeeds = watchedState.watchedFeeds.map((feed) => axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(feed)}`));
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
      const currentSchema = schema.notOneOf(watchedState.watchedFeeds);
      validation(currentSchema, elements.input.value)
        .then(() => {
          watchedState.watchedFeeds.push(elements.input.value);
          fetch(elements.input.value)
            .then((res) => {
              elements.input.value = '';
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

    elements.sections.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn')) {
        e.preventDefault();
      }
      const dataId = e.target.getAttribute('data-id');
      if (dataId && !watchedState.uiState.modal.includes(dataId)) {
        watchedState.uiState.modal.push(dataId);
      }
    });
  });
}
