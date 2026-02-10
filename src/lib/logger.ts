/**
 * Simple console logger matching StableStudio's createLogger interface.
 * No OpenTelemetry — just structured console output.
 */

const NODE_ENV = process.env.NODE_ENV ?? "development";

function emit(
  level: string,
  message: string,
  attributes?: Record<string, string | number | boolean>,
) {
  const timestamp = new Date().toISOString();

  if (NODE_ENV === "production") {
    const logEntry = {
      timestamp,
      level: level.toLowerCase(),
      message,
      ...attributes,
    };
    console.log(JSON.stringify(logEntry));
    return;
  }

  // Development: human-readable
  let output = `[${timestamp}] ${level}: ${message}`;

  if (attributes) {
    const attrs = Object.entries(attributes)
      .map(
        ([key, value]) =>
          `${key}=${typeof value === "string" ? value : JSON.stringify(value)}`,
      )
      .join(", ");
    if (attrs) output += ` {${attrs}}`;
  }

  switch (level) {
    case "ERROR":
      console.error(output);
      break;
    case "WARN":
      console.warn(output);
      break;
    default:
      console.log(output);
  }
}

export const logger = {
  debug: (
    message: string,
    attributes?: Record<string, string | number | boolean>,
  ) => emit("DEBUG", message, attributes),
  info: (
    message: string,
    attributes?: Record<string, string | number | boolean>,
  ) => emit("INFO", message, attributes),
  warn: (
    message: string,
    attributes?: Record<string, string | number | boolean>,
  ) => emit("WARN", message, attributes),
  error: (
    message: string,
    attributes?: Record<string, string | number | boolean>,
  ) => emit("ERROR", message, attributes),
};

export const createLogger = (module: string) => ({
  debug: (
    message: string,
    attributes?: Record<string, string | number | boolean>,
  ) => logger.debug(message, { module, ...attributes }),
  info: (
    message: string,
    attributes?: Record<string, string | number | boolean>,
  ) => logger.info(message, { module, ...attributes }),
  warn: (
    message: string,
    attributes?: Record<string, string | number | boolean>,
  ) => logger.warn(message, { module, ...attributes }),
  error: (
    message: string,
    attributes?: Record<string, string | number | boolean>,
  ) => logger.error(message, { module, ...attributes }),
});
