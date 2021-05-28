export async function request(input: RequestInfo, init?: RequestInit) {
  return fetch(input, {
    credentials: "same-origin",
    headers: {
      Authorization: document.documentElement.dataset.authorization || ""
    },
    ...init ?? {}
  });
}
