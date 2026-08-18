import { NextResponse } from 'next/server';

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400, code = 'BAD_REQUEST') {
  return NextResponse.json({ message, code, status }, { status });
}

export function simulateLatency(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
