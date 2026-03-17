function extractPublicId(url) {
  if (!url) return null;

  const parts = url.split('/');
  const fileName = parts.pop().split('.')[0];
  const folder = parts.pop();

  return `${folder}/${fileName}`;
}

module.exports = { extractPublicId };