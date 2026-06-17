USE BookStoreee;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'System_Language')
BEGIN
    CREATE TABLE System_Language (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        code NVARCHAR(10) NOT NULL UNIQUE,
        name NVARCHAR(100) NOT NULL
    );
END
GO

IF EXISTS (SELECT * FROM sys.columns WHERE Name = N'language_name' AND Object_ID = Object_ID(N'TTS_Voice'))
BEGIN
    EXEC sp_rename 'TTS_Voice.language_name', 'voice_name', 'COLUMN';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'language_id' AND Object_ID = Object_ID(N'TTS_Voice'))
BEGIN
    ALTER TABLE TTS_Voice ADD language_id BIGINT;
    ALTER TABLE TTS_Voice ADD CONSTRAINT FK_TTSVoice_SysLang
        FOREIGN KEY (language_id) REFERENCES System_Language(id);
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'is_outdated' AND Object_ID = Object_ID(N'AUDIO_BOOK'))
BEGIN
    ALTER TABLE AUDIO_BOOK ADD is_outdated BIT NOT NULL DEFAULT 0;
END
GO
