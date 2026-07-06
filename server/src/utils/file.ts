export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop() || '';
};

export const isValidImage = (mimetype: string): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return validTypes.includes(mimetype);
};
