const supabase = require('../utils/supabase');
const LearningService = require('./LearningService');
const BadgeService = require('./BadgeService');
const CertificateService = require('./CertificateService');

async function getQuizByLesson(lessonId) {
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('*')
    .eq('lesson_id', lessonId)
    .single();

  if (quizError || !quiz) throw new Error('Quiz not found for this lesson');

  const { data: questions, error: questionsError } = await supabase
    .from('quiz_questions')
    .select('id, quiz_id, question, option_a, option_b, option_c, option_d') // Don't return correct_option to frontend!
    .eq('quiz_id', quiz.id);

  if (questionsError) throw questionsError;

  return { quiz, questions };
}

async function submitQuiz(userId, quizId, answers) {
  // 1. Fetch correct answers
  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quizId);

  // 2. Grade
  let correctCount = 0;
  answers.forEach(ans => {
    const q = questions.find(question => question.id === ans.questionId);
    if (q && q.correct_option === ans.selectedOption) {
      correctCount++;
    }
  });

  const percentageScore = Math.round((correctCount / questions.length) * 100);

  // 3. Fetch Quiz passing marks
  const { data: quiz } = await supabase.from('quizzes').select('*').eq('id', quizId).single();
  const passingMarks = quiz.passing_marks || 70;
  const passed = percentageScore >= passingMarks;

  // 4. Save Result
  const { data: result } = await supabase
    .from('user_quiz_results')
    .insert({
      user_id: userId,
      quiz_id: quizId,
      score: percentageScore,
      passed
    })
    .select()
    .single();

  // 5. Orchestrate gamification if passed
  if (passed) {
    // Mark lesson complete
    await LearningService.updateProgress(userId, quiz.lesson_id, 100);
    
    // Evaluate Badges
    await BadgeService.checkAndAwardBadges(userId);
    
    // Generate Certificate
    await CertificateService.generateCertificate(userId, quiz.lesson_id);
  }

  return {
    score: percentageScore,
    passed,
    correctCount,
    totalQuestions: questions.length
  };
}

module.exports = { getQuizByLesson, submitQuiz };
