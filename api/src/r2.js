import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function r2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
  });
}

export async function getPresignedPut(key, contentType) {
  const client = r2Client();
  const cmd = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET || 'newera',
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, cmd, { expiresIn: 600 });
}

export function publicUrlFor(key) {
  return `${process.env.R2_PUBLIC_URL || 'https://img.yourdomain.com'}/${key}`;
}
