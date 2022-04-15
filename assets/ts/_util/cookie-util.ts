const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

// based on https://gist.github.com/joduplessis/7b3b4340353760e945f972a69e855d11

export function setCookie(name: string, val: string, daysUntilExpire = 7): void {
  const date = new Date();
  date.setTime(date.getTime() + daysUntilExpire * ONE_DAY_IN_MS);

  document.cookie = name + "=" + val + "; expires=" + date.toUTCString() + "; path=/";
}

export function getCookie(name: string): string | undefined {
  const value = "; " + document.cookie;
  const parts = value.split("; " + name + "=");

  if (parts.length === 2) {
    // @ts-ignore can't be undefined
    return parts.pop().split(";").shift();
  }
}

export function deleteCookie(name: string): void {
  const date = new Date();
  date.setTime(date.getTime() - ONE_DAY_IN_MS);

  document.cookie = name + "=; expires=" + date.toUTCString() + "; path=/";
}
