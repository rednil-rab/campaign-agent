export class ServiceError extends Error {
  readonly status: number;
  readonly code: 'bad_request' | 'upstream_unavailable' | 'unauthorized';

  constructor(
    message: string,
    status: number,
    code: 'bad_request' | 'upstream_unavailable' | 'unauthorized',
  ) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
