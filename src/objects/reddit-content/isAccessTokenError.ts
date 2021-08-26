export interface RawAccessTokenError {
    error: 'invalid_grant';
    error_description?: string;
}

export const isAccessTokenError = <Data>(response: Data | RawAccessTokenError): response is RawAccessTokenError => 'error' in response && response.error === 'invalid_grant';
