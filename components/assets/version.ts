// What the next version can be: the first asset is v1.0, then a major starts a
// new line (v3.0 after v2.2) and a minor adds to the latest major (v2.3)
export type NextVersion = {
  latest: string | null;
  major: string;
  minor: string | null;
};

const parse = (version: string) => {
  const [major, minor] = version.slice(1).split(".").map(Number);
  return { major, minor };
};

export const getNextVersion = (versionList: string[]): NextVersion => {
  if (versionList.length === 0)
    return { latest: null, major: "v1.0", minor: null };

  const latest = versionList
    .map(parse)
    .reduce((a, b) =>
      b.major > a.major || (b.major === a.major && b.minor > a.minor) ? b : a,
    );

  return {
    latest: `v${latest.major}.${latest.minor}`,
    major: `v${latest.major + 1}.0`,
    minor: `v${latest.major}.${latest.minor + 1}`,
  };
};
