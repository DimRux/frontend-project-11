export default (url) => {
  const urlResult = new URL('/get', 'https://allorigins.hexlet.app');
  urlResult.searchParams.set('url', url);
  urlResult.searchParams.set('disableCache', 'true');
  return urlResult.toString();
};
