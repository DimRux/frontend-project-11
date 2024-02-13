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
    formState: {
      status: '',
      validateError: null,
    },
    watchedUrl: [],
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
      const getRssFeeds = watchedState.watchedUrl.map((feed) => axios.get(getProxiedUrl(feed)));

      Promise.all(getRssFeeds)
        .then((feedsData) => {
          const resultPosts = updatePosts(feedsData, watchedState.posts, watchedState.feeds);
          watchedState.posts = resultPosts;
        })
        .catch((error) => {
          console.error(error);
        })
        .finally(() => {
          setTimeout(updatePostsEveryFiveSeconds, 5000);
        });
    }

    elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const inputValue = formData.get('url');
      const currentSchema = schema.notOneOf(watchedState.watchedUrl);
      currentSchema.validate(inputValue, { abortEarly: false })
        .then(() => {
          watchedState.watchedUrl.push(inputValue);
          axios.get(getProxiedUrl(inputValue))
            .then((res) => {
              elements.input.value = '';
              watchedState.formState.status = 'processing';
              const essence = parser(res.data.contents);
              const [feed, posts] = essence;
              const feedId = uniqueId();
              feed.feedId = feedId;
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
            })
            .finally(() => updatePostsEveryFiveSeconds());
        })
        .catch((error) => {
          watchedState.formState.validateError = null;
          watchedState.formState.validateError = error.message;
        });
    });

    elements.emptyContainer.addEventListener('click', (e) => {
      const dataId = e.target.getAttribute('data-id');
      if (!dataId) return;
      if (e.target.hasAttribute('data-bs-toggle')) {
        e.preventDefault();
        watchedState.uiState.activePostId = dataId;
      }
      watchedState.uiState.activePostId = dataId;
      if (dataId && !watchedState.uiState.watchedPosts.includes(dataId)) {
        watchedState.uiState.watchedPosts.push(dataId);
      }
    });

    const buttons = elements.emptyContainer.querySelectorAll('button');
    buttons.forEach((btn) => {
      btn.addEventListener('hidden.bs.modal', () => {
        watchedState.uiState.activePostId = null;
      });
    });
  });
}
