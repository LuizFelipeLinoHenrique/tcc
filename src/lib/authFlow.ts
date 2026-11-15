export let isSigningUp = false;

export function setSigningUp(value: boolean) {
    isSigningUp = value;
}

export function recoveryTokens(url: string | null) {
    const fragment = url?.split("#")[1];
    if (!fragment) return null;

    const params = new URLSearchParams(fragment);
    if (params.get("type") !== "recovery") return null;

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    return accessToken && refreshToken
        ? { access_token: accessToken, refresh_token: refreshToken }
        : null;
}
