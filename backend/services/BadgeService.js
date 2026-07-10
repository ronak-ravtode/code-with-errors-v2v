const supabase = require('../utils/supabase');

async function checkAndAwardBadges(userId) {
  // 1. Get completed lessons count
  const { data: progress } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'COMPLETED');
  
  const completedCount = (progress || []).length;

  // 2. Get highest quiz score
  const { data: results } = await supabase
    .from('user_quiz_results')
    .select('score')
    .eq('user_id', userId)
    .order('score', { ascending: false })
    .limit(1);
    
  const highestScore = results && results.length > 0 ? results[0].score : 0;

  // 3. Fetch all possible badges
  const { data: allBadges } = await supabase.from('badges').select('*');

  if (!allBadges) return;

  const badgesToAward = [];

  // Hardcoded badge rules based on spec
  // 3 completed lessons -> "Bronze Defender"
  // 6 completed lessons -> "Silver Guardian"
  // 10 completed lessons -> "Safety Expert"
  // score > 90 -> "Gold Protector"

  allBadges.forEach(badge => {
    let qualifies = false;
    if (badge.name === 'Bronze Defender' && completedCount >= 3) qualifies = true;
    if (badge.name === 'Silver Guardian' && completedCount >= 6) qualifies = true;
    if (badge.name === 'Safety Expert' && completedCount >= 10) qualifies = true;
    if (badge.name === 'Gold Protector' && highestScore >= 90) qualifies = true;
    
    // Fallback: Dynamic rules in DB
    if (badge.rule_type === 'LESSONS_COMPLETED' && completedCount >= badge.required_points) qualifies = true;
    if (badge.rule_type === 'QUIZ_SCORE' && highestScore >= badge.required_points) qualifies = true;

    if (qualifies) {
      badgesToAward.push({
        user_id: userId,
        badge_id: badge.id
      });
    }
  });

  // 4. Insert earned badges (upsert to avoid unique constraint errors)
  for (const award of badgesToAward) {
    await supabase
      .from('user_badges')
      .upsert(award, { onConflict: 'user_id,badge_id' })
      .catch(err => console.error('Badge already exists or error:', err));
  }
}

module.exports = { checkAndAwardBadges };
