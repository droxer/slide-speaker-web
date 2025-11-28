const buildRevision =
  process.env.NEXT_PUBLIC_ASSET_REVISION ??
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.NEXT_BUILD_ID ??
  process.env.BUILD_ID ??
  `${Date.now()}`;

export const withAssetRevision = (path: string): string => {
  if (!buildRevision) {
    return path;
  }

  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}v=${buildRevision}`;
};

export const ASSET_REVISION = buildRevision;
