const supabase = require('../utils/supabase');

async function getCategories() {
  const { data, error } = await supabase.from('learning_categories').select('*').order('created_at');
  if (error) throw error;
  return data;
}

async function getLessons(categoryId) {
  let query = supabase.from('lessons').select('*').order('created_at');
  if (categoryId) query = query.eq('category_id', categoryId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function getLessonById(lessonId) {
  const { data, error } = await supabase.from('lessons').select('*').eq('id', lessonId).single();
  if (error) throw error;
  return data;
}

async function updateProgress(userId, lessonId, progressValue) {
  const status = progressValue === 100 ? 'COMPLETED' : 'IN_PROGRESS';
  const updates = {
    user_id: userId,
    lesson_id: lessonId,
    progress: progressValue,
    status
  };
  
  if (status === 'COMPLETED') {
    updates.completed_at = new Date();
  }

  // Upsert progress
  const { data, error } = await supabase
    .from('user_progress')
    .upsert(updates, { onConflict: 'user_id,lesson_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getDashboard(userId) {
  // Aggregate stats
  const { data: progressList } = await supabase.from('user_progress').select('*').eq('user_id', userId);
  const { data: certificates } = await supabase.from('certificates').select('*').eq('user_id', userId);
  const { data: badges } = await supabase.from('user_badges').select('*, badges(*)').eq('user_id', userId);

  const completedLessons = (progressList || []).filter(p => p.status === 'COMPLETED').length;
  const totalProgressItems = (progressList || []).length;
  
  let averageProgress = 0;
  if (totalProgressItems > 0) {
    const total = (progressList || []).reduce((sum, p) => sum + p.progress, 0);
    averageProgress = Math.round(total / totalProgressItems);
  }

  return {
    averageProgress,
    completedLessonsCount: completedLessons,
    certificatesCount: (certificates || []).length,
    earnedBadges: badges || []
  };
}

module.exports = {
  getCategories,
  getLessons,
  getLessonById,
  updateProgress,
  getDashboard
};
