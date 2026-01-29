// Pre-import local thumbnails for instant loading
const codingThumbnail = require('../../assets/images/coding.png');
const copywritingThumbnail = require('../../assets/images/copywriting.png');
const imageGenThumbnail = require('../../assets/images/image-gen.png');

// Local thumbnails available in assets folder
export const getModuleThumbnail = (title: string = '', category: string = '', topic: string = '') => {
  const titleLower = title.toLowerCase();
  const catLower = category.toLowerCase();
  const topicLower = topic.toLowerCase();

  // Combine all fields for a thorough search
  const allText = `${titleLower} ${catLower} ${topicLower}`;

  const isCoding =
    allText.includes('code') ||
    allText.includes('python') ||
    allText.includes('logic') ||
    allText.includes('dev') ||
    allText.includes('script') ||
    allText.includes('program') ||
    allText.includes('tech') ||
    allText.includes('engineer') ||
    allText.includes('algo') ||
    allText.includes('function') ||
    allText.includes('data');

  const isCopywriting =
    allText.includes('copy') ||
    allText.includes('write') ||
    allText.includes('content') ||
    allText.includes('market') ||
    allText.includes('persuas') ||
    allText.includes('story') ||
    allText.includes('brand') ||
    allText.includes('engage');

  if (isCoding) {
    return codingThumbnail;
  } else if (isCopywriting) {
    return copywritingThumbnail;
  } else {
    return imageGenThumbnail;
  }
};
