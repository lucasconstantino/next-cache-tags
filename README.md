<div align="center">

# Next.js Cache Tags

Active ISR revalidation based on surrogate keys for Next.js

[![NPM version](https://badge.fury.io/js/next-cache-tags.svg)](https://badge.fury.io/js/next-cache-tags) [![Test Coverage](https://api.codeclimate.com/v1/badges/24784ad6c2db3229d036/test_coverage)](https://codeclimate.com/github/lucasconstantino/next-cache-tags/test_coverage) [![Maintainability](https://api.codeclimate.com/v1/badges/24784ad6c2db3229d036/maintainability)](https://codeclimate.com/github/lucasconstantino/next-cache-tags/maintainability)

</div>

## Motivation & Background

This library intends to simplify the adoption of a caching and active invalidation strategy meant for applications that have constant updates to non-personalized data/content.

<details>
  <summary>Read more</summary>

---

Caching is a must for any serious application. Processing outcomes every time they are requested is not only a waste of resources that can lead to insane costs once user bases grow, it also damages the user experience: poor performance, instability, unreliability, and so on. On the context of web applications, this problem is even bigger as we entirely rely on client/server communication.

Vercel's Next.js is heavily dependent and encouraging of caching. Don't be mistaken: caching doesn't mean you need headers, CDNs, etc: statically built web pages that are served as is, with no further server processing, are perhaps the most aggressive form of caching we have today – and Next.js is a master at it. Anything it can transform into static files, it will.

But, any sort of caching has a huge drawback: it utterly kills dynamicity.

### ♻️ Cache renewal

The only way to overcome the dynamicity loss, is to renew the cache. Putting it simple, it generally means _removing_ a cache so that further requests for that piece of information get dynamically created by the server from scratch – and eventually cached once again. But there are many competing terms and strategies here, so let's bring some clarity:

- **Purge**: means _remove_ or _delete_. Upon a subsequent request, there is simply no cache and the system will naturally hit the server for a fresh data.
- **Invalidate**: means _marking_ the cache as outdated. Upon a subsequent request, there are three usual response behaviors depending on the consumer system needs:
  - Renew: the request goes through, acting like if no cache was there.
  - Stale: the cache is returned, acting like if the cache was valid still.
  - Stale while revalidate: the cached value is returned, but a parallel process goes through to the server, ensuring the cache is eventually renewed for posterior requests.
- **Revalidate**: means actively _recreating_ a cache, even if no consumer requested the data. This is a common strategy on backend in general, when it populates a cache system – often using a Redis store – so that the computed information is promptly available for further operations that may need it.

### ⚡ Fast vs. Fresh 🌱

We want ([and need](https://www.portent.com/blog/analytics/research-site-speed-hurting-everyones-revenue.htm)) websites to be _fast_. As immediate as possible. But, we also want (and need) websites to be _fresh_: outdated content being shown can cause confusion, bugs, and even direct conversion losses. Caching heavily, but renewing the cache immediately when information changes, is the solution; but it isn't an easy one to achieve.

The problem can be narrowed down to this:

> How can one ensure the most amount of **cache hits** possible, while also ensuring the delivery of the **latest available data** possible?

You have probably heard this quote before:

<blockquote>
  <p>There are only two hard things in Computer Science: cache invalidation and naming things.</p>
  –– <cite>Phil Karlton</cite>
</blockquote>

This quote might be controversial, but it summarizes well how much software engineers see this problem's complexity as a consensus.

### ♜ Strategies

There are infinite ways to be smart about the invalidation problem. Different strategies for both caching and for invalidation. Their core concept will usually be: _some data changed on the data store, thus the cache must be renewed_. We'll cover a couple of common options supported by Next.js

#### 1. Static Pages

Next.js will [_always_](https://nextjs.org/docs/advanced-features/automatic-static-optimization) try to prerender pages on build time, and leave them be. On this strategy, the only way to update the pages is by triggering a new build – which is completely fine for small websites, but terrifying when you have thousands of pages based on content that can change regularly.

#### 2. Expiration Time

The easist way possible is also the most widely used one: invalidating the cache on a fixed interval. This is what we know as Time to Live (TTL).

In Next.js, there are two main ways to implement TTL cache:

##### A) `Cache-Control` header:

Either set via [`headers`](https://nextjs.org/docs/api-reference/next.config.js/headers) config on `next.config.js`, or via `res.setHeader` on SSR pages, API Routes, and middlewares.

##### B) `revalidate` on `getStaticProps`:

The [`revalidate`](https://nextjs.org/docs/api-reference/data-fetching/get-static-props#revalidate) return property from `getStaticProps` functions determine the amount in seconds after which the page will be re-generated. That's generally a great solution for data that doesn't change often, such as blog pages, etc.

> Keep in mind that this setting works using `stale-while-revalidate`, meaning that past the number of seconds set here, the first request will _trigger_ a rebuild, while still returning the stale output. Only subsequent requests will benefit from the revalidation.

#### 3. On-demand Revalidation

Since Next.js 12.1 [introduced on-demand Incremental Static Regeneration](https://nextjs.org/blog/next-12-1#on-demand-incremental-static-regeneration-beta), it's now possible to actively rebuild prerendered pages. This is done using the `res.revalidate` method inside API Route handlers. Usually, this means that your data store – a CMS, for instance – will dispatch a request to an API Route in your system (aka a "webhook"), sending as payload some information about the change made to the data, and your API Route will trigger a rebuild to any page that may have being affected by that change.

## The problem

Definiting the exact pages that need rebuild upon specific data changes is a pretty complex thing to do. When you have an ecommerce, for instance, it might be very hard to determine that a product page should be rebuild when the product's price gets updated on your store, but what about other pages where this product might also be shown, such as listing pages, or even other product pages in a "related product" session?

## The solution

Although there are many ways to tackle this kind of problem, one of them has being widely adopted by CDNs and caching layers such as reverse proxies: tagging the cached resource with tags that identify the source data used to generate the cache. Basically, the idea consists of creating a map of tags to cached resources, so that if some data changes, we can resolve which tags were affected, and thus renew every single cached item that was originally generated using that specific data.

The following table showcases a map of cached resources (in our case, pages identified by their pathnames) and the tags used for each resource:

- Given that there are 3 products in the system,
- Given that "Product One" is related to "Product Two"
- Given that all products are listed in the home-page

| Resource\Tag     | `products` | `product:1` | `product:2` | `product:3` | `home` |
| ---------------- | ---------- | ----------- | ----------- | ----------- | ------ |
| `/product-one`   | ✅         | ✅          | ✅          | ❌          | ❌     |
| `/product-two`   | ✅         | ✅          | ✅          | ❌          | ❌     |
| `/product-three` | ✅         | ❌          | ❌          | ✅          | ❌     |
| `/`              | ✅         | ✅          | ✅          | ✅          | ✅     |

- Invalidating `product:1` tag would re-render pages `/product-one`, `/product-two`, and `/`
- Invalidating `product:2` tag would re-render pages `/product-one`, `/product-two`, and `/`
- Invalidating `product:3` tag would re-render pages `/product-three` and `/`
- Invalidating `products` would re-render all pages
- Invalidating `home` tag would re-render page `/` only

> [Fastly](https://docs.fastly.com/en/guides/working-with-surrogate-keys) has a CDN well know for early supporting this technique for invalidation, and is a great source for understanding the concepts around it. While other CDNs do support it, some have being way behind in this matter for ages, such as AWS's CloudFront. In fact, [Varnish Cache](http://varnish-cache.org/) (not a scam! just an ugly website...) open-source project was perhaps the first to provide such feature, and Fastly being build on top of it is what brings it to that CDN.

## This library

`next-cache-tags` introduces a way to use the same strategy, but instead of depending on a reverse-proxy/CDN, it achieves that by using Next.js ISR to re-render pages statically upon data changes.

This library provides a [Redis](./src/lib/registry/redis.ts) based data-source, but you can create any other adaptor so long as it implements [`CacheTagsRegistry`](./src/lib/registry/type.ts) interface.

</details>

---

## Getting Started

### 1. Install

```shell
yarn add next-cache-tags redis
```

> In case you intend to create your own data-source, you don't need to install `redis`.

### 2. Instantiate a client

```ts
// /src/lib/cache-tags.ts

import { CacheTags, RedisCacheTagsRegistry } from 'next-cache-tags'

export const cacheTags = new CacheTags({
  registry: new RedisCacheTagsRegistry({
    url: process.env.CACHE_TAGS_REDIS_URL
  })
})
```

### 3. Tag pages

On any page that implements `getStaticProps`, register the page with cache tags. Usually, those tags will be related to the page's content – such as a product page and related products:

```ts
// /src/pages/product/[id].tsx

import { cacheTags } from '../../lib/cache-tags'

type Product = {
  id: string
  name: string
  relatedProducts: string[]
}

export const getStaticProps = async (ctx) => {
  const product: Product = await loadProduct(ctx.param.id)
  const relatedProducts: Product[] = await loadProducts(product.relatedProducts)

  const ids = [product.id, ...product.relatedProducts]
  const tags = ids.map(id => `product:${id}`)
  
  cacheTags.register(ctx, tags)

  return { props: { product, relatedProducts } }
}
```

### 4. Create an invalidator

Upon content updates, usually through webhooks, an API Route should be executed and should process the tags to invalidate.

`next-cache-tags` provides a factory to create tag invalidation API Routes with ease:

```ts
// /src/pages/api/webhook.ts

import { cacheTags } from '../../lib/cache-tags'

export default cacheTags.invalidator({
  resolver: (req) => [req.body.product.id],
})
```

The `resolve` configuration is a function that receives the original request, and should resolve to the list of cache-tags to be invalidated.

Alternatively, you can execute such invalidations manually in any API Route:

```ts
// /src/pages/api/webhook.ts

import { cacheTags } from '../../lib/cache-tags'

const handler = (req, res) => {
  const tags = [req.body.product.id]

  // Dispatch revalidation processes.
  cacheTags.invalidate(res, tags)

  // ...do any other API Route logic
}

export default handler
```

## Example

Checkout the [./examples/redis](./examples/redis/) project for a complete, yet simple, use case. This project is deployed [here](https://next-cache-tags-redis-example.vercel.app/alphabet).

## Future vision

I expect that eventually Next.js will provide an API for tagging pages. As of data-source for the cache-tags registry, it could the same storage where it stores rendered pages (S3 bucket? Probably...). Alternatively, it could integrate with [Edge Config](https://vercel.com/docs/concepts/edge-network/edge-config) for ultimate availability and performance on writting/reading from the cache-tags registry.

I can imagine that this could become as simple as adding an extra property to the returned object from `getStaticProps`. Something on these lines:

```ts
// /src/pages/products.tsx

export const getStaticProps = async () => {
  const products = await loadProducts()
  const tags = products.map(product => product.id)

  return {
    tags,
    props: {
      products
    }
  }
}
```

