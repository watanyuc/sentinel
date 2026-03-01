# 04 — จัดการบัญชี MT5 / API Keys Management

## 🔑 API Keys ของท่าน

ส่วนจัดการ API Keys ที่ใช้เชื่อมต่อบัญชี MT5 กับระบบ Dashboard

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  🔑 จัดการบัญชี MT5 ของฉัน                                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  API Keys ของท่าน                                         │
│                                                          │
│  ┌─ Account List ──────────────────────────────────────┐ │
│  │                                                     │ │
│  │  ┌─ Account Card ────────────────────────────────┐  │ │
│  │  │ 🟢 XM Global — Account #12345678              │  │ │
│  │  │ API Key: ●●●●●●●●●●●●abcd                    │  │ │
│  │  │ สร้างเมื่อ: 15 ก.พ. 2569                        │  │ │
│  │  │ ใช้งานล่าสุด: 2 นาทีที่แล้ว                       │  │ │
│  │  │                         [📋 คัดลอก] [🗑️ ลบ]    │  │ │
│  │  └────────────────────────────────────────────────┘  │ │
│  │                                                     │ │
│  │  ┌─ Account Card ────────────────────────────────┐  │ │
│  │  │ 🔴 Exness — Account #87654321                 │  │ │
│  │  │ API Key: ●●●●●●●●●●●●efgh                    │  │ │
│  │  │ สร้างเมื่อ: 10 ม.ค. 2569                        │  │ │
│  │  │ ใช้งานล่าสุด: 3 วันที่แล้ว                        │  │ │
│  │  │                         [📋 คัดลอก] [🗑️ ลบ]    │  │ │
│  │  └────────────────────────────────────────────────┘  │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  [➕ สร้าง API Key ใหม่ / เพิ่มบัญชี MT5]                   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Account Card — ข้อมูลที่แสดง

| Field | Description | Example |
|-------|------------|---------|
| Status Indicator | 🟢 Online / 🔴 Offline | 🟢 |
| Broker Name | ชื่อโบรกเกอร์ | XM Global |
| Account Number | เลขบัญชี MT5 | #12345678 |
| API Key (masked) | แสดง 4 ตัวท้าย | ●●●●●●●●●●●●abcd |
| Created Date | วันที่สร้าง | 15 ก.พ. 2569 |
| Last Used | ใช้งานล่าสุด | 2 นาทีที่แล้ว |
| Actions | ปุ่มดำเนินการ | [📋 คัดลอก] [🗑️ ลบ] |

### Actions

#### 📋 คัดลอก (Copy API Key)
- คลิกปุ่ม → Copy full API key ไปยัง clipboard
- แสดง toast notification: "✅ คัดลอก API Key แล้ว"
- Auto-dismiss หลัง 3 วินาที

#### 🗑️ ลบ (Delete API Key)
- คลิกปุ่ม → แสดง Confirmation Dialog:

```
┌──────────────────────────────────────┐
│  ⚠️ ยืนยันการลบ API Key              │
│                                      │
│  คุณต้องการลบ API Key ของบัญชี        │
│  XM Global — #12345678               │
│  หรือไม่?                             │
│                                      │
│  ⚠️ การดำเนินการนี้ไม่สามารถย้อนกลับได้  │
│  EA Bot ที่ใช้ key นี้จะหยุดทำงาน       │
│                                      │
│          [ยกเลิก]  [🗑️ ยืนยันลบ]     │
└──────────────────────────────────────┘
```

#### ➕ สร้าง API Key ใหม่ / เพิ่มบัญชี MT5
- คลิกปุ่ม → แสดง Modal Form:

```
┌──────────────────────────────────────────┐
│  ➕ เพิ่มบัญชี MT5 ใหม่                    │
│                                          │
│  ชื่อบอท / Label *                        │
│  ┌──────────────────────────────────┐    │
│  │  Gold Scalper Bot                 │    │
│  └──────────────────────────────────┘    │
│                                          │
│  Broker *                                │
│  ┌──────────────────────────────────┐    │
│  │  [เลือก Broker ▼]                │    │
│  └──────────────────────────────────┘    │
│                                          │
│  MT5 Account Number *                    │
│  ┌──────────────────────────────────┐    │
│  │  12345678                         │    │
│  └──────────────────────────────────┘    │
│                                          │
│  MT5 Password *                          │
│  ┌──────────────────────────────────┐    │
│  │  ●●●●●●●●●●                      │    │
│  └──────────────────────────────────┘    │
│                                          │
│  MT5 Server *                            │
│  ┌──────────────────────────────────┐    │
│  │  XMGlobal-MT5 3                   │    │
│  └──────────────────────────────────┘    │
│                                          │
│  Account Type                            │
│  ┌──────────────────────────────────┐    │
│  │  [Demo ▼] / Real                 │    │
│  └──────────────────────────────────┘    │
│                                          │
│         [ยกเลิก]  [✅ สร้าง API Key]     │
└──────────────────────────────────────────┘
```

### Form Validation Rules

| Field | Validation | Error Message |
|-------|-----------|---------------|
| ชื่อบอท | Required, 1-50 chars | "กรุณาระบุชื่อบอท" |
| Broker | Required, select from list | "กรุณาเลือก Broker" |
| Account Number | Required, numeric, 6-12 digits | "เลขบัญชีไม่ถูกต้อง" |
| Password | Required, min 6 chars | "กรุณาระบุรหัสผ่าน" |
| Server | Required | "กรุณาระบุ Server" |
| Account Type | Required, default "Demo" | — |

### After Successful Creation

```
┌──────────────────────────────────────────┐
│  ✅ สร้าง API Key สำเร็จ!                 │
│                                          │
│  API Key ของคุณ:                          │
│  ┌──────────────────────────────────┐    │
│  │  ak_xm12345_9f8e7d6c5b4a3210    │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ⚠️ กรุณาคัดลอก API Key นี้ไว้             │
│  จะไม่แสดงอีกครั้งหลังปิดหน้าต่างนี้         │
│                                          │
│              [📋 คัดลอก] [✅ เสร็จสิ้น]    │
└──────────────────────────────────────────┘
```

### Data Model

```typescript
interface MT5Account {
  id: string;                    // UUID
  userId: string;                // เจ้าของบัญชี
  botName: string;               // ชื่อบอท e.g. "Gold Scalper Bot"
  brokerName: string;            // ชื่อโบรกเกอร์ e.g. "XM Global"
  accountNumber: string;         // เลขบัญชี MT5
  server: string;                // MT5 server name
  accountType: 'demo' | 'real';  // ประเภทบัญชี
  apiKey: string;                // hashed API key
  apiKeyLast4: string;           // 4 ตัวท้ายสำหรับแสดงผล
  isOnline: boolean;             // สถานะการเชื่อมต่อ
  createdAt: Date;               // วันที่สร้าง
  lastUsedAt: Date | null;       // ใช้งานล่าสุด
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|---------|------------|
| `GET` | `/api/accounts` | ดึงรายการบัญชีทั้งหมด |
| `POST` | `/api/accounts` | เพิ่มบัญชีใหม่ + สร้าง API Key |
| `DELETE` | `/api/accounts/:id` | ลบบัญชี + revoke API Key |
| `POST` | `/api/accounts/:id/regenerate` | สร้าง API Key ใหม่ |
| `GET` | `/api/accounts/:id/status` | เช็คสถานะ online/offline |

### Security Notes

- API Key จะถูก hash ก่อนเก็บในฐานข้อมูล (bcrypt)
- แสดงเฉพาะ 4 ตัวท้ายเท่านั้น
- Full API Key แสดงครั้งเดียวตอนสร้าง
- Rate limit: 100 requests/minute per API key
- MT5 password จะถูก encrypt ด้วย AES-256 ก่อนเก็บ
