/**
 * Extract Cloudinary public_id từ URL
 * @param {string} url
 * @returns {string|null}
 */
function extractPublicId(url) {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    const segments = urlObj.pathname.split('/');
    const fileName = segments.pop(); // abc123.jpg
    const folder = segments.pop();   // categories

    return `${folder}/${fileName.split('.')[0]}`;
  } catch (error) {
    return null;
  }
}

module.exports = extractPublicId;
