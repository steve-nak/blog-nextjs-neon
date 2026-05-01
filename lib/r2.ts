import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/g, "");
}

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: getRequiredEnv("R2_URL"),
    credentials: {
      accessKeyId: getRequiredEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: getRequiredEnv("R2_SECRET_ACCESS_KEY"),
    },
    forcePathStyle: true,
  });
}

export function getR2PublicBaseUrl() {
  return normalizeBaseUrl(getRequiredEnv("R2_PUBLIC_URL"));
}

export function buildR2PublicUrl(key: string) {
  return `${getR2PublicBaseUrl()}/${key}`;
}

function getR2ObjectKeyFromUrl(url: string) {
  const publicBaseUrl = getR2PublicBaseUrl();

  if (!url.startsWith(publicBaseUrl)) {
    return null;
  }

  const path = new URL(url).pathname.replace(/^\/+/, "");

  return path ? decodeURIComponent(path) : null;
}

function getFileExtension(fileName: string, contentType: string) {
  const nameExtension = extname(fileName).toLowerCase();

  if (nameExtension) {
    return nameExtension;
  }

  switch (contentType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "image/avif":
      return ".avif";
    case "image/svg+xml":
      return ".svg";
    default:
      return "";
  }
}

export function isR2PublicUrl(url: string) {
  return url.startsWith(getR2PublicBaseUrl());
}

export async function uploadFileToR2(file: File) {
  const extension = getFileExtension(file.name, file.type);
  const key = `cover-images/${randomUUID()}${extension}`;
  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: getRequiredEnv("R2_BUCKET"),
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type || "application/octet-stream",
    })
  );

  return buildR2PublicUrl(key);
}

export async function deleteR2ObjectFromUrl(url: string) {
  const key = getR2ObjectKeyFromUrl(url);

  if (!key) {
    return;
  }

  const client = getR2Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: getRequiredEnv("R2_BUCKET"),
      Key: key,
    })
  );
}