import * as core   from '@actions/core';
import * as github from '@actions/github';
import * as tc     from '@actions/tool-cache';
import * as cache  from '@actions/cache';
import * as path   from 'node:path';

const OWNER = 'MTrop';
const REPO = 'DoomTools';

async function getRelease(version) {
  const token = core.getInput('token');
  const octokit = github.getOctokit(token);

  if (version === 'latest') {
    const { data } = await octokit.rest.repos.getLatestRelease({
      owner: OWNER,
      repo: REPO,
    });

    return data;
  }

  const tag = `${version.replaceAll('-', '.')}-RELEASE`;

  const { data } = await octokit.rest.repos.getReleaseByTag({
    owner: OWNER,
    repo: REPO,
    tag,
  });

  return data;
}

function getAsset(release, distribution) {
  const prefix = `doomtools-${distribution}-`;
  const asset = release.assets.find(asset => asset.name.startsWith(prefix));

  if (!asset) {
    throw new Error(`No ${distribution} distribution found in ${release.tag_name}`);
  }

  return asset;
}

async function installTool(release, distribution) {
  const asset = getAsset(release, distribution);

  const toolName = `doomtools-${distribution}`;
  const toolVersion = release.tag_name;
  const arch = process.arch;

  const toolPath = path.join(
    process.env.RUNNER_TOOL_CACHE,
    toolName,
    toolVersion,
  );

  let installation = tc.find(toolName, toolVersion);

  if (installation) {
    return installation;
  }

  const cacheKey = [
    'doomtools',
    process.platform,
    arch,
    toolVersion,
    distribution,
  ].join('-');

  const restored = await cache.restoreCache([toolPath], cacheKey);

  installation = tc.find(toolName, toolVersion);

  if (!installation) {
    core.info(`Downloading ${asset.name}...`);

    const archive = await tc.downloadTool(asset.browser_download_url);

    let extracted;
    if (asset.name.endsWith('.zip')) {
      extracted = await tc.extractZip(archive);
    } else if (asset.name.endsWith('.tar.gz') || asset.name.endsWith('.tgz')) {
      extracted = await tc.extractTar(archive);
    } else {
      throw new Error(`Unsupported archive format: ${asset.name}`);
    }

    installation = await tc.cacheDir(
      extracted,
      toolName,
      toolVersion
    );
  }

  if (!restored) {
    await cache.saveCache([toolPath], cacheKey);
  }

  return installation;
}

async function run() {
  const version = core.getInput('version');
  let distribution = core.getInput('distribution');

  if (version !== 'latest' && !/^\d{4}-\d{2}-\d{2}$/.test(version)) {
     throw new Error(`Invalid version: ${version}. Expected YYYY-MM-DD or latest.`);
  }

  if (!['bash', 'cmd', 'auto'].includes(distribution)) {
    throw new Error(`Invalid distribution: ${distribution}. Expected one of 'bash', 'cmd', or 'auto'`);
  }

  if (distribution === 'auto') {
    distribution = process.platform === 'win32' ? 'cmd' : 'bash';
  }

  const release = await getRelease(version);
  const toolPath = await installTool(release, distribution);

  core.addPath(toolPath);

  core.setOutput('version', release.tag_name);
  core.setOutput('distribution', distribution);

  core.info(`Successfully installed DoomTools ${release.tag_name}`);

}

run().catch(core.setFailed);
