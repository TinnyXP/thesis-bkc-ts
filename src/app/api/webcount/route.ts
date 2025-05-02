import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

type VisitorData = {
  [date: string]: string[]; // วันที่ => รายชื่อ IP ที่เข้าแล้ว
};

const dataFilePath = path.join(process.cwd(), 'data', 'visitors.json');

function getTodayDate() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  return typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress || '';
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const today = getTodayDate();
  const ip = getClientIp(req);

  let data: VisitorData = {};

  if (fs.existsSync(dataFilePath)) {
    const fileContent = fs.readFileSync(dataFilePath, 'utf8');
    data = JSON.parse(fileContent);
  }

  if (!data[today]) {
    data[today] = [];
  }

  if (!data[today].includes(ip)) {
    data[today].push(ip);
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
  }

  res.status(200).json({ count: data[today].length });
}
