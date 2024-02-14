/* eslint-disable curly */
import onChange from 'on-change';

const createPostsLiElements = (state, i18n) => state.posts.map((post) => {
  const li = document.createElement('li');
  li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-item-start', 'border-0', 'border-end-0');
  const a = document.createElement('a');
  const visitedLinks = state.uiState.watchedPosts;
  if (visitedLinks.includes(post.id)) {
    a.classList.add('fw-normal', 'link-secondary');
  } else a.classList.add('fw-bold');
  a.setAttribute('href', `${post.link}`);
  a.setAttribute('target', '_blank');
  a.setAttribute('rel', 'noopener noreferrer');
  a.dataset.id = post.id;
  a.textContent = post.title;
  const btn = document.createElement('button');
  btn.classList.add('btn', 'btn-outline-primary', 'btn-sm');
  btn.setAttribute('type', 'button');
  btn.dataset.bsToggle = 'modal';
  btn.dataset.bsTarget = '#modal';
  btn.dataset.id = post.id;
  btn.textContent = i18n.t('btnPostWatch');
  li.append(a, btn);
  return li;
});

const renderPosts = (state, i18n, containerPosts) => {
  if (state.posts.length === 0) return;
  const posts = containerPosts;
  posts.textContent = '';
  const divPosts = document.createElement('div');
  divPosts.classList.add('card', 'border-0');
  const divPostsHeader = document.createElement('div');
  divPostsHeader.classList.add('card-body');
  const divPostsHeaderTitle = document.createElement('h2');
  divPostsHeaderTitle.classList.add('card-title', 'h4');
  divPostsHeaderTitle.textContent = i18n.t('posts');
  const ulPosts = document.createElement('ul');
  ulPosts.classList.add('list-group', 'border-0', 'rounded-0');
  const liElements = createPostsLiElements(state, i18n);
  ulPosts.append(...liElements);
  divPostsHeader.append(divPostsHeaderTitle);
  divPosts.append(divPostsHeader, ulPosts);
  posts.append(divPosts);
};

const createFeedsLiElements = (feeds) => feeds.map((feed) => {
  const li = document.createElement('li');
  li.classList.add('list-group-item', 'border-0', 'border-end-0');
  const titleFeed = document.createElement('h3');
  titleFeed.classList.add('h6', 'm-0');
  titleFeed.textContent = feed.title;
  const descriptionFeed = document.createElement('feedback');
  descriptionFeed.classList.add('m-0', 'small', 'text-black-50');
  descriptionFeed.textContent = feed.descriptionRss;
  li.append(titleFeed, descriptionFeed);
  return li;
});

const renderFeeds = (state, i18n, containerFeeds) => {
  if (state.feeds.length === 0) return;
  const feeds = containerFeeds;
  feeds.textContent = '';
  const divFeeds = document.createElement('div');
  divFeeds.classList.add('card', 'border-0');
  const divFeedsHeader = document.createElement('div');
  divFeedsHeader.classList.add('card-body');
  const divFeedsHeaderTitle = document.createElement('h2');
  divFeedsHeaderTitle.classList.add('card-title', 'h4');
  divFeedsHeaderTitle.textContent = i18n.t('feeds');
  const ulFeeds = document.createElement('ul');
  ulFeeds.classList.add('list-group', 'border-0', 'rounded-0');
  const liElements = createFeedsLiElements(state.feeds);
  ulFeeds.append(...liElements);
  divFeedsHeader.append(divFeedsHeaderTitle);
  divFeeds.append(divFeedsHeader, ulFeeds);
  feeds.append(divFeeds);
};

const updateLinkStyle = (state, ulPosts, id) => {
  if (!state.uiState.watchedPosts.includes(id)) {
    const a = ulPosts.querySelector(`[data-id="${id}"]`);
    a.classList.remove('fw-bold');
    a.classList.add('fw-normal', 'link-secondary');
  }
};

const updateModalContent = (modal, state, id) => {
  const postByBtn = state.posts.filter((post) => post.id === id)[0];
  const modalTitle = modal.querySelector('.modal-title');
  modalTitle.textContent = postByBtn.title;
  const modalBody = modal.querySelector('.modal-body');
  modalBody.textContent = postByBtn.description;
  const fullArticle = modal.querySelector('.full-article');
  fullArticle.setAttribute('href', `${postByBtn.link}`);
};

const renderErrorFeedback = (input, elements, i18n, errorPath) => {
  const { feedback } = elements;
  if (input.classList.contains('is-valid')) {
    input.classList.remove('is-valid');
    feedback.classList.remove('text-success');
  }
  input.classList.add('is-invalid');
  feedback.classList.add('text-danger');
  feedback.textContent = i18n.t(errorPath);
};

const renderSuccessfulFeedback = (input, elements, i18n, successfulPath) => {
  const { feedback } = elements;
  input.classList.remove('is-invalid');
  feedback.classList.remove('text-danger');
  input.classList.add('is-valid');
  feedback.classList.add('text-success');
  feedback.textContent = i18n.t(successfulPath);
};

export default (elements, i18n, state) => onChange(state, (path, value) => {
  const {
    containerPosts,
    containerFeeds,
    input,
    modal,
  } = elements;

  const container = document.querySelector('.container-xxl .row');
  container.innerHTML = '';
  container.append(containerPosts, containerFeeds);

  switch (path) {
    case 'formState.status':
      if (value === 'finished') {
        renderSuccessfulFeedback(input, elements, i18n, 'successful');
      }
      break;

    case 'uiState.activePostId':
      updateModalContent(modal, state, state.uiState.activePostId);
      updateLinkStyle(state, containerPosts, state.uiState.activePostId);
      break;

    case 'posts':
      renderPosts(state, i18n, containerPosts);
      break;

    case 'feeds':
      renderFeeds(state, i18n, containerFeeds);
      break;

    case 'formState.validateError':
      renderErrorFeedback(input, elements, i18n, state.formState.validateError);
      break;

    case 'rssDownloader.errors.parsingProcess':
      renderErrorFeedback(input, elements, i18n, state.rssDownloader.errors.parsingProcess);
      break;

    case 'rssDownloader.errors.networkProcess':
      renderErrorFeedback(input, elements, i18n, state.rssDownloader.errors.networkProcess);
      break;

    default:
      break;
  }
});
