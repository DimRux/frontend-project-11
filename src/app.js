import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import uniqueId from 'lodash/uniqueId.js';
import watch from './watch.js';
import resources from './locales/index.js';
import getProxiedUrl from './getProxiedUrl.js';
import parser from './parser.js';

const updatePosts = (feedsData, statePosts, stateFeeds) => {
  const resultPosts = [];
  feedsData.forEach((res) => {
    const { contents } = res.data;
    const [feed, posts] = parser(contents);

    const oldTitlesPosts = statePosts.map(({ title }) => title);
    const newPosts = posts.filter(({ title }) => !oldTitlesPosts.includes(title));

    const oldFeed = stateFeeds.find(({ title }) => title === feed.title);
    const { feedId } = oldFeed;

    const oldPosts = statePosts.filter((post) => post.feedId === feedId);
    const createIdPosts = newPosts.map((item) => ({ ...item, feedId, id: uniqueId() }));
    const allPosts = [...createIdPosts, ...oldPosts].slice(0, oldPosts.length);

    resultPosts.push(...allPosts);
  });
  return resultPosts;
};

const startPageTranslation = (elements, i18n) => {
  const {
    modal,
    input,
    title,
    tagline,
    label,
    btnSubmit,
    inputExample,
  } = elements;

  modal.querySelector('.full-article').textContent = i18n.t('fullArticle');
  modal.querySelector('.btn-secondary').textContent = i18n.t('modalBtnClose');
  title.textContent = i18n.t('title');
  tagline.textContent = i18n.t('tagline');
  label.textContent = i18n.t('label');
  btnSubmit.textContent = i18n.t('btnSubmit');
  inputExample.textContent = i18n.t('inputExample');
  input.setAttribute('placeholder', i18n.t('placeholder'));
};

export default function app() {
  const elements = {
    containerPosts: document.querySelector('.posts'),
    containerFeeds: document.querySelector('.feeds'),
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
    formState: {
      status: '',
      validateError: null,
    },
    feeds: [],
    posts: [],
    uiState: {
      watchedPosts: [],
      activePostId: null,
    },
    rssDownloader: {
      errors: {
        parsingProcess: null,
        networkProcess: null,
      },
    },
  };

  const i18n = i18next.createInstance();
  i18n.init({
    lng: 'ru',
    debug: false,
    resources,
  }).then(() => {
    startPageTranslation(elements, i18n);

    const watchedState = watch(elements, i18n, initState);

    yup.setLocale({
      string: {
        url: 'errors.validation.url',
      },
      mixed: {
        notOneOf: 'errors.validation.notOneOf',
      },
    });

    const schema = yup.string().url();

    function updatePostsInterval() {
      const getRssFeeds = watchedState.feeds
        .map((feed) => feed.feedUrl)
        .map((feed) => axios.get(getProxiedUrl(feed)));

      Promise.all(getRssFeeds)
        .then((feedsData) => {
          const resultPosts = updatePosts(feedsData, watchedState.posts, watchedState.feeds);
          watchedState.posts = resultPosts;
        })
        .catch((error) => {
          console.error(error);
        })
        .finally(() => {
          setTimeout(updatePostsInterval, 5000);
        });
    }
    updatePostsInterval();

    elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const inputValue = formData.get('url');
      const currentSchema = schema.notOneOf(watchedState.feeds.map((feed) => feed.feedUrl));
      currentSchema.validate(inputValue, { abortEarly: false })
        .then(() => {
          axios.get(getProxiedUrl(inputValue))
            .then((res) => {
              elements.input.value = '';
              watchedState.formState.status = 'processing';
              const essence = parser(res.data.contents);
              const [feed, posts] = essence;
              const feedId = uniqueId();
              feed.feedId = feedId;
              feed.feedUrl = inputValue;
              const createIdPosts = posts.map((item) => ({ ...item, feedId, id: uniqueId() }));
              const newFeed = [feed, ...watchedState.feeds];
              const newPosts = [...createIdPosts, ...watchedState.posts];
              watchedState.feeds = newFeed;
              watchedState.posts = newPosts;
              watchedState.formState.status = 'finished';
            })
            .catch((err) => {
              if (err.isParser) {
                watchedState.rssDownloader.errors.parsingProcess = null;
                watchedState.rssDownloader.errors.parsingProcess = 'errors.parser';
              } else {
                watchedState.rssDownloader.errors.networkProcess = null;
                watchedState.rssDownloader.errors.networkProcess = 'errors.network';
              }
            });
        })
        .catch((error) => {
          watchedState.formState.validateError = null;
          watchedState.formState.validateError = error.message;
        });
    });

    elements.containerPosts.addEventListener('click', (e) => {
      const dataId = e.target.getAttribute('data-id');
      if (!dataId) return;
      watchedState.uiState.activePostId = dataId;
      watchedState.uiState.watchedPosts.push(dataId);
    });
  });
}
