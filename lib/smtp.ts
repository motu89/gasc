import { Socket } from 'node:net';
import * as tls from 'node:tls';
import type { TLSSocket } from 'node:tls';

type SocketLike = Socket | TLSSocket;

function base64(value: string) {
  return Buffer.from(value, 'utf8').toString('base64');
}

function createLineReader(socket: SocketLike) {
  let buffer = '';
  const queue: string[] = [];
  let resolver: ((line: string) => void) | null = null;

  socket.on('data', (chunk) => {
    buffer += chunk.toString('utf8');

    while (buffer.includes('\r\n')) {
      const line = buffer.slice(0, buffer.indexOf('\r\n'));
      buffer = buffer.slice(buffer.indexOf('\r\n') + 2);

      if (resolver) {
        const currentResolver = resolver;
        resolver = null;
        currentResolver(line);
      } else {
        queue.push(line);
      }
    }
  });

  return async function readLine() {
    if (queue.length > 0) {
      return queue.shift() as string;
    }

    return new Promise<string>((resolve) => {
      resolver = resolve;
    });
  };
}

async function readResponse(readLine: () => Promise<string>) {
  const lines: string[] = [];

  while (true) {
    const line = await readLine();
    lines.push(line);

    if (/^\d{3} /.test(line)) {
      return {
        code: Number(line.slice(0, 3)),
        lines,
      };
    }
  }
}

async function sendCommand(
  socket: SocketLike,
  readLine: () => Promise<string>,
  command: string,
  expectedCodes: number[]
) {
  socket.write(`${command}\r\n`);
  const response = await readResponse(readLine);

  if (!expectedCodes.includes(response.code)) {
    throw new Error(`SMTP command failed: ${command} -> ${response.lines.join(' | ')}`);
  }

  return response;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string[];
  subject: string;
  html: string;
}) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass || !from || to.length === 0) {
    return;
  }

  const port = Number(process.env.SMTP_PORT || 465);
  const secure = process.env.SMTP_SECURE !== 'false';

  const socket: SocketLike = await new Promise((resolve, reject) => {
    const handleError = (error: Error) => reject(error);

    if (secure) {
      const tlsSocket = tls.connect(
        {
          host,
          port,
          servername: host,
        },
        () => resolve(tlsSocket)
      );
      tlsSocket.once('error', handleError);
      return;
    }

    const netSocket = new Socket();
    netSocket.connect(port, host, () => resolve(netSocket));
    netSocket.once('error', handleError);
  });

  socket.setEncoding('utf8');
  const readLine = createLineReader(socket);

  try {
    const banner = await readResponse(readLine);
    if (banner.code !== 220) {
      throw new Error(`SMTP banner rejected: ${banner.lines.join(' | ')}`);
    }

    await sendCommand(socket, readLine, `EHLO ${host}`, [250]);
    await sendCommand(socket, readLine, 'AUTH LOGIN', [334]);
    await sendCommand(socket, readLine, base64(user), [334]);
    await sendCommand(socket, readLine, base64(pass), [235]);
    await sendCommand(socket, readLine, `MAIL FROM:<${from}>`, [250]);

    for (const recipient of to) {
      await sendCommand(socket, readLine, `RCPT TO:<${recipient}>`, [250, 251]);
    }

    await sendCommand(socket, readLine, 'DATA', [354]);

    const message = [
      `From: ${from}`,
      `To: ${to.join(', ')}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      `Subject: ${subject}`,
      '',
      html,
      '.',
    ].join('\r\n');

    socket.write(`${message}\r\n`);
    const dataResponse = await readResponse(readLine);

    if (dataResponse.code !== 250) {
      throw new Error(`SMTP DATA failed: ${dataResponse.lines.join(' | ')}`);
    }

    await sendCommand(socket, readLine, 'QUIT', [221]);
  } finally {
    socket.end();
  }
}
