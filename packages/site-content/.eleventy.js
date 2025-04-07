import eleventyNavigationPlugin from '@11ty/eleventy-navigation';

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(eleventyNavigationPlugin);

  return {
    dir: {
      input: 'site',
      output: 'out',
    },
  };
}
