> Module 15 thuộc bộ workflow backend KidEDU.
> Quy ước chung nằm trong `00_Common_Conventions.md`.

---

# Module 15 — Speech Recording & AI Analysis

## 15.1 Trạng thái

```text
Không làm trong MVP đầu tiên.
Có thể làm sau khi core learning/progress ổn định.
```

---

## 15.2 Mục tiêu

Ghi nhận bé có luyện nói hay không, phụ huynh đánh giá phản hồi, và sau này có thể dùng AI phân tích.

MVP sau có thể bắt đầu bằng metadata local, không upload audio/video ngay.

---

## 15.3 Phụ thuộc

```text
- Module 07 Learning Event Tracking
- Module 08 Progress Engine
- Module 14 Cloud Backup nếu cần AI server-side
```

---

## 15.4 Database cần có

### speech_attempts

```sql
CREATE TABLE speech_attempts (
  id UUID PRIMARY KEY,

  parent_id UUID NOT NULL REFERENCES parent_accounts(id),
  child_id UUID NOT NULL REFERENCES child_profiles(id),
  word_id UUID NULL REFERENCES word_items(id),
  session_id UUID NULL REFERENCES learning_sessions(id),
  device_id UUID NULL REFERENCES device_clients(id),

  client_local_audio_id TEXT NULL,
  client_local_video_id TEXT NULL,

  parent_rating TEXT NULL,
  parent_note TEXT NULL,

  ai_status TEXT DEFAULT 'not_requested',
  ai_result JSONB NULL,

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

---

## 15.5 Parent rating

```text
no_response
sound_only
close_attempt
correct
unclear
```

---

## 15.6 API cần làm sau này

### POST /children/:childId/speech-attempts

Request:

```json
{
  "wordId": "word-me",
  "sessionId": "session-id",
  "deviceId": "device-id",
  "clientLocalAudioId": "audio-local-001",
  "parentRating": "close_attempt",
  "parentNote": "Bé có phát âm gần giống"
}
```

---

### PATCH /children/:childId/speech-attempts/:attemptId/rating

Request:

```json
{
  "parentRating": "correct",
  "parentNote": "Hôm nay bé nói rõ hơn"
}
```

---

### POST /children/:childId/speech-attempts/:attemptId/ai-analysis

Chỉ dùng khi phụ huynh đồng ý upload hoặc đã có cloud media.

---

## 15.7 Backend workflow

```text
1. Bé luyện nói sau khi xem video.
2. Frontend có thể ghi âm local.
3. Phụ huynh đánh giá phản hồi.
4. Frontend gửi metadata speech attempt.
5. Backend lưu speech_attempts.
6. Backend tạo learning event parent_marked_easy/hard nếu phù hợp.
7. Sau này nếu có AI, backend xử lý async.
```

---

## 15.8 Business rules

```text
- Không tự upload giọng nói của trẻ trong MVP.
- Nếu dùng AI, phải có consent rõ ràng.
- AI chỉ hỗ trợ phụ huynh, không chẩn đoán y tế.
- Parent rating vẫn quan trọng hơn AI trong MVP.
```

---

## 15.9 Error codes

```text
SPEECH_ATTEMPT_NOT_FOUND
INVALID_PARENT_RATING
AI_ANALYSIS_DISABLED
AI_ANALYSIS_REQUIRES_CONSENT
```

---

## 15.10 Test checklist sau này

```text
[ ] Tạo speech attempt metadata thành công.
[ ] Parent rating validate đúng.
[ ] Speech attempt gắn đúng word/session.
[ ] Không request AI nếu feature disabled.
[ ] Không upload audio tự động.
```

---

## 15.11 Definition of Done

Module này hoàn thành khi:

```text
- Phụ huynh ghi nhận được phản hồi luyện nói của bé.
- Dashboard có thể hiển thị tiến bộ phát âm cơ bản.
```

---
