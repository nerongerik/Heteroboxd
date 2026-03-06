export const Response = {
  initial: { result: -1, message: '' },
  loading: { result: 0, message: '' },
  ok: { result: 200, message: '' },
  badRequest: { result: 400, message: `Malformed request! What did you do?` },
  forbidden: { result: 403, message: `Session expired! Try logging in again.` },
  notFound: { result: 404, message: `This object no longer exists! Try reloading Heteroboxd.` },
  internalServerError: { result: 500, message: `Something went wrong! Try again later or contact Heteroboxd support for more information.` },
  networkError: { result: 500, message: `Network error! Please check your internet connection and try again!` }
}