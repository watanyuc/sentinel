import https from 'https';

/** Escape HTML special chars for Telegram parse_mode=HTML */
export const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const sendTelegramMessage = (
  botToken: string,
  chatId: string,
  text: string,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    });

    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${botToken}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      // Read response body for better error messages
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          let detail = '';
          try {
            const json = JSON.parse(Buffer.concat(chunks).toString());
            detail = json.description || '';
          } catch { /* ignore parse errors */ }
          reject(new Error(
            `Telegram API ${res.statusCode}${detail ? ': ' + detail : ''}`
          ));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
};
