import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import uniqueId from 'lodash/uniqueId.js';
import watch from './watch.js';
import resources from './locales/index.js';
import parser from './parser.js';

const updatePosts = (feedsData, statePosts, stateFeeds) => {
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
    const createIdPosts = newPosts.map((item) => ({ ...item, feedId, id: uniqueId() }));
    const allPosts = [...createIdPosts, ...oldPosts].slice(0, oldPosts.length);

    resultPosts.unshift(...allPosts);
  });
  return resultPosts;
};

export default function app() {
  const elements = {
    emptyContainer: document.querySelector('.container-xxl .row'),
    modal: document.querySelector('.modal'),
    input: document.querySelector('#url-input'),
    feedback: document.querySelector('.feedback'),
    form: document.querySelector('.rss-form'),
  };

  const initState = {
    formState: 'filling',
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
    document.querySelector('.display-3').textContent = i18n.t('title');
    document.querySelector('.lead').textContent = i18n.t('tagline');
    document.querySelector('.form-floating label').textContent = i18n.t('label');
    document.querySelector('button[aria-label="add"]').textContent = i18n.t('btnSubmit');
    document.querySelector('.text-muted').textContent = i18n.t('inputExample');
    elements.input.setAttribute('placeholder', i18n.t('placeholder'));

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

    function updatePostsEveryFiveSeconds() {
      const getRssFeeds = watchedState.feeds.map((feed) => axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(feed)}`));

      Promise.all(getRssFeeds)
        .then((feedsData) => {
          const resultPosts = updatePosts(feedsData, watchedState.posts, watchedState.feeds);

          watchedState.formState = 'processing';
          watchedState.posts = resultPosts;

          if (resultPosts.length !== 0) {
            watchedState.formState = 'finished';
          }
        })
        .catch((error) => {
          console.error(error);
        })
        .finally(() => {
          setTimeout(updatePostsEveryFiveSeconds, 5000);
        });
    }
    updatePostsEveryFiveSeconds();

    elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const inputValue = formData.get('url');
      const currentSchema = schema.notOneOf(watchedState.feeds);
      currentSchema.validate(inputValue, { abortEarly: false })
        .then(() => {
          watchedState.feeds.push(inputValue);
          axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(inputValue)}`)
            .then((res) => {
              elements.input.value = '';
              watchedState.formState = 'processing';
              const essence = parser(res.data.contents);
              const [feed, posts] = essence;
              const feedId = uniqueId();
              feed.feedId = feedId;
              const createIdPosts = posts.map((item) => ({ ...item, feedId, id: uniqueId() }));
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

    elements.emptyContainer.addEventListener('click', (e) => {
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
