module.exports = function(eleventyConfig) {
  // Copy JS files to root of dist (so existing script src="main.js?v=13" links work)
  eleventyConfig.addPassthroughCopy({ 'src/js/main.js': 'main.js' });
  eleventyConfig.addPassthroughCopy({ 'src/js/blog.js': 'blog.js' });

  // Copy images to dist/img/
  eleventyConfig.addPassthroughCopy({ 'src/img': 'img' });

  // Copy root-level config files
  eleventyConfig.addPassthroughCopy({ '_headers': '_headers' });
  eleventyConfig.addPassthroughCopy({ 'robots.txt': 'robots.txt' });
  eleventyConfig.addPassthroughCopy({ 'sitemap.xml': 'sitemap.xml' });

  return {
    dir: {
      input: 'src',
      output: 'dist',
      includes: '_includes',
      data: '_data'
    },
    templateFormats: ['njk', 'md'],
    htmlTemplateEngine: 'njk'
  };
};
