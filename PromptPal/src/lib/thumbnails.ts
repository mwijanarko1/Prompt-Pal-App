// Mapping local thumbnails to modules based on their category or title
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

  const isImageGen = 
    allText.includes('image') || 
    allText.includes('art') || 
    allText.includes('visual') || 
    allText.includes('design') || 
    allText.includes('prompt') ||
    allText.includes('creative') ||
    allText.includes('style') ||
    allText.includes('generation');
  
  if (isCoding) {
    return require('../../assets/images/coding.png');
  } else if (isCopywriting) {
    return require('../../assets/images/copywriting.png');
  } else if (isImageGen) {
    return require('../../assets/images/image-gen.png');
  }
  
  return null;
};
