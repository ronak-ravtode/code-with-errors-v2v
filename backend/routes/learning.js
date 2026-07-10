const express = require('express');
const LearningService = require('../services/LearningService');
const QuizService = require('../services/QuizService');
const supabase = require('../utils/supabase');

const router = express.Router();

// GET /api/learning/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const dashboard = await LearningService.getDashboard(userId);
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/learning/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await LearningService.getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/learning/lessons
router.get('/lessons', async (req, res) => {
  try {
    const { categoryId } = req.query;
    const lessons = await LearningService.getLessons(categoryId);
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/learning/lesson/:id
router.get('/lesson/:id', async (req, res) => {
  try {
    const lesson = await LearningService.getLessonById(req.params.id);
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/learning/progress
router.post('/progress', async (req, res) => {
  try {
    const { userId, lessonId, progress } = req.body;
    if (!userId || !lessonId || progress === undefined) return res.status(400).json({ error: 'Missing required fields' });
    const result = await LearningService.updateProgress(userId, lessonId, progress);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/learning/quiz/:lessonId
router.get('/quiz/:lessonId', async (req, res) => {
  try {
    const quizData = await QuizService.getQuizByLesson(req.params.lessonId);
    res.json(quizData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/learning/quiz/submit
router.post('/quiz/submit', async (req, res) => {
  try {
    const { userId, quizId, answers } = req.body;
    if (!userId || !quizId || !answers) return res.status(400).json({ error: 'Missing required fields' });
    
    const result = await QuizService.submitQuiz(userId, quizId, answers);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/learning/certificate/:lessonId
router.get('/certificate/:lessonId', async (req, res) => {
  try {
    const { userId } = req.query;
    const { lessonId } = req.params;
    const { data: cert } = await supabase
      .from('certificates')
      .select('certificate_url')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .order('issued_at', { ascending: false })
      .limit(1)
      .single();
    
    if (!cert) return res.status(404).json({ error: 'Certificate not found' });
    res.json(cert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
