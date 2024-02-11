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

const renderPosts = (state, i18n) => {
  if (state.posts.length === 0) return;
  const posts = document.querySelector('.posts');
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

const renderFeeds = (state, i18n) => {
  if (state.feeds.length === 0) return;
  const feeds = document.querySelector('.feeds');
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

const updateModalContent = (modal, state, id, i18n) => {
  if (id === null) {
    const nowModal = document.querySelector('.modal');
    nowModal.textContent = '';
    nowModal.append(modal);
  }
  const postByBtn = state.posts.filter((post) => post.id === id)[0];
  const modalTitle = modal.querySelector('.modal-title');
  modalTitle.textContent = postByBtn.title;
  const modalBody = modal.querySelector('.modal-body');
  modalBody.textContent = postByBtn.description;
  const fullArticle = modal.querySelector('.full-article');
  fullArticle.setAttribute('href', `${postByBtn.link}`);
  fullArticle.textContent = i18n.t('fullArticle');
  const btnCloseModal = modal.querySelector('.btn-secondary');
  btnCloseModal.textContent = i18n.t('modalBtnClose');
};

const renderErrorFeedback = (input, feedback) => {
  if (input.classList.contains('is-valid')) {
    input.classList.remove('is-valid');
    feedback.classList.remove('text-success');
  }
  input.classList.add('is-invalid');
  feedback.classList.add('text-danger');
};

const renderSuccessfulFeedback = (input, feedback) => {
  input.classList.remove('is-invalid');
  feedback.classList.remove('text-danger');
  input.classList.add('is-valid');
  feedback.classList.add('text-success');
};

export default (elements, i18n, state) => onChange(state, (path, value) => {
  const {
    emptyContainer,
    input,
    feedback,
    modal,
  } = elements;

  const container = document.querySelector('.container-xxl');
  container.textContent = '';
  container.append(emptyContainer);

  switch (path) {
    case 'formState.status':
      if (value === 'finished') {
        renderSuccessfulFeedback(input, feedback);
        feedback.textContent = i18n.t('successful');
      }
      break;

    case 'uiState.activePostId':
      updateModalContent(modal, state, state.uiState.activePostId, i18n);
      updateLinkStyle(state, emptyContainer, state.uiState.activePostId);
      break;

    case 'posts':
      renderPosts(state, i18n);
      break;

    case 'feeds':
      renderFeeds(state, i18n);
      break;

    case 'formState.validateError':
      renderErrorFeedback(input, feedback);
      feedback.textContent = i18n.t(state.formState.validateError);
      break;

    case 'rssDownloader.errors.parsingProcess':
      renderErrorFeedback(input, feedback);
      feedback.textContent = i18n.t(state.rssDownloader.errors.parsingProcess);
      break;

    case 'rssDownloader.errors.networkProcess':
      renderErrorFeedback(input, feedback);
      feedback.textContent = i18n.t(state.rssDownloader.errors.networkProcess);
      break;

    default:
      break;
  }
});
