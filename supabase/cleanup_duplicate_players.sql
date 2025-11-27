-- ============================================
-- Duplicate Players Cleanup Script
-- ============================================
-- Bu script duplicate oyuncuları temizler
-- ÖNCE check_duplicates.sql'i çalıştırarak durumu kontrol edin!
-- ============================================

-- 1. ÖNCE DUPLICATE'LERİ KONTROL ET
-- ============================================
-- Aşağıdaki sorguyu çalıştırarak duplicate oyuncuları görebilirsiniz:

SELECT name, COUNT(*) as count
FROM players
GROUP BY
    name
HAVING
    COUNT(*) > 1
ORDER BY count DESC;

-- ============================================
-- 2. DUPLICATE'LERİ TEMİZLE
-- ============================================

DO $$
DECLARE
  duplicate_record RECORD;
  keep_player_id uuid;
  delete_player_id uuid;
  player_array uuid[];
  i integer;
BEGIN
  -- Her duplicate oyuncu grubu için
  FOR duplicate_record IN 
    SELECT 
      name, 
      array_agg(id ORDER BY created_at) as player_ids
    FROM players
    GROUP BY name
    HAVING COUNT(*) > 1
  LOOP
    player_array := duplicate_record.player_ids;
    
    -- İlk oyuncuyu tut (en eski)
    keep_player_id := player_array[1];
    
    -- Diğer oyuncuları işle (2. oyuncudan başla)
    FOR i IN 2..array_length(player_array, 1) LOOP
      delete_player_id := player_array[i];
      
      -- Kariyer geçmişlerini taşı (sadece benzersiz olanları)
      UPDATE player_career_history pch
      SET player_id = keep_player_id
      WHERE pch.player_id = delete_player_id
        AND NOT EXISTS (
          SELECT 1 
          FROM player_career_history existing
          WHERE existing.player_id = keep_player_id
            AND existing.club_id = pch.club_id
            AND existing.year_from = pch.year_from
            AND (
              (existing.year_to = pch.year_to) 
              OR (existing.year_to IS NULL AND pch.year_to IS NULL)
            )
        );
      
      -- guess_player_games'deki referansları güncelle
      UPDATE guess_player_games
      SET player_id = keep_player_id
      WHERE player_id = delete_player_id;
      
      -- Duplicate oyuncuyu sil
      DELETE FROM players WHERE id = delete_player_id;
      
      RAISE NOTICE 'Deleted duplicate player: % (kept: %)', delete_player_id, keep_player_id;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Duplicate cleanup completed!';
END $$;

-- ============================================
-- 3. KONTROL ET
-- ============================================
-- Temizleme sonrası duplicate kaldı mı kontrol edin:

SELECT name, COUNT(*) as count
FROM players
GROUP BY
    name
HAVING
    COUNT(*) > 1;

-- Eğer sonuç boşsa, temizleme başarılı!
-- ============================================