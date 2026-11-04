import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 3000),

  frontendUrl:
    process.env.FRONTEND_URL ??
    "http://localhost:5173",

  smtp: {
    host:
      process.env.SMTP_HOST ??
      "smtp.gmail.com",

    port:
      Number(process.env.SMTP_PORT ?? 465),

    user:
      process.env.SMTP_USER ?? "",

    password:
      process.env.SMTP_PASSWORD ?? "",

    from:
      process.env.MAIL_FROM ??
      process.env.SMTP_USER ??
      "",
  },
};