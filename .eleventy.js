/**
 * Eleventy config.
 *
 * Why Eleventy and not Jekyll (the Pages default): the episode pages (#2) are
 * generated from AI-drafted markdown (#3), which needs a real build step, and
 * Jekyll requires Ruby >= 3.0 that this project's machines don't have. See the
 * decision table on issue #1.
 *
 * Input lives in src/, output in _site/ (gitignored — Actions builds it).
 */
export default function (eleventyConfig) {
  // Static assets pass through untouched; the design is hand-authored CSS.
  eleventyConfig.addPassthroughCopy("src/assets");
  // Custom domain: rename src/CNAME.example -> src/CNAME and uncomment the line
  // below AFTER the DNS records exist. Publishing a CNAME before DNS resolves
  // makes Pages claim the domain and serves nothing at either URL. See README.
  // eleventyConfig.addPassthroughCopy({ "src/CNAME": "CNAME" });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
