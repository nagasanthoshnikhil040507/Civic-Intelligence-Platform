export const getDepartmentForCategory = (category?: string): 'SANITATION' | 'ROADS' | 'UNASSIGNED' => {
  if (!category) return 'UNASSIGNED';
  
  const cat = category.toUpperCase();
  
  if (
    cat.includes('GARBAGE') || 
    cat.includes('WASTE') || 
    cat.includes('SANITATION') || 
    cat.includes('TRASH') || 
    cat.includes('DUMP') ||
    cat.includes('CLEAN')
  ) {
    return 'SANITATION';
  }
  
  if (
    cat.includes('ROAD') || 
    cat.includes('POTHOLE') || 
    cat.includes('STREET') || 
    cat.includes('TRAFFIC') ||
    cat.includes('PAVEMENT') ||
    cat.includes('STREETLIGHT')
  ) {
    return 'ROADS';
  }
  
  return 'UNASSIGNED';
};
