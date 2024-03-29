export default (data) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(data, 'text/xml');
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    const error = new Error(parserError.textContent);
    error.isParser = true;
    throw error;
  }

  const title = xmlDoc.querySelector('title').textContent;
  const descriptionRss = xmlDoc.querySelector('description').textContent;
  const feed = { title, descriptionRss };

  const items = Array.from(xmlDoc.querySelectorAll('item'))
    .map((item) => ({
      title: item.querySelector('title').textContent,
      description: item.querySelector('description').textContent,
      link: item.querySelector('link').textContent,
    }));
  return [feed, items];
};
