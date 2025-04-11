import eleventyNavigationPlugin from '@11ty/eleventy-navigation';
import syntaxHighlight from '@11ty/eleventy-plugin-syntaxhighlight';
import slugify from '@sindresorhus/slugify';
import markdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItAttrs from 'markdown-it-attrs';
import * as fs from 'node:fs';
import * as pathlib from 'node:path';
import {fileURLToPath} from 'node:url';

export default function (eleventyConfig) {
  eleventyConfig.setLibrary(
    'md',
    markdownIt({html: true, breaks: false, linkify: true})
      .use(markdownItAnchor, {
        permalink: markdownItAnchor.permalink.headerLink(),
        slugify,
      })
      .use(markdownItAttrs),
  );

  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  eleventyConfig.addPlugin(syntaxHighlight);

  eleventyConfig.addPassthroughCopy('site/*.css');
  eleventyConfig.addPassthroughCopy('site/*.svg');

  const openPropsPath = fileURLToPath(import.meta.resolve('open-props/style'));
  symlinkForce(openPropsPath, 'out/open-props/open-props.min.css');

  symlinkForce(
    fileURLToPath(import.meta.resolve('open-props/normalize')),
    'out/open-props/normalize.min.css',
  );

  return {
    dir: {
      input: 'site',
      output: 'out',
    },
  };
}

function symlinkForce(target, path) {
  try {
    // Delete existing symlinks so that if we use Eleventy's built-in watch mode
    // (which doesn't clean output first), we won't get an error because the
    // symlink already exists.
    fs.unlinkSync(path);
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e;
    }
  }
  // Create parent directories because Eleventy doesn't create the output
  // directory before invoking the config function, and also in case we want a
  // symlink in a child directory.
  fs.mkdirSync(pathlib.dirname(path), {recursive: true});
  fs.symlinkSync(target, path);
}
