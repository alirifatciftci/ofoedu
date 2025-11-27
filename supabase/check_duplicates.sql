-- ============================================
-- Duplicate Players Check Script
-- ============================================
-- Bu script duplicate oyuncuları kontrol eder
-- ============================================

-- 1. Duplicate oyuncuları listele
SELECT 
  name,
  COUNT(*) as duplicate_count,
  array_agg(id ORDER BY created_at) as player_ids,
  array_agg(created_at ORDER BY created_at) as created_dates
FROM players
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, name;

-- 2. Her duplicate oyuncunun kariyer geçmişi sayısını göster
SELECT 
  p.name,
  p.id,
  COUNT(pch.id) as career_history_count
FROM players p
LEFT JOIN player_career_history pch ON p.id = pch.player_id
WHERE p.name IN (
  SELECT name
  FROM players
  GROUP BY name
  HAVING COUNT(*) > 1
)
GROUP BY p.id, p.name
ORDER BY p.name, p.id;

-- 3. Toplam duplicate sayısı
SELECT 
  COUNT(*) as total_duplicate_players,
  SUM(count - 1) as total_duplicates_to_remove
FROM (
  SELECT name, COUNT(*) as count
  FROM players
  GROUP BY name
  HAVING COUNT(*) > 1
) duplicates;

