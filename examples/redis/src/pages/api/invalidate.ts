import { cacheTags } from '~/lib/cache-tags'

/**
 * Resolves tags to invalidate from "tag" query param.
 */
export default cacheTags.invalidator({
  wait: true,
  resolver: (req) => [req.query.tag as string],
})
