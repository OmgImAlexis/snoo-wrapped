export interface RawHttpStatusError {
    error: 403 | 404;
    message: string;
}

export const isHttpStatusError = <Data>(response: Data | RawHttpStatusError): response is RawHttpStatusError => 'error' in response;
