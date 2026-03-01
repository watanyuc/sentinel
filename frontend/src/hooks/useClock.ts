import { useState, useEffect } from 'react';

export interface ClockState {
  thai: string;
  ny: string;
  session: string;
}

const THAI_TZ = 'Asia/Bangkok';
const NY_TZ = 'America/New_York';

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
                     'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

const pad = (n: number) => String(n).padStart(2, '0');

const getThaiYear = (year: number) => year + 543;

const formatThai = (date: Date): string => {
  const d = new Intl.DateTimeFormat('en', {
    timeZone: THAI_TZ,
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const parts: Record<string, string> = {};
  d.forEach(p => { parts[p.type] = p.value; });

  const month = THAI_MONTHS[parseInt(parts.month) - 1];
  const thaiYear = getThaiYear(parseInt(parts.year));
  const dd = parts.day.padStart(2, '0');
  const hh = parts.hour === '24' ? '00' : pad(parseInt(parts.hour));
  return `${dd} ${month} ${thaiYear} ${hh}:${parts.minute}:${parts.second}`;
};

const formatNY = (date: Date): string => {
  const d = new Intl.DateTimeFormat('en-US', {
    timeZone: NY_TZ,
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const parts: Record<string, string> = {};
  d.forEach(p => { parts[p.type] = p.value; });

  const hh = parts.hour === '24' ? '00' : pad(parseInt(parts.hour));
  return `${parts.day} ${parts.month} ${parts.year} ${hh}:${parts.minute}:${parts.second}`;
};

const getMarketSession = (date: Date): string => {
  const utcHour = date.getUTCHours();
  const utcMin = date.getUTCMinutes();
  const time = utcHour * 60 + utcMin;

  // Session times in UTC
  const sessions: { name: string; start: number; end: number }[] = [
    { name: 'Sydney', start: 21 * 60, end: 6 * 60 },    // 21:00-06:00 UTC
    { name: 'Tokyo', start: 0 * 60, end: 9 * 60 },       // 00:00-09:00 UTC
    { name: 'London', start: 8 * 60, end: 17 * 60 },     // 08:00-17:00 UTC
    { name: 'New York', start: 13 * 60, end: 22 * 60 },  // 13:00-22:00 UTC
  ];

  const active: string[] = [];
  sessions.forEach(s => {
    if (s.start > s.end) {
      // Overnight session
      if (time >= s.start || time < s.end) active.push(s.name);
    } else {
      if (time >= s.start && time < s.end) active.push(s.name);
    }
  });

  if (active.length === 0) return 'Market Closed';
  return active.join(' + ');
};

export const useClock = (): ClockState => {
  const [state, setState] = useState<ClockState>({
    thai: '', ny: '', session: '',
  });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setState({
        thai: formatThai(now),
        ny: formatNY(now),
        session: getMarketSession(now),
      });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return state;
};
