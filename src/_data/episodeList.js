/**
 * Derived view of `episodes` for the homepage: the featured episode and the
 * remainder, split once here so templates don't re-derive it.
 *
 * Why this exists rather than an inline filter: Nunjucks' `slice` splits an
 * array into N chunks (it is not Array.prototype.slice), so `episodes|slice(1)`
 * yields the whole list back and the featured episode renders twice.
 */
import episodes from "./episodes.js";

export default {
  latest: episodes[0],
  rest: episodes.slice(1),
};
