import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
  try {
    const response = await fetch('/api/admin/core-principle-questions');
    if (response.ok) {
      const data = await response.json();
      return {
        questions: data.questions || []
      };
    }
  } catch (error) {
    console.error('Failed to load core principle questions:', error);
  }

  return {
    questions: []
  };
};
