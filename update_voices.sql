USE BookStoreee;
GO

-- Cập nhật giọng nói tiếng Anh
UPDATE TTS_Voice SET language_id = 2 WHERE narrator_code IN ('giahuy', 'thuminh', 'ngoclam', 'baotin');

-- Kiểm tra nếu chưa có giọng tiếng Nhật thì insert vào
IF NOT EXISTS (SELECT 1 FROM TTS_Voice WHERE narrator_code = 'nanami')
BEGIN
    INSERT INTO TTS_Voice (voice_name, narrator_code, language_id) VALUES (N'Nanami (Nữ Nhật Bản)', 'nanami', 3);
END
IF NOT EXISTS (SELECT 1 FROM TTS_Voice WHERE narrator_code = 'keita')
BEGIN
    INSERT INTO TTS_Voice (voice_name, narrator_code, language_id) VALUES (N'Keita (Nam Nhật Bản)', 'keita', 3);
END
GO
