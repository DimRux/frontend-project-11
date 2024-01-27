import onChange from 'on-change';

export default (elements, i18n, state) => onChange(state, (path, value) => {
  const { main, input, p } = elements;

  const body = document.querySelector('body');
  body.textContent = '';
  body.prepend(main);

  if (path === 'formState') {
    if (value === 'finished') {
      if (input.classList.contains('is-invalid')) {
        input.classList.remove('is-invalid');
      }
      p.classList.remove('text-danger');
      input.classList.add('is-valid');
      input.value = '';
      p.classList.add('text-success');
      p.textContent = i18n.t('successful');

      const posts = body.querySelector('.posts');
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
      state.posts.forEach((post) => {
        const li = document.createElement('li');
        li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-item-start', 'border-0', 'border-end-0');
        const a = document.createElement('a');
        a.classList.add('fw-bold');
        a.setAttribute('href', `${post.link}`);
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
        a.setAttribute('data-id', `${post.id}`);
        a.textContent = post.content;
        const btn = document.createElement('button');
        btn.classList.add('btn', 'btn-outline-primary', 'btn-sm');
        btn.setAttribute('type', 'button');
        btn.setAttribute('data-bs-toggle', 'modal');
        btn.setAttribute('data-bs-target', '#modal');
        btn.setAttribute('data-id', `${post.id}`);
        btn.textContent = i18n.t('btnPostWatch');
        li.append(a, btn);
        ulPosts.append(li);
      });
      divPostsHeader.append(divPostsHeaderTitle);
      divPosts.append(divPostsHeader, ulPosts);
      posts.append(divPosts);

      const feeds = body.querySelector('.feeds');
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
      state.feeds.forEach((feed) => {
        const li = document.createElement('li');
        li.classList.add('list-group-item', 'border-0', 'border-end-0');
        const titleFeed = document.createElement('h3');
        titleFeed.classList.add('h6', 'm-0');
        titleFeed.textContent = feed.title;
        const descriptionFeed = document.createElement('p');
        descriptionFeed.classList.add('m-0', 'small', 'text-black-50');
        descriptionFeed.textContent = feed.descriptionRss;
        li.append(titleFeed, descriptionFeed);
        ulFeeds.append(li);
      });
      divFeedsHeader.append(divFeedsHeaderTitle);
      divFeeds.append(divFeedsHeader, ulFeeds);
      feeds.append(divFeeds);
    }
  }

  if (path === 'error') {
    if (input.classList.contains('is-valid')) {
      input.classList.remove('is-valid');
      p.classList.remove('text-success');
    }
    input.classList.add('is-invalid');
    p.classList.add('text-danger');
    p.textContent = i18n.t(state.error);
  }
});
