import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import _ from 'lodash';
import setLocale from './setLocale.js';
import validation from './validation.js';
import watch from './watch.js';
import resources from './locales/index.js';
import parser from './parser.js';

const upPosts = (feedsData, statePosts, stateFeeds) => {
  const resultFeeds = [];
  const resultPosts = [];

  feedsData.forEach((res) => {
    const { contents } = res.data;
    const [feed, posts] = parser(contents);

    const postsTitle = posts.map(({ title }) => title);
    const oldContentPosts = statePosts.map(({ title }) => title);
    const newPostsTitle = postsTitle.filter((post) => !oldContentPosts.includes(post));
    const newPosts = posts.filter(({ title }) => newPostsTitle.includes(title));

    const oldFeed = stateFeeds.find(({ title }) => title === feed.title);
    const { feedId } = oldFeed;
    feed.feedId = feedId;

    const oldPosts = statePosts.filter((post) => post.feedId === feedId);
    const createIdPosts = newPosts.map((item) => ({ ...item, feedId, id: _.uniqueId() }));
    const allPosts = [...createIdPosts, ...oldPosts].slice(0, oldPosts.length);

    resultFeeds.unshift(feed);
    resultPosts.unshift(...allPosts);
  });
  return [resultFeeds, resultPosts];
};

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
    watchedFeeds: [],
    feeds: [],
    posts: [],
    uiState: {
      modal: [],
    },
    errors: {
      validateProcess: null,
      parsingProcess: null,
      networkProcess: null,
    },
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

      Promise.all(getRssFeeds)
        .then((feedsData) => {
          const [resFeeds, resPosts] = upPosts(feedsData, watchedState.posts, watchedState.feeds);

          watchedState.formState = 'processing';
          watchedState.feeds = resFeeds;
          watchedState.posts = resPosts;

          if (resPosts.length !== 0) {
            watchedState.formState = 'finished';
          }
        })
        .catch((error) => {
          console.error(error);
        });

      setTimeout(checkRss, 5000);
    }
    checkRss();

    elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const inputValue = formData.get('url');
      const currentSchema = schema.notOneOf(watchedState.watchedFeeds);
      validation(currentSchema, inputValue)
        .then(() => {
          watchedState.watchedFeeds.push(inputValue);
          axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(inputValue)}`)
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
              watchedState.formState = 'finished';
            })
            .catch((err) => {
              if (err.isParser) {
                watchedState.errors.parsingProcess = null;
                watchedState.errors.parsingProcess = 'errors.parser';
              } else {
                watchedState.errors.networkProcess = null;
                watchedState.errors.networkProcess = 'errors.network';
              }
            });
        })
        .catch((error) => {
          watchedState.errors.validateProcess = null;
          watchedState.errors.validateProcess = error.message;
        });
    });

    elements.sections.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-bs-toggle')) {
        e.preventDefault();
      }
      const dataId = e.target.getAttribute('data-id');
      if (dataId && !watchedState.uiState.modal.includes(dataId)) {
        watchedState.uiState.modal.push(dataId);
      }
    });
  });
}
