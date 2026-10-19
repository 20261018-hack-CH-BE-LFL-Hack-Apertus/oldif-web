export const runtimeConfig = {
  backendUrl: process.env.BACKEND_URL,
  port: Number(process.env.PORT),
  hostname: process.env.HOSTNAME,
  production: process.env.NODE_ENV === "production",
};
